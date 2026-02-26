import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Registro exitoso", description: "Revisa tu correo para confirmar tu cuenta." });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold tracking-tight">MangaTracker</h1>
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Inicia sesión para continuar" : "Crea tu cuenta"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Correo electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
              placeholder="tu@correo.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLogin ? "Iniciar sesión" : "Registrarse"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-medium hover:underline"
          >
            {isLogin ? "Regístrate" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </div>
  );
}
