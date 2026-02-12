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

export const FOLIO_TO_SCHEMES: Record<string, string[]> = {
  "AXIS-009184": ["Axis Bluechip Fund - Direct Growth"],
  "SBI-552901": ["SBI Small Cap Fund - Regular Growth"],
  "HDFC-443219": ["HDFC Balanced Advantage - Direct Growth"],
  "MIRA-778120": ["Mirae Asset Large Cap - Direct Growth"],
};

export const PAN_KYC_STATUS: Record<string, "KYC_OK" | "KYC_REQUIRED"> = {
  ABCDE1234F: "KYC_OK",
  PQRST6789K: "KYC_REQUIRED",
  LMNOP2468Z: "KYC_OK",
  UVWXY1357L: "KYC_OK",
};

export const SCHEMES = [
  "Axis Bluechip Fund - Direct Growth",
  "SBI Small Cap Fund - Regular Growth",
  "HDFC Balanced Advantage - Direct Growth",
  "Mirae Asset Large Cap - Direct Growth",
  "ICICI Prudential Balanced Advantage - Direct Growth",
  "Nippon India Small Cap Fund - Direct Growth",
];

export const BANK_IFSC: Record<string, string> = {
  "HDFC Bank": "HDFC0000421",
  "ICICI Bank": "ICIC0001892",
  "State Bank of India": "SBIN0001029",
  "Axis Bank": "UTIB0000007",
  "Kotak Mahindra Bank": "KKBK0000269",
  "Yes Bank": "YESB0000175",
};
