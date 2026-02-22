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
    <div className={`rounded-lg border p-5 transition-all ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <span className={iconStyles[variant]}>{icon}</span>
      </div>
      <p className="text-2xl font-display font-bold tracking-tight">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

export function StatsRow({ stats }: { stats: { totalPedidos: number; totalVentas: number; totalPagado: number; totalSaldo: number; pagados: number; pendientes: number } }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Pedidos"
        value={stats.totalPedidos.toString()}
        subtitle={`${stats.pagados} pagados · ${stats.pendientes} pendientes`}
        icon={<Package className="h-5 w-5" />}
        variant="primary"
      />
      <StatCard
        title="Ventas Totales"
        value={`Bs ${stats.totalVentas.toFixed(0)}`}
        icon={<DollarSign className="h-5 w-5" />}
        variant="default"
      />
      <StatCard
        title="Total Cobrado"
        value={`Bs ${stats.totalPagado.toFixed(0)}`}
        icon={<CreditCard className="h-5 w-5" />}
        variant="success"
      />
      <StatCard
        title="Saldo Pendiente"
        value={`Bs ${stats.totalSaldo.toFixed(0)}`}
        icon={<AlertCircle className="h-5 w-5" />}
        variant="warning"
      />
    </div>
  );
}
