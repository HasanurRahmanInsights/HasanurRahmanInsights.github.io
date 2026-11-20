/* script.js — renders articles, search, filters, contact links and article reader.
   You normally never need to edit this file. */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  // Newest first
  const list = [...ARTICLES].sort((a, b) => b.date.localeCompare(a.date));
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
      (a.title + " " + a.summary + " " + a.category).toLowerCase().includes(q));
    $("#list").innerHTML = shown.length
      ? shown.map((a) => `<article class="card">${imageHtml(a)}${metaHtml(a)}<h3><a href="${href(a)}">${esc(a.title)}</a></h3><p>${esc(a.summary)}</p></article>`).join("")
      : `<p class="empty">No articles found. Try a different search or category.</p>`;
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
    $("#contactBox").innerHTML = SITE.email
      ? `<p><a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></p>`
      : `<p class="todo">[PLACEHOLDER: Add your email address in articles.js, under SITE.]</p>`;
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
      $("#rImg").innerHTML = a.image ? imageHtml(a) : "";
      $("#rBody").innerHTML = a.content; // trusted: written by the site owner
      document.title = a.title + " | " + base;
      window.scrollTo(0, 0);
    } else {
      document.title = base;
      const t = h.length > 1 && document.getElementById(h.slice(1));
      if (t) t.scrollIntoView();
    }
  }
  window.addEventListener("hashchange", route);

  $("#year").textContent = new Date().getFullYear();
  renderFilters(); renderList(); renderFeatured(); renderContact(); route();
})();
