export function Footer() {
  const year = new Date().getFullYear();
  const version = process.env.APP_VERSION;

  return (
    <footer className="border-t border-foreground/10 mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-6 text-center text-sm text-foreground/55">
        © {year} Catopia de Chen Antúnez
        {version && <span className="ml-2 opacity-50">{version}</span>}
      </div>
    </footer>
  );
}
