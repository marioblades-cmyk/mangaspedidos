import { useState, useMemo, useRef } from "react";
import { Search, Upload, BookOpen, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCatalog } from "@/hooks/useCatalog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export function CatalogView() {
  const { products, loading, uploading, uploadExcel } = useCatalog();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "Disponible" | "Fuera de Catálogo">("");
  const [importResult, setImportResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !search ||
        p.titulo.toLowerCase().includes(search.toLowerCase()) ||
        p.isbn.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || p.estado === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [products, search, statusFilter]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadExcel(file);
    if (result) setImportResult(result);
    if (fileRef.current) fileRef.current.value = "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Import result alert */}
      {importResult && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Resumen de Importación</h3>
            <button onClick={() => setImportResult(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-muted rounded-md p-2 text-center">
              <div className="font-bold text-foreground">{importResult.nuevos}</div>
              <div className="text-muted-foreground">Nuevos</div>
            </div>
            <div className="bg-muted rounded-md p-2 text-center">
              <div className="font-bold text-foreground">{importResult.actualizados}</div>
              <div className="text-muted-foreground">Actualizados</div>
            </div>
            <div className="bg-muted rounded-md p-2 text-center">
              <div className="font-bold text-primary">{importResult.recuperados}</div>
              <div className="text-muted-foreground">Recuperados</div>
            </div>
            <div className="bg-muted rounded-md p-2 text-center">
              <div className="font-bold text-destructive">{importResult.desaparecidos}</div>
              <div className="text-muted-foreground">Desaparecidos</div>
            </div>
          </div>
          {importResult.desaparecidos_titulos?.length > 0 && (
            <div className="mt-2 p-2 bg-destructive/10 rounded-md">
              <div className="flex items-center gap-1 text-xs font-medium text-destructive mb-1">
                <AlertTriangle className="h-3 w-3" /> Títulos que desaparecieron esta semana:
              </div>
              <ul className="text-xs text-muted-foreground space-y-0.5 max-h-32 overflow-y-auto">
                {importResult.desaparecidos_titulos.map((t: string, i: number) => (
                  <li key={i}>• {t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre o ISBN..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="px-3 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer"
        >
          <option value="">Todos los estados</option>
          <option value="Disponible">Disponible</option>
          <option value="Fuera de Catálogo">Fuera de Catálogo</option>
        </select>
        <div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleUpload} className="hidden" id="catalog-upload" />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Procesando..." : "Subir Excel"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs">
        <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md font-medium">
          {filtered.length} productos
        </span>
        <span className="text-muted-foreground">
          ({products.filter(p => p.estado === "Disponible").length} disponibles, {products.filter(p => p.estado === "Fuera de Catálogo").length} fuera de catálogo)
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No hay productos en el catálogo</p>
          <p className="text-xs mt-1">Sube un archivo Excel de Entelequia para empezar</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="text-xs">Título</TableHead>
                <TableHead className="text-xs">ISBN</TableHead>
                <TableHead className="text-xs">Editorial</TableHead>
                <TableHead className="text-xs text-right">Precio ARS</TableHead>
                <TableHead className="text-xs">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id} className={p.estado === "Fuera de Catálogo" ? "opacity-60" : ""}>
                  <TableCell className="text-xs font-medium">{p.titulo}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.isbn || "—"}</TableCell>
                  <TableCell className="text-xs">{p.editorial}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums">
                    {p.precio_costo_ars != null ? `$${p.precio_costo_ars.toLocaleString()}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.estado === "Disponible" ? "default" : "secondary"} className="text-[10px]">
                      {p.estado}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
