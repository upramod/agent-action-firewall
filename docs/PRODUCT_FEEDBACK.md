# Product Feedback Draft

## Tools and technologies used

### Model Context Protocol

We used MCP as the runtime integration surface for the Alexa+ track. The project exposes a self-hosted Streamable HTTP MCP server and implements a sequence-aware execution gate as MCP tools.

### MCP TypeScript packages

We used the official Model Context Protocol TypeScript server and client packages for the server, protocol negotiation, integration tests, and Streamable HTTP transport.

### Azure Container Apps

We used Azure Container Apps to host the public HTTPS MCP endpoint for judging and remote testing.

### GitHub Actions

We used GitHub Actions to run tests, compile the TypeScript project, run the demo, and verify the Docker image builds.

## What worked well

The self-hosted MCP path was a good fit for this project because the firewall is naturally a runtime service that agents call immediately before a tool action.

Streamable HTTP made it straightforward to test the same MCP behavior locally and from a public deployment.

The MCP client/server packages made it possible to test the real protocol boundary rather than testing only internal functions.

## What needs work

The onboarding path for Alexa+ can be confusing because there are multiple integration concepts, including Agent Skills, MCP add-ons, and the hackathon's direct self-hosted MCP-server option.

It would help if the hackathon documentation highlighted earlier that an Alexa+ submission can qualify with a working self-hosted MCP server implementing the required protocol version, without requiring private Alexa+ partner tooling.

A small official self-hosted MCP starter repository with:

- Streamable HTTP
- protocol-version test
- public deployment example
- judge-testing instructions

would reduce setup time.

## Onboarding experience

Getting from zero to a working local MCP server was straightforward.

The biggest friction was determining the minimum Alexa+ integration needed for the hackathon. Once the self-hosted MCP-server path was clear, implementation and deployment were direct.

## Would I build with this again?

Yes.

MCP provides a clean boundary between agent reasoning and tool execution, which is useful for policy enforcement, observability, and reusable agent infrastructure.
