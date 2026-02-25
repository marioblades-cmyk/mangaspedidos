import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Order } from "@/data/orders";
import { Check, ArrowRight } from "lucide-react";

interface BulkEditDialogProps {
  open: boolean;
  onClose: () => void;
  orders: Order[];
  onApply: (changes: { estado?: string; tipo?: string }) => void;
  onSmartEstado: (updates: { id: number; estado: string }[]) => void;
  estados: string[];
}

function getSmartConfirmEstado(estado: string): string | null {
  const pedidoMatch = estado.match(/^PEDIDO\s+(.+)$/i);
  if (pedidoMatch) return `CONFIRMADO PEDIDO ${pedidoMatch[1]}`;
  return null;
}

export function BulkEditDialog({ open, onClose, orders, onApply, onSmartEstado, estados }: BulkEditDialogProps) {
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [changeEstado, setChangeEstado] = useState(false);
  const [changeTipo, setChangeTipo] = useState(false);

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";
  const labelClass = "text-xs font-semibold text-muted-foreground uppercase tracking-wider";

  const count = orders.length;

  // Can we do smart confirm? (at least one order has PEDIDO X pattern)
  const confirmable = orders.filter(o => /^PEDIDO\s+/i.test(o.estado));
  const canConfirm = confirmable.length > 0;

  // Can we do smart separate? (at least one order starts with CONFIRMADO)
  const separable = orders.filter(o => o.estado.startsWith("CONFIRMADO"));
  const canSeparate = separable.length > 0;

  const handleApply = () => {
    const changes: { estado?: string; tipo?: string } = {};
    if (changeEstado) changes.estado = estado;
    if (changeTipo) changes.tipo = tipo;
    onApply(changes);
    resetAndClose();
  };

  const handleSmartConfirm = () => {
    const updates = confirmable
      .map(o => {
        const next = getSmartConfirmEstado(o.estado);
        return next ? { id: o.id, estado: next } : null;
      })
      .filter(Boolean) as { id: number; estado: string }[];
    if (updates.length > 0) {
      onSmartEstado(updates);
      resetAndClose();
    }
  };

  const handleSmartSeparate = () => {
    const updates = separable.map(o => ({ id: o.id, estado: "SEPARADO" }));
    if (updates.length > 0) {
      onSmartEstado(updates);
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setEstado("");
    setTipo("");
    setChangeEstado(false);
    setChangeTipo(false);
    onClose();
  };

  const hasChanges = changeEstado || changeTipo;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && resetAndClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Editar {count} pedido(s)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* Smart actions */}
          {(canConfirm || canSeparate) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acciones rápidas</p>
              <div className="flex flex-col gap-2">
                {canConfirm && (
                  <Button onClick={handleSmartConfirm} className="gap-2 bg-success text-success-foreground hover:bg-success/90">
                    <Check className="h-4 w-4" /> Confirmar ({confirmable.length})
                  </Button>
                )}
                {canSeparate && (
                  <Button onClick={handleSmartSeparate} className="gap-2 bg-info text-info-foreground hover:bg-info/90">
                    <ArrowRight className="h-4 w-4" /> Separar ({separable.length})
                  </Button>
                )}
              </div>
              <div className="border-t border-border" />
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Cambiar campos manualmente para todos los pedidos seleccionados.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={changeEstado}
                onChange={e => setChangeEstado(e.target.checked)}
                className="mt-2 h-4 w-4 rounded border-border accent-primary"
              />
              <div className="flex-1">
                <label className={labelClass}>Cambiar estado</label>
                <input
                  list="bulk-estados-list"
                  value={estado}
                  onChange={e => setEstado(e.target.value)}
                  placeholder="Escribir estado..."
                  disabled={!changeEstado}
                  className={`${inputClass} ${!changeEstado ? 'opacity-50' : ''}`}
                />
                <datalist id="bulk-estados-list">
                  {estados.map(e => <option key={e} value={e} />)}
                </datalist>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={changeTipo}
                onChange={e => setChangeTipo(e.target.checked)}
                className="mt-2 h-4 w-4 rounded border-border accent-primary"
              />
              <div className="flex-1">
                <label className={labelClass}>Tipo</label>
                <select
                  value={tipo}
                  onChange={e => setTipo(e.target.value)}
                  disabled={!changeTipo}
                  className={`${inputClass} ${!changeTipo ? 'opacity-50' : ''}`}
                >
                  <option value="">Sin tipo</option>
                  <option value="PRE VENTA">PRE VENTA</option>
                  <option value="RESERVA">RESERVA</option>
                  <option value="CAMBIO">CAMBIO</option>
                </select>
              </div>
            </div>
          </div>

          <Button
            onClick={handleApply}
            disabled={!hasChanges}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Aplicar a {count} pedido(s)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
