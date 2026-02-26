import { useState, useMemo, useRef } from "react";
import { Upload, Search, Loader2, BookOpen, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/hooks/useCatalog";

export function CatalogView() {
  const { products, loading, uploading, uploadExcel } = useCatalog();
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterPub, setFilterPub] = useState("");
  const [summary, setSummary] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadExcel(file);
    if (result) setSummary(result);
    if (fileRef.current) fileRef.current.value = "";
  };

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !search ||
        p.titulo.toLowerCase().includes(search.toLowerCase()) ||
        p.tomo.toLowerCase().includes(search.toLowerCase()) ||
        p.isbn.toLowerCase().includes(search.toLowerCase());
      const matchEstado = !filterEstado || p.estado === filterEstado;
      const matchPub = !filterPub || p.estado_publicacion === filterPub;
      return matchSearch && matchEstado && matchPub;
    });
  }, [products, search, filterEstado, filterPub]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload & summary */}
      <div className="flex items-center gap-3 flex-wrap">
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleUpload} className="hidden" />
        <Button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Subir Excel
        </Button>
        <span className="text-xs text-muted-foreground">{products.length} productos en catálogo</span>
      </div>

      {summary && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" /> Resumen de importación (Pestaña: {summary.sheet})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-success/10 rounded-md p-2 text-center">
              <p className="text-success font-bold text-lg">{summary.inserted}</p>
              <p className="text-muted-foreground">Nuevos</p>
            </div>
            <div className="bg-primary/10 rounded-md p-2 text-center">
              <p className="text-primary font-bold text-lg">{summary.updated}</p>
              <p className="text-muted-foreground">Actualizados</p>
            </div>
            <div className="bg-warning/10 rounded-md p-2 text-center">
              <p className="text-warning font-bold text-lg">{summary.disappeared}</p>
              <p className="text-muted-foreground">Desaparecidos</p>
            </div>
            <div className="bg-info/10 rounded-md p-2 text-center">
              <p className="text-info font-bold text-lg">{summary.isbnUpdated}</p>
              <p className="text-muted-foreground">ISBN actualizados</p>
            </div>
          </div>
          {summary.reappeared > 0 && (
            <p className="text-xs text-success flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> {summary.reappeared} producto(s) reaparecidos en el catálogo
            </p>
          )}
          <button onClick={() => setSummary(null)} className="text-xs text-muted-foreground underline">Cerrar resumen</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar título, tomo o ISBN..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <select
          value={filterEstado}
          onChange={e => setFilterEstado(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer"
        >
          <option value="">Todas las presencias</option>
          <option value="Disponible">Disponible</option>
          <option value="No figura en el catálogo actual">No figura</option>
        </select>
        <select
          value={filterPub}
          onChange={e => setFilterPub(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer"
        >
          <option value="">Todos los estados</option>
          <option value="En curso">En curso</option>
          <option value="Completo">Completo</option>
          <option value="Tomo Único">Tomo Único</option>
        </select>
      </div>

      {/* Products table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/60 border-b border-border">
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Título</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Tomo</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Editorial</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">ISBN</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Precio ARS</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Publicación</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Presencia</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map(p => (
                <tr key={p.id} className={`border-b border-border/30 last:border-0 hover:bg-muted/20 ${p.estado !== "Disponible" ? "opacity-50" : ""}`}>
                  <td className="px-4 py-2 font-medium truncate max-w-[250px]">{p.titulo}</td>
                  <td className="px-3 py-2 text-xs tabular-nums">{p.tomo || "—"}</td>
                  <td className="px-3 py-2 text-xs">{p.editorial}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground font-mono">{p.isbn || "—"}</td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums">{p.precio_costo_ars != null ? `$${p.precio_costo_ars.toLocaleString()}` : "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      p.estado_publicacion === "En curso" ? "bg-info/10 text-info" :
                      p.estado_publicacion === "Completo" ? "bg-success/10 text-success" :
                      "bg-warning/10 text-warning"
                    }`}>
                      {p.estado_publicacion}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {p.estado === "Disponible" ? (
                      <span className="flex items-center gap-1 text-success text-xs"><CheckCircle className="h-3 w-3" /> Disponible</span>
                    ) : (
                      <span className="flex items-center gap-1 text-destructive text-xs"><XCircle className="h-3 w-3" /> No figura</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 200 && (
          <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground text-center">
            Mostrando 200 de {filtered.length} productos. Usa el buscador para filtrar.
          </div>
        )}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            {products.length === 0 ? "No hay productos en el catálogo. Sube un Excel para comenzar." : "No se encontraron productos con ese filtro."}
          </div>
        )}
      </div>
    </div>
  );
}
