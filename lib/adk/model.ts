import { ensureMockRegistered } from "@/lib/adk/mock-llm";
import { ensureOllamaRegistered } from "@/lib/adk/ollama";

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
      ensureOllamaRegistered();
    }
    return configuredModel;
  }

  // Priority order: ADC (Vertex AI) -> API key -> Ollama
  if (useVertex && hasVertexConfig) {
    return "gemini-2.5-flash";
  }

  if (hasGeminiKey) {
    return "gemini-2.5-flash";
  }

  const ollamaDisabled = ["true", "1"].includes(
    (process.env.DISABLE_OLLAMA_FALLBACK || "").toLowerCase(),
  );

  if (!ollamaDisabled) {
    ensureOllamaRegistered();
    return `ollama:${process.env.OLLAMA_MODEL || "llama3.1"}`;
  }

  ensureMockRegistered();
  return "mock";
}
