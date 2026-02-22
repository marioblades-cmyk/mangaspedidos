import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BulkEditDialogProps {
  open: boolean;
  onClose: () => void;
  count: number;
  onApply: (changes: { estado?: string; tipo?: string }) => void;
  estados: string[];
}

export function BulkEditDialog({ open, onClose, count, onApply, estados }: BulkEditDialogProps) {
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [changeEstado, setChangeEstado] = useState(false);
  const [changeTipo, setChangeTipo] = useState(false);

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";
  const labelClass = "text-xs font-semibold text-muted-foreground uppercase tracking-wider";

  const handleApply = () => {
    const changes: { estado?: string; tipo?: string } = {};
    if (changeEstado) changes.estado = estado;
    if (changeTipo) changes.tipo = tipo;
    onApply(changes);
    resetAndClose();
  };

  const resetAndClose = () => {
    setEstado("");
    setTipo("");
    setChangeEstado(false);
    setChangeTipo(false);
    onClose();
  };

  const hasChanges = changeEstado || changeTipo;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && resetAndClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Editar {count} pedido(s)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-muted-foreground">
            Selecciona los campos que deseas cambiar para todos los pedidos seleccionados.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={changeEstado}
                onChange={e => setChangeEstado(e.target.checked)}
                className="mt-2 h-4 w-4 rounded border-border accent-primary"
              />
              <div className="flex-1">
                <label className={labelClass}>Estado</label>
                <input
                  list="bulk-estados-list"
                  value={estado}
                  onChange={e => setEstado(e.target.value)}
                  placeholder="Escribir estado..."
                  disabled={!changeEstado}
                  className={`${inputClass} ${!changeEstado ? 'opacity-50' : ''}`}
                />
                <datalist id="bulk-estados-list">
                  {estados.map(e => <option key={e} value={e} />)}
                </datalist>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={changeTipo}
                onChange={e => setChangeTipo(e.target.checked)}
                className="mt-2 h-4 w-4 rounded border-border accent-primary"
              />
              <div className="flex-1">
                <label className={labelClass}>Tipo</label>
                <select
                  value={tipo}
                  onChange={e => setTipo(e.target.value)}
                  disabled={!changeTipo}
                  className={`${inputClass} ${!changeTipo ? 'opacity-50' : ''}`}
                >
                  <option value="">Sin tipo</option>
                  <option value="PRE VENTA">PRE VENTA</option>
                  <option value="RESERVA">RESERVA</option>
                  <option value="CAMBIO">CAMBIO</option>
                </select>
              </div>
            </div>
          </div>

          <Button
            onClick={handleApply}
            disabled={!hasChanges}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Aplicar a {count} pedido(s)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
