#!/usr/bin/env node
import dns from "node:dns/promises";
import readline from "node:readline";

const FREE_LOCAL_TRIAL_CAP = 5;

const TOOLS = [
  {
    name: "run_b2b_hiring_intent_lead_pipeline",
    actor: "apexsignal~b2b-hiring-intent-lead-pipeline",
    description:
      "All-in-One B2B Pipeline (works instantly with ZERO API key up to 5 companies, or scales to 5,000+ via APIFY_TOKEN): auto-discover live Greenhouse/Lever/Ashby jobs from a bare domain, enrich DNS MX/SPF/DMARC & tech stack, auto-discover executive emails, and compute outboundReadinessScore (0-100).",
    inputSchema: {
      type: "object",
      properties: {
        companies: {
          type: "array",
          description: "Target company objects [{ domain, atsTarget?, executives? }] or use 'domains'",
          items: {
            type: "object",
            properties: {
              domain: { type: "string", description: "Company domain (e.g. 'linear.app', 'cloudflare.com')" },
              atsTarget: { type: "string", description: "Optional ATS board (auto-discovered if omitted)" },
              executives: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    fullName: { type: "string" },
                    role: { type: "string" }
                  },
                  required: ["fullName"]
                }
              }
            },
            required: ["domain"]
          }
        },
        domains: {
          type: "array",
          items: { type: "string" },
          description: "Zero-friction shorthand: list of company domains (e.g. ['linear.app', 'cloudflare.com'])"
        },
        jobKeyword: { type: "string", description: "Optional role/department keyword filter" },
        remoteOnly: { type: "boolean", default: false },
        maxItems: { type: "integer", default: 5 }
      }
    }
  },
  {
    name: "enrich_b2b_domain",
    actor: "apexsignal~b2b-domain-contact-enricher",
    description:
      "Extract verified B2B emails, phones, social links, DNS MX/SPF/DMARC security posture, and tech stack from company domains (instant local mode <=5 domains; Apify Cloud scale with APIFY_TOKEN).",
    inputSchema: {
      type: "object",
      properties: {
        domains: {
          type: "array",
          items: { type: "string" },
          description: "Company domains (e.g. ['apify.com', 'stripe.com'])"
        },
        maxItems: { type: "integer", default: 5 }
      },
      required: ["domains"]
    }
  },
  {
    name: "verify_bulk_emails_mx",
    actor: "apexsignal~bulk-email-mx-verifier",
    description:
      "Verify email addresses via RFC syntax, deduplicated DNS MX lookup, disposable domain detection, and role-account scoring ($0.60/1k at scale via Apify Cloud; instant local mode <=5 emails).",
    inputSchema: {
      type: "object",
      properties: {
        emails: {
          type: "array",
          items: { type: "string" },
          description: "Email addresses to verify"
        },
        maxItems: { type: "integer", default: 25 }
      },
      required: ["emails"]
    }
  },
  {
    name: "fetch_ats_career_jobs",
    actor: "apexsignal~ats-career-job-listing-api",
    description:
      "Fetch live open job listings from Greenhouse, Lever, and Ashby by bare company domain (e.g. 'linear.app', 'cloudflare.com') or ATS slug.",
    inputSchema: {
      type: "object",
      properties: {
        targets: {
          type: "array",
          items: { type: "string" },
          description: "Company domains or ATS slugs (e.g. ['linear.app', 'cloudflare.com'])"
        },
        keyword: { type: "string" },
        remoteOnly: { type: "boolean", default: false },
        maxItems: { type: "integer", default: 25 }
      },
      required: ["targets"]
    }
  },
  {
    name: "find_b2b_company_executive_leads",
    actor: "apexsignal~b2b-company-lead-finder",
    description:
      "Auto-discover named executives (CEO/Founder/CTO/VP) from company pages + JSON-LD and generate MX-verified executive email leads from company domains.",
    inputSchema: {
      type: "object",
      properties: {
        domains: {
          type: "array",
          items: { type: "string" },
          description: "Target company domains (e.g. ['apify.com', 'cloudflare.com'])"
        },
        contacts: {
          type: "array",
          description: "Optional known { domain, fullName, role } contacts (auto-discovered if omitted)",
          items: {
            type: "object",
            properties: {
              domain: { type: "string" },
              fullName: { type: "string" },
              role: { type: "string" }
            }
          }
        },
        maxItems: { type: "integer", default: 5 }
      },
      required: ["domains"]
    }
  },
  {
    name: "find_work_email_by_name_domain",
    actor: "apexsignal~b2b-work-email-finder",
    description:
      "Turn Full Name (or First + Last Name) + Company Domain into a pattern-matched, DNS MX/SPF/DMARC-verified B2B work email with ranked alternatives ($1.00/1k on Apify Cloud; instant local mode <=5 leads).",
    inputSchema: {
      type: "object",
      properties: {
        leads: {
          type: "array",
          description: "List of { fullName, domain, role? } prospects",
          items: {
            type: "object",
            properties: {
              fullName: { type: "string" },
              domain: { type: "string" },
              role: { type: "string" }
            },
            required: ["fullName", "domain"]
          }
        },
        csv: {
          type: "string",
          description: "Optional pasted CSV lines ('Karri Saarinen, linear.app')"
        },
        maxItems: { type: "integer", default: 25 }
      }
    }
  }
];

