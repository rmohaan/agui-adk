import { FunctionTool } from "@google/adk";
import { z } from "zod";

import {
  FOLIO_TO_BANKS,
  PAN_KYC_STATUS,
  BANKS,
  SCHEMES,
  BANK_IFSC,
} from "@/lib/adk/mock-data";
import {
  isHighValueAmount,
  isValidAccountNumber,
  isValidFolio,
  isValidIFSC,
  isValidPAN,
} from "@/lib/validation";
import type { FieldNudge, NudgeSeverity } from "@/lib/types";

const mergeValidation = (
  toolContext:
    | {
        state: {
          get: (key: string, value: unknown) => unknown;
          set: (key: string, value: unknown) => void;
        };
      }
    | undefined,
  key: string,
  result: { valid: boolean; message: string },
) => {
  if (!toolContext) return;
  const existing = (toolContext.state.get("validation", {}) as Record<
    string,
    { valid: boolean; message: string }
  >) || {};
  toolContext.state.set("validation", {
    ...existing,
    [key]: result,
  });
};

const setFieldNudge = (
  toolContext:
    | {
        state: {
          get: (key: string, value: unknown) => unknown;
          set: (key: string, value: unknown) => void;
        };
      }
    | undefined,
  key: string,
  nudge: FieldNudge,
) => {
  if (!toolContext) return;
  const existing = (toolContext.state.get("fieldNudges", {}) as Record<
    string,
    FieldNudge
  >) || {};
  toolContext.state.set("fieldNudges", {
    ...existing,
    [key]: nudge,
  });
};

const resolveSeverity = (valid: boolean, hasValue: boolean): NudgeSeverity => {
  if (!hasValue) return "unknown";
  return valid ? "good" : "bad";
};

const setSchemeOptions = (
  toolContext:
    | {
        state: {
          get: (key: string, value: unknown) => unknown;
          set: (key: string, value: unknown) => void;
        };
      }
    | undefined,
  schemes: string[],
) => {
  if (!toolContext) return;
  toolContext.state.set("schemeOptions", schemes);
};

const setIfscSuggestions = (
  toolContext:
    | {
        state: {
          get: (key: string, value: unknown) => unknown;
          set: (key: string, value: unknown) => void;
        };
      }
    | undefined,
  suggestions: string[],
) => {
  if (!toolContext) return;
  toolContext.state.set("ifscSuggestions", suggestions);
};

export const lookupFolioBanksTool = new FunctionTool({
  name: "lookup_folio_banks",
  description: "Fetch bank names associated with a mutual fund folio number.",
  parameters: z.object({
    folio: z.string().describe("Mutual fund folio number"),
  }),
  execute: async ({ folio }, toolContext) => {
    const cleaned = folio.trim();
    const banks = FOLIO_TO_BANKS[cleaned] ?? BANKS.slice(0, 3);
    toolContext?.state.set("bankOptions", banks);
    const valid = cleaned.length > 0 ? isValidFolio(cleaned) : false;
    const hasValue = cleaned.length > 0;
    mergeValidation(toolContext, "folio", {
      valid,
      message: valid ? "Folio format looks valid." : "Folio format looks invalid.",
    });
    setFieldNudge(toolContext, "folio", {
      severity: resolveSeverity(valid, hasValue),
      message: hasValue
        ? valid
          ? "Folio verified."
          : "Folio format invalid."
        : "Awaiting folio input.",
    });
    return { folio, banks };
  },
});

export const validateBankTool = new FunctionTool({
  name: "validate_bank",
  description: "Validate the bank name against approved banks.",
  parameters: z.object({
    bank: z.string().describe("Bank name entered by the user"),
  }),
  execute: async ({ bank }, toolContext) => {
    const cleaned = bank.trim();
    const hasValue = cleaned.length > 0;
    const valid = hasValue
      ? BANKS.some((entry) =>
          entry.toLowerCase().includes(cleaned.toLowerCase()),
        )
      : false;
    mergeValidation(toolContext, "bank", {
      valid,
      message: valid ? "Bank name validated." : "Bank name not recognized.",
    });
    setFieldNudge(toolContext, "bank", {
      severity: resolveSeverity(valid, hasValue),
      message: hasValue
        ? valid
          ? "Bank verified."
          : "Bank not recognized."
        : "Awaiting bank name.",
    });
    return { bank, valid };
  },
});

export const validateAmountTool = new FunctionTool({
  name: "check_amount_threshold",
  description: "Check if redemption amount requires additional review.",
  parameters: z.object({
    amount: z
      .preprocess((value) => Number(value), z.number())
      .describe("Redemption amount"),
  }),
  execute: async ({ amount }, toolContext) => {
    if (!Number.isFinite(amount)) {
      mergeValidation(toolContext, "amount", {
        valid: false,
        message: "Amount is not a valid number.",
      });
      setFieldNudge(toolContext, "amount", {
        severity: "unknown",
        message: "Enter a valid amount.",
      });
      return { amount, requiresReview: false };
    }
    const requiresReview = isHighValueAmount(amount);
    mergeValidation(toolContext, "amount", {
      valid: !requiresReview,
      message: requiresReview
        ? "Amount exceeds 100000. Manual review required."
        : "Amount within standard threshold.",
    });
    setFieldNudge(toolContext, "amount", {
      severity: requiresReview ? "bad" : "good",
      message: requiresReview
        ? "High value. Manual review required."
        : "Amount approved.",
    });
    if (requiresReview) {
      const nudges = (toolContext?.state.get("nudges", []) as string[]) || [];
      toolContext?.state.set("nudges", [
        ...nudges,
        "High-value redemption detected. Confirm authorization before submission.",
      ]);
    }
    return { amount, requiresReview };
  },
});

