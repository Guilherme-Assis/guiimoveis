import { MapPin, Phone, Mail, Instagram, Facebook, Linkedin, MessageCircle, Heart, Building2, BookOpen, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer id="contact" className="border-t border-border bg-card">
      <div className="container mx-auto px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link to="/" className="mb-4 inline-block">
              <span className="font-display text-3xl font-bold text-gradient-gold">
                KORRETORA
              </span>
            </Link>
            <p className="font-body text-sm leading-relaxed text-muted-foreground">
              Comunidade de corretores autônomos. Divulgue imóveis, encontre
              parceiros e feche negócios com quem entende do mercado.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 font-display text-lg font-semibold text-foreground">
              Links Rápidos
            </h4>
            <div className="flex flex-col gap-3">
              <Link to="/" className="flex items-center gap-2 font-body text-sm text-muted-foreground transition-colors hover:text-primary">
                <Building2 className="h-4 w-4 text-primary" />
                Imóveis
              </Link>
              <Link to="/mapa" className="flex items-center gap-2 font-body text-sm text-muted-foreground transition-colors hover:text-primary">
                <MapPin className="h-4 w-4 text-primary" />
                Busca no Mapa
              </Link>
              <Link to="/blog" className="flex items-center gap-2 font-body text-sm text-muted-foreground transition-colors hover:text-primary">
                <BookOpen className="h-4 w-4 text-primary" />
                Blog
              </Link>
              <Link to="/favoritos" className="flex items-center gap-2 font-body text-sm text-muted-foreground transition-colors hover:text-primary">
                <Heart className="h-4 w-4 text-primary" />
                Favoritos
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 font-display text-lg font-semibold text-foreground">
              Contato
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href="tel:+5511999999999"
                className="flex items-center gap-2 font-body text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <Phone className="h-4 w-4 text-primary" />
                (11) 99999-9999
              </a>
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-body text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <MessageCircle className="h-4 w-4 text-primary" />
                WhatsApp
              </a>
              <a
                href="mailto:contato@korretora.com"
                className="flex items-center gap-2 font-body text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <Mail className="h-4 w-4 text-primary" />
                contato@korretora.com
              </a>
              <div className="flex items-center gap-2 font-body text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                Av. Faria Lima, 3000 — São Paulo, SP
              </div>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="mb-4 font-display text-lg font-semibold text-foreground">
              Redes Sociais
            </h4>
            <div className="flex gap-3">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition-all hover:border-primary hover:text-primary hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition-all hover:border-primary hover:text-primary hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition-all hover:border-primary hover:text-primary hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition-all hover:border-primary hover:text-primary hover:scale-110"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>

            {/* Policies */}
            <div className="mt-6 flex flex-col gap-2">
              <a href="#" className="flex items-center gap-2 font-body text-xs text-muted-foreground transition-colors hover:text-primary">
                <Shield className="h-3 w-3" />
                Política de Privacidade
              </a>
              <a href="#" className="font-body text-xs text-muted-foreground transition-colors hover:text-primary">
                Termos de Uso
              </a>
            </div>
          </div>
        </div>

        <div className="luxury-divider mt-12" />
        <p className="mt-6 text-center font-body text-xs text-muted-foreground">
          © {new Date().getFullYear()} KORRETORA. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
