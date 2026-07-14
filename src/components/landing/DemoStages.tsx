import { Upload, Search, BarChart3, Lightbulb, TrendingUp, ArrowDown, FileSearch } from "lucide-react";

export function DemoStages() {
  return (
    <section id="how" className="relative py-16 sm:py-20 md:py-28 border-b border-border bg-secondary/40">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="max-w-2xl mb-10 sm:mb-14">
          <div className="text-xs font-medium uppercase tracking-wider text-primary mb-3">How it works</div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.1]">
            From product to decision in 30 seconds.
          </h2>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <Stage
            icon={<Upload className="h-4 w-4 text-primary" />}
            num="01"
            title="Upload a document or just describe what you're shipping"
            desc="Drop a commercial invoice or packing list and we extract everything: product, HS code, destination, shipment value. Mistral OCR reads the PDF; a separate model pulls the fields. Or skip the upload and describe your product in plain English."
            source="Mistral OCR · pixtral-12b-2409"
          />
          <Arrow />
          <Stage
            icon={<FileSearch className="h-4 w-4 text-primary" />}
            num="02"
            title="We figure out the right HS code for customs"
            desc="Every product crossing a border needs an HS code — the 8-digit international classification number that determines what duty rate applies. We apply the WCO's GRI rules (the 6-step system customs authorities follow), validate the code against the USITC HTS catalog, and look up an actual CBP ruling number from the US Customs database that covers a similar product. You get 3 candidates ranked by confidence, with the ruling citation you can hand to your broker."
            source="USITC HTS catalog · CBP CROSS (120k+ public rulings) · WCO GRI"
          />
          <Arrow />
          <Stage
            icon={<Search className="h-4 w-4 text-primary" />}
            num="03"
            title="The real US duty — base rate plus anything stacked on top"
            desc="We pull the official duty rate from the USITC HTS catalog — 29 years of history, 1998 to 2026 — then layer on whatever else applies to goods from India: anti-dumping and countervailing duty orders, Section 232 steel and aluminum measures, and any active tariff actions. The effective rate you see is what US customs will actually charge, not just the headline MFN number."
            source="USITC HTS 1998–2026 · Commerce/ITC AD/CVD orders · active tariff actions"
          />
          <Arrow />
          <Stage
            icon={<BarChart3 className="h-4 w-4 text-primary" />}
            num="04"
            title="The full landed cost on your specific shipment"
            desc="Percentages don't mean much in isolation. We compute the true cost at the border against your exact shipment value: duty, the merchandise processing fee, the harbor maintenance fee — the number your buyer's customs broker will actually see. Then every US agency requirement for your product: FDA prior notice, FSVP, CPSC certificates, USDA phytosanitary rules, with the documents checklist and official government links."
            source="19 CFR 24 fee schedules · FDA · CPSC · USDA · FWS curated checklists"
          />
          <Arrow />
          <Stage
            icon={<TrendingUp className="h-4 w-4 text-primary" />}
            num="05"
            title="Why shipments like yours get stopped — and how to avoid it"
            desc="We check your product against the FDA's import alert lists — the products detained at US ports without physical examination — and surface the actual refusal reasons for your category: Salmonella in spices, unapproved color additives, missing prior notice. If your goods are on a detention list, you find out here, not at the port."
            source="FDA Import Alerts · FDA import refusal database · CBP hold patterns"
          />
          <Arrow />
          <Stage
            icon={<Lightbulb className="h-4 w-4 text-primary" />}
            num="06"
            title="One clear answer before you commit"
            desc="Get the lab test before shipping, fix the label, file the prior notice, arrange an FSVP importer — whatever stands between your shipment and clearance, stated plainly with the cost of getting it wrong. One recommendation. One number. No paragraph of maybes."
            source="Groq llama-3.3-70b · grounded in the duty and compliance data above"
          />
        </div>
      </div>
    </section>
  );
}

function Arrow() {
  return (
    <div className="flex justify-center">
      <ArrowDown className="h-5 w-5 text-muted-foreground/40" />
    </div>
  );
}

function Stage({ icon, num, title, desc, source }: { icon: React.ReactNode; num: string; title: string; desc: string; source: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6 flex gap-4 items-start">
      <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-primary-soft border border-primary/20 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono text-muted-foreground mb-0.5">{num}</div>
        <div className="font-semibold text-foreground text-sm mb-1">{title}</div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-2">{desc}</p>
        <div className="text-[10px] font-mono text-primary/70 bg-primary/5 border border-primary/10 rounded px-2 py-1 inline-block">
          {source}
        </div>
      </div>
    </div>
  );
}
