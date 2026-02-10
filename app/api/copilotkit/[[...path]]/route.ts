import { CopilotRuntime, EmptyAdapter } from "@copilotkit/runtime";
import {
  createCopilotEndpoint,
  createCopilotEndpointSingleRoute,
} from "@copilotkitnext/runtime";
import { handle } from "hono/vercel";
import { HttpAgent } from "@ag-ui/client";

const aguiUrl =
  process.env.AGUI_ENDPOINT || "http://localhost:3000/api/agui";

export const runtime = "nodejs";

let handlerPromise:
  | Promise<{
      single: ReturnType<typeof handle>;
      multi: ReturnType<typeof handle>;
    }>
  | null = null;

const getHandlers = () => {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      const adkAgent = new HttpAgent({
        url: aguiUrl,
        agentId: "adkAgent",
      });

      const copilotRuntime = new CopilotRuntime({
        agents: {
          // CopilotKit expects its own AbstractAgent type; runtime behavior is compatible.
          adkAgent: adkAgent as unknown as any,
        },
      });

      copilotRuntime.handleServiceAdapter(new EmptyAdapter());

      const instance = copilotRuntime.instance;
      const resolvedAgents = await copilotRuntime.runtimeArgs.agents;
      instance.agents = resolvedAgents;

      const multi = createCopilotEndpoint({
        runtime: instance,
        basePath: "/api/copilotkit",
      });

      const single = createCopilotEndpointSingleRoute({
        runtime: instance,
        basePath: "/api/copilotkit",
      });

      return {
        multi: handle(multi),
        single: handle(single),
      };
    })();
  }

  return handlerPromise;
};

export async function POST(request: Request) {
  const { multi, single } = await getHandlers();
  const url = new URL(request.url);
  if (url.pathname === "/api/copilotkit") {
    return single(request);
  }
  return multi(request);
}

export async function GET(request: Request) {
  const { multi } = await getHandlers();
  return multi(request);
}