function normalizeDomain(raw) {
  if (typeof raw !== "string") return null;
  const host = raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]?.split("?")[0] ?? "";
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(host) ? host : null;
}

function classifyMx(exchanges) {
  const joined = exchanges.join(" ").toLowerCase();
  if (!joined) return "None / Unknown";
  if (joined.includes("google")) return "Google Workspace";
  if (joined.includes("outlook.com")) return "Microsoft 365";
  if (joined.includes("pphosted") || joined.includes("proofpoint")) return "Proofpoint Enterprise";
  if (joined.includes("mimecast")) return "Mimecast";
  if (joined.includes("proton")) return "Proton Mail";
  return `Custom MX (${exchanges[0]})`;
}

async function localEnrichDomain(domain) {
  const [httpRes, mxRes, spfRes, dmarcRes] = await Promise.allSettled([
    fetch(`https://${domain}`, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; ApexSignalMCP/1.2)" },
      signal: AbortSignal.timeout(6000)
    }),
    dns.resolveMx(domain),
    dns.resolveTxt(domain),
    dns.resolveTxt(`_dmarc.${domain}`)
  ]);
  const html = httpRes.status === "fulfilled" ? await httpRes.value.text() : "";
  const mx = mxRes.status === "fulfilled" ? mxRes.value.sort((a, b) => a.priority - b.priority).map((r) => r.exchange) : [];
  const spf = spfRes.status === "fulfilled" ? spfRes.value.map((c) => c.join("")) : [];
  const dmarc = dmarcRes.status === "fulfilled" ? dmarcRes.value.map((c) => c.join("")) : [];
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ?? domain;
  const emails = Array.from(new Set((html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? []).map((e) => e.toLowerCase()).filter((e) => !/\.(png|jpg|jpeg|svg|webp|css|js)$/i.test(e) && !e.startsWith("sentry@")))).slice(0, 10);
  const dmarcMatch = dmarc.find((t) => /v=dmarc1/i.test(t))?.match(/\bp=(reject|quarantine|none)\b/i)?.[1]?.toLowerCase() ?? "none-found";
  return {
    domain,
    title,
    emails,
    emailProvider: classifyMx(mx),
    mxValid: mx.length > 0,
    spfValid: spf.some((t) => t.toLowerCase().includes("v=spf1")),
    dmarcPolicy: dmarcMatch,
    html
  };
}

