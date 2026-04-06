import { useState, useEffect } from "react";
import logoKorretora from "@/assets/logo-korretora.png";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Menu, X, Heart, MapPin as MapPinIcon, BookOpen, Building2, User, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ThemeToggle from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, role, signOut, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
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
  const navLinkClass = (path: string) =>
    `relative font-body text-xs xl:text-sm uppercase tracking-wider transition-colors hover:text-primary ${
      isActive(path)
        ? "text-primary after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full after:bg-primary"
        : "text-foreground"
    }`;

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-border bg-card/80 py-1.5 pl-1.5 pr-3 transition-colors hover:border-primary/50">
          <Avatar className="h-7 w-7">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials}</AvatarFallback>
          </Avatar>
          <span className="max-w-[100px] truncate font-body text-sm text-foreground">{displayName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <p className="font-body text-sm font-medium text-foreground">{displayName}</p>
          <p className="font-body text-xs text-muted-foreground">{user?.email}</p>
          {role && (
            <span className="mt-1 inline-block rounded bg-primary/10 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider text-primary">
              {role}
            </span>
          )}
        </div>
        <DropdownMenuSeparator />
        {role && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
              <LayoutDashboard className="h-4 w-4" /> Painel Admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link to="/admin/profile" className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" /> Meu Perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "header-glass py-2 lg:py-3"
          : "bg-transparent py-4 lg:py-5"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logoKorretora} alt="KORRETORA" className="h-14 lg:h-16 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-3 xl:gap-5 lg:flex">
          <Link to="/" className={navLinkClass("/")}>Início</Link>
          <a href="/#listings" className="font-body text-xs xl:text-sm uppercase tracking-wider text-foreground transition-colors hover:text-primary">Imóveis</a>
          <Link to="/mapa" className={`flex items-center gap-1 ${navLinkClass("/mapa")}`}>
            <MapPinIcon className="h-3.5 w-3.5" /> Mapa
          </Link>
          <Link to="/blog" className={`flex items-center gap-1 ${navLinkClass("/blog")}`}>
            <BookOpen className="h-3.5 w-3.5" /> Blog
          </Link>
          <Link to="/lancamentos" className={`flex items-center gap-1 ${navLinkClass("/lancamentos")}`}>
            <Building2 className="h-3.5 w-3.5" /> Lançamentos
          </Link>
          <Link to="/favoritos" className={`flex items-center gap-1 ${navLinkClass("/favoritos")}`}>
            <Heart className="h-3.5 w-3.5" /> Favoritos
          </Link>
          <a href="#contact" className="font-body text-xs xl:text-sm uppercase tracking-wider text-foreground transition-colors hover:text-primary">Contato</a>
        </nav>

        {/* Desktop right section */}
        <div className="hidden items-center gap-2 xl:gap-3 lg:flex">
          {!loading && (
            user ? (
              <UserMenu />
            ) : (
              <Link to="/login" className="font-body text-xs xl:text-sm uppercase tracking-wider text-primary transition-colors hover:text-primary/80">Entrar</Link>
            )
          )}
          <ThemeToggle />
          <a href="tel:+5511999999999" className="hidden xl:flex items-center gap-2 font-body text-sm text-muted-foreground transition-colors hover:text-primary">
            <Phone className="h-3.5 w-3.5" /> (11) 99999-9999
          </a>
        </div>

        {/* Mobile / Tablet toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button onClick={() => setMobileOpen(!mobileOpen)} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/80 text-foreground transition-colors hover:border-primary/50">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="header-glass mt-2 overflow-hidden border-t border-border lg:hidden"
          >
            <nav className="flex flex-col gap-3 p-5 sm:p-6">
              <Link to="/" onClick={() => setMobileOpen(false)} className={`font-body text-sm uppercase tracking-wider transition-colors hover:text-primary ${isActive("/") ? "text-primary" : "text-foreground"}`}>Início</Link>
              <a href="/#listings" onClick={() => setMobileOpen(false)} className="font-body text-sm uppercase tracking-wider text-foreground transition-colors hover:text-primary">Imóveis</a>
              <Link to="/mapa" onClick={() => setMobileOpen(false)} className={`flex items-center gap-2 font-body text-sm uppercase tracking-wider transition-colors hover:text-primary ${isActive("/mapa") ? "text-primary" : "text-foreground"}`}>
                <MapPinIcon className="h-3.5 w-3.5 text-primary" /> Mapa
              </Link>
              <Link to="/blog" onClick={() => setMobileOpen(false)} className={`flex items-center gap-2 font-body text-sm uppercase tracking-wider transition-colors hover:text-primary ${isActive("/blog") ? "text-primary" : "text-foreground"}`}>
                <BookOpen className="h-3.5 w-3.5 text-primary" /> Blog
              </Link>
              <Link to="/lancamentos" onClick={() => setMobileOpen(false)} className={`flex items-center gap-2 font-body text-sm uppercase tracking-wider transition-colors hover:text-primary ${isActive("/lancamentos") ? "text-primary" : "text-foreground"}`}>
                <Building2 className="h-3.5 w-3.5 text-primary" /> Lançamentos
              </Link>
              <Link to="/favoritos" onClick={() => setMobileOpen(false)} className={`flex items-center gap-2 font-body text-sm uppercase tracking-wider transition-colors hover:text-primary ${isActive("/favoritos") ? "text-primary" : "text-foreground"}`}>
                <Heart className="h-3.5 w-3.5 text-primary" /> Favoritos
              </Link>
              <a href="#contact" onClick={() => setMobileOpen(false)} className="font-body text-sm uppercase tracking-wider text-foreground transition-colors hover:text-primary">Contato</a>

              {!loading && (
                user ? (
                  <>
                    <div className="luxury-divider my-1" />
                    <div className="flex items-center gap-3 py-1">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={avatarUrl} alt={displayName} />
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-body text-sm font-medium text-foreground">{displayName}</p>
                        <p className="font-body text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    {role && (
                      <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 font-body text-sm uppercase tracking-wider text-foreground transition-colors hover:text-primary">
                        <LayoutDashboard className="h-3.5 w-3.5 text-primary" /> Painel Admin
                      </Link>
                    )}
                    <Link to="/admin/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 font-body text-sm uppercase tracking-wider text-foreground transition-colors hover:text-primary">
                      <User className="h-3.5 w-3.5 text-primary" /> Meu Perfil
                    </Link>
                    <button onClick={() => { signOut(); setMobileOpen(false); }} className="flex items-center gap-2 font-body text-sm uppercase tracking-wider text-destructive">
                      <LogOut className="h-3.5 w-3.5" /> Sair
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="font-body text-sm uppercase tracking-wider text-primary">Área Restrita</Link>
                )
              )}
              <div className="luxury-divider my-1" />
              <a href="tel:+5511999999999" className="flex items-center gap-2 font-body text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 text-primary" /> (11) 99999-9999
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
