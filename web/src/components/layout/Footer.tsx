import { Clock, MapPin, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-0 w-full bg-gradient-to-b from-[#1A1A1A] to-black border-t border-white/8">

      {/* Decorative gold line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-40" />

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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-gradient-to-br from-white/5 to-transparent rounded-xl p-4 border border-white/8 hover:border-primary/30 transition-all flex flex-col items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <p className="text-white text-sm font-semibold">Horarios</p>
            <p className="text-white/45 text-xs">Lun - Dom</p>
            <p className="text-white/45 text-xs">12:00 - 23:00</p>
          </div>

          <div className="bg-gradient-to-br from-white/5 to-transparent rounded-xl p-4 border border-white/8 hover:border-primary/30 transition-all flex flex-col items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <p className="text-white text-sm font-semibold">Dirección</p>
            <p className="text-white/45 text-xs">Av. Providencia 1234</p>
            <p className="text-white/45 text-xs">Resistencia, Chaco</p>
          </div>

          <a
            href="https://wa.me/5491123456789"
            target="_blank"
            rel="noreferrer"
            className="bg-gradient-to-br from-white/5 to-transparent rounded-xl p-4 border border-white/8 hover:border-green-500/30 transition-all flex flex-col items-center gap-2 group"
          >
            <MessageCircle className="w-5 h-5 text-primary group-hover:text-green-400 transition-colors" />
            <p className="text-white text-sm font-semibold">WhatsApp</p>
            <p className="text-white/45 text-xs">+56 9 1234 5678</p>
          </a>

          <a
            href="https://www.instagram.com/tokyosushi"
            target="_blank"
            rel="noreferrer"
            className="bg-gradient-to-br from-white/5 to-transparent rounded-xl p-4 border border-white/8 hover:border-pink-500/30 transition-all flex flex-col items-center gap-2 group"
          >
            <button className="w-5 h-5 text-primary group-hover:text-pink-400 transition-colors" />
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
