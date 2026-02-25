import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ClientPayment {
  id: number;
  numero: string;
  monto: number;
  nota: string;
  created_at: string;
}

export function useClientPayments() {
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const { toast } = useToast();

  const showError = useCallback((msg: string) => {
    toast({ title: "Error", description: msg, variant: "destructive" });
  }, [toast]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("client_payments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) { showError("Error al cargar pagos generales"); return; }
      setPayments((data || []) as ClientPayment[]);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addPayment = useCallback(async (numero: string, monto: number, nota?: string) => {
    const { data, error } = await supabase
      .from("client_payments")
      .insert({ numero, monto, nota: nota || "" })
      .select();
    if (error) { showError("Error al registrar pago general"); return; }
    setPayments(prev => [...(data as ClientPayment[]), ...prev]);
  }, [showError]);

  const deletePayment = useCallback(async (id: number) => {
    const { error } = await supabase.from("client_payments").delete().eq("id", id);
    if (error) { showError("Error al eliminar pago"); return; }
    setPayments(prev => prev.filter(p => p.id !== id));
  }, [showError]);

  const getClientPayments = useCallback((numero: string) => {
    return payments.filter(p => p.numero === numero);
  }, [payments]);

  const getClientPaidTotal = useCallback((numero: string) => {
    return payments.filter(p => p.numero === numero).reduce((s, p) => s + p.monto, 0);
  }, [payments]);

  return { payments, addPayment, deletePayment, getClientPayments, getClientPaidTotal };
}
