import { useState } from "react";
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

export function EstadoQuickActions({ order, open, onClose, onUpdateEstado, allEstados }: EstadoQuickActionsProps) {
  const [customEstado, setCustomEstado] = useState("");
  const [pedidoNum, setPedidoNum] = useState("");
  const [showPedidoInput, setShowPedidoInput] = useState(false);

  if (!order) return null;

  const isPedido = order.estado.startsWith("PEDIDO");

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";

  const resetAndClose = () => {
    setCustomEstado("");
    setPedidoNum("");
    setShowPedidoInput(false);
    onClose();
  };

  const handleConfirm = () => {
    const estado = pedidoNum.trim() ? `CONFIRMADO PEDIDO ${pedidoNum.trim()}` : "CONFIRMADO";
    onUpdateEstado(order.id, estado);
    resetAndClose();
  };

  const flowOptions = isPedido ? [
    { label: "Confirmado", action: () => setShowPedidoInput(true), icon: <Check className="h-4 w-4" />, variant: "bg-success text-success-foreground" },
    { label: "No confirmado", action: () => { onUpdateEstado(order.id, "NO CONFIRMADO"); resetAndClose(); }, icon: <X className="h-4 w-4" />, variant: "bg-destructive text-destructive-foreground" },
  ] : order.estado === "NO CONFIRMADO" ? [
    { label: "Volver a pedir", action: () => { onUpdateEstado(order.id, ""); resetAndClose(); }, icon: <ArrowRight className="h-4 w-4" />, variant: "bg-info text-info-foreground" },
  ] : order.estado.startsWith("CONFIRMADO") ? [
    { label: "Separado", action: () => { onUpdateEstado(order.id, "SEPARADO"); resetAndClose(); }, icon: <ArrowRight className="h-4 w-4" />, variant: "bg-success text-success-foreground" },
  ] : null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Cambiar estado</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{order.titulo}</span> — Estado actual: <span className="font-medium">{order.estado || "Sin estado"}</span>
          </p>

          {showPedidoInput ? (
            <div className="space-y-3 border border-success/30 bg-success/5 rounded-lg p-4">
              <p className="text-sm font-medium">¿En qué pedido llegará?</p>
              <input
                value={pedidoNum}
                onChange={e => setPedidoNum(e.target.value)}
                placeholder="Ej: 10, 11, 21..."
                className={inputClass}
                autoFocus
              />
              <div className="flex gap-2">
                <Button onClick={handleConfirm} className="flex-1 bg-success text-success-foreground gap-2">
                  <Check className="h-4 w-4" /> {pedidoNum.trim() ? `Confirmado Pedido ${pedidoNum.trim()}` : "Confirmado (sin pedido)"}
                </Button>
                <Button variant="outline" onClick={() => setShowPedidoInput(false)} className="shrink-0">
                  Atrás
                </Button>
              </div>
            </div>
          ) : (
            <>
              {flowOptions && flowOptions.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acciones rápidas</p>
                  <div className="flex flex-col gap-2">
                    {flowOptions.map(opt => (
                      <Button
                        key={opt.label}
                        onClick={opt.action}
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
                    onClick={() => { onUpdateEstado(order.id, customEstado.trim()); resetAndClose(); }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
