# Architecture

## Request path

```text
Agent / MCP client
       |
       | proposed action + structured metadata
       v
Streamable HTTP MCP endpoint
       |
       v
Agent Action Firewall
       |
       +--> trusted session identity
       |
       +--> prior executed actions
       |
       v
Sequence-aware policy
       |
       +--> ALLOW  -> execute protected callback
       |
       +--> REVIEW -> require approval
       |
       +--> BLOCK  -> callback is not invoked
```

## Core invariant

An action that is safe in isolation can become unsafe because of the actions that preceded it.

## Execution accounting

The firewall distinguishes a policy decision from a completed side effect.

- BLOCK is recorded as an attempted action.
- REVIEW without approval is recorded as an attempted action.
- ALLOW is recorded as executed only after the protected callback succeeds.
- A callback that throws is not added to executed history.

This prevents failed operations from influencing later policy as though they actually happened.

## Session boundary

Sequence-aware policy depends on reliable session identity.

For local demos, callers can pass `sessionId`.

For host-integrated use, `x-agent-session-id` can be supplied as trusted transport metadata. When present, it overrides a model-authored session ID.

## Current policy examples

- sensitive read followed by external export -> BLOCK
- privileged action influenced by untrusted input -> REVIEW
- sensitive operation with unknown destination trust -> REVIEW
- ordinary trusted action -> ALLOW

## Deployment

The reference deployment is containerized and exposes the MCP server over HTTPS through Azure Container Apps.
