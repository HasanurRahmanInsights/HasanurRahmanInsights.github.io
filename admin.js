/* admin.js — login, article list, editor. Talks to Firebase Auth and Firestore.
   Real security is enforced by Firestore Security Rules, not by this file. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

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
  : e.code === "auth/network-request-failed" ? "No internet connection." : "Login failed. Please try again.";

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault(); say("");
  try { await signInWithEmailAndPassword(auth, $("#email").value.trim(), $("#password").value); $("#password").value = ""; }
  catch (err) { say(authMsg(err), true); }
});
$("#logout").addEventListener("click", () => signOut(auth));
onAuthStateChanged(auth, (u) => { $("#logout").hidden = !u; if (u) loadList(); else show("login"); });

// ---------- Dashboard ----------
async function loadList() {
  show("dash"); $("#lists").innerHTML = `<p class="empty">Loading&hellip;</p>`;
  try {
    items = (await getDocs(col)).docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => ms(b.updatedAt || b.createdAt) - ms(a.updatedAt || a.createdAt));
    drawList();
  } catch (e) {
    if (e.code === "permission-denied") { say("This account is not authorised as admin.", true); signOut(auth); }
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
const slugify = (t) => t.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const OK = new Set(["P", "H2", "H3", "B", "STRONG", "I", "EM", "UL", "OL", "LI", "A", "BLOCKQUOTE", "BR"]);
// Same safety filter as the public site: keep basic formatting only
function clean(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  (function walk(n) {
    [...n.childNodes].forEach((c) => {
      if (c.nodeType === 3) return;
      if (c.nodeType !== 1) { c.remove(); return; }
      if (c.tagName === "DIV") { const p = document.createElement("p"); p.append(...c.childNodes); c.replaceWith(p); c = p; }
      walk(c);
      if (!OK.has(c.tagName)) { c.replaceWith(...c.childNodes); return; }
      [...c.attributes].forEach((x) => { if (!(c.tagName === "A" && x.name === "href")) c.removeAttribute(x.name); });
      if (c.tagName === "A" && !/^(https?:|mailto:|#)/i.test(c.getAttribute("href") || "")) c.removeAttribute("href");
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
  $("#ed").innerHTML = a ? clean(a.content || "") : "<p><br></p>";
  $("#date").value = isoDay(a && a.publishedAt ? a.publishedAt.toDate() : new Date());
  $("#status").value = a ? a.status : "draft";
  show("editor"); window.scrollTo(0, 0);
}
$("#cancel").addEventListener("click", () => { say(""); show("dash"); });
$("#slug").addEventListener("input", () => (slugTouched = true));
$("#title").addEventListener("input", () => { if (!slugTouched) $("#slug").value = slugify($("#title").value); });

// Toolbar (mousedown is blocked so the text selection is not lost)
document.execCommand("defaultParagraphSeparator", false, "p");
$("#tb").addEventListener("mousedown", (e) => e.preventDefault());
$("#tb").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  const sel = getSelection(), r = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
  $("#ed").focus();
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
  const slug = $("#slug").value.trim(), status = $("#status").value, day = $("#date").value;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return say("The slug may contain only lowercase English letters, numbers and hyphens (example: indo-pacific-balance).", true);
  if (!$("#ed").textContent.trim()) return say("Please write the article content.", true);
  const data = {
    title: $("#title").value.trim(), slug, subtitle: $("#subtitle").value.trim(), category: $("#category").value.trim(),
    tags: $("#tags").value.split(",").map((t) => t.trim()).filter(Boolean), coverImage: $("#cover").value.trim(),
    excerpt: $("#excerpt").value.trim(), content: clean($("#ed").innerHTML), status,
    publishedAt: day ? Timestamp.fromDate(new Date(day + "T00:00:00")) : status === "published" ? Timestamp.now() : null,
    updatedAt: serverTimestamp()
  };
  try {
    if (editing) await updateDoc(doc(db, "articles", editing), data);
    else {
      if ((await getDoc(doc(db, "articles", slug))).exists()) return say("An article with this slug already exists. Please change the slug.", true);
      await setDoc(doc(db, "articles", slug), { ...data, createdAt: serverTimestamp() });
    }
    await loadList(); say(status === "published" ? "Saved and published." : "Saved as draft.");
  } catch (err) { say("Could not save. Check your connection and try again.", true); }
});
