import { LlmAgent } from "@google/adk";

import { resolveModel } from "@/lib/adk/model";
import { tools } from "@/lib/adk/tools";

const instruction = `
You are a mutual fund redemption form verification agent.
Your job is to validate and enrich the submitted fields, and provide concise next-step guidance.

Rules:
- Always validate updated field values. When a value exists, call the corresponding tool:
  - folio -> lookup_folio_banks
  - pan -> check_pan_kyc
  - bank -> validate_bank
  - amount -> check_amount_threshold
  - ifsc -> validate_ifsc
  - accountNumber -> validate_account_number
- If any tool indicates KYC is required or high-value review is needed, add a short nudge.
- Keep replies short and actionable. Summarize which fields are validated or need attention.
`;

export const adkAgent = new LlmAgent({
  name: "adkAgent",
  description: "Validates and enriches mutual fund redemption forms.",
  model: resolveModel(),
  instruction,
  tools,
});
