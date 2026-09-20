import assert from "node:assert/strict";
import test from "node:test";

import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

import { AgentActionFirewall } from "../src/firewall.js";
import { createFirewallMcpHandler } from "../src/mcp.js";

test("MCP guard_action blocks risky multi-step export", async () => {
  const firewall = new AgentActionFirewall();
  const handler = createFirewallMcpHandler(firewall);
  const url = new URL("http://test.local/mcp");

  const client = new Client(
    { name: "firewall-test", version: "1.0.0" },
    { versionNegotiation: { mode: "auto" } },
  );

  const transport = new StreamableHTTPClientTransport(url, {
    fetch: (input, init) => handler.fetch(new Request(input, init)),
  });

  await client.connect(transport);

  const first = await client.callTool({
    name: "guard_action",
    arguments: {
      sessionId: "mcp-test",
      action: "read_customer_records",
      sensitivity: "sensitive",
      destinationTrust: "trusted",
      provenance: "user",
      privileged: false,
    },
  });

  assert.deepEqual(first.structuredContent, {
    decision: "ALLOW",
    reason: "No configured policy rule requires review or blocking.",
  });

  const second = await client.callTool({
    name: "guard_action",
    arguments: {
      sessionId: "mcp-test",
      action: "upload_file",
      resource: "customer-export.csv",
      sensitivity: "internal",
      destinationTrust: "external",
      provenance: "user",
      privileged: false,
    },
  });

  assert.equal(
    (second.structuredContent as { decision: string }).decision,
    "BLOCK",
  );

  await client.close();
  await handler.close();
});
