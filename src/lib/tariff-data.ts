export type TariffEntry = {
  hs_code: string;
  product_name: string;
  destination_country: string;
  destination_code: string;
  mfn_rate: number;
  retaliation_rate: number;
  effective_rate: number;
  retaliation_note: string;
  last_updated: string;
};

export const TARIFF_DATA: TariffEntry[] = [
  // China
  { hs_code: "1201", product_name: "Soybeans", destination_country: "China", destination_code: "CN", mfn_rate: 3, retaliation_rate: 25, effective_rate: 28, retaliation_note: "China retaliatory tariff on US agricultural goods (2018, maintained 2025)", last_updated: "2025-11-01" },
  { hs_code: "2208", product_name: "Bourbon / American Whiskey", destination_country: "China", destination_code: "CN", mfn_rate: 10, retaliation_rate: 25, effective_rate: 35, retaliation_note: "China retaliatory tariff on US spirits", last_updated: "2025-11-01" },
  { hs_code: "8803", product_name: "Aircraft parts", destination_country: "China", destination_code: "CN", mfn_rate: 5, retaliation_rate: 25, effective_rate: 30, retaliation_note: "China retaliatory tariff on US manufactured goods", last_updated: "2025-11-01" },
  { hs_code: "1005", product_name: "Corn / Maize", destination_country: "China", destination_code: "CN", mfn_rate: 1, retaliation_rate: 25, effective_rate: 26, retaliation_note: "China retaliatory tariff on US agricultural goods", last_updated: "2025-11-01" },
  { hs_code: "8542", product_name: "Semiconductors / ICs", destination_country: "China", destination_code: "CN", mfn_rate: 0, retaliation_rate: 25, effective_rate: 25, retaliation_note: "China retaliatory tariff on US tech goods", last_updated: "2025-11-01" },
  { hs_code: "0207", product_name: "Poultry / Chicken", destination_country: "China", destination_code: "CN", mfn_rate: 10, retaliation_rate: 25, effective_rate: 35, retaliation_note: "China retaliatory tariff on US food products", last_updated: "2025-11-01" },

  // European Union
  { hs_code: "2208", product_name: "Bourbon / American Whiskey", destination_country: "European Union", destination_code: "EU", mfn_rate: 10, retaliation_rate: 25, effective_rate: 35, retaliation_note: "EU retaliatory tariff on US spirits (steel/aluminum dispute)", last_updated: "2025-06-01" },
  { hs_code: "0201", product_name: "Beef", destination_country: "European Union", destination_code: "EU", mfn_rate: 12, retaliation_rate: 25, effective_rate: 37, retaliation_note: "EU retaliatory tariff on US agricultural goods", last_updated: "2025-06-01" },
  { hs_code: "0402", product_name: "Dairy / Milk powder", destination_country: "European Union", destination_code: "EU", mfn_rate: 7, retaliation_rate: 25, effective_rate: 32, retaliation_note: "EU retaliatory tariff on US dairy", last_updated: "2025-06-01" },
  { hs_code: "8542", product_name: "Semiconductors / ICs", destination_country: "European Union", destination_code: "EU", mfn_rate: 0, retaliation_rate: 0, effective_rate: 0, retaliation_note: "No retaliation on semiconductors", last_updated: "2025-06-01" },
  { hs_code: "8703", product_name: "Passenger vehicles / Cars", destination_country: "European Union", destination_code: "EU", mfn_rate: 6.5, retaliation_rate: 25, effective_rate: 31.5, retaliation_note: "EU retaliatory tariff on US auto goods", last_updated: "2025-06-01" },

  // Canada
  { hs_code: "8703", product_name: "Passenger vehicles / Cars", destination_country: "Canada", destination_code: "CA", mfn_rate: 0, retaliation_rate: 25, effective_rate: 25, retaliation_note: "Canada retaliatory tariff (steel/aluminum dispute)", last_updated: "2025-06-01" },
  { hs_code: "0201", product_name: "Beef", destination_country: "Canada", destination_code: "CA", mfn_rate: 0, retaliation_rate: 10, effective_rate: 10, retaliation_note: "Canada retaliatory tariff on US agricultural products", last_updated: "2025-06-01" },
  { hs_code: "2208", product_name: "Bourbon / American Whiskey", destination_country: "Canada", destination_code: "CA", mfn_rate: 0, retaliation_rate: 10, effective_rate: 10, retaliation_note: "Canada retaliatory tariff on US spirits", last_updated: "2025-06-01" },
  { hs_code: "1201", product_name: "Soybeans", destination_country: "Canada", destination_code: "CA", mfn_rate: 0, retaliation_rate: 0, effective_rate: 0, retaliation_note: "No retaliation — USMCA exemption", last_updated: "2025-06-01" },

  // Japan
  { hs_code: "1201", product_name: "Soybeans", destination_country: "Japan", destination_code: "JP", mfn_rate: 0, retaliation_rate: 0, effective_rate: 0, retaliation_note: "No retaliation — US-Japan Trade Agreement", last_updated: "2025-06-01" },
  { hs_code: "2208", product_name: "Bourbon / American Whiskey", destination_country: "Japan", destination_code: "JP", mfn_rate: 0, retaliation_rate: 0, effective_rate: 0, retaliation_note: "No retaliation — US-Japan Trade Agreement", last_updated: "2025-06-01" },
  { hs_code: "0201", product_name: "Beef", destination_country: "Japan", destination_code: "JP", mfn_rate: 9, retaliation_rate: 0, effective_rate: 9, retaliation_note: "Standard MFN rate only, no retaliation", last_updated: "2025-06-01" },
  { hs_code: "8542", product_name: "Semiconductors / ICs", destination_country: "Japan", destination_code: "JP", mfn_rate: 0, retaliation_rate: 0, effective_rate: 0, retaliation_note: "No tariff on semiconductors", last_updated: "2025-06-01" },

  // Mexico
  { hs_code: "1005", product_name: "Corn / Maize", destination_country: "Mexico", destination_code: "MX", mfn_rate: 0, retaliation_rate: 20, effective_rate: 20, retaliation_note: "Mexico retaliatory tariff on US corn", last_updated: "2025-06-01" },
  { hs_code: "0201", product_name: "Beef", destination_country: "Mexico", destination_code: "MX", mfn_rate: 0, retaliation_rate: 20, effective_rate: 20, retaliation_note: "Mexico retaliatory tariff on US agricultural goods", last_updated: "2025-06-01" },
  { hs_code: "1201", product_name: "Soybeans", destination_country: "Mexico", destination_code: "MX", mfn_rate: 0, retaliation_rate: 0, effective_rate: 0, retaliation_note: "USMCA — no tariff", last_updated: "2025-06-01" },

  // India
  { hs_code: "8542", product_name: "Semiconductors / ICs", destination_country: "India", destination_code: "IN", mfn_rate: 0, retaliation_rate: 0, effective_rate: 0, retaliation_note: "No retaliation on semiconductors", last_updated: "2025-06-01" },
  { hs_code: "0201", product_name: "Beef", destination_country: "India", destination_code: "IN", mfn_rate: 30, retaliation_rate: 0, effective_rate: 30, retaliation_note: "High MFN rate, no retaliation", last_updated: "2025-06-01" },
  { hs_code: "2208", product_name: "Bourbon / American Whiskey", destination_country: "India", destination_code: "IN", mfn_rate: 150, retaliation_rate: 0, effective_rate: 150, retaliation_note: "India baseline tariff on spirits — very high MFN", last_updated: "2025-06-01" },
];

export const DESTINATION_COUNTRIES = [...new Set(TARIFF_DATA.map(t => t.destination_country))].sort();
export const PRODUCTS = [...new Map(TARIFF_DATA.map(t => [t.hs_code, { hs_code: t.hs_code, name: t.product_name }])).values()];

export function lookupTariff(hs_code: string, destination_country: string): TariffEntry | null {
  return TARIFF_DATA.find(
    t => t.hs_code === hs_code && t.destination_country === destination_country
  ) ?? null;
}
