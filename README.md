# Agent Action Firewall

Runtime safety layer for AI agents that evaluates multi-step tool behavior before execution.

## Why

A single tool call can look harmless while the sequence of actions in a session becomes risky.

Example:

1. read sensitive records
2. prepare an export
3. upload the export to an external destination

Agent Action Firewall evaluates the current action together with session history before the tool runs.

## Decisions

- `ALLOW` - execute normally
- `REVIEW` - require human confirmation
- `BLOCK` - do not execute

## Runtime signals

The first version uses structured metadata:

- action type
- data sensitivity
- destination trust
- input provenance
- privilege level
- previous tool actions

The policy layer does not depend on private model reasoning.

## Run

```bash
npm install
npm test
npm run demo
npm run build
```

The demo shows a normal action, a sensitive read, and an external upload that becomes blocked because of the earlier sensitive access.

## Status

This is the core execution gate. The next step is to expose it through an MCP server and connect it to an Alexa+ workflow for the Amazon Build, Ship, Shape Developer Hackathon.
