import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Upload,
  Search,
  Trash2,
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { CatalogCategory, CatalogItem, CatalogState, ImportReport } from "@/lib/catalog-types";
import { CATEGORIES } from "@/lib/catalog-types";
import { importExcel } from "@/lib/catalog-import";
import { ImportReportDialog } from "@/components/ImportReportDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PAGE_SIZE = 50;

const CATEGORY_COLORS: Record<CatalogCategory, string> = {
  "NOVEDADES": "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  "REIMPRESIONES": "bg-amber-500/15 text-amber-700 border-amber-500/30",
  "MANGA EN CURSO": "bg-blue-500/15 text-blue-700 border-blue-500/30",
  "MANGAS YA COMPLETOS": "bg-violet-500/15 text-violet-700 border-violet-500/30",
  "MANGAS DE TOMO ÚNICO": "bg-pink-500/15 text-pink-700 border-pink-500/30",
  "COMICS": "bg-orange-500/15 text-orange-700 border-orange-500/30",
};

function formatPrice(n: number | null): string {
  if (n === null) return "—";
  return `$ ${n.toLocaleString("es-AR")}`;
}

// Map CatalogCategory to estado_publicacion stored in DB
function categoryToEstado(cat: CatalogCategory): string {
  return cat;
}

export default function CatalogPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const isAdmin = role === "admin";

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CatalogCategory | "">("");
  const [reimpresionOnly, setReimpresionOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [reportOpen, setReportOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<ImportReport | null>(null);
  const [lastImportDate, setLastImportDate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch catalog from DB ──
  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    let all: CatalogItem[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from("catalog_products")
        .select("*")
        .order("titulo")
        .range(from, from + pageSize - 1);
      if (error) {
        toast.error("Error al cargar catálogo");
        break;
      }
      if (!data || data.length === 0) break;
      all = all.concat(data.map(d => ({
        id: d.identificador_unico || String(d.id),
        title: d.titulo,
        isbn: d.isbn,
        price: d.precio_costo_ars,
        category: (d.estado_publicacion || "NOVEDADES") as CatalogCategory,
        reimpresion: d.estado === "Reimpresión",
        lastUpdated: d.updated_at,
      })));
      if (data.length < pageSize) break;
      from += pageSize;
    }
    setItems(all);
    if (all.length > 0) {
      const latest = all.reduce((a, b) => a.lastUpdated > b.lastUpdated ? a : b);
      setLastImportDate(latest.lastUpdated);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchCatalog();
  }, [user, fetchCatalog]);

  // ── Import handler (admin only) ──
  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isAdmin || !user) return;
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const buf = await file.arrayBuffer();
        const existingState: CatalogState = { items, lastImportDate, importHistory: [] };
        const { state, report } = importExcel(buf, existingState);

        // Sync to Supabase: delete all then insert
        toast.loading("Sincronizando catálogo...");
        
        // Delete all existing catalog products
        await supabase.from("catalog_products").delete().neq("id", 0);

        // Insert in batches
        const batchSize = 200;
        const rows = state.items.map(item => ({
          user_id: user.id,
          titulo: item.title,
          isbn: item.isbn,
          precio_costo_ars: item.price,
          estado_publicacion: categoryToEstado(item.category),
          estado: item.reimpresion ? "Reimpresión" : "Disponible",
          identificador_unico: item.id,
          editorial: "",
          tomo: "",
        }));

        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          const { error } = await supabase.from("catalog_products").insert(batch);
          if (error) {
            console.error("Insert error:", error);
            toast.error("Error al guardar lote de productos");
          }
        }

        toast.dismiss();
        setCurrentReport(report);
        setReportOpen(true);
        setPage(1);
        toast.success(`Importación completada: ${report.newItems} nuevos, ${report.updatedItems} actualizados`);
        fetchCatalog();
      } catch (err: unknown) {
        toast.dismiss();
        const msg = err instanceof Error ? err.message : "Error desconocido";
        toast.error("Error al importar: " + msg);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [items, lastImportDate, isAdmin, user, fetchCatalog]
  );

  // ── Delete catalog (admin only) ──
  const handleDeleteCatalog = useCallback(async () => {
    if (!isAdmin) return;
    toast.loading("Eliminando catálogo...");
    await supabase.from("catalog_products").delete().neq("id", 0);
    toast.dismiss();
    setItems([]);
    setLastImportDate(null);
    setPage(1);
    toast.success("Catálogo eliminado");
  }, [isAdmin]);

  // ── Filtering ──
  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.isbn.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !categoryFilter || item.category === categoryFilter;
      const matchReimpresion = !reimpresionOnly || item.reimpresion;
      return matchSearch && matchCategory && matchReimpresion;
    });
  }, [items, search, categoryFilter, reimpresionOnly]);

  // ── Category counts ──
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [items]);

  const reimpresionCount = useMemo(
    () => items.filter((i) => i.reimpresion).length,
    [items]
  );

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const paginationButtons = useMemo(() => {
    const btns: (number | "...")[] = [];
    const max = 7;
    if (totalPages <= max) {
      for (let i = 1; i <= totalPages; i++) btns.push(i);
    } else {
      btns.push(1);
      if (safePage > 3) btns.push("...");
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) btns.push(i);
      if (safePage < totalPages - 2) btns.push("...");
      btns.push(totalPages);
    }
    return btns;
  }, [totalPages, safePage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Cargando catálogo...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              title="Volver a pedidos"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight">Catálogo Entelequia</h1>
              {lastImportDate && (
                <span className="text-xs text-muted-foreground">
                  Última importación:{" "}
                  {format(new Date(lastImportDate), "dd/MM/yyyy HH:mm", { locale: es })}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Import button - admin only */}
            {isAdmin && (
              <label className="cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFile}
                />
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 hover:border-primary/60 transition-colors">
                  <Upload className="h-4 w-4" />
                  Importar Excel
                </div>
              </label>
            )}

            {/* View report */}
            {currentReport && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReportOpen(true)}
                className="gap-1.5"
              >
                <FileText className="h-4 w-4" />
                Ver informe
              </Button>
            )}

            {/* Delete catalog - admin only */}
            {isAdmin && items.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-1.5">
                    <Trash2 className="h-4 w-4" />
                    Eliminar catálogo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar todo el catálogo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará todos los {items.length} productos del catálogo. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteCatalog}>
                      Sí, eliminar todo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">No hay productos en el catálogo</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              {isAdmin
                ? "Importá un archivo Excel (.xlsx) de Entelequia para comenzar. El sistema detectará automáticamente las categorías, títulos, ISBN y precios."
                : "El administrador aún no ha importado un catálogo. Contactá al admin para que suba el archivo Excel."}
            </p>
            {isAdmin && (
              <label className="cursor-pointer mt-2">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFile}
                />
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 text-primary font-medium hover:bg-primary/10 hover:border-primary/60 transition-colors">
                  <Upload className="h-5 w-5" />
                  Importar Excel
                </div>
              </label>
            )}
          </div>
        ) : (
          <>
            {/* Search & Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título o ISBN..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={() => { setCategoryFilter(""); setPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    !categoryFilter
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  Todos ({items.length})
                </button>

                {CATEGORIES.filter(c => c !== "REIMPRESIONES").map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setCategoryFilter(cat === categoryFilter ? "" : cat); setPage(1); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      categoryFilter === cat
                        ? CATEGORY_COLORS[cat]
                        : "bg-card text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {cat} ({categoryCounts[cat] || 0})
                  </button>
                ))}

                <button
                  onClick={() => { setReimpresionOnly(!reimpresionOnly); setPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    reimpresionOnly
                      ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  🔄 Reimpresiones ({reimpresionCount})
                </button>
              </div>
            </div>

            {/* Results count */}
            <div className="text-xs text-muted-foreground">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
              {filtered.length !== items.length && ` de ${items.length}`}
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[45%]">Título</TableHead>
                    <TableHead className="w-[18%]">ISBN</TableHead>
                    <TableHead className="w-[22%]">Categoría</TableHead>
                    <TableHead className="w-[15%] text-right">Precio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                        No se encontraron resultados
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageItems.map((item, idx) => (
                      <TableRow
                        key={item.id}
                        className="fade-in-row"
                        style={{ animationDelay: `${idx * 15}ms` }}
                      >
                        <TableCell className="font-medium">
                          <span>{item.title}</span>
                          {item.reimpresion && (
                            <Badge variant="secondary" className="ml-2 text-[10px] bg-amber-500/15 text-amber-700 border-amber-500/30">
                              <RefreshCw className="h-2.5 w-2.5 mr-0.5" />
                              Reimpresión
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {item.isbn.startsWith("TTL") ? (
                            <span className="italic text-muted-foreground/60">{item.isbn}</span>
                          ) : (
                            item.isbn
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${CATEGORY_COLORS[item.category] || ""}`}
                          >
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatPrice(item.price)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 pt-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={safePage <= 1}
                  onClick={() => setPage(safePage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {paginationButtons.map((btn, i) =>
                  btn === "..." ? (
                    <span key={`e${i}`} className="px-2 text-muted-foreground text-sm">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={btn}
                      variant={btn === safePage ? "default" : "ghost"}
                      size="icon"
                      className="h-8 w-8 text-xs"
                      onClick={() => setPage(btn)}
                    >
                      {btn}
                    </Button>
                  )
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage(safePage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Report dialog */}
      <ImportReportDialog
        report={currentReport}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}
