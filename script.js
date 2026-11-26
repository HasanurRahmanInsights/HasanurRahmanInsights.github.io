/* script.js — renders articles, search, filters, contact links and article reader.
   You normally never need to edit this file. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Version stamp for the self-check (the page compares it with the other files)
window.__SCRIPT_BUILD = "20261126";
(function () { var m = document.querySelector('meta[name="build"]'); if (!m || m.content !== "20261126") window.__notice && window.__notice("index.html is out of date. Upload the latest index.html (and all other site files), then reload."); })();

(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  // Settings: defaults come from articles.js, and are overridden by Site Settings from the admin panel
  const cfg = { email: SITE.email, social: SITE.social, photo: "", bio: "Writing on geopolitics, international relations and strategic studies.", profile: {}, newsletter: "" };
  let shareData = null;
  const NAMES = { x: "X (Twitter)", facebook: "Facebook", linkedin: "LinkedIn", instagram: "Instagram", youtube: "YouTube" };
  let list = []; // filled from Firestore (published articles only), newest first
  let vids = [], res = [], pubs = [], gloss = []; // published videos, maps/reports and publications
  const state = { topic: "", region: "", type: "", actor: "", q: "" };

  // ----- Mobile menu -----
  const menuBtn = $("#menuBtn"), nav = $("#nav");
  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  nav.addEventListener("click", () => { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", false); });

  // ----- Article pieces -----
  const href = (a) => "#article-" + encodeURIComponent(a.id);
  // Articles without a cover image get a branded cover: the hero photo with the topic name, cropped differently for each article
  const phStyle = (id) => { const h = [...String(id)].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7); return `background-position:${h % 100}% ${(h >> 3) % 100}%`; };
  const imageHtml = (a) => a.image
    ? `<img class="thumb" src="${esc(imgSrc(a.image))}" alt="${esc(a.coverAlt)}" loading="lazy">`
    : `<div class="ph" aria-hidden="true" style="${phStyle(a.id)}">${esc(a.category)}</div>`;

  // Friendly placeholder shown whenever a section has no content yet (every section is always visible)
  const soon = (title, text) => `<div class="emptybox"><strong>${esc(title)}</strong><p>${esc(text)}</p></div>`;

  const featuredItem = () => list.find((x) => x.featured) || list[0];
  const skeleton = () => `<div class="card" aria-hidden="true"><div class="ph sk"></div><p class="sk-line w40"></p><p class="sk-line"></p><p class="sk-line w70"></p></div>`.repeat(3) + `<span class="sr" role="status">Loading articles</span>`;

  const chipSpans = (a, all) => [a.type, a.region].filter(Boolean).map((t) => `<span class="chip${t === "Bangladesh" ? " bd" : ""}">${esc(t)}</span>`).join("") + (all ? a.actors : a.actors.slice(0, 3)).map((v) => `<span class="chip act">${esc(v)}</span>`).join("");
  // Cards stay simple: cover picture, headline and a few lines (the whole card is one link)
  const cardHtml = (a) => `<article class="card">${imageHtml(a)}<h3><a href="${href(a)}">${esc(a.title)}</a></h3><p class="excerpt">${esc(a.summary)}</p></article>`;

  function renderList() {
    const q = state.q.toLowerCase(), f = featuredItem(), plain = !(state.topic || state.region || state.type || state.actor || q);
    let shown = list.filter((a) =>
      (!state.topic || a.category === state.topic) && (!state.region || a.region === state.region) && (!state.type || a.type === state.type) && (!state.actor || a.actors.includes(state.actor)) &&
      [a.title, a.summary, a.category, a.region, a.type, a.series, ...a.actors, ...a.tags].join(" ").toLowerCase().includes(q));
    if (plain && f) shown = shown.filter((a) => a !== f); // the featured article has its own large card
    const note = $("#note");
    note.hidden = plain;
    if (!plain) note.innerHTML = `Showing: ${esc([state.topic, state.region, state.type, state.actor, state.q && "\u201c" + state.q + "\u201d"].filter(Boolean).join(" \u00b7 "))} <button type="button" id="clearQ">Show all</button>`;
    $("#list").innerHTML = shown.length ? shown.map(cardHtml).join("") : (plain ? "" : soon("No matching articles", "Try a different topic, region or keyword, or press Show all."));
  }

  // Topic / Region / Type dropdowns list only the values that exist in published articles
  function renderFilters() {
    const fill = (id, label, sk, field, order) => {
      const rank = (v) => (order.indexOf(v) < 0 ? 99 : order.indexOf(v));
      const vals = [...new Set([...order, ...list.map((a) => a[field]).filter(Boolean)])].sort((x, y) => rank(x) - rank(y));
      const sel = $(id);
      sel.hidden = false;
      sel.innerHTML = `<option value="">All ${label}</option>` + vals.map((v) => `<option>${esc(v)}</option>`).join("");
      sel.value = state[sk];
    };
    fill("#fTopic", "topics", "topic", "category", TOPICS);
    fill("#fRegion", "regions", "region", "region", REGIONS);
    fill("#fType", "types", "type", "type", TYPES);
  }
  [["#fTopic", "topic"], ["#fRegion", "region"], ["#fType", "type"]].forEach(([id, k]) => $(id).addEventListener("change", (e) => { state[k] = e.target.value; renderList(); }));
  $("#search").addEventListener("input", (e) => { state.q = e.target.value.trim(); renderList(); });
  $("#note").addEventListener("click", (e) => {
    if (e.target.id !== "clearQ") return;
    Object.assign(state, { topic: "", region: "", type: "", actor: "", q: "" }); $("#search").value = "";
    renderFilters(); renderList();
  });
  // Links with data-topic / data-region (menu, hero, areas, footer) open the articles with that filter
  document.addEventListener("click", (e) => {
    const l = e.target.closest("[data-topic],[data-region]"); if (!l) return;
    e.preventDefault();
    Object.assign(state, { topic: l.dataset.topic || "", region: l.dataset.region || "", type: "", actor: "", q: "" });
    $("#search").value = ""; renderFilters(); renderList();
    if ($("#reader").hidden) $("#articles").scrollIntoView({ behavior: "smooth" }); else location.hash = "#articles";
  });

  function renderFeatured() {
    const a = featuredItem();
    $("#featuredBox").innerHTML = a
      ? `<div class="feat featcard">${imageHtml(a)}<div><p class="meta">Featured</p><h3><a href="${href(a)}">${esc(a.title)}</a></h3><p class="excerpt">${esc(a.summary)}</p><p class="readmore">Read the analysis &rarr;</p></div></div>`
      : soon("Featured analysis", "The first in-depth analysis is coming soon.");
  }

  // ----- Contact and social (only filled-in values are shown) -----
  // Simple line icons (Feather icon set, MIT licence)
  const svg = (p) => `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">${p}</svg>`;
  const ICON = {
    mail: svg('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>'),
    x: svg('<path d="M4 4l16 16M20 4L4 20"/>'),
    facebook: svg('<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'),
    linkedin: svg('<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>'),
    instagram: svg('<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>'),
    youtube: svg('<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>'),
    link: svg('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>')
  };
  const iconFor = (name) => ICON[Object.keys(ICON).find((k) => k !== "link" && new RegExp("^" + k, "i").test(name.replace(/^\W+/, "")))] || ICON.link;

  function renderContact() {
    const items = [];
    if (cfg.email) items.push({ n: "Email", u: "mailto:" + cfg.email, i: ICON.mail });
    Object.entries(cfg.social).forEach(([n, u]) => { if (/^https?:\/\//i.test(u)) items.push({ n, u, i: iconFor(n) }); });
    $("#socialBox").innerHTML = items.length
      ? items.map((x) => `<li><a class="sbtn" href="${esc(x.u)}"${x.u.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : ""} aria-label="${esc(x.n)}" title="${esc(x.n)}">${x.i}</a></li>`).join("")
      : "";
  }

  // ----- Article reader (address like  #article-sample-article ) -----
  const base = document.title;
  function route() {
    const h = decodeURIComponent(location.hash);
    const a = h.startsWith("#article-") && list.find((x) => "#article-" + x.id === h);
    const sn = h.startsWith("#series-") ? h.slice(8) : "";
    const sl = sn ? list.filter((x) => x.series === sn).sort((x, y) => x.date - y.date) : [];
    $("#site").hidden = !!a || sl.length > 0;
    $("#reader").hidden = !a;
    $("#seriesView").hidden = !sl.length;
    $("#progress").hidden = !a; $("#progress").style.width = "0";
    if (a) {
      $("#rLabel").textContent = [a.category, a.type].filter(Boolean).join(" · ");
      $("#rTitle").textContent = a.title;
      $("#rSub").textContent = a.subtitle || a.summary;
      $("#rCover").innerHTML = a.image
        ? `<img class="rimg" src="${esc(imgSrc(a.image))}" alt="${esc(a.coverAlt || a.title)}">` + (a.coverCredit ? `<p class="credit wrap">${esc(a.coverCredit)}</p>` : "")
        : `<div class="rbanner" style="${phStyle(a.id)}" aria-hidden="true"></div>`;
      $("#rTags").textContent = a.tags.length ? "Tags: " + a.tags.join(", ") : "";
      $("#rBody").innerHTML = clean(a.content); // sanitized: only basic formatting and safe media survive
      $("#rRefs").innerHTML = refsHtml(a.refs);
      const ve = ytEmbed(a.video), pe = pdfEmbed(a.pdf);
      $("#rMedia").innerHTML = (ve ? `<div class="media"><iframe src="${esc(ve)}" title="Video" loading="lazy" allowfullscreen></iframe></div>` : "")
        + (a.pdf ? `<p><a class="abtn light" href="${esc(pdfView(a.pdf))}" target="_blank" rel="noopener noreferrer">Open PDF</a></p>` + (pe ? `<iframe class="pdf" src="${esc(pe)}" title="PDF" loading="lazy"></iframe>` : "") : "");
      enhanceReader(a);
      document.title = a.title + " | " + base;
      window.scrollTo(0, 0);
    } else if (sl.length) {
      renderSeries(sn, sl); document.title = sn + " | " + base; window.scrollTo(0, 0);
    } else {
      document.title = base;
      const t = h.length > 1 && document.getElementById(h.slice(1));
      if (t) { if (more.contains(t)) { setMore(true); setTimeout(() => t.scrollIntoView(), 560); } else t.scrollIntoView(); }
    }
  }
  // Reader extras: reading time, share bar, contents, author box, related articles
  function enhanceReader(a) {
    const words = $("#rBody").textContent.trim().split(/\s+/).filter(Boolean).length;
    const upd = a.updated && a.updated - a.date > 864e5 ? ` · Updated ${fmt(a.updated)}` : "";
    $("#rMeta").innerHTML = `By <strong>Hasanur Rahman</strong> · ${fmt(a.date)}${upd} · ${Math.max(1, Math.ceil(words / 200))} min read`;
    $("#rNote").innerHTML = `<strong>Editorial note.</strong> This is independent analysis based on open sources. The views are my own. <a href="#standards">Editorial standards</a>`;
    $("#rTake").innerHTML = takeawaysHtml(a.takeaways);
    const conf = a.confidence ? `<span class="chip conf" title="My own judgement of how well the available open-source evidence supports the conclusions">Analytical confidence: ${esc(a.confidence)}</span>` : "";
    $("#rChips").innerHTML = chipSpans(a, true) + (a.series ? `<a class="chip" href="#series-${encodeURIComponent(a.series)}">Series: ${esc(a.series)} &rarr;</a>` : "") + conf;
    const url = location.origin + location.pathname + "#article-" + encodeURIComponent(a.id), u = encodeURIComponent(url), t = encodeURIComponent(a.title);
    shareData = { url, title: a.title };
    const ext = 'target="_blank" rel="noopener noreferrer"';
    $("#rShare").innerHTML = `<span>Share</span>` + (navigator.share ? `<button type="button" data-s="native">Share&hellip;</button>` : "")
      + `<button type="button" data-s="copy">Copy link</button><a href="https://twitter.com/intent/tweet?url=${u}&text=${t}" ${ext}>X</a><a href="https://www.facebook.com/sharer/sharer.php?u=${u}" ${ext}>Facebook</a><a href="https://www.linkedin.com/sharing/share-offsite/?url=${u}" ${ext}>LinkedIn</a>`;
    const hs = [...$("#rBody").querySelectorAll("h2")];
    hs.forEach((h, i) => (h.id = "sec" + i));
    $("#rToc").innerHTML = hs.length >= 3 ? `<nav class="toc" aria-label="Contents"><p>In this article</p><ol>${hs.map((h, i) => `<li><button type="button" data-t="sec${i}">${esc(h.textContent)}</button></li>`).join("")}</ol></nav>` : "";
    const d = a.date, cite = `Rahman, H. (${d.getFullYear()}, ${d.toLocaleString("en-US", { month: "long" })} ${d.getDate()}). ${a.title}. Hasanur Rahman. ${url}`;
    $("#rCite").innerHTML = `<div class="cite"><p class="meta">Cite this article</p><p id="citeText">${esc(cite)}</p><button type="button" id="copyCite" class="abtn light sm">Copy citation</button></div>`;
    $("#rAuthor").innerHTML = `<div class="abox"><img class="${cfg.photo ? "" : "lg"}" src="${esc(cfg.photo ? imgSrc(cfg.photo) : "logo.png")}" alt="" width="64" height="64"><div><p class="an">Hasanur Rahman</p><p>${esc(cfg.bio)}</p><a href="#about">More about the author</a></div></div>`;
    const rel = [...list.filter((x) => x !== a && x.category === a.category), ...list.filter((x) => x !== a && x.category !== a.category)].slice(0, 3);
    $("#rRelated").innerHTML = rel.length ? `<h2 class="relh">Related articles</h2><div class="grid">${rel.map(cardHtml).join("")}</div>` : "";
  }
  $("#rShare").addEventListener("click", async (e) => {
    const b = e.target.closest("button"); if (!b || !shareData) return;
    if (b.dataset.s === "native") { try { await navigator.share(shareData); } catch (_) {} return; }
    try { await navigator.clipboard.writeText(shareData.url); b.textContent = "Copied"; setTimeout(() => (b.textContent = "Copy link"), 1800); }
    catch (_) { prompt("Copy this link", shareData.url); }
  });
  $("#rToc").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) document.getElementById(b.dataset.t).scrollIntoView({ behavior: "smooth" }); });
  async function copyText(text, btn, label) {
    try { await navigator.clipboard.writeText(text); btn.textContent = "Copied"; setTimeout(() => (btn.textContent = label), 1800); }
    catch (_) { prompt("Copy this text", text); }
  }
  $("#rCite").addEventListener("click", (e) => { if (e.target.id === "copyCite") copyText($("#citeText").textContent, e.target, "Copy citation"); });
  $("#copyBio").addEventListener("click", (e) => copyText($("#shortBio").textContent, e.target, "Copy bio"));

  // Modern touches: reading progress bar, header shadow on scroll, gentle reveal of sections
  const bar = $("#progress"), top = document.querySelector(".top");
  addEventListener("scroll", () => {
    top.classList.toggle("scrolled", scrollY > 8);
    if (!$("#reader").hidden) { const h = document.documentElement, m = h.scrollHeight - h.clientHeight; bar.style.width = (m > 0 ? Math.min(100, (h.scrollTop / m) * 100) : 0) + "%"; }
  }, { passive: true });
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.06 });
    document.querySelectorAll("main section").forEach((sec) => { if (sec.closest("#aboutMore")) return; sec.classList.add("reveal"); io.observe(sec); });
  }

  window.addEventListener("hashchange", route);

  // ----- Academic profile and newsletter (always visible; a placeholder shows until filled in) -----
  const PROF = [["cv", "Curriculum Vitae"], ["statement", "Research Statement"], ["orcid", "ORCID"], ["scholar", "Google Scholar"], ["researchgate", "ResearchGate"], ["academia", "Academia.edu"]];
  function renderProfile() {
    const items = PROF.filter(([k]) => /^https:\/\//i.test(cfg.profile[k] || ""));
    $("#profileBox").innerHTML = !items.length ? soon("Academic profile", "CV, research statement and academic profile links will be added soon.") : items.map(([k, label]) => `<a class="plink2" href="${esc(pdfView(cfg.profile[k]))}" target="_blank" rel="noopener noreferrer"><span>${label}</span><span aria-hidden="true">&rarr;</span></a>`).join("");
  }
  function renderSubscribe() {
    $("#subLink").hidden = !cfg.newsletter; $("#subSoon").hidden = !!cfg.newsletter;
    if (cfg.newsletter) $("#subLink").href = cfg.newsletter;
  }

  // ----- Site Settings from the admin panel (settings/site) -----
  async function loadSettings(db) {
    try {
      const s = await getDoc(doc(db, "settings", "site"));
      if (!s.exists()) return;
      const d = s.data();
      if ("email" in d) cfg.email = d.email;
      if (d.social) cfg.social = Object.fromEntries(Object.entries(d.social).map(([k, u]) => [NAMES[k] || k, u]));
      if (d.aboutLead) $("#aboutLead").textContent = d.aboutLead;
      if (d.aboutText) $("#aboutBody").innerHTML = d.aboutText.split(/\n\s*\n/).map((p) => `<p>${esc(p.trim())}</p>`).join("");
      if (d.photo) { cfg.photo = d.photo; const im = $("#founderImg"); im.src = imgSrc(d.photo); im.alt = "Hasanur Rahman"; im.removeAttribute("width"); im.removeAttribute("height"); im.classList.add("photo"); }
      if (d.bio) cfg.bio = d.bio;
      cfg.profile = d.profile || {};
      cfg.newsletter = /^https:\/\//i.test(d.newsletter || "") ? d.newsletter : "";
      renderContact(); renderProfile(); renderSubscribe();
    } catch (e) { console.error(e); }
  }

  // Every section and menu link is always visible; sections without content show a friendly placeholder.
  function setSections() { document.querySelectorAll("[data-sec]").forEach((el) => (el.hidden = false)); }

  // ----- Videos and Maps/Reports (published entries from Firestore; vids/res are filled in load()) -----
  function renderVideos() {
    $("#videoBox").innerHTML = vids.filter((x) => ytEmbed(x.url)).map((x) =>
      `<figure class="video"><div class="frame"><iframe src="${esc(ytEmbed(x.url))}" title="${esc(x.title || "Video")}" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div><figcaption>${esc(x.title || "")}</figcaption></figure>`).join("")
      || soon("Videos", "Video analysis is coming soon.");
  }
  function renderResources() {
    const link = (r, inner) => r.link ? `<a href="${esc(pdfView(r.link))}" target="_blank" rel="noopener noreferrer">${inner}</a>` : inner;
    $("#resBox").innerHTML = res.map((r) => {
      const type = r.type || "Item";
      return `<article class="card">${r.image ? link(r, `<img class="thumb" src="${esc(imgSrc(r.image))}" alt="${esc(r.title || type)}" loading="lazy">`) : `<div class="ph" aria-hidden="true">${esc(type)}</div>`}<p class="meta">${esc(type)}</p><h3>${link(r, esc(r.title || ""))}</h3><p>${esc(r.description || "")}</p></article>`;
    }).join("") || soon("Maps, books & reports", "Maps, book recommendations and reports will be added here soon.");
  }

  // ----- Glossary (A to Z) -----
  function renderGloss() {
    $("#glossBox").innerHTML = [...gloss].sort((a, b) => (a.title || "").localeCompare(b.title || "")).map((g) => `<div class="gl"><dt>${esc(g.title || "")}</dt><dd>${esc(g.description || "")}</dd></div>`).join("") || soon("Glossary", "Key terms will be defined here soon.");
  }

  // ----- Research & Publications (newest year first) -----
  function renderPubs() {
    const link = (p, text) => p.link ? `<a class="plink" href="${esc(pdfView(p.link))}" target="_blank" rel="noopener noreferrer">${text}</a>` : "";
    $("#pubBox").innerHTML = [...pubs].sort((a, b) => (+b.year || 0) - (+a.year || 0)).map((p) =>
      `<article class="pub"><div class="py">${esc(p.year || "")}</div><div><p class="meta">${esc(p.type || "Publication")}</p><h3>${esc(p.title || "")}</h3>`
      + (p.authors ? `<p class="pm">${esc(p.authors)}</p>` : "") + (p.venue ? `<p class="pm">${esc(p.venue)}</p>` : "")
      + (p.description ? `<p>${esc(p.description)}</p>` : "") + link(p, "View &rarr;") + `</div></article>`).join("")
      || soon("Research & publications", "Papers, reports and other publications will be listed here soon.");
  }

  // ----- Series page, series chips and "Start here" -----
  function renderSeries(name, sl) {
    $("#sTitle").textContent = name;
    $("#sCount").textContent = `${sl.length} ${sl.length === 1 ? "article" : "articles"} in this series, in reading order.`;
    $("#sList").innerHTML = sl.map((a, i) => `<li class="sitem"><span class="snum">${String(i + 1).padStart(2, "0")}</span><div><h3><a href="${href(a)}">${esc(a.title)}</a></h3><p class="meta">${fmt(a.date)}</p><p class="excerpt">${esc(a.summary)}</p></div></li>`).join("");
  }
  function renderSeriesRow() {
    const m = {};
    list.forEach((a) => { if (a.series) m[a.series] = (m[a.series] || 0) + 1; });
    const names = Object.keys(m).sort();
    $("#seriesRow").innerHTML = `<p>Series</p>` + (names.length ? names.map((n) => `<a href="#series-${encodeURIComponent(n)}">${esc(n)}<small>${m[n]}</small></a>`).join("") : `<span class="soonline">Article series will appear here.</span>`);
  }
  function renderStart() {
    const s = list.filter((a) => a.startHere).slice(0, 3);
    $("#startBox").innerHTML = s.map(cardHtml).join("") || soon("Start here", "Recommended starting points will appear here soon.");
  }

  // ----- Safety: keep only basic formatting tags in article HTML -----
  const OK = new Set(["P", "H2", "H3", "B", "STRONG", "I", "EM", "UL", "OL", "LI", "A", "BLOCKQUOTE", "BR", "IMG", "IFRAME", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD"]);
  const SAFE = /^https:\/\/(drive\.google\.com\/thumbnail\?id=[\w-]+(&sz=w\d+)?|drive\.google\.com\/file\/d\/[\w-]+\/preview|www\.youtube-nocookie\.com\/embed\/[\w-]{11})$/;
  function clean(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    (function walk(n) {
      [...n.childNodes].forEach((c) => {
        if (c.nodeType === 3) return;
        if (c.nodeType !== 1) { c.remove(); return; }
        if (c.tagName === "DIV") { const p = document.createElement("p"); p.append(...c.childNodes); c.replaceWith(p); c = p; }
        walk(c);
        if (!OK.has(c.tagName)) { c.replaceWith(...c.childNodes); return; }
        const src = c.getAttribute("src") || "", alt = (c.getAttribute("alt") || "").slice(0, 200);
        [...c.attributes].forEach((x) => { if (!(c.tagName === "A" && x.name === "href")) c.removeAttribute(x.name); });
        if (c.tagName === "IMG" || c.tagName === "IFRAME") {
          if (!(c.tagName === "IMG" ? /^https:\/\//i.test(src) : SAFE.test(src))) { c.remove(); return; }
          c.setAttribute("src", src); c.setAttribute("loading", "lazy");
          if (c.tagName === "IMG") c.setAttribute("alt", alt);
          else { c.setAttribute("allowfullscreen", ""); c.setAttribute("title", "Embedded media"); }
        }
        if (c.tagName === "A") {
          if (/^(https?:|mailto:|#)/i.test(c.getAttribute("href") || "")) { c.target = "_blank"; c.rel = "noopener noreferrer"; }
          else c.removeAttribute("href");
        }
      });
    })(doc.body);
    return doc.body.innerHTML;
  }

  // ----- Load published articles from Firestore -----
  async function load() {
    $("#list").innerHTML = skeleton();
    $("#featuredBox").innerHTML = "";
    // Show every section right away (placeholders); real content replaces them as it loads
    renderVideos(); renderResources(); renderGloss(); renderPubs(); renderProfile(); renderSubscribe(); renderSeriesRow(); renderStart(); renderFilters(); setSections();
    try {
      if (/^PASTE/.test(FIREBASE_CONFIG.apiKey)) throw new Error("not-configured");
      const db = getFirestore(initializeApp(FIREBASE_CONFIG));
      loadSettings(db);
      const snap = await getDocs(query(collection(db, "articles"), where("status", "==", "published")));
      list = snap.docs.map((d) => {
        const x = d.data(), t = x.publishedAt || x.createdAt;
        return { id: d.id, title: x.title || "Untitled", subtitle: x.subtitle || "", category: x.category || "General",
          tags: x.tags || [], image: x.coverImage || "", summary: x.excerpt || "", content: x.content || "", featured: !!x.featured, region: x.region || "", actors: x.actors || [], type: x.type || "", confidence: x.confidence || "", series: x.series || "", refs: x.references || [], takeaways: x.takeaways || [], coverCredit: x.coverCredit || "", coverAlt: x.coverAlt || "", startHere: !!x.startHere, updated: x.updatedAt && x.updatedAt.toDate ? x.updatedAt.toDate() : null, video: x.videoLink || "", pdf: x.pdfLink || "",
          date: t && t.toDate ? t.toDate() : new Date() };
      }).sort((a, b) => b.date - a.date);
      const t = (x) => (x && x.toMillis ? x.toMillis() : 0);
      const pub = (name) => getDocs(query(collection(db, name), where("status", "==", "published"))).then((s) => s.docs.map((d) => d.data()).sort((a, b) => t(b.createdAt) - t(a.createdAt)));
      pub("videos").then((r) => { vids = r.filter((x) => ytEmbed(x.url)); renderVideos(); setSections(); }).catch(console.error);
      pub("resources").then((r) => { res = r; renderResources(); setSections(); }).catch(console.error);
      pub("glossary").then((r) => { gloss = r; renderGloss(); setSections(); }).catch(console.error);
      pub("publications").then((r) => { pubs = r; renderPubs(); setSections(); }).catch(console.error);
      renderFilters(); renderList(); renderFeatured(); renderSeriesRow(); renderStart(); setSections();
    } catch (e) {
      console.error(e);
      list = []; renderFilters(); renderFeatured(); renderList(); setSections(); // visitors never see an error; sections show their placeholders
    }
    route();
  }

  // ----- About: "More about my work" toggle (smooth expand, keyboard and screen-reader friendly) -----
  const moreBtn = $("#moreBtn"), more = $("#aboutMore");
  function setMore(open) {
    more.classList.toggle("open", open);
    more.inert = !open;
    moreBtn.setAttribute("aria-expanded", open);
    $("#moreLabel").textContent = open ? "Show less" : "More about me and my work";
  }
  moreBtn.addEventListener("click", () => {
    const open = !more.classList.contains("open");
    setMore(open);
    if (!open) $("#about").scrollIntoView({ behavior: "smooth" });
  });
  // the quick links under the intro open the section and scroll to it
  document.addEventListener("click", (e) => {
    const l = e.target.closest("[data-more]"); if (!l) return;
    e.preventDefault();
    const wasOpen = more.classList.contains("open");
    setMore(true);
    setTimeout(() => document.getElementById(l.dataset.more).scrollIntoView({ behavior: "smooth" }), wasOpen ? 0 : 560);
  });
  // the second "Show less" button at the end of the expanded content
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-less]")) return;
    setMore(false); $("#about").scrollIntoView({ behavior: "smooth" });
  });

  $("#year").textContent = new Date().getFullYear();
  renderContact(); load();
})();
