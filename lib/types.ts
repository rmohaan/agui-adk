export type FormFieldKey =
  | "folio"
  | "pan"
  | "bank"
  | "amount"
  | "scheme"
  | "units"
  | "ifsc"
  | "accountNumber"
  | "email"
  | "mobile"
  | "address"
  | "nominee"
  | "redemptionMode";

export type FormRecord = {
  id: string;
  title: string;
  pdfUrl: string;
  submittedAt: string;
  fields: Record<FormFieldKey, string>;
};

export type FieldStatus = "pending" | "accepted" | "rejected";

export type AgentFieldState = {
  value: string;
  prefill?: string;
  status: FieldStatus;
};

export type ValidationResult = {
  valid: boolean;
  message: string;
};

export type NudgeSeverity = "good" | "bad" | "unknown";

export type FieldNudge = {
  message: string;
  severity: NudgeSeverity;
};

export type AgentState = {
  formId?: string;
  fields: Record<FormFieldKey, AgentFieldState>;
  validation?: Partial<Record<FormFieldKey, ValidationResult>>;
  bankOptions?: string[];
  schemeOptions?: string[];
  ifscSuggestions?: string[];
  nudges?: string[];
  fieldNudges?: Partial<Record<FormFieldKey, FieldNudge>>;
  feedback?: Array<{
    field: FormFieldKey;
    action: "accept" | "reject" | "edit";
    value: string;
    timestamp: string;
  }>;
};
