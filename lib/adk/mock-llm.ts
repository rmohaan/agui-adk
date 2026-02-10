import { BaseLlm, LLMRegistry } from "@google/adk";
import type { Content } from "@google/genai";

export class MockLlm extends BaseLlm {
  static supportedModels = ["mock"];

  async *generateContentAsync(
    llmRequest: { contents: Content[] },
    _stream = false,
  ): AsyncGenerator<{ content?: Content; errorMessage?: string }> {
    const lastUser = [...(llmRequest.contents ?? [])]
      .reverse()
      .find((content) => content.role === "user");
    const userText =
      lastUser?.parts?.map((part) => part.text ?? "").join("").trim() || "";

    const text = userText
      ? `Mock LLM active. Received: ${userText}`
      : "Mock LLM active. No user input found.";

    yield {
      content: {
        role: "model",
        parts: [{ text }],
      },
    };
  }
}

let registered = false;

export function ensureMockRegistered() {
  if (registered) return;
  LLMRegistry.register(MockLlm);
  registered = true;
}
