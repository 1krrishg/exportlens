import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
const GROQ_API_KEY_2 = Deno.env.get("GROQ_API_KEY_2") ?? "";
const GROQ_API_KEY_3 = Deno.env.get("GROQ_API_KEY_3") ?? "";
const GROQ_KEYS = [GROQ_API_KEY, GROQ_API_KEY_2, GROQ_API_KEY_3].filter(Boolean);
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const WTO_API_KEY = Deno.env.get("WTO_API_KEY") ?? "";

// WTO reporter codes (importing country that sets the tariff)
const WTO_COUNTRY_CODES: Record<string, string> = {
  "United States": "840",
  "China": "156",
  "European Union": "918",
  "Canada": "124",
  "Mexico": "484",
  "Japan": "392",
  "India": "356",
  "South Korea": "410",
  "United Kingdom": "826",
  "Australia": "36",
  "Brazil": "76",
  "Singapore": "702",
  "Turkey": "792",
  "Vietnam": "704",
  "Indonesia": "360",
  "Thailand": "764",
  "Malaysia": "458",
  "United Arab Emirates": "784",
};

// WTO partner codes (exporting/origin country)
const WTO_PARTNER_CODES: Record<string, string> = {
  "United States": "840",
  "China": "156",
  "European Union": "918",
  "Canada": "124",
  "Mexico": "484",
  "Japan": "392",
  "India": "356",
  "South Korea": "410",
  "United Kingdom": "826",
  "Australia": "36",
  "Brazil": "76",
  "Singapore": "702",
  "Turkey": "792",
  "Vietnam": "704",
  "Indonesia": "360",
  "Thailand": "764",
  "Malaysia": "458",
  "United Arab Emirates": "784",
};

