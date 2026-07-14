// Shared types for the curated India→US compliance dataset.

export type AgencyRequirement = {
  agency: string; // FDA, CPSC, USDA, EPA, FWS, CBP...
  requirement: string; // e.g. "Prior Notice of Imported Food"
  summary: string;
  link: string;
  mandatory: boolean;
};

export type Certification = {
  name: string;
  summary: string;
  link: string;
};

export type AdCvdOrder = {
  order: string; // e.g. "Frozen warmwater shrimp from India (A-533-840)"
  rate_range: string;
  link: string;
};

export type ComplianceProfile = {
  hs4: string[];
  category: string;
  agencies: AgencyRequirement[];
  documents: string[];
  certifications: Certification[];
  detention_risks: string[];
  adcvd: AdCvdOrder[];
  special_duties: string[];
  labeling: string[];
};

export function findProfile(
  profiles: ComplianceProfile[],
  hs4: string
): ComplianceProfile | null {
  return profiles.find((p) => p.hs4.includes(hs4)) ?? null;
}
