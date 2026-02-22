import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Order } from "@/data/orders";
import { Check, X, ArrowRight } from "lucide-react";

interface EstadoQuickActionsProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onUpdateEstado: (id: number, estado: string) => void;
}

const FLOW_OPTIONS: Record<string, { label: string; next: string; icon: React.ReactNode; variant: string }[]> = {
  "PEDIDO 9": [
    { label: "Confirmado", next: "CONFIRMADO", icon: <Check className="h-4 w-4" />, variant: "bg-success text-success-foreground" },
    { label: "No confirmado", next: "NO CONFIRMADO", icon: <X className="h-4 w-4" />, variant: "bg-destructive text-destructive-foreground" },
  ],
  "PEDIDO 10": [
    { label: "Confirmado", next: "CONFIRMADO", icon: <Check className="h-4 w-4" />, variant: "bg-success text-success-foreground" },
    { label: "No confirmado", next: "NO CONFIRMADO", icon: <X className="h-4 w-4" />, variant: "bg-destructive text-destructive-foreground" },
  ],
  "PEDIDO 11": [
    { label: "Confirmado", next: "CONFIRMADO", icon: <Check className="h-4 w-4" />, variant: "bg-success text-success-foreground" },
    { label: "No confirmado", next: "NO CONFIRMADO", icon: <X className="h-4 w-4" />, variant: "bg-destructive text-destructive-foreground" },
  ],
  "PEDIDO 21": [
    { label: "Confirmado", next: "CONFIRMADO", icon: <Check className="h-4 w-4" />, variant: "bg-success text-success-foreground" },
    { label: "No confirmado", next: "NO CONFIRMADO", icon: <X className="h-4 w-4" />, variant: "bg-destructive text-destructive-foreground" },
  ],
  "CONFIRMADO": [
    { label: "Separado", next: "SEPARADO", icon: <ArrowRight className="h-4 w-4" />, variant: "bg-success text-success-foreground" },
  ],
  "NO CONFIRMADO": [
    { label: "Volver a pedir", next: "", icon: <ArrowRight className="h-4 w-4" />, variant: "bg-info text-info-foreground" },
  ],
};

export function EstadoQuickActions({ order, open, onClose, onUpdateEstado }: EstadoQuickActionsProps) {
  if (!order) return null;

  const options = FLOW_OPTIONS[order.estado];
  if (!options) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Cambiar estado</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{order.titulo}</span> — Estado actual: <span className="font-medium">{order.estado}</span>
          </p>
          <div className="flex flex-col gap-2">
            {options.map(opt => (
              <Button
                key={opt.next}
                onClick={() => { onUpdateEstado(order.id, opt.next); onClose(); }}
                className={`gap-2 ${opt.variant}`}
              >
                {opt.icon} {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
