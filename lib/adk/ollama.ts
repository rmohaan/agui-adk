import { BaseLlm, LLMRegistry } from "@google/adk";
import type { Content } from "@google/genai";

type OllamaChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type OllamaChatResponse = {
  message?: {
    role: string;
    content: string;
  };
};

export class OllamaLlm extends BaseLlm {
  static supportedModels = [/^ollama:.+/i];

  private baseUrl: string;

  constructor({ model }: { model: string }) {
    super({ model });
    this.baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  }

  async *generateContentAsync(
    llmRequest: { contents: Content[] },
    _stream = false,
  ): AsyncGenerator<{ content?: Content; errorMessage?: string }> {
    const messages: OllamaChatMessage[] = llmRequest.contents.map((content) => ({
      role:
        content.role === "model"
          ? "assistant"
          : (content.role as "user" | "assistant" | "system"),
      content:
        content.parts?.map((part) => part.text ?? "").join("").trim() || "",
    }));

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model.replace(/^ollama:/i, ""),
          messages,
          stream: false,
        }),
      });
    } catch (error) {
      yield {
        errorMessage: `Ollama fetch failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
      return;
    }

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch {
        errorText = "";
      }
      yield {
        errorMessage: `Ollama request failed (${response.status}) ${
          errorText ? `- ${errorText}` : ""
        }`,
      };
      return;
    }

    let data: OllamaChatResponse | null = null;
    try {
      data = (await response.json()) as OllamaChatResponse;
    } catch (error) {
      yield {
        errorMessage: `Ollama response parse failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
      return;
    }

    const text = data?.message?.content ?? "";

    yield {
      content: {
        role: "model",
        parts: [{ text }],
      },
    };
  }
}

let registered = false;

export function ensureOllamaRegistered() {
  if (registered) return;
  LLMRegistry.register(OllamaLlm);
  registered = true;
}
