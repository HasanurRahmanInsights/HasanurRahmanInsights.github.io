/* =====================================================================
   articles.js — SITE SETTINGS: contact, social links, slider, videos, maps
   Part 1: SITE (contact and social links)
   Part 2: FIREBASE settings (articles are managed in admin.html)
   ===================================================================== */

/* ---------- PART 1: CONTACT & SOCIAL LINKS ----------
   Leave a value empty ("") and it will NOT appear on the website.
   Put your real link between the quotation marks. */
const SITE = {
  email: "",        // example: "name@example.com"
  social: {
    "LinkedIn": "",     // example: "https://www.linkedin.com/in/your-name"
    "X (Twitter)": "",  // example: "https://x.com/your-name"
    "Facebook": "",     // example: "https://facebook.com/your-name"
    "ResearchGate": "", // example: "https://www.researchgate.net/profile/your-name"
    "Academia.edu": "", // example: "https://independent.academia.edu/yourname"
    "GitHub": "https://github.com/HasanurRahmanInsights"
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

/* ---------- YOUTUBE VIDEOS ----------
   id = the part after v= in a YouTube link.
   Example: https://www.youtube.com/watch?v=ABC123xyz  ->  id: "ABC123xyz"
   Copy the line below, remove the // and fill it in:
   { title: "Video title", id: "ABC123xyz" }, */
const VIDEOS = [
];

/* ---------- MAPS, BOOKS & REPORTS ----------
   type: "Map", "Book" or "Report" (any word works)
   image: "" or a path such as "images/map1.jpg"   link: "" or a full URL (PDF, publisher, etc.)
   Example (remove the // and fill it in):
   { type: "Map", title: "Map title", description: "One sentence.", image: "images/map1.jpg", link: "" }, */
const RESOURCES = [
];
