import { Package, DollarSign, CreditCard, AlertCircle } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: "default" | "success" | "warning" | "primary";
}

const variantStyles = {
  default: "border-border bg-card",
  success: "border-success/20 bg-success/5 glow-success",
  warning: "border-warning/20 bg-warning/5 glow-warning",
  primary: "border-primary/20 bg-primary/5 glow-primary",
};

const iconStyles = {
  default: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  primary: "text-primary",
};

export function StatCard({ title, value, subtitle, icon, variant = "default" }: StatCardProps) {
  return (
    <div className={`rounded-lg border px-4 py-2 sm:p-5 transition-all flex items-center gap-3 sm:block ${variantStyles[variant]}`}>
      <span className={`${iconStyles[variant]} sm:hidden`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="hidden sm:flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <span className={iconStyles[variant]}>{icon}</span>
        </div>
        <div className="flex items-baseline gap-2 sm:block">
          <p className="text-base sm:text-2xl font-display font-bold tracking-tight whitespace-nowrap">{value}</p>
          <span className="text-[10px] sm:hidden text-muted-foreground truncate">{title}</span>
        </div>
        {subtitle && <p className="text-[10px] sm:text-xs text-muted-foreground mt-0 sm:mt-1 hidden sm:block">{subtitle}</p>}
      </div>
    </div>
  );
}

export function StatsRow({ stats, decimals = 1 }: { stats: { totalPedidos: number; totalVentas: number; totalPagado: number; totalSaldo: number; pagados: number; pendientes: number }; decimals?: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 lg:gap-4">
      <StatCard
        title="Total Pedidos"
        value={stats.totalPedidos.toString()}
        subtitle={`${stats.pagados} pagados · ${stats.pendientes} pendientes`}
        icon={<Package className="h-5 w-5" />}
        variant="primary"
      />
      <div className="hidden lg:block">
        <StatCard
          title="Ventas Totales"
          value={`Bs ${stats.totalVentas.toFixed(decimals)}`}
          icon={<DollarSign className="h-5 w-5" />}
          variant="default"
        />
      </div>
      <div className="hidden lg:block">
        <StatCard
          title="Total Cobrado"
          value={`Bs ${stats.totalPagado.toFixed(decimals)}`}
          icon={<CreditCard className="h-5 w-5" />}
          variant="success"
        />
      </div>
      <div className="hidden lg:block">
        <StatCard
          title="Saldo Pendiente"
          value={`Bs ${stats.totalSaldo.toFixed(decimals)}`}
          icon={<AlertCircle className="h-5 w-5" />}
          variant="warning"
        />
      </div>
    </div>
  );
}
