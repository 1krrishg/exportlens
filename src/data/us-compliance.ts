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
    hs4: ["0306"],
    category: "Frozen shrimp & prawns",
    agencies: [
      {
        agency: "FDA",
        requirement: "Prior Notice of Imported Food",
        summary: "Electronic notice to FDA before arrival — mandatory for all food shipments.",
        link: "https://www.fda.gov/food/importing-food-products-united-states/prior-notice-imported-foods",
        mandatory: true,
      },
      {
        agency: "FDA",
        requirement: "Seafood HACCP",
        summary: "The processor must operate under a HACCP plan per 21 CFR 123; importers must verify it.",
        link: "https://www.fda.gov/food/hazard-analysis-critical-control-point-haccp/seafood-haccp",
        mandatory: true,
      },
      {
        agency: "NOAA",
        requirement: "SIMP — Seafood Import Monitoring Program",
        summary: "Shrimp requires harvest-to-entry traceability data filed by the US importer of record.",
        link: "https://www.fisheries.noaa.gov/international-affairs/seafood-import-monitoring-program",
        mandatory: true,
      },
    ],
    documents: [
      "Commercial invoice",
      "Packing list",
      "Bill of lading",
      "FDA Prior Notice confirmation number",
      "Health certificate from EIC (Export Inspection Council of India)",
      "SIMP traceability records for the US importer",
    ],
    certifications: [
      {
        name: "EIC health certificate",
        summary: "India's Export Inspection Council certifies aquaculture consignments for the US market.",
        link: "https://eicindia.gov.in/",
      },
    ],
    detention_risks: [
      "FDA Import Alert 16-35: shrimp from India detained without physical examination for banned antibiotics (nitrofurans, chloramphenicol)",
      "Salmonella findings are a recurring refusal reason for Indian shrimp",
    ],
    adcvd: [
      {
        order: "Frozen warmwater shrimp from India — antidumping order A-533-840",
        rate_range: "company-specific, roughly 2–10%",
        link: "https://www.trade.gov/us-antidumping-and-countervailing-duty-orders",
      },
    ],
    special_duties: [],
    labeling: [
      "Country of origin marking",
      "FDA seafood labeling — species, net weight, responsible party",
      "COOL (country-of-origin labeling) applies at US retail",
    ],
  },
  {
    hs4: ["1006"],
    category: "Basmati rice",
    agencies: [
      {
        agency: "FDA",
        requirement: "Prior Notice + Food Facility Registration",
        summary: "Standard FDA food import requirements apply to rice.",
        link: "https://www.fda.gov/food/importing-food-products-united-states/prior-notice-imported-foods",
        mandatory: true,
      },
      {
        agency: "USDA APHIS",
        requirement: "Phytosanitary import requirements",
        summary: "Rice imports must meet APHIS plant-health conditions; check FAVIR for the current status.",
        link: "https://www.aphis.usda.gov/aphis/ourfocus/planthealth/import-information",
        mandatory: true,
      },
    ],
    documents: [
      "Commercial invoice",
      "Packing list",
      "Bill of lading",
      "FDA Prior Notice confirmation number",
      "Phytosanitary certificate from India's NPPO",
      "Fumigation certificate (commonly requested)",
    ],
    certifications: [],
    detention_risks: [
      "Pesticide residue findings (e.g. tricyclazole) have driven FDA refusals of Indian basmati",
      "Insect infestation / filth is a standard refusal category for grain shipments",
    ],
    adcvd: [],
    special_duties: [],
    labeling: [
      "Country of origin marking",
      "FDA food labeling per 21 CFR 101",
    ],
  },
  {
    hs4: ["6109", "6110", "6203", "6204"],
    category: "Apparel (knit & woven)",
    agencies: [
      {
        agency: "CPSC",
        requirement: "Flammability — 16 CFR 1610",
        summary: "General wearing-apparel flammability standard; a General Certificate of Conformity is required.",
        link: "https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Clothing-Textiles",
        mandatory: true,
      },
      {
        agency: "CPSC",
        requirement: "Children's apparel — CPC + third-party testing",
        summary: "Children's clothing needs a Children's Product Certificate backed by CPSC-accepted lab testing (lead, drawstrings, flammability).",
        link: "https://www.cpsc.gov/Business--Manufacturing/Testing-Certification",
        mandatory: true,
      },
      {
        agency: "FTC",
        requirement: "Textile labeling",
        summary: "Fiber content, country of origin, and RN or manufacturer identity on a permanent label.",
        link: "https://www.ftc.gov/business-guidance/resources/threading-your-way-through-labeling-requirements-under-textile-wool-acts",
        mandatory: true,
      },
    ],
    documents: [
      "Commercial invoice with fiber content and garment construction detail",
      "Packing list",
      "Bill of lading / airway bill",
      "General Certificate of Conformity (adult) or CPC (children's)",
    ],
    certifications: [],
    detention_risks: [
      "Children's garments with drawstrings at the hood or waist are recalled/refused under CPSC rules",
      "Missing or false fiber-content labels trigger CBP holds",
      "UFLPA: cotton supply chains are screened — be ready to document that no Xinjiang cotton is used",
    ],
    adcvd: [],
    special_duties: [],
    labeling: [
      "Fiber content, country of origin, RN number, care instructions (16 CFR 423)",
    ],
  },
  {
    hs4: ["3004", "2106"],
    category: "Pharmaceuticals & ayurvedic products",
    agencies: [
      {
        agency: "FDA",
        requirement: "Drug listing, facility registration & NDC",
        summary: "Finished drugs require FDA facility registration, drug listing, and an approved application or OTC monograph conformity.",
        link: "https://www.fda.gov/drugs/guidance-compliance-regulatory-information/importing-drugs-us",
        mandatory: true,
      },
      {
        agency: "FDA",
        requirement: "Dietary supplement rules (if sold as supplement)",
        summary: "Ayurvedic products sold as supplements must follow 21 CFR 111 GMPs and bear no disease claims.",
        link: "https://www.fda.gov/food/dietary-supplements",
        mandatory: true,
      },
    ],
    documents: [
      "Commercial invoice",
      "Packing list",
      "FDA Prior Notice (if regulated as food/supplement)",
      "Drug listing / NDC documentation (if regulated as drug)",
    ],
    certifications: [],
    detention_risks: [
      "FDA Import Alert 66-40: drugs from firms without FDA GMP compliance are detained without examination — several Indian plants are listed",
      "Ayurvedic products are repeatedly refused for heavy metals (lead, mercury, arsenic) and undeclared drug ingredients",
      "Disease-treatment claims on labels reclassify a supplement as an unapproved new drug — automatic refusal",
    ],
    adcvd: [],
    special_duties: [],
    labeling: [
      "Supplement Facts or Drug Facts panel as applicable",
      "No unapproved disease claims",
      "Country of origin marking",
    ],
  },
  {
    hs4: ["7306", "7326"],
    category: "Steel products",
    agencies: [
      {
        agency: "Commerce",
        requirement: "Steel Import Monitoring — import license",
        summary: "Every steel mill product entry needs a SIMA import license number before filing entry.",
        link: "https://www.trade.gov/steel-import-monitoring-and-analysis-system",
        mandatory: true,
      },
    ],
    documents: [
      "Commercial invoice",
      "Packing list",
      "Bill of lading",
      "SIMA import license",
      "Mill test certificates",
    ],
    certifications: [],
    detention_risks: [
      "Misclassification or transshipment suspicion on steel draws intense CBP scrutiny and penalties",
    ],
    adcvd: [
      {
        order: "Multiple AD/CVD orders cover Indian steel pipe, tube and fittings — check your exact product",
        rate_range: "varies by order and company, can exceed 100%",
        link: "https://www.trade.gov/us-antidumping-and-countervailing-duty-orders",
      },
    ],
    special_duties: [
      "Section 232 measures apply to steel articles — rate depends on current proclamations",
    ],
    labeling: ["Country of origin marking (die-stamp/paint per CBP rules for pipe)"],
  },
  {
    hs4: ["7113", "7102"],
    category: "Gems & jewelry",
    agencies: [
      {
        agency: "CBP",
        requirement: "Kimberley Process (rough diamonds only)",
        summary: "Rough diamonds require a Kimberley Process certificate; polished stones and jewelry do not.",
        link: "https://www.state.gov/key-topics-office-of-threat-finance-countermeasures/kimberley-process/",
        mandatory: true,
      },
      {
        agency: "FTC",
        requirement: "Jewelry marking & disclosure",
        summary: "Gold fineness marking, and lab-grown vs natural stone disclosure per FTC Jewelry Guides.",
        link: "https://www.ftc.gov/business-guidance/resources/ftc-jewelry-guides",
        mandatory: true,
      },
    ],
    documents: [
      "Commercial invoice with per-item detail",
      "Packing list",
      "Kimberley Process certificate (rough diamonds only)",
      "Formal entry with a customs bond (jewelry values usually require one)",
    ],
    certifications: [],
    detention_risks: [
      "Undervaluation of jewelry invoices is a classic CBP audit trigger",
      "Russian-origin diamonds are banned — origin documentation may be requested even for India-polished stones",
    ],
    adcvd: [],
    special_duties: [],
    labeling: ["Gold karat/fineness marking with a registered trademark", "Country of origin"],
  },
  {
    hs4: ["4420", "8306", "9403"],
    category: "Wood & metal handicrafts",
    agencies: [
      {
        agency: "USDA APHIS",
        requirement: "Lacey Act declaration + plant-health rules",
        summary: "Wood products need a Lacey Act declaration of species and country of harvest; wood must meet treatment rules.",
        link: "https://www.aphis.usda.gov/aphis/ourfocus/planthealth/import-information/lacey-act",
        mandatory: true,
      },
      {
        agency: "CPSC",
        requirement: "Lead in surface coatings — 16 CFR 1303",
        summary: "Painted decorative items must not exceed lead limits in paint/coatings.",
        link: "https://www.cpsc.gov/Business--Manufacturing/Business-Education/Lead",
        mandatory: true,
      },
    ],
    documents: [
      "Commercial invoice",
      "Packing list",
      "Lacey Act declaration (PPQ 505) for wood items",
      "Fumigation / ISPM-15 treatment certificate for wood packaging",
    ],
    certifications: [],
    detention_risks: [
      "Untreated wood packaging (non-ISPM-15 pallets) gets the whole container re-exported",
      "Protected wood species (e.g. certain rosewoods under CITES) require permits or are barred",
    ],
    adcvd: [],
    special_duties: [],
    labeling: ["Country of origin marking on each article"],
  },
  {
    hs4: ["8708"],
    category: "Auto parts",
    agencies: [
      {
        agency: "DOT NHTSA",
        requirement: "FMVSS conformity — HS-7 declaration",
        summary: "Parts covered by Federal Motor Vehicle Safety Standards need a DOT HS-7 declaration at entry.",
        link: "https://www.nhtsa.gov/importing-vehicle",
        mandatory: true,
      },
      {
        agency: "EPA",
        requirement: "Emissions-related parts declaration",
        summary: "Engine and emissions-related components may require EPA Form 3520-1 certification.",
        link: "https://www.epa.gov/importing-vehicles-and-engines",
        mandatory: true,
      },
    ],
    documents: [
      "Commercial invoice with OEM part numbers",
      "Packing list",
      "DOT HS-7 declaration where applicable",
      "EPA declaration for emissions parts",
    ],
    certifications: [],
    detention_risks: [
      "Counterfeit-brand or unmarked parts are seized under IPR enforcement",
      "Brake components and lighting have specific FMVSS test requirements",
    ],
    adcvd: [],
    special_duties: [
      "Section 232 automobile/parts measures may apply — check current proclamations for your part category",
    ],
    labeling: ["Country of origin marking on the part itself where feasible"],
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
