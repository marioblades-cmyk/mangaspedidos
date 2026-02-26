import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ParsedProduct {
  titulo: string;
  tomo: string;
  editorial: string;
  isbn: string;
  precio_costo_ars: number | null;
  estado_publicacion: string;
  identificador_unico: string;
}

function parseSheet(sheet: XLSX.WorkSheet, editorial: string): { products: ParsedProduct[]; errors: string[] } {
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
  const dataRows = rows.slice(8);
  let currentCategory = "En curso";
  const products: ParsedProduct[] = [];
  const errors: string[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    try {
      const row = dataRows[i];
      const cellA = String(row[0] || "").trim();
      if (!cellA) continue;
      const upper = cellA.toUpperCase();

      if (upper.includes("MANGAS EN CURSO") || upper.includes("SERIES EN CURSO")) { currentCategory = "En curso"; continue; }
      if (upper.includes("MANGAS YA COMPLETOS") || upper.includes("SERIES COMPLETAS")) { currentCategory = "Completo"; continue; }
      if (upper.includes("TOMOS UNICOS") || upper.includes("TOMOS ÚNICOS")) { currentCategory = "Tomo Único"; continue; }
      if (upper.includes("NOVEDADES")) { currentCategory = "En curso"; continue; }
      if (upper.includes("REIMPRESIONES")) { currentCategory = "En curso"; continue; }
      if (upper.includes("COMICS")) { currentCategory = "Comic"; continue; }

      if (upper.includes("TITULO") || upper.includes("EAN") || upper.includes("PRECIO") ||
          upper.includes("CANTIDAD") || upper.includes("SUBTOTAL") || upper.includes("POR FAVOR") ||
          upper.includes("COMPLETAR") || upper.includes("REEDICIONES")) continue;

      const rawTitle = cellA;
      let isbn = "";
      const rawIsbn = row[1];
      if (typeof rawIsbn === "number") {
        isbn = Math.round(rawIsbn).toString();
      } else {
        isbn = String(rawIsbn || "").trim();
      }
      if (isbn.toUpperCase().includes("CONFIRMAR")) isbn = "Por confirmar";

      const priceRaw = row[2];
      let precio: number | null = null;
      if (typeof priceRaw === "number") {
        precio = priceRaw;
      } else {
        const cleaned = String(priceRaw || "").replace(/[$\s]/g, "").replace(/\./g, "").replace(",", ".");
        precio = parseFloat(cleaned) || null;
      }

      const tomoMatch = rawTitle.match(/^(.+?)\s+(\d+(?:\.\d+)?)$/);
      let titulo: string, tomo: string;
      if (tomoMatch) { titulo = tomoMatch[1].trim(); tomo = tomoMatch[2]; }
      else { titulo = rawTitle; tomo = ""; }

      const identificador_unico = isbn && isbn !== "Por confirmar" && isbn.length > 3
        ? isbn : `${titulo}|${tomo}`;

      products.push({ titulo, tomo, editorial, isbn, precio_costo_ars: precio, estado_publicacion: currentCategory, identificador_unico });
    } catch (e) {
      errors.push(`Fila ${i + 9}: ${e.message}`);
    }
  }
  return { products, errors };
}

