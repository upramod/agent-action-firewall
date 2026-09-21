# Devpost Submission Draft

## Project name

Agent Action Firewall

## Elevator pitch

Stop risky AI-agent actions before they execute by evaluating the current tool call together with the actions that already happened in the session.

## What it does

Agent Action Firewall is a sequence-aware runtime safety gate for AI agents.

Many agent systems evaluate tool calls one at a time. That can miss a dangerous sequence where each individual action looks reasonable in isolation.

Example:

1. Read a calendar - allowed.
2. Read sensitive customer records - allowed.
3. Upload a file to an external destination - blocked.

The third action is blocked because the session previously accessed sensitive information. The protected callback is never invoked.

The firewall returns one of three decisions:

- ALLOW
- REVIEW
- BLOCK

## How we built it

The project is a self-hosted Model Context Protocol server implemented in TypeScript and Node.js.

It exposes a Streamable HTTP MCP endpoint and uses structured runtime metadata such as:

- action type
- data sensitivity
- destination trust
- input provenance
- privilege level
- prior executed actions

The policy engine keeps per-session history and evaluates each proposed action immediately before execution.

The reference enforcement path only invokes the protected callback after an ALLOW decision.

The MCP server supports protocol version 2025-11-25 and later negotiation modes used by the current SDK.

## Why this matters

A tool call can be safe in isolation but unsafe because of what happened earlier.

Agent Action Firewall moves the safety decision to the execution boundary, where the system has both the current action and the history needed to judge the sequence.

The policy is based on observable runtime metadata instead of hidden model reasoning, which makes decisions easier to test and explain.

## Challenges we ran into

The hardest part was defining what counts as executed history.

An action that was blocked, required review, or failed during execution should not be treated the same as a successful side effect. We changed the runtime so ALLOW actions are recorded as executed only after the protected callback succeeds.

We also hardened the MCP boundary so a model cannot escape prior history simply by supplying a new session ID. A host can bind session identity through trusted transport metadata.

Public deployment required replacing localhost-only host validation with an explicit host allowlist.

## Accomplishments

- Working self-hosted MCP server over Streamable HTTP
- Sequence-aware ALLOW / REVIEW / BLOCK decisions
- Enforcement path where blocked callbacks never execute
- Trusted transport-bound session identity
- Regression coverage for failed executions and attempted session switching
- Docker packaging
- Public HTTPS deployment
- CI that runs tests, TypeScript compilation, demo, and container build

## What we learned

The main lesson is that agent authorization should be stateful at the execution boundary.

A policy engine also needs to distinguish proposed actions from completed side effects. Otherwise failed or denied actions can corrupt later decisions.

We also found that session identity itself is part of the security boundary. If the model controls the history key, it can potentially evade sequence-aware policy.

## What's next

Possible next steps include:

- persistent distributed session state
- signed or authenticated host metadata
- richer policy configuration
- human approval callbacks for REVIEW decisions
- adapters for real side-effecting agent tools
- policy explanations and audit export

## Built with

TypeScript, Node.js, Model Context Protocol, Streamable HTTP, Docker, Azure Container Apps, GitHub Actions

## Primary track

Alexa+

This submission uses the self-hosted MCP-server path allowed by the Alexa+ track.

## Repository

https://github.com/upramod/agent-action-firewall
