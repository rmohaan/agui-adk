import { ensureMockRegistered } from "@/lib/adk/mock-llm";

const hasGeminiKey = Boolean(
  process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "AIzaSyDrfpzaiLJmLXVO3r2cKh60nuAUq4djzik",
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

  if (process.env.NODE_ENV !== "production") {
    ensureMockRegistered();
    return "mock";
  }

  throw new Error(
    "Missing Gemini API key. Set GOOGLE_GENAI_API_KEY or GEMINI_API_KEY.",
  );
}
