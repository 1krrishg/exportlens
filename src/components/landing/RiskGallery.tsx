import { AlertTriangle, TrendingDown, CheckCircle2 } from "lucide-react";

const examples = [
  { product: "Frozen Shrimp", hs: "0306", dest: "United States", mfn: 0, retaliation: 5, effective: 5, severity: "high", risk: 74, note: "AD order A-533-840 + FDA Import Alert 16-35" },
  { product: "Turmeric & Spices", hs: "0910", dest: "United States", mfn: 0, retaliation: 0, effective: 0, severity: "medium", risk: 62, note: "FDA Import Alert 99-08 — Salmonella detentions" },
  { product: "Ayurvedic Products", hs: "3004", dest: "United States", mfn: 0, retaliation: 0, effective: 0, severity: "high", risk: 79, note: "FDA detentions for lead and unapproved drug claims" },
  { product: "Bed Linen", hs: "6302", dest: "United States", mfn: 12, retaliation: 0, effective: 12, severity: "medium", risk: 38, note: "FTC fiber labeling holds are common" },
  { product: "Steel Pipe", hs: "7306", dest: "United States", mfn: 0, retaliation: 30, effective: 30, severity: "high", risk: 71, note: "AD/CVD orders + Section 232 steel measures" },
  { product: "Gold Jewelry", hs: "7113", dest: "United States", mfn: 6, retaliation: 0, effective: 6, severity: "none", risk: 18, note: "Straightforward entry — FTC marking rules apply" },
  { product: "Basmati Rice", hs: "1006", dest: "United States", mfn: 1, retaliation: 0, effective: 1, severity: "medium", risk: 41, note: "USDA/APHIS phytosanitary + FDA Prior Notice" },
  { product: "Cotton T-shirts", hs: "6109", dest: "United States", mfn: 17, retaliation: 0, effective: 17, severity: "medium", risk: 33, note: "High duty but predictable — flammability applies" },
];

export function RiskGallery() {
  return (
    <section id="scenarios" className="py-16 sm:py-20 md:py-28 border-b border-border">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="max-w-2xl mb-10">
          <div className="text-xs font-medium uppercase tracking-wider text-primary mb-3">India → US exposure map</div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground leading-[1.1]">
            What US customs charges on India's top exports right now.
          </h2>
          <p className="text-muted-foreground mt-3 text-sm">USITC official duty rates + active AD/CVD orders + FDA import alerts. Risk scores reflect detention likelihood at the port.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {examples.map((e) => (
            <div key={`${e.hs}-${e.dest}`} className={`rounded-xl border p-4 ${e.severity === "high" ? "border-destructive/30 bg-destructive-soft" : e.severity === "medium" ? "border-warning/30 bg-warning-soft" : "border-success/30 bg-success-soft"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-mono text-muted-foreground">HS {e.hs}</div>
                {e.severity === "none"
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  : e.severity === "high"
                  ? <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                  : <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
              </div>
              <div className="font-semibold text-sm text-foreground mb-0.5">{e.product}</div>
              <div className="text-xs text-muted-foreground mb-2">→ {e.dest}</div>

              {/* Risk score mini bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Detention risk</span>
                  <span className={`text-[10px] font-mono font-bold ${e.risk >= 60 ? "text-destructive" : e.risk >= 30 ? "text-warning" : "text-success"}`}>{e.risk}/100</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${e.risk >= 60 ? "bg-destructive" : e.risk >= 30 ? "bg-warning" : "bg-success"}`} style={{ width: `${e.risk}%` }} />
                </div>
              </div>

              <div className="flex gap-3 text-[11px] mb-2">
                <div>
                  <div className="text-muted-foreground">MFN</div>
                  <div className="font-mono font-medium text-foreground">{e.mfn}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Extra duty</div>
                  <div className={`font-mono font-medium ${e.retaliation > 0 ? "text-destructive" : "text-success"}`}>{e.retaliation > 0 ? `+${e.retaliation}%` : "None"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Effective</div>
                  <div className={`font-mono font-semibold ${e.effective >= 20 ? "text-destructive" : e.effective > 0 ? "text-warning" : "text-success"}`}>{e.effective}%</div>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground italic">{e.note}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
