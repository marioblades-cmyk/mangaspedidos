import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file uploaded");

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });

    // Find Ivrea sheet (case-insensitive)
    const sheetName = workbook.SheetNames.find(
      (n: string) => n.toLowerCase().includes("ivrea")
    ) || workbook.SheetNames[0];

    const sheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    // Skip first 8 rows (safety skip)
    const dataRows = rows.slice(8);

    let currentCategory = "En curso";
    const products: {
      titulo: string;
      tomo: string;
      editorial: string;
      isbn: string;
      precio_costo_ars: number | null;
      estado_publicacion: string;
      identificador_unico: string;
    }[] = [];

    for (const row of dataRows) {
      const cellA = String(row[0] || "").trim();
      const upper = cellA.toUpperCase();

      // Category detection
      if (upper.includes("SERIES EN CURSO")) { currentCategory = "En curso"; continue; }
      if (upper.includes("SERIES COMPLETAS")) { currentCategory = "Completo"; continue; }
      if (upper.includes("TOMOS UNICOS") || upper.includes("TOMOS ÚNICOS")) { currentCategory = "Tomo Único"; continue; }

      // Skip empty rows or header-like rows
      if (!cellA || upper.includes("TITULO") || upper.includes("ISBN") || upper.includes("PRECIO")) continue;

      // Parse row: A=title, B=ISBN/EAN, C=price (common Entelequia format)
      const rawTitle = cellA;
      const isbn = String(row[1] || "").trim();
      const priceRaw = row[2];
      const precio = typeof priceRaw === "number" ? priceRaw : parseFloat(String(priceRaw).replace(/[^0-9.,]/g, "").replace(",", ".")) || null;

      // Separate title and tomo: detect trailing number(s)
      const tomoMatch = rawTitle.match(/^(.+?)\s+(\d+(?:\.\d+)?)$/);
      let titulo: string;
      let tomo: string;
      if (tomoMatch) {
        titulo = tomoMatch[1].trim();
        tomo = tomoMatch[2];
      } else {
        titulo = rawTitle;
        tomo = "";
      }

      const identificador_unico = isbn && isbn !== "Por confirmar" && isbn.length > 3
        ? isbn
        : `${titulo}|${tomo}`;

      products.push({
        titulo,
        tomo,
        editorial: "Ivrea",
        isbn,
        precio_costo_ars: precio,
        estado_publicacion: currentCategory,
        identificador_unico,
      });
    }

    if (products.length === 0) {
      return new Response(JSON.stringify({ error: "No se encontraron productos en el Excel" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get existing products for this user
    const { data: existing } = await supabase
      .from("catalog_products")
      .select("id, identificador_unico, isbn, estado")
      .eq("user_id", user.id);

    const existingMap = new Map<string, any>();
    (existing || []).forEach((e: any) => existingMap.set(e.identificador_unico, e));

    const now = new Date().toISOString();
    const newProductIds = new Set<string>();
    let inserted = 0, updated = 0, isbnUpdated = 0;

    for (const p of products) {
      newProductIds.add(p.identificador_unico);
      const ex = existingMap.get(p.identificador_unico);

      if (ex) {
        // Update existing: sync ISBN if was "Por confirmar", update price, presence, publication status
        const updateData: any = {
          precio_costo_ars: p.precio_costo_ars,
          estado: "Disponible",
          estado_publicacion: p.estado_publicacion,
          last_seen_at: now,
          updated_at: now,
        };

        if ((ex.isbn === "Por confirmar" || !ex.isbn) && p.isbn && p.isbn !== "Por confirmar") {
          updateData.isbn = p.isbn;
          // If ISBN-based, update identificador_unico too
          if (p.isbn.length > 3) {
            updateData.identificador_unico = p.isbn;
          }
          isbnUpdated++;
        }

        await supabase.from("catalog_products").update(updateData).eq("id", ex.id);
        updated++;
      } else {
        // Insert new
        await supabase.from("catalog_products").insert({
          titulo: p.titulo,
          tomo: p.tomo,
          editorial: p.editorial,
          isbn: p.isbn,
          precio_costo_ars: p.precio_costo_ars,
          estado: "Disponible",
          estado_publicacion: p.estado_publicacion,
          identificador_unico: p.identificador_unico,
          user_id: user.id,
          last_seen_at: now,
        });
        inserted++;
      }
    }

    // Mark products NOT in this upload as "No figura en el catálogo actual"
    let disappeared = 0;
    for (const [uid, ex] of existingMap) {
      if (!newProductIds.has(uid) && ex.estado !== "No figura en el catálogo actual") {
        await supabase
          .from("catalog_products")
          .update({ estado: "No figura en el catálogo actual", updated_at: now })
          .eq("id", ex.id);
        disappeared++;
      }
    }

    // Count reappeared (were "No figura" but now back)
    let reappeared = 0;
    for (const [uid, ex] of existingMap) {
      if (newProductIds.has(uid) && ex.estado === "No figura en el catálogo actual") {
        reappeared++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: products.length,
          inserted,
          updated,
          isbnUpdated,
          disappeared,
          reappeared,
          sheet: sheetName,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
