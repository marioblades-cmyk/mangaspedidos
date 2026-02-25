import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Order, ordersData as seedData, getStats, getUniqueEstados } from "@/data/orders";
import { useToast } from "@/hooks/use-toast";

// Map DB row (snake_case) → frontend Order (camelCase)
function rowToOrder(row: any): Order {
  return {
    id: row.id,
    titulo: row.titulo,
    tipo: row.tipo,
    precioVendido: row.precio_vendido,
    precioRegular: row.precio_regular,
    pago: row.pago,
    saldo: row.saldo,
    numero: row.numero,
    estado: row.estado,
    nota: row.nota,
  };
}

// Map frontend Order → DB insert (snake_case, no id)
function orderToInsert(o: Omit<Order, "id">) {
  return {
    titulo: o.titulo,
    tipo: o.tipo,
    precio_vendido: o.precioVendido,
    precio_regular: o.precioRegular,
    pago: o.pago,
    saldo: o.saldo,
    numero: o.numero,
    estado: o.estado,
    nota: o.nota,
  };
}

function orderToUpdate(o: Order) {
  return {
    titulo: o.titulo,
    tipo: o.tipo,
    precio_vendido: o.precioVendido,
    precio_regular: o.precioRegular,
    pago: o.pago,
    saldo: o.saldo,
    numero: o.numero,
    estado: o.estado,
    nota: o.nota,
  };
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const showError = useCallback((msg: string) => {
    toast({ title: "Error", description: msg, variant: "destructive" });
  }, [toast]);

  // Fetch all orders
  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase.from("orders").select("*").order("id");
    if (error) {
      showError("Error al cargar pedidos");
      console.error(error);
      return [];
    }
    return (data || []).map(rowToOrder);
  }, [showError]);

  // Initial load + seed if empty
  useEffect(() => {
    (async () => {
      setLoading(true);
      let fetched = await fetchOrders();
      if (fetched.length === 0) {
        // Seed from local data
        const inserts = seedData.map(({ id, ...rest }) => orderToInsert(rest));
        const { error } = await supabase.from("orders").insert(inserts);
        if (error) {
          console.error("Seed error:", error);
          showError("Error al sembrar datos iniciales");
        } else {
          fetched = await fetchOrders();
        }
      }
      setOrders(fetched);
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addOrders = useCallback(async (newOrders: Omit<Order, "id">[]) => {
    const inserts = newOrders.map(orderToInsert);
    const { data, error } = await supabase.from("orders").insert(inserts).select();
    if (error) { showError("Error al agregar pedidos"); return; }
    setOrders(prev => [...prev, ...(data || []).map(rowToOrder)]);
  }, [showError]);

  const updateOrder = useCallback(async (updated: Order) => {
    const { error } = await supabase.from("orders").update(orderToUpdate(updated)).eq("id", updated.id);
    if (error) { showError("Error al actualizar pedido"); return; }
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
  }, [showError]);

  const deleteOrder = useCallback(async (id: number) => {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) { showError("Error al eliminar pedido"); return; }
    setOrders(prev => prev.filter(o => o.id !== id));
  }, [showError]);

  const deleteMany = useCallback(async (ids: number[]) => {
    const { error } = await supabase.from("orders").delete().in("id", ids);
    if (error) { showError("Error al eliminar pedidos"); return; }
    setOrders(prev => prev.filter(o => !ids.includes(o.id)));
  }, [showError]);

  const updateEstado = useCallback(async (id: number, estado: string) => {
    const { error } = await supabase.from("orders").update({ estado }).eq("id", id);
    if (error) { showError("Error al actualizar estado"); return; }
    setOrders(prev => prev.map(o => o.id === id ? { ...o, estado } : o));
  }, [showError]);

  const applyPayment = useCallback(async (updates: { id: number; pago: number; saldo: number }[]) => {
    // Update each in parallel
    const results = await Promise.all(
      updates.map(u => supabase.from("orders").update({ pago: u.pago, saldo: u.saldo }).eq("id", u.id))
    );
    const hasError = results.some(r => r.error);
    if (hasError) { showError("Error al aplicar pagos"); return; }
    setOrders(prev => prev.map(o => {
      const u = updates.find(u => u.id === o.id);
      return u ? { ...o, pago: u.pago, saldo: u.saldo } : o;
    }));
  }, [showError]);

  const bulkEdit = useCallback(async (ids: number[], changes: { estado?: string; tipo?: string }) => {
    const updateData: any = {};
    if (changes.estado !== undefined) updateData.estado = changes.estado;
    if (changes.tipo !== undefined) updateData.tipo = changes.tipo;
    const { error } = await supabase.from("orders").update(updateData).in("id", ids);
    if (error) { showError("Error al editar en masa"); return; }
    setOrders(prev => prev.map(o => {
      if (!ids.includes(o.id)) return o;
      const updated = { ...o };
      if (changes.estado !== undefined) updated.estado = changes.estado;
      if (changes.tipo !== undefined) updated.tipo = changes.tipo;
      return updated;
    }));
  }, [showError]);

  const bulkEditIndividual = useCallback(async (updates: { id: number; estado: string }[]) => {
    const results = await Promise.all(
      updates.map(u => supabase.from("orders").update({ estado: u.estado }).eq("id", u.id))
    );
    const hasError = results.some(r => r.error);
    if (hasError) { showError("Error al editar estados"); return; }
    setOrders(prev => prev.map(o => {
      const u = updates.find(u => u.id === o.id);
      return u ? { ...o, estado: u.estado } : o;
    }));
  }, [showError]);

  const estados = useMemo(() => getUniqueEstados(orders), [orders]);

  return {
    orders, loading, estados,
    addOrders, updateOrder, deleteOrder, deleteMany,
    updateEstado, applyPayment, bulkEdit, bulkEditIndividual,
    getStats: (filtered: Order[]) => getStats(filtered),
  };
}
