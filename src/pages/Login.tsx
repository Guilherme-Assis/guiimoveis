import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const isValidCPF = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (parseInt(digits[9]) !== check) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return parseInt(digits[10]) === check;
};

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !fullName.trim() || !cpf.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    if (!isValidCPF(cpf)) {
      toast({ title: "CPF inválido", description: "Verifique o CPF informado.", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Senha fraca", description: "A senha deve ter no mínimo 6 caracteres.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const cleanCpf = cpf.replace(/\D/g, "");

      // Check if CPF already exists
      const { data: existing } = await supabase.from("profiles").select("id").eq("cpf", cleanCpf).maybeSingle();
      if (existing) {
        toast({ title: "CPF já cadastrado", description: "Já existe uma conta com este CPF.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() }, emailRedirectTo: window.location.origin },
      });

      if (signUpError) throw signUpError;

      // Update profile with CPF
      if (signUpData.user) {
        await supabase.from("profiles").update({ cpf: cleanCpf }).eq("user_id", signUpData.user.id);
      }

      toast({
        title: "Conta criada!",
        description: "Verifique seu e-mail para confirmar o cadastro.",
      });
      setIsSignUp(false);
      setFullName("");
      setCpf("");
      setPassword("");
    } catch (err: any) {
      toast({
        title: "Erro ao cadastrar",
        description: err.message || "Tente novamente.",
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

        <h1 className="mb-2 text-center font-display text-2xl font-semibold text-foreground">
          {isSignUp ? "Criar Conta" : "Área Restrita"}
        </h1>
        <p className="mb-8 text-center font-body text-sm text-muted-foreground">
          {isSignUp ? "Preencha os dados para se cadastrar" : "Acesse o painel de administração"}
        </p>

        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-5">
          {isSignUp && (
            <>
              <div className="space-y-2">
                <Label className="font-body text-sm text-foreground">Nome Completo</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm text-foreground">CPF</Label>
                <Input
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  required
                  maxLength={14}
                  className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </>
          )}
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
            {loading ? (isSignUp ? "Cadastrando..." : "Entrando...") : (
              isSignUp ? <><UserPlus className="h-4 w-4" /> Criar Conta</> : <><LogIn className="h-4 w-4" /> Entrar</>
            )}
          </Button>
        </form>

        <div className="mt-6 space-y-3 text-center">
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setPassword(""); }}
            className="font-body text-sm text-primary hover:underline"
          >
            {isSignUp ? "Já tem conta? Entrar" : "Não tem conta? Cadastre-se"}
          </button>
          <div>
            <Link to="/" className="font-body text-sm text-muted-foreground hover:text-primary">
              ← Voltar ao site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
