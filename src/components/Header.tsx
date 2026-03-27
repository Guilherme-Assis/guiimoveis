import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Mail, Menu, X } from "lucide-react";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "luxury-glass py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold text-gradient-gold">
            ÉLITE
          </span>
          <span className="hidden font-body text-xs uppercase tracking-[0.2em] text-muted-foreground sm:block">
            Imóveis
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            to="/"
            className="font-body text-sm uppercase tracking-wider text-foreground transition-colors hover:text-primary"
          >
            Início
          </Link>
          <a
            href="#listings"
            className="font-body text-sm uppercase tracking-wider text-foreground transition-colors hover:text-primary"
          >
            Imóveis
          </a>
          <a
            href="#contact"
            className="font-body text-sm uppercase tracking-wider text-foreground transition-colors hover:text-primary"
          >
            Contato
          </a>
        </nav>

        {/* Contact */}
        <div className="hidden items-center gap-4 lg:flex">
          <a
            href="tel:+5511999999999"
            className="flex items-center gap-2 font-body text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <Phone className="h-3.5 w-3.5" />
            (11) 99999-9999
          </a>
          <a
            href="mailto:contato@eliteimoveis.com"
            className="flex items-center gap-2 font-body text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <Mail className="h-3.5 w-3.5" />
            contato@eliteimoveis.com
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-foreground md:hidden"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="luxury-glass mt-2 border-t border-border p-6 md:hidden"
        >
          <nav className="flex flex-col gap-4">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="font-body text-sm uppercase tracking-wider text-foreground"
            >
              Início
            </Link>
            <a
              href="#listings"
              onClick={() => setMobileOpen(false)}
              className="font-body text-sm uppercase tracking-wider text-foreground"
            >
              Imóveis
            </a>
            <a
              href="#contact"
              onClick={() => setMobileOpen(false)}
              className="font-body text-sm uppercase tracking-wider text-foreground"
            >
              Contato
            </a>
            <div className="luxury-divider my-2" />
            <a
              href="tel:+5511999999999"
              className="flex items-center gap-2 font-body text-sm text-muted-foreground"
            >
              <Phone className="h-3.5 w-3.5 text-primary" />
              (11) 99999-9999
            </a>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
};

export default Header;
