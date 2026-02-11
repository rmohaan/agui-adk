import { ensureMockRegistered } from "@/lib/adk/mock-llm";

const hasGeminiKey = Boolean(
  process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY,
);

const useVertex = ["true", "1"].includes(
  (process.env.GOOGLE_GENAI_USE_VERTEXAI || "").toLowerCase(),
);
const hasVertexConfig = Boolean(
  process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_CLOUD_LOCATION,
);

export function resolveModel(): string {
  const configuredModel = process.env.ADK_MODEL?.trim();
  if (configuredModel) {
    if (configuredModel.toLowerCase().startsWith("ollama:")) {
      throw new Error("Ollama is disabled. Use a Gemini model instead.");
    }
    if (!hasGeminiKey && process.env.NODE_ENV !== "production") {
      ensureMockRegistered();
      return "mock";
    }
    return configuredModel;
  }

  if (hasGeminiKey) {
    return "gemini-2.5-flash";
  }

  if (useVertex && hasVertexConfig) {
    return "gemini-2.5-flash";
  }

  if (process.env.NODE_ENV !== "production") {
    ensureMockRegistered();
    return "mock";
  }

  throw new Error(
    "Missing Gemini API key. Set GOOGLE_GENAI_API_KEY or GEMINI_API_KEY.",
  );
}
