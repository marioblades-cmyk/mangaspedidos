import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Order } from "@/data/orders";
import { DollarSign } from "lucide-react";

interface ClientPaymentDialogProps {
  orders: Order[];
  cliente: string;
  open: boolean;
  onClose: () => void;
  onApplyPayment: (updates: { id: number; pago: number; saldo: number }[]) => void;
}

export function ClientPaymentDialog({ orders, cliente, open, onClose, onApplyPayment }: ClientPaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const clientOrders = useMemo(() => {
    const filtered = orders.filter(o => o.numero === cliente);
    // Sort: SEPARADO first (by highest saldo), then rest
    return filtered.sort((a, b) => {
      const aIsSeparado = a.estado === "SEPARADO" ? 0 : 1;
      const bIsSeparado = b.estado === "SEPARADO" ? 0 : 1;
      if (aIsSeparado !== bIsSeparado) return aIsSeparado - bIsSeparado;
      return (b.saldo ?? 0) - (a.saldo ?? 0);
    });
  }, [orders, cliente]);

  const totalSaldo = clientOrders.reduce((sum, o) => sum + (o.saldo ?? 0), 0);
  const totalPrecio = clientOrders.reduce((sum, o) => sum + (o.precioVendido ?? 0), 0);
  const totalPagado = clientOrders.reduce((sum, o) => sum + (o.pago ?? 0), 0);

  const selectedSaldo = clientOrders
    .filter(o => selectedIds.has(o.id))
    .reduce((sum, o) => sum + (o.saldo ?? 0), 0);

  const toggleItem = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const withSaldo = clientOrders.filter(o => (o.saldo ?? 0) > 0);
    if (withSaldo.every(o => selectedIds.has(o.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(withSaldo.map(o => o.id)));
    }
  };

  const handleApply = () => {
    const payment = parseFloat(amount) || 0;
    if (payment <= 0 || selectedIds.size === 0) return;

    let remaining = payment;
    const updates: { id: number; pago: number; saldo: number }[] = [];

    for (const order of clientOrders) {
      if (!selectedIds.has(order.id)) continue;
      const saldo = order.saldo ?? 0;
      if (saldo <= 0 || remaining <= 0) continue;

      const applied = Math.min(saldo, remaining);
      remaining -= applied;
      updates.push({
        id: order.id,
        pago: (order.pago ?? 0) + applied,
        saldo: saldo - applied,
      });
    }

    if (updates.length > 0) {
      onApplyPayment(updates);
      setAmount("");
      setSelectedIds(new Set());
      onClose();
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setSelectedIds(new Set());
      setAmount("");
      onClose();
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";
  const labelClass = "text-xs font-semibold text-muted-foreground uppercase tracking-wider";

  const canPay = selectedIds.size > 0 && !!amount && parseFloat(amount) > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" /> Pago Total — Cliente {cliente}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground">Total Precio</p>
              <p className="text-lg font-bold">Bs {totalPrecio.toFixed(1)}</p>
            </div>
            <div className="rounded-lg border border-success/20 bg-success/5 p-3 text-center">
              <p className="text-xs text-muted-foreground">Pagado</p>
              <p className="text-lg font-bold text-success">Bs {totalPagado.toFixed(1)}</p>
            </div>
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-3 text-center">
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className="text-lg font-bold text-warning">Bs {totalSaldo.toFixed(1)}</p>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5">
            <div className="flex items-center gap-2 px-2 py-1.5 border-b border-border mb-1">
              <Checkbox
                checked={clientOrders.filter(o => (o.saldo ?? 0) > 0).length > 0 && clientOrders.filter(o => (o.saldo ?? 0) > 0).every(o => selectedIds.has(o.id))}
                onCheckedChange={toggleAll}
              />
              <span className="text-xs font-semibold text-muted-foreground uppercase">Seleccionar todos</span>
              {selectedIds.size > 0 && (
                <span className="ml-auto text-xs text-primary font-medium">
                  {selectedIds.size} sel. · Bs {selectedSaldo.toFixed(1)}
                </span>
              )}
            </div>
            {clientOrders.map(o => {
              const saldo = o.saldo ?? 0;
              const isSeparado = o.estado === "SEPARADO";
              const hasSaldo = saldo > 0;
              return (
                <div
                  key={o.id}
                  className={`flex items-center gap-2 text-sm px-2 py-1.5 rounded transition-colors ${
                    isSeparado ? "bg-success/5 border border-success/15" : "hover:bg-muted/30"
                  } ${!hasSaldo ? "opacity-50" : ""}`}
                >
                  <Checkbox
                    checked={selectedIds.has(o.id)}
                    onCheckedChange={() => toggleItem(o.id)}
                    disabled={!hasSaldo}
                  />
                  <span className="truncate flex-1">
                    {o.titulo}
                    {isSeparado && (
                      <span className="ml-1.5 text-[10px] font-semibold text-success bg-success/10 px-1.5 py-0.5 rounded">
                        SEPARADO
                      </span>
                    )}
                  </span>
                  <span className={`tabular-nums font-medium shrink-0 ${saldo > 0 ? 'text-warning' : 'text-success'}`}>
                    Bs {saldo.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>

          <div>
            <label className={labelClass}>Monto a pagar</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={selectedIds.size > 0 ? `Máx: ${selectedSaldo.toFixed(1)}` : "Selecciona ítems primero"}
              className={inputClass}
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              Se distribuirá entre los {selectedIds.size} ítem(s) seleccionados.
            </p>
          </div>

          <Button onClick={handleApply} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2" disabled={!canPay}>
            <DollarSign className="h-4 w-4" /> Registrar Pago
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
