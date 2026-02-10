import type { FormFieldKey } from "./types";

export type FieldDefinition = {
  key: FormFieldKey;
  label: string;
  type: "text" | "number" | "email" | "tel" | "select";
  placeholder?: string;
};

export const FORM_FIELDS: FieldDefinition[] = [
  { key: "folio", label: "Folio Number", type: "text" },
  { key: "pan", label: "PAN", type: "text" },
  { key: "bank", label: "Bank Name", type: "text" },
  { key: "amount", label: "Redemption Amount", type: "number" },
  { key: "scheme", label: "Scheme", type: "select" },
  { key: "units", label: "Units", type: "number" },
  { key: "ifsc", label: "IFSC Code", type: "text" },
  { key: "accountNumber", label: "Account Number", type: "text" },
  { key: "email", label: "Email", type: "email" },
  { key: "mobile", label: "Mobile", type: "tel" },
  { key: "address", label: "Address", type: "text" },
  { key: "nominee", label: "Nominee", type: "text" },
  { key: "redemptionMode", label: "Redemption Mode", type: "text" },
];
