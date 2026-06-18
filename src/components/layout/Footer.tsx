import logoAsset from "@/assets/foodnbev-logo.png.asset.json";

export function Footer() {
  return (
    <footer className="mt-24 border-t bg-muted/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <img src={logoAsset.url} alt="food n bev" className="h-6 w-auto opacity-80" />
          <span className="text-sm text-muted-foreground">The community register for food &amp; beverage construction projects.</span>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} food n bev</p>
      </div>
    </footer>
  );
}
