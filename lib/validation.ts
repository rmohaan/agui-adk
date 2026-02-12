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
