import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import { AgentActionFirewall } from "./firewall.js";
import type { ActionContext } from "./types.js";

const sensitivitySchema = z.enum(["public", "internal", "sensitive"]);
const destinationTrustSchema = z.enum(["trusted", "unknown", "external"]);
const provenanceSchema = z.enum(["trusted", "user", "untrusted"]);

const actionSchema = z.object({
  sessionId: z.string().min(1),
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

export function buildMcpServer(
  firewall: AgentActionFirewall = new AgentActionFirewall(),
): McpServer {
  const server = new McpServer(
    { name: "agent-action-firewall", version: "0.1.0" },
    {
      instructions:
        "Call guard_action immediately before a sensitive tool action. Proceed only when the decision is ALLOW.",
    },
  );

  server.registerTool(
    "guard_action",
    {
      title: "Guard Agent Action",
      description:
        "Evaluate a proposed agent tool action against session history and return ALLOW, REVIEW, or BLOCK.",
      inputSchema: actionSchema,
      outputSchema: decisionSchema,
    },
    async ({ approved, ...input }) => {
      const action: ActionContext = input;
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
    "clear_session",
    {
      title: "Clear Firewall Session",
      description:
        "Clear retained action history for a session. Intended for demos and tests.",
      inputSchema: z.object({ sessionId: z.string().min(1) }),
      outputSchema: z.object({ cleared: z.boolean() }),
    },
    async ({ sessionId }) => {
      firewall.clear(sessionId);
      return {
        content: [{ type: "text", text: `Cleared session ${sessionId}` }],
        structuredContent: { cleared: true },
      };
    },
  );

  return server;
}

export function createFirewallMcpHandler(
  firewall: AgentActionFirewall = new AgentActionFirewall(),
) {
  return createMcpHandler(() => buildMcpServer(firewall));
}