const BATCH_SIZE = 500;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    console.log("Starting catalog import...");

    // Auth check with anon key
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");
    console.log("User:", user.id);

    // Use service role for fast bulk operations (bypasses RLS)
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file uploaded");
    console.log("File:", file.name, "size:", file.size);

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
    console.log("Sheets:", workbook.SheetNames.join(", "));

    const sheetName = workbook.SheetNames.find(
      (n: string) => n.toLowerCase().includes("ivrea")
    ) || workbook.SheetNames[0];

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      return new Response(JSON.stringify({ error: "No se encontró la pestaña Ivrea" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { products, errors: parseErrors } = parseSheet(sheet, "Ivrea");
    console.log("Parsed:", products.length, "products");

    // Free workbook memory
    for (const s of workbook.SheetNames) workbook.Sheets[s] = undefined as any;

    if (products.length === 0) {
      return new Response(JSON.stringify({ error: "No se encontraron productos", errors: parseErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch ALL existing products for this user (paginated)
    const existingMap = new Map<string, { id: number; isbn: string; estado: string }>();
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from("catalog_products")
        .select("id, identificador_unico, isbn, estado")
        .eq("user_id", user.id)
        .range(from, from + 999);
      if (error) { console.log("Fetch error:", error.message); break; }
      if (!data || data.length === 0) break;
      data.forEach((e: any) => existingMap.set(e.identificador_unico, e));
      if (data.length < 1000) break;
      from += 1000;
    }
    console.log("Existing products:", existingMap.size);

  const now = new Date().toISOString();
    const newProductIds = new Set<string>();
    const toInsert: any[] = [];
    let updated = 0, isbnUpdated = 0;
    const updateErrors: string[] = [];

    // Detect duplicate ISBNs and reassign identificador_unico
    const isbnCount = new Map<string, number>();
    for (const p of products) {
      if (p.identificador_unico === p.isbn) {
        isbnCount.set(p.isbn, (isbnCount.get(p.isbn) || 0) + 1);
      }
    }
    for (const p of products) {
      if (p.identificador_unico === p.isbn && (isbnCount.get(p.isbn) || 0) > 1) {
        p.identificador_unico = `${p.titulo}|${p.tomo}`;
      }
    }
    console.log("Duplicate ISBNs reassigned:", [...isbnCount.entries()].filter(([,c]) => c > 1).length);

    // Separate new vs existing
    for (const p of products) {
      newProductIds.add(p.identificador_unico);
      const ex = existingMap.get(p.identificador_unico);
      if (!ex) {
        toInsert.push({
          titulo: p.titulo, tomo: p.tomo, editorial: p.editorial, isbn: p.isbn,
          precio_costo_ars: p.precio_costo_ars, estado: "Disponible",
          estado_publicacion: p.estado_publicacion, identificador_unico: p.identificador_unico,
          user_id: user.id, last_seen_at: now,
        });
      }
    }

    // BATCH INSERT new products (very fast - one call per 500)
    let inserted = 0;
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from("catalog_products").insert(batch);
      if (error) {
        updateErrors.push(`Insert batch ${i}: ${error.message}`);
        console.log("Insert error at", i, error.message);
      } else {
        inserted += batch.length;
      }
    }
    console.log("Inserted:", inserted);

    // BATCH UPDATE existing products using a single bulk update approach
    // Group existing products that appear in the new import
    const idsToMarkAvailable: number[] = [];
    for (const p of products) {
      const ex = existingMap.get(p.identificador_unico);
      if (ex) {
        idsToMarkAvailable.push(ex.id);
      }
    }

    // Bulk update all existing-and-still-present to "Disponible" + new timestamp
    for (let i = 0; i < idsToMarkAvailable.length; i += BATCH_SIZE) {
      const batch = idsToMarkAvailable.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from("catalog_products")
        .update({ estado: "Disponible", last_seen_at: now, updated_at: now })
        .in("id", batch);
      if (error) updateErrors.push(`Update available batch: ${error.message}`);
      else updated += batch.length;
    }
    console.log("Updated available:", updated);

    // Mark disappeared
    const disappearedIds: number[] = [];
    for (const [uid, ex] of existingMap) {
      if (!newProductIds.has(uid) && ex.estado !== "No figura en el catálogo actual") {
        disappearedIds.push(ex.id);
      }
    }
    for (let i = 0; i < disappearedIds.length; i += BATCH_SIZE) {
      const batch = disappearedIds.slice(i, i + BATCH_SIZE);
      await supabase.from("catalog_products")
        .update({ estado: "No figura en el catálogo actual", updated_at: now })
        .in("id", batch);
    }
    console.log("Disappeared:", disappearedIds.length);

    // Count reappeared
    let reappeared = 0;
    for (const [uid, ex] of existingMap) {
      if (newProductIds.has(uid) && ex.estado === "No figura en el catálogo actual") reappeared++;
    }

    const allErrors = [...parseErrors, ...updateErrors];
    console.log("Done! Inserted:", inserted, "Updated:", updated, "Disappeared:", disappearedIds.length);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: products.length,
          inserted,
          updated,
          isbnUpdated,
          disappeared: disappearedIds.length,
          reappeared,
          sheets: [sheetName],
          errorCount: allErrors.length,
          errors: allErrors.slice(0, 50),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.log("Fatal error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
