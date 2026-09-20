import assert from "node:assert/strict";
import test from "node:test";

import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

import { AgentActionFirewall } from "../src/firewall.js";
import { createFirewallMcpHandler } from "../src/mcp.js";

function transportFor(
  handler: ReturnType<typeof createFirewallMcpHandler>,
  headers?: Record<string, string>,
) {
  return new StreamableHTTPClientTransport(new URL("http://test.local/mcp"), {
    requestInit: headers ? { headers } : undefined,
    fetch: (input, init) => handler.fetch(new Request(input, init)),
  });
}

test("MCP guard_action blocks risky multi-step export", async () => {
  const firewall = new AgentActionFirewall();
  const handler = createFirewallMcpHandler(firewall);

  const client = new Client(
    { name: "firewall-test", version: "1.0.0" },
    { versionNegotiation: { mode: "auto" } },
  );

  await client.connect(transportFor(handler));

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

test("trusted transport session id prevents model-authored session switching", async () => {
  const handler = createFirewallMcpHandler();
  const client = new Client(
    { name: "trusted-session-test", version: "1.0.0" },
    { versionNegotiation: { mode: "auto" } },
  );

  await client.connect(
    transportFor(handler, { "x-agent-session-id": "host-bound-session" }),
  );

  await client.callTool({
    name: "guard_action",
    arguments: {
      sessionId: "model-chosen-a",
      action: "read_customer_records",
      sensitivity: "sensitive",
      destinationTrust: "trusted",
      provenance: "user",
      privileged: false,
    },
  });

  const result = await client.callTool({
    name: "guard_action",
    arguments: {
      sessionId: "model-chosen-b",
      action: "upload_file",
      sensitivity: "internal",
      destinationTrust: "external",
      provenance: "user",
      privileged: false,
    },
  });

  assert.equal(
    (result.structuredContent as { decision: string }).decision,
    "BLOCK",
  );

  await client.close();
  await handler.close();
});

test("MCP guarded execution does not run a blocked action", async () => {
  const handler = createFirewallMcpHandler();
  const client = new Client(
    { name: "enforcement-test", version: "1.0.0" },
    { versionNegotiation: { mode: "auto" } },
  );

  await client.connect(
    transportFor(handler, { "x-agent-session-id": "enforced-session" }),
  );

  await client.callTool({
    name: "execute_guarded_demo_action",
    arguments: {
      action: "read_customer_records",
      sensitivity: "sensitive",
      destinationTrust: "trusted",
      provenance: "user",
      privileged: false,
    },
  });

  const result = await client.callTool({
    name: "execute_guarded_demo_action",
    arguments: {
      action: "upload_file",
      sensitivity: "internal",
      destinationTrust: "external",
      provenance: "user",
      privileged: false,
    },
  });

  assert.deepEqual(result.structuredContent, {
    decision: "BLOCK",
    reason:
      "Sensitive data would cross an external trust boundary after being accessed in this session.",
    executed: false,
  });

  await client.close();
  await handler.close();
});

test("MCP endpoint accepts the 2025-11-25 legacy protocol era required by Alexa+", async () => {
  const handler = createFirewallMcpHandler();

  const client = new Client(
    { name: "alexa-compat-test", version: "1.0.0" },
    { versionNegotiation: { mode: "legacy" } },
  );

  await client.connect(transportFor(handler));

  assert.equal(client.getNegotiatedProtocolVersion(), "2025-11-25");

  const tools = await client.listTools();
  assert.ok(tools.tools.some((tool) => tool.name === "guard_action"));
  assert.ok(
    tools.tools.some((tool) => tool.name === "execute_guarded_demo_action"),
  );
  assert.ok(!tools.tools.some((tool) => tool.name === "clear_session"));

  await client.close();
  await handler.close();
});
