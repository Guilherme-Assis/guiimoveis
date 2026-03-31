import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      navigate("/admin");
    } catch (err: any) {
      toast({
        title: "Erro ao entrar",
        description: err.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md border border-border bg-card p-8">
        <Link to="/" className="mb-8 block text-center">
          <span className="font-display text-3xl font-bold text-gradient-gold">ÉLITE</span>
          <span className="ml-2 font-body text-xs uppercase tracking-[0.2em] text-muted-foreground">Imóveis</span>
        </Link>

        <h1 className="mb-2 text-center font-display text-2xl font-semibold text-foreground">Área Restrita</h1>
        <p className="mb-8 text-center font-body text-sm text-muted-foreground">Acesse o painel de administração</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="font-body text-sm text-foreground">E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-body text-sm text-foreground">Senha</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="border-border bg-secondary pr-10 text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-gold font-body text-sm font-semibold uppercase tracking-wider text-primary-foreground hover:shadow-[var(--shadow-gold)]"
          >
            {loading ? "Entrando..." : <><LogIn className="h-4 w-4" /> Entrar</>}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="font-body text-sm text-muted-foreground hover:text-primary">
            ← Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
