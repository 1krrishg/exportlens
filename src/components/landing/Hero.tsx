import { ArrowRight, TrendingDown, Globe, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section id="top" className="relative border-b border-border overflow-hidden">
      <div className="container mx-auto px-5 sm:px-6 pt-10 pb-12 md:pt-20 md:pb-20">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-5 lg:pt-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary border border-border text-[11px] sm:text-xs text-muted-foreground mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
              USITC · FDA import alerts · CBP · updated daily
            </div>

            <h1 className="text-[2rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.05] font-semibold tracking-tight text-foreground mb-5">
              Ship to the US with zero surprises.
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mb-7 leading-relaxed">
              One missed document and your shipment sits at a US port while the invoice clock runs. Type your product and ExportLens shows the exact duty, every agency requirement, the documents you need, and why shipments like yours got detained last month.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 mb-6">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-xs text-orange-700 font-medium">
                🇮🇳 Built for Indian exporters shipping to the US
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700 font-medium">
                📋 Duty + documents + detention risks in one answer
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-5 font-medium w-full sm:w-auto">
                <Link to="/simulate">
                  Check my shipment
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-5 border-border hover:bg-secondary w-full sm:w-auto">
                <a href="#how">See how it works ↓</a>
              </Button>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-primary" /> USITC HTS catalog · 262k records · 1998–2026</span>
              <span className="flex items-center gap-1.5"><TrendingDown className="h-3.5 w-3.5 text-destructive" /> FDA import alerts · AD/CVD orders on Indian goods</span>
              <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-primary" /> Landed cost · duty + MPF + HMF, no surprises</span>
              <span className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-warning" /> FDA · CPSC · USDA · EPA · FWS checklists</span>
            </div>
          </div>

          <div className="lg:col-span-7">
            <HeroMock />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroMock() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-elevated)] overflow-hidden">
      <div className="px-3 sm:px-4 py-2.5 border-b border-border bg-muted/40 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-destructive/60" />
          <span className="h-2 w-2 rounded-full bg-warning/60" />
          <span className="h-2 w-2 rounded-full bg-success/60" />
        </div>
        <div className="text-[10px] sm:text-[11px] font-mono text-muted-foreground truncate">
          export-lens · turmeric powder → United States · $50,000
        </div>
      </div>

      <div className="p-4 space-y-3 text-xs">
        {/* Detention risk bar */}
        <div className="rounded-md border border-warning/30 bg-warning-soft p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Detention Risk</span>
            <span className="text-[10px] font-medium text-warning bg-warning-soft px-1.5 py-0.5 rounded">ELEVATED</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-[62%] bg-warning rounded-full" />
            </div>
            <span className="font-mono text-warning font-bold text-sm">62/100</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">FDA Import Alert 99-08 — spices from India detained without physical exam for Salmonella</div>
        </div>

        <div className="rounded-md border border-border bg-muted/30 divide-y divide-border">
          {[
            ["HS Code", "0910.30 — Turmeric", ""],
            ["US duty (USITC 2026)", "0%", ""],
            ["MPF + HMF fees", "$235.80", ""],
            ["FDA Prior Notice", "Required before arrival", "warning"],
            ["FSVP importer", "Must be arranged", "warning"],
          ].map(([k, v, color]) => (
            <div key={k} className="flex justify-between gap-3 px-2.5 py-1.5">
              <span className="text-muted-foreground">{k}</span>
              <span className={`font-mono font-medium text-right ${color === "destructive" ? "text-destructive" : color === "warning" ? "text-warning" : "text-foreground"}`}>{v}</span>
            </div>
          ))}
        </div>

        <div className="text-[10px] uppercase tracking-wider text-muted-foreground pt-1">Documents checklist</div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Commercial invoice", status: "Standard", cls: "border-success/30 bg-success-soft", neg: false },
            { label: "FDA Prior Notice", status: "Critical", cls: "border-warning/30 bg-warning-soft", neg: true },
            { label: "Lab analysis cert", status: "Recommended", cls: "border-border bg-muted/30", neg: false },
          ].map((s) => (
            <div key={s.label} className={`rounded border p-2.5 ${s.cls}`}>
              <div className="text-[10px] text-muted-foreground mb-1">{s.status}</div>
              <div className="font-medium text-[11px] text-foreground leading-snug">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-md border border-warning/30 bg-warning-soft p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-warning mb-1">Why shipments like yours get detained</div>
          <p className="text-[10px] text-foreground leading-relaxed">
            FDA refused 47 Indian spice shipments in the last 90 days — Salmonella, unapproved color additives (lead chromate), and missing Prior Notice were the top three reasons.
          </p>
        </div>

        <div className="rounded-md border border-primary/20 bg-primary-soft p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-primary mb-1">Before you ship</div>
          <p className="text-[10px] text-foreground leading-relaxed">
            <strong>Get a third-party lab analysis for Salmonella and lead</strong> — it moves your shipment off the Import Alert detention list via the Green List petition and clears customs days faster.
          </p>
        </div>
      </div>
    </div>
  );
}
