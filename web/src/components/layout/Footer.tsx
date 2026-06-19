import { Clock, MapPin, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-0 w-full bg-gradient-to-b from-zinc-900 to-black border-t border-white/8">

      {/* Main section */}
      <div className="mx-auto max-w-4xl px-6 py-10">

        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <h2 className="font-heading italic text-2xl font-semibold tracking-[0.2em] text-primary mb-1">
            TOKYO SUSHI
          </h2>
          <p className="font-heading italic text-white/50 text-sm">Auténtica experiencia japonesa</p>
        </div>

        {/* 4-column info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <p className="text-white text-sm font-semibold">Horarios</p>
            <p className="text-white/45 text-xs">Lun - Dom</p>
            <p className="text-white/45 text-xs">12:00 - 23:00</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <p className="text-white text-sm font-semibold">Dirección</p>
            <p className="text-white/45 text-xs">Av. Providencia 1234</p>
            <p className="text-white/45 text-xs">Resistencia, Chaco</p>
          </div>

          <a
            href="https://wa.me/5491123456789"
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center group-hover:border-green-500/40 group-hover:bg-green-500/10 transition-colors">
              <MessageCircle className="w-4 h-4 text-primary group-hover:text-green-400 transition-colors" />
            </div>
            <p className="text-white text-sm font-semibold">WhatsApp</p>
            <p className="text-white/45 text-xs">+56 9 1234 5678</p>
          </a>

          <a
            href="https://www.instagram.com/tokyosushi"
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center group-hover:border-pink-500/40 group-hover:bg-pink-500/10 transition-colors">
              <button className="w-4 h-4 text-primary group-hover:text-pink-400 transition-colors" />
            </div>
            <p className="text-white text-sm font-semibold">Instagram</p>
            <p className="text-white/45 text-xs">@tokyosushi</p>
          </a>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5 py-4 px-6 flex flex-col items-center gap-1">
        <div className="w-1 h-1 rounded-full bg-primary/40 mb-2" />
        <p className="text-white/30 text-xs">
          © {new Date().getFullYear()} Tokyo Sushi. Todos los derechos reservados.
        </p>
        <p className="text-primary/40 text-[10px] uppercase tracking-[0.15em]">
          Desarrollado con ♥ por AFdevelopers
        </p>
      </div>
    </footer>
  );
}
