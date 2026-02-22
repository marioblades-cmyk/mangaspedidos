import { Order } from "@/data/orders";
import { Pencil, Trash2, ChevronRight, Check } from "lucide-react";

const ESTADO_FLOW: Record<string, string> = {
  "PEDIDO 9": "CONFIRMADO",
  "PEDIDO 10": "CONFIRMADO",
  "PEDIDO 11": "CONFIRMADO",
  "PEDIDO 21": "CONFIRMADO",
  "CONFIRMADO": "SEPARADO",
  "NO CONFIRMADO": "", // needs re-order
};

function EstadoBadge({ estado, onAdvance }: { estado: string; onAdvance?: (next: string) => void }) {
  const styles: Record<string, string> = {
    "SEPARADO": "bg-success/15 text-success border-success/20",
    "CONFIRMADO": "bg-primary/15 text-primary border-primary/20",
    "NO CONFIRMADO": "bg-destructive/15 text-destructive border-destructive/20",
    "PEDIDO 9": "bg-info/15 text-info border-info/20",
    "PEDIDO 10": "bg-info/15 text-info border-info/20",
    "PEDIDO 11": "bg-info/15 text-info border-info/20",
    "PEDIDO 21": "bg-primary/15 text-primary border-primary/20",
    "NO CLASIFICA": "bg-muted text-muted-foreground border-border",
  };
  const style = styles[estado] || "bg-muted text-muted-foreground border-border";
  const nextState = ESTADO_FLOW[estado];

  if (!estado) return <span className="text-muted-foreground text-xs">—</span>;

  return (
    <div className="flex items-center gap-1">
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${style}`}>
        {estado}
      </span>
      {nextState !== undefined && onAdvance && (
        <button
          onClick={() => onAdvance(nextState)}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title={nextState ? `Avanzar a ${nextState}` : "Necesita re-pedido"}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function TipoBadge({ tipo }: { tipo: string }) {
  if (!tipo) return null;
  const styles: Record<string, string> = {
    "PRE VENTA": "bg-accent/15 text-accent border-accent/20",
    "RESERVA": "bg-primary/15 text-primary border-primary/20",
    "CAMBIO": "bg-warning/15 text-warning border-warning/20",
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
  onEdit: (order: Order) => void;
  onDelete: (id: number) => void;
  onBulkDelete: (ids: number[]) => void;
  onUpdateEstado: (id: number, estado: string) => void;
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
}

export function OrdersTable({ orders, onEdit, onDelete, onBulkDelete, onUpdateEstado, selectedIds, onSelectionChange }: OrdersTableProps) {
  const allSelected = orders.length > 0 && orders.every(o => selectedIds.has(o.id));
  const someSelected = orders.some(o => selectedIds.has(o.id));

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(orders.map(o => o.id)));
    }
  };

  const toggleOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    onSelectionChange(next);
  };

  return (
    <div className="space-y-2">
      {someSelected && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <span className="text-sm font-medium">{selectedIds.size} seleccionado(s)</span>
          <button
            onClick={() => onBulkDelete(Array.from(selectedIds))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar seleccionados
          </button>
          <button
            onClick={() => onSelectionChange(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
          >
            Deseleccionar
          </button>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-3 w-10">
                  <button onClick={toggleAll} className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${allSelected ? 'bg-primary border-primary text-primary-foreground' : someSelected ? 'bg-primary/30 border-primary' : 'border-border hover:border-muted-foreground'}`}>
                    {allSelected && <Check className="h-3 w-3" />}
                  </button>
                </th>
                <th className="text-left p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Título</th>
                <th className="text-left p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Tipo</th>
                <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Precio</th>
                <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Pago</th>
                <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Saldo</th>
                <th className="text-left p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Cliente</th>
                <th className="text-left p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Estado</th>
                <th className="text-center p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${selectedIds.has(order.id) ? 'bg-primary/5' : ''}`}>
                  <td className="p-3">
                    <button onClick={() => toggleOne(order.id)} className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${selectedIds.has(order.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-border hover:border-muted-foreground'}`}>
                      {selectedIds.has(order.id) && <Check className="h-3 w-3" />}
                    </button>
                  </td>
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
                  <td className="p-3">
                    <EstadoBadge estado={order.estado} onAdvance={(next) => onUpdateEstado(order.id, next)} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => onEdit(order)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => onDelete(order.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Eliminar">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
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
    </div>
  );
}
