import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Order } from "@/data/orders";
import { Check, X, ArrowRight } from "lucide-react";

interface EstadoQuickActionsProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onUpdateEstado: (id: number, estado: string) => void;
  allEstados: string[];
}

const FLOW_OPTIONS: Record<string, { label: string; next: string; icon: React.ReactNode; variant: string }[]> = {
  "PEDIDO 9": [
    { label: "Confirmado", next: "CONFIRMADO", icon: <Check className="h-4 w-4" />, variant: "bg-success text-success-foreground" },
    { label: "No confirmado", next: "NO CONFIRMADO", icon: <X className="h-4 w-4" />, variant: "bg-destructive text-destructive-foreground" },
  ],
  "PEDIDO 10": [
    { label: "Confirmado", next: "CONFIRMADO", icon: <Check className="h-4 w-4" />, variant: "bg-success text-success-foreground" },
    { label: "No confirmado", next: "NO CONFIRMADO", icon: <X className="h-4 w-4" />, variant: "bg-destructive text-destructive-foreground" },
  ],
  "PEDIDO 11": [
    { label: "Confirmado", next: "CONFIRMADO", icon: <Check className="h-4 w-4" />, variant: "bg-success text-success-foreground" },
    { label: "No confirmado", next: "NO CONFIRMADO", icon: <X className="h-4 w-4" />, variant: "bg-destructive text-destructive-foreground" },
  ],
  "PEDIDO 21": [
    { label: "Confirmado", next: "CONFIRMADO", icon: <Check className="h-4 w-4" />, variant: "bg-success text-success-foreground" },
    { label: "No confirmado", next: "NO CONFIRMADO", icon: <X className="h-4 w-4" />, variant: "bg-destructive text-destructive-foreground" },
  ],
  "CONFIRMADO": [
    { label: "Separado", next: "SEPARADO", icon: <ArrowRight className="h-4 w-4" />, variant: "bg-success text-success-foreground" },
  ],
  "NO CONFIRMADO": [
    { label: "Volver a pedir", next: "", icon: <ArrowRight className="h-4 w-4" />, variant: "bg-info text-info-foreground" },
  ],
};

export function EstadoQuickActions({ order, open, onClose, onUpdateEstado, allEstados }: EstadoQuickActionsProps) {
  const [customEstado, setCustomEstado] = useState("");

  if (!order) return null;

  const options = FLOW_OPTIONS[order.estado];

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setCustomEstado(""); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Cambiar estado</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{order.titulo}</span> — Estado actual: <span className="font-medium">{order.estado || "Sin estado"}</span>
          </p>

          {options && options.length > 0 && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acciones rápidas</p>
              <div className="flex flex-col gap-2">
                {options.map(opt => (
                  <Button
                    key={opt.next}
                    onClick={() => { onUpdateEstado(order.id, opt.next); onClose(); setCustomEstado(""); }}
                    className={`gap-2 ${opt.variant}`}
                  >
                    {opt.icon} {opt.label}
                  </Button>
                ))}
              </div>
            </>
          )}

          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cambiar manualmente</p>
            <div className="flex gap-2">
              <input
                list="estado-quick-list"
                value={customEstado}
                onChange={e => setCustomEstado(e.target.value)}
                placeholder="Escribir estado..."
                className={inputClass}
              />
              <datalist id="estado-quick-list">
                {allEstados.filter(e => e !== order.estado).map(e => <option key={e} value={e} />)}
              </datalist>
              <Button
                disabled={!customEstado.trim()}
                onClick={() => { onUpdateEstado(order.id, customEstado.trim()); onClose(); setCustomEstado(""); }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
