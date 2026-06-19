export function Footer() {
  return (
    <footer className="mt-14 w-full">
      <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      <div className="bg-gradient-to-b from-zinc-900 to-black border-t border-white/10 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center">
          <h2 className="font-heading italic text-xl font-semibold tracking-widest text-primary">
            TOKIO SUSHIS
          </h2>
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} Tokio Sushis. Todos los derechos reservados.
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-primary/50">
            Powered by AFdevelopers
          </p>
        </div>
      </div>
    </footer>
  );
}
