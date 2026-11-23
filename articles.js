/* =====================================================================
   articles.js — SITE SETTINGS: contact, social links, slider (videos, maps and articles are managed in admin.html)
   Part 1: SITE (contact and social links)
   Part 2: FIREBASE settings (articles are managed in admin.html)
   ===================================================================== */

/* ---------- PART 1: CONTACT & SOCIAL LINKS ----------
   Leave a value empty ("") and it will NOT appear on the website.
   Put your real link between the quotation marks. */
const SITE = {
  email: "hasanurrahmaninsights@gmail.com",
  social: {
    "X (Twitter)": "https://x.com/Hasanur_Insight",
    "Facebook": "https://www.facebook.com/share/1CaD4rMYzi/",
    "LinkedIn": "https://www.linkedin.com/in/hasanur-insights/",
    "Instagram": "https://www.instagram.com/hasanur_insights/",
    "YouTube": "https://www.youtube.com/@Hasanur_Insights"
  }
};

/* ---------- PART 2: FIREBASE SETTINGS ----------
   Articles are now written and published in admin.html and stored in Firebase.
   Paste the two values marked PASTE from Firebase Console
   (Project settings > General > Your apps > Web app > Config).
   These values are NOT secret. Security comes from the Firestore rules. */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBYJdh2oKEKDXn5FYTZBcLWBDSdXZDM7_s",
  authDomain: "hasanur-insights.firebaseapp.com",
  projectId: "hasanur-insights",
  appId: "1:677458010357:web:40efb6c82290ea2752e5bc"
};

/* ---------- SHARED HELPERS (used by the website and the admin panel) — DO NOT EDIT ---------- */
const driveId = (u) => { const m = String(u || "").match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=|thumbnail\?id=)([\w-]{10,})/); return m ? m[1] : ""; };
const ytId = (u) => { u = String(u || "").trim(); const m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/); return m ? m[1] : (/^[\w-]{11}$/.test(u) ? u : ""); };
const imgSrc = (u) => (driveId(u) ? "https://drive.google.com/thumbnail?id=" + driveId(u) + "&sz=w1600" : String(u || ""));
const pdfView = (u) => (driveId(u) ? "https://drive.google.com/file/d/" + driveId(u) + "/view" : String(u || ""));
const pdfEmbed = (u) => (driveId(u) ? "https://drive.google.com/file/d/" + driveId(u) + "/preview" : "");
const ytEmbed = (u) => (ytId(u) ? "https://www.youtube-nocookie.com/embed/" + ytId(u) : "");
const refsHtml = (arr) => !arr || !arr.length ? "" : '<section class="refs"><h2>Sources</h2><ol>' + arr.map((t) => "<li>" + String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>') + "</li>").join("") + "</ol></section>";
const takeawaysHtml = (arr) => !arr || !arr.length ? "" : '<aside class="take"><p>Key takeaways</p><ul>' + arr.map((t) => "<li>" + String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])) + "</li>").join("") + "</ul></aside>";

/* ---------- TAXONOMY (used by the admin form and the website filters) ---------- */
const TOPICS = ["Politics & Governance", "Geopolitics & International Relations", "Military & Strategic Studies", "Intelligence & National Security", "Cyber & Technology Security", "Political Economy", "History & Political Analysis"];
const REGIONS = ["Bangladesh", "South Asia", "Middle East", "Europe", "Global"];
const TYPES = ["Explainer", "Analysis", "Brief", "Data note", "Review"];
const CONFIDENCE = ["High", "Moderate", "Low"];
const ACTORS = ["United States", "China", "Russia", "India", "Pakistan", "Myanmar", "Japan", "Saudi Arabia", "NATO", "European Union", "United Nations", "ASEAN", "BIMSTEC", "BRICS"];
