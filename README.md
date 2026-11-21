# @apexsignal B2B Intelligence MCP & n8n Suite (v1.2.0 — Instant Zero-Token Mode + Cloud Scale)

[![Burapa-J/apexsignal-b2b-mcp-suite MCP server](https://glama.ai/mcp/servers/Burapa-J/apexsignal-b2b-mcp-suite/badges/score.svg)](https://glama.ai/mcp/servers/Burapa-J/apexsignal-b2b-mcp-suite)

Sub-2-second **Model Context Protocol (MCP)** tools, **`SKILL.md` Agent Playbook**, and **n8n automation workflows** powered by the [`@apexsignal`](https://apify.com/apexsignal) B2B Intelligence Suite on Apify Store.

### What's New in v1.2.0
1. **Works Out-of-the-Box with ZERO API Key (`ZERO_TOKEN_LOCAL_TRIAL`):** Clone or run `npx` and test any of the 5 tools immediately on up to 5 companies/emails with zero signup. Set `APIFY_TOKEN` whenever you want 10,000-item cloud batch scale.
2. **Domain-Only Auto-Discovery:** Pass just a bare company domain (e.g. `"linear.app"` or `"cloudflare.com"`) — no need to know ATS slugs (`greenhouse:`/`lever:`/`ashby:`) or executive names in advance. Both open ATS job boards and named executives (CEO, Founder, CTO, VP) are auto-discovered.

---

## Live MCP Tools, Apify Store Endpoints & 1-Click Free `SKILL.md` (5 Actors)

| Tool / Actor | Zero-Friction Capability | Pricing (Pay-Per-Event) | 1-Click Free `SKILL.md` (Agensi.io) | Apify Store URL |
|---|---|---|---|---|
| **[B2B Hiring Intent, ATS Jobs & Executive Email Pipeline (MCP)](https://apify.com/apexsignal/b2b-hiring-intent-lead-pipeline)** | **One-Call Composite Pipeline from 1 Domain:** Auto-discovers Greenhouse/Lever/Ashby open jobs, DNS MX/SPF/DMARC & tech stack, and MX-verified executive emails with a `0–100` `outboundReadinessScore`. | `$0.0045` / dossier (`$0.00315` Gold–Diamond; dead domains `$0`) | **[Install Free Skill](https://www.agensi.io/r/BURAPA?to=/skills/b2b-hiring-intent-lead-enrichment-pipeline-mcp&utm_source=github)** | https://apify.com/apexsignal/b2b-hiring-intent-lead-pipeline |
| **[B2B Domain Contact, MX & Tech Stack Enricher — $2/1k](https://apify.com/apexsignal/b2b-domain-contact-enricher)** | Extracts verified emails, phones, social links (`LinkedIn`, `X`, `GitHub`), DNS MX/SPF/DMARC posture, and tech stack from company domains in `<2s`. | `$0.0020` / domain (`$0.0014` Gold–Diamond) | **[Install Free Skill](https://www.agensi.io/r/BURAPA?to=/skills/b2b-domain-contact-dns-mx-tech-stack-enricher-mcp&utm_source=github)** | https://apify.com/apexsignal/b2b-domain-contact-enricher |
| **[Bulk Email Verifier & MX/DMARC Check — $0.60/1k](https://apify.com/apexsignal/bulk-email-mx-verifier)** | High-speed bulk email verification via RFC syntax, deduplicated DNS MX lookup, disposable domain detection, and role-account scoring (`0–100`). | `$0.0006` / email (`$0.42–$0.60/1k`, duplicates free) | **[Install Free Skill](https://www.agensi.io/r/BURAPA?to=/skills/bulk-corporate-email-mx-deliverability-verifier-mcp&utm_source=github)** | https://apify.com/apexsignal/bulk-email-mx-verifier |
| **[Career Page & ATS Job Scraper by Domain](https://apify.com/apexsignal/ats-career-job-listing-api)** | Give any company domain (`linear.app`, `cloudflare.com`) and auto-discover live open roles across Greenhouse, Lever, and Ashby career APIs. | `$0.0012` / job (`$0.00084` Gold–Diamond) | **[Install Free Skill](https://www.agensi.io/r/BURAPA?to=/skills/tech-career-ats-job-scraper-greenhouse-lever-ashby-mcp&utm_source=github)** | https://apify.com/apexsignal/ats-career-job-listing-api |
| **[B2B Decision Maker & Email Finder by Domain — $2.50/1k](https://apify.com/apexsignal/b2b-company-lead-finder)** | Auto-discovers CEO/Founder/CTO/VP names from company pages + JSON-LD and generates MX-verified executive email leads directly from company domains. | `$0.0025` / lead (`$0.00175` Gold–Diamond; dead domains `$0`) | **[Install Free Skill](https://www.agensi.io/r/BURAPA?to=/skills/b2b-executive-decision-maker-email-lead-finder-mcp&utm_source=github)** | https://apify.com/apexsignal/b2b-company-lead-finder |

---

## Install as an Agent Skill (`SKILL.md` on Agensi.io — 5 Free Skills + All-7 Pro Engineering Suite)

Install any of the **5 Free B2B MCP Skills** above or our **AI Coding Agent Engineering Suites** directly into Claude Code, Cursor, Codex CLI, Windsurf, or Copilot via **Agensi.io**:

- **Agensi Creator Storefront (All 12 Live Skills):** [https://www.agensi.io/r/BURAPA?to=/creators/burapa&utm_source=github](https://www.agensi.io/r/BURAPA?to=/creators/burapa&utm_source=github)
- **Complete AI Agent & MCP Engineering Suite (All 7 Pro Skills — `$35` vs `$133`, Save 74%):** [https://www.agensi.io/r/BURAPA?to=/bundles/complete-ai-agent-mcp-engineering-suite-all-7-pro-skills&utm_source=github](https://www.agensi.io/r/BURAPA?to=/bundles/complete-ai-agent-mcp-engineering-suite-all-7-pro-skills&utm_source=github)
- **4-in-1 AI Engineering & Token Efficiency Pro Suite (`$24` vs `$76`, Save 68%):** [https://www.agensi.io/r/BURAPA?to=/bundles/ai-engineering-token-efficiency-pro-suite&utm_source=github](https://www.agensi.io/r/BURAPA?to=/bundles/ai-engineering-token-efficiency-pro-suite&utm_source=github)

---

## Quickstart: Connect to Claude Code / Claude Desktop / Cursor / Windsurf (MCP)

### Option A: Zero-Token Instant Local Mode (No API Key Needed to Start!)

Add to your `claude_desktop_config.json` or `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "apexsignal-b2b-suite": {
      "command": "npx",
      "args": ["-y", "github:Burapa-J/apexsignal-b2b-mcp-suite"]
    }
  }
}
```
*(Add `"env": { "APIFY_TOKEN": "YOUR_APIFY_TOKEN" }` anytime to scale from 5 items/call to 10,000+ items on Apify Cloud — free Apify accounts include `$5.00/month` platform credit!)*

### Option B: Hosted Streamable HTTP via `mcp.apify.com` (OAuth / Zero-Install)

```json
{
  "mcpServers": {
    "apexsignal-b2b-suite": {
      "url": "https://mcp.apify.com/?actors=apexsignal/b2b-hiring-intent-lead-pipeline,apexsignal/b2b-domain-contact-enricher,apexsignal/bulk-email-mx-verifier,apexsignal/ats-career-job-listing-api,apexsignal/b2b-company-lead-finder"
    }
  }
}
```

---

## Ready-to-Import n8n Workflow & Agent `SKILL.md`

- **n8n Workflow:** Download [`n8n-b2b-hiring-intent-workflow.json`](./n8n-b2b-hiring-intent-workflow.json) and click **Import from File** in n8n.
- **Universal Agent Skill (`SKILL.md`):** Use [`SKILL.md`](./SKILL.md) or install with 1 click on [Agensi.io (`@burapa`)](https://www.agensi.io/r/BURAPA?to=/creators/burapa&utm_source=github).

## License

MIT
