import { useState, useMemo } from "react";
import { Search, Filter, BookOpen } from "lucide-react";
import { ordersData, getStats, getUniqueEstados } from "@/data/orders";
import { StatsRow } from "@/components/StatsRow";
import { OrdersTable } from "@/components/OrdersTable";

const Index = () => {
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");

  const estados = useMemo(() => getUniqueEstados(ordersData), []);

  const filtered = useMemo(() => {
    return ordersData.filter((o) => {
      const matchSearch = !search || o.titulo.toLowerCase().includes(search.toLowerCase()) || o.numero.includes(search);
      const matchEstado = !estadoFilter || o.estado === estadoFilter;
      return matchSearch && matchEstado;
    });
  }, [search, estadoFilter]);

  const stats = useMemo(() => getStats(filtered), [filtered]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="h-6 w-6" />
            <h1 className="text-xl font-display font-bold tracking-tight">MangaTracker</h1>
          </div>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">
            {ordersData.length} pedidos
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
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

        {/* Table */}
        <OrdersTable orders={filtered} />
      </main>
    </div>
  );
};

export default Index;
