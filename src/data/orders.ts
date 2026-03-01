export interface Order {
  id: number;
  titulo: string;
  tipo: string;
  precioVendido: number | null;
  precioRegular: number | null;
  pago: number | null;
  saldo: number | null;
  numero: string;
  estado: string;
  nota: string;
}

export function getStats(orders: Order[]) {
  const totalPedidos = orders.length;
  const totalVentas = orders.reduce((sum, o) => sum + (o.precioVendido || 0), 0);
  const totalPagado = orders.reduce((sum, o) => sum + (o.pago || 0), 0);
  const totalSaldo = orders.reduce((sum, o) => sum + (o.saldo || 0), 0);
  const pagados = orders.filter(o => o.saldo === 0 && o.precioVendido).length;
  const pendientes = orders.filter(o => (o.saldo ?? 0) > 0).length;
  
  return { totalPedidos, totalVentas, totalPagado, totalSaldo, pagados, pendientes };
}

export function getUniqueEstados(orders: Order[]): string[] {
  return [...new Set(orders.map(o => o.estado).filter(Boolean))];
}
