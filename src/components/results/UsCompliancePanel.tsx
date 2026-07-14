import { ExternalLink, FileText, ShieldAlert, ClipboardCheck, Tag } from "lucide-react";
import { US_COMPLIANCE_PROFILES } from "@/data/us-compliance";
import { findProfile } from "@/data/compliance-types";
import { computeLandedCost } from "@/data/us-import-fees";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

type Props = {
  hsCode: string; // full HS code, we match on first 4 digits
  shipmentValue: number;
  effectiveRate: number; // combined duty %, e.g. 10.5
};

export function UsCompliancePanel({ hsCode, shipmentValue, effectiveRate }: Props) {
  const hs4 = hsCode.replace(/\D/g, "").slice(0, 4);
  const profile = findProfile(US_COMPLIANCE_PROFILES, hs4);
  const landed = shipmentValue > 0 ? computeLandedCost(shipmentValue, effectiveRate) : null;

  return (
    <>
      {/* Landed cost */}
      {landed && (
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
      )}

      {profile && (
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
      )}
    </>
  );
}
