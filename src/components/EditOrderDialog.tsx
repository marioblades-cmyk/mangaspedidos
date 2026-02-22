import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Order } from "@/data/orders";

interface EditOrderDialogProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onSave: (order: Order) => void;
  estados: string[];
}

export function EditOrderDialog({ order, open, onClose, onSave, estados }: EditOrderDialogProps) {
  const [form, setForm] = useState<Order | null>(null);

  useEffect(() => {
    if (order) setForm({ ...order });
  }, [order]);

  if (!form) return null;

  const saldo = (form.precioVendido ?? 0) - (form.pago ?? 0);

  const update = (field: keyof Order, value: string) => {
    setForm(prev => {
      if (!prev) return prev;
      if (["precioVendido", "precioRegular", "pago", "saldo"].includes(field)) {
        return { ...prev, [field]: value === "" ? null : parseFloat(value) };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSave = () => {
    if (!form) return;
    onSave({ ...form, saldo: Math.max(0, saldo) });
    onClose();
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";
  const labelClass = "text-xs font-semibold text-muted-foreground uppercase tracking-wider";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Editar Pedido</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <label className={labelClass}>Título</label>
            <input value={form.titulo} onChange={e => update("titulo", e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Tipo</label>
              <select value={form.tipo} onChange={e => update("tipo", e.target.value)} className={inputClass}>
                <option value="">—</option>
                <option value="PRE VENTA">PRE VENTA</option>
                <option value="RESERVA">RESERVA</option>
                <option value="CAMBIO">CAMBIO</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Estado</label>
              <select value={form.estado} onChange={e => update("estado", e.target.value)} className={inputClass}>
                <option value="">Sin estado</option>
                {estados.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Precio Regular</label>
              <input type="number" value={form.precioRegular ?? ""} onChange={e => update("precioRegular", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Precio Vendido</label>
              <input type="number" value={form.precioVendido ?? ""} onChange={e => update("precioVendido", e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Pago</label>
              <input type="number" value={form.pago ?? ""} onChange={e => update("pago", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Saldo (auto)</label>
              <div className={`px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm font-medium tabular-nums ${saldo > 0 ? "text-warning" : "text-success"}`}>
                Bs {Math.max(0, saldo).toFixed(2)}
              </div>
            </div>
          </div>
          <div>
            <label className={labelClass}>Cliente</label>
            <input value={form.numero} onChange={e => update("numero", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Nota</label>
            <input value={form.nota} onChange={e => update("nota", e.target.value)} className={inputClass} />
          </div>
          <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Guardar cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
