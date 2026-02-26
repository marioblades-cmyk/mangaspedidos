import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function splitTituloTomo(fullTitle: string): { titulo: string; tomo: string } {
  const match = fullTitle.match(/^(.+?)\s+(\d+)$/);
  if (match) return { titulo: match[1].trim(), tomo: match[2] };
  return { titulo: fullTitle.trim(), tomo: "" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = user.id;

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });

    const junkPatterns = [/por favor completar/i, /^\s*$/, /^nota/i, /^importante/i, /^aviso/i];
    const isJunkRow = (row: any): boolean => {
      if (!row) return true;
      const values = Object.values(row).filter(v => v !== null && v !== undefined);
      if (values.length === 0) return true;
      const firstVal = String(values[0] || "").trim();
      return junkPatterns.some(p => p.test(firstVal));
    };

    interface CatalogItem {
      titulo: string;
      tomo: string;
      isbn: string;
      editorial: string;
      precio_costo_ars: number | null;
      identificador_unico: string;
    }

    const allItems: CatalogItem[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const editorial = sheetName.trim();

      for (const row of rows) {
        if (isJunkRow(row)) continue;

        const keys = Object.keys(row);
        const findCol = (patterns: string[]) => {
          for (const p of patterns) {
            const found = keys.find(k => k.toLowerCase().includes(p.toLowerCase()));
            if (found) return String(row[found] || "").trim();
          }
          return "";
        };

        const rawName = findCol(["nombre", "titulo", "título", "producto", "descripcion", "descripción", "manga"]);
        if (!rawName) continue;

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

        const tomoCol = findCol(["tomo", "vol", "volumen", "nro", "numero", "número", "#"]);
        let fullTitle = tomoCol && !rawName.includes(tomoCol) ? `${rawName} ${tomoCol}` : rawName;
        const { titulo, tomo } = splitTituloTomo(fullTitle);

        const identificador = isbn || `${titulo} ${tomo}`.trim();

        allItems.push({
          titulo,
          tomo: tomo || tomoCol,
          isbn,
          editorial: finalEditorial,
          precio_costo_ars: precio,
          identificador_unico: identificador,
        });
      }
    }

    if (allItems.length === 0) {
      return new Response(JSON.stringify({ error: "No se encontraron productos válidos en el archivo" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get existing catalog
    const { data: existing } = await supabase
      .from("catalog_products")
      .select("id, identificador_unico, estado")
      .eq("user_id", userId);

    const existingMap = new Map((existing || []).map(e => [e.identificador_unico, e]));
    const newIdentifiers = new Set(allItems.map(i => i.identificador_unico));
    const now = new Date().toISOString();

    // Mark disappeared
    const disappeared: string[] = [];
    for (const [ident, item] of existingMap) {
      if (!newIdentifiers.has(ident) && item.estado !== "Fuera de Catálogo") {
        disappeared.push(ident);
      }
    }

    if (disappeared.length > 0) {
      for (let i = 0; i < disappeared.length; i += 100) {
        await supabase
          .from("catalog_products")
          .update({ estado: "Fuera de Catálogo", updated_at: now })
          .eq("user_id", userId)
          .in("identificador_unico", disappeared.slice(i, i + 100));
      }
    }

    // Upsert current items
    let inserted = 0, updated = 0, recovered = 0;

    for (let i = 0; i < allItems.length; i += 100) {
      const batch = allItems.slice(i, i + 100).map(item => ({
        ...item,
        user_id: userId,
        estado: "Disponible",
        last_seen_at: now,
        updated_at: now,
      }));

      const { error: upsertError } = await supabase
        .from("catalog_products")
        .upsert(batch, { onConflict: "user_id,identificador_unico" });

      if (upsertError) { console.error("Upsert error:", upsertError); continue; }

      for (const item of allItems.slice(i, i + 100)) {
        const ex = existingMap.get(item.identificador_unico);
        if (!ex) inserted++;
        else if (ex.estado === "Fuera de Catálogo") recovered++;
        else updated++;
      }
    }

    // Get disappeared titles for alert
    let desaparecidos_titulos: string[] = [];
    if (disappeared.length > 0) {
      const { data: dItems } = await supabase
        .from("catalog_products")
        .select("titulo, tomo")
        .eq("user_id", userId)
        .in("identificador_unico", disappeared.slice(0, 50));
      desaparecidos_titulos = (dItems || []).map(d => d.tomo ? `${d.titulo} ${d.tomo}` : d.titulo);
    }

    return new Response(JSON.stringify({
      total_procesados: allItems.length,
      nuevos: inserted,
      actualizados: updated,
      recuperados: recovered,
      desaparecidos: disappeared.length,
      desaparecidos_titulos,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Error processing Excel:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
