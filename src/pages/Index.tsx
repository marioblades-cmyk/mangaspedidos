import { useState, useMemo } from "react";
import { Search, Filter, BookOpen } from "lucide-react";
import { ordersData as initialOrders, Order, getStats, getUniqueEstados } from "@/data/orders";
import { StatsRow } from "@/components/StatsRow";
import { OrdersTable } from "@/components/OrdersTable";
import { AddOrderDialog } from "@/components/AddOrderDialog";
import { EditOrderDialog } from "@/components/EditOrderDialog";

const Index = () => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [editOrder, setEditOrder] = useState<Order | null>(null);

  const estados = useMemo(() => getUniqueEstados(orders), [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch = !search || o.titulo.toLowerCase().includes(search.toLowerCase()) || o.numero.includes(search);
      const matchEstado = !estadoFilter || o.estado === estadoFilter;
      return matchSearch && matchEstado;
    });
  }, [orders, search, estadoFilter]);

  const stats = useMemo(() => getStats(filtered), [filtered]);

  const nextId = () => Math.max(0, ...orders.map(o => o.id)) + 1;

  const handleAdd = (newOrders: Omit<Order, "id">[]) => {
    let id = nextId();
    const withIds = newOrders.map(o => ({ ...o, id: id++ }));
    setOrders(prev => [...prev, ...withIds]);
  };

  const handleEdit = (updated: Order) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
  };

  const handleDelete = (id: number) => {
    if (window.confirm("¿Eliminar este pedido?")) {
      setOrders(prev => prev.filter(o => o.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight">MangaTracker</h1>
              <span className="text-xs text-muted-foreground">Tienda de Mangas & Comics</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-md font-medium">
              {orders.length} pedidos
            </span>
            <AddOrderDialog onAdd={handleAdd} estados={estados} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <StatsRow stats={stats} />

        {/* Filters */}
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
        </div>

        <OrdersTable orders={filtered} onEdit={setEditOrder} onDelete={handleDelete} />
      </main>

      <EditOrderDialog
        order={editOrder}
        open={!!editOrder}
        onClose={() => setEditOrder(null)}
        onSave={handleEdit}
        estados={estados}
      />
    </div>
  );
};

export default Index;
