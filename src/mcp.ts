import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import { AgentActionFirewall } from "./firewall.js";
import type { ActionContext } from "./types.js";

const sensitivitySchema = z.enum(["public", "internal", "sensitive"]);
const destinationTrustSchema = z.enum(["trusted", "unknown", "external"]);
const provenanceSchema = z.enum(["trusted", "user", "untrusted"]);

const actionSchema = z.object({
  sessionId: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Fallback execution identifier for local demos. Production hosts should supply x-agent-session-id as trusted transport metadata.",
    ),
  action: z.string().min(1),
  resource: z.string().optional(),
  sensitivity: sensitivitySchema,
  destinationTrust: destinationTrustSchema,
  provenance: provenanceSchema,
  privileged: z.boolean(),
  approved: z.boolean().optional().default(false),
});

const decisionSchema = z.object({
  decision: z.enum(["ALLOW", "REVIEW", "BLOCK"]),
  reason: z.string(),
});

const executionSchema = decisionSchema.extend({
  executed: z.boolean(),
});

function toAction(
  input: Omit<z.infer<typeof actionSchema>, "approved">,
  trustedSessionId?: string,
): ActionContext {
  const sessionId = trustedSessionId ?? input.sessionId;
  if (!sessionId) {
    throw new Error(
      "Missing session identity. Supply x-agent-session-id from the host or sessionId for a local demo.",
    );
  }

  return {
    sessionId,
    action: input.action,
    resource: input.resource,
    sensitivity: input.sensitivity,
    destinationTrust: input.destinationTrust,
    provenance: input.provenance,
    privileged: input.privileged,
  };
}

export function buildMcpServer(
  firewall: AgentActionFirewall = new AgentActionFirewall(),
  trustedSessionId?: string,
): McpServer {
  const server = new McpServer(
    { name: "agent-action-firewall", version: "0.1.0" },
    {
      instructions:
        "Use guard_action immediately before a sensitive tool action and proceed only on ALLOW. A production host should bind session identity outside model-authored arguments.",
    },
  );

  server.registerTool(
    "guard_action",
    {
      title: "Guard Agent Action",
      description:
        "Evaluate a proposed agent tool action against prior executed actions and return ALLOW, REVIEW, or BLOCK.",
      inputSchema: actionSchema,
      outputSchema: decisionSchema,
    },
    async ({ approved, ...input }) => {
      const action = toAction(input, trustedSessionId);
      const result = firewall.authorize(action, approved);

      return {
        content: [
          {
            type: "text",
            text: `${result.decision}: ${result.reason}`,
          },
        ],
        structuredContent: result,
      };
    },
  );

  server.registerTool(
    "execute_guarded_demo_action",
    {
      title: "Execute Guarded Demo Action",
      description:
        "Demonstrate enforcement by running a simulated protected action only when the firewall returns ALLOW.",
      inputSchema: actionSchema,
      outputSchema: executionSchema,
    },
    async ({ approved, ...input }) => {
      const action = toAction(input, trustedSessionId);
      let executed = false;

      const result = await firewall.execute(
        action,
        async () => {
          executed = true;
          return true;
        },
        approved,
      );

      return {
        content: [
          {
            type: "text",
            text: `${result.decision}: executed=${executed}. ${result.reason}`,
          },
        ],
        structuredContent: {
          decision: result.decision,
          reason: result.reason,
          executed,
        },
      };
    },
  );

  return server;
}

export function createFirewallMcpHandler(
  firewall: AgentActionFirewall = new AgentActionFirewall(),
) {
  return createMcpHandler(({ requestInfo }) => {
    const trustedSessionId =
      requestInfo?.headers.get("x-agent-session-id")?.trim() || undefined;
    return buildMcpServer(firewall, trustedSessionId);
  });
}
