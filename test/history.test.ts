import assert from "node:assert/strict";
import test from "node:test";

import { AgentActionFirewall } from "../src/firewall.js";
import type { ActionContext } from "../src/types.js";

const base: ActionContext = {
  sessionId: "review-history",
  action: "read_web_page",
  sensitivity: "internal",
  destinationTrust: "trusted",
  provenance: "user",
  privileged: false,
};

test("review-only attempts do not become executed history", () => {
  const firewall = new AgentActionFirewall();

  const review = firewall.authorize({
    ...base,
    action: "update_account",
    privileged: true,
    provenance: "untrusted",
  });

  assert.equal(review.decision, "REVIEW");

  const next = firewall.assess({
    ...base,
    action: "delete_cache",
    privileged: true,
    provenance: "user",
  });

  assert.equal(next.decision, "ALLOW");
});
