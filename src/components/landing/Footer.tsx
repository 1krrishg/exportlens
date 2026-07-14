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
            Tariff risk simulation for US importers and exporters. Know your exposure before you commit to a shipment.
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
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Markets covered</div>
          <ul className="space-y-1.5 text-muted-foreground text-xs">
            <li>China · European Union</li>
            <li>Canada · Mexico · Japan</li>
            <li>India · and more</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container mx-auto px-6 py-4 text-xs text-muted-foreground flex justify-between">
          <span>© {new Date().getFullYear()} TariffLens</span>
          <span>Built for US exporters</span>
        </div>
      </div>
    </footer>
  );
}
