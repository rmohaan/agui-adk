export const BANKS = [
  "HDFC Bank",
  "ICICI Bank",
  "State Bank of India",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Yes Bank",
];

export const FOLIO_TO_BANKS: Record<string, string[]> = {
  "AXIS-009184": ["HDFC Bank", "Axis Bank"],
  "SBI-552901": ["State Bank of India", "ICICI Bank"],
  "HDFC-443219": ["HDFC Bank", "State Bank of India"],
  "MIRA-778120": ["Kotak Mahindra Bank"],
};

export const PAN_KYC_STATUS: Record<string, "KYC_OK" | "KYC_REQUIRED"> = {
  ABCDE1234F: "KYC_OK",
  PQRST6789K: "KYC_REQUIRED",
  LMNOP2468Z: "KYC_OK",
  UVWXY1357L: "KYC_OK",
};
