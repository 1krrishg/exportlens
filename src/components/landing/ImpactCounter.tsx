const stats = [
  {
    value: "12,788",
    label: "Products in the USITC HTS catalog",
    sub: "From turmeric (HS 0910) to auto parts (HS 8708)",
  },
  {
    value: "29 yrs",
    label: "Of official US duty records",
    sub: "USITC data going back to 1998 — every rate change on record",
  },
  {
    value: "$87B+",
    label: "Indian goods entering the US every year",
    sub: "India's largest export market — and the strictest border to clear",
  },
  {
    value: "1,000s",
    label: "Of Indian shipments refused yearly",
    sub: "FDA import refusals for spices, shrimp, drugs — most were preventable paperwork",
  },
];

export function ImpactCounter() {
  return (
    <section className="py-16 sm:py-20 border-b border-border">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.value}>
              <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1.5 tabular-nums">{s.value}</div>
              <div className="text-sm font-medium text-foreground mb-1">{s.label}</div>
              <div className="text-xs text-muted-foreground leading-snug">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
