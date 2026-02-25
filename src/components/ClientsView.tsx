import { useMemo, useState } from "react";
import { Order } from "@/data/orders";
import { DollarSign, ChevronDown, ChevronUp, User, PackageCheck } from "lucide-react";

interface ClientsViewProps {
  orders: Order[];
  onPayClient: (cliente: string) => void;
  decimals: number;
  onUpdatePayment: (updates: { id: number; pago: number; saldo: number }[]) => void;
}

export function ClientsView({ orders, onPayClient, decimals, onUpdatePayment }: ClientsViewProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingPago, setEditingPago] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const fmt = (v: number) => v.toFixed(decimals);

  const clients = useMemo(() => {
    const map = new Map<string, Order[]>();
    orders.forEach(o => {
      if (!o.numero) return;
      if (!map.has(o.numero)) map.set(o.numero, []);
      map.get(o.numero)!.push(o);
    });
    return Array.from(map.entries())
      .map(([numero, items]) => ({
        numero,
        items,
        totalPrecio: items.reduce((s, o) => s + (o.precioVendido ?? 0), 0),
        totalPagado: items.reduce((s, o) => s + (o.pago ?? 0), 0),
        totalSaldo: items.reduce((s, o) => s + (o.saldo ?? 0), 0),
        allSeparado: items.length > 0 && items.every(o => (o.estado || "").toUpperCase().includes("SEPARADO")),
      }))
      .sort((a, b) => b.totalSaldo - a.totalSaldo);
  }, [orders]);

  const toggle = (num: string) => {
    const next = new Set(expanded);
    next.has(num) ? next.delete(num) : next.add(num);
    setExpanded(next);
  };

  const startEditPago = (order: Order) => {
    setEditingPago(order.id);
    setEditValue(String(order.pago ?? 0));
  };

  const savePago = (order: Order) => {
    const newPago = parseFloat(editValue) || 0;
    const newSaldo = Math.max(0, (order.precioVendido ?? 0) - newPago);
    onUpdatePayment([{ id: order.id, pago: newPago, saldo: newSaldo }]);
    setEditingPago(null);
  };

  return (
    <div className="space-y-2">
      {clients.map(c => (
        <div key={c.numero} className="rounded-lg border border-border bg-card overflow-hidden">
          <div
            className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => toggle(c.numero)}
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium font-mono text-sm">{c.numero}</p>
              <p className="text-xs text-muted-foreground">{c.items.length} ítem(s)</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              {c.allSeparado && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/15 text-success text-xs font-bold border border-success/20 animate-pulse">
                  <PackageCheck className="h-3.5 w-3.5" /> PEDIDO LISTO
                </span>
              )}
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className={`font-bold tabular-nums ${c.totalSaldo > 0 ? 'text-warning' : 'text-success'}`}>
                  Bs {fmt(c.totalSaldo)}
                </p>
              </div>
              {c.totalSaldo > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onPayClient(c.numero); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  <DollarSign className="h-3.5 w-3.5" /> Pagar
                </button>
              )}
              {expanded.has(c.numero) ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
          {expanded.has(c.numero) && (
            <div className="border-t border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="px-4 py-1.5 text-left text-xs font-semibold text-muted-foreground">Título</th>
                    <th className="px-4 py-1.5 text-left text-xs font-semibold text-muted-foreground">Tipo</th>
                    <th className="px-4 py-1.5 text-right text-xs font-semibold text-muted-foreground">P.Regular</th>
                    <th className="px-4 py-1.5 text-right text-xs font-semibold text-muted-foreground">P.Vendido</th>
                    <th className="px-4 py-1.5 text-right text-xs font-semibold text-muted-foreground">Pagado</th>
                    <th className="px-4 py-1.5 text-right text-xs font-semibold text-muted-foreground">Saldo</th>
                    <th className="px-4 py-1.5 text-left text-xs font-semibold text-muted-foreground">Estado</th>
                    <th className="px-4 py-1.5 text-left text-xs font-semibold text-muted-foreground">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {c.items.map(o => (
                    <tr key={o.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-2 font-medium truncate max-w-[200px]">{o.titulo}</td>
                      <td className="px-4 py-2 text-xs">{o.tipo || '—'}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                        {o.precioRegular != null ? `Bs ${fmt(o.precioRegular)}` : '—'}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {o.precioVendido != null ? `Bs ${fmt(o.precioVendido)}` : '—'}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-success">
                        {editingPago === o.id ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => savePago(o)}
                            onKeyDown={e => { if (e.key === "Enter") savePago(o); if (e.key === "Escape") setEditingPago(null); }}
                            className="w-20 px-1.5 py-0.5 rounded border border-primary/50 bg-card text-xs text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/30"
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={(e) => { e.stopPropagation(); startEditPago(o); }}
                            className="cursor-pointer hover:bg-primary/10 px-1.5 py-0.5 rounded transition-colors"
                            title="Clic para editar pago"
                          >
                            {o.pago != null ? `Bs ${fmt(o.pago)}` : '—'}
                          </span>
                        )}
                      </td>
                      <td className={`px-4 py-2 text-right tabular-nums font-bold ${(o.saldo ?? 0) > 0 ? 'text-warning' : 'text-success'}`}>
                        Bs {fmt(o.saldo ?? 0)}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{o.estado || '—'}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground truncate max-w-[120px]">{o.nota || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
      {clients.length === 0 && (
        <div className="p-12 text-center text-muted-foreground">No hay clientes.</div>
      )}
    </div>
  );
}
