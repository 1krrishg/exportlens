import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-6 py-10 grid sm:grid-cols-3 gap-6 text-sm">
        <div>
          <div className="mb-2">
            <Logo className="h-6" withWordmark />
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            US import compliance for Indian exporters. Duty, documents, and detention risks — before you commit to a shipment.
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Product</div>
          <ul className="space-y-1.5 text-muted-foreground">
            <li><a href="/#how" className="hover:text-foreground">How it works</a></li>
            <li><a href="/#scenarios" className="hover:text-foreground">Tariff map</a></li>
            <li><Link to="/simulate" className="hover:text-foreground">Simulate a shipment</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Products covered</div>
          <ul className="space-y-1.5 text-muted-foreground text-xs">
            <li>Spices · Textiles · Apparel</li>
            <li>Shrimp · Rice · Tea · Cashews</li>
            <li>Pharma · Gems · Auto parts · and more</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container mx-auto px-6 py-4 text-xs text-muted-foreground flex justify-between">
          <span>© {new Date().getFullYear()} ExportLens</span>
          <span>Built for Indian exporters shipping to the US</span>
        </div>
      </div>
    </footer>
  );
}
