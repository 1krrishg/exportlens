import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// ── Direct product → HS4 lookup for the most commonly traded goods ────────────
// This bypasses LLM hallucination for well-known products.
// Each entry lists 1-3 candidate headings to search in USITC, ranked by likelihood.
const DIRECT_LOOKUP: Record<string, string[]> = {
  // Computers & peripherals
  laptop: ["8471"], laptops: ["8471"], notebook: ["8471"],
  computer: ["8471"], computers: ["8471"], pc: ["8471"], desktop: ["8471"],
  server: ["8471"], workstation: ["8471"],
  tablet: ["8471"], ipad: ["8471"], "tablet computer": ["8471"],
  printer: ["8443"], scanner: ["8443"],
  keyboard: ["8471", "8473"], mouse: ["8471", "8473"], trackpad: ["8471", "8473"],
  monitor: ["8528"], display: ["8528"], screen: ["8528"],
  projector: ["9008"], hard: ["8471", "8473"], ssd: ["8471", "8473"],
  "hard drive": ["8471", "8473"], "solid state drive": ["8471", "8473"],
  router: ["8517"], modem: ["8517"], switch: ["8517"],
  webcam: ["8525"], "web camera": ["8525"],

  // Power & electrical
  charger: ["8504"], adapter: ["8504"], "power supply": ["8504"],
  transformer: ["8504"], inverter: ["8504"], "power adapter": ["8504"],
  cable: ["8544"], wire: ["8544"], "usb cable": ["8544"],
  connector: ["8536"], plug: ["8536"], socket: ["8536"],
  battery: ["8507"], batteries: ["8507"], "lithium battery": ["8507"],
  "solar panel": ["8541"], "solar cell": ["8541"], "photovoltaic": ["8541"],

  // Phones & comms
  phone: ["8517"], phones: ["8517"], smartphone: ["8517"], smartphones: ["8517"],
  iphone: ["8517"], android: ["8517"], mobile: ["8517"], handset: ["8517"],
  "cell phone": ["8517"], "cellular phone": ["8517"],
  headphones: ["8518"], headset: ["8518"], earbuds: ["8518"], earphones: ["8518"],
  speaker: ["8518"], microphone: ["8518"], amplifier: ["8518"],
  radio: ["8527"], walkie: ["8527"],

  // TVs & AV
  tv: ["8528"], television: ["8528"], oled: ["8528"], lcd: ["8528"],
  "flat screen": ["8528"], "smart tv": ["8528"],
  camera: ["9006", "8525"], "digital camera": ["9006", "8525"], dslr: ["9006"],
  drone: ["8806", "8802"],

  // Semiconductors
  semiconductor: ["8542"], chip: ["8542"], chips: ["8542"],
  microchip: ["8542"], processor: ["8542"], cpu: ["8542"],
  memory: ["8542", "8473"], ram: ["8542"], gpu: ["8542"],
  circuit: ["8542"], "integrated circuit": ["8542"],
  diode: ["8541"], transistor: ["8541"],

  // Vehicles
  car: ["8703"], cars: ["8703"], automobile: ["8703"], vehicle: ["8703"],
  suv: ["8703"], sedan: ["8703"], van: ["8703"],
  "electric vehicle": ["8703"], ev: ["8703"],
  truck: ["8704"], pickup: ["8704"],
  bus: ["8702"], motorcycle: ["8711"], motorbike: ["8711"],
  bicycle: ["8712"], scooter: ["8711", "8712"],
  tractor: ["8701"], "auto part": ["8708"], "car part": ["8708"],
  tire: ["4011"], tires: ["4011"], tyre: ["4011"],
  engine: ["8407", "8408"], "jet engine": ["8411"],

  // Aircraft & marine
  aircraft: ["8802"], airplane: ["8802"], helicopter: ["8802"],
  boat: ["8903"], ship: ["8901"], yacht: ["8903"],

  // Clothing & textiles
  shoes: ["6403", "6402", "6404"], shoe: ["6403", "6402", "6404"],
  "leather shoes": ["6403"], "dress shoes": ["6403"], "mens shoes": ["6403"],
  "leather boots": ["6403"], "leather sandals": ["6403"],
  "rubber shoes": ["6402"], "canvas shoes": ["6404"], "fabric shoes": ["6404"],
  sneakers: ["6404"], "athletic shoes": ["6404"], "running shoes": ["6404"],
  boots: ["6403"], sandals: ["6402"],
  shirt: ["6109", "6205"], tshirt: ["6109"], polo: ["6109"],
  jacket: ["6201", "6101"], coat: ["6201"], outerwear: ["6201"],
  jeans: ["6203"], pants: ["6203"], trousers: ["6203"],
  dress: ["6204"], skirt: ["6204"], blouse: ["6206"],
  suit: ["6203", "6204"], blazer: ["6203"],
  hat: ["6505", "6504"], cap: ["6505"],
  gloves: ["6116"], socks: ["6115"], hosiery: ["6115"],
  underwear: ["6107", "6108"], lingerie: ["6212"],
  sweater: ["6110"], jersey: ["6110"], hoodie: ["6110"],
  fabric: ["5208", "5209", "5210"], textile: ["5208"],
  cotton: ["5201"], silk: ["5007"], wool: ["5111"],
  leather: ["4107", "4205"],

  // Food & agriculture
  soybean: ["1201"], soybeans: ["1201"], soy: ["1201"],
  corn: ["1005"], maize: ["1005"], wheat: ["1001"],
  rice: ["1006"], sugar: ["1701"], coffee: ["0901"], tea: ["0902"],
  cocoa: ["1801"], chocolate: ["1806"],
  beef: ["0201", "0202"], veal: ["0201"],
  pork: ["0203"], ham: ["1601"], bacon: ["0210"],
  chicken: ["0207"], poultry: ["0207"],
  fish: ["0302", "0303"], salmon: ["0302", "0303"], tuna: ["0302", "0303"],
  shrimp: ["0306"], lobster: ["0306"], crab: ["0306"],
  milk: ["0401"], cheese: ["0406"], butter: ["0405"],
  eggs: ["0407"], orange: ["0805"], apple: ["0808"],
  banana: ["0803"], nuts: ["0801", "0802"], peanuts: ["1202"],
  olive: ["1509"], "olive oil": ["1509"], wine: ["2204"], beer: ["2203"],
  bourbon: ["2208"], whiskey: ["2208"], spirits: ["2208"],

  // Indian export staples
  basmati: ["1006"], "basmati rice": ["1006"],
  turmeric: ["0910"], haldi: ["0910"], ginger: ["0910"], saffron: ["0910"],
  cardamom: ["0908"], nutmeg: ["0908"], clove: ["0907"], cloves: ["0907"],
  cumin: ["0909"], jeera: ["0909"], coriander: ["0909"], fennel: ["0909"],
  pepper: ["0904"], chili: ["0904"], chilli: ["0904"], paprika: ["0904"],
  spice: ["0910", "0904", "0909"], spices: ["0910", "0904", "0909"], masala: ["0910", "0904", "0909"],
  cashew: ["0801"], cashews: ["0801"], "cashew nuts": ["0801"],
  "guar gum": ["1302"], guar: ["1302"],
  prawn: ["0306"], prawns: ["0306"],
  mango: ["0804"], "mango pulp": ["2007"],
  ayurvedic: ["3004", "2106"], ayurveda: ["3004", "2106"], "herbal supplement": ["2106"],
  saree: ["6204", "5407"], sari: ["6204", "5407"], kurta: ["6204", "6203"],
  "bed linen": ["6302"], "bed sheets": ["6302"], bedsheet: ["6302"], bedsheets: ["6302"], towel: ["6302"], towels: ["6302"],
  carpet: ["5701", "5703"], carpets: ["5701", "5703"], rug: ["5701", "5703"], rugs: ["5701", "5703"], durrie: ["5702"],
  "cotton yarn": ["5205"], yarn: ["5205"],
  "t-shirt": ["6109"], "t-shirts": ["6109"], tshirts: ["6109"], tee: ["6109"], tees: ["6109"],
  "steel pipe": ["7306"], "steel pipes": ["7306"], "welded pipe": ["7306"], "welded pipes": ["7306"], pipe: ["7306"], pipes: ["7306"],
  flange: ["7307"], flanges: ["7307"], "pipe fittings": ["7307"],
  "brake pads": ["8708"], "brake pad": ["8708"], brake: ["8708"], brakes: ["8708"],
  "brass statue": ["8306"], "brass statues": ["8306"], "metal statue": ["8306"], statuette: ["8306", "4420"],
  handicraft: ["4420", "8306"], handicrafts: ["4420", "8306"],
  "brass handicrafts": ["8306"], brass: ["8306", "7419"], "wood carving": ["4420"],
  "leather bag": ["4202"], "leather bags": ["4202"], "leather wallet": ["4202"], handbag: ["4202"], handbags: ["4202"],
  "leather footwear": ["6403"],
  "gold jewelry": ["7113"], "gold jewellery": ["7113"], "silver jewelry": ["7113"], "silver jewellery": ["7113"],
  "imitation jewelry": ["7117"], "imitation jewellery": ["7117"],
  granite: ["6802", "2516"], marble: ["6802", "2515"],

  // Metals & materials
  steel: ["7208", "7210", "7214"], iron: ["7214"],
  aluminum: ["7604", "7606"], aluminium: ["7604", "7606"],
  copper: ["7401", "7408"], gold: ["7108"], silver: ["7106"],
  zinc: ["7901"], nickel: ["7502"],
  lumber: ["4407"], wood: ["4407"], timber: ["4407"], plywood: ["4412"],
  glass: ["7005", "7003"], plastic: ["3901", "3926"], rubber: ["4002"],
  paper: ["4802"], cardboard: ["4808"], cement: ["2523"],
  ceramic: ["6907"], tile: ["6907"],

  // Energy & chemicals
  petroleum: ["2709"], "crude oil": ["2709"], oil: ["2709"],
  gas: ["2711"], lng: ["2711"], "natural gas": ["2711"],
  coal: ["2701"], fertilizer: ["3102", "3104"],
  chemical: ["2901", "2902"], paint: ["3208"], resin: ["3901"],

  // Pharma & medical
  medicine: ["3004"], drug: ["3004"], drugs: ["3004"],
  pharmaceutical: ["3004"], vaccine: ["3002"],
  "medical device": ["9018"], syringe: ["9018"], mask: ["6307"],
  glove: ["4015"], "surgical glove": ["4015"],

  // Furniture & home
  furniture: ["9403", "9401"], sofa: ["9401"], chair: ["9401"],
  table: ["9403"], desk: ["9403"], bed: ["9403"], mattress: ["9404"],
  lamp: ["9405"], lighting: ["9405"],
  refrigerator: ["8418"], fridge: ["8418"],
  "washing machine": ["8450"], dishwasher: ["8422"], oven: ["8516"],
  microwave: ["8516"], "air conditioner": ["8415"], vacuum: ["8508"],

  // Watches & luxury
  watch: ["9102", "9101"], jewelry: ["7113"], jewellery: ["7113"],
  diamond: ["7102"], perfume: ["3303"], cosmetics: ["3304"],

  // Toys & sports
  toy: ["9503"], toys: ["9503"], game: ["9504"],
  "game console": ["9504"], playstation: ["9504"], xbox: ["9504"],
  golf: ["9506"], "sports equipment": ["9506"],
};

