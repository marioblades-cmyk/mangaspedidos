import { Order } from "@/data/orders";
import { Pencil, Trash2, ChevronRight, Check } from "lucide-react";

function getNextEstado(estado: string): string | null {
  const pedidoMatch = estado.match(/^PEDIDO\s+(.+)$/i);
  if (pedidoMatch) return `CONFIRMADO PEDIDO ${pedidoMatch[1]}`;
  if (estado.startsWith("CONFIRMADO")) return "SEPARADO";
  if (estado === "NO CONFIRMADO") return "";
  return null;
}

function EstadoBadge({ estado, onAdvance }: { estado: string; onAdvance?: (next: string) => void }) {
  const styles: Record<string, string> = {
    "SEPARADO": "bg-success/15 text-success border-success/20",
    "CONFIRMADO": "bg-primary/15 text-primary border-primary/20",
    "NO CONFIRMADO": "bg-destructive/15 text-destructive border-destructive/20",
    "NO CLASIFICA": "bg-muted text-muted-foreground border-border",
  };

  const getStyle = (e: string) => {
    if (styles[e]) return styles[e];
    if (e.startsWith("CONFIRMADO")) return "bg-primary/15 text-primary border-primary/20";
    if (e.startsWith("PEDIDO")) return "bg-info/15 text-info border-info/20";
    return "bg-muted text-muted-foreground border-border";
  };

  const nextState = getNextEstado(estado);

  if (!estado) return <span className="text-muted-foreground text-xs">—</span>;

  return (
    <div className="flex items-center gap-1">
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getStyle(estado)}`}>
        {estado}
      </span>
      {nextState !== null && onAdvance && (
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

interface OrdersTableProps {
  orders: Order[];
  onEdit?: (order: Order) => void;
  onDelete?: (id: number) => void;
  onBulkDelete?: (ids: number[]) => void;
  onBulkEdit?: (ids: number[]) => void;
  onUpdateEstado?: (id: number, estado: string) => void;
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
  decimals: number;
}

export function OrdersTable({ orders, onEdit, onDelete, onBulkDelete, onBulkEdit, onUpdateEstado, selectedIds, onSelectionChange, decimals }: OrdersTableProps) {
  const allSelected = orders.length > 0 && orders.every(o => selectedIds.has(o.id));
  const someSelected = orders.some(o => selectedIds.has(o.id));

  const fmt = (v: number | null) => v != null ? `Bs ${v.toFixed(decimals)}` : null;

  const toggleAll = () => {
    if (allSelected) onSelectionChange(new Set());
    else onSelectionChange(new Set(orders.map(o => o.id)));
  };

  const toggleOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    onSelectionChange(next);
  };

  return (
    <div className="space-y-2">
      {someSelected && (onBulkEdit || onBulkDelete) && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-sm font-medium">{selectedIds.size} seleccionado(s)</span>
          {onBulkEdit && (
            <button
              onClick={() => onBulkEdit(Array.from(selectedIds))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" /> Editar seleccionados
            </button>
          )}
          {onBulkDelete && (
            <button
              onClick={() => onBulkDelete(Array.from(selectedIds))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Eliminar seleccionados
            </button>
          )}
          <button
            onClick={() => onSelectionChange(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
          >
            Deseleccionar
          </button>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm origin-top-left scale-[0.62] sm:scale-100 w-[161%] sm:w-full">
        <div className="overflow-x-auto max-h-[110vh] sm:max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-[5]">
              <tr className="border-b border-border bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
                <th className="p-3 w-10 bg-card">
                  <button onClick={toggleAll} className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${allSelected ? 'bg-primary border-primary text-primary-foreground' : someSelected ? 'bg-primary/30 border-primary' : 'border-border hover:border-muted-foreground'}`}>
                    {allSelected && <Check className="h-3 w-3" />}
                  </button>
                </th>
                <th className="text-left p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider bg-card">Título</th>
                <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider bg-card">Precio</th>
                <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider bg-card">Pago</th>
                <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider bg-card">Saldo</th>
                <th className="text-left p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider bg-card">Cliente</th>
                <th className="text-left p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider bg-card">Estado</th>
                <th className="text-center p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider bg-card">Acciones</th>
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
                  <td className="p-3 text-right tabular-nums">
                    {fmt(order.precioVendido) || <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {fmt(order.pago) || <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className={`p-3 text-right tabular-nums font-medium ${(order.saldo ?? 0) > 0 ? 'text-warning' : 'text-success'}`}>
                    {fmt(order.saldo) || <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3 text-muted-foreground font-mono text-xs">{order.numero || "—"}</td>
                  <td className="p-3">
                    <EstadoBadge estado={order.estado} onAdvance={onUpdateEstado ? (next) => onUpdateEstado(order.id, next) : undefined} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      {onEdit && (
                        <button onClick={() => onEdit(order)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Editar">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(order.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Eliminar">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
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
