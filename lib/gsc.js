import { monthRanges, resolveRange } from "@/lib/dates";

async function gscQuery(token, siteUrl, body) {
  const r = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ dataState: "all", ...body }) }
  );
  const d = await r.json();
  if (!r.ok) throw new Error((d.error && d.error.message) || `Search Console error ${r.status}`);
  return d;
}

export async function listSites(token) {
  const r = await fetch("https://www.googleapis.com/webmasters/v3/sites", { headers: { Authorization: `Bearer ${token}` } });
  const d = await r.json();
  if (!r.ok) throw new Error((d.error && d.error.message) || `Search Console error ${r.status}`);
  return (d.siteEntry || [])
    .filter((s) => s.permissionLevel && s.permissionLevel !== "siteUnverifiedUser")
    .map((s) => ({ siteUrl: s.siteUrl, permission: s.permissionLevel }));
}

export async function listSitemaps(token, siteUrl) {
  const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`, { headers: { Authorization: `Bearer ${token}` } });
  const d = await r.json();
  if (!r.ok) throw new Error((d.error && d.error.message) || `Search Console error ${r.status}`);
  return (d.sitemap || []).map((s) => s.path).filter(Boolean);
}

export async function gscSummary(token, siteUrl, start, end) {
  const d = await gscQuery(token, siteUrl, { startDate: start, endDate: end });
  const row = (d.rows && d.rows[0]) || {};
  return { clicks: row.clicks || 0, impressions: row.impressions || 0, ctr: row.ctr || 0, position: row.position || 0 };
}

export async function topKeywords(token, siteUrl, limit = 30, start, end) {
  const { curStart, curEnd } = monthRanges();
  const s = start || curStart, e = end || curEnd;
  const d = await gscQuery(token, siteUrl, { startDate: s, endDate: e, dimensions: ["query"], rowLimit: Math.min(limit, 30) });
  const rows = (d.rows || []).map((x) => ({ query: x.keys[0], clicks: x.clicks, impressions: x.impressions, ctr: x.ctr, position: x.position }));
  const totals = rows.reduce((a, x) => ({ clicks: a.clicks + x.clicks, impressions: a.impressions + x.impressions }), { clicks: 0, impressions: 0 });
  return { rows, totals, range: { curStart: s, curEnd: e } };
}

export async function gscReport(token, siteUrl, range) {
  const r = range && range.start ? range : resolveRange();
  const [summary, prevSummary, kw] = await Promise.all([
    gscSummary(token, siteUrl, r.start, r.end),
    gscSummary(token, siteUrl, r.prevStart, r.prevEnd),
    topKeywords(token, siteUrl, 30, r.start, r.end),
  ]);
  return { summary, prevSummary, rows: kw.rows, totals: kw.totals, range: r };
}
