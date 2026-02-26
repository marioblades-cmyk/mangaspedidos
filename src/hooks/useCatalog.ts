import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface CatalogProduct {
  id: number;
  titulo: string;
  isbn: string;
  editorial: string;
  precio_costo_ars: number | null;
  estado: string;
  identificador_unico: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export function useCatalog() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("catalog_products")
      .select("*")
      .eq("user_id", user.id)
      .order("titulo");
    if (error) {
      toast({ title: "Error", description: "Error al cargar catálogo", variant: "destructive" });
      console.error(error);
    }
    setProducts((data as CatalogProduct[]) || []);
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const uploadExcel = useCallback(async (file: File) => {
    if (!user) return null;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-catalog-excel`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const result = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: result.error || "Error al procesar archivo", variant: "destructive" });
        return null;
      }

      toast({ title: "Catálogo actualizado", description: `${result.nuevos} nuevos, ${result.actualizados} actualizados, ${result.recuperados} recuperados, ${result.desaparecidos} desaparecidos` });
      await fetchProducts();
      return result;
    } catch (err) {
      toast({ title: "Error", description: "Error de conexión", variant: "destructive" });
      return null;
    } finally {
      setUploading(false);
    }
  }, [user, toast, fetchProducts]);

  const searchCatalog = useCallback(async (query: string): Promise<CatalogProduct[]> => {
    if (!user || !query.trim()) return [];
    const { data } = await supabase
      .from("catalog_products")
      .select("*")
      .eq("user_id", user.id)
      .eq("estado", "Disponible")
      .ilike("titulo", `%${query}%`)
      .limit(10);
    return (data as CatalogProduct[]) || [];
  }, [user]);

  return { products, loading, uploading, uploadExcel, searchCatalog, fetchProducts };
}
