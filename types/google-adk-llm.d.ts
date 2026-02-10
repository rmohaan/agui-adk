import "@google/adk";

declare module "@google/adk" {
  import type { Blob, Content } from "@google/genai";

  export interface LlmRequest {
    contents: Content[];
    config?: Record<string, unknown>;
    liveConnectConfig?: Record<string, unknown>;
    toolsDict?: Record<string, unknown>;
    model?: string;
  }

  export interface LlmResponse {
    content?: Content;
    errorMessage?: string;
  }

  export interface BaseLlmConnection {
    sendHistory: (history: Content[]) => Promise<void>;
    sendContent: (content: Content) => Promise<void>;
    sendRealtime: (blob: Blob) => Promise<void>;
    receive: () => AsyncGenerator<LlmResponse, void, void>;
    close: () => Promise<void>;
  }
}
