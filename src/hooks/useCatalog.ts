import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface CatalogProduct {
  id: number;
  titulo: string;
  tomo: string;
  editorial: string;
  isbn: string;
  precio_costo_ars: number | null;
  estado: string; // Disponible / No figura en el catálogo actual
  estado_publicacion: string; // En curso / Completo / Tomo Único
  identificador_unico: string;
  last_seen_at: string;
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
    }
    setProducts((data as any[]) || []);
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
      
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-catalog-excel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: formData,
        }
      );

      const result = await res.json();
      if (!res.ok || result.error) {
        toast({ title: "Error", description: result.error || "Error al procesar Excel", variant: "destructive" });
        return null;
      }

      toast({ title: "Catálogo actualizado", description: `${result.summary.inserted} nuevos, ${result.summary.updated} actualizados, ${result.summary.disappeared} desaparecidos` });
      await fetchProducts();
      return result.summary;
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      return null;
    } finally {
      setUploading(false);
    }
  }, [user, toast, fetchProducts]);

  const deleteProduct = useCallback(async (id: number) => {
    const { error } = await supabase.from("catalog_products").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar el producto", variant: "destructive" });
      return;
    }
    setProducts(prev => prev.filter(p => p.id !== id));
  }, [toast]);

  const deleteProducts = useCallback(async (ids: number[]) => {
    const { error } = await supabase.from("catalog_products").delete().in("id", ids);
    if (error) {
      toast({ title: "Error", description: "No se pudieron eliminar los productos", variant: "destructive" });
      return;
    }
    setProducts(prev => prev.filter(p => !ids.includes(p.id)));
    toast({ title: "Eliminados", description: `${ids.length} producto(s) eliminados` });
  }, [toast]);

  const deleteAllProducts = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase.from("catalog_products").delete().eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: "No se pudo vaciar el catálogo", variant: "destructive" });
      return;
    }
    setProducts([]);
    toast({ title: "Catálogo vaciado", description: "Todos los productos fueron eliminados" });
  }, [user, toast]);

  return { products, loading, uploading, uploadExcel, deleteProduct, deleteProducts, deleteAllProducts, refetch: fetchProducts };
}
