#!/usr/bin/env node
import readline from "node:readline";

const TOOLS = [
  {
    name: "enrich_b2b_domain",
    actor: "apexsignal~b2b-domain-contact-enricher",
    description: "Extract verified B2B emails, social links, DNS MX email provider, and tech stack from company domains.",
    inputSchema: {
      type: "object",
      properties: {
        domains: { type: "array", items: { type: "string" }, description: "Company domains (e.g. [\"apify.com\"])" },
        maxItems: { type: "integer", default: 10 }
      },
      required: ["domains"]
    }
  },
  {
    name: "verify_bulk_emails_mx",
    actor: "apexsignal~bulk-email-mx-verifier",
    description: "Verify email addresses via RFC syntax, DNS MX records, disposable domain detection, and role-account scoring.",
    inputSchema: {
      type: "object",
      properties: {
        emails: { type: "array", items: { type: "string" }, description: "Emails to verify" },
        maxItems: { type: "integer", default: 25 }
      },
      required: ["emails"]
    }
  },
  {
    name: "fetch_ats_career_jobs",
    actor: "apexsignal~ats-career-job-listing-api",
    description: "Fetch active job listings from Greenhouse, Lever, and Ashby ATS boards.",
    inputSchema: {
      type: "object",
      properties: {
        boards: { type: "array", items: { type: "string" }, description: "ATS targets (e.g. [\"greenhouse:cloudflare\", \"lever:Netflix\"])" },
        keyword: { type: "string" },
        maxItems: { type: "integer", default: 25 }
      },
      required: ["boards"]
    }
  },
  {
    name: "find_b2b_company_executive_leads",
    actor: "apexsignal~b2b-company-lead-finder",
    description: "Infer corporate email patterns and generate MX-verified executive email leads from company domains.",
    inputSchema: {
      type: "object",
      properties: {
        companies: {
          type: "array",
          items: {
            type: "object",
            properties: {
              domain: { type: "string" },
              companyName: { type: "string" }
            },
            required: ["domain"]
          }
        },
        maxItems: { type: "integer", default: 10 }
      },
      required: ["companies"]
    }
  }
];

async function callApifyActor(actorSlug, args) {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error("Missing APIFY_TOKEN environment variable. Get your free token at https://console.apify.com/settings/integrations");
  }
  const res = await fetch(`https://api.apify.com/v2/acts/${actorSlug}/run-sync-get-dataset-items`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(args ?? {})
  });
  if (!res.ok) {
    throw new Error(`Apify API HTTP ${res.status}: ${await res.text()}`);
  }
  return await res.json();
}

const rl = readline.createInterface({ input: process.stdin, terminal: false });

rl.on("line", async (line) => {
  if (!line.trim()) return;
  let req;
  try {
    req = JSON.parse(line);
  } catch {
    return;
  }
  const { id, method, params } = req;
  try {
    if (method === "initialize") {
      process.stdout.write(JSON.stringify({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "apexsignal-b2b-mcp-suite", version: "1.0.0" }
        }
      }) + "\n");
    } else if (method === "tools/list") {
      process.stdout.write(JSON.stringify({
        jsonrpc: "2.0",
        id,
        result: {
          tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }))
        }
      }) + "\n");
    } else if (method === "tools/call") {
      const tool = TOOLS.find((t) => t.name === params?.name);
      if (!tool) throw new Error(`Unknown tool: ${params?.name}`);
      const data = await callApifyActor(tool.actor, params?.arguments);
      process.stdout.write(JSON.stringify({
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
        }
      }) + "\n");
    } else if (id !== undefined) {
      process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result: {} }) + "\n");
    }
  } catch (err) {
    if (id !== undefined) {
      process.stdout.write(JSON.stringify({
        jsonrpc: "2.0",
        id,
        error: { code: -32000, message: err instanceof Error ? err.message : String(err) }
      }) + "\n");
    }
  }
});
