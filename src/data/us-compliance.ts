import type { ComplianceProfile } from "./compliance-types";

// Curated India→US compliance profiles. Seed set — full 18-category
// dataset is being curated and will replace/extend this array.
export const US_COMPLIANCE_PROFILES: ComplianceProfile[] = [
  {
    hs4: ["0904", "0908", "0909", "0910"],
    category: "Spices",
    agencies: [
      {
        agency: "FDA",
        requirement: "Prior Notice of Imported Food",
        summary: "Electronic notice to FDA before the shipment arrives — without it the goods are refused at the port.",
        link: "https://www.fda.gov/food/importing-food-products-united-states/prior-notice-imported-foods",
        mandatory: true,
      },
      {
        agency: "FDA",
        requirement: "Food Facility Registration",
        summary: "The Indian manufacturing facility must be registered with FDA and renew every even-numbered year.",
        link: "https://www.fda.gov/food/guidance-regulation-food-and-dietary-supplements/registration-food-facilities-and-other-submissions",
        mandatory: true,
      },
      {
        agency: "FDA",
        requirement: "FSVP importer",
        summary: "A US-based Foreign Supplier Verification Program importer must be identified at entry.",
        link: "https://www.fda.gov/food/food-safety-modernization-act-fsma/fsma-final-rule-foreign-supplier-verification-programs-fsvp-importers-food-humans-and-animals",
        mandatory: true,
      },
    ],
    documents: [
      "Commercial invoice",
      "Packing list",
      "Bill of lading / airway bill",
      "FDA Prior Notice confirmation number",
      "Certificate of analysis (Salmonella, lead) — strongly recommended",
    ],
    certifications: [],
    detention_risks: [
      "FDA Import Alert 99-08: spices from India subject to detention without physical examination for Salmonella",
      "Unapproved color additives (e.g. lead chromate in turmeric) are a recurring refusal reason",
    ],
    adcvd: [],
    special_duties: [],
    labeling: [
      "Country of origin marking (\"Product of India\")",
      "FDA food labeling per 21 CFR 101 — ingredient list, net quantity, responsible party",
    ],
  },
  {
    hs4: ["6302"],
    category: "Home textiles / bed linen",
    agencies: [
      {
        agency: "CPSC",
        requirement: "Flammability — 16 CFR 1610",
        summary: "General wearing-apparel flammability standard applies to certain textile products.",
        link: "https://www.cpsc.gov/Regulations-Laws--Standards/Statutes/Flammable-Fabrics-Act",
        mandatory: true,
      },
      {
        agency: "FTC",
        requirement: "Textile Fiber Products Identification Act labeling",
        summary: "Fiber content, country of origin, and manufacturer identity must appear on the label.",
        link: "https://www.ftc.gov/business-guidance/resources/threading-your-way-through-labeling-requirements-under-textile-wool-acts",
        mandatory: true,
      },
    ],
    documents: [
      "Commercial invoice",
      "Packing list",
      "Bill of lading / airway bill",
      "Single country declaration (textiles)",
    ],
    certifications: [],
    detention_risks: [
      "Mislabeled fiber content or missing country of origin is a common CBP hold reason for Indian textiles",
    ],
    adcvd: [],
    special_duties: [],
    labeling: [
      "Fiber content, RN or manufacturer name, and country of origin on a sewn-in label",
    ],
  },
];
