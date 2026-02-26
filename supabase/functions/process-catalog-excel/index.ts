import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = user.id;

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });

    // Junk row patterns to ignore
    const junkPatterns = [
      /por favor completar/i,
      /^\s*$/,
      /^nota/i,
      /^importante/i,
      /^aviso/i,
    ];

    const isJunkRow = (row: any): boolean => {
      if (!row) return true;
      const values = Object.values(row).filter(v => v !== null && v !== undefined);
      if (values.length === 0) return true;
      const firstVal = String(values[0] || "").trim();
      return junkPatterns.some(p => p.test(firstVal));
    };

    // Process all sheets
    interface CatalogItem {
      titulo: string;
      isbn: string;
      editorial: string;
      precio_costo_ars: number | null;
      identificador_unico: string;
    }

    const allItems: CatalogItem[] = [];
    const now = new Date().toISOString();

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      // Determine editorial from sheet name or SELLO column
      const editorial = sheetName.trim();

      for (const row of rows) {
        if (isJunkRow(row)) continue;

        // Try to find columns flexibly (case insensitive)
        const keys = Object.keys(row);
        const findCol = (patterns: string[]) => {
          for (const p of patterns) {
            const found = keys.find(k => k.toLowerCase().includes(p.toLowerCase()));
            if (found) return String(row[found] || "").trim();
          }
          return "";
        };

        const titulo = findCol(["nombre", "titulo", "título", "producto", "descripcion", "descripción", "manga"]);
        if (!titulo) continue;

        let isbn = findCol(["isbn", "ean", "código", "codigo"]);
        if (isbn.toLowerCase().includes("confirmar") || isbn.toLowerCase().includes("a confirmar")) {
          isbn = "";
        }

        const sello = findCol(["sello", "editorial"]);
        const finalEditorial = sello || editorial;

        const precioStr = findCol(["precio", "costo", "p.v.p", "pvp", "p. final", "precio final"]);
        let precio: number | null = null;
        if (precioStr) {
          const cleaned = precioStr.replace(/[^0-9.,]/g, "").replace(",", ".");
          const parsed = parseFloat(cleaned);
          if (!isNaN(parsed)) precio = parsed;
        }

        // Build unique identifier: ISBN if available, else titulo
        const tomo = findCol(["tomo", "vol", "volumen", "nro", "numero", "número", "#"]);
        const identificador = isbn || `${titulo}${tomo ? ` ${tomo}` : ""}`.trim();
        const fullTitulo = tomo && !titulo.includes(tomo) ? `${titulo} ${tomo}` : titulo;

        allItems.push({
          titulo: fullTitulo,
          isbn,
          editorial: finalEditorial,
          precio_costo_ars: precio,
          identificador_unico: identificador,
        });
      }
    }

    if (allItems.length === 0) {
      return new Response(JSON.stringify({ error: "No se encontraron productos válidos en el archivo" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get existing catalog for this user
    const { data: existing } = await supabase
      .from("catalog_products")
      .select("id, identificador_unico, estado")
      .eq("user_id", userId);

    const existingMap = new Map((existing || []).map(e => [e.identificador_unico, e]));
    const newIdentifiers = new Set(allItems.map(i => i.identificador_unico));

    // 1. Mark disappeared items as "Fuera de Catálogo"
    const disappeared: string[] = [];
    for (const [ident, item] of existingMap) {
      if (!newIdentifiers.has(ident) && item.estado !== "Fuera de Catálogo") {
        disappeared.push(ident);
      }
    }

    if (disappeared.length > 0) {
      // Update in batches of 100
      for (let i = 0; i < disappeared.length; i += 100) {
        const batch = disappeared.slice(i, i + 100);
        await supabase
          .from("catalog_products")
          .update({ estado: "Fuera de Catálogo", updated_at: now })
          .eq("user_id", userId)
          .in("identificador_unico", batch);
      }
    }

    // 2. Upsert current items
    let inserted = 0;
    let updated = 0;
    let recovered = 0;

    for (let i = 0; i < allItems.length; i += 100) {
      const batch = allItems.slice(i, i + 100);
      const upsertData = batch.map(item => ({
        ...item,
        user_id: userId,
        estado: "Disponible",
        last_seen_at: now,
        updated_at: now,
      }));

      const { data: upserted, error: upsertError } = await supabase
        .from("catalog_products")
        .upsert(upsertData, { onConflict: "user_id,identificador_unico" })
        .select("id");

      if (upsertError) {
        console.error("Upsert error:", upsertError);
        continue;
      }

      for (const item of batch) {
        const ex = existingMap.get(item.identificador_unico);
        if (!ex) {
          inserted++;
        } else if (ex.estado === "Fuera de Catálogo") {
          recovered++;
        } else {
          updated++;
        }
      }
    }

    const summary = {
      total_procesados: allItems.length,
      nuevos: inserted,
      actualizados: updated,
      recuperados: recovered,
      desaparecidos: disappeared.length,
      desaparecidos_titulos: [] as string[],
    };

    // Get titles of disappeared items for the alert
    if (disappeared.length > 0) {
      const { data: disappearedItems } = await supabase
        .from("catalog_products")
        .select("titulo")
        .eq("user_id", userId)
        .in("identificador_unico", disappeared.slice(0, 50));
      summary.desaparecidos_titulos = (disappearedItems || []).map(d => d.titulo);
    }

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error processing Excel:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
