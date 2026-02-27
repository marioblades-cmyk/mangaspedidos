import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, Trash2, Pencil, Shield, User, Loader2, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ManagedUser {
  user_id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  role: string;
}

export function AdminUsersPanel() {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-manage-users", {
      body: { action: "list" },
    });
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || "Error al cargar usuarios", variant: "destructive" });
    } else {
      setUsers(data.users || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchUsers();
  }, [open]);

  const handleDelete = async (userId: string, email: string) => {
    if (!window.confirm(`¿Eliminar al usuario ${email}? Se borrarán TODOS sus datos (pedidos, pagos, catálogo). Esta acción no se puede deshacer.`)) return;
    setActionLoading(userId);
    const { data, error } = await supabase.functions.invoke("admin-manage-users", {
      body: { action: "delete", user_id: userId },
    });
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || "Error al eliminar", variant: "destructive" });
    } else {
      toast({ title: "Usuario eliminado", description: `${email} fue eliminado correctamente.` });
      setUsers(prev => prev.filter(u => u.user_id !== userId));
    }
    setActionLoading(null);
  };

  const startEdit = (user: ManagedUser) => {
    setEditingId(user.user_id);
    setEditName(user.display_name || "");
    setEditRole(user.role);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditRole("");
  };

  const saveEdit = async (userId: string) => {
    setActionLoading(userId);
    const { data, error } = await supabase.functions.invoke("admin-manage-users", {
      body: {
        action: "update",
        user_id: userId,
        updates: { display_name: editName, role: editRole },
      },
    });
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || "Error al actualizar", variant: "destructive" });
    } else {
      toast({ title: "Actualizado", description: "Usuario actualizado correctamente." });
      setUsers(prev => prev.map(u =>
        u.user_id === userId ? { ...u, display_name: editName, role: editRole } : u
      ));
      setEditingId(null);
    }
    setActionLoading(null);
  };

  const inputClass = "w-full px-2 py-1.5 rounded border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors w-full sm:w-auto justify-center">
          <Users className="h-3.5 w-3.5" /> Gestionar Usuarios
        </button>
      </DialogTrigger>
      <DialogContent className="w-[98vw] sm:w-[96vw] max-w-3xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-base sm:text-xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Gestión de Usuarios
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            <p className="text-xs text-muted-foreground">{users.length} usuario(s) registrado(s)</p>

            {/* Mobile: cards */}
            <div className="sm:hidden space-y-2 max-h-[65vh] overflow-y-auto">
              {users.map(user => (
                <div key={user.user_id} className="border border-border rounded-lg p-3 bg-card space-y-2">
                  {editingId === user.user_id ? (
                    <>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Nombre</label>
                        <input value={editName} onChange={e => setEditName(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Rol</label>
                        <select value={editRole} onChange={e => setEditRole(e.target.value)} className={inputClass}>
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(user.user_id)} disabled={actionLoading === user.user_id} className="flex-1 gap-1 text-xs">
                          <Save className="h-3 w-3" /> Guardar
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-1 text-xs">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                          <p className="text-xs text-muted-foreground">{user.display_name || "Sin nombre"}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${user.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Registrado: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(user)} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80">
                          <Pencil className="h-3 w-3" /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(user.user_id, user.email)}
                          disabled={actionLoading === user.user_id}
                          className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80"
                        >
                          {actionLoading === user.user_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Eliminar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground text-xs">Email</th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground text-xs">Nombre</th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground text-xs">Rol</th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground text-xs">Registro</th>
                    <th className="px-3 py-2 text-right font-semibold text-muted-foreground text-xs">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.user_id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 text-xs">{user.email}</td>
                      <td className="px-3 py-2 text-xs">
                        {editingId === user.user_id ? (
                          <input value={editName} onChange={e => setEditName(e.target.value)} className="px-2 py-1 rounded border border-border bg-card text-xs w-full max-w-[160px]" />
                        ) : (
                          <span className="text-muted-foreground">{user.display_name || "—"}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {editingId === user.user_id ? (
                          <select value={editRole} onChange={e => setEditRole(e.target.value)} className="px-2 py-1 rounded border border-border bg-card text-xs">
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${user.role === "admin" ? "text-primary" : "text-muted-foreground"}`}>
                            {user.role === "admin" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {editingId === user.user_id ? (
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" onClick={() => saveEdit(user.user_id)} disabled={actionLoading === user.user_id} className="h-7 text-xs gap-1">
                              <Save className="h-3 w-3" /> Guardar
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit} className="h-7 text-xs">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => startEdit(user)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(user.user_id, user.email)}
                              disabled={actionLoading === user.user_id}
                              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              {actionLoading === user.user_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
