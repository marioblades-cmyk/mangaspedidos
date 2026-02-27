import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface ClientPayment {
  id: number;
  numero: string;
  monto: number;
  nota: string;
  created_at: string;
}

export function useClientPayments() {
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const showError = useCallback((msg: string) => {
    toast({ title: "Error", description: msg, variant: "destructive" });
  }, [toast]);

  const showSuccess = useCallback((msg: string) => {
    toast({ title: "Éxito", description: msg });
  }, [toast]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("client_payments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (cancelled) return;
        if (error) { showError("Error al cargar pagos generales"); return; }
        setPayments((data || []) as ClientPayment[]);
      } catch (e) {
        if (!cancelled) showError("Error de conexión al cargar pagos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, showError]);

  const addPayment = useCallback(async (numero: string, monto: number, nota?: string) => {
    if (!user) {
      showError("Debes iniciar sesión para registrar pagos");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("client_payments")
        .insert({ numero, monto, nota: nota || "", user_id: user.id })
        .select();
      if (error) {
        console.error("Error al registrar pago general:", error);
        showError("Error al registrar pago general: " + (error.message || "desconocido"));
        return;
      }
      setPayments(prev => [...(data as ClientPayment[]), ...prev]);
      showSuccess(`Pago general de Bs ${monto} registrado`);
    } catch (e: any) {
      console.error("Error de conexión al registrar pago:", e);
      showError("Error de conexión al registrar pago");
    }
  }, [showError, showSuccess, user]);

  const deletePayment = useCallback(async (id: number) => {
    try {
      const { error } = await supabase.from("client_payments").delete().eq("id", id);
      if (error) { showError("Error al eliminar pago: " + (error.message || "desconocido")); return; }
      setPayments(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      showError("Error de conexión al eliminar pago");
    }
  }, [showError]);

  const getClientPayments = useCallback((numero: string) => {
    return payments.filter(p => p.numero === numero);
  }, [payments]);

  const getClientPaidTotal = useCallback((numero: string) => {
    return payments.filter(p => p.numero === numero).reduce((s, p) => s + p.monto, 0);
  }, [payments]);

  return { payments, loading, addPayment, deletePayment, getClientPayments, getClientPaidTotal };
}
