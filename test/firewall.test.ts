import assert from "node:assert/strict";
import test from "node:test";

import { AgentActionFirewall } from "../src/firewall.js";
import type { ActionContext } from "../src/types.js";

function action(
  overrides: Partial<ActionContext> = {},
): ActionContext {
  return {
    sessionId: "s1",
    action: "read_calendar",
    sensitivity: "internal",
    destinationTrust: "trusted",
    provenance: "user",
    privileged: false,
    ...overrides,
  };
}

test("allows a normal trusted action", async () => {
  const firewall = new AgentActionFirewall();
  let called = false;

  const result = await firewall.execute(action(), async () => {
    called = true;
    return "ok";
  });

  assert.equal(result.decision, "ALLOW");
  assert.equal(called, true);
});

test("requires review for privileged action influenced by untrusted input", async () => {
  const firewall = new AgentActionFirewall();

  await firewall.execute(
    action({
      action: "read_web_page",
      provenance: "untrusted",
    }),
    async () => "ok",
  );

  let called = false;
  const result = await firewall.execute(
    action({
      action: "update_account",
      privileged: true,
    }),
    async () => {
      called = true;
      return "should not run";
    },
  );

  assert.equal(result.decision, "REVIEW");
  assert.equal(called, false);
});

test("blocks external export after sensitive read and never executes tool", async () => {
  const firewall = new AgentActionFirewall();

  await firewall.execute(
    action({
      action: "read_customer_records",
      sensitivity: "sensitive",
    }),
    async () => "records",
  );

  let called = false;
  const result = await firewall.execute(
    action({
      action: "upload_file",
      resource: "customer-export.csv",
      destinationTrust: "external",
    }),
    async () => {
      called = true;
      return "uploaded";
    },
  );

  assert.equal(result.decision, "BLOCK");
  assert.equal(called, false);
});

test("failed protected callbacks do not become executed history", async () => {
  const firewall = new AgentActionFirewall();

  await assert.rejects(
    firewall.execute(
      action({
        action: "read_customer_records",
        sensitivity: "sensitive",
      }),
      async () => {
        throw new Error("upstream read failed");
      },
    ),
    /upstream read failed/,
  );

  const result = await firewall.execute(
    action({
      action: "upload_file",
      destinationTrust: "external",
    }),
    async () => "uploaded",
  );

  assert.equal(result.decision, "ALLOW");
});
