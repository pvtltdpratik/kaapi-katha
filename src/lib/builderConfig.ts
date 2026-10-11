/**
 * Single source of truth for the "Build Your Cup" configuration: the option
 * lists, the price calculation, and the cart line it turns into. The 3D scene
 * and the controls both read from here so they can never disagree.
 */

export const SIZES = ["Small", "Regular", "Large"] as const;
export const MILKS = ["Whole Milk", "Oat Milk", "Almond Milk", "Coconut Milk"] as const;
export const SYRUPS = ["None", "Jaggery", "Cardamom", "Rose"] as const;

export type CupSize = (typeof SIZES)[number];
export type MilkType = (typeof MILKS)[number];
export type SyrupType = (typeof SYRUPS)[number];

export const SHOTS_MIN = 1;
export const SHOTS_MAX = 4;
export const PUMPS_MIN = 1;
export const PUMPS_MAX = 6;

export interface BuilderConfig {
  size: CupSize;
  milk: MilkType;
  shots: number;
  syrup: SyrupType;
  pumps: number;
  cream: boolean;
  drizzle: boolean;
  cinnamon: boolean;
}

export const DEFAULT_CONFIG: BuilderConfig = {
  size: "Regular",
  milk: "Whole Milk",
  shots: 2,
  syrup: "Jaggery",
  pumps: 2,
  cream: false,
  drizzle: false,
  cinnamon: false,
};

export const SIZE_PRICE: Record<CupSize, number> = { Small: 120, Regular: 150, Large: 180 };
export const SIZE_SCALE: Record<CupSize, number> = { Small: 0.88, Regular: 1, Large: 1.12 };
export const MILK_SURCHARGE: Record<MilkType, number> = {
  "Whole Milk": 0,
  "Oat Milk": 30,
  "Almond Milk": 30,
  "Coconut Milk": 30,
};
export const EXTRA_SHOT_PRICE = 40; // first shot is included
export const PUMP_PRICE = 10;
export const TOPPING_PRICE = { cream: 30, drizzle: 20, cinnamon: 10 } as const;

export interface PriceLine {
  label: string;
  amount: number;
}

export function priceBreakdown(c: BuilderConfig): PriceLine[] {
  const lines: PriceLine[] = [{ label: `${c.size} cup`, amount: SIZE_PRICE[c.size] }];
  if (MILK_SURCHARGE[c.milk] > 0) lines.push({ label: c.milk, amount: MILK_SURCHARGE[c.milk] });
  if (c.shots > 1) {
    lines.push({ label: `${c.shots - 1} extra ${c.shots - 1 === 1 ? "shot" : "shots"}`, amount: (c.shots - 1) * EXTRA_SHOT_PRICE });
  }
  if (c.syrup !== "None") {
    lines.push({ label: `${c.syrup} × ${c.pumps}`, amount: c.pumps * PUMP_PRICE });
  }
  if (c.cream) lines.push({ label: "Fresh cream", amount: TOPPING_PRICE.cream });
  if (c.drizzle) lines.push({ label: "Jaggery drizzle", amount: TOPPING_PRICE.drizzle });
  if (c.cinnamon) lines.push({ label: "Cinnamon", amount: TOPPING_PRICE.cinnamon });
  return lines;
}

export function totalPrice(c: BuilderConfig): number {
  return priceBreakdown(c).reduce((sum, l) => sum + l.amount, 0);
}

export function toppingList(c: BuilderConfig): string[] {
  const out: string[] = [];
  if (c.cream) out.push("Fresh Cream");
  if (c.drizzle) out.push("Jaggery Drizzle");
  if (c.cinnamon) out.push("Cinnamon");
  return out;
}

/** Short human description used as the cart line's subtitle. */
export function describeConfig(c: BuilderConfig): string {
  const parts = [`${c.shots} ${c.shots === 1 ? "shot" : "shots"}`, c.milk];
  if (c.syrup !== "None") parts.push(`${c.pumps} ${c.pumps === 1 ? "pump" : "pumps"} ${c.syrup}`);
  const tops = toppingList(c);
  if (tops.length) parts.push(tops.join(", "));
  return parts.join(" · ");
}

/** Stable numeric id: the same drink always merges into one cart line. */
export function configId(c: BuilderConfig): number {
  const key = JSON.stringify([c.size, c.milk, c.shots, c.syrup, c.syrup === "None" ? 0 : c.pumps, c.cream, c.drizzle, c.cinnamon]);
  let h = 5381;
  for (let i = 0; i < key.length; i++) h = ((h << 5) + h + key.charCodeAt(i)) | 0;
  return 1_000_000 + (Math.abs(h) % 900_000_000);
}

/** Serialised form used to detect "the drink changed" without deep compares. */
export function configKey(c: BuilderConfig): string {
  return JSON.stringify(c);
}
