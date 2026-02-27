import { useState, useMemo, useCallback, useRef } from "react";
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
import { loadCatalog, saveCatalog, CATEGORIES } from "@/lib/catalog-types";
import { importExcel } from "@/lib/catalog-import";
import { ImportReportDialog } from "@/components/ImportReportDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

export default function CatalogPage() {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<CatalogState>(loadCatalog);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CatalogCategory | "">("");
  const [reimpresionOnly, setReimpresionOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [reportOpen, setReportOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<ImportReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const persist = useCallback((s: CatalogState) => {
    setCatalog(s);
    saveCatalog(s);
  }, []);

  // ── Import handler ──
  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const buf = await file.arrayBuffer();
        const { state, report } = importExcel(buf, catalog);
        persist(state);
        setCurrentReport(report);
        setReportOpen(true);
        setPage(1);
        toast.success(`Importación completada: ${report.newItems} nuevos, ${report.updatedItems} actualizados`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        toast.error("Error al importar: " + msg);
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [catalog, persist]
  );

  // ── Delete catalog ──
  const handleDeleteCatalog = useCallback(() => {
    persist({ items: [], lastImportDate: null, importHistory: [] });
    setPage(1);
    toast.success("Catálogo eliminado");
  }, [persist]);

  // ── Filtering ──
  const filtered = useMemo(() => {
    return catalog.items.filter((item) => {
      const matchSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.isbn.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !categoryFilter || item.category === categoryFilter;
      const matchReimpresion = !reimpresionOnly || item.reimpresion;
      return matchSearch && matchCategory && matchReimpresion;
    });
  }, [catalog.items, search, categoryFilter, reimpresionOnly]);

  // ── Category counts ──
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of catalog.items) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [catalog.items]);

  const reimpresionCount = useMemo(
    () => catalog.items.filter((i) => i.reimpresion).length,
    [catalog.items]
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

  const lastReport = currentReport || catalog.importHistory[0] || null;

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
              {catalog.lastImportDate && (
                <span className="text-xs text-muted-foreground">
                  Última importación:{" "}
                  {format(new Date(catalog.lastImportDate), "dd/MM/yyyy HH:mm", { locale: es })}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Import button */}
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

            {/* View report */}
            {lastReport && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentReport(lastReport);
                  setReportOpen(true);
                }}
                className="gap-1.5"
              >
                <FileText className="h-4 w-4" />
                Ver informe
              </Button>
            )}

            {/* Delete catalog */}
            {catalog.items.length > 0 && (
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
                      Esta acción eliminará todos los {catalog.items.length} productos del catálogo. Esta acción no se puede deshacer.
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
        {catalog.items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">No hay productos en el catálogo</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Importá un archivo Excel (.xlsx) de Entelequia para comenzar. El sistema detectará automáticamente las categorías, títulos, ISBN y precios.
            </p>
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
                {/* All filter */}
                <button
                  onClick={() => { setCategoryFilter(""); setPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    !categoryFilter
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  Todos ({catalog.items.length})
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

                {/* Reimpresion toggle */}
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
              {filtered.length !== catalog.items.length && ` de ${catalog.items.length}`}
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
