export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

/** "₹180" -> 180 */
export function parsePrice(price: string): number {
  return parseFloat(price.replace(/[^0-9.]/g, "")) || 0;
}

export function formatINR(amount: number): string {
  return `₹${Math.round(amount)}`;
}
