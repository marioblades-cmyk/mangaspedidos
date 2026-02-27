import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import type { ImportReport } from "@/lib/catalog-types";

interface Props {
  report: ImportReport | null;
  open: boolean;
  onClose: () => void;
}

export function ImportReportDialog({ report, open, onClose }: Props) {
  if (!report) return null;

  const hasWarnings =
    report.noPrice.length > 0 ||
    report.noValidIsbn.length > 0 ||
    report.reassignedIsbns.length > 0 ||
    report.duplicateIsbns.length > 0;
  const hasErrors = report.errors.length > 0;

  const StatusIcon = hasErrors
    ? XCircle
    : hasWarnings
    ? AlertTriangle
    : CheckCircle2;

  const statusColor = hasErrors
    ? "text-destructive"
    : hasWarnings
    ? "text-amber-500"
    : "text-emerald-500";

  const statusBg = hasErrors
    ? "bg-destructive/10"
    : hasWarnings
    ? "bg-amber-500/10"
    : "bg-emerald-500/10";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full ${statusBg} flex items-center justify-center`}>
              <StatusIcon className={`h-4 w-4 ${statusColor}`} />
            </div>
            Informe de Importación
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="px-6 pb-6 max-h-[70vh]">
          <div className="space-y-4 pt-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Filas procesadas" value={report.totalRows} />
              <Stat label="Items cargados" value={report.itemsLoaded} />
              <Stat label="Nuevos" value={report.newItems} color="text-emerald-600" />
              <Stat label="Actualizados" value={report.updatedItems} color="text-blue-600" />
              <Stat label="Filas omitidas" value={report.skippedRows} color="text-muted-foreground" />
            </div>

            {/* By category */}
            {Object.keys(report.byCategory).length > 0 && (
              <Section title="Desglose por categoría">
                <div className="space-y-1">
                  {Object.entries(report.byCategory).map(([cat, count]) => (
                    <div key={cat} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{cat}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Reimpresion matches */}
            {report.reimpresionMatches.length > 0 && (
              <Section title={`Reimpresiones (${report.reimpresionMatches.length})`}>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {report.reimpresionMatches.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <RefreshCw className="h-3 w-3 text-amber-500 shrink-0" />
                      <span className="truncate">{r.title}</span>
                      <Badge variant="outline" className="text-[9px] shrink-0">
                        {r.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Reassigned ISBNs */}
            {report.reassignedIsbns.length > 0 && (
              <Section title={`ISBN reasignados (${report.reassignedIsbns.length})`}>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {report.reassignedIsbns.map((r, i) => (
                    <div key={i} className="text-xs space-y-0.5">
                      <span className="text-muted-foreground truncate block">{r.title}</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="line-through text-muted-foreground/60">{r.oldIsbn}</span>
                        <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                        <span className="text-foreground">{r.newIsbn}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* No valid ISBN */}
            {report.noValidIsbn.length > 0 && (
              <Section title={`Sin ISBN válido (${report.noValidIsbn.length})`}>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {report.noValidIsbn.map((r, i) => (
                    <div key={i} className="text-xs flex justify-between">
                      <span className="truncate text-muted-foreground">{r.title}</span>
                      <span className="font-mono text-primary shrink-0 ml-2">{r.generatedIsbn}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Duplicate ISBNs */}
            {report.duplicateIsbns.length > 0 && (
              <Section title={`ISBN duplicados (${report.duplicateIsbns.length})`}>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {report.duplicateIsbns.map((d, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-mono text-muted-foreground">{d.isbn}</span>
                      <div className="text-muted-foreground/80 ml-2">
                        {d.titles.join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* No price */}
            {report.noPrice.length > 0 && (
              <Section title={`Sin precio (${report.noPrice.length})`}>
                <div className="space-y-0.5 max-h-24 overflow-y-auto text-xs text-muted-foreground">
                  {report.noPrice.map((t, i) => (
                    <div key={i} className="truncate">{t}</div>
                  ))}
                </div>
              </Section>
            )}

            {/* Errors */}
            {report.errors.length > 0 && (
              <Section title={`Errores (${report.errors.length})`}>
                <div className="space-y-0.5 text-xs text-destructive">
                  {report.errors.map((e, i) => (
                    <div key={i}>{e}</div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <Separator className="mb-3" />
      <h4 className="text-sm font-medium mb-2">{title}</h4>
      {children}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold ${color || "text-foreground"}`}>{value}</div>
    </div>
  );
}
