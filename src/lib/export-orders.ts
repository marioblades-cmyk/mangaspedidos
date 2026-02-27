import * as XLSX from "xlsx";
import type { Order } from "@/data/orders";

export function exportOrdersToExcel(orders: Order[], filename?: string) {
  const rows = orders.map((o) => ({
    Título: o.titulo,
    Tipo: o.tipo,
    "Nº Cliente": o.numero,
    Estado: o.estado,
    "Precio Vendido": o.precioVendido ?? "",
    "Precio Regular": o.precioRegular ?? "",
    Pago: o.pago ?? "",
    Saldo: o.saldo ?? "",
    Nota: o.nota,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-width columns
  const colWidths = Object.keys(rows[0] || {}).map((key) => {
    const maxLen = Math.max(
      key.length,
      ...rows.map((r) => String((r as Record<string, unknown>)[key] ?? "").length)
    );
    return { wch: Math.min(maxLen + 2, 40) };
  });
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pedidos");
  XLSX.writeFile(wb, filename || `pedidos_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
