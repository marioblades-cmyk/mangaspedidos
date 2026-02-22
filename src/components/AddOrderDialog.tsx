import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Order } from "@/data/orders";

interface OrderItem {
  titulo: string;
  tipo: string;
  precioVendido: string;
  precioRegular: string;
  pago: string;
  nota: string;
}

const emptyItem = (): OrderItem => ({
  titulo: "", tipo: "", precioVendido: "", precioRegular: "", pago: "", nota: "",
});

interface AddOrderDialogProps {
  onAdd: (orders: Omit<Order, "id">[]) => void;
  estados: string[];
}

export function AddOrderDialog({ onAdd, estados }: AddOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [cliente, setCliente] = useState("");
  const [estado, setEstado] = useState("");
  const [items, setItems] = useState<OrderItem[]>([emptyItem()]);

  const updateItem = (idx: number, field: keyof OrderItem, value: string) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const removeItem = (idx: number) => {
    if (items.length > 1) setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const getSaldo = (item: OrderItem) => {
    const precio = parseFloat(item.precioVendido) || 0;
    const pago = parseFloat(item.pago) || 0;
    return Math.max(0, precio - pago);
  };

  const handleSubmit = () => {
    const newOrders: Omit<Order, "id">[] = items
      .filter(it => it.titulo.trim())
      .map(it => ({
        titulo: it.titulo.trim(),
        tipo: it.tipo,
        precioVendido: it.precioVendido ? parseFloat(it.precioVendido) : null,
        precioRegular: it.precioRegular ? parseFloat(it.precioRegular) : null,
        pago: it.pago ? parseFloat(it.pago) : null,
        saldo: it.precioVendido ? getSaldo(it) : null,
        numero: cliente,
        estado,
        nota: it.nota,
      }));
    if (newOrders.length === 0) return;
    onAdd(newOrders);
    setCliente("");
    setEstado("");
    setItems([emptyItem()]);
    setOpen(false);
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";
  const labelClass = "text-xs font-semibold text-muted-foreground uppercase tracking-wider";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="h-4 w-4" /> Agregar Pedido
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Nuevo Pedido</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Cliente (Número)</label>
              <input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Ej: 77331983" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Estado</label>
              <select value={estado} onChange={e => setEstado(e.target.value)} className={inputClass}>
                <option value="">Sin estado</option>
                {estados.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={labelClass}>Ítems</span>
              <Button variant="outline" size="sm" onClick={() => setItems(prev => [...prev, emptyItem()])} className="gap-1 text-xs">
                <Plus className="h-3 w-3" /> Agregar ítem
              </Button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Ítem {idx + 1}</span>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)} className="text-destructive hover:text-destructive/80 p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelClass}>Título</label>
                    <input value={item.titulo} onChange={e => updateItem(idx, "titulo", e.target.value)} placeholder="Ej: CHAINSAW MAN 22" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Tipo</label>
                    <select value={item.tipo} onChange={e => updateItem(idx, "tipo", e.target.value)} className={inputClass}>
                      <option value="">—</option>
                      <option value="PRE VENTA">PRE VENTA</option>
                      <option value="RESERVA">RESERVA</option>
                      <option value="CAMBIO">CAMBIO</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Precio Regular</label>
                    <input type="number" value={item.precioRegular} onChange={e => updateItem(idx, "precioRegular", e.target.value)} placeholder="0.00" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Precio Vendido</label>
                    <input type="number" value={item.precioVendido} onChange={e => updateItem(idx, "precioVendido", e.target.value)} placeholder="0.00" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Pago</label>
                    <input type="number" value={item.pago} onChange={e => updateItem(idx, "pago", e.target.value)} placeholder="0.00" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Saldo</label>
                    <div className={`px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm font-medium tabular-nums ${getSaldo(item) > 0 ? "text-warning" : "text-success"}`}>
                      Bs {getSaldo(item).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Nota</label>
                    <input value={item.nota} onChange={e => updateItem(idx, "nota", e.target.value)} placeholder="Opcional" className={inputClass} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleSubmit} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Plus className="h-4 w-4" /> Agregar {items.length > 1 ? `${items.length} ítems` : "pedido"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
