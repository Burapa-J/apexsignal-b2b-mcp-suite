# @apexsignal B2B Intelligence MCP & n8n Suite (5 Live Tools)

[![Burapa-J/apexsignal-b2b-mcp-suite MCP server](https://glama.ai/mcp/servers/Burapa-J/apexsignal-b2b-mcp-suite/badges/score.svg)](https://glama.ai/mcp/servers/Burapa-J/apexsignal-b2b-mcp-suite)

Sub-2-second **Model Context Protocol (MCP)** tools, **`SKILL.md` Agent Playbook**, and **n8n automation workflows** powered by the [`@apexsignal`](https://apify.com/apexsignal) B2B Intelligence Suite on Apify Store.

Built for AI Agents (**Claude Code**, **Claude Desktop**, **Cursor**, **Windsurf**, **Copilot**, **Gemini CLI**, **LangGraph**) and B2B revenue teams who need deterministic HTTP/DNS/JSON company, email, and hiring-intent signals without LinkedIn/Apollo cookie bans.

---

## Live MCP Tools & Apify Store Endpoints (5 Actors)

| Tool / Actor | Description | Pricing (Pay-Per-Event) | Apify Store URL |
|---|---|---|---|
| **[B2B Hiring Intent & Executive Lead Pipeline (All-in-One MCP)](https://apify.com/apexsignal/b2b-hiring-intent-lead-pipeline)** | **One-Call Composite Pipeline:** Combines live Greenhouse/Lever/Ashby job signals, DNS/MX/SPF/DMARC & tech stack enrichment, and MX-verified executive email discovery with a `0–100` `outboundReadinessScore`. | `$0.0045` / company (`$0.00225` Diamond) | https://apify.com/apexsignal/b2b-hiring-intent-lead-pipeline |
| **[B2B Domain Contact, MX & Tech Stack Enricher](https://apify.com/apexsignal/b2b-domain-contact-enricher)** | Extracts verified emails, social links (`LinkedIn`, `X`, `GitHub`), DNS/MX email provider (`Google Workspace`, `Microsoft 365`), and tech stack from company domains in `<2s`. | `$0.0020` / domain (`$0.0010` Diamond) | https://apify.com/apexsignal/b2b-domain-contact-enricher |
| **[Bulk Email Verifier — DNS MX & Disposable Check](https://apify.com/apexsignal/bulk-email-mx-verifier)** | High-speed bulk email verification via RFC syntax, deduplicated DNS MX lookup, disposable domain detection, and role-account scoring (`0–100`). | `$0.0006` / email (`$0.0003` Diamond) | https://apify.com/apexsignal/bulk-email-mx-verifier |
| **[ATS Career Job Listing API — Greenhouse, Lever & Ashby](https://apify.com/apexsignal/ats-career-job-listing-api)** | Unified JSON feed of active job openings directly from Greenhouse, Lever, and Ashby career portals for B2B hiring-intent signals. | `$0.0012` / job (`$0.0006` Diamond) | https://apify.com/apexsignal/ats-career-job-listing-api |
| **[B2B Company & Decision Maker Lead Finder](https://apify.com/apexsignal/b2b-company-lead-finder)** | Infers corporate email naming patterns (`{first}.{last}@domain`) and generates MX-verified executive email leads directly from company domains. | `$0.0025` / lead (`$0.00125` Diamond) | https://apify.com/apexsignal/b2b-company-lead-finder |

---

## Quickstart: Connect to Claude Code / Claude Desktop / Cursor / Windsurf (MCP)

### Option A: Hosted Streamable HTTP via `mcp.apify.com` (OAuth / Zero-Install)

Add to your `claude_desktop_config.json` or `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "apexsignal-b2b-suite": {
      "url": "https://mcp.apify.com/?actors=apexsignal/b2b-hiring-intent-lead-pipeline,apexsignal/b2b-domain-contact-enricher,apexsignal/bulk-email-mx-verifier,apexsignal/ats-career-job-listing-api,apexsignal/b2b-company-lead-finder"
    }
  }
}
```

### Option B: Local `stdio` via `@apify/actors-mcp-server`

```json
{
  "mcpServers": {
    "apexsignal-b2b-suite": {
      "command": "npx",
      "args": [
        "-y",
        "@apify/actors-mcp-server@latest",
        "--tools",
        "apexsignal/b2b-hiring-intent-lead-pipeline,apexsignal/b2b-domain-contact-enricher,apexsignal/bulk-email-mx-verifier,apexsignal/ats-career-job-listing-api,apexsignal/b2b-company-lead-finder"
      ],
      "env": {
        "APIFY_TOKEN": "YOUR_APIFY_TOKEN"
      }
    }
  }
}
```

---

## Ready-to-Import n8n Workflow & Agent `SKILL.md`

- **n8n Workflow:** Download [`n8n-b2b-hiring-intent-workflow.json`](./n8n-b2b-hiring-intent-workflow.json) and click **Import from File** in n8n to run the 4-stage B2B Hiring-Intent & Executive Email Enrichment Pipeline automatically.
- **Universal Agent Skill (`SKILL.md`):** Use [`SKILL.md`](./SKILL.md) (also available on [Agensi.io](https://www.agensi.io)) to give Claude Code, Cursor, or Codex CLI an end-to-end B2B outbound prospecting and lead-scoring playbook.

## License

MIT