async function localFetchAtsJobs(rawTarget, keyword = "", remoteOnly = false, limit = 10) {
  const cleaned = String(rawTarget).trim().toLowerCase();
  let provider = null;
  let slug = cleaned.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].split(".")[0];
  if (cleaned.includes(":")) {
    const parts = cleaned.split(":");
    provider = parts[0];
    slug = parts[1];
  } else if (cleaned.includes(".")) {
    const dom = normalizeDomain(cleaned);
    if (dom) {
      for (const u of [`https://${dom}`, `https://${dom}/careers`]) {
        try {
          const r = await fetch(u, { signal: AbortSignal.timeout(4000) });
          if (r.ok) {
            const h = await r.text();
            const gh = h.match(/https?:\/\/(?:boards|job-boards)\.greenhouse\.io\/([a-zA-Z0-9_-]+)/i)?.[1];
            const ash = h.match(/https?:\/\/jobs\.ashbyhq\.com\/([a-zA-Z0-9_.-]+)/i)?.[1];
            const lev = h.match(/https?:\/\/jobs\.lever\.co\/([a-zA-Z0-9_-]+)/i)?.[1];
            if (gh && gh !== "embed") { provider = "greenhouse"; slug = gh.toLowerCase(); break; }
            if (ash) { provider = "ashby"; slug = ash.toLowerCase(); break; }
            if (lev) { provider = "lever"; slug = lev.toLowerCase(); break; }
          }
        } catch {}
      }
    }
  }
  const providers = provider ? [provider] : ["greenhouse", "ashby", "lever"];
  for (const p of providers) {
    try {
      if (p === "greenhouse") {
        const r = await fetch(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs`, { signal: AbortSignal.timeout(6000) });
        if (r.ok) {
          const j = await r.json();
          const jobs = (j.jobs ?? []).map((x) => ({ id: `greenhouse:${slug}:${x.id}`, atsProvider: "greenhouse", title: x.title, department: x.departments?.[0]?.name ?? "General", location: x.location?.name ?? "Unspecified", isRemote: /remote|anywhere/i.test(`${x.location?.name} ${x.title}`), url: x.absolute_url }));
          if (jobs.length > 0) return jobs.filter((x) => (!remoteOnly || x.isRemote) && (!keyword || `${x.title} ${x.department}`.toLowerCase().includes(keyword.toLowerCase()))).slice(0, limit);
        }
      } else if (p === "ashby") {
        const r = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}`, { signal: AbortSignal.timeout(6000) });
        if (r.ok) {
          const j = await r.json();
          const jobs = (j.jobs ?? []).map((x) => ({ id: `ashby:${slug}:${x.id}`, atsProvider: "ashby", title: x.title, department: x.department ?? "General", location: x.location ?? "Unspecified", isRemote: Boolean(x.isRemote) || /remote/i.test(`${x.location} ${x.title}`), url: x.jobUrl }));
          if (jobs.length > 0) return jobs.filter((x) => (!remoteOnly || x.isRemote) && (!keyword || `${x.title} ${x.department}`.toLowerCase().includes(keyword.toLowerCase()))).slice(0, limit);
        }
      } else if (p === "lever") {
        const r = await fetch(`https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`, { signal: AbortSignal.timeout(6000) });
        if (r.ok) {
          const arr = await r.json();
          if (Array.isArray(arr) && arr.length > 0) {
            const jobs = arr.map((x) => ({ id: `lever:${slug}:${x.id}`, atsProvider: "lever", title: x.text, department: x.categories?.department ?? "General", location: x.categories?.location ?? "Unspecified", isRemote: x.workplaceType === "remote" || /remote/i.test(`${x.categories?.location} ${x.text}`), url: x.hostedUrl }));
            return jobs.filter((x) => (!remoteOnly || x.isRemote) && (!keyword || `${x.title} ${x.department}`.toLowerCase().includes(keyword.toLowerCase()))).slice(0, limit);
          }
        }
      }
    } catch {}
  }
  return [];
}

