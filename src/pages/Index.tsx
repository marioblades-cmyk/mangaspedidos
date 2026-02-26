import { useState, useMemo } from "react";
import { Search, Filter, BookOpen, Users, List, Loader2, Archive, LogOut, Shield } from "lucide-react";
import { Order, getStats } from "@/data/orders";
import { useOrders } from "@/hooks/useOrders";
import { useClientPayments } from "@/hooks/useClientPayments";
import { useAuth } from "@/hooks/useAuth";
import { StatsRow } from "@/components/StatsRow";
import { OrdersTable } from "@/components/OrdersTable";
import { AddOrderDialog } from "@/components/AddOrderDialog";
import { EditOrderDialog } from "@/components/EditOrderDialog";
import { ClientsView } from "@/components/ClientsView";
import { ClientPaymentDialog } from "@/components/ClientPaymentDialog";
import { EstadoQuickActions } from "@/components/EstadoQuickActions";
import { BulkEditDialog } from "@/components/BulkEditDialog";
import { Switch } from "@/components/ui/switch";

const Index = () => {
  const { user, role, signOut } = useAuth();
  const {
    orders, loading, estados,
    addOrders, updateOrder, deleteOrder, deleteMany,
    updateEstado, applyPayment, bulkEdit, bulkEditIndividual,
  } = useOrders();

  const { payments: clientPayments, addPayment, deletePayment, getClientPayments, getClientPaidTotal } = useClientPayments();

  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [view, setView] = useState<"table" | "clients">("table");
  const [payClient, setPayClient] = useState<string | null>(null);
  const [estadoOrder, setEstadoOrder] = useState<Order | null>(null);
  const [bulkEditIds, setBulkEditIds] = useState<number[]>([]);
  const [decimals, setDecimals] = useState(1);
  const [showEnviados, setShowEnviados] = useState(false);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch = !search || o.titulo.toLowerCase().includes(search.toLowerCase()) || o.numero.includes(search);
      const matchEstado = !estadoFilter || o.estado === estadoFilter;
      const matchEnviado = showEnviados || o.estado !== "ENVIADO";
      return matchSearch && matchEstado && matchEnviado;
    });
  }, [orders, search, estadoFilter, showEnviados]);

  const stats = useMemo(() => getStats(filtered), [filtered]);

  const handleDelete = (id: number) => {
    if (window.confirm("¿Eliminar este pedido?")) deleteOrder(id);
  };

  const handleBulkDelete = (ids: number[]) => {
    if (window.confirm(`¿Eliminar ${ids.length} pedido(s)?`)) {
      deleteMany(ids);
      setSelectedIds(new Set());
    }
  };

  const handleUpdateEstado = (id: number, estado: string) => {
    const order = orders.find(o => o.id === id);
    if (order) setEstadoOrder(order);
  };

  const handleEstadoConfirm = (id: number, estado: string) => {
    updateEstado(id, estado);
  };

  const handleBulkEdit = (changes: { estado?: string; tipo?: string }) => {
    bulkEdit(bulkEditIds, changes);
    setBulkEditIds([]);
    setSelectedIds(new Set());
  };

  const handleSmartBulkEstado = (updates: { id: number; estado: string }[]) => {
    bulkEditIndividual(updates);
    setBulkEditIds([]);
    setSelectedIds(new Set());
  };

  const selectedOrders = useMemo(() => {
    return orders.filter(o => bulkEditIds.includes(o.id));
  }, [orders, bulkEditIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight">MangaTracker</h1>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {user?.email}
                {role === "admin" && <Shield className="h-3 w-3 text-primary" />}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-muted rounded-lg p-0.5">
              <button onClick={() => setView("table")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${view === "table" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <List className="h-3.5 w-3.5" /> Pedidos
              </button>
              <button onClick={() => setView("clients")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${view === "clients" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Users className="h-3.5 w-3.5" /> Clientes
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-md font-medium">
                {orders.length} pedidos
              </span>
              <select
                value={decimals}
                onChange={e => setDecimals(Number(e.target.value))}
                className="text-[10px] bg-muted border border-border rounded px-1.5 py-1 text-muted-foreground cursor-pointer focus:outline-none"
                title="Decimales"
              >
                <option value={1}>.0</option>
                <option value={2}>.00</option>
                <option value={3}>.000</option>
              </select>
            </div>
            <AddOrderDialog onAdd={addOrders} estados={estados} />
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="h-3.5 w-3.5" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <StatsRow stats={stats} decimals={decimals} />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por título o número de cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all appearance-none cursor-pointer"
            >
              <option value="">Todos los estados</option>
              {estados.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
            <Archive className="h-4 w-4 text-muted-foreground" />
            <label htmlFor="show-enviados" className="text-xs text-muted-foreground cursor-pointer select-none">Ver Enviados</label>
            <Switch id="show-enviados" checked={showEnviados} onCheckedChange={setShowEnviados} className="scale-75" />
          </div>
        </div>

        {view === "table" ? (
          <OrdersTable
            orders={filtered}
            onEdit={setEditOrder}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            onBulkEdit={(ids) => setBulkEditIds(ids)}
            onUpdateEstado={handleUpdateEstado}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            decimals={decimals}
          />
        ) : (
          <ClientsView
            orders={filtered}
            onPayClient={setPayClient}
            decimals={decimals}
            onUpdatePayment={applyPayment}
            clientPayments={clientPayments}
            getClientPaidTotal={getClientPaidTotal}
            onDeleteGeneralPayment={deletePayment}
            onUpdateEstado={updateEstado}
            showEnviados={showEnviados}
          />
        )}
      </main>

      <EditOrderDialog order={editOrder} open={!!editOrder} onClose={() => setEditOrder(null)} onSave={(o) => { updateOrder(o); setEditOrder(null); }} estados={estados} decimals={decimals} />
      <ClientPaymentDialog orders={orders} cliente={payClient || ""} open={!!payClient} onClose={() => setPayClient(null)} onApplyPayment={applyPayment} onGeneralPayment={addPayment} decimals={decimals} generalPaidTotal={getClientPaidTotal(payClient || "")} />
      <EstadoQuickActions order={estadoOrder} open={!!estadoOrder} onClose={() => setEstadoOrder(null)} onUpdateEstado={handleEstadoConfirm} allEstados={estados} />
      <BulkEditDialog open={bulkEditIds.length > 0} onClose={() => setBulkEditIds([])} orders={selectedOrders} onApply={handleBulkEdit} onSmartEstado={handleSmartBulkEstado} estados={estados} />
    </div>
  );
};

export default Index;