// Fetch MFN tariff rate a country charges on a given HS4 product
async function getWtoMfnRate(reporterCode: string, hs4: string): Promise<number | null> {
  if (!WTO_API_KEY) return null;
  try {
    const url = `https://api.wto.org/timeseries/v1/data?i=HS_A_0010&r=${reporterCode}&ps=2022&pc=${hs4}&fmt=json&mode=full&head=M&lang=1&max=1`;
    const resp = await fetch(url, { headers: { "Ocp-Apim-Subscription-Key": WTO_API_KEY }, signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return null;
    const data = await resp.json();
    const row = data?.Dataset?.[0];
    return (row && typeof row.Value === "number") ? row.Value : null;
  } catch { return null; }
}

// Known FTAs — maps "Reporter::Partner" to agreement name
// WTO HS_A_0020 gives the best preferential rate the reporter offers to FTA partners
const FTA_AGREEMENTS: Record<string, string> = {
  "Canada::United States": "USMCA",
  "United States::Canada": "USMCA",
  "Mexico::United States": "USMCA",
  "United States::Mexico": "USMCA",
  "Canada::Mexico": "USMCA",
  "Mexico::Canada": "USMCA",
  "Australia::United States": "AUSFTA",
  "United States::Australia": "AUSFTA",
  "South Korea::United States": "KORUS",
  "United States::South Korea": "KORUS",
  "Japan::Australia": "JAEPA",
  "Australia::Japan": "JAEPA",
  "Japan::Canada": "CPTPP",
  "Canada::Japan": "CPTPP",
  "Japan::Vietnam": "CPTPP",
  "Vietnam::Japan": "CPTPP",
  "Japan::Singapore": "CPTPP",
  "Singapore::Japan": "CPTPP",
  "Canada::Australia": "CPTPP",
  "Australia::Canada": "CPTPP",
  "Australia::Vietnam": "CPTPP",
  "Vietnam::Australia": "CPTPP",
  "Singapore::Australia": "CPTPP",
  "Australia::Singapore": "CPTPP",
  "United Kingdom::European Union": "UK-EU TCA",
  "European Union::United Kingdom": "UK-EU TCA",
  "India::Singapore": "CECA",
  "Singapore::India": "CECA",
  "South Korea::Australia": "KAFTA",
  "Australia::South Korea": "KAFTA",
  "Japan::India": "CEPA",
  "India::Japan": "CEPA",
  "India::United Arab Emirates": "India–UAE CEPA",
  "United Arab Emirates::India": "India–UAE CEPA",
  "India::Australia": "ECTA",
  "Australia::India": "ECTA",
};

// ── OFAC Sanctions — trade with these countries is prohibited or heavily restricted ──
// Source: US Treasury OFAC, EU Council Regulations, UN Security Council Resolutions
const SANCTIONS: Record<string, { level: "prohibited" | "restricted"; note: string; authority: string }> = {
  "Russia": {
    level: "restricted",
    note: "Comprehensive US/EU/UK sanctions post Feb 2022 invasion of Ukraine. Most goods prohibited. Exceptions: food, medicine, certain humanitarian goods. Financial transactions blocked via SWIFT.",
    authority: "US EO 14024, EU Regulation 833/2014 (amended), UK Russia (Sanctions) Regulations 2019",
  },
  "Iran": {
    level: "prohibited",
    note: "Comprehensive OFAC sanctions. Nearly all trade prohibited without specific OFAC license. Exceptions: food, medicine, medical devices under TSRA.",
    authority: "IEEPA, IFCA, Iran Sanctions Act — 31 CFR Part 560",
  },
  "North Korea": {
    level: "prohibited",
    note: "Comprehensive OFAC sanctions. All trade prohibited. UN Security Council resolutions ban exports of coal, iron, seafood, textiles, and imports of luxury goods.",
    authority: "31 CFR Part 510, UN SC Resolutions 2270/2321/2375/2397",
  },
  "Cuba": {
    level: "restricted",
    note: "US embargo under CACR/TWEA. Most trade prohibited. Limited exceptions for food, medicine, telecommunications, and authorized travel-related goods.",
    authority: "31 CFR Part 515 (Cuban Assets Control Regulations), TWEA",
  },
  "Syria": {
    level: "prohibited",
    note: "Comprehensive OFAC sanctions (Syrian Sanctions Regulations). Nearly all trade and investment prohibited without specific license.",
    authority: "31 CFR Part 542, Caesar Syria Civilian Protection Act 2019",
  },
  "Belarus": {
    level: "restricted",
    note: "Sectoral EU/US/UK sanctions post 2021 election crisis and support for Russia invasion. Prohibitions on potash, petroleum, steel, tobacco, and financial services.",
    authority: "US EO 14038, EU Regulation 2021/1030",
  },
  "Myanmar": {
    level: "restricted",
    note: "US sectoral sanctions post 2021 military coup. Prohibitions on jade, rubies, and goods from military-owned entities. EU arms embargo.",
    authority: "US BURMA Act 2021, EO 14014",
  },
  "Venezuela": {
    level: "restricted",
    note: "US sectoral sanctions on gold, oil sector, and government entities. Financial restrictions on Venezuelan sovereign debt. Limited general trade still permitted.",
    authority: "EO 13808/13827/13835/13884, 31 CFR Part 591",
  },
};

// ── Section 232 exemptions — these countries have deals that override the blanket 25%/10% ──
// Source: USTR proclamations and bilateral deals
const SECTION_232_EXEMPT: Record<string, { steel: boolean; aluminum: boolean; note: string }> = {
  "Canada":        { steel: true,  aluminum: true,  note: "USMCA — fully exempt from Section 232 steel and aluminum tariffs" },
  "Mexico":        { steel: true,  aluminum: true,  note: "USMCA — fully exempt from Section 232 steel and aluminum tariffs" },
  "European Union":{ steel: true,  aluminum: true,  note: "US-EU TRQ deal (Oct 2021) — quota-based exemption from Section 232; tariff-free within quota volumes" },
  "United Kingdom":{ steel: true,  aluminum: true,  note: "US-UK Section 232 deal (Jun 2022) — quota-based exemption; tariff-free within agreed volumes" },
  "Japan":         { steel: true,  aluminum: false,  note: "US-Japan Section 232 deal (Apr 2022) — steel quota exemption; aluminum still faces 10%" },
  "South Korea":   { steel: true,  aluminum: false,  note: "US-South Korea Section 232 quota deal — steel exempt within quota; aluminum still faces 10%" },
};

// Steel HS chapters: 72xx, 73xx. Aluminum: 76xx.
// ── Regulatory flags — compliance warnings beyond tariff rates ──────────────
type RegulatoryFlag = {
  type: "PROHIBITED" | "WARNING" | "COMPLIANCE" | "OPPORTUNITY";
  title: string;
  detail: string;
  authority: string;
};

// HS4 prefixes subject to UFLPA (Xinjiang forced labor) scrutiny
const UFLPA_HS4_PREFIXES = [
  "5201","5202","5203","5204","5205","5206","5207","5208","5209","5210","5211","5212", // cotton
  "6101","6102","6103","6104","6105","6106","6107","6108","6109","6110","6111","6112", // knit apparel (cotton-based)
  "6201","6202","6203","6204","6205","6206","6207","6208","6209","6210","6211","6212", // woven apparel
  "8541",                                    // polysilicon / solar cells
  "7601","7604","7606","7607","7608","7609", // aluminum (Xinjiang is major aluminum producer)
  "2002","2005",                             // tomatoes (Xinjiang tomato paste)
];

// HS4 codes subject to BIS Export Administration Regulations (EAR)
const EAR_HS4 = new Set(["8542","8471","8517","8411","8802","8803","8543","8528","9014","9015","8504","8536","8544","8529","8525","8526"]);

// HS4 codes that may touch ITAR (defense articles) when going to restricted destinations
const ITAR_HS4 = new Set(["8802","8803","8411","9301","9302","9303","9304","9305","9306"]);
const ITAR_RESTRICTED = new Set(["China","Russia","Iran","North Korea","Syria","Belarus"]);

function computeRegulatoryFlags(
  originCountry: string,
  destinationCountry: string,
  hs4: string,
  ftaAgreement: string | null,
  shipmentValue: number
): RegulatoryFlag[] {
  const flags: RegulatoryFlag[] = [];

  // ── US reciprocal/Section 122 tariff on India — rate is actively unstable ──
  // Deliberately NOT hardcoded as a duty row: it has moved from 25% (Aug 2025 Russian-oil
  // surcharge) to 50%, back down through several revisions, and is under active
  // renegotiation. Any specific number here would be stale within days. Warn instead of guess.
  if (originCountry === "India" && destinationCountry === "United States") {
    flags.push({
      type: "WARNING",
      title: "US Reciprocal Tariff on India — Rate Is Actively Changing",
      detail: "Since August 2025 the US has applied an additional reciprocal/Section 122 tariff on Indian goods on top of the MFN duty shown here, layered with a since-adjusted Russian-oil-purchase surcharge. The combined rate has moved repeatedly — do not quote a buyer off this tool's MFN number alone. Confirm the current effective rate with your customs broker or CBP's latest notice before finalizing any price, especially for shipments planned more than a few weeks out.",
      authority: "IEEPA / Section 122 tariff actions on India (2025–2026, subject to ongoing revision)",
    });
  }

  // ── UFLPA — Xinjiang Forced Labor Prevention Act ──
  if (
    originCountry === "China" &&
    destinationCountry === "United States" &&
    UFLPA_HS4_PREFIXES.some(p => hs4.startsWith(p.substring(0, 4)))
  ) {
    flags.push({
      type: "PROHIBITED",
      title: "UFLPA — Xinjiang Forced Labor Risk",
      detail: "Goods in this HS category from China are subject to the Uyghur Forced Labor Prevention Act. CBP will detain shipments at the port unless the importer can prove by clear and convincing evidence that goods were not produced with forced labor in Xinjiang. Cotton, polysilicon, aluminum, and tomatoes are the highest-risk categories. Obtain full supply chain documentation (mill certificates, facility audits, satellite verification) before shipping.",
      authority: "Uyghur Forced Labor Prevention Act (PL 117-78) · CBP UFLPA Entity List · 19 USC 1307",
    });
  }

  // ── USMCA Rules of Origin ──
  if (
    destinationCountry === "United States" &&
    (originCountry === "Canada" || originCountry === "Mexico") &&
    ftaAgreement === "USMCA"
  ) {
    const isAuto    = hs4.startsWith("87");
    const isTextile = hs4.startsWith("61") || hs4.startsWith("62") || hs4.startsWith("52") || hs4.startsWith("63");
    const isSteel   = hs4.startsWith("72") || hs4.startsWith("73");
    const isAlum    = hs4.startsWith("76");

    if (isAuto) {
      flags.push({
        type: "COMPLIANCE",
        title: "USMCA Rules of Origin — Automotive (75% RVC Required)",
        detail: "To qualify for 0% USMCA rate on vehicles: 75% regional value content from North America, steel/aluminum must be melted and poured in North America, and EV batteries must have 50%+ North American content (rising to 100% by 2027). Failure to qualify = standard US MFN rate applies (2.5% cars, 25% trucks). Certify on importer's own statement — no certificate required but keep records 5 years.",
        authority: "USMCA Chapter 4 · Automotive Appendix · 19 CFR Part 182",
      });
    } else if (isTextile) {
      flags.push({
        type: "COMPLIANCE",
        title: "USMCA Rules of Origin — Textiles (Yarn-Forward)",
        detail: "Textiles must meet yarn-forward rule: yarn spun, fabric woven, and garments cut/sewn in North America. Tariff Preference Levels (TPL) exist for limited quantities that don't meet yarn-forward. Failure to qualify means standard US MFN apparel rates apply (typically 12–32%).",
        authority: "USMCA Chapter 4 · Annex 4-B · 19 CFR Part 182",
      });
    } else if (isSteel || isAlum) {
      flags.push({
        type: "COMPLIANCE",
        title: "USMCA Rules of Origin — Steel/Aluminum (Melt and Pour)",
        detail: "Steel and aluminum must be melted and poured in North America to qualify for USMCA treatment and Section 232 exemption. Basic production stage must occur in NA — not just final manufacturing. Third-country steel processed in Mexico/Canada does NOT qualify.",
        authority: "USMCA Chapter 4 · Steel/Aluminum Annex · Presidential Proclamation 9740",
      });
    } else {
      flags.push({
        type: "COMPLIANCE",
        title: "USMCA Rules of Origin — Verify Before Claiming 0%",
        detail: "To claim the USMCA preferential rate, goods must satisfy product-specific rules of origin (tariff classification change and/or regional value content). Self-certify origin on the commercial invoice or a separate statement. CBP can audit up to 5 years after entry. If goods fail origin verification, back duties + interest + possible penalties apply.",
        authority: "USMCA Chapter 4 · 19 CFR Part 182 · CBP Form 434",
      });
    }
  }

  // ── De minimis — Section 321 ──
  if (destinationCountry === "United States") {
    if (shipmentValue <= 800 && originCountry === "China") {
      flags.push({
        type: "WARNING",
        title: "De Minimis at Risk for China-Origin",
        detail: "US de minimis threshold is $800 (Section 321) — shipments below this value enter duty-free. However, executive actions in 2025 targeted Chinese-origin goods for de minimis elimination. Status is legally uncertain and changing rapidly. Do not build a business model relying on de minimis for China-origin shipments.",
        authority: "19 USC 1321 · Executive Order (2025) on de minimis · STOP Act (House-passed)",
      });
    } else if (shipmentValue <= 800) {
      flags.push({
        type: "OPPORTUNITY",
        title: "De Minimis May Apply — Duty-Free Entry",
        detail: `This shipment value ($${shipmentValue.toLocaleString()}) is at or below the US de minimis threshold of $800. Shipments under $800 may enter the US duty-free under Section 321, with no formal customs entry required. Limit: one de minimis entry per person per day. Does not apply to goods subject to AD/CVD orders or Section 232/301 in some cases.`,
        authority: "19 USC 1321 · 19 CFR Part 10.153",
      });
    }
  }

  // ── BIS/EAR Export Controls — US as exporter ──
  if (originCountry === "United States" && EAR_HS4.has(hs4)) {
    flags.push({
      type: "WARNING",
      title: "BIS Export Controls — EAR License May Be Required",
      detail: `HS ${hs4} is likely on the Commerce Control List (CCL). Classify your specific product by its Export Control Classification Number (ECCN). Advanced semiconductors (ECCN 3A001), encryption (5E002), and aerospace components require a BIS license for many destinations. Check whether your destination is on the Country Chart for your ECCN. Unlicensed export = criminal penalties up to $1M per violation.`,
      authority: "15 CFR Parts 730–774 (EAR) · BIS Commerce Control List · 50 USC 4801",
    });
  }

  // ── ITAR — Defense Articles to Restricted Destinations ──
  if (originCountry === "United States" && ITAR_HS4.has(hs4) && ITAR_RESTRICTED.has(destinationCountry)) {
    flags.push({
      type: "PROHIBITED",
      title: "ITAR — Defense Article Export Prohibited",
      detail: `Military aircraft, spacecraft, engines, and related components are defense articles under ITAR. Export to ${destinationCountry} is prohibited — a State Department license will not be granted for this destination. Violations carry criminal penalties of up to 20 years imprisonment and $1M per violation. Consult a licensed export control attorney before any transfer.`,
      authority: "22 CFR Parts 120–130 (ITAR) · USML Categories IV, VIII, XV · Arms Export Control Act",
    });
  }

  // ── US Import NTMs — only fire when importing INTO the US ──
  if (destinationCountry === "United States") {
    const hs2 = hs4.substring(0, 2);
    const hs4num = parseInt(hs4);

    // FDA — Food Safety Modernization Act (FSMA)
    const foodChapters = ["01","02","03","04","05","06","07","08","09","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24"];
    if (foodChapters.includes(hs2)) {
      flags.push({
        type: "COMPLIANCE",
        title: "FDA FSMA — Prior Notice & Facility Registration Required",
        detail: "All food and agricultural products entering the US must comply with the Food Safety Modernization Act. Requirements: (1) FDA Prior Notice submitted at least 2 hours before arrival for air/land, 8 hours for ocean; (2) Foreign food facility must be registered with FDA; (3) Importer must have a Customs Bond. Failure to file prior notice = shipment refused or detained. High-risk foods face FSVP (Foreign Supplier Verification Program) requirements.",
        authority: "21 USC 381, 21 CFR Part 1 (FSMA) · FDA Prior Notice System Interface",
      });
    }

    // FDA — Drugs & Pharmaceuticals
    if (hs2 === "30") {
      flags.push({
        type: "COMPLIANCE",
        title: "FDA — Drug Import Requires Pre-Market Approval",
        detail: "Pharmaceutical products require FDA approval before entry. Branded drugs need NDA/BLA approval; generics need ANDA. Foreign manufacturers must be registered with FDA and subject to inspection. Personal use exemption ($2,000 limit) does not apply to commercial shipments. Unapproved drugs will be detained or refused entry. FDA import alerts (Red List) can block entire product lines from specific facilities.",
        authority: "21 USC 331, 355 (FDCA) · 21 CFR Parts 207, 312 · FDA Import Program",
      });
    }

    // FDA — Medical Devices
    if ((hs4num >= 9018 && hs4num <= 9022) || hs4 === "9021") {
      flags.push({
        type: "COMPLIANCE",
        title: "FDA — Medical Device Registration & Clearance Required",
        detail: "Medical devices must be registered with FDA. Class I devices (low risk): general controls only. Class II devices (moderate risk): require 510(k) clearance before sale. Class III devices (high risk): require PMA approval. Device must bear a UDI (Unique Device Identifier). Foreign manufacturers must have a US Agent registered with FDA. Non-compliant devices are refused entry.",
        authority: "21 USC 360 (Medical Device Amendments) · 21 CFR Parts 807, 820, 830",
      });
    }

    // CPSC — Consumer Product Safety
    const cpscHs4s = new Set(["9503","9504","9505","6111","6209","8516","8544","9401","9403","7009","4911","8504","8528","8536","6402","6404"]);
    if (cpscHs4s.has(hs4) || hs2 === "95") {
      flags.push({
        type: "COMPLIANCE",
        title: "CPSC — Consumer Product Safety Testing Required",
        detail: "Consumer products must comply with CPSC standards before entry. Toys and children's products require third-party testing for lead content (300 ppm limit), phthalates, and ASTM F963 toy safety. Requires a Children's Product Certificate (CPC) or General Certificate of Conformity (GCC) from an accredited lab. Products failing CPSC standards face detention, recall, and civil penalties up to $15M. List the CPSC registration number on the commercial invoice.",
        authority: "15 USC 2051 (CPSA) · ASTM F963 · 16 CFR Parts 1000–1799",
      });
    }

    // FCC — Radio Frequency Devices
    const fccHs4s = new Set(["8517","8471","8528","8527","8525","8526","8543","8504","8529","8536","8544","8414"]);
    if (fccHs4s.has(hs4)) {
      flags.push({
        type: "COMPLIANCE",
        title: "FCC — Radio Frequency Authorization Required",
        detail: "Electronic devices that emit radio frequency energy (WiFi, Bluetooth, cellular, GPS) require FCC authorization before import or sale. Options: (1) FCC Certification via accredited lab — required for most intentional radiators; (2) Declaration of Conformity (SDoC) for some unintentional radiators. FCC ID must be permanently affixed to the device. Unauthorized RF devices are subject to seizure by CBP. FCC Form 740 required at customs entry.",
        authority: "47 CFR Part 15 (FCC Rules) · FCC Authorization Procedures · CBP Form 740",
      });
    }

    // EPA — Vehicle Emissions
    if (hs2 === "87" && hs4num >= 8701 && hs4num <= 8705) {
      flags.push({
        type: "COMPLIANCE",
        title: "EPA — Vehicle Emissions Certification Required",
        detail: "All motor vehicles must meet EPA emission standards under the Clean Air Act. Required: EPA Certificate of Conformity (issued to manufacturer) and DOT compliance certification. Vehicles not meeting US standards cannot be sold — they can be imported only for R&D or under a temporary bond with mandatory export commitment. Non-conforming vehicles require an Independent Commercial Importer (ICI) to modify and certify them. Process can cost $10,000–$50,000+ per vehicle.",
        authority: "42 USC 7522 (Clean Air Act) · 40 CFR Part 86 · EPA Form 3520-1",
      });
    }

    // DOT/NHTSA — Tire safety standards
    if (["4011", "4012", "4013"].includes(hs4)) {
      flags.push({
        type: "COMPLIANCE",
        title: "DOT NHTSA — Tire Safety Standards (FMVSS 139)",
        detail: "Tires must comply with Federal Motor Vehicle Safety Standards and bear a DOT symbol and Tire Identification Number (TIN) molded into the sidewall. The manufacturer must be registered with NHTSA and have a US agent. An HS-7 declaration is filed at entry. Tires without the DOT marking are refused entry — the marking cannot be added after manufacture.",
        authority: "49 CFR Part 571.139 (FMVSS) · 49 CFR Part 574 (TIN) · NHTSA HS-7 Declaration",
      });
    }

    // CPSC/FTC — Wearing apparel flammability + textile labeling (all apparel, not just children's)
    const apparelChapters = ["61", "62"];
    if (apparelChapters.includes(hs2) || hs2 === "63") {
      flags.push({
        type: "COMPLIANCE",
        title: "CPSC Flammability + FTC Textile Labeling Required",
        detail: "Wearing apparel and textiles must meet the general flammability standard (16 CFR 1610) — most fabrics pass, but sheer/brushed fabrics (chiffon, fleece nap) can fail; a General Certificate of Conformity is required. Labels must state fiber content, country of origin, and the manufacturer or RN number (Textile Fiber Products Identification Act), plus care instructions (16 CFR 423). Children's sleepwear has stricter standards (16 CFR 1615/1616). Mislabeled fiber content is a common CBP hold reason.",
        authority: "16 CFR 1610 (Flammable Fabrics Act) · 15 USC 70 (Textile Act) · 16 CFR 423",
      });
    }

    // EPA — TSCA certification for chemical substances
    const chemChapters = ["28", "29", "32", "34", "38", "39"];
    if (chemChapters.includes(hs2)) {
      flags.push({
        type: "COMPLIANCE",
        title: "EPA TSCA — Chemical Import Certification Required",
        detail: "Chemical substances entering the US require a TSCA certification at customs: either a positive certification (all substances are on the TSCA Inventory or exempt) or a negative certification (not subject to TSCA, e.g. pesticides regulated by FIFRA). The importer files the certification with CBP at entry. Substances not on the TSCA Inventory require a Premanufacture Notice (PMN) to EPA 90 days before import. Non-certified chemical shipments are refused entry.",
        authority: "15 USC 2612 (TSCA Section 13) · 19 CFR 12.118–12.127 · 40 CFR Part 707",
      });
    }

    // USDA/APHIS — Plants & Agricultural Products
    if (["06","07","08","10","11","12","13","14"].includes(hs2)) {
      flags.push({
        type: "COMPLIANCE",
        title: "USDA APHIS — Phytosanitary Certificate Required",
        detail: "Plants, seeds, cut flowers, fresh fruits, and vegetables require a Phytosanitary Certificate issued by the national plant protection organization of the exporting country. Many products are subject to inspection at the port of entry. Some items require pre-clearance at origin. Prohibited items (certain plants that host specific pests) are denied entry regardless of documentation. Soil attached to plant material is generally prohibited. Declaration on CBP Form 6059B required.",
        authority: "7 USC 150aa (Plant Protection Act) · 7 CFR Part 319 · USDA APHIS PPQ",
      });
    }

    // USDA/FSIS — Meat & Poultry
    if (["02","05","16"].includes(hs2)) {
      flags.push({
        type: "COMPLIANCE",
        title: "USDA FSIS — Meat & Poultry Import Eligibility Required",
        detail: "Meat, poultry, and egg products can only be imported from countries FSIS has determined have equivalent food safety inspection systems. Country must appear on FSIS's list of eligible countries for that specific product. Each shipment requires a foreign inspection certificate and must be re-inspected by FSIS at a USDA-approved port of entry. Non-eligible country shipments are refused entry regardless of tariff status.",
        authority: "21 USC 601 (Federal Meat Inspection Act) · 9 CFR Parts 327, 381 · USDA FSIS",
      });
    }
  }

  // Baseline: every US import has marking/invoice/bond obligations. When no agency-specific
  // gate applies, say that explicitly instead of showing an empty section.
  if (destinationCountry === "United States" && flags.length === 0) {
    flags.push({
      type: "COMPLIANCE",
      title: "CBP Entry Basics — No Special Agency Gate for This Product",
      detail: "No FDA/CPSC/FCC/USDA-style pre-market requirement applies to this product category. Standard CBP entry rules still do: every article must bear country-of-origin marking (\"Made in India\") legible to the end buyer, the commercial invoice must show accurate value and full product description, and formal entries (over $2,500) require a customs bond. Anti-dumping/countervailing duty scope and intellectual-property (trademark) enforcement apply to all goods.",
      authority: "19 USC 1304 (marking) · 19 CFR Part 141 (entry) · 19 CFR Part 113 (bonds)",
    });
  }

  return flags;
}
function isSteel(hs4: string): boolean { return hs4.startsWith("72") || hs4.startsWith("73"); }
function isAluminum(hs4: string): boolean { return hs4.startsWith("76"); }

// Country-average WTO bound rates (simple average bound tariff, all products) from the
// official WTO Tariff Profiles. These are treaty commitments — effectively static.
// The WTO Timeseries API has NO product-level bound rates (HS_A_0030 is "duty-free line
// share %"), so a country-level average from the published profiles is the honest option.
const WTO_BOUND_AVG: Record<string, number> = {
  "United States": 3.4, "China": 10.0, "European Union": 5.1, "Canada": 6.5,
  "Mexico": 36.2, "Japan": 4.7, "India": 50.8, "South Korea": 16.5,
  "United Kingdom": 5.1, "Australia": 9.9, "Brazil": 31.4, "Singapore": 9.5,
  "Turkey": 28.6, "Vietnam": 11.5, "Indonesia": 37.1, "Thailand": 28.0, "Malaysia": 21.3,
  "United Arab Emirates": 14.5,
};

// UN M49 country codes for Comtrade (US differs from WTO: 842 vs 840). EU has no
// single reporter code in Comtrade — omitted (returns null).
const COMTRADE_CODES: Record<string, string> = {
  "United States": "842", "China": "156", "Canada": "124", "Mexico": "484",
  "Japan": "392", "India": "356", "South Korea": "410", "United Kingdom": "826",
  "Australia": "36", "Brazil": "76", "Singapore": "702", "Turkey": "792",
  "Vietnam": "704", "Indonesia": "360", "Thailand": "764", "Malaysia": "458",
  "United Arab Emirates": "784",
};

// Fetch bilateral trade flow for this exact HS4 product from UN Comtrade (free public API).
// reporter = exporter (origin), partner = importer (destination). Returns millions USD or null.
// The WTO Timeseries API has no bilateral trade values — its ITS_MTV_* indicators only report World.
async function getBilateralTradeFlow(originCountry: string, destCountry: string, hs4: string): Promise<number | null> {
  const reporter = COMTRADE_CODES[originCountry];
  const partner = COMTRADE_CODES[destCountry];
  if (!reporter || !partner) return null;
  try {
    const url = `https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=${reporter}&partnerCode=${partner}&period=2023&cmdCode=${hs4}&flowCode=X`;
    const resp = await fetch(url, { headers: { "Accept": "application/json" }, signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return null;
    const data = await resp.json();
    const val = data?.data?.[0]?.primaryValue;
    return (typeof val === "number" && val > 0) ? val / 1_000_000 : null;
  } catch { return null; }
}

// Simple in-memory rate limiter: 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= 10) return true;
  entry.count++;
  return false;
}

// All countries we know about for alternative routing
const ALL_COUNTRIES = [
  { name: "United States", code: "US" },
  { name: "Japan", code: "JP" },
  { name: "Canada", code: "CA" },
  { name: "Mexico", code: "MX" },
  { name: "European Union", code: "EU" },
  { name: "India", code: "IN" },
  { name: "South Korea", code: "KR" },
  { name: "Australia", code: "AU" },
  { name: "United Kingdom", code: "GB" },
  { name: "Brazil", code: "BR" },
  { name: "Singapore", code: "SG" },
  { name: "United Arab Emirates", code: "AE" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: "Too many requests. Please wait a minute." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { hs_code, destination_country, origin_country, shipment_value, product_name, trade_mode, incoterms, quantity } = await req.json();
    if (typeof hs_code !== "string" || hs_code.length < 4 || !destination_country || typeof shipment_value !== "number" || shipment_value <= 0) {
      return new Response(JSON.stringify({ error: "hs_code (min 4 digits), destination_country, and positive shipment_value are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const originCountry = origin_country || "United States";
    if (originCountry === destination_country) {
      return new Response(JSON.stringify({ error: "Origin and destination must be different countries" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const isImporter = trade_mode === "importer";
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Sanctions check — return early with warning if corridor is sanctioned ──
    const originSanction = SANCTIONS[originCountry] ?? null;
    const destSanction = SANCTIONS[destination_country] ?? null;
    const activeSanction = originSanction ?? destSanction;
    if (activeSanction) {
      return new Response(JSON.stringify({
        hs_code,
        product_name: product_name ?? "Goods",
        origin_country: originCountry,
        destination_country,
        shipment_value,
        sanctions_alert: true,
        sanctions_level: activeSanction.level,
        sanctions_note: activeSanction.note,
        sanctions_authority: activeSanction.authority,
        sanctioned_party: originSanction ? originCountry : destination_country,
        mfn_rate: null,
        effective_rate: null,
        tariff_cost_today: null,
        risk_score: 100,
        risk_label: "PROHIBITED",
        risk_summary: `This corridor involves ${originSanction ? originCountry : destination_country}, which is subject to ${activeSanction.level === "prohibited" ? "comprehensive trade prohibitions" : "significant trade restrictions"} under ${activeSanction.authority}. Standard tariff analysis does not apply — consult a trade compliance attorney before proceeding.`,
        recommendation: "Do not ship without an OFAC license or legal clearance. Penalties include up to $1M per violation and criminal prosecution.",
        prediction: "Sanctions are unlikely to be lifted in the near term. Explore alternative markets.",
        data_source: "OFAC SDN List · US Treasury · EU Council Regulations · UN Security Council",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Section 232 exemption check — override global retaliation_rate for exempt origins ──
    const s232Exemption = destination_country === "United States" ? (SECTION_232_EXEMPT[originCountry] ?? null) : null;
    const hs4ForExemption = hs_code.substring(0, 4);
    const s232Overridden = s232Exemption && (
      (isSteel(hs4ForExemption) && s232Exemption.steel) ||
      (isAluminum(hs4ForExemption) && s232Exemption.aluminum)
    );
    const s232ExemptionNote = s232Overridden ? s232Exemption!.note : null;

    // ── 1. Get live retaliation data from tariff_rates (scraped hourly) ──
    // Two lookups: global (origin_country IS NULL) + origin-specific (e.g. Section 301 China-only)
    // Stack both to get total additional duties for this corridor
    const [{ data: liveGlobal }, { data: liveOriginSpecific }] = await Promise.all([
      supabase
        .from("tariff_rates")
        .select("*")
        .eq("hs_code", hs_code.substring(0, 4))
        .eq("destination_country", destination_country)
        .is("origin_country", null)
        .maybeSingle(),
      supabase
        .from("tariff_rates")
        .select("*")
        .eq("hs_code", hs_code.substring(0, 4))
        .eq("destination_country", destination_country)
        .eq("origin_country", originCountry)
        .maybeSingle(),
    ]);
    // Merge: use global entry as base, stack origin-specific retaliation_rate on top
    const liveEntry = liveGlobal ?? liveOriginSpecific;
    const originSpecificRate = liveOriginSpecific?.retaliation_rate ?? 0;
    const originSpecificNote = liveOriginSpecific?.retaliation_note ?? null;

    // ── 2. Get baseline MFN rate from hts_catalog (USITC 2026 official data) ──
    const { data: catalogEntry } = await supabase
      .from("hts_catalog")
      .select("hts8, description, mfn_rate, col2_rate")
      .eq("hts8", hs_code)
      .maybeSingle();

    // Fallback: try 4-digit prefix match
    const { data: catalogFallback } = !catalogEntry ? await supabase
      .from("hts_catalog")
      .select("hts8, description, mfn_rate, col2_rate")
      .like("hts8", `${hs_code.substring(0, 4)}%`)
      .limit(1)
      .maybeSingle() : { data: null };

    const catalog = catalogEntry ?? catalogFallback;

    // ── 3. Get rate history for this HS code (25 years) ──
    const hs4 = hs_code.substring(0, 4);
    const { data: historyRows } = await supabase
      .from("rate_history")
      .select("year, mfn_rate")
      .like("hts8", `${hs4}%`)
      .order("year", { ascending: true })
      .limit(200);

    // Aggregate history by year — rate_history stores mfn_rate as decimal fraction (0.03 = 3%)
    // Always multiply by 100, then filter sentinels (USITC sentinel 9999.99 → 999999%)
    const historyByYear: Record<number, number[]> = {};
    for (const row of (historyRows ?? [])) {
      const raw = row.mfn_rate ?? 0;
      const pct = raw * 100;
      if (pct > 200) continue; // filter sentinels and compound-duty placeholders
      if (!historyByYear[row.year]) historyByYear[row.year] = [];
      historyByYear[row.year].push(pct);
    }
    const rateHistory = Object.entries(historyByYear)
      .map(([yr, rates]) => ({
        year: parseInt(yr),
        rate: parseFloat((rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(2)),
      }))
      .sort((a, b) => a.year - b.year);

    // ── 4. Get volatility score ──
    const { data: volRow } = await supabase
      .from("hts_volatility")
      .select("volatility, max_year_jump, max_jump_year, risk_label, avg_rate, max_rate")
      .like("hts8", `${hs4}%`)
      .limit(1)
      .maybeSingle();

    // ── 5. USITC catalog rate (US domestic rate — used as fallback only) ──
    // hts_catalog stores mfn_rate as a decimal fraction (0.105 = 10.5%) — always ×100,
    // then filter sentinels (9999.99 → 999999%) same as the rate_history handling.
    const rawCatalogMfn = catalog?.mfn_rate ?? 0;
    const catalogPctRaw = rawCatalogMfn * 100;
    // Sentinel (>200%) means the duty is SPECIFIC (¢/kg, per unit) — not expressible as a
    // percentage. Treat the ad-valorem part as 0 but tell the user rather than implying duty-free.
    const isSpecificDuty = catalogPctRaw > 200;
    const catalogMfnPct = isSpecificDuty ? 0 : catalogPctRaw;
    const specific_duty_note = isSpecificDuty
      ? "This product carries a specific duty (charged per kg/unit, not as a percentage of value). The percentage shown excludes it — check the exact HTS line at hts.usitc.gov or with your broker for the per-unit amount."
      : null;
    // Only use USITC catalog as fallback when destination IS the US — it's a US-only dataset
    const usMfnFallback = destination_country === "United States"
      ? (liveEntry?.mfn_rate ?? (catalogMfnPct > 0 ? catalogMfnPct : 0))
      : null;
    // Use liveGlobal's rate as the base — NOT liveEntry (which falls back to liveOriginSpecific
    // when no global row exists). Using liveEntry would double-count origin-specific rates
    // when there is no global row (e.g. laptops: Section 301 China-only, no global duty).
    const baseRetaliationRate = s232Overridden ? 0 : (liveGlobal?.retaliation_rate ?? 0);
    const retaliation_rate = baseRetaliationRate + originSpecificRate;
    const retaliation_note = s232Overridden
      ? s232ExemptionNote
      : [liveGlobal?.retaliation_note, originSpecificNote].filter(Boolean).join(" | ") || null;
    const resolved_product = liveEntry?.product_name ?? catalog?.description ?? product_name ?? "Goods";
    const data_freshness = liveEntry?.synced_at ?? null;

    // ── 5b. WTO MFN + preferential rate — must run BEFORE effective_rate calculation ──
    // authoritative_mfn = what the DESTINATION country charges (their tariff on our goods)
    // This is the rate the exporter actually pays, not the US domestic rate
    const destWtoCode = WTO_COUNTRY_CODES[destination_country] ?? null;
    const ftaKey = `${destination_country}::${originCountry}`;
    const ftaAgreement = FTA_AGREEMENTS[ftaKey] ?? null;
    const [wtoMfn, wtoTradeFlow] = await Promise.all([
      destWtoCode ? getWtoMfnRate(destWtoCode, hs4) : Promise.resolve(null),
      getBilateralTradeFlow(originCountry, destination_country, hs4),
    ]);
    const wtoBound = WTO_BOUND_AVG[destination_country] ?? null;
    // authoritative_mfn: destination country's WTO rate (what they charge everyone)
    // Falls back to US catalog rate only if WTO API has no data for this corridor
    const authoritative_mfn = wtoMfn ?? usMfnFallback;
    const mfn_rate = authoritative_mfn; // alias for readability below

    // Always recompute effective_rate from live WTO MFN + stacked duties.
    // Never use liveEntry.effective_rate — it was calculated at scrape time with mfnRate=0
    // (WTO batch fails) so it only contains the retaliation portion, missing the MFN base.
    const effective_rate = parseFloat(((authoritative_mfn ?? 0) + retaliation_rate).toFixed(2));
    const tariff_cost_today = Math.round(shipment_value * (effective_rate / 100));

    const regulatory_flags = computeRegulatoryFlags(
      originCountry,
      destination_country,
      hs4,
      ftaAgreement,
      shipment_value
    );

    // Bound rate: country-level average across all products (no HS-level bound data exists
    // in the WTO API). Headroom only shown when the average bound exceeds this product's MFN.
    const bound_rate = wtoBound;
    const escalation_headroom = (bound_rate !== null && mfn_rate !== null && bound_rate > mfn_rate)
      ? parseFloat((bound_rate - mfn_rate).toFixed(1))
      : null;
    // Bilateral trade flow for this HS4 product — UN Comtrade, millions USD
    const bilateral_trade_value_m = wtoTradeFlow !== null ? parseFloat(wtoTradeFlow.toFixed(1)) : null;

    // Preferential rate: when a known FTA covers this corridor, qualifying goods enter at 0%
    // in nearly all cases (rules-of-origin dependent). The WTO API's HS_A_0020 is "maximum MFN
    // duty" — NOT a preferential rate — so we no longer query it.
    const preferential_rate = (ftaAgreement && authoritative_mfn !== null && authoritative_mfn > 0) ? 0 : null;
    const preferential_saving = (preferential_rate !== null && authoritative_mfn !== null)
      ? Math.round(shipment_value * ((authoritative_mfn - preferential_rate) / 100))
      : null;
    const preferential_note = ftaAgreement
      ? `${ftaAgreement} — qualifying goods enter duty-free, subject to rules of origin. Verify your product qualifies before claiming.`
      : null;

    // ── 6. Risk score (0–100) ──
    const volatility = volRow?.volatility ?? 0;
    const max_jump = volRow?.max_year_jump ?? 0;
    let risk_score = Math.min(100, Math.round(
      (effective_rate * 1.5) +
      (retaliation_rate > 0 ? 20 : 0) +
      (volatility * 200) +
      (max_jump * 150)
    ));
    // Derive label from current risk_score (not historical volatility label which may be stale)
    const risk_label = risk_score >= 60 ? "HIGH" : risk_score >= 30 ? "MEDIUM" : "LOW";

    // ── 7. Retaliation probability ──
    // Allies with stable trade relations rarely retaliate; active trade-war countries already have
    const ALLY_COUNTRIES = new Set(["Singapore", "Japan", "Canada", "Australia", "United Kingdom",
      "New Zealand", "South Korea", "Taiwan", "Germany", "France", "Netherlands"]);
    const ACTIVE_DISPUTE_COUNTRIES = new Set(["China", "Russia", "Iran", "Venezuela"]);
    const col2_rate = catalog?.col2_rate ?? 0;

    let retaliation_probability: number;
    if (retaliation_rate > 0) {
      // Already retaliating — probability of further escalation
      retaliation_probability = 0.60;
    } else if (ALLY_COUNTRIES.has(destination_country)) {
      // Stable ally — very low baseline, only if product is genuinely sensitive
      const ally_base = col2_rate > 0.20 ? 0.12 : 0.05;
      retaliation_probability = ally_base;
    } else if (ACTIVE_DISPUTE_COUNTRIES.has(destination_country)) {
      // Active trade disputes — elevated
      const hist_prob = max_jump > 0.05 ? 0.70 : max_jump > 0.02 ? 0.50 : 0.35;
      retaliation_probability = Math.min(0.90, hist_prob + (col2_rate > 0.15 ? 0.15 : 0));
    } else {
      // Neutral/other — moderate based on history
      const hist_prob = max_jump > 0.05 ? 0.40 : max_jump > 0.02 ? 0.25 : 0.12;
      retaliation_probability = Math.min(0.60, hist_prob + (col2_rate > 0.15 ? 0.10 : 0));
    }
    const retaliation_probability_pct = Math.round(retaliation_probability * 100);

    // ── 8. Alternative markets ──
    // Priority: live scraped retaliation data → WTO official MFN rate → exclude
    // Never fall back to the current product's own rate (makes all countries look identical)
    const altCountries = ALL_COUNTRIES.filter(c => c.name !== destination_country && c.name !== originCountry);
    const altResults = await Promise.all(
      altCountries.map(async (alt) => {
        // Same duty-stacking model as the main corridor: WTO MFN base + global duties
        // (origin=null) + duties specific to the USER'S origin. Never use stored
        // effective_rate — it was computed at scrape time with mfnRate=0.
        const [{ data: altGlobal }, { data: altOriginSpecific }, wtoRate] = await Promise.all([
          supabase
            .from("tariff_rates")
            .select("retaliation_rate")
            .eq("hs_code", hs_code.substring(0, 4))
            .eq("destination_country", alt.name)
            .is("origin_country", null)
            .maybeSingle(),
          supabase
            .from("tariff_rates")
            .select("retaliation_rate")
            .eq("hs_code", hs_code.substring(0, 4))
            .eq("destination_country", alt.name)
            .eq("origin_country", originCountry)
            .maybeSingle(),
          WTO_COUNTRY_CODES[alt.name]
            ? getWtoMfnRate(WTO_COUNTRY_CODES[alt.name], hs_code.substring(0, 4))
            : Promise.resolve(null),
        ]);

        const altRetaliation = (altGlobal?.retaliation_rate ?? 0) + (altOriginSpecific?.retaliation_rate ?? 0);
        const hasLiveData = altGlobal !== null || altOriginSpecific !== null;
        // Need at least one real data source; skip countries with neither
        if (wtoRate === null && !hasLiveData) return null;

        const altRate = (wtoRate ?? 0) + altRetaliation;
        if (altRate > 150) return null;

        const altCost = Math.round(shipment_value * (altRate / 100));
        return {
          country: alt.name,
          code: alt.code,
          rate: parseFloat(altRate.toFixed(1)),
          cost: altCost,
          retaliation: altRetaliation,
          saving: tariff_cost_today - altCost,
          source: hasLiveData ? "live" : "wto",
        };
      })
    );
    // Filter nulls, sort by rate, take top 3
    const bestAlts = altResults
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 3);

    // ── 9. Scenarios ──
    // Escalation: use real historical max jump if available; otherwise use country-specific risk
    const historicalMaxRate = rateHistory.length > 0 ? Math.max(...rateHistory.map(r => r.rate)) : effective_rate;
    const worstHistoricalJump = historicalMaxRate - effective_rate;
    // Escalation is: worst historical spike OR country-risk bump (25% for dispute countries, 5% for allies)
    const countryEscalationAdder = ACTIVE_DISPUTE_COUNTRIES.has(destination_country) ? 25
      : ALLY_COUNTRIES.has(destination_country) ? 5 : 15;
    const escalationDelta = Math.max(worstHistoricalJump, countryEscalationAdder);
    const escalatedRate = parseFloat(Math.min(effective_rate + escalationDelta, 150).toFixed(1));
    const escalatedCost = Math.round(shipment_value * (escalatedRate / 100));
    const escalationLabel = ACTIVE_DISPUTE_COUNTRIES.has(destination_country)
      ? `+${escalationDelta.toFixed(0)}% retaliatory escalation`
      : ALLY_COUNTRIES.has(destination_country)
      ? `+${escalationDelta.toFixed(0)}% under new trade pressure`
      : `+${escalationDelta.toFixed(0)}% escalation scenario`;
    const bestAlt = bestAlts[0];

    const scenarios = [
      {
        name: "Today",
        description: `Current effective rate: ${mfn_rate !== null ? `${mfn_rate}% MFN` : "rate unavailable"}${retaliation_rate > 0 ? ` + ${retaliation_rate}% retaliatory` : ""}. ${retaliation_note ?? ""}`,
        tariff_rate: effective_rate,
        tariff_cost: tariff_cost_today,
        net_proceeds: shipment_value - tariff_cost_today,
        severity: effective_rate >= 25 ? "high" : effective_rate >= 10 ? "medium" : effective_rate > 0 ? "low" : "none",
      },
      {
        name: `Escalation (${escalationLabel})`,
        description: `If trade tensions rise, rate reaches ${escalatedRate}%. ${volRow?.max_jump_year ? `Worst historical jump was in ${volRow.max_jump_year}.` : ""} Retaliation probability: ${retaliation_probability_pct}%.`,
        tariff_rate: escalatedRate,
        tariff_cost: escalatedCost,
        net_proceeds: shipment_value - escalatedCost,
        severity: escalatedRate >= 25 ? "high" : escalatedRate >= 10 ? "medium" : "low",
      },
      {
        name: bestAlt ? `Sell to ${bestAlt.country} instead` : "Alternative market",
        description: bestAlt
          ? `If you found buyers in ${bestAlt.country}, they'd face ${bestAlt.rate}% duty on this product${bestAlt.retaliation === 0 ? " — no additional duties" : ""} (${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(bestAlt.saving)} less than ${destination_country}). Note: this means selling to a different market, not rerouting this shipment — duty follows the goods' origin.`
          : "No better alternative found in our database.",
        tariff_rate: bestAlt?.rate ?? 0,
        tariff_cost: bestAlt?.cost ?? 0,
        net_proceeds: shipment_value - (bestAlt?.cost ?? 0),
        severity: (bestAlt?.rate ?? 0) === 0 ? "none" : (bestAlt?.rate ?? 0) < effective_rate ? "low" : "medium",
      },
    ];

    // ── 10. Groq AI analysis ──
    const histSummary = rateHistory.length > 0
      ? `Rate history (avg MFN by year): ${rateHistory.slice(-8).map(r => `${r.year}:${r.rate.toFixed(1)}%`).join(", ")}`
      : "No historical data available";

    const context = `
Product: ${resolved_product} (HS ${hs_code})
Origin: ${originCountry}
Destination: ${destination_country}
Shipment value: $${shipment_value.toLocaleString()}${incoterms ? `\nIncoterms: ${incoterms}` : ""}${quantity ? `\nQuantity: ${quantity}` : ""}
MFN duty (${destination_country} WTO applied rate): ${mfn_rate !== null ? `${mfn_rate}%` : "No WTO data — rate may be 0% or unavailable"}
WTO bound rate (legal ceiling): ${bound_rate !== null ? `${bound_rate}% (${escalation_headroom !== null ? `${escalation_headroom}% headroom to escalate` : "at ceiling"})` : "N/A"}
FTA preferential rate: ${preferential_rate !== null ? `${preferential_rate}% (saves $${preferential_saving?.toLocaleString() ?? 0})` : "None applicable"}
Additional/retaliatory duty (live scraped): ${retaliation_rate > 0 ? `${retaliation_rate}%` : "None"} ${retaliation_note ? `— ${retaliation_note}` : ""}
Origin-specific duty: ${originSpecificRate > 0 ? `${originSpecificRate}% — ${originSpecificNote ?? ""}` : "None"}
Effective rate today: ${effective_rate}%
Tariff cost today: $${tariff_cost_today.toLocaleString()}
Risk score: ${risk_score}/100 (${risk_label})
Retaliation probability: ${retaliation_probability_pct}%
Max historical rate spike: ${max_jump > 0 ? `${(max_jump * 100).toFixed(1)}% ${volRow?.max_jump_year ? `in ${volRow.max_jump_year}` : ""}` : "No spike — stable rate"}
${histSummary}
Alternative sales markets (different BUYERS in different countries — goods keep their ${originCountry} origin wherever they are routed, so re-routing the same US-bound shipment through another country does NOT change the US duty): ${bestAlt && bestAlt.saving > shipment_value * 0.02 ? `${bestAlt.country} charges ${bestAlt.rate}% (relevant only if diversifying sales there)` : "duty savings elsewhere are negligible — not decision-relevant"}
`.trim();

    // Is the duty burden itself significant? Below ~2% of shipment value, compliance readiness
    // matters far more than duty optimization — steer the AI recommendation accordingly.
    const dutyIsSignificant = tariff_cost_today > shipment_value * 0.02;

    let aiOutput = { risk_summary: "", recommendation: "", prediction: "" };
    try {
    let groqResp: Response | null = null;
    for (const groqKey of GROQ_KEYS) {
    groqResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(25000),
      headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a senior international trade advisor specializing in tariff analysis. You combine live tariff data with 29-year historical patterns to give precise, dollar-quantified advice on the shipment corridor ${originCountry} → ${destination_country}. Focus on what ${destination_country} charges on this product, any retaliatory or additional duties, and compliance readiness. Be direct. Use specific numbers. Max 120 words per section.

HARD RULES:
- NEVER suggest routing, transshipping, or "shipping through" a third country. Duty is based on country of origin — rerouting the same goods does not change it and suggesting it is transshipment advice.
- "Alternative markets" means selling to different buyers in a different country. Only mention if the duty difference is large enough to justify finding new buyers.
- If the duty cost is small relative to shipment value, do NOT center the recommendation on duty savings. Recommend the highest-impact compliance action for this corridor instead (e.g. for US-bound food: file FDA Prior Notice, verify facility registration, arrange FSVP importer, get third-party lab analysis).`,
          },
          {
            role: "user",
            content: `Based on this shipment data (${originCountry} → ${destination_country}) — including 29 years of rate history and live scraped tariff data — write:

1. RISK_SUMMARY (2-3 sentences): What is ${destination_country}'s current duty rate on this product from ${originCountry}? Explain the MFN rate, any retaliatory or additional duties in force, and the dollar cost. Reference historical rate pattern if relevant.

2. RECOMMENDATION (1-2 sentences): ${dutyIsSignificant
              ? "One specific action to reduce or manage the duty burden, with dollars quantified (FTA qualification, product engineering, market diversification — never rerouting the same goods)."
              : "The duty here is minor — give the single highest-impact compliance action for this corridor and product category before shipping. Do not recommend chasing small duty savings."} Be direct.

3. PREDICTION (2 sentences): Based on the historical rate pattern for this corridor and current trade climate, what is likely to happen to this rate in the next 6-12 months?

Return JSON: {"risk_summary": "...", "recommendation": "...", "prediction": "..."}

Data:
${context}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.25,
      }),
    });
    // Rotate to the fallback key only on rate-limit/auth failures
    if (groqResp.ok || ![429, 401, 403].includes(groqResp.status)) break;
    }

    if (groqResp && groqResp.ok) {
      const groqData = await groqResp.json();
      const raw = groqData.choices?.[0]?.message?.content ?? "{}";
      const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const match = jsonStr.match(/\{[\s\S]*\}/);
      try { aiOutput = JSON.parse(match?.[0] ?? "{}"); } catch { /* use defaults */ }
    }
    } catch { /* Groq timeout/outage — return the simulation without AI narrative */ }

    return new Response(JSON.stringify({
      hs_code,
      product_name: resolved_product,
      origin_country: originCountry,
      destination_country,
      shipment_value,
      mfn_rate: authoritative_mfn,
      retaliation_rate,
      effective_rate,
      retaliation_note,
      origin_specific_rate: originSpecificRate > 0 ? originSpecificRate : null,
      origin_specific_note: originSpecificNote,
      section_232_exempt: s232Overridden ? true : null,
      section_232_note: s232ExemptionNote,
      sanctions_alert: false,
      tariff_cost_today,
      // WTO preferential rate for this exact origin→destination corridor
      preferential_rate,
      preferential_saving,
      preferential_note,
      // WTO bound rate — legal ceiling the destination country cannot exceed without WTO renegotiation
      bound_rate,
      escalation_headroom,
      // Bilateral trade flow — how active this corridor actually is (millions USD, 2022)
      bilateral_trade_value_m,
      scenarios,
      risk_score,
      risk_label,
      retaliation_probability: retaliation_probability_pct,
      rate_history: rateHistory,
      alternative_markets: bestAlts,
      specific_duty_note,
      // hts_volatility has zeroed/corrupt rows for many products; when it disagrees with
      // rate_history (the sparkline's source), derive avg/peak from rate_history so the
      // header numbers always match the chart.
      volatility_stats: (() => {
        const histRates = rateHistory.map((r: { rate: number }) => r.rate);
        const histAvg = histRates.length ? histRates.reduce((a: number, b: number) => a + b, 0) / histRates.length : 0;
        const histMax = histRates.length ? Math.max(...histRates) : 0;
        const volAvg = Math.min((volRow?.avg_rate ?? 0) * 100, 150);
        const volMax = Math.min((volRow?.max_rate ?? 0) * 100, 150);
        const useHistory = histRates.length > 0 && volMax === 0 && histMax > 0;
        if (!volRow && !useHistory) return null;
        return {
          volatility: volRow?.volatility ?? 0,
          max_year_jump: Math.min((volRow?.max_year_jump ?? 0) * 100, 150),
          max_jump_year: volRow?.max_jump_year ?? null,
          avg_rate: useHistory ? histAvg : volAvg,
          max_rate: useHistory ? histMax : volMax,
        };
      })(),
      regulatory_flags,
      risk_summary: aiOutput.risk_summary,
      recommendation: aiOutput.recommendation,
      prediction: aiOutput.prediction,
      data_source: "USITC HTS 1998–2026 (262k rows) · WTO Timeseries API (MFN, Bound, Preferential, Trade Flows) · Live scraped retaliation data · FDA/CPSC/EPA/FCC/USDA compliance rules",
      data_freshness,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
