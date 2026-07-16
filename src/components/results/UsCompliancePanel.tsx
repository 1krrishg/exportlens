import { ExternalLink, FileText, ShieldAlert, ClipboardCheck, Tag, CheckCircle2, AlertTriangle } from "lucide-react";
import { US_COMPLIANCE_PROFILES } from "@/data/us-compliance";
import { findProfile, type ComplianceProfile } from "@/data/compliance-types";
import { computeLandedCost } from "@/data/us-import-fees";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function useComplianceProfile(hsCode: string): ComplianceProfile | null {
  const hs4 = hsCode.replace(/\D/g, "").slice(0, 4);
  return findProfile(US_COMPLIANCE_PROFILES, hs4);
}

/* Full-width verdict strip: answers "can I ship this?" in one line */
export function ComplianceVerdict({ profile }: { profile: ComplianceProfile | null }) {
  if (!profile) return null;
  const required = profile.agencies.filter((a) => a.mandatory).length;
  const onDetentionList = profile.detention_risks.some((r) => /import alert/i.test(r));
  const hasAdcvd = profile.adcvd.length > 0;
  const severe = onDetentionList || hasAdcvd;
  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${severe ? "border-warning/40 bg-warning-soft" : "border-success/30 bg-success-soft"}`}>
      {severe
        ? <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
        : <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />}
      <div>
        <div className={`text-sm font-semibold ${severe ? "text-warning" : "text-success"}`}>
          {onDetentionList
            ? "Your product category is on an FDA detention list — prepare before you ship"
            : hasAdcvd
            ? "Anti-dumping/countervailing duty orders apply to this product from India"
            : `Clear to ship after ${required} required step${required === 1 ? "" : "s"}`}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {required} required agency step{required === 1 ? "" : "s"} · {profile.documents.length} documents
          {onDetentionList && " · detention risk detailed below"}
          {hasAdcvd && " · AD/CVD exposure detailed below"}
        </div>
      </div>
    </div>
  );
}

/* Right panel: the money answer */
export function LandedCostCard({ shipmentValue, effectiveRate }: { shipmentValue: number; effectiveRate: number }) {
  const landed = shipmentValue > 0 ? computeLandedCost(shipmentValue, effectiveRate) : null;
  if (!landed) return null;
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Landed cost at the US border</div>
      </div>
      <div className="divide-y divide-border text-sm">
        {[
          ["Shipment value", fmt(landed.shipmentValue)],
          [`Duty (${landed.dutyPct.toFixed(1)}%)`, fmt(landed.dutyCost)],
          ["Merchandise processing fee (MPF)", fmt(landed.mpf)],
          ["Harbor maintenance fee (HMF, ocean)", fmt(landed.hmf)],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between px-4 py-2.5">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-mono text-foreground">{v}</span>
          </div>
        ))}
        <div className="flex justify-between px-4 py-3 bg-muted/20">
          <span className="font-medium text-foreground">Total at the border</span>
          <span className="font-mono font-bold text-foreground">{fmt(landed.total)}</span>
        </div>
      </div>
      <div className="px-4 py-2.5 bg-muted/20 border-t border-border text-[10px] text-muted-foreground">
        MPF per 19 CFR 24.23 (0.3464%, min $33.58 / max $651.50) · HMF 0.125% on ocean entries · excludes freight and broker fees
      </div>
    </div>
  );
}

/* Left panel: everything regulatory */
export function ComplianceChecklist({ profile }: { profile: ComplianceProfile | null }) {
  if (!profile) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        No curated compliance profile for this product category yet. Standard entry documents apply
        (commercial invoice, packing list, bill of lading) — check with your customs broker for
        agency requirements specific to your goods.
      </div>
    );
  }
  return (
    <>
      {/* Agency requirements */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
          <ClipboardCheck className="h-3.5 w-3.5 text-primary" />
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            US agency requirements · {profile.category}
          </div>
        </div>
        <div className="p-4 space-y-3">
          {profile.agencies.map((a) => (
            <div key={a.requirement} className="rounded-lg border border-border bg-muted/20 p-3.5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary flex-shrink-0">{a.agency}</span>
                  <span className="text-sm font-medium text-foreground truncate">{a.requirement}</span>
                </div>
                {a.mandatory && (
                  <span className="text-[10px] font-medium text-destructive bg-destructive-soft px-1.5 py-0.5 rounded flex-shrink-0">Required</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{a.summary}</p>
              <a href={a.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1.5">
                Official source <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Documents checklist */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-primary" />
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Documents you need</div>
        </div>
        <ul className="p-4 space-y-2">
          {profile.documents.map((d) => (
            <li key={d} className="flex items-start gap-2 text-sm text-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
              {d}
            </li>
          ))}
        </ul>
      </div>

      {/* Detention risks */}
      {profile.detention_risks.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning-soft p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-4 w-4 text-warning" />
            <div className="text-xs uppercase tracking-wider text-warning font-medium">Why shipments like yours get detained</div>
          </div>
          <ul className="space-y-2">
            {profile.detention_risks.map((r) => (
              <li key={r} className="text-sm text-foreground leading-relaxed flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-warning flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AD/CVD */}
      {profile.adcvd.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive-soft p-5">
          <div className="text-xs uppercase tracking-wider text-destructive font-medium mb-3">Anti-dumping / countervailing duty exposure</div>
          <ul className="space-y-2">
            {profile.adcvd.map((o) => (
              <li key={o.order} className="text-sm text-foreground">
                <span className="font-medium">{o.order}</span> — {o.rate_range}{" "}
                <a href={o.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">source</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Labeling */}
      {profile.labeling.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-primary" />
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Labeling rules</div>
          </div>
          <ul className="p-4 space-y-2">
            {profile.labeling.map((l) => (
              <li key={l} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                {l}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
