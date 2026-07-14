export function DataSources() {
  const sources = [
    {
      name: "USITC HTS Catalog",
      detail: "262,000 rate records · 1998–2026",
      badge: "Official",
      desc: "US International Trade Commission official tariff schedule. Every MFN rate, every year, going back to 1998.",
    },
    {
      name: "FDA Import Alerts",
      detail: "Detention-without-exam lists",
      badge: "Official",
      desc: "The FDA's live list of products detained at US ports without physical exam — spices, shrimp, ayurvedic products from India are on several. We tell you if yours is.",
    },
    {
      name: "CBP CROSS",
      detail: "120,000+ US Customs rulings",
      badge: "Public",
      desc: "US Customs and Border Protection's public ruling database. When we classify your product, we cite the actual ruling number.",
    },
    {
      name: "AD/CVD Orders",
      detail: "Commerce · ITC active orders",
      badge: "Official",
      desc: "Anti-dumping and countervailing duty orders on Indian goods — shrimp, steel, quartz and more. These can add 3–200% on top of the normal duty.",
    },
    {
      name: "US Agency Compliance",
      detail: "FDA · CPSC · USDA · EPA · FWS",
      badge: "Official",
      desc: "Non-tariff requirements that block shipments: FDA prior notice, FSVP, CPSC testing certificates, USDA phytosanitary rules, Lacey Act declarations.",
    },
  ];

  return (
    <section className="border-b border-border bg-muted/20 py-10 sm:py-12">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-6">Where the data comes from</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
          {sources.map((s) => (
            <div key={s.name} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-foreground">{s.name}</div>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  s.badge === "Official" ? "bg-primary/10 text-primary" :
                  s.badge === "Live" ? "bg-destructive/10 text-destructive" :
                  "bg-muted text-muted-foreground"
                }`}>{s.badge}</span>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground mb-2">{s.detail}</div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