// ── Chapter exclusion and disambiguation knowledge injected into LLM prompt ───
const CLASSIFICATION_RULES = `
CRITICAL CHAPTER EXCLUSIONS AND DISAMBIGUATION RULES (apply before classifying):

Section XVI / Chapter 84-85 (Machinery & Electronics):
- ADP machines (computers, laptops, tablets): HS 8471. NOT 8504, NOT 8543.
- Power supplies, chargers, adapters, inverters, transformers: HS 8504. NOT 8471.
- Smartphones, mobile phones, telephones: HS 8517. NOT 8471, NOT 8525.
- Monitors, TV sets: HS 8528. NOT 8471, NOT 9004.
- Integrated circuits, microchips, processors, semiconductors: HS 8542. NOT 8471.
- Diodes, LEDs, solar cells, transistors (discrete): HS 8541. NOT 8542.
- Insulated wire, cable: HS 8544. NOT 8536.
- Electrical switches, plugs, sockets, connectors: HS 8536. NOT 8544.
- Parts for ADP machines (keyboards, mice, USB hubs): HS 8473. NOT 8471.
- Cameras (photographic): HS 9006. Video cameras: HS 8525.
- Printers: HS 8443. NOT 8471.

Section XVII / Chapter 87 (Vehicles):
- Passenger cars (gasoline, diesel, electric, hybrid): HS 8703. NOT 8704.
- Trucks, lorries: HS 8704. NOT 8703.
- Parts for motor vehicles: HS 8708. NOT 8703, NOT 8704.
- Tires (pneumatic, rubber): HS 4011. NOT Chapter 87.

Section XI (Textiles):
- Footwear with leather uppers: HS 6403. With textile uppers: HS 6404. With rubber: HS 6402.
- Classify knitted garments under Chapter 61, woven under Chapter 62.
- T-shirts, polo shirts (knitted): HS 6109. Woven shirts: HS 6205.

Food (Chapters 1-24):
- Fresh/chilled/frozen beef: HS 0201/0202. Processed/salted/smoked: HS 0210.
- Fresh fruit: HS 0803-0810. Frozen fruit: HS 0811.
- Spirits (whiskey, bourbon, vodka, rum): HS 2208.

General rules:
- If a product is a COMPLETE FINISHED PRODUCT, classify under the finished product heading, not its materials or parts.
- A laptop is HS 8471, NOT classified under glass (8524), plastic (3926), or metals.
- If a product has a specific heading that describes it exactly, use GRI 1 — do not mix headings.
- When the product includes software, classify by the physical medium or device, not the software.
`;

