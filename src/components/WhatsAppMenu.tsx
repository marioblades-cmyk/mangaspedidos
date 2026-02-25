import { useState } from "react";
import { MessageCircle, Send, DollarSign, FileText, X } from "lucide-react";
import { Order } from "@/data/orders";
import { ClientPayment } from "@/hooks/useClientPayments";

interface WhatsAppMenuProps {
  numero: string;
  items: Order[];
  clientPayments: ClientPayment[];
  generalPaid: number;
  saldoAjustado: number;
  decimals: number;
}

export function WhatsAppMenu({ numero, items, clientPayments, generalPaid, saldoAjustado, decimals }: WhatsAppMenuProps) {
  const [open, setOpen] = useState(false);
  const fmt = (v: number) => v.toFixed(decimals);

  const separados = items.filter(o => (o.estado || "").toUpperCase().includes("SEPARADO"));
  const pedidos = items.filter(o => /PEDIDO\s*\d/i.test(o.estado || "") || (o.estado || "").toUpperCase().includes("CONFIRMADO"));
  const totalPrecio = items.reduce((s, o) => s + (o.precioVendido ?? 0), 0);
  const totalPagado = items.reduce((s, o) => s + (o.pago ?? 0), 0) + generalPaid;
  const lastPayment = clientPayments.length > 0 ? clientPayments[0] : null;

  const hasSeparados = separados.length > 0;
  const hasGeneralPayments = clientPayments.length > 0;

  const listItems = (list: Order[]) => list.map(o => `• ${o.titulo}`).join("\n");

  const saldoSeparados = separados.reduce((s, o) => s + (o.saldo ?? 0), 0);

  const buildAviso = () => {
    const msg = `¡Hola! Tus pedidos ya están listos en MangaTracker 📚.\n${listItems(separados)}\nSaldo total a pagar: Bs ${fmt(saldoAjustado > 0 ? Math.min(saldoAjustado, saldoSeparados) : saldoSeparados)}.\nResponde a este mensaje para coordinar el envío o la entrega en local.`;
    return msg;
  };

  const buildConfirmacion = () => {
    const itemDetail = items
      .filter(o => o.estado !== "ENVIADO")
      .map(o => `• ${o.titulo}: Bs ${fmt(o.saldo ?? 0)}`)
      .join("\n");
    const msg = `¡Hola! Registramos tu pago de Bs ${fmt(lastPayment?.monto ?? 0)} en MangaTracker 💰.\nDetalle de cuenta:\n${itemDetail}\nSaldo pendiente final: Bs ${fmt(saldoAjustado)}.\n¡Gracias!`;
    return msg;
  };

  const buildGeneral = () => {
    const separadosList = separados.length > 0 ? `Listos para entrega:\n${listItems(separados)}` : "Listos para entrega: Ninguno";
    const pedidosList = pedidos.length > 0 ? `En camino:\n${listItems(pedidos)}` : "En camino: Ninguno";
    const msg = `¡Hola! Tu resumen en MangaTracker 📝:\n${separadosList}\n${pedidosList}\nTotal Libros: Bs ${fmt(totalPrecio)}.\nTotal Pagado: Bs ${fmt(totalPagado)}.\nSaldo Actual: Bs ${fmt(saldoAjustado)}.`;
    return msg;
  };

  const sendWhatsApp = (message: string) => {
    const phone = numero.replace(/\D/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[hsl(142,70%,45%)] text-white text-xs font-medium hover:bg-[hsl(142,70%,40%)] transition-colors"
        title="Enviar mensaje por WhatsApp"
      >
        <MessageCircle className="h-3.5 w-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40">
              <span className="text-xs font-semibold">Enviar por WhatsApp</span>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-1.5 space-y-1">
              {/* Aviso de Entrega */}
              <button
                disabled={!hasSeparados}
                onClick={() => sendWhatsApp(buildAviso())}
                className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-md text-left hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium">Aviso de Entrega</p>
                  <p className="text-[10px] text-muted-foreground">{hasSeparados ? `${separados.length} ítem(s) listos` : "Sin ítems separados"}</p>
                </div>
              </button>

              {/* Confirmación de Pago */}
              <button
                disabled={!hasGeneralPayments}
                onClick={() => sendWhatsApp(buildConfirmacion())}
                className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-md text-left hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <DollarSign className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium">Confirmación de Pago</p>
                  <p className="text-[10px] text-muted-foreground">{hasGeneralPayments ? `Último: Bs ${fmt(lastPayment!.monto)}` : "Sin pagos generales"}</p>
                </div>
              </button>

              {/* Estado General */}
              <button
                onClick={() => sendWhatsApp(buildGeneral())}
                className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-md text-left hover:bg-muted/50 transition-colors"
              >
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium">Estado General</p>
                  <p className="text-[10px] text-muted-foreground">Resumen completo del cliente</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
