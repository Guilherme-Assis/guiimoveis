import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Building2, Heart, LayoutDashboard, LogOut, MapPin as MapPinIcon, Menu, Phone, User, X } from "lucide-react";

const logoKorretora = "/logo-korretora.webp";
const HeaderUserMenu = lazy(() => import("@/components/HeaderUserMenu"));

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, role, brokerId, brokerSlug, signOut, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarUrl = user?.user_metadata?.avatar_url;
  const isActive = (path: string) => location.pathname === path;
  const navLinkClass = (path: string) => `relative font-body text-xs xl:text-sm uppercase tracking-wider transition-colors hover:text-primary ${isActive(path) ? "text-primary after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full after:bg-primary" : "text-foreground"}`;

  return (
    <header className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${scrolled ? "header-glass py-2 lg:py-3" : "bg-transparent py-4 lg:py-5"}`}>
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={logoKorretora} alt="KORRETORA" width="64" height="64" fetchPriority="high" decoding="async" className="h-14 w-auto lg:h-16" />
        </Link>

        <nav className="hidden items-center gap-3 lg:flex xl:gap-5">
          <Link to="/" className={navLinkClass("/")}>Início</Link>
          <a href="/#listings" className="font-body text-xs uppercase tracking-wider text-foreground transition-colors hover:text-primary xl:text-sm">Imóveis</a>
          <Link to="/mapa" className={`flex items-center gap-1 ${navLinkClass("/mapa")}`}><MapPinIcon className="h-3.5 w-3.5" /> Mapa</Link>
          <Link to="/blog" className={`flex items-center gap-1 ${navLinkClass("/blog")}`}><BookOpen className="h-3.5 w-3.5" /> Blog</Link>
          <Link to="/lancamentos" className={`flex items-center gap-1 ${navLinkClass("/lancamentos")}`}><Building2 className="h-3.5 w-3.5" /> Lançamentos</Link>
          <Link to="/favoritos" className={`flex items-center gap-1 ${navLinkClass("/favoritos")}`}><Heart className="h-3.5 w-3.5" /> Favoritos</Link>
          <a href="#contact" className="font-body text-xs uppercase tracking-wider text-foreground transition-colors hover:text-primary xl:text-sm">Contato</a>
        </nav>

        <div className="hidden items-center gap-2 lg:flex xl:gap-3">
          {!loading && (user ? <Suspense fallback={null}><HeaderUserMenu displayName={displayName} initials={initials} avatarUrl={avatarUrl} email={user.email} role={role} brokerId={brokerId} brokerSlug={brokerSlug} onSignOut={signOut} /></Suspense> : <Link to="/login" className="font-body text-xs uppercase tracking-wider text-primary transition-colors hover:text-primary/80 xl:text-sm">Entrar</Link>)}
          <ThemeToggle />
          <a href="tel:+5511999999999" className="hidden items-center gap-2 font-body text-sm text-muted-foreground transition-colors hover:text-primary xl:flex"><Phone className="h-3.5 w-3.5" /> (11) 99999-9999</a>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button onClick={() => setMobileOpen((prev) => !prev)} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/80 text-foreground transition-colors hover:border-primary/50">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="header-glass mt-2 overflow-hidden border-t border-border lg:hidden">
          <nav className="flex flex-col gap-3 p-5 sm:p-6">
            <Link to="/" onClick={() => setMobileOpen(false)} className={`font-body text-sm uppercase tracking-wider transition-colors hover:text-primary ${isActive("/") ? "text-primary" : "text-foreground"}`}>Início</Link>
            <a href="/#listings" onClick={() => setMobileOpen(false)} className="font-body text-sm uppercase tracking-wider text-foreground transition-colors hover:text-primary">Imóveis</a>
            <Link to="/mapa" onClick={() => setMobileOpen(false)} className={`flex items-center gap-2 font-body text-sm uppercase tracking-wider transition-colors hover:text-primary ${isActive("/mapa") ? "text-primary" : "text-foreground"}`}><MapPinIcon className="h-3.5 w-3.5 text-primary" /> Mapa</Link>
            <Link to="/blog" onClick={() => setMobileOpen(false)} className={`flex items-center gap-2 font-body text-sm uppercase tracking-wider transition-colors hover:text-primary ${isActive("/blog") ? "text-primary" : "text-foreground"}`}><BookOpen className="h-3.5 w-3.5 text-primary" /> Blog</Link>
            <Link to="/lancamentos" onClick={() => setMobileOpen(false)} className={`flex items-center gap-2 font-body text-sm uppercase tracking-wider transition-colors hover:text-primary ${isActive("/lancamentos") ? "text-primary" : "text-foreground"}`}><Building2 className="h-3.5 w-3.5 text-primary" /> Lançamentos</Link>
            <Link to="/favoritos" onClick={() => setMobileOpen(false)} className={`flex items-center gap-2 font-body text-sm uppercase tracking-wider transition-colors hover:text-primary ${isActive("/favoritos") ? "text-primary" : "text-foreground"}`}><Heart className="h-3.5 w-3.5 text-primary" /> Favoritos</Link>
            <a href="#contact" onClick={() => setMobileOpen(false)} className="font-body text-sm uppercase tracking-wider text-foreground transition-colors hover:text-primary">Contato</a>

            {!loading && (user ? <>
              <div className="luxury-divider my-1" />
              <div className="flex items-center gap-3 py-1">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-body text-sm font-medium text-foreground">{displayName}</p>
                  <p className="font-body text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              {role && <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 font-body text-sm uppercase tracking-wider text-foreground transition-colors hover:text-primary"><LayoutDashboard className="h-3.5 w-3.5 text-primary" /> Painel Admin</Link>}
              <Link to="/admin/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 font-body text-sm uppercase tracking-wider text-foreground transition-colors hover:text-primary"><User className="h-3.5 w-3.5 text-primary" /> Meu Perfil</Link>
              <button onClick={() => { void signOut(); setMobileOpen(false); }} className="flex items-center gap-2 font-body text-sm uppercase tracking-wider text-destructive"><LogOut className="h-3.5 w-3.5" /> Sair</button>
            </> : <Link to="/login" onClick={() => setMobileOpen(false)} className="font-body text-sm uppercase tracking-wider text-primary">Área Restrita</Link>)}

            <div className="luxury-divider my-1" />
            <a href="tel:+5511999999999" className="flex items-center gap-2 font-body text-sm text-muted-foreground"><Phone className="h-3.5 w-3.5 text-primary" /> (11) 99999-9999</a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
