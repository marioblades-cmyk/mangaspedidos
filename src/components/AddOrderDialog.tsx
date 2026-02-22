import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, BookCopy } from "lucide-react";
import { Order } from "@/data/orders";

interface OrderItem {
  titulo: string;
  tipo: string;
  precioVendido: string;
  precioRegular: string;
  pago: string;
  nota: string;
  estado: string;
}

const emptyItem = (): OrderItem => ({
  titulo: "", tipo: "", precioVendido: "", precioRegular: "", pago: "", nota: "", estado: "",
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
  const [mode, setMode] = useState<"manual" | "collection">("manual");
  // Collection mode state
  const [colName, setColName] = useState("");
  const [colVolumes, setColVolumes] = useState("");
  const [colTipo, setColTipo] = useState("");
  const [colPrecio, setColPrecio] = useState("");
  const [colPrecioRegular, setColPrecioRegular] = useState("");
  const [colPago, setColPago] = useState("");
  const [colNota, setColNota] = useState("");

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

  const expandVolumes = (input: string): string[] => {
    const parts = input.split(",").map(v => v.trim()).filter(v => v !== "");
    const result: string[] = [];
    for (const part of parts) {
      if (part.includes("-")) {
        const [startStr, endStr] = part.split("-").map(s => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) result.push(String(i));
        } else {
          result.push(part);
        }
      } else {
        result.push(part);
      }
    }
    return result;
  };

  const generateFromCollection = () => {
    if (!colName.trim() || !colVolumes.trim()) return;
    const volumes = expandVolumes(colVolumes);
    const generated: OrderItem[] = volumes.map(vol => ({
      titulo: `${colName.trim()} ${vol}`,
      tipo: colTipo,
      precioVendido: colPrecio,
      precioRegular: colPrecioRegular,
      pago: colPago,
      nota: colNota,
      estado: estado,
    }));
    setItems(generated);
    setMode("manual"); // switch to manual so user can edit each
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
        estado: it.estado || estado,
        nota: it.nota,
      }));
    if (newOrders.length === 0) return;
    onAdd(newOrders);
    resetForm();
  };

  const resetForm = () => {
    setCliente("");
    setEstado("");
    setItems([emptyItem()]);
    setMode("manual");
    setColName("");
    setColVolumes("");
    setColTipo("");
    setColPrecio("");
    setColPrecioRegular("");
    setColPago("");
    setColNota("");
    setOpen(false);
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";
  const labelClass = "text-xs font-semibold text-muted-foreground uppercase tracking-wider";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
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
          {/* Client & Estado shared fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Cliente (Número)</label>
              <input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Ej: 77331983" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Estado</label>
              <input list="estados-list-add" value={estado} onChange={e => setEstado(e.target.value)} placeholder="Ej: PEDIDO 10" className={inputClass} />
              <datalist id="estados-list-add">
                {estados.map(e => <option key={e} value={e} />)}
              </datalist>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button onClick={() => setMode("manual")} className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${mode === "manual" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Plus className="h-3.5 w-3.5" /> Manual
            </button>
            <button onClick={() => setMode("collection")} className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${mode === "collection" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <BookCopy className="h-3.5 w-3.5" /> Colección
            </button>
          </div>

          {mode === "collection" ? (
            <div className="border border-primary/20 bg-primary/5 rounded-lg p-4 space-y-3">
              <p className="text-sm text-muted-foreground">Escribe el nombre de la colección y los tomos separados por coma. Se crearán automáticamente.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelClass}>Nombre de colección</label>
                  <input value={colName} onChange={e => setColName(e.target.value)} placeholder="Ej: CHAINSAW MAN" className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Tomos (separados por coma)</label>
                  <input value={colVolumes} onChange={e => setColVolumes(e.target.value)} placeholder="Ej: 1-5,7,9-13" className={inputClass} />
                  <p className="text-[10px] text-muted-foreground mt-1">Usa comas para separar y guión para rangos (1-13 = del 1 al 13)</p>
                </div>
                <div>
                  <label className={labelClass}>Tipo</label>
                  <select value={colTipo} onChange={e => setColTipo(e.target.value)} className={inputClass}>
                    <option value="">—</option>
                    <option value="PRE VENTA">PRE VENTA</option>
                    <option value="RESERVA">RESERVA</option>
                    <option value="CAMBIO">CAMBIO</option>
                    <option value="PEDIDO">PEDIDO</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Precio Regular</label>
                  <input type="number" value={colPrecioRegular} onChange={e => setColPrecioRegular(e.target.value)} placeholder="0.00" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Precio Vendido</label>
                  <input type="number" value={colPrecio} onChange={e => setColPrecio(e.target.value)} placeholder="0.00" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Pago</label>
                  <input type="number" value={colPago} onChange={e => setColPago(e.target.value)} placeholder="0.00" className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Nota</label>
                  <input value={colNota} onChange={e => setColNota(e.target.value)} placeholder="Opcional" className={inputClass} />
                </div>
              </div>
              <Button
                onClick={generateFromCollection}
                disabled={!colName.trim() || !colVolumes.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                <BookCopy className="h-4 w-4" /> Generar {expandVolumes(colVolumes).length || 0} ítem(s)
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={labelClass}>Ítems ({items.length})</span>
                <Button variant="outline" size="sm" onClick={() => setItems(prev => [...prev, emptyItem()])} className="gap-1 text-xs">
                  <Plus className="h-3 w-3" /> Agregar ítem
                </Button>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/60 border-b border-border">
                        <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">#</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Título</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Tipo</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Estado</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">P.Reg</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">P.Vend</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Pago</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Saldo</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Nota</th>
                        <th className="px-2 py-1.5 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                          <td className="px-2 py-1.5 text-muted-foreground">{idx + 1}</td>
                          <td className="px-1 py-1">
                            <input value={item.titulo} onChange={e => updateItem(idx, "titulo", e.target.value)} placeholder="Título" className="w-full min-w-[120px] px-1.5 py-1 rounded border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
                          </td>
                          <td className="px-1 py-1">
                            <select value={item.tipo} onChange={e => updateItem(idx, "tipo", e.target.value)} className="w-full min-w-[80px] px-1 py-1 rounded border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary/30">
                              <option value="">—</option>
                              <option value="PRE VENTA">PRE VENTA</option>
                              <option value="RESERVA">RESERVA</option>
                              <option value="CAMBIO">CAMBIO</option>
                              <option value="PEDIDO">PEDIDO</option>
                            </select>
                          </td>
                          <td className="px-1 py-1">
                            <input list={`estados-item-${idx}`} value={item.estado} onChange={e => updateItem(idx, "estado", e.target.value)} placeholder="Estado" className="w-full min-w-[80px] px-1.5 py-1 rounded border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
                            <datalist id={`estados-item-${idx}`}>
                              {estados.map(e => <option key={e} value={e} />)}
                            </datalist>
                          </td>
                          <td className="px-1 py-1">
                            <input type="number" value={item.precioRegular} onChange={e => updateItem(idx, "precioRegular", e.target.value)} placeholder="0" className="w-full min-w-[55px] px-1.5 py-1 rounded border border-border bg-card text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/30" />
                          </td>
                          <td className="px-1 py-1">
                            <input type="number" value={item.precioVendido} onChange={e => updateItem(idx, "precioVendido", e.target.value)} placeholder="0" className="w-full min-w-[55px] px-1.5 py-1 rounded border border-border bg-card text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/30" />
                          </td>
                          <td className="px-1 py-1">
                            <input type="number" value={item.pago} onChange={e => updateItem(idx, "pago", e.target.value)} placeholder="0" className="w-full min-w-[55px] px-1.5 py-1 rounded border border-border bg-card text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/30" />
                          </td>
                          <td className="px-1 py-1">
                            <span className={`inline-block px-1.5 py-1 rounded text-xs font-medium tabular-nums ${getSaldo(item) > 0 ? "text-warning" : "text-success"}`}>
                              {getSaldo(item).toFixed(0)}
                            </span>
                          </td>
                          <td className="px-1 py-1">
                            <input value={item.nota} onChange={e => updateItem(idx, "nota", e.target.value)} placeholder="—" className="w-full min-w-[60px] px-1.5 py-1 rounded border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
                          </td>
                          <td className="px-1 py-1">
                            {items.length > 1 && (
                              <button onClick={() => removeItem(idx)} className="text-destructive hover:text-destructive/80 p-0.5">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {mode === "manual" && (
            <Button onClick={handleSubmit} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus className="h-4 w-4" /> Agregar {items.length > 1 ? `${items.length} ítems` : "pedido"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
