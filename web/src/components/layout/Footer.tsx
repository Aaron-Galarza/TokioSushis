import { Clock, MapPin, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden">
      {/* Decorative top border with gradient */}
      <div className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div className="bg-gradient-to-b from-card to-black border-t border-border">
        <div className="container mx-auto px-4 py-12">
          {/* Logo and tagline */}
          <div className="text-center mb-8">
            <h2 className="text-3xl text-primary tracking-wider mb-2 font-[family-name:var(--font-display)] italic font-semibold">
              TOKYO SUSHIS
            </h2>
            <p className="text-muted-foreground italic">Auténtica experiencia japonesa</p>
          </div>

          {/* Contact info grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
            {/* Horarios (No clickeable) */}
            <div className="bg-gradient-to-br from-muted/50 to-transparent rounded-lg p-4 border border-border/50 hover:border-primary/30 transition-all flex flex-col items-center">
              <Clock className="w-5 h-5 text-primary mb-2" />
              <h3 className="text-white text-sm mb-1">Horarios</h3>
              <p className="text-muted-foreground text-xs">Lun - Dom</p>
              <p className="text-muted-foreground text-xs">19:30 - 23:45</p>
            </div>

            {/* Dirección (Clickeable al Mapa) */}
            <a
              href="https://www.google.com/maps/search/?api=1&query=-27.4561,-59.0021"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gradient-to-br from-muted/50 to-transparent rounded-lg p-4 border border-border/50 hover:border-primary/30 transition-all flex flex-col items-center cursor-pointer"
            >
              <MapPin className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-white text-sm mb-1">Dirección</h3>
              <p className="text-muted-foreground text-xs group-hover:text-primary transition-colors">Roldán 585</p>
              <p className="text-muted-foreground text-xs group-hover:text-primary transition-colors">Resistencia, Chaco</p>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/5493624622366"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gradient-to-br from-muted/50 to-transparent rounded-lg p-4 border border-border/50 hover:border-primary/30 transition-all flex flex-col items-center"
            >
              <Phone className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-white text-sm mb-1">WhatsApp</h3>
              <span className="text-primary hover:text-primary/80 text-xs transition-colors">
                +54 9 3624 62-2366
              </span>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/tokyosushis?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gradient-to-br from-muted/50 to-transparent rounded-lg p-4 border border-border/50 hover:border-primary/30 transition-all flex flex-col items-center"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
              </svg>
              <h3 className="text-white text-sm mb-1">Instagram</h3>
              <span className="text-primary hover:text-primary/80 text-xs transition-colors">
                @tokyosushis
              </span>
            </a>
          </div>

          {/* Decorative divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-border" />
            <div className="w-2 h-2 bg-primary rounded-full" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-border" />
          </div>

{/* Bottom section - Estilo AFdevelopers */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/20">
            <div className="flex items-center gap-2.5">
              {/* Cambiá el src por la URL del logo de Tokyo Sushis */}
              <img
                src="/tokyoSushis.webp"
                alt="Tokyo Sushis"
                className="w-8 h-8 grayscale opacity-40 shrink-0 object-cover rounded-full"
              />
              <div className="text-left">
                <p className="text-[10px] font-extrabold text-white uppercase tracking-wider leading-tight">
                  Tokyo Sushis
                </p>
                <p className="text-[9px] font-medium text-muted-foreground">
                  &copy; {new Date().getFullYear()} Todos los derechos reservados
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-medium text-muted-foreground leading-tight">
                Desarrollado por
              </p>
              <p className="text-[10px] font-extrabold text-primary tracking-wide">
                AFdevelopers
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}