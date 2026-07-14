// US border fees that apply on top of duty. Rates per CBP FY2025 notices.
// MPF: 19 CFR 24.23 — 0.3464% ad valorem, min/max per formal entry.
// HMF: 0.125% ad valorem, ocean shipments only (19 CFR 24.24).

export const MPF_RATE = 0.003464;
export const MPF_MIN = 33.58;
export const MPF_MAX = 651.5;
export const HMF_RATE = 0.00125;

export type LandedCost = {
  shipmentValue: number;
  dutyPct: number; // combined effective rate, e.g. 28.5
  dutyCost: number;
  mpf: number;
  hmf: number; // 0 for air shipments
  total: number;
};

export function computeLandedCost(
  shipmentValue: number,
  dutyPct: number,
  mode: "ocean" | "air" = "ocean"
): LandedCost {
  const dutyCost = shipmentValue * (dutyPct / 100);
  const mpf = Math.min(Math.max(shipmentValue * MPF_RATE, MPF_MIN), MPF_MAX);
  const hmf = mode === "ocean" ? shipmentValue * HMF_RATE : 0;
  return {
    shipmentValue,
    dutyPct,
    dutyCost,
    mpf,
    hmf,
    total: shipmentValue + dutyCost + mpf + hmf,
  };
}
