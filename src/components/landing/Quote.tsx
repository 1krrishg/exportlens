export function Quote() {
  return (
    <section className="relative py-16 sm:py-20 md:py-28 border-b border-border bg-secondary/40">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="max-w-3xl">
          <div className="space-y-8 mb-10">
            <div>
              <blockquote className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground leading-snug mb-4">
                "Our spice shipment sat at the Port of Newark for three weeks because we didn't file FDA Prior Notice correctly. Demurrage, storage, and a furious buyer — one missing form cost us more than the freight."
              </blockquote>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Spice exporter, Kerala</span> · shipping to the US since 2019
              </div>
            </div>
            <div className="border-t border-border pt-8">
              <blockquote className="text-xl sm:text-2xl font-semibold text-foreground leading-snug mb-4">
                "Our CHA told us the duty rate after the goods landed. Nobody told us our product category was under an anti-dumping order — the bill was triple what we quoted the buyer."
              </blockquote>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Steel products exporter, Gujarat</span> · $3M annual US volume
              </div>
            </div>
          </div>

          {/* Why not ChatGPT */}
          <div className="border-t border-border pt-8">
            <div className="text-xs font-medium uppercase tracking-wider text-primary mb-5">Why not just ask ChatGPT?</div>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  problem: "Frozen knowledge",
                  detail: "ChatGPT's training data is months old. Tariff rates change overnight after a trade negotiation. Our scraper runs daily."
                },
                {
                  problem: "No dollar numbers",
                  detail: "ChatGPT gives you a paragraph. ExportLens gives you the duty, the documents, and the detention risks for your exact product."
                },
                {
                  problem: "No historical context",
                  detail: "ChatGPT can't tell you this product's rate spiked in 2018, held for 6 years, and is likely to spike again. We can."
                },
              ].map((item) => (
                <div key={item.problem} className="rounded-lg border border-border bg-card p-4">
                  <div className="text-sm font-semibold text-foreground mb-1.5">{item.problem}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
