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

      // Category detection - match the actual Excel markers
      if (upper.includes("MANGAS EN CURSO") || upper.includes("SERIES EN CURSO")) { currentCategory = "En curso"; continue; }
      if (upper.includes("MANGAS YA COMPLETOS") || upper.includes("SERIES COMPLETAS")) { currentCategory = "Completo"; continue; }
      if (upper.includes("TOMOS UNICOS") || upper.includes("TOMOS ÚNICOS")) { currentCategory = "Tomo Único"; continue; }
      if (upper.includes("NOVEDADES")) { currentCategory = "En curso"; continue; }
      if (upper.includes("REIMPRESIONES")) { currentCategory = "En curso"; continue; }
      if (upper.includes("COMICS")) { currentCategory = "Comic"; continue; }

      // Skip header-like rows and non-data rows
      if (upper.includes("TITULO") || upper.includes("EAN") || upper.includes("PRECIO") ||
          upper.includes("CANTIDAD") || upper.includes("SUBTOTAL") || upper.includes("POR FAVOR") ||
          upper.includes("COMPLETAR") || upper.includes("REEDICIONES")) continue;

      const rawTitle = cellA;

      // Handle ISBN - could be scientific notation (9.79139E+12), "ISBN A CONFIRMAR", or normal
      let isbn = "";
      const rawIsbn = row[1];
      if (typeof rawIsbn === "number") {
        // Scientific notation number - convert to string ISBN
        isbn = Math.round(rawIsbn).toString();
      } else {
        isbn = String(rawIsbn || "").trim();
      }
      // Normalize "ISBN A CONFIRMAR" variants
      if (isbn.toUpperCase().includes("CONFIRMAR")) isbn = "Por confirmar";

      // Handle price - could be number or formatted string like "$ 25,500.00"
      const priceRaw = row[2];
      let precio: number | null = null;
      if (typeof priceRaw === "number") {
        precio = priceRaw;
      } else {
        const cleaned = String(priceRaw || "").replace(/[$\s]/g, "").replace(/\./g, "").replace(",", ".");
        precio = parseFloat(cleaned) || null;
      }

      // Separate title and tomo
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

const BATCH_SIZE = 100;

async function upsertBatch(
  supabase: any,
  userId: string,
  products: ParsedProduct[],
  existingMap: Map<string, any>,
  now: string
): Promise<{ inserted: number; updated: number; isbnUpdated: number; errors: string[] }> {
  let inserted = 0, updated = 0, isbnUpdated = 0;
  const errors: string[] = [];

  const toInsert: any[] = [];
  const toUpdate: { id: number; data: any }[] = [];

  for (const p of products) {
    try {
      const ex = existingMap.get(p.identificador_unico);
      if (ex) {
        const updateData: any = {
          precio_costo_ars: p.precio_costo_ars,
          estado: "Disponible",
          estado_publicacion: p.estado_publicacion,
          last_seen_at: now,
          updated_at: now,
        };
        if ((ex.isbn === "Por confirmar" || !ex.isbn) && p.isbn && p.isbn !== "Por confirmar") {
          updateData.isbn = p.isbn;
          if (p.isbn.length > 3) updateData.identificador_unico = p.isbn;
          isbnUpdated++;
        }
        toUpdate.push({ id: ex.id, data: updateData });
        updated++;
      } else {
        toInsert.push({
          titulo: p.titulo, tomo: p.tomo, editorial: p.editorial, isbn: p.isbn,
          precio_costo_ars: p.precio_costo_ars, estado: "Disponible",
          estado_publicacion: p.estado_publicacion, identificador_unico: p.identificador_unico,
          user_id: userId, last_seen_at: now,
        });
        inserted++;
      }
    } catch (e) {
      errors.push(`Producto "${p.titulo}": ${e.message}`);
    }
  }

  // Batch insert
  if (toInsert.length > 0) {
    const { error } = await supabase.from("catalog_products").insert(toInsert);
    if (error) errors.push(`Insert batch error: ${error.message}`);
  }

  // Updates must be done individually (different data per row)
  for (const u of toUpdate) {
    const { error } = await supabase.from("catalog_products").update(u.data).eq("id", u.id);
    if (error) errors.push(`Update id ${u.id}: ${error.message}`);
  }

  return { inserted, updated, isbnUpdated, errors };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    console.log("Starting catalog import...");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");
    console.log("User authenticated:", user.id);

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file uploaded");
    console.log("File received:", file.name, "size:", file.size);

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
    console.log("Workbook parsed, sheets:", workbook.SheetNames.join(", "));

    // Process ONLY Ivrea sheet
    const sheetName = workbook.SheetNames.find(
      (n: string) => n.toLowerCase().includes("ivrea")
    ) || workbook.SheetNames[0];

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      return new Response(JSON.stringify({ error: "No se encontró la pestaña Ivrea" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { products: allProducts, errors: allErrors } = parseSheet(sheet, "Ivrea");
    console.log("Parsed products:", allProducts.length, "errors:", allErrors.length);
    const sheetsProcessed = [sheetName];

    // Free memory
    workbook.Sheets[sheetName] = undefined as any;

    if (allProducts.length === 0) {
      return new Response(JSON.stringify({ error: "No se encontraron productos en el Excel", errors: allErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch existing products (handle >1000 rows)
    let existing: any[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from("catalog_products")
        .select("id, identificador_unico, isbn, estado")
        .eq("user_id", user.id)
        .range(from, from + 999);
      if (error) break;
      if (!data || data.length === 0) break;
      existing = existing.concat(data);
      if (data.length < 1000) break;
      from += 1000;
    }

    const existingMap = new Map<string, any>();
    existing.forEach((e: any) => existingMap.set(e.identificador_unico, e));

    const now = new Date().toISOString();
    const newProductIds = new Set<string>();
    allProducts.forEach(p => newProductIds.add(p.identificador_unico));

    let totalInserted = 0, totalUpdated = 0, totalIsbnUpdated = 0;

    // Process in batches of BATCH_SIZE
    for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
      const batch = allProducts.slice(i, i + BATCH_SIZE);
      const result = await upsertBatch(supabase, user.id, batch, existingMap, now);
      totalInserted += result.inserted;
      totalUpdated += result.updated;
      totalIsbnUpdated += result.isbnUpdated;
      allErrors.push(...result.errors);
    }

    // Mark disappeared
    let disappeared = 0;
    const disappearedIds: number[] = [];
    for (const [uid, ex] of existingMap) {
      if (!newProductIds.has(uid) && ex.estado !== "No figura en el catálogo actual") {
        disappearedIds.push(ex.id);
        disappeared++;
      }
    }
    // Batch update disappeared in groups of 100
    for (let i = 0; i < disappearedIds.length; i += BATCH_SIZE) {
      const batch = disappearedIds.slice(i, i + BATCH_SIZE);
      await supabase.from("catalog_products")
        .update({ estado: "No figura en el catálogo actual", updated_at: now })
        .in("id", batch);
    }

    // Count reappeared
    let reappeared = 0;
    for (const [uid, ex] of existingMap) {
      if (newProductIds.has(uid) && ex.estado === "No figura en el catálogo actual") reappeared++;
    }

    // Free memory
    allProducts = [];

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: totalInserted + totalUpdated,
          inserted: totalInserted,
          updated: totalUpdated,
          isbnUpdated: totalIsbnUpdated,
          disappeared,
          reappeared,
          sheets: sheetsProcessed,
          errorCount: allErrors.length,
          errors: allErrors.slice(0, 50), // Cap error log at 50
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
