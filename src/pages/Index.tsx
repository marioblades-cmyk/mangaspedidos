import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, BookOpen, Users, List, Loader2, Archive, LogOut, Shield, Eye, Library, Menu, X } from "lucide-react";
import { AdminUsersPanel } from "@/components/AdminUsersPanel";
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
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin supervision
  const [allUsers, setAllUsers] = useState<{ user_id: string; email: string; display_name: string | null }[]>([]);
  const [viewAsUserId, setViewAsUserId] = useState<string | null>(null);
  const [supervisedOrders, setSupervisedOrders] = useState<Order[] | null>(null);
  const [supervisedPayments, setSupervisedPayments] = useState<any[] | null>(null);

  useEffect(() => {
    if (role !== "admin") return;
    (async () => {
      const { data } = await supabase.from("profiles").select("user_id, email, display_name").order("email");
      setAllUsers(data || []);
    })();
  }, [role]);

  useEffect(() => {
    if (!viewAsUserId || viewAsUserId === user?.id) {
      setSupervisedOrders(null);
      setSupervisedPayments(null);
      return;
    }
    (async () => {
      const [ordersRes, paymentsRes] = await Promise.all([
        supabase.from("orders").select("*").eq("user_id", viewAsUserId).order("id"),
        supabase.from("client_payments").select("*").eq("user_id", viewAsUserId).order("created_at", { ascending: false }),
      ]);
      setSupervisedOrders((ordersRes.data || []).map((row: any) => ({
        id: row.id, titulo: row.titulo, tipo: row.tipo,
        precioVendido: row.precio_vendido, precioRegular: row.precio_regular,
        pago: row.pago, saldo: row.saldo, numero: row.numero,
        estado: row.estado, nota: row.nota,
      })));
      setSupervisedPayments(paymentsRes.data || []);
    })();
  }, [viewAsUserId, user?.id]);

  const isSupervising = viewAsUserId && viewAsUserId !== user?.id;
  const activeOrders = isSupervising && supervisedOrders ? supervisedOrders : orders;
  const activePayments = isSupervising && supervisedPayments ? supervisedPayments : clientPayments;

  const supervisedGetClientPaidTotal = useCallback((numero: string) => {
    if (!isSupervising || !supervisedPayments) return getClientPaidTotal(numero);
    return supervisedPayments.filter((p: any) => p.numero === numero).reduce((s: number, p: any) => s + p.monto, 0);
  }, [isSupervising, supervisedPayments, getClientPaidTotal]);

  const supervisedUser = allUsers.find(u => u.user_id === viewAsUserId);

  const filtered = useMemo(() => {
    return activeOrders.filter((o) => {
      const matchSearch = !search || o.titulo.toLowerCase().includes(search.toLowerCase()) || o.numero.includes(search);
      const matchEstado = !estadoFilter || o.estado === estadoFilter;
      const matchEnviado = showEnviados || o.estado !== "ENVIADO";
      return matchSearch && matchEstado && matchEnviado;
    });
  }, [activeOrders, search, estadoFilter, showEnviados]);

  const stats = useMemo(() => getStats(filtered), [filtered]);

  const handleDelete = useCallback((id: number) => {
    if (window.confirm("¿Eliminar este pedido?")) deleteOrder(id);
  }, [deleteOrder]);

  const handleBulkDelete = useCallback((ids: number[]) => {
    if (window.confirm(`¿Eliminar ${ids.length} pedido(s)?`)) {
      deleteMany(ids);
      setSelectedIds(new Set());
    }
  }, [deleteMany]);

  const handleUpdateEstado = useCallback((id: number, estado: string) => {
    const order = activeOrders.find(o => o.id === id);
    if (order) setEstadoOrder(order);
  }, [activeOrders]);

  const handleEstadoConfirm = useCallback((id: number, estado: string) => {
    updateEstado(id, estado);
  }, [updateEstado]);

  const handleBulkEdit = useCallback((changes: { estado?: string; tipo?: string }) => {
    bulkEdit(bulkEditIds, changes);
    setBulkEditIds([]);
    setSelectedIds(new Set());
  }, [bulkEdit, bulkEditIds]);

  const handleSmartBulkEstado = useCallback((updates: { id: number; estado: string }[]) => {
    bulkEditIndividual(updates);
    setBulkEditIds([]);
    setSelectedIds(new Set());
  }, [bulkEditIndividual]);

  const selectedOrders = useMemo(() => {
    return activeOrders.filter(o => bulkEditIds.includes(o.id));
  }, [activeOrders, bulkEditIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin supervision banner */}
      {isSupervising && (
        <div className="bg-accent/60 border-b border-accent text-accent-foreground px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
          <Eye className="h-4 w-4" />
          Supervisando: <strong>{supervisedUser?.email || viewAsUserId}</strong>
          <button onClick={() => setViewAsUserId(null)} className="ml-3 underline text-xs hover:text-foreground">Volver</button>
        </div>
      )}

      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <h1 className="text-lg font-display font-bold tracking-tight">MangaTracker</h1>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                {user?.email}
                {role === "admin" && <Shield className="h-3 w-3 text-primary" />}
              </span>
            </div>
          </div>

          {/* Primary actions - always visible */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-muted rounded-lg p-0.5">
              <button onClick={() => setView("table")} className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${view === "table" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <List className="h-3.5 w-3.5" /> <span className="hidden xs:inline">Pedidos</span>
              </button>
              <button onClick={() => setView("clients")} className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${view === "clients" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Users className="h-3.5 w-3.5" /> <span className="hidden xs:inline">Clientes</span>
              </button>
            </div>

            {/* Add order - always visible */}
            {!isSupervising && <AddOrderDialog onAdd={addOrders} estados={estados} />}

            {/* Desktop-only actions */}
            <div className="hidden lg:flex items-center gap-1.5">
              {role === "admin" && (
                <select
                  value={viewAsUserId || user?.id || ""}
                  onChange={e => setViewAsUserId(e.target.value === user?.id ? null : e.target.value)}
                  className="text-xs bg-muted border border-border rounded-md px-2 py-1.5 text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 max-w-[180px]"
                  title="Supervisar usuario"
                >
                  <option value={user?.id || ""}>👤 Mis datos</option>
                  {allUsers.filter(u => u.user_id !== user?.id).map(u => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.email || u.display_name || u.user_id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              )}
              {role === "admin" && <AdminUsersPanel />}
              <button
                onClick={() => navigate("/catalog")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
              >
                <Library className="h-3.5 w-3.5" /> Catálogo
              </button>
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
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" /> Salir
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-muted text-muted-foreground"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card px-4 py-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {role === "admin" && (
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Supervisar usuario</label>
                <select
                  value={viewAsUserId || user?.id || ""}
                  onChange={e => { setViewAsUserId(e.target.value === user?.id ? null : e.target.value); setMobileMenuOpen(false); }}
                  className="w-full text-xs bg-muted border border-border rounded-md px-2 py-1.5 text-foreground"
                >
                  <option value={user?.id || ""}>👤 Mis datos</option>
                  {allUsers.filter(u => u.user_id !== user?.id).map(u => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.email || u.display_name || u.user_id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2">
              {role === "admin" && <AdminUsersPanel />}
              <button
                onClick={() => { navigate("/catalog"); setMobileMenuOpen(false); }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-secondary text-secondary-foreground text-xs font-medium"
              >
                <Library className="h-3.5 w-3.5" /> Catálogo
              </button>
              <select
                value={decimals}
                onChange={e => setDecimals(Number(e.target.value))}
                className="text-xs bg-muted border border-border rounded px-2 py-2 text-muted-foreground"
              >
                <option value={1}>.0</option>
                <option value={2}>.00</option>
                <option value={3}>.000</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{user?.email}</span>
              <button
                onClick={() => { signOut(); setMobileMenuOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-destructive/10 text-destructive text-xs font-medium"
              >
                <LogOut className="h-3.5 w-3.5" /> Salir
              </button>
            </div>
          </div>
        )}
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
            onEdit={!isSupervising ? setEditOrder : undefined}
            onDelete={!isSupervising ? handleDelete : undefined}
            onBulkDelete={!isSupervising ? handleBulkDelete : undefined}
            onBulkEdit={!isSupervising ? (ids) => setBulkEditIds(ids) : undefined}
            onUpdateEstado={!isSupervising ? handleUpdateEstado : undefined}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            decimals={decimals}
          />
        ) : (
          <ClientsView
            orders={filtered}
            onPayClient={!isSupervising ? setPayClient : () => {}}
            decimals={decimals}
            onUpdatePayment={!isSupervising ? applyPayment : () => {}}
            clientPayments={activePayments}
            getClientPaidTotal={supervisedGetClientPaidTotal}
            onDeleteGeneralPayment={!isSupervising ? deletePayment : () => {}}
            onUpdateEstado={!isSupervising ? updateEstado : () => {}}
            showEnviados={showEnviados}
            readOnly={!!isSupervising}
          />
        )}
      </main>

      {!isSupervising && (
        <>
          <EditOrderDialog order={editOrder} open={!!editOrder} onClose={() => setEditOrder(null)} onSave={(o) => { updateOrder(o); setEditOrder(null); }} estados={estados} decimals={decimals} />
          <ClientPaymentDialog orders={orders} cliente={payClient || ""} open={!!payClient} onClose={() => setPayClient(null)} onApplyPayment={applyPayment} onGeneralPayment={addPayment} decimals={decimals} generalPaidTotal={getClientPaidTotal(payClient || "")} />
          <EstadoQuickActions order={estadoOrder} open={!!estadoOrder} onClose={() => setEstadoOrder(null)} onUpdateEstado={handleEstadoConfirm} allEstados={estados} />
          <BulkEditDialog open={bulkEditIds.length > 0} onClose={() => setBulkEditIds([])} orders={selectedOrders} onApply={handleBulkEdit} onSmartEstado={handleSmartBulkEstado} estados={estados} />
        </>
      )}
    </div>
  );
};

export default Index;
