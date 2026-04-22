import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Particle background animation
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const x = c.getContext("2d");
    if (!x) return;
    let W = 0, H = 0;
    const pts: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    const sz = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight; };
    sz();
    window.addEventListener("resize", sz);
    for (let i = 0; i < 55; i++) {
      pts.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
      });
    }
    let raf = 0;
    const draw = () => {
      x.clearRect(0, 0, W, H);
      pts.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        x.beginPath();
        x.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        x.fillStyle = "rgba(201,162,39,0.35)";
        x.fill();
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 130) {
            x.beginPath();
            x.moveTo(pts[i].x, pts[i].y);
            x.lineTo(pts[j].x, pts[j].y);
            x.strokeStyle = `rgba(201,162,39,${0.12 * (1 - d / 130)})`;
            x.lineWidth = 0.5;
            x.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", sz);
    };
  }, []);

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
      if (signUpData.user) {
        await supabase.from("profiles").update({ cpf: cleanCpf }).eq("user_id", signUpData.user.id);
      }
      toast({ title: "Conta criada!", description: "Verifique seu e-mail para confirmar o cadastro." });
      setIsSignUp(false);
      setFullName(""); setCpf(""); setPassword("");
    } catch (err: any) {
      toast({ title: "Erro ao cadastrar", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="korretora-login">
      <style>{`
        .korretora-login{position:fixed;inset:0;background:#080b11;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden}
        .kl-bgc{position:fixed;inset:0;z-index:0}
        .kl-skyline{position:fixed;bottom:0;left:0;right:0;height:200px;z-index:1;opacity:.08;pointer-events:none}
        .kl-orb{position:fixed;border-radius:50%;pointer-events:none;z-index:1}
        .kl-orb-a{width:500px;height:500px;background:radial-gradient(circle,rgba(201,162,39,.18) 0%,transparent 70%);top:-120px;left:-100px;animation:kl-orbDrift 12s ease-in-out infinite}
        .kl-orb-b{width:400px;height:400px;background:radial-gradient(circle,rgba(201,162,39,.1) 0%,transparent 70%);bottom:-100px;right:-80px;animation:kl-orbDrift 15s ease-in-out infinite reverse}
        @keyframes kl-orbDrift{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,20px)}}
        .kl-page{position:relative;z-index:10;width:100%;height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto}
        .kl-card{width:100%;max-width:440px;background:rgba(13,18,28,.92);border:.5px solid rgba(201,162,39,.18);border-radius:20px;padding:44px 40px 40px;backdrop-filter:blur(20px);animation:kl-cardIn .7s cubic-bezier(.34,1.2,.64,1) both;margin:auto}
        @keyframes kl-cardIn{from{opacity:0;transform:translateY(32px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        .kl-logo-area{display:flex;flex-direction:column;align-items:center;margin-bottom:28px;animation:kl-fadeUp .5s .4s ease both}
        .kl-logo-wrap{position:relative;width:90px;height:90px;display:flex;align-items:center;justify-content:center;margin-bottom:14px}
        .kl-ring{position:absolute;inset:0;width:100%;height:100%;animation:kl-spin 8s linear infinite}
        .kl-ring2{position:absolute;inset:8px;width:calc(100% - 16px);height:calc(100% - 16px);animation:kl-spin 12s linear infinite reverse}
        @keyframes kl-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        .kl-logo-k{position:relative;z-index:2;font-size:38px;font-weight:800;color:#c9a227;letter-spacing:-2px;animation:kl-popIn .6s cubic-bezier(.34,1.56,.64,1) .2s both;font-family:'Georgia',serif}
        @keyframes kl-popIn{from{transform:scale(.2) rotate(-15deg);opacity:0}to{transform:scale(1) rotate(0);opacity:1}}
        .kl-brand-name{font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#fff}
        .kl-brand-name em{color:#c9a227;font-style:normal}
        .kl-brand-sub{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.25);margin-top:4px}
        .kl-divider{width:100%;height:.5px;background:linear-gradient(90deg,transparent,rgba(201,162,39,.25),transparent);margin-bottom:24px;animation:kl-fadeUp .4s .5s ease both}
        .kl-heading{font-size:24px;font-weight:700;color:#fff;letter-spacing:-.5px;margin-bottom:6px;animation:kl-fadeUp .4s .55s ease both;text-align:left}
        .kl-subhead{font-size:13px;color:rgba(255,255,255,.35);margin-bottom:28px;animation:kl-fadeUp .4s .6s ease both}
        @keyframes kl-fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .kl-field{margin-bottom:18px;animation:kl-fadeUp .4s ease both;animation-delay:.65s}
        .kl-field label{display:block;font-size:12px;font-weight:500;color:rgba(255,255,255,.5);letter-spacing:.5px;text-transform:uppercase;margin-bottom:8px}
        .kl-input-wrap{position:relative}
        .kl-input-wrap input{width:100%;background:rgba(255,255,255,.04);border:.5px solid rgba(255,255,255,.1);border-radius:12px;padding:14px 18px;font-size:15px;color:#fff;outline:none;transition:border-color .2s,background .2s;font-family:inherit}
        .kl-input-wrap input::placeholder{color:rgba(255,255,255,.2)}
        .kl-input-wrap input:focus{border-color:rgba(201,162,39,.5);background:rgba(201,162,39,.04)}
        .kl-eye-btn{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:4px;color:rgba(255,255,255,.3);transition:color .2s;display:flex}
        .kl-eye-btn:hover{color:rgba(201,162,39,.7)}
        .kl-input-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.2);pointer-events:none;display:flex}
        .kl-has-icon input{padding-left:42px}
        .kl-forgot-row{display:flex;justify-content:flex-end;margin-top:-8px;margin-bottom:20px;animation:kl-fadeUp .4s .8s ease both}
        .kl-forgot-row button{font-size:12px;color:rgba(201,162,39,.6);background:none;border:none;cursor:pointer;padding:0}
        .kl-forgot-row button:hover{color:#c9a227}
        .kl-btn-enter{width:100%;padding:15px;border-radius:12px;border:none;background:#c9a227;color:#0b0e14;font-size:14px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:opacity .2s,transform .15s;animation:kl-fadeUp .4s .85s ease both;position:relative;overflow:hidden}
        .kl-btn-enter:hover{opacity:.9}
        .kl-btn-enter:active{transform:scale(.98)}
        .kl-btn-enter:disabled{opacity:.6;cursor:not-allowed}
        .kl-btn-shine{position:absolute;top:0;left:-80%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);transform:skewX(-20deg);animation:kl-shine 3.5s 2s ease-in-out infinite}
        @keyframes kl-shine{0%,100%{left:-80%}40%,60%{left:120%}}
        .kl-footer-links{margin-top:24px;display:flex;flex-direction:column;align-items:center;gap:12px;animation:kl-fadeUp .4s .95s ease both}
        .kl-footer-links button,.kl-footer-links a{font-size:13px;color:rgba(201,162,39,.65);text-decoration:none;background:none;border:none;cursor:pointer}
        .kl-footer-links button:hover,.kl-footer-links a:hover{color:#c9a227}
        .kl-footer-links .kl-back{color:rgba(255,255,255,.25);font-size:12px}
        .kl-footer-links .kl-back:hover{color:rgba(255,255,255,.5)}
        .kl-flow-strip{display:flex;align-items:center;justify-content:center;gap:0;margin-bottom:24px;animation:kl-fadeUp .4s .62s ease both}
        .kl-fs-item{display:flex;align-items:center;gap:7px}
        .kl-fs-dot{width:28px;height:28px;border-radius:8px;background:rgba(201,162,39,.08);border:.5px solid rgba(201,162,39,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .kl-fs-lbl{font-size:11px;color:rgba(255,255,255,.35);white-space:nowrap}
        .kl-fs-arrow{margin:0 8px;color:rgba(201,162,39,.3);font-size:12px}
        .kl-fs-item.active .kl-fs-dot{background:rgba(201,162,39,.18);border-color:rgba(201,162,39,.5)}
        .kl-fs-item.active .kl-fs-lbl{color:rgba(201,162,39,.8)}
      `}</style>

      <canvas ref={canvasRef} className="kl-bgc" />

      <svg className="kl-skyline" viewBox="0 0 1440 200" fill="none" preserveAspectRatio="xMidYMax meet">
        <rect x="0" y="100" width="40" height="100" fill="#c9a227"/><rect x="5" y="78" width="30" height="24" fill="#c9a227"/>
        <rect x="50" y="60" width="60" height="140" fill="#c9a227"/><rect x="55" y="38" width="50" height="24" fill="#c9a227"/><rect x="60" y="24" width="10" height="16" fill="#c9a227"/>
        <rect x="120" y="108" width="35" height="92" fill="#c9a227"/>
        <rect x="165" y="50" width="70" height="150" fill="#c9a227"/><rect x="170" y="28" width="60" height="24" fill="#c9a227"/><rect x="178" y="12" width="8" height="18" fill="#c9a227"/>
        <rect x="245" y="85" width="45" height="115" fill="#c9a227"/>
        <rect x="300" y="65" width="55" height="135" fill="#c9a227"/><rect x="305" y="42" width="45" height="25" fill="#c9a227"/>
        <rect x="365" y="105" width="30" height="95" fill="#c9a227"/>
        <rect x="405" y="52" width="65" height="148" fill="#c9a227"/><rect x="410" y="30" width="55" height="24" fill="#c9a227"/><rect x="416" y="16" width="9" height="16" fill="#c9a227"/>
        <rect x="480" y="88" width="40" height="112" fill="#c9a227"/>
        <rect x="530" y="70" width="50" height="130" fill="#c9a227"/>
        <rect x="590" y="48" width="75" height="152" fill="#c9a227"/><rect x="595" y="26" width="65" height="24" fill="#c9a227"/><rect x="602" y="12" width="10" height="16" fill="#c9a227"/>
        <rect x="675" y="92" width="38" height="108" fill="#c9a227"/>
        <rect x="723" y="62" width="58" height="138" fill="#c9a227"/><rect x="728" y="40" width="48" height="24" fill="#c9a227"/>
        <rect x="791" y="75" width="44" height="125" fill="#c9a227"/>
        <rect x="845" y="55" width="62" height="145" fill="#c9a227"/><rect x="850" y="33" width="52" height="24" fill="#c9a227"/><rect x="857" y="18" width="9" height="17" fill="#c9a227"/>
        <rect x="917" y="90" width="36" height="110" fill="#c9a227"/>
        <rect x="963" y="58" width="56" height="142" fill="#c9a227"/><rect x="968" y="36" width="46" height="24" fill="#c9a227"/>
        <rect x="1029" y="78" width="42" height="122" fill="#c9a227"/>
        <rect x="1081" y="50" width="68" height="150" fill="#c9a227"/><rect x="1086" y="28" width="58" height="24" fill="#c9a227"/><rect x="1092" y="14" width="10" height="16" fill="#c9a227"/>
        <rect x="1159" y="94" width="37" height="106" fill="#c9a227"/>
        <rect x="1206" y="65" width="52" height="135" fill="#c9a227"/>
        <rect x="1268" y="52" width="66" height="148" fill="#c9a227"/><rect x="1273" y="30" width="56" height="24" fill="#c9a227"/><rect x="1280" y="16" width="9" height="16" fill="#c9a227"/>
        <rect x="1344" y="85" width="40" height="115" fill="#c9a227"/>
        <rect x="1394" y="62" width="46" height="138" fill="#c9a227"/>
      </svg>

      <div className="kl-orb kl-orb-a" />
      <div className="kl-orb kl-orb-b" />

      <div className="kl-page">
        <div className="kl-card">
          <div className="kl-logo-area">
            <div className="kl-logo-wrap">
              <svg className="kl-ring" viewBox="0 0 90 90" fill="none">
                <circle cx="45" cy="45" r="41" stroke="rgba(201,162,39,0.08)" strokeWidth="1"/>
                <circle cx="45" cy="45" r="41" stroke="#c9a227" strokeWidth="1.5" strokeDasharray="34 224" strokeLinecap="round" opacity=".7"/>
                <circle cx="45" cy="4" r="3" fill="#c9a227" opacity=".9"/>
              </svg>
              <svg className="kl-ring2" viewBox="0 0 74 74" fill="none">
                <circle cx="37" cy="37" r="33" stroke="rgba(201,162,39,0.05)" strokeWidth="1"/>
                <circle cx="37" cy="37" r="33" stroke="#c9a227" strokeWidth="1" strokeDasharray="16 192" strokeLinecap="round" opacity=".35"/>
                <circle cx="37" cy="4" r="2.5" fill="#c9a227" opacity=".5"/>
              </svg>
              <span className="kl-logo-k">K</span>
            </div>
            <div className="kl-brand-name"><em>K</em>orretora</div>
            <div className="kl-brand-sub">Rede de Parcerias Imobiliárias</div>
          </div>

          <div className="kl-divider" />

          <div className="kl-flow-strip">
            <div className="kl-fs-item active">
              <div className="kl-fs-dot">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="5" r="2.5" stroke="#c9a227" strokeWidth="1.2"/>
                  <path d="M2 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#c9a227" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="kl-fs-lbl">Corretor</span>
            </div>
            <span className="kl-fs-arrow">›</span>
            <div className="kl-fs-item">
              <div className="kl-fs-dot">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L1 5.5V13h4V9h4v4h4V5.5L7 1z" stroke="rgba(201,162,39,0.4)" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="kl-fs-lbl">Imóvel</span>
            </div>
            <span className="kl-fs-arrow">›</span>
            <div className="kl-fs-item">
              <div className="kl-fs-dot">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 9l2.5-2.5H6L7 5h2l1 1.5h2.5L14 9" stroke="rgba(201,162,39,0.4)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 9l2 2 2-1 1.5 1 1.5-1 2 1 2-2" stroke="rgba(201,162,39,0.4)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="kl-fs-lbl">Parceria</span>
            </div>
          </div>

          <div className="kl-heading">{isSignUp ? "Criar Conta" : "Área Restrita"}</div>
          <div className="kl-subhead">
            {isSignUp ? "Preencha os dados para se cadastrar" : "Acesse o painel de administração"}
          </div>

          <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
            {isSignUp && (
              <>
                <div className="kl-field">
                  <label>Nome Completo</label>
                  <div className="kl-input-wrap kl-has-icon">
                    <span className="kl-input-icon">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                </div>
                <div className="kl-field">
                  <label>CPF</label>
                  <div className="kl-input-wrap kl-has-icon">
                    <span className="kl-input-icon">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M4 7h3M4 10h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={cpf}
                      onChange={(e) => setCpf(formatCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="kl-field">
              <label>E-mail</label>
              <div className="kl-input-wrap kl-has-icon">
                <span className="kl-input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M1 5l7 5 7-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="kl-field">
              <label>Senha</label>
              <div className="kl-input-wrap kl-has-icon">
                <span className="kl-input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    <circle cx="8" cy="11" r="1.2" fill="currentColor"/>
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button type="button" className="kl-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 2l12 12M6.5 6.5a2 2 0 002.83 2.83M4.5 4.5C2.5 5.8 1 8 1 8s2.5 5 7 5c1.4 0 2.6-.4 3.6-1M8 3c4.5 0 7 5 7 5s-.5 1-1.5 2.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/>
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {!isSignUp && (
              <div className="kl-forgot-row">
                <button type="button" onClick={() => toast({ title: "Em breve", description: "Recuperação de senha em desenvolvimento." })}>
                  Esqueci minha senha
                </button>
              </div>
            )}

            <button type="submit" className="kl-btn-enter" disabled={loading}>
              <div className="kl-btn-shine" />
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {loading ? (isSignUp ? "CADASTRANDO..." : "ENTRANDO...") : (isSignUp ? "CRIAR CONTA" : "ENTRAR")}
            </button>
          </form>

          <div className="kl-footer-links">
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setPassword(""); }}>
              {isSignUp ? "Já tem conta? Entrar" : "Não tem conta? Cadastre-se"}
            </button>
            <Link to="/" className="kl-back">← Voltar ao site</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
