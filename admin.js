/* admin.js — login, article list, editor. Talks to Firebase Auth and Firestore.
   Real security is enforced by Firestore Security Rules, not by this file. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $ = (s) => document.querySelector(s);
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const show = (v) => ["login", "dash", "editor"].forEach((x) => ($("#" + x).hidden = x !== v));
const ms = (t) => (t && t.toMillis ? t.toMillis() : 0);
const fmt = (t) => (t && t.toDate ? t.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "No date");
const isoDay = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

function say(text, bad) {
  const m = $("#msg");
  m.textContent = text; m.className = bad ? "err" : "ok"; m.hidden = !text;
  if (text) window.scrollTo({ top: 0, behavior: "smooth" });
}

if (/^PASTE/.test(FIREBASE_CONFIG.apiKey)) {
  show("login"); say("Firebase is not configured yet. Add your keys in articles.js (see README).", true);
  throw new Error("Firebase not configured");
}
const auth = getAuth(initializeApp(FIREBASE_CONFIG));
const db = getFirestore(auth.app);
const col = collection(db, "articles");
let items = [], editing = null, slugTouched = false;

// ---------- Login / logout ----------
const authMsg = (e) =>
  /invalid-credential|wrong-password|user-not-found|invalid-email/.test(e.code) ? "Incorrect email or password."
  : e.code === "auth/too-many-requests" ? "Too many attempts. Please wait a few minutes and try again."
  : e.code === "auth/network-request-failed" ? "No internet connection."
  : e.code === "auth/operation-not-allowed" ? "Email/Password sign-in is not enabled in Firebase (Authentication > Sign-in method)."
  : /api-key-not-valid|invalid-api-key/.test(e.code) ? "The Firebase API key in articles.js is not valid."
  : e.code === "auth/user-disabled" ? "This account has been disabled in Firebase."
  : "Login failed (" + (e.code || "unknown error") + "). Please try again.";

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault(); say("");
  try { await signInWithEmailAndPassword(auth, $("#email").value.trim(), $("#password").value); $("#password").value = ""; }
  catch (err) { say(authMsg(err), true); }
});
$("#logout").addEventListener("click", () => signOut(auth));
onAuthStateChanged(auth, (u) => { $("#logout").hidden = !u; if (u) tab("articles"); else show("login"); });

// ---------- Dashboard ----------
async function loadList() {
  show("dash"); $("#lists").innerHTML = `<p class="empty">Loading&hellip;</p>`;
  try {
    items = (await getDocs(col)).docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => ms(b.updatedAt || b.createdAt) - ms(a.updatedAt || a.createdAt));
    drawList();
  } catch (e) {
    if (e.code === "permission-denied") { say("Logged in, but this account is not authorised. The UID in the Firestore rules must match this account\u2019s User UID, and the rules must be published.", true); signOut(auth); }
    else say("Could not load articles. Please refresh and try again.", true);
  }
}

function drawList() {
  const group = (title, arr) => `<h2 class="gh">${title} (${arr.length})</h2>` + (arr.length
    ? `<ul class="rows">${arr.map((a) => `<li class="row"><div><strong>${esc(a.title)}</strong><span class="meta">${esc(a.category)} &middot; ${fmt(a.publishedAt || a.createdAt)}</span></div>
        <div class="acts"><button class="abtn sm" data-a="edit" data-id="${esc(a.id)}">Edit</button>
        <button class="abtn sm light" data-a="toggle" data-id="${esc(a.id)}">${a.status === "published" ? "Unpublish" : "Publish"}</button>
        <button class="abtn sm danger" data-a="del" data-id="${esc(a.id)}">Delete</button></div></li>`).join("")}</ul>`
    : `<p class="empty">None yet.</p>`);
  $("#lists").innerHTML = group("Published", items.filter((a) => a.status === "published")) + group("Drafts", items.filter((a) => a.status !== "published"));
}

$("#lists").addEventListener("click", async (e) => {
  const b = e.target.closest("button"); if (!b) return;
  const a = items.find((x) => x.id === b.dataset.id); if (!a) return;
  if (b.dataset.a === "edit") return openEditor(a);
  say("");
  try {
    if (b.dataset.a === "toggle") {
      const pub = a.status === "published";
      await updateDoc(doc(db, "articles", a.id), { status: pub ? "draft" : "published", updatedAt: serverTimestamp(), ...(!pub && !a.publishedAt ? { publishedAt: Timestamp.now() } : {}) });
      say(pub ? "Article unpublished. It is now a draft." : "Article published.");
    } else if (b.dataset.a === "del") {
      if (!confirm(`Delete "${a.title}" permanently? This cannot be undone.`)) return;
      await deleteDoc(doc(db, "articles", a.id)); say("Article deleted.");
    }
    loadList();
  } catch (err) { say("The action failed. Check your connection and try again.", true); }
});
$("#newBtn").addEventListener("click", () => openEditor(null));

// ---------- Editor ----------
const stamp = () => { const d = new Date(), p = (n) => String(n).padStart(2, "0"); return "article-" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()); };
const slugify = (t) => t.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
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


function openEditor(a) {
  say(""); editing = a ? a.id : null; slugTouched = !!a;
  $("#edTitle").textContent = a ? "Edit article" : "New article";
  $("#title").value = a ? a.title : ""; $("#subtitle").value = a ? a.subtitle || "" : "";
  $("#slug").value = a ? a.id : ""; $("#slug").readOnly = !!a; $("#slugHint").hidden = !!a;
  $("#category").value = a ? a.category : ""; $("#tags").value = a ? (a.tags || []).join(", ") : "";
  $("#cover").value = a ? a.coverImage || "" : ""; $("#excerpt").value = a ? a.excerpt || "" : "";
  $("#video").value = a ? a.videoLink || "" : ""; $("#pdf").value = a ? a.pdfLink || "" : "";
  $("#ed").innerHTML = a ? clean(a.content || "") : "<p><br></p>";
  $("#date").value = isoDay(a && a.publishedAt ? a.publishedAt.toDate() : new Date());
  $("#status").value = a ? a.status : "draft";
  $("#featured").checked = !!(a && a.featured); $("#refs").value = a ? (a.references || []).join("\n") : "";
  dirty = false; restoreDraft();
  show("editor"); window.scrollTo(0, 0);
}
$("#cancel").addEventListener("click", () => {
  if (dirty && !confirm("Discard your unsaved changes?")) return;
  clearDraft(); say(""); show("dash");
});
$("#slug").addEventListener("input", () => (slugTouched = true));
$("#title").addEventListener("input", () => { if (!slugTouched) { const t = $("#title").value.trim(); $("#slug").value = t ? slugify(t) || stamp() : ""; } });

// Toolbar (mousedown is blocked so the text selection is not lost)
document.execCommand("defaultParagraphSeparator", false, "p");
$("#tb").addEventListener("mousedown", (e) => e.preventDefault());
$("#tb").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  const sel = getSelection(), r = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
  $("#ed").focus();
  if (b.dataset.c.startsWith("media-")) {
    const k = b.dataset.c.slice(6);
    const u = prompt(k === "video" ? "Paste the YouTube video link" : "Paste the Google Drive link (shared as 'Anyone with the link')"); if (!u) return;
    const src = k === "video" ? ytEmbed(u) : k === "image" ? (driveId(u) ? imgSrc(u) : "") : pdfEmbed(u);
    if (!src) return say("That link is not valid. Use a " + (k === "video" ? "YouTube" : "Google Drive file") + " link.", true);
    if (r) { sel.removeAllRanges(); sel.addRange(r); }
    document.execCommand("insertHTML", false, k === "image" ? `<img src="${src}" alt=""><p><br></p>` : `<iframe src="${src}"></iframe><p><br></p>`);
    return;
  }
  if (b.dataset.c === "link") {
    let u = prompt("Link address (for example https://example.com)"); if (!u) return;
    if (!/^(https?:|mailto:)/i.test(u)) u = "https://" + u;
    if (r) { sel.removeAllRanges(); sel.addRange(r); }
    document.execCommand("createLink", false, u);
  } else document.execCommand(b.dataset.c, false, b.dataset.v || null);
});
// Paste as plain text (avoids messy formatting from Word / web pages)
$("#ed").addEventListener("paste", (e) => {
  e.preventDefault();
  const t = e.clipboardData.getData("text/plain").split(/\n+/).filter((x) => x.trim()).map((x) => `<p>${esc(x)}</p>`).join("");
  document.execCommand("insertHTML", false, t);
});

$("#form").addEventListener("submit", async (e) => {
  e.preventDefault(); say("");
  const status = $("#status").value, day = $("#date").value;
  let slug = $("#slug").value.trim();
  if (!slug && !editing) slug = $("#slug").value = stamp();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return say("The slug may contain only lowercase English letters, numbers and hyphens (example: indo-pacific-balance).", true);
  if (!$("#ed").textContent.trim()) return say("Please write the article content.", true);
  const cover = $("#cover").value.trim(), vid = $("#video").value.trim(), pdf = $("#pdf").value.trim();
  if (/drive\.google\.com/.test(cover) && !driveId(cover)) return say("The cover image link must be a Google Drive file link (not a folder).", true);
  if (vid && !ytId(vid)) return say("The video link must be a valid YouTube link.", true);
  if (pdf && !driveId(pdf)) return say("The PDF link must be a Google Drive file link.", true);
  const data = {
    title: $("#title").value.trim(), slug, subtitle: $("#subtitle").value.trim(), category: $("#category").value.trim(),
    tags: $("#tags").value.split(",").map((t) => t.trim()).filter(Boolean), coverImage: cover, videoLink: vid, pdfLink: pdf,
    excerpt: $("#excerpt").value.trim(), content: clean($("#ed").innerHTML), status,
    featured: $("#featured").checked, references: $("#refs").value.split("\n").map((t) => t.trim()).filter(Boolean).slice(0, 50),
    publishedAt: day ? Timestamp.fromDate(new Date(day + "T00:00:00")) : status === "published" ? Timestamp.now() : null,
    updatedAt: serverTimestamp()
  };
  try {
    if (editing) await updateDoc(doc(db, "articles", editing), data);
    else {
      if ((await getDoc(doc(db, "articles", slug))).exists()) return say("An article with this slug already exists. Please change the slug.", true);
      await setDoc(doc(db, "articles", slug), { ...data, createdAt: serverTimestamp() });
    }
    clearDraft(); await loadList(); say(status === "published" ? "Saved and published." : "Saved as draft.");
  } catch (err) { say("Could not save. Check your connection and try again.", true); }
});

// ---------- Videos and Maps & Reports (simple lists, each with a small form) ----------
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const KINDS = {
  videos: {
    fields: [
      { k: "title", l: "Video title", req: true },
      { k: "url", l: "YouTube video link", req: true, ph: "https://www.youtube.com/watch?v=..." }
    ],
    check: (d) => (ytId(d.url) ? "" : "The video link must be a valid YouTube link."),
    sub: () => "YouTube"
  },
  resources: {
    fields: [
      { k: "type", l: "Type", sel: ["Map", "Book", "Report"] },
      { k: "title", l: "Title", req: true },
      { k: "description", l: "Short description", area: true },
      { k: "image", l: "Image (Google Drive link)", ph: "Google Drive link of the image", hint: "Share the file as &ldquo;Anyone with the link&rdquo;." },
      { k: "link", l: "PDF or website link", ph: "Google Drive link of the PDF, or a website address" }
    ],
    check: (d) => /drive\.google\.com/.test(d.image) && !driveId(d.image) ? "The image link must be a Google Drive file link (not a folder)."
      : d.link && !/^https?:\/\//i.test(d.link) ? "The PDF or website link must start with https://" : "",
    sub: (d) => d.type || "Item"
  }
};
KINDS.publications = {
  fields: [
    { k: "type", l: "Type", sel: ["Research paper", "Journal article", "Conference paper", "Policy brief", "Essay", "Ongoing project", "Other"] },
    { k: "title", l: "Title", req: true },
    { k: "authors", l: "Authors (optional)", ph: "example: Hasanur Rahman" },
    { k: "venue", l: "Journal, outlet or institution (optional)" },
    { k: "year", l: "Year (optional)", ph: "example: 2026" },
    { k: "description", l: "Short abstract or description (optional)", area: true },
    { k: "link", l: "Link (Google Drive PDF or website, optional)", ph: "https://...", hint: "For a Drive PDF, share it as &ldquo;Anyone with the link&rdquo;." }
  ],
  check: (d) => d.year && !/^\d{4}$/.test(d.year) ? "The year must have 4 digits, for example 2026."
    : /drive\.google\.com/.test(d.link) && !driveId(d.link) ? "The link must be a Google Drive file link (not a folder)."
    : d.link && !/^https?:\/\//i.test(d.link) ? "The link must start with https://" : "",
  sub: (d) => (d.type || "Publication") + (d.year ? " \u00b7 " + d.year : "")
};
const rows2 = { videos: [], resources: [], publications: [] }, editing2 = {};

function tab(n) {
  ["articles", "videos", "resources", "publications", "settings"].forEach((x) => ($("#p" + cap(x)).hidden = x !== n));
  document.querySelectorAll("#tabs button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.tab === n));
  if (n === "articles") loadList(); else if (n === "settings") { show("dash"); loadSettings(); } else { show("dash"); loadKind(n); }
}

async function loadKind(k) {
  $("#l" + cap(k)).innerHTML = `<p class="empty">Loading&hellip;</p>`;
  try {
    rows2[k] = (await getDocs(collection(db, k))).docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
    drawKind(k);
  } catch (e) {
    $("#l" + cap(k)).innerHTML = "";
    say(e.code === "permission-denied" ? "Access denied. Publish the updated Firestore rules (see README) and try again." : "Could not load. Please refresh and try again.", true);
  }
}

function drawKind(k) {
  const arr = rows2[k], K = KINDS[k];
  $("#l" + cap(k)).innerHTML = arr.length
    ? `<ul class="rows">${arr.map((x) => `<li class="row"><div><strong>${esc(x.title)}</strong><span class="meta">${esc(K.sub(x))} &middot; ${x.status === "published" ? "Published" : "Draft"}</span></div>
        <div class="acts"><button class="abtn sm" data-a="edit" data-id="${esc(x.id)}">Edit</button>
        <button class="abtn sm light" data-a="toggle" data-id="${esc(x.id)}">${x.status === "published" ? "Unpublish" : "Publish"}</button>
        <button class="abtn sm danger" data-a="del" data-id="${esc(x.id)}">Delete</button></div></li>`).join("")}</ul>`
    : `<p class="empty">None yet.</p>`;
}

function openForm(k, it) {
  const f = $("#f" + cap(k)), id = (x) => `${k}_${x.k}`;
  editing2[k] = it ? it.id : null;
  f.innerHTML = KINDS[k].fields.map((x) => {
    const v = it ? it[x.k] || "" : "";
    return `<label for="${id(x)}">${x.l}</label>` + (x.sel
      ? `<select id="${id(x)}">${x.sel.map((o) => `<option${v === o ? " selected" : ""}>${o}</option>`).join("")}</select>`
      : x.area ? `<textarea id="${id(x)}" rows="3">${esc(v)}</textarea>`
      : `<input id="${id(x)}" type="text" placeholder="${esc(x.ph || "")}" value="${esc(v)}"${x.req ? " required" : ""}>`) + (x.hint ? `<p class="hint">${x.hint}</p>` : "");
  }).join("") + `<label for="${k}_status">Status</label>
    <select id="${k}_status"><option value="draft">Draft (not public)</option><option value="published">Published (public)</option></select>
    <div class="acts"><button class="abtn" type="submit">Save</button><button class="abtn light" type="button" data-cancel="1">Cancel</button></div>`;
  $(`#${k}_status`).value = it ? it.status : "published";
  f.hidden = false; f.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.querySelectorAll("#tabs button").forEach((b) => b.addEventListener("click", () => { say(""); tab(b.dataset.tab); }));

["videos", "resources", "publications"].forEach((k) => {
  const panel = $("#p" + cap(k)), form = $("#f" + cap(k));
  panel.addEventListener("click", async (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.add) { say(""); return openForm(k, null); }
    if (b.dataset.cancel) { form.hidden = true; return; }
    const it = rows2[k].find((x) => x.id === b.dataset.id); if (!it) return;
    if (b.dataset.a === "edit") return openForm(k, it);
    say("");
    try {
      if (b.dataset.a === "toggle") { await updateDoc(doc(db, k, it.id), { status: it.status === "published" ? "draft" : "published", updatedAt: serverTimestamp() }); say(it.status === "published" ? "Unpublished. It is now a draft." : "Published."); }
      else if (b.dataset.a === "del") { if (!confirm(`Delete "${it.title}" permanently? This cannot be undone.`)) return; await deleteDoc(doc(db, k, it.id)); say("Deleted."); }
      loadKind(k);
    } catch (err) { say("The action failed. Check your connection and try again.", true); }
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); say("");
    const d = {}; KINDS[k].fields.forEach((x) => (d[x.k] = $(`#${k}_${x.k}`).value.trim()));
    const err = KINDS[k].check(d); if (err) return say(err, true);
    d.status = $(`#${k}_status`).value; d.updatedAt = serverTimestamp();
    try {
      if (editing2[k]) await updateDoc(doc(db, k, editing2[k]), d);
      else await addDoc(collection(db, k), { ...d, createdAt: serverTimestamp() });
      form.hidden = true; await loadKind(k); say("Saved.");
    } catch (err2) { say("Could not save. Check your connection and try again.", true); }
  });
});

// ---------- Autosave in this browser + warning before leaving ----------
let dirty = false, saveTimer;
const FIELDS = ["title", "subtitle", "slug", "category", "tags", "cover", "excerpt", "video", "pdf", "refs", "date", "status"];
const draftKey = () => "draft:" + (editing || "new");
function clearDraft() { dirty = false; try { localStorage.removeItem(draftKey()); } catch (e) {} }
function restoreDraft() {
  try {
    const raw = localStorage.getItem(draftKey()); if (!raw) return;
    const o = JSON.parse(raw);
    if (!confirm("An unsaved draft from " + new Date(o.t).toLocaleString("en-GB") + " was found in this browser. Restore it?")) { localStorage.removeItem(draftKey()); return; }
    FIELDS.forEach((f) => { if (o[f] !== undefined) $("#" + f).value = o[f]; });
    $("#featured").checked = !!o.featured; $("#ed").innerHTML = clean(o.content || ""); slugTouched = true; dirty = true;
  } catch (e) {}
}
$("#form").addEventListener("input", () => {
  dirty = true; clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { const o = { t: Date.now(), featured: $("#featured").checked, content: $("#ed").innerHTML }; FIELDS.forEach((f) => (o[f] = $("#" + f).value)); localStorage.setItem(draftKey(), JSON.stringify(o)); } catch (e) {}
  }, 800);
});
window.addEventListener("beforeunload", (e) => { if (dirty && !$("#editor").hidden) { e.preventDefault(); e.returnValue = ""; } });

// ---------- Preview (exactly how the article will look on the website) ----------
$("#preview").addEventListener("click", () => {
  const day = $("#date").value || isoDay(new Date()), ve = ytEmbed($("#video").value), pdf = $("#pdf").value.trim();
  $("#pvMeta").textContent = ($("#category").value.trim() || "Category") + " \u00b7 " + new Date(day + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  $("#pvTitle").textContent = $("#title").value.trim() || "Untitled"; $("#pvSub").textContent = $("#subtitle").value.trim();
  const cover = $("#cover").value.trim();
  $("#pvCover").innerHTML = cover ? `<img class="thumb" src="${esc(imgSrc(cover))}" alt="">` : "";
  $("#pvBody").innerHTML = clean($("#ed").innerHTML);
  $("#pvMedia").innerHTML = (ve ? `<div class="media"><iframe src="${esc(ve)}" title="Video" allowfullscreen></iframe></div>` : "") + (pdf ? `<p><a class="abtn light" href="${esc(pdfView(pdf))}" target="_blank" rel="noopener noreferrer">Open PDF</a></p>` : "");
  $("#pvRefs").innerHTML = refsHtml($("#refs").value.split("\n").map((t) => t.trim()).filter(Boolean));
  $("#pv").hidden = false; $("#pv").scrollTop = 0; document.body.style.overflow = "hidden";
});
$("#pvClose").addEventListener("click", () => { $("#pv").hidden = true; document.body.style.overflow = ""; });

// ---------- Site Settings (Firestore: settings/site) ----------
const SOCIALS = [["x", "X (Twitter)"], ["facebook", "Facebook"], ["linkedin", "LinkedIn"], ["instagram", "Instagram"], ["youtube", "YouTube"]];

const PROFILE = [["cv", "CV (Google Drive PDF link)"], ["statement", "Research statement (Google Drive PDF link)"], ["orcid", "ORCID profile link"], ["scholar", "Google Scholar profile link"], ["researchgate", "ResearchGate profile link"], ["academia", "Academia.edu profile link"]];
$("#s_profile").innerHTML = PROFILE.map(([k, l]) => `<label for="p_${k}">${l}</label><input id="p_${k}" type="text" placeholder="https://...">`).join("");

async function loadSettings() {
  try {
    const s = await getDoc(doc(db, "settings", "site"));
    const dflt = { email: SITE.email, social: Object.fromEntries(SOCIALS.map(([k, n]) => [k, SITE.social[n] || ""])) };
    const d = s.exists() ? s.data() : dflt;
    $("#s_email").value = d.email || "";
    SOCIALS.forEach(([k]) => ($("#s_" + k).value = (d.social || {})[k] || ""));
    $("#s_lead").value = d.aboutLead || ""; $("#s_about").value = d.aboutText || "";
    $("#s_photo").value = d.photo || ""; $("#s_bio").value = d.bio || ""; $("#s_news").value = d.newsletter || "";
    PROFILE.forEach(([k]) => ($("#p_" + k).value = (d.profile || {})[k] || ""));
  } catch (e) { say(e.code === "permission-denied" ? "Access denied. Publish the updated Firestore rules (see README)." : "Could not load settings.", true); }
}
$("#fSettings").addEventListener("submit", async (e) => {
  e.preventDefault(); say("");
  const social = {};
  for (const [k, n] of SOCIALS) { const v = $("#s_" + k).value.trim(); if (v && !/^https:\/\//i.test(v)) return say(n + " link must start with https://", true); social[k] = v; }
  const profile = {};
  for (const [k, l] of PROFILE) {
    const v = $("#p_" + k).value.trim();
    if (v && !/^https:\/\//i.test(v)) return say(l.split(" (")[0] + " must start with https://", true);
    if (/drive\.google\.com/.test(v) && !driveId(v)) return say(l.split(" (")[0] + " must be a Google Drive file link (not a folder).", true);
    profile[k] = v;
  }
  const photo = $("#s_photo").value.trim(), news = $("#s_news").value.trim();
  if (photo && !driveId(photo) && !/^https:\/\//i.test(photo)) return say("The photo must be a Google Drive file link.", true);
  if (news && !/^https:\/\//i.test(news)) return say("The newsletter link must start with https://", true);
  try {
    await setDoc(doc(db, "settings", "site"), { email: $("#s_email").value.trim(), social, photo, bio: $("#s_bio").value.trim(), profile, newsletter: news, aboutLead: $("#s_lead").value.trim(), aboutText: $("#s_about").value.trim(), updatedAt: serverTimestamp() });
    say("Settings saved. The website shows them within a minute.");
  } catch (err) { say("Could not save settings. Check your connection and the Firestore rules.", true); }
});

// ---------- Backup: download everything as one file ----------
const conv = (x) => (x && typeof x.toDate === "function" ? x.toDate().toISOString() : Array.isArray(x) ? x.map(conv) : x && typeof x === "object" ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, conv(v)])) : x);
$("#backup").addEventListener("click", async () => {
  say("");
  try {
    const out = { exportedAt: new Date().toISOString() };
    for (const c of ["articles", "videos", "resources", "publications"]) out[c] = (await getDocs(collection(db, c))).docs.map((d) => ({ id: d.id, ...d.data() }));
    const s = await getDoc(doc(db, "settings", "site")); out.settings = s.exists() ? s.data() : null;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(conv(out), null, 2)], { type: "application/json" }));
    a.download = "backup-" + isoDay(new Date()) + ".json"; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    say("Backup downloaded. Keep the file safe (for example in Google Drive).");
  } catch (err) { say("Backup failed. Check your connection and try again.", true); }
});
