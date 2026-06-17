export function Footer() {
  return (
    <footer className="mt-14 w-full border-t border-secondary/20 bg-primary/88 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center">
        <h2 className="font-heading text-lg font-bold uppercase tracking-[0.2em] text-secondary">
          American Way
        </h2>
        <p className="text-xs text-white/70">
          © {new Date().getFullYear()} American Way. Todos los derechos reservados.
        </p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-secondary/55">
          Powered by AFdevelopers
        </p>
      </div>
    </footer>
  );
}
