// tools/build.mjs
// Builds search-engine and share-friendly pages for every published article.
// Runs in GitHub Actions (see .github/workflows/build.yml). No packages needed (Node 18+).
//
// Output (all generated, safe to delete; they are rebuilt on every run):
//   articles/<id>/index.html   one real page per article, with its own title, description and cover image
//   sitemap.xml                home page + every article
//   rss.xml                    RSS feed of the latest articles

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

// ---------- settings: taken from the same files the website uses ----------
const articlesJs = read("articles.js");
const cfg = (key) => (articlesJs.match(new RegExp(key + '\\s*:\\s*"([^"]+)"')) || [])[1];
const PROJECT = cfg("projectId"), API_KEY = cfg("apiKey");
if (!PROJECT || !API_KEY || /^PASTE/.test(API_KEY)) throw new Error("Firebase settings not found in articles.js");

const template = read("index.html");
const SITE = ((template.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || "").replace(/\/+$/, "");
if (!SITE) throw new Error("canonical link not found in index.html");

// shared helpers (norm, imgSrc, ...) are evaluated from articles.js so there is only one copy of the rules
const shared = {};
new Function("shared", articlesJs + "\n;shared.norm = norm; shared.imgSrc = imgSrc;")(shared);
const { norm, imgSrc } = shared;

const BASE = process.env.FIRESTORE_BASE || "https://firestore.googleapis.com";
const NAME = "Hasanur Rahman";

// ---------- small helpers ----------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clip = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "\u2026" : s; };
const abs = (u) => (/^https?:\/\//.test(u) ? u : SITE + "/" + String(u).replace(/^\/+/, ""));

// the admin panel already cleans article HTML when saving; this is a second safety net
const safeHtml = (h) => String(h || "")
  .replace(/<\s*(script|style|object|embed|link|meta|form)\b[\s\S]*?(<\s*\/\s*\1\s*>|$)/gi, "")
  .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
  .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1=$2#$2');

// Firestore REST returns typed values: {stringValue: ...}. Convert to plain JS.
function val(v) {
  if (v == null) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return new Date(v.timestampValue);
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(val);
  if ("mapValue" in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, val(x)]));
  return null;
}

async function fetchArticles() {
  const url = `${BASE}/v1/projects/${PROJECT}/databases/(default)/documents:runQuery?key=${API_KEY}`;
  const body = { structuredQuery: { from: [{ collectionId: "articles" }], where: { fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "published" } } } } };
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Referer: SITE + "/" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Firestore answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const rows = await res.json();
  return rows.filter((r) => r.document).map((r) => {
    const f = Object.fromEntries(Object.entries(r.document.fields || {}).map(([k, v]) => [k, val(v)]));
    const when = f.publishedAt || f.createdAt || new Date();
    return {
      id: r.document.name.split("/").pop(), title: f.title || "Untitled", subtitle: f.subtitle || "", summary: f.excerpt || "",
      content: f.content || "", image: f.coverImage || "", coverAlt: f.coverAlt || "", category: norm("topic", f.category || ""),
      region: norm("region", f.region || ""), tags: f.tags || [], date: when, updated: f.updatedAt || when
    };
  }).sort((a, b) => b.date - a.date);
}