export const validateIfscTool = new FunctionTool({
  name: "validate_ifsc",
  description: "Validate IFSC format and check bank routing.",
  parameters: z.object({
    ifsc: z.string().describe("IFSC code"),
  }),
  execute: async ({ ifsc }, toolContext) => {
    const cleaned = ifsc.trim();
    const hasValue = cleaned.length > 0;
    const valid = hasValue ? isValidIFSC(cleaned) : false;
    mergeValidation(toolContext, "ifsc", {
      valid,
      message: valid ? "IFSC looks valid." : "IFSC appears invalid.",
    });
    const suggestions = (toolContext?.state.get("ifscSuggestions", []) as string[]) || [];
    setFieldNudge(toolContext, "ifsc", {
      severity: hasValue
        ? resolveSeverity(valid, hasValue)
        : suggestions.length > 0
          ? "unknown"
          : "unknown",
      message: hasValue
        ? valid
          ? "IFSC verified."
          : "IFSC invalid."
        : suggestions.length > 0
          ? `Suggested IFSC: ${suggestions[0]}`
          : "Awaiting IFSC.",
    });
    return { ifsc, valid };
  },
});

export const validateAccountTool = new FunctionTool({
  name: "validate_account_number",
  description: "Validate bank account number length and format.",
  parameters: z.object({
    accountNumber: z.string().describe("Account number"),
  }),
  execute: async ({ accountNumber }, toolContext) => {
    const cleaned = accountNumber.trim();
    const hasValue = cleaned.length > 0;
    const valid = hasValue ? isValidAccountNumber(cleaned) : false;
    mergeValidation(toolContext, "accountNumber", {
      valid,
      message: valid
        ? "Account number length looks valid."
        : "Account number length looks invalid.",
    });
    setFieldNudge(toolContext, "accountNumber", {
      severity: resolveSeverity(valid, hasValue),
      message: hasValue
        ? valid
          ? "Account verified."
          : "Account number invalid."
        : "Awaiting account number.",
    });
    return { accountNumber, valid };
  },
});

export const checkPanKycTool = new FunctionTool({
  name: "check_pan_kyc",
  description: "Check PAN details and KYC status.",
  parameters: z.object({
    pan: z.string().describe("PAN number"),
  }),
  execute: async ({ pan }, toolContext) => {
    const normalized = pan.trim().toUpperCase();
    const hasValue = normalized.length > 0;
    const valid = hasValue ? isValidPAN(normalized) : false;
    const kycStatus =
      hasValue && valid ? PAN_KYC_STATUS[normalized] ?? "KYC_REQUIRED" : "UNKNOWN";
    mergeValidation(toolContext, "pan", {
      valid,
      message: valid ? `PAN valid. ${kycStatus}` : "PAN format invalid.",
    });
    if (kycStatus === "KYC_REQUIRED") {
      const nudges = (toolContext?.state.get("nudges", []) as string[]) || [];
      toolContext?.state.set("nudges", [
        ...nudges,
        "PAN is not KYC verified. Ask customer if they want to complete KYC now.",
      ]);
    }
    setFieldNudge(toolContext, "pan", {
      severity: hasValue ? (kycStatus === "KYC_REQUIRED" || !valid ? "bad" : "good") : "unknown",
      message: !hasValue
        ? "Awaiting PAN."
        : !valid
          ? "PAN invalid."
          : kycStatus === "KYC_REQUIRED"
            ? "KYC required."
            : "PAN KYC verified.",
    });
    return { pan: normalized, kycStatus, valid };
  },
});

export const getSchemeNamesTool = new FunctionTool({
  name: "get_scheme_names",
  description: "Fetch available scheme names for redemption from the database.",
  parameters: z.object({
    scheme: z.string().optional().describe("Scheme name entered by the user"),
  }),
  execute: async ({ scheme }, toolContext) => {
    const list = SCHEMES;
    setSchemeOptions(toolContext, list);
    const cleaned = (scheme ?? "").trim();
    const hasValue = cleaned.length > 0;
    const valid = hasValue ? list.includes(cleaned) : false;
    if (hasValue) {
      mergeValidation(toolContext, "scheme", {
        valid,
        message: valid ? "Scheme verified." : "Scheme not found.",
      });
      setFieldNudge(toolContext, "scheme", {
        severity: resolveSeverity(valid, hasValue),
        message: valid ? "Scheme verified." : "Scheme not found.",
      });
    } else {
      setFieldNudge(toolContext, "scheme", {
        severity: "unknown",
        message: "Select a scheme.",
      });
    }
    return { schemes: list };
  },
});

export const fetchIfscByBankTool = new FunctionTool({
  name: "fetch_ifsc_by_bank",
  description:
    "Fetch IFSC code from an external service using the provided bank name.",
  parameters: z.object({
    bank: z.string().describe("Bank name"),
  }),
  execute: async ({ bank }, toolContext) => {
    const cleaned = bank.trim();
    const ifsc = BANK_IFSC[cleaned];
    const suggestions = ifsc ? [ifsc] : [];
    setIfscSuggestions(toolContext, suggestions);
    setFieldNudge(toolContext, "ifsc", {
      severity: suggestions.length > 0 ? "unknown" : "bad",
      message:
        suggestions.length > 0
          ? `Suggested IFSC: ${suggestions[0]}`
          : "Unable to fetch IFSC for bank.",
    });
    return { bank: cleaned, ifscSuggestions: suggestions };
  },
});

export const tools = [
  getSchemeNamesTool,
  lookupFolioBanksTool,
  validateBankTool,
  fetchIfscByBankTool,
  validateAmountTool,
  validateIfscTool,
  validateAccountTool,
  checkPanKycTool,
];
