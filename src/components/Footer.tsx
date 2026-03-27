import { MapPin, Phone, Mail, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer id="contact" className="border-t border-border bg-card">
      <div className="container mx-auto px-6 py-16">
        <div className="grid gap-12 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link to="/" className="mb-4 inline-block">
              <span className="font-display text-3xl font-bold text-gradient-gold">
                ÉLITE
              </span>
            </Link>
            <p className="font-body text-sm leading-relaxed text-muted-foreground">
              Especialistas em imóveis de alto padrão. Há mais de 20 anos
              conectando pessoas ao endereço dos seus sonhos.
            </p>
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
                href="mailto:contato@eliteimoveis.com"
                className="flex items-center gap-2 font-body text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <Mail className="h-4 w-4 text-primary" />
                contato@eliteimoveis.com
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
                className="flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition-all hover:border-primary hover:text-primary"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="luxury-divider mt-12" />
        <p className="mt-6 text-center font-body text-xs text-muted-foreground">
          © {new Date().getFullYear()} Élite Imóveis. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
