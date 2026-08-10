import logoAsset from "@/assets/foodnbev-logo.png";

export function Footer() {
  return (
    <footer className="mt-24 border-t bg-[var(--ink)] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <img src={logoAsset} alt="food n bev" className="h-6 w-auto opacity-90" />
          <span className="text-sm text-white/70">The community register for food &amp; beverage construction projects.</span>
        </div>
        <p className="text-xs text-white/50">© {new Date().getFullYear()} food n bev</p>
      </div>
    </footer>
  );
}

