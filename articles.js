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
const TOPICS = ["International Relations & Diplomacy", "Politics & Governance", "Defence & Military Affairs", "Strategic Studies", "War, Conflict & International Security", "Political Economy & Global Trade", "Technology & Cybersecurity", "Society & Social Affairs", "History & Strategic Affairs"]; // menu: Issues
const REGIONS = ["Bangladesh", "Americas", "South Asia", "Indo-Pacific", "Middle East", "Europe & Eurasia", "Global Affairs"]; // menu: Regions
/* Key countries inside each region. They appear as suggestions in the admin and as a Country filter on the website once a region is chosen.
   Bangladesh and Global Affairs have no country list. Add or remove names freely. */
const REGION_COUNTRIES = {
  "Americas": ["United States", "Canada", "Mexico", "Brazil", "Argentina", "Colombia", "Venezuela", "Chile", "Cuba"],
  "South Asia": ["India", "Pakistan", "Afghanistan", "Nepal", "Sri Lanka", "Bhutan", "Maldives"],
  "Indo-Pacific": ["China", "Japan", "South Korea", "North Korea", "Taiwan", "Australia", "New Zealand", "Indonesia", "Vietnam", "Thailand", "Malaysia", "Singapore", "Philippines", "Myanmar"],
  "Middle East": ["Saudi Arabia", "Iran", "Israel", "Turkey", "United Arab Emirates", "Qatar", "Egypt", "Iraq", "Syria"],
  "Europe & Eurasia": ["United Kingdom", "France", "Germany", "Italy", "Poland", "Ukraine", "Russia", "Kazakhstan", "Uzbekistan", "Azerbaijan", "Georgia", "Armenia"]
};
const TYPES = ["In-Depth Analysis", "Commentary", "Visual Analysis", "Explainer", "Brief", "Data note", "Review"]; // menu: Analysis
/* Older names that are still stored in existing articles are shown under the new names automatically. */
const LEGACY = {
  topic: { "Geopolitics & International Relations": "International Relations & Diplomacy", "Geopolitics": "International Relations & Diplomacy", "International Relations": "International Relations & Diplomacy", "Foreign Policy & Diplomacy": "International Relations & Diplomacy", "Military & Strategic Studies": "Defence & Military Affairs", "Security & Defence": "Defence & Military Affairs", "Intelligence & National Security": "War, Conflict & International Security", "War & Conflict": "War, Conflict & International Security", "Political Economy": "Political Economy & Global Trade", "Economy & Trade": "Political Economy & Global Trade", "Cyber & Technology Security": "Technology & Cybersecurity", "History & Political Analysis": "History & Strategic Affairs" },
  region: { "East Asia": "Indo-Pacific", "Southeast Asia": "Indo-Pacific", "North America": "Americas", "Latin America": "Americas", "Europe": "Europe & Eurasia", "Russia & Eurasia": "Europe & Eurasia", "Africa": "Global Affairs", "Global": "Global Affairs" },
  type: { "Analysis": "In-Depth Analysis" }
};
const norm = (kind, v) => (LEGACY[kind] && LEGACY[kind][v]) || v;
const CONFIDENCE = ["High", "Moderate", "Low"];
const ORGS = ["NATO", "European Union", "United Nations", "ASEAN", "BIMSTEC", "BRICS", "SAARC", "SCO", "Quad", "AUKUS", "G20", "OIC"];
const ACTOR_GROUPS = [...Object.entries(REGION_COUNTRIES), ["Africa", ["South Africa", "Nigeria", "Ethiopia", "Kenya", "Algeria"]], ["Organisations & blocs", ORGS]]; // suggestions in the admin
const ACTORS = ACTOR_GROUPS.flatMap(([, v]) => v);
const FILE_VERSION = "20261127"; // used by the self-check: all uploaded files must carry the same version
