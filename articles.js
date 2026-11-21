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
  apiKey: "AIzaSyCO3qY6fN2b2rpoXBzhulOpe8yPcavS3NQ",
  authDomain: "hasanur-global-affairs.firebaseapp.com",
  projectId: "hasanur-global-affairs",
  appId: "1:61548054947:web:6329e19c9dac992519f216"
};

/* ---------- HERO SLIDER ----------
   Each slide: title, text, link (a page section like "#articles" or a full URL), linkText.
   Delete all slides to hide the slider. Two to four slides work best. */
const SLIDES = [
  { title: "Latest analysis", text: "Articles on geopolitics, international security and foreign policy.", link: "#articles", linkText: "Browse articles" },
  { title: "Research interests", text: "Great power competition, South Asian affairs and Bangladesh foreign policy.", link: "#interests", linkText: "See all topics" },
  { title: "Research & publications", text: "Academic work and ongoing research projects.", link: "#research", linkText: "View research" }
];

/* ---------- SHARED HELPERS (used by the website and the admin panel) — DO NOT EDIT ---------- */
const driveId = (u) => { const m = String(u || "").match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=|thumbnail\?id=)([\w-]{10,})/); return m ? m[1] : ""; };
const ytId = (u) => { u = String(u || "").trim(); const m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/); return m ? m[1] : (/^[\w-]{11}$/.test(u) ? u : ""); };
const imgSrc = (u) => (driveId(u) ? "https://drive.google.com/thumbnail?id=" + driveId(u) + "&sz=w1600" : String(u || ""));
const pdfView = (u) => (driveId(u) ? "https://drive.google.com/file/d/" + driveId(u) + "/view" : String(u || ""));
const pdfEmbed = (u) => (driveId(u) ? "https://drive.google.com/file/d/" + driveId(u) + "/preview" : "");
const ytEmbed = (u) => (ytId(u) ? "https://www.youtube-nocookie.com/embed/" + ytId(u) : "");
