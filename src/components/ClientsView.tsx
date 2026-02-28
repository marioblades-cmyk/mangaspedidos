import { useMemo, useState } from "react";
import { Order } from "@/data/orders";
import { DollarSign, ChevronDown, ChevronUp, User, PackageCheck, Wallet, Trash2, Check, Send, CheckSquare } from "lucide-react";
import { ClientPayment } from "@/hooks/useClientPayments";
import { WhatsAppMenu } from "@/components/WhatsAppMenu";

interface ClientsViewProps {
  orders: Order[];
  onPayClient: (cliente: string) => void;
  decimals: number;
  onUpdatePayment: (updates: { id: number; pago: number; saldo: number }[]) => void;
  clientPayments: ClientPayment[] | any[];
  getClientPaidTotal: (numero: string) => number;
  onDeleteGeneralPayment: (id: number) => void;
  onUpdateEstado: (id: number, estado: string) => void;
  showEnviados: boolean;
  readOnly?: boolean;
}

export function ClientsView({ orders, onPayClient, decimals, onUpdatePayment, clientPayments, getClientPaidTotal, onDeleteGeneralPayment, onUpdateEstado, showEnviados, readOnly }: ClientsViewProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingPago, setEditingPago] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const fmt = (v: number) => v.toFixed(decimals);

  const clients = useMemo(() => {
    const map = new Map<string, Order[]>();
    orders.forEach(o => {
      if (!o.numero) return;
      if (!map.has(o.numero)) map.set(o.numero, []);
      map.get(o.numero)!.push(o);
    });
    return Array.from(map.entries())
      .map(([numero, items]) => {
        const pendingItems = items.filter(o => o.estado !== "ENVIADO");
        const enviadoItems = items.filter(o => o.estado === "ENVIADO");
        const totalSaldo = items.reduce((s, o) => s + (o.saldo ?? 0), 0);
        const generalPaid = getClientPaidTotal(numero);
        const totalPagado = items.reduce((s, o) => s + (o.pago ?? 0), 0);
        const allEnviado = items.length > 0 && items.every(o => o.estado === "ENVIADO");
        return {
          numero,
          items,
          pendingItems,
          enviadoItems,
          allEnviado,
          totalPrecio: items.reduce((s, o) => s + (o.precioVendido ?? 0), 0),
          totalPagado,
          totalSaldo,
          generalPaid,
          sumaTotalPagada: totalPagado + generalPaid,
          saldoAjustado: Math.max(0, totalSaldo - generalPaid),
          allSeparado: pendingItems.length > 0 && pendingItems.every(o => (o.estado || "").toUpperCase().includes("SEPARADO")),
        };
      })
      .filter(c => showEnviados || !c.allEnviado)
      .sort((a, b) => b.saldoAjustado - a.saldoAjustado);
  }, [orders, getClientPaidTotal, showEnviados]);

  const toggle = (num: string) => {
    const next = new Set(expanded);
    next.has(num) ? next.delete(num) : next.add(num);
    setExpanded(next);
  };

  const startEditPago = (order: Order) => {
    if (readOnly) return;
    setEditingPago(order.id);
    setEditValue(String(order.pago ?? 0));
  };

  const savePago = (order: Order) => {
    const newPago = parseFloat(editValue) || 0;
    const newSaldo = Math.max(0, (order.precioVendido ?? 0) - newPago);
    onUpdatePayment([{ id: order.id, pago: newPago, saldo: newSaldo }]);
    setEditingPago(null);
  };

  const getPaymentsForClient = (numero: string) => {
    return (clientPayments as any[]).filter((p: any) => p.numero === numero);
  };

  const toggleItem = (id: number) => {
    const next = new Set(selectedItems);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedItems(next);
  };

  const selectAllSeparado = (clientItems: Order[]) => {
    const separadoIds = clientItems.filter(o => (o.estado || "").toUpperCase().includes("SEPARADO")).map(o => o.id);
    const allSelected = separadoIds.every(id => selectedItems.has(id));
    const next = new Set(selectedItems);
    if (allSelected) {
      separadoIds.forEach(id => next.delete(id));
    } else {
      separadoIds.forEach(id => next.add(id));
    }
    setSelectedItems(next);
  };

  const handleBulkEnviado = (clientItems: Order[]) => {
    const toMark = clientItems.filter(o => selectedItems.has(o.id) && (o.estado || "").toUpperCase().includes("SEPARADO"));
    if (toMark.length === 0) return;
    if (!window.confirm(`¿Marcar ${toMark.length} ítem(s) como ENVIADO?`)) return;
    toMark.forEach(o => onUpdateEstado(o.id, "ENVIADO"));
    setSelectedItems(prev => {
      const next = new Set(prev);
      toMark.forEach(o => next.delete(o.id));
      return next;
    });
  };

  const handleDespachar = (clientItems: Order[]) => {
    const toDispatch = clientItems.filter(o => selectedItems.has(o.id) && (o.saldo ?? 0) === 0 && o.estado !== "ENVIADO");
    if (toDispatch.length === 0) return;
    if (!window.confirm(`¿Despachar ${toDispatch.length} ítem(s) como ENVIADO?`)) return;
    toDispatch.forEach(o => onUpdateEstado(o.id, "ENVIADO"));
    setSelectedItems(prev => {
      const next = new Set(prev);
      toDispatch.forEach(o => next.delete(o.id));
      return next;
    });
  };

  const getDispatchableCount = (clientItems: Order[]) => {
    return clientItems.filter(o => selectedItems.has(o.id) && (o.saldo ?? 0) === 0 && o.estado !== "ENVIADO").length;
  };

  const getBulkEnviadoCount = (clientItems: Order[]) => {
    return clientItems.filter(o => selectedItems.has(o.id) && (o.estado || "").toUpperCase().includes("SEPARADO")).length;
  };

  return (
    <div className="space-y-2 origin-top-left scale-[0.62] sm:scale-100 w-[161%] sm:w-full">
      {clients.map(c => {
        const payments = getPaymentsForClient(c.numero);
        const dispatchable = getDispatchableCount(c.items);
        const bulkEnviadoCount = getBulkEnviadoCount(c.items);
        const clientSelected = c.items.filter(o => selectedItems.has(o.id));
        const separadoItems = c.items.filter(o => (o.estado || "").toUpperCase().includes("SEPARADO"));
        const allSeparadoSelected = separadoItems.length > 0 && separadoItems.every(o => selectedItems.has(o.id));
        return (
          <div key={c.numero} className={`rounded-lg border border-border bg-card overflow-visible ${c.allEnviado ? 'opacity-50' : ''}`}>
            <div
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => toggle(c.numero)}
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium font-mono text-sm">{c.numero}</p>
                <p className="text-xs text-muted-foreground">{c.items.length} ítem(s){c.enviadoItems.length > 0 ? ` · ${c.enviadoItems.length} enviado(s)` : ''}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                {c.allEnviado && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold border border-border">
                    <Send className="h-3.5 w-3.5" /> TODO ENVIADO
                  </span>
                )}
                {c.allSeparado && !c.allEnviado && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/15 text-success text-xs font-bold border border-success/20 animate-pulse">
                    <PackageCheck className="h-3.5 w-3.5" /> PEDIDO LISTO
                  </span>
                )}
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">P.Vendido</p>
                  <p className="text-xs tabular-nums font-medium">Bs {fmt(c.totalPrecio)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Deuda ítems</p>
                  <p className="text-xs tabular-nums text-muted-foreground">Bs {fmt(c.totalSaldo)}</p>
                </div>
                {c.generalPaid > 0 && (
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Pagos grales.</p>
                    <p className="text-xs tabular-nums text-primary">-Bs {fmt(c.generalPaid)}</p>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Saldo Final</p>
                  <p className={`font-bold tabular-nums ${c.saldoAjustado > 0 ? 'text-warning' : 'text-success'}`}>
                    Bs {fmt(c.saldoAjustado)}
                  </p>
                </div>
                {!readOnly && c.saldoAjustado > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onPayClient(c.numero); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    <DollarSign className="h-3.5 w-3.5" /> Pagar
                  </button>
                )}
                <WhatsAppMenu
                  numero={c.numero}
                  items={c.items}
                  clientPayments={payments}
                  generalPaid={c.generalPaid}
                  saldoAjustado={c.saldoAjustado}
                  decimals={decimals}
                />
                {expanded.has(c.numero) ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
            {expanded.has(c.numero) && (
              <div className="border-t border-border">
                {/* Toolbar */}
                <div className="flex items-center gap-3 px-4 py-2 bg-muted/20 border-b border-border">
                  {!readOnly && separadoItems.length > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); selectAllSeparado(c.items); }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${allSeparadoSelected ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground'}`}
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                      {allSeparadoSelected ? 'Deseleccionar Separados' : `Seleccionar todos SEPARADO (${separadoItems.length})`}
                    </button>
                  )}
                  {!readOnly && bulkEnviadoCount > 0 && (
                    <button
                      onClick={() => handleBulkEnviado(c.items)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80 transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" /> Marcar seleccionados como ENVIADOS ({bulkEnviadoCount})
                    </button>
                  )}
                  {!readOnly && clientSelected.length > 0 && dispatchable > 0 && (
                    <button
                      onClick={() => handleDespachar(c.items)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-success text-success-foreground text-xs font-medium hover:bg-success/90 transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" /> Despachar saldo=0 ({dispatchable})
                    </button>
                  )}
                  {clientSelected.length > 0 && (
                    <span className="text-xs text-muted-foreground ml-auto">{clientSelected.length} seleccionado(s)</span>
                  )}
                </div>

                {/* Items table */}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="px-3 py-1.5 w-8"></th>
                      <th className="px-4 py-1.5 text-left text-xs font-semibold text-muted-foreground">Título</th>
                      <th className="px-4 py-1.5 text-right text-xs font-semibold text-muted-foreground">P.Vendido</th>
                      <th className="px-4 py-1.5 text-right text-xs font-semibold text-muted-foreground">Pagado</th>
                      <th className="px-4 py-1.5 text-right text-xs font-semibold text-muted-foreground">Saldo</th>
                      <th className="px-4 py-1.5 text-left text-xs font-semibold text-muted-foreground">Estado</th>
                      <th className="px-4 py-1.5 text-left text-xs font-semibold text-muted-foreground">Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.items.map(o => (
                      <tr key={o.id} className={`border-b border-border/30 last:border-0 hover:bg-muted/20 ${o.estado === "ENVIADO" ? 'opacity-40' : ''} ${selectedItems.has(o.id) ? 'bg-primary/5' : ''}`}>
                        <td className="px-3 py-2">
                          {o.estado !== "ENVIADO" && !readOnly && (
                            <button
                              onClick={() => toggleItem(o.id)}
                              className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${selectedItems.has(o.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-border hover:border-muted-foreground'}`}
                            >
                              {selectedItems.has(o.id) && <Check className="h-3 w-3" />}
                            </button>
                          )}
                          {o.estado === "ENVIADO" && (
                            <Send className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </td>
                        <td className="px-4 py-2 font-medium break-words whitespace-normal max-w-[200px]">{o.titulo}</td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {o.precioVendido != null ? `Bs ${fmt(o.precioVendido)}` : '—'}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-success">
                          {!readOnly && editingPago === o.id ? (
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
                              className={`${readOnly ? '' : 'cursor-pointer hover:bg-primary/10'} px-1.5 py-0.5 rounded transition-colors`}
                              title={readOnly ? undefined : "Clic para editar pago"}
                            >
                              {o.pago != null ? `Bs ${fmt(o.pago)}` : '—'}
                            </span>
                          )}
                        </td>
                        <td className={`px-4 py-2 text-right tabular-nums font-bold ${(o.saldo ?? 0) > 0 ? 'text-warning' : 'text-success'}`}>
                          Bs {fmt(o.saldo ?? 0)}
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">{o.estado || '—'}</td>
                        <td className="px-4 py-2 text-xs text-muted-foreground break-words whitespace-normal max-w-[120px]">{o.nota || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* General payments history */}
                {payments.length > 0 && (
                  <div className="border-t border-border px-4 py-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <Wallet className="h-3.5 w-3.5" /> Historial de Pagos Generales
                    </p>
                    <div className="space-y-1">
                      {payments.map((p: any, i: number) => (
                        <div key={p.id} className="flex items-center gap-2 text-xs bg-primary/5 border border-primary/10 rounded px-3 py-1.5">
                          <span className="font-medium text-primary">Pago {payments.length - i}:</span>
                          <span className="font-bold tabular-nums">Bs {fmt(p.monto)}</span>
                          {p.nota && <span className="text-muted-foreground">— {p.nota}</span>}
                          <span className="ml-auto text-muted-foreground text-[10px]">
                            {new Date(p.created_at).toLocaleDateString()}
                          </span>
                          {!readOnly && (
                            <button
                              onClick={() => { if (window.confirm("¿Eliminar este pago general?")) onDeleteGeneralPayment(p.id); }}
                              className="text-destructive/60 hover:text-destructive transition-colors"
                              title="Eliminar pago"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary footer */}
                <div className="border-t border-border px-4 py-2 bg-muted/30 flex flex-wrap items-center justify-between text-xs gap-2">
                  <span className="text-muted-foreground">Resumen:</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <span>P.Vendido: <strong>Bs {fmt(c.totalPrecio)}</strong></span>
                    <span>Pagada: <strong className="text-success">Bs {fmt(c.sumaTotalPagada)}</strong></span>
                    <span>Deuda: <strong className="text-warning">Bs {fmt(c.totalSaldo)}</strong></span>
                    {c.generalPaid > 0 && (
                      <span>Pagos grales: <strong className="text-primary">-Bs {fmt(c.generalPaid)}</strong></span>
                    )}
                    <span>Saldo final: <strong className={c.saldoAjustado > 0 ? 'text-warning' : 'text-success'}>Bs {fmt(c.saldoAjustado)}</strong></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {clients.length === 0 && (
        <div className="p-12 text-center text-muted-foreground">No hay clientes{showEnviados ? '.' : ' con pedidos pendientes.'}</div>
      )}
    </div>
  );
}
