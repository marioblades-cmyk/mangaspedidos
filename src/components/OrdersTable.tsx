import { Order } from "@/data/orders";

function EstadoBadge({ estado }: { estado: string }) {
  const styles: Record<string, string> = {
    "SEPARADO": "bg-success/15 text-success border-success/20",
    "PEDIDO 9": "bg-info/15 text-info border-info/20",
    "PEDIDO 10": "bg-info/15 text-info border-info/20",
    "PEDIDO 11": "bg-info/15 text-info border-info/20",
    "PEDIDO 21": "bg-primary/15 text-primary border-primary/20",
    "NO CLASIFICA": "bg-muted text-muted-foreground border-border",
  };
  const style = styles[estado] || "bg-muted text-muted-foreground border-border";
  
  return estado ? (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${style}`}>
      {estado}
    </span>
  ) : <span className="text-muted-foreground text-xs">—</span>;
}

function TipoBadge({ tipo }: { tipo: string }) {
  if (!tipo) return null;
  const styles: Record<string, string> = {
    "PRE VENTA": "bg-accent/15 text-accent border-accent/20",
    "RESERVA": "bg-primary/15 text-primary border-primary/20",
    "CAMBIO": "bg-warning/15 text-warning border-warning/20",
    "CHICAS": "bg-muted text-muted-foreground border-border",
    "STOCK": "bg-success/15 text-success border-success/20",
  };
  const style = styles[tipo] || "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${style}`}>
      {tipo}
    </span>
  );
}

interface OrdersTableProps {
  orders: Order[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Título</th>
              <th className="text-left p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Tipo</th>
              <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Precio</th>
              <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Pago</th>
              <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Saldo</th>
              <th className="text-left p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Cliente</th>
              <th className="text-left p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="p-3 font-medium max-w-[240px] truncate">{order.titulo}</td>
                <td className="p-3"><TipoBadge tipo={order.tipo} /></td>
                <td className="p-3 text-right tabular-nums">
                  {order.precioVendido != null ? `Bs ${order.precioVendido.toFixed(1)}` : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="p-3 text-right tabular-nums">
                  {order.pago != null ? `Bs ${order.pago.toFixed(1)}` : <span className="text-muted-foreground">—</span>}
                </td>
                <td className={`p-3 text-right tabular-nums font-medium ${(order.saldo ?? 0) > 0 ? 'text-warning' : 'text-success'}`}>
                  {order.saldo != null ? `Bs ${order.saldo.toFixed(1)}` : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="p-3 text-muted-foreground font-mono text-xs">{order.numero || "—"}</td>
                <td className="p-3"><EstadoBadge estado={order.estado} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {orders.length === 0 && (
        <div className="p-12 text-center text-muted-foreground">
          No se encontraron pedidos con esos filtros.
        </div>
      )}
    </div>
  );
}
