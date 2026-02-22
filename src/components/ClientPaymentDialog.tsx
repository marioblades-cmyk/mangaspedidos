import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

  const clientOrders = useMemo(() => orders.filter(o => o.numero === cliente), [orders, cliente]);
  const totalSaldo = clientOrders.reduce((sum, o) => sum + (o.saldo ?? 0), 0);
  const totalPrecio = clientOrders.reduce((sum, o) => sum + (o.precioVendido ?? 0), 0);
  const totalPagado = clientOrders.reduce((sum, o) => sum + (o.pago ?? 0), 0);

  const handleApply = () => {
    const payment = parseFloat(amount) || 0;
    if (payment <= 0) return;

    let remaining = payment;
    const updates: { id: number; pago: number; saldo: number }[] = [];

    // Distribute payment across items with saldo > 0
    for (const order of clientOrders) {
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
      onClose();
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";
  const labelClass = "text-xs font-semibold text-muted-foreground uppercase tracking-wider";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
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

          <div className="max-h-48 overflow-y-auto space-y-1">
            {clientOrders.map(o => (
              <div key={o.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded hover:bg-muted/30">
                <span className="truncate flex-1">{o.titulo}</span>
                <span className={`tabular-nums font-medium ${(o.saldo ?? 0) > 0 ? 'text-warning' : 'text-success'}`}>
                  Bs {(o.saldo ?? 0).toFixed(1)}
                </span>
              </div>
            ))}
          </div>

          <div>
            <label className={labelClass}>Monto a pagar</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={`Máx: ${totalSaldo.toFixed(1)}`}
              className={inputClass}
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              Se distribuirá automáticamente entre los ítems pendientes.
            </p>
          </div>

          <Button onClick={handleApply} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2" disabled={!amount || parseFloat(amount) <= 0}>
            <DollarSign className="h-4 w-4" /> Registrar Pago
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
