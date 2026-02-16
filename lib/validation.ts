export function isValidFolio(folio: string): boolean {
  return /^[A-Z]{2,6}-?\d{4,8}$/i.test(folio.trim());
}

export function isValidPAN(pan: string): boolean {
  return /^[A-Z]{5}\d{4}[A-Z]$/i.test(pan.trim());
}

export function isValidIFSC(ifsc: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc.trim());
}

export function isValidAccountNumber(accountNumber: string): boolean {
  return /^\d{9,18}$/.test(accountNumber.trim());
}

export function isHighValueAmount(amount: number): boolean {
  return amount > 50000;
}

export function parseRedemptionAmountInput(
  input: string | number,
): number | null {
  if (typeof input === "number") {
    return Number.isFinite(input) ? input : null;
  }

  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/₹|rs\.?|inr/g, "")
    .replace(/,/g, "")
    .trim();

  if (!normalized) return null;

  const match = normalized.match(/^([0-9]*\.?[0-9]+)\s*([a-z]+)?$/);
  if (!match) return null;

  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;

  const unit = match[2] ?? "";
  const multipliers: Record<string, number> = {
    "": 1,
    k: 1_000,
    thousand: 1_000,
    l: 100_000,
    lac: 100_000,
    lakh: 100_000,
    lakhs: 100_000,
    cr: 10_000_000,
    crore: 10_000_000,
    crores: 10_000_000,
    m: 1_000_000,
    mn: 1_000_000,
    million: 1_000_000,
  };

  const multiplier = multipliers[unit];
  if (!multiplier) return null;

  return value * multiplier;
}
