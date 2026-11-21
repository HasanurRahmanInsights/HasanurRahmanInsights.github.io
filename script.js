/* script.js — renders articles, search, filters, contact links and article reader.
   You normally never need to edit this file. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  let list = []; // filled from Firestore (published articles only), newest first
  let vids = [], res = []; // published videos and maps/reports
  const state = { cat: "All", q: "" };

  // ----- Mobile menu -----
  const menuBtn = $("#menuBtn"), nav = $("#nav");
  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  nav.addEventListener("click", () => { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", false); });

  // ----- Article pieces -----
  const href = (a) => "#article-" + encodeURIComponent(a.id);
  const imageHtml = (a) => a.image
    ? `<img class="thumb" src="${esc(imgSrc(a.image))}" alt="${esc(a.title)}" loading="lazy">`
    : `<div class="ph" aria-hidden="true">${esc(a.category.charAt(0))}</div>`;
  const metaHtml = (a) => `<p class="meta">${esc(a.category)} &middot; ${fmt(a.date)}</p>`;

  function renderList() {
    const q = state.q.toLowerCase();
    const shown = list.filter((a) =>
      (state.cat === "All" || a.category === state.cat) &&
      (a.title + " " + a.summary + " " + a.category + " " + a.tags.join(" ")).toLowerCase().includes(q));
    $("#list").innerHTML = shown.length
      ? shown.map((a) => `<article class="card">${imageHtml(a)}${metaHtml(a)}<h3><a href="${href(a)}">${esc(a.title)}</a></h3><p>${esc(a.summary)}</p></article>`).join("")
      : (list.length ? `<p class="empty">No articles found. Try a different search or category.</p>` : `<p class="empty">No articles have been published yet. Please check back soon.</p>`);
  }

  function renderFilters() {
    const cats = ["All", ...new Set(list.map((a) => a.category))];
    const box = $("#filters");
    box.innerHTML = cats.map((c) => `<button type="button" aria-pressed="${c === state.cat}" data-c="${esc(c)}">${esc(c)}</button>`).join("");
    box.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      state.cat = b.dataset.c; renderFilters(); renderList();
    }));
  }
  $("#search").addEventListener("input", (e) => { state.q = e.target.value.trim(); renderList(); });

  function renderFeatured() {
    const a = list.find((x) => x.featured) || list[0];
    $("#featuredBox").innerHTML = a
      ? `<div class="feat">${imageHtml(a)}<div>${metaHtml(a)}<h3><a href="${href(a)}">${esc(a.title)}</a></h3><p>${esc(a.summary)}</p><p><a href="${href(a)}">Read the full analysis &rarr;</a></p></div></div>`
      : `<p class="empty">No featured analysis yet.</p>`;
  }

  // ----- Contact and social (only filled-in values are shown) -----
  // Simple line icons (Feather icon set, MIT licence)
  const svg = (p) => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
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
    if (SITE.email) items.push({ n: "Email", u: "mailto:" + SITE.email, i: ICON.mail });
    Object.entries(SITE.social).forEach(([n, u]) => { if (/^https?:\/\//i.test(u)) items.push({ n, u, i: iconFor(n) }); });
    $("#socialBox").innerHTML = items.length
      ? items.map((x) => `<li><a class="sbtn" href="${esc(x.u)}"${x.u.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : ""} aria-label="${esc(x.n)}" title="${esc(x.n)}">${x.i}</a></li>`).join("")
      : `<li class="todo">[PLACEHOLDER: Add your email and social links in articles.js, under SITE.]</li>`;
  }

  // ----- Article reader (address like  #article-sample-article ) -----
  const base = document.title;
  function route() {
    const h = decodeURIComponent(location.hash);
    const a = h.startsWith("#article-") && list.find((x) => "#article-" + x.id === h);
    $("#site").hidden = !!a;
    $("#reader").hidden = !a;
    if (a) {
      $("#rMeta").textContent = a.category + " · " + fmt(a.date);
      $("#rTitle").textContent = a.title;
      $("#rSub").textContent = a.subtitle;
      $("#rTags").textContent = a.tags.length ? "Tags: " + a.tags.join(", ") : "";
      $("#rImg").innerHTML = a.image ? imageHtml(a) : "";
      $("#rBody").innerHTML = clean(a.content); // sanitized: only basic formatting and safe media survive
      const ve = ytEmbed(a.video), pe = pdfEmbed(a.pdf);
      $("#rMedia").innerHTML = (ve ? `<div class="media"><iframe src="${esc(ve)}" title="Video" loading="lazy" allowfullscreen></iframe></div>` : "")
        + (a.pdf ? `<p><a class="abtn light" href="${esc(pdfView(a.pdf))}" target="_blank" rel="noopener noreferrer">Open PDF</a></p>` + (pe ? `<iframe class="pdf" src="${esc(pe)}" title="PDF" loading="lazy"></iframe>` : "") : "");
      document.title = a.title + " | " + base;
      window.scrollTo(0, 0);
    } else {
      document.title = base;
      const t = h.length > 1 && document.getElementById(h.slice(1));
      if (t) t.scrollIntoView();
    }
  }
  window.addEventListener("hashchange", route);

  // ----- Hero slider (slides come from SLIDES in articles.js) -----
  function initSlider() {
    const box = $("#slider"), n = SLIDES.length;
    if (!n) { box.hidden = true; return; }
    let i = 0, timer;
    box.innerHTML = `<div class="slide"></div><div class="ctrl"><button type="button" aria-label="Previous slide" data-d="-1">&lsaquo;</button><span class="dots"></span><button type="button" aria-label="Next slide" data-d="1">&rsaquo;</button></div>`;
    const slide = box.querySelector(".slide"), dots = box.querySelector(".dots");
    dots.innerHTML = SLIDES.map((s, k) => `<button type="button" aria-label="Slide ${k + 1}" data-k="${k}"></button>`).join("");
    function show(k) {
      i = (k + n) % n;
      const s = SLIDES[i];
      slide.innerHTML = `<p class="s-title">${esc(s.title)}</p><p>${esc(s.text)}</p>` + (s.link ? `<a href="${esc(s.link)}">${esc(s.linkText || "Read more")}</a>` : "");
      dots.querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-current", j === i));
    }
    const stop = () => clearInterval(timer);
    const start = () => { stop(); if (n > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) timer = setInterval(() => show(i + 1), 7000); };
    box.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      show(b.dataset.k !== undefined ? +b.dataset.k : i + +b.dataset.d); start();
    });
    ["mouseenter", "focusin"].forEach((ev) => box.addEventListener(ev, stop));
    ["mouseleave", "focusout"].forEach((ev) => box.addEventListener(ev, start));
    show(0); start();
  }

  // ----- Videos (YouTube, from VIDEOS in articles.js; entries without an id are skipped) -----
  function renderVideos() {
    const v = vids.filter((x) => ytEmbed(x.url || x.id));
    $("#videoBox").innerHTML = v.length
      ? v.map((x) => `<figure class="video"><div class="frame"><iframe src="${esc(ytEmbed(x.url || x.id))}" title="${esc(x.title)}" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div><figcaption>${esc(x.title)}</figcaption></figure>`).join("")
      : `<p class="empty">No videos have been published yet.</p>`;
  }

  // ----- Maps, books and reports (from RESOURCES in articles.js) -----
  function renderResources() {
    const link = (r, inner) => r.link ? `<a href="${esc(pdfView(r.link))}" target="_blank" rel="noopener noreferrer">${inner}</a>` : inner;
    $("#resBox").innerHTML = res.length
      ? res.map((r) => `<article class="card">${r.image ? link(r, `<img class="thumb" src="${esc(imgSrc(r.image))}" alt="${esc(r.title)}" loading="lazy">`) : `<div class="ph" aria-hidden="true">${esc(r.type.charAt(0))}</div>`}<p class="meta">${esc(r.type)}</p><h3>${link(r, esc(r.title))}</h3><p>${esc(r.description || "")}</p></article>`).join("")
      : `<p class="empty">No maps, books or reports have been published yet.</p>`;
  }

  // ----- Safety: keep only basic formatting tags in article HTML -----
  const OK = new Set(["P", "H2", "H3", "B", "STRONG", "I", "EM", "UL", "OL", "LI", "A", "BLOCKQUOTE", "BR", "IMG", "IFRAME"]);
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
        const src = c.getAttribute("src") || "";
        [...c.attributes].forEach((x) => { if (!(c.tagName === "A" && x.name === "href")) c.removeAttribute(x.name); });
        if (c.tagName === "IMG" || c.tagName === "IFRAME") {
          if (!(c.tagName === "IMG" ? /^https:\/\//i.test(src) : SAFE.test(src))) { c.remove(); return; }
          c.setAttribute("src", src); c.setAttribute("loading", "lazy");
          if (c.tagName === "IMG") c.setAttribute("alt", "");
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
    $("#list").innerHTML = `<p class="empty" role="status">Loading articles&hellip;</p>`;
    $("#featuredBox").innerHTML = `<p class="empty">Loading&hellip;</p>`;
    $("#videoBox").innerHTML = $("#resBox").innerHTML = `<p class="empty">Loading&hellip;</p>`;
    try {
      if (/^PASTE/.test(FIREBASE_CONFIG.apiKey)) throw new Error("not-configured");
      const db = getFirestore(initializeApp(FIREBASE_CONFIG));
      const snap = await getDocs(query(collection(db, "articles"), where("status", "==", "published")));
      list = snap.docs.map((d) => {
        const x = d.data(), t = x.publishedAt || x.createdAt;
        return { id: d.id, title: x.title || "Untitled", subtitle: x.subtitle || "", category: x.category || "General",
          tags: x.tags || [], image: x.coverImage || "", summary: x.excerpt || "", content: x.content || "", video: x.videoLink || "", pdf: x.pdfLink || "",
          date: t && t.toDate ? t.toDate() : new Date() };
      }).sort((a, b) => b.date - a.date);
      const t = (x) => (x && x.toMillis ? x.toMillis() : 0), failed = `<p class="err" role="alert">This section could not be loaded. Please refresh the page.</p>`;
      const pub = (name) => getDocs(query(collection(db, name), where("status", "==", "published"))).then((s) => s.docs.map((d) => d.data()).sort((a, b) => t(b.createdAt) - t(a.createdAt)));
      pub("videos").then((r) => { vids = r; renderVideos(); }).catch(() => { $("#videoBox").innerHTML = failed; });
      pub("resources").then((r) => { res = r; renderResources(); }).catch(() => { $("#resBox").innerHTML = failed; });
      renderFilters(); renderList(); renderFeatured();
    } catch (e) {
      console.error(e);
      $("#list").innerHTML = `<p class="err" role="alert">${e.message === "not-configured" ? "Articles are not connected yet: the Firebase setup is incomplete." : "Articles could not be loaded. Please check your connection and refresh the page."}</p>`;
      $("#featuredBox").innerHTML = "";
      if (e.message === "not-configured") $("#videoBox").innerHTML = $("#resBox").innerHTML = "";
    }
    route();
  }

  // ----- About: "See more" toggle -----
  const moreBtn = $("#moreBtn"), more = $("#aboutMore");
  moreBtn.addEventListener("click", () => {
    const open = more.hidden;
    more.hidden = !open;
    moreBtn.setAttribute("aria-expanded", open);
    moreBtn.textContent = open ? "See less" : "See more";
    if (!open) $("#about").scrollIntoView();
  });

  $("#year").textContent = new Date().getFullYear();
  renderContact(); initSlider(); load();
})();