interface UsitcRow {
  hts8: string;
  description: string;
  mfn_rate: number;
}

interface CbpRuling {
  rulingNumber?: string;
  reference?: string;
  subject?: string;
  issueDate?: string;
  tariffNumbers?: string[];
}

const GROQ_API_KEY_2 = Deno.env.get("GROQ_API_KEY_2") ?? "";

async function callGroq(messages: { role: string; content: string }[], maxTokens = 1200): Promise<string> {
  const keys = [GROQ_API_KEY, GROQ_API_KEY_2].filter(Boolean);
  let lastErr = "";
  for (const key of keys) {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.0,
        max_tokens: maxTokens,
        messages,
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      return data.choices?.[0]?.message?.content ?? "";
    }
    lastErr = `Groq error ${resp.status}: ${await resp.text()}`;
    // Only rotate to the next key on rate limits/auth issues; other errors won't improve
    if (![429, 401, 403].includes(resp.status)) break;
  }
  throw new Error(lastErr);
}

function parseJson(raw: string): unknown {
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try { return JSON.parse(cleaned); } catch { /* */ }
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (match) { try { return JSON.parse(match[0]); } catch { /* */ } }
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) { try { return [JSON.parse(objMatch[0])]; } catch { /* */ } }
  return [];
}

async function searchCbpRulings(query: string, hs4: string): Promise<CbpRuling | null> {
  try {
    const url = `https://rulings.cbp.gov/api/search?term=${encodeURIComponent(query)}&collection=ALL&pageSize=5&page=1`;
    const resp = await fetch(url, { headers: { "Accept": "application/json" }, signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return null;
    const data = await resp.json();
    const rulings: CbpRuling[] = data?.results ?? data?.rulings ?? [];
    const match = rulings.find(r => r.tariffNumbers?.some((t: string) => t.replace(/\./g, "").startsWith(hs4)));
    return match ?? rulings[0] ?? null;
  } catch { return null; }
}

// Search USITC catalog within specific HS4 headings
async function fetchUsitcCandidates(
  supabase: ReturnType<typeof createClient>,
  hs4Headings: string[],
  query: string,
): Promise<UsitcRow[]> {
  const results: UsitcRow[] = [];
  const seen = new Set<string>();

  // For each heading, get the entries that best match the product description
  await Promise.all(hs4Headings.slice(0, 4).map(async (hs4) => {
    // Get all 8-digit entries under this heading
    const { data: headingRows } = await supabase
      .from("hts_catalog")
      .select("hts8, description, mfn_rate")
      .like("hts8", `${hs4}%`)
      .limit(20);

    if (!headingRows || headingRows.length === 0) return;

    // Add all entries for this heading (LLM will rank them)
    for (const row of headingRows) {
      if (!seen.has(row.hts8)) {
        seen.add(row.hts8);
        results.push(row);
      }
    }
  }));

  // Keyword search across full catalog — ONLY as fallback when heading search found nothing.
  // Stopwords filtered so "used blue vase with handle" doesn't ilike-match on "used"/"with".
  if (results.length > 0) return results;
  const STOPWORDS = new Set(["with", "from", "that", "this", "made", "used", "new", "blue", "red", "green", "black", "white", "small", "large", "high", "quality", "pack", "piece", "pieces", "set", "type", "style", "size", "each", "unit", "units", "the", "and", "for"]);
  const keywords = query.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !STOPWORDS.has(w));
  for (const kw of keywords.slice(0, 2)) {
    const { data: kwRows } = await supabase
      .from("hts_catalog")
      .select("hts8, description, mfn_rate")
      .ilike("description", `%${kw}%`)
      .limit(10);

    for (const row of (kwRows ?? [])) {
      if (!seen.has(row.hts8)) {
        seen.add(row.hts8);
        results.push(row);
      }
    }
  }

  return results;
}

// Phase 1: LLM identifies likely HS4 headings (not full 8-digit codes)
async function identifyHeadings(description: string): Promise<string[]> {
  // Check direct lookup first — try longest matching key first (most specific)
  const lower = description.toLowerCase().trim();

  // Keys too generic to trust inside longer phrases — exact-match only.
  // "coconut oil" must NOT hit oil→crude petroleum; "gas grill" must NOT hit gas→LNG;
  // "mobile home" must NOT hit mobile→smartphones; "hard hat" must NOT hit hard→computers.
  const EXACT_ONLY = new Set(["oil", "gas", "hard", "switch", "mobile", "parts", "electric", "device", "container", "panel", "glove", "mask", "engine", "memory", "chip", "chips", "table", "suit", "yarn", "brass", "ginger", "pepper", "pipe", "pipes"]);
  if (DIRECT_LOOKUP[lower]) return DIRECT_LOOKUP[lower];

  // Sort keys by length descending so longer/more-specific keys match first
  const sortedKeys = Object.keys(DIRECT_LOOKUP)
    .filter(k => !EXACT_ONLY.has(k))
    .sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (lower.startsWith(key + " ") || lower.endsWith(" " + key) || lower.includes(" " + key + " ")) {
      return DIRECT_LOOKUP[key];
    }
  }
  // Try 2-word combos, then single words
  const words = lower.split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    if (DIRECT_LOOKUP[bigram] && !EXACT_ONLY.has(bigram)) return DIRECT_LOOKUP[bigram];
  }
  for (const word of words) {
    if (DIRECT_LOOKUP[word] && !EXACT_ONLY.has(word)) {
      return DIRECT_LOOKUP[word];
    }
  }

  // Fall back to LLM for heading identification only
  const raw = await callGroq([
    {
      role: "system",
      content: `You are a US customs classification expert. Given a product description, identify the 1-3 most likely HTSUS 4-digit headings.
${CLASSIFICATION_RULES}

Return ONLY a JSON array of 4-digit heading codes as strings. Maximum 3 headings. Examples:
- "laptop computer" → ["8471"]
- "laptop charger" → ["8504"]
- "leather dress shoes" → ["6403"]
- "soybeans" → ["1201"]

Return ONLY the JSON array, nothing else.`,
    },
    { role: "user", content: `Product: "${description}"` },
  ], 200);

  try {
    const parsed = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    if (Array.isArray(parsed)) {
      return parsed.filter((x: unknown) => typeof x === "string" && /^\d{4}$/.test(x)).slice(0, 3);
    }
  } catch { /* */ }
  return [];
}

