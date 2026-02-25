import { useState } from "react";
import { MessageCircle, Send, DollarSign, FileText } from "lucide-react";
import { Order } from "@/data/orders";
import { ClientPayment } from "@/hooks/useClientPayments";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

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

  const digits = numero.replace(/\D/g, "");
  const phone = digits.startsWith("591") ? digits : `591${digits}`;

  const separados = items.filter(o => (o.estado || "").toUpperCase().includes("SEPARADO"));
  const pedidos = items.filter(o => /PEDIDO\s*\d/i.test(o.estado || "") || (o.estado || "").toUpperCase().includes("CONFIRMADO"));
  const totalPrecio = items.reduce((s, o) => s + (o.precioVendido ?? 0), 0);
  const totalPagado = items.reduce((s, o) => s + (o.pago ?? 0), 0) + generalPaid;
  const lastPayment = clientPayments.length > 0 ? clientPayments[0] : null;

  const hasSeparados = separados.length > 0;
  const hasGeneralPayments = clientPayments.length > 0;

  const itemLine = (o: Order) => `- ${o.titulo}: P. Vendido: Bs ${fmt(o.precioVendido ?? 0)} | Pago: Bs ${fmt(o.pago ?? 0)} | Saldo: Bs ${fmt(o.saldo ?? 0)}`;

  const historialAbonos = () => {
    if (clientPayments.length === 0) return "";
    const lines = clientPayments.map((p, i) => `  ${i + 1}. Bs ${fmt(p.monto)}${p.nota ? ` (${p.nota})` : ""}`).join("\n");
    return `\nHistorial de Abonos:\n${lines}`;
  };

  const buildAviso = () => {
    const detalle = separados.map(itemLine).join("\n");
    return `¡Hola! Tus pedidos ya están listos para entrega. Detalle de tu cuenta:\n\n${detalle}${historialAbonos()}\n\nSaldo Total: Bs ${fmt(saldoAjustado)}\n\nResponde a este mensaje para coordinar el envío o la entrega en local.`;
  };

  const buildConfirmacion = () => {
    const allItems = items.filter(o => o.estado !== "ENVIADO").map(itemLine).join("\n");
    return `¡Hola! Hemos registrado tu nuevo abono a cuenta. Detalle actualizado:\n\nAbono Recibido: Bs ${fmt(lastPayment?.monto ?? 0)}\n\nDetalle de Pedidos:\n${allItems}${historialAbonos()}\n\nSaldo Total Pendiente: Bs ${fmt(saldoAjustado)}\n\n¡Gracias por tu pago!`;
  };

  const buildGeneral = () => {
    const sepList = separados.length > 0 ? `Listos para entrega:\n${separados.map(itemLine).join("\n")}` : "Listos para entrega: Ninguno";
    const pedList = pedidos.length > 0 ? `En camino:\n${pedidos.map(itemLine).join("\n")}` : "En camino: Ninguno";
    const totalPago = items.reduce((s, o) => s + (o.pago ?? 0), 0) + generalPaid;
    return `¡Hola! Este es tu resumen de cuenta actualizado:\n\n${sepList}\n\n${pedList}\n\nResumen Financiero:\nTotal en Libros: Bs ${fmt(totalPrecio)} | Total Pago: Bs ${fmt(totalPago)}\nSaldo Actual: Bs ${fmt(saldoAjustado)}\n\n¡Cualquier duda me avisas!`;
  };

  const waUrl = (msg: string) => `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[hsl(142,70%,45%)] text-white text-xs font-medium hover:bg-[hsl(142,70%,40%)] transition-colors"
          title="Enviar mensaje por WhatsApp"
        >
          <MessageCircle className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0 z-[100]">
        <div className="px-3 py-2 border-b border-border bg-muted/40">
          <span className="text-xs font-semibold">Enviar por WhatsApp</span>
        </div>
        <div className="p-1.5 space-y-1">
          {hasSeparados ? (
            <a
              href={waUrl(buildAviso())}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-md text-left hover:bg-muted/50 transition-colors no-underline text-foreground"
            >
              <Send className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium">Aviso de Entrega</p>
                <p className="text-[10px] text-muted-foreground">{separados.length} ítem(s) listos</p>
              </div>
            </a>
          ) : (
            <div className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-md text-left opacity-40 cursor-not-allowed">
              <Send className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium">Aviso de Entrega</p>
                <p className="text-[10px] text-muted-foreground">Sin ítems separados</p>
              </div>
            </div>
          )}
          {hasGeneralPayments ? (
            <a
              href={waUrl(buildConfirmacion())}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-md text-left hover:bg-muted/50 transition-colors no-underline text-foreground"
            >
              <DollarSign className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium">Confirmación de Pago</p>
                <p className="text-[10px] text-muted-foreground">Último: Bs {fmt(lastPayment!.monto)}</p>
              </div>
            </a>
          ) : (
            <div className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-md text-left opacity-40 cursor-not-allowed">
              <DollarSign className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium">Confirmación de Pago</p>
                <p className="text-[10px] text-muted-foreground">Sin pagos generales</p>
              </div>
            </div>
          )}
          <a
            href={waUrl(buildGeneral())}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-md text-left hover:bg-muted/50 transition-colors no-underline text-foreground"
          >
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium">Estado General</p>
              <p className="text-[10px] text-muted-foreground">Resumen completo del cliente</p>
            </div>
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