// ---------- turn index.html into a standalone article page ----------
function articlePage(a) {
  const url = `${SITE}/articles/${encodeURIComponent(a.id)}/`;
  const title = `${a.title} | ${NAME}`;
  const desc = clip(a.summary || a.subtitle || a.title, 200);
  const image = a.image ? abs(imgSrc(a.image)) : `${SITE}/og.jpg`;
  const customImage = !!a.image;
  let h = template;

  // files must be found from /articles/<id>/ as well
  h = h.replace(/\b(href|src)="(?!https?:|\/|#|data:|mailto:|tel:)([^"]+)"/g, '$1="/$2"');

  // title and share tags
  const siteTitle = (h.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || NAME;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>\n  <meta name="site-title" content="${siteTitle.replace(/"/g, "&quot;")}">`);
  h = h.replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`);
  h = h.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${esc(url)}$2`);
  h = h.replace(/(<meta property="og:type" content=")[^"]*(")/, "$1article$2");
  h = h.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(a.title)}$2`);
  h = h.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`);
  h = h.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${esc(url)}$2`);
  h = h.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${esc(image)}$2`);
  h = h.replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${esc(image)}$2`);
  if (customImage) h = h.replace(/\s*<meta property="og:image:(type|width|height)" content="[^"]*">/g, "");
  const extra = [
    `<meta property="og:site_name" content="${NAME}">`, `<meta property="og:locale" content="en_GB">`,
    `<meta property="og:image:alt" content="${esc(a.coverAlt || a.title)}">`,
    `<meta property="article:published_time" content="${a.date.toISOString()}">`, `<meta property="article:modified_time" content="${a.updated.toISOString()}">`,
    a.category ? `<meta property="article:section" content="${esc(a.category)}">` : "",
    ...a.tags.slice(0, 8).map((t) => `<meta property="article:tag" content="${esc(t)}">`),
    `<meta name="twitter:title" content="${esc(a.title)}">`, `<meta name="twitter:description" content="${esc(desc)}">`
  ].filter(Boolean).join("\n  ");
  const ld = JSON.stringify({
    "@context": "https://schema.org", "@type": "Article", headline: clip(a.title, 110), description: desc, image: [image],
    datePublished: a.date.toISOString(), dateModified: a.updated.toISOString(), mainEntityOfPage: url,
    author: { "@type": "Person", name: NAME, url: SITE + "/" }, publisher: { "@type": "Person", name: NAME, url: SITE + "/" },
    articleSection: a.category || undefined, keywords: a.tags.length ? a.tags.join(", ") : undefined
  }).replace(/</g, "\\u003c");
  h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${ld}</script>\n  ${extra}`);

  // this page opens straight on the article; the site script then takes over and adds share bar, contents, related articles...
  h = h.replace('<div id="site">', '<div id="site" hidden>').replace('<div id="reader" hidden>', '<div id="reader">');
  const cover = a.image ? `<div class="cov"><img class="rimg" src="${esc(abs(imgSrc(a.image)))}" alt="${esc(a.coverAlt || a.title)}"></div>` : "";
  h = h.replace('<figure class="rcover" id="rCover"></figure>', `<figure class="rcover" id="rCover">${cover}</figure>`);
  h = h.replace('<p class="rlabel" id="rLabel"></p>', `<p class="rlabel" id="rLabel">${esc([a.category].filter(Boolean).join(" \u00b7 "))}</p>`);
  h = h.replace('<h1 id="rTitle"></h1>', `<h1 id="rTitle">${esc(a.title)}</h1>`);
  h = h.replace('<p class="standfirst" id="rSub"></p>', `<p class="standfirst" id="rSub">${esc(a.subtitle || a.summary)}</p>`);
  h = h.replace('<div id="rBody" class="body"></div>', `<div id="rBody" class="body">${safeHtml(a.content)}</div>`);
  h = h.replace('<script src="/articles.js', `<script>window.__ARTICLE_ID = ${JSON.stringify(a.id).replace(/</g, "\\u003c")};</script>\n  <script src="/articles.js`);
  if (!h.includes("window.__ARTICLE_ID")) throw new Error("template markers changed; update tools/build.mjs for " + a.id);
  return h;
}

const sitemap = (arts) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc></url>
${arts.map((a) => `  <url><loc>${SITE}/articles/${encodeURIComponent(a.id)}/</loc><lastmod>${a.updated.toISOString().slice(0, 10)}</lastmod></url>`).join("\n")}
</urlset>
`;

const rss = (arts) => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${NAME}</title>
    <link>${SITE}/</link>
    <description>Independent analysis of geopolitics, international relations and strategy, with a focus on Bangladesh and South Asia.</description>
    <language>en</language>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
${arts.slice(0, 30).map((a) => `    <item>
      <title>${esc(a.title)}</title>
      <link>${SITE}/articles/${encodeURIComponent(a.id)}/</link>
      <guid isPermaLink="true">${SITE}/articles/${encodeURIComponent(a.id)}/</guid>
      <pubDate>${a.date.toUTCString()}</pubDate>
      <description>${esc(clip(a.summary || a.subtitle, 300))}</description>${a.category ? `\n      <category>${esc(a.category)}</category>` : ""}
    </item>`).join("\n")}
  </channel>
</rss>
`;

// ---------- run ----------
const arts = (await fetchArticles()).filter((a) => /^[A-Za-z0-9._-]+$/.test(a.id)); // other ids still work through the normal #article-... link
console.log(`Published articles: ${arts.length}`);

const outDir = path.join(ROOT, "articles");
fs.rmSync(outDir, { recursive: true, force: true }); // only after a successful fetch, so a failed run never wipes the site
for (const a of arts) {
  fs.mkdirSync(path.join(outDir, a.id), { recursive: true });
  fs.writeFileSync(path.join(outDir, a.id, "index.html"), articlePage(a));
}
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap(arts));
fs.writeFileSync(path.join(ROOT, "rss.xml"), rss(arts));
console.log("Done: articles/, sitemap.xml, rss.xml");
