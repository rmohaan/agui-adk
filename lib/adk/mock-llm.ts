import { BaseLlm, LLMRegistry } from "@google/adk";
import type { BaseLlmConnection, LlmRequest, LlmResponse } from "@google/adk";

export class MockLlm extends BaseLlm {
  static supportedModels = ["mock"];

  async *generateContentAsync(
    llmRequest: LlmRequest,
    _stream = false,
  ): AsyncGenerator<LlmResponse, void> {
    void _stream;
    const lastUser = [...(llmRequest.contents ?? [])]
      .reverse()
      .find((content) => content.role === "user");
    const userText =
      lastUser?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("")
        .trim() || "";

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

  async connect(_llmRequest: LlmRequest): Promise<BaseLlmConnection> {
    void _llmRequest;
    return {
      async sendHistory(_history: Parameters<BaseLlmConnection["sendHistory"]>[0]) {
        void _history;
      },
      async sendContent(_content: Parameters<BaseLlmConnection["sendContent"]>[0]) {
        void _content;
      },
      async sendRealtime(
        _blob: Parameters<BaseLlmConnection["sendRealtime"]>[0],
      ) {
        void _blob;
      },
      async *receive(): AsyncGenerator<LlmResponse, void, void> {},
      async close() {},
    };
  }
}

let registered = false;

export function ensureMockRegistered() {
  if (registered) return;
  LLMRegistry.register(MockLlm);
  registered = true;
}