async function runZeroTokenLocalFallback(toolName, args = {}) {
  const scaleNote = "Executed in Instant Zero-Token Local Mode (capped at 5 items). Set APIFY_TOKEN (free $5/mo credit at https://console.apify.com/settings/integrations) to unlock 10,000-item batch scale on @apexsignal Apify Cloud.";
  if (toolName === "enrich_b2b_domain") {
    const rawList = args.domains ?? (args.domain ? [args.domain] : ["apify.com"]);
    const domains = rawList.map(normalizeDomain).filter(Boolean).slice(0, FREE_LOCAL_TRIAL_CAP);
    const items = [];
    for (const d of domains) {
      const { html: _h, ...profile } = await localEnrichDomain(d);
      items.push(profile);
    }
    return { mode: "ZERO_TOKEN_LOCAL_TRIAL", note: scaleNote, items };
  }
  if (toolName === "verify_bulk_emails_mx") {
    const rawEmails = Array.isArray(args.emails) ? args.emails : String(args.emails ?? args.email ?? "").split(/[\s,;]+/);
    const emails = rawEmails.map((e) => String(e).trim().toLowerCase()).filter((e) => e.includes("@")).slice(0, FREE_LOCAL_TRIAL_CAP);
    const items = [];
    for (const email of emails) {
      const domain = email.split("@")[1] ?? "";
      let mx = [];
      try { mx = (await dns.resolveMx(domain)).map((r) => r.exchange); } catch {}
      items.push({ email, domain, hasMxRecords: mx.length > 0, mxProvider: classifyMx(mx), deliverabilityStatus: mx.length > 0 ? "DELIVERABLE_MX_VALID" : "UNDELIVERABLE_NO_MX" });
    }
    return { mode: "ZERO_TOKEN_LOCAL_TRIAL", note: scaleNote, items };
  }
  if (toolName === "find_work_email_by_name_domain") {
    const rawLeads = Array.isArray(args.leads) ? args.leads : (args.fullName && args.domain ? [{ fullName: args.fullName, domain: args.domain, role: args.role }] : []);
    const items = [];
    for (const l of rawLeads.slice(0, FREE_LOCAL_TRIAL_CAP)) {
      const dom = normalizeDomain(l.domain);
      if (!dom) continue;
      const enriched = await localEnrichDomain(dom);
      const parts = String(l.fullName ?? "").trim().toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
      const f = parts[0] ?? "contact", last = parts.length > 1 ? parts[parts.length - 1] : "";
      const cands = last ? [`${f}.${last}@${dom}`, `${f}@${dom}`, `${f[0]}${last}@${dom}`] : [`${f}@${dom}`];
      items.push({ fullName: l.fullName, domain: dom, recommendedEmail: cands[0], alternativeEmails: cands.slice(1), mxValid: enriched.mxValid, emailProvider: enriched.emailProvider, spfValid: enriched.spfValid, dmarcPolicy: enriched.dmarcPolicy });
    }
    return { mode: "ZERO_TOKEN_LOCAL_TRIAL", note: scaleNote, items };
  }
  if (toolName === "fetch_ats_career_jobs") {
    const targets = (args.targets ?? args.boards ?? (args.domain ? [args.domain] : ["cloudflare.com"])).slice(0, FREE_LOCAL_TRIAL_CAP);
    const items = [];
    for (const t of targets) {
      const jobs = await localFetchAtsJobs(t, args.keyword ?? args.keywordFilter ?? "", Boolean(args.remoteOnly), Math.min(10, args.maxItems ?? 10));
      items.push(...jobs);
    }
    return { mode: "ZERO_TOKEN_LOCAL_TRIAL", note: scaleNote, items };
  }
  if (toolName === "find_b2b_company_executive_leads" || toolName === "run_b2b_hiring_intent_lead_pipeline") {
    const rawTargets = args.companies ?? args.targets ?? args.domains ?? (args.domain ? [args.domain] : ["cloudflare.com"]);
    const normalized = rawTargets.map((t) => (typeof t === "string" ? { domain: normalizeDomain(t) } : { ...t, domain: normalizeDomain(t.domain) })).filter((t) => t.domain).slice(0, FREE_LOCAL_TRIAL_CAP);
    const items = [];
    for (const comp of normalized) {
      const [enriched, jobs] = await Promise.all([
        localEnrichDomain(comp.domain),
        toolName === "run_b2b_hiring_intent_lead_pipeline"
          ? localFetchAtsJobs(comp.atsTarget ?? comp.atsBoard ?? comp.domain, args.jobKeyword ?? args.keywordFilter ?? "", Boolean(args.remoteOnly), 5)
          : Promise.resolve([])
      ]);
      const execs = Array.isArray(comp.executives) ? comp.executives : [];
      const execLeads = execs.map((ex) => {
        const parts = String(ex.fullName ?? "").trim().toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
        const email = parts.length > 1 ? `${parts[0]}.${parts[parts.length - 1]}@${comp.domain}` : `${parts[0] ?? "contact"}@${comp.domain}`;
        return { fullName: ex.fullName, role: ex.role ?? "Executive", recommendedEmail: email, mxVerified: enriched.mxValid };
      });
      items.push({
        domain: comp.domain,
        companyName: enriched.title.split(/[|—–:-]/)[0]?.trim() || comp.domain,
        mxValid: enriched.mxValid,
        emailProvider: enriched.emailProvider,
        spfValid: enriched.spfValid,
        dmarcPolicy: enriched.dmarcPolicy,
        openJobsCount: jobs.length,
        matchingJobs: jobs,
        verifiedExecutiveLeads: execLeads,
        publicEmails: enriched.emails
      });
    }
    return { mode: "ZERO_TOKEN_LOCAL_TRIAL", note: scaleNote, items };
  }
  return { mode: "ZERO_TOKEN_LOCAL_TRIAL", note: scaleNote, items: [] };
}

async function callApifyOrFallback(tool, args) {
  const token = process.env.APIFY_TOKEN?.trim();
  if (!token) {
    return await runZeroTokenLocalFallback(tool.name, args);
  }
  const res = await fetch(`https://api.apify.com/v2/acts/${tool.actor}/run-sync-get-dataset-items`, {
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
          serverInfo: { name: "apexsignal-b2b-mcp-suite", version: "1.3.0" }
        }
      }) + "\n");
    } else if (method === "notifications/initialized") {
      // MCP notification: no response required
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
      const data = await callApifyOrFallback(tool, params?.arguments);
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
