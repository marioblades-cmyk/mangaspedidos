import { useMemo } from "react";
import { Order } from "@/data/orders";
import { DollarSign, ChevronDown, ChevronUp, User } from "lucide-react";
import { useState } from "react";

interface ClientsViewProps {
  orders: Order[];
  onPayClient: (cliente: string) => void;
}

export function ClientsView({ orders, onPayClient }: ClientsViewProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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
      }))
      .sort((a, b) => b.totalSaldo - a.totalSaldo);
  }, [orders]);

  const toggle = (num: string) => {
    const next = new Set(expanded);
    next.has(num) ? next.delete(num) : next.add(num);
    setExpanded(next);
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
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className={`font-bold tabular-nums ${c.totalSaldo > 0 ? 'text-warning' : 'text-success'}`}>
                  Bs {c.totalSaldo.toFixed(1)}
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
                <tbody>
                  {c.items.map(o => (
                    <tr key={o.id} className="border-b border-border/30 last:border-0">
                      <td className="px-4 py-2 font-medium truncate max-w-[200px]">{o.titulo}</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {o.precioVendido != null ? `Bs ${o.precioVendido.toFixed(1)}` : '—'}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-success">
                        {o.pago != null ? `Bs ${o.pago.toFixed(1)}` : '—'}
                      </td>
                      <td className={`px-4 py-2 text-right tabular-nums font-medium ${(o.saldo ?? 0) > 0 ? 'text-warning' : 'text-success'}`}>
                        Bs {(o.saldo ?? 0).toFixed(1)}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{o.estado || '—'}</td>
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
