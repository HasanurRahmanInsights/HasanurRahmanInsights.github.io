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
    ? `<img class="thumb" src="${esc(a.image)}" alt="${esc(a.title)}" loading="lazy">`
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
  function renderContact() {
    const wa = String(SITE.whatsapp || "").replace(/\D/g, "");
    const rows = [];
    if (SITE.email) rows.push(`<li><span>Email</span><a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></li>`);
    if (wa) rows.push(`<li><span>WhatsApp</span><a href="https://wa.me/${wa}" target="_blank" rel="noopener noreferrer">+${wa}</a></li>`);
    $("#contactBox").innerHTML = rows.length
      ? `<ul class="contact">${rows.join("")}</ul>`
      : `<p class="todo">[PLACEHOLDER: Add your email in articles.js, under SITE.]</p>`;
    const links = Object.entries(SITE.social).filter(([, url]) => url);
    $("#socialBox").innerHTML = links.length
      ? links.map(([n, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(n)}</a></li>`).join("")
      : `<li class="todo">[PLACEHOLDER: Add your social media links in articles.js, under SITE.]</li>`;
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
      $("#rBody").innerHTML = clean(a.content); // sanitized: only basic formatting tags survive
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
    const v = VIDEOS.filter((x) => x.id);
    $("#videoBox").innerHTML = v.length
      ? v.map((x) => `<figure class="video"><div class="frame"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(x.id)}" title="${esc(x.title)}" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div><figcaption>${esc(x.title)}</figcaption></figure>`).join("")
      : `<p class="todo">[PLACEHOLDER: No videos yet. Add a YouTube video id in articles.js, under VIDEOS.]</p>`;
  }

  // ----- Maps, books and reports (from RESOURCES in articles.js) -----
  function renderResources() {
    const link = (r, inner) => r.link ? `<a href="${esc(r.link)}" target="_blank" rel="noopener noreferrer">${inner}</a>` : inner;
    $("#resBox").innerHTML = RESOURCES.length
      ? RESOURCES.map((r) => `<article class="card">${r.image ? link(r, `<img class="thumb" src="${esc(r.image)}" alt="${esc(r.title)}" loading="lazy">`) : `<div class="ph" aria-hidden="true">${esc(r.type.charAt(0))}</div>`}<p class="meta">${esc(r.type)}</p><h3>${link(r, esc(r.title))}</h3><p>${esc(r.description || "")}</p></article>`).join("")
      : `<p class="todo">[PLACEHOLDER: No maps, books or reports yet. Add them in articles.js, under RESOURCES.]</p>`;
  }

  // ----- Safety: keep only basic formatting tags in article HTML -----
  const OK = new Set(["P", "H2", "H3", "B", "STRONG", "I", "EM", "UL", "OL", "LI", "A", "BLOCKQUOTE", "BR"]);
  function clean(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    (function walk(n) {
      [...n.childNodes].forEach((c) => {
        if (c.nodeType === 3) return;
        if (c.nodeType !== 1) { c.remove(); return; }
        walk(c);
        if (!OK.has(c.tagName)) { c.replaceWith(...c.childNodes); return; }
        [...c.attributes].forEach((x) => { if (!(c.tagName === "A" && x.name === "href")) c.removeAttribute(x.name); });
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
    try {
      if (/^PASTE/.test(FIREBASE_CONFIG.apiKey)) throw new Error("not-configured");
      const db = getFirestore(initializeApp(FIREBASE_CONFIG));
      const snap = await getDocs(query(collection(db, "articles"), where("status", "==", "published")));
      list = snap.docs.map((d) => {
        const x = d.data(), t = x.publishedAt || x.createdAt;
        return { id: d.id, title: x.title || "Untitled", subtitle: x.subtitle || "", category: x.category || "General",
          tags: x.tags || [], image: x.coverImage || "", summary: x.excerpt || "", content: x.content || "",
          date: t && t.toDate ? t.toDate() : new Date() };
      }).sort((a, b) => b.date - a.date);
      renderFilters(); renderList(); renderFeatured();
    } catch (e) {
      console.error(e);
      $("#list").innerHTML = `<p class="err" role="alert">${e.message === "not-configured" ? "Articles are not connected yet: the Firebase setup is incomplete." : "Articles could not be loaded. Please check your connection and refresh the page."}</p>`;
      $("#featuredBox").innerHTML = "";
    }
    route();
  }

  $("#year").textContent = new Date().getFullYear();
  renderContact(); initSlider(); renderVideos(); renderResources(); load();
})();