interface RankedCandidate {
  hts8: string;
  gri_rule: string;
  reasoning: string;
  confidence: number;
  disqualified_headings: string;
}

// Phase 2: LLM ranks actual USITC catalog entries for the product
async function rankCandidates(
  description: string,
  usitcRows: UsitcRow[],
): Promise<RankedCandidate[]> {
  if (usitcRows.length === 0) return [];

  // Build catalog list for LLM
  const catalogText = usitcRows
    .slice(0, 30) // cap to avoid token overflow
    .map(r => `${r.hts8} — ${r.description} (MFN: ${r.mfn_rate !== null ? (r.mfn_rate * 100).toFixed(1) + "%" : "N/A"})`)
    .join("\n");

  const raw = await callGroq([
    {
      role: "system",
      content: `You are a licensed US customs broker applying WCO General Rules of Interpretation (GRI) to classify goods under the HTSUS.
${CLASSIFICATION_RULES}

You will be given:
1. A product description from an importer/exporter
2. A list of actual HTSUS catalog entries (8-digit codes with descriptions and MFN rates)

Your task: Select the 1-3 best matching entries from the catalog list that correctly classify this product. Rank by confidence.

IMPORTANT: You MUST only return hts8 codes that appear in the catalog list provided. Do NOT invent codes.

Return a JSON array of objects:
{
  "hts8": "exact 8-digit code from the catalog list above",
  "gri_rule": "GRI rule applied (1, 2a, 2b, 3a, 3b, 3c, or 6)",
  "reasoning": "one sentence: why this specific 8-digit code fits the product",
  "confidence": integer 0-100,
  "disqualified_headings": "other headings from the list considered and why rejected (or empty string)"
}

Return ONLY the JSON array. No markdown. No explanation.`,
    },
    {
      role: "user",
      content: `Product: "${description}"\n\nAvailable HTSUS catalog entries:\n${catalogText}`,
    },
  ], 1000);

  const parsed = parseJson(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed as RankedCandidate[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { description } = await req.json();
    if (!description || description.trim().length < 2) {
      return new Response(JSON.stringify({ error: "description required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Phase 1: Identify likely HS4 headings ─────────────────────────────────
    // If the LLM heading-identifier is down (rate limit/outage), continue with no
    // headings — phase 2 falls back to keyword search over the USITC catalog.
    let headings: string[];
    try {
      headings = await identifyHeadings(description);
    } catch (headingErr) {
      console.error("identifyHeadings failed, relying on keyword fallback:", headingErr);
      headings = [];
    }

    // ── Phase 2: Fetch actual USITC catalog entries for those headings ────────
    const usitcRows = await fetchUsitcCandidates(supabase, headings, description);

    // ── Phase 3: LLM ranks actual catalog entries ─────────────────────────────
    // If Groq is down or rate-limited, degrade to lookup order instead of failing the
    // whole request — the direct-lookup headings are already high-signal.
    let ranked: Awaited<ReturnType<typeof rankCandidates>>;
    try {
      ranked = await rankCandidates(description, usitcRows);
    } catch (rankErr) {
      console.error("rankCandidates failed, using lookup-order fallback:", rankErr);
      ranked = [];
    }

    // ── Phase 4: Deduplicate and enrich with CBP rulings ─────────────────────
    const seenCodes = new Set<string>();
    const uniqueRanked = ranked.filter(c => {
      if (!c.hts8 || seenCodes.has(c.hts8)) return false;
      // Verify the code actually exists in our USITC data
      const exists = usitcRows.some(r => r.hts8 === c.hts8);
      if (!exists) return false;
      seenCodes.add(c.hts8);
      return true;
    });

    // If LLM returned nothing valid, fall back to top USITC rows from the identified headings
    // Degraded-mode fallback: order candidates by word overlap with the query instead of
    // DB order (so "frozen shrimp" prefers the shrimp line over crabmeat within 0306).
    const qWords = description.toLowerCase().split(/\W+/).filter((w: string) => w.length > 2);
    const scored = [...usitcRows].sort((a, b) => {
      const score = (r: typeof a) => {
        const d = (r.description ?? "").toLowerCase();
        return qWords.reduce((n: number, w: string) => n + (d.includes(w) ? 1 : 0), 0);
      };
      return score(b) - score(a);
    });
    const finalRanked = uniqueRanked.length > 0
      ? uniqueRanked
      : scored.slice(0, 2).map((r, i) => ({
          hts8: r.hts8,
          gri_rule: "1",
          reasoning: `Best USITC match for "${description}" under heading ${r.hts8.substring(0, 4)}`,
          confidence: i === 0 ? 60 : 40,
          disqualified_headings: "",
        }));

    // Enrich top 3 with CBP rulings in parallel
    const enriched = await Promise.all(
      finalRanked.slice(0, 3).map(async (c) => {
        const usitcRow = usitcRows.find(r => r.hts8 === c.hts8);
        const hs4 = c.hts8.substring(0, 4);
        const cbpRuling = await searchCbpRulings(`${description} ${usitcRow?.description ?? ""}`.substring(0, 80), hs4);

        const cbpHsMatches = cbpRuling?.tariffNumbers?.some(
          (t: string) => t.replace(/\./g, "").startsWith(hs4)
        ) ?? false;

        // Boost confidence if CBP ruling confirms same heading
        let confidence = Math.min(99, Math.max(5, Math.round(c.confidence)));
        if (cbpRuling) confidence = Math.min(99, confidence + 8);
        if (cbpHsMatches) confidence = Math.min(99, confidence + 7);

        return {
          hts8: c.hts8,
          heading: hs4,
          description: usitcRow?.description ?? c.hts8,
          gri_rule: c.gri_rule ?? "1",
          reasoning: c.reasoning,
          confidence,
          disqualified: c.disqualified_headings ?? "",
          mfn_rate: usitcRow?.mfn_rate ?? null,
          usitc_validated: !!usitcRow,
          cbp_ruling: cbpRuling ? {
            number: cbpRuling.rulingNumber ?? cbpRuling.reference ?? null,
            subject: cbpRuling.subject ?? null,
            date: cbpRuling.issueDate ?? null,
            hs_match: cbpHsMatches,
          } : null,
        };
      })
    );

    // Sort by confidence descending
    enriched.sort((a, b) => b.confidence - a.confidence);

    return new Response(JSON.stringify({ candidates: enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
