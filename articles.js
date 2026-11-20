/* =====================================================================
   articles.js — THE ONLY FILE YOU NEED TO EDIT TO MANAGE THE WEBSITE
   Part 1: SITE (contact and social links)
   Part 2: ARTICLES (add new articles at the TOP of the list)
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

/* ---------- PART 2: ARTICLES ----------
   Copy the template below, paste it at the TOP of the list, and change the text.
   Rules:
   - id        : unique, lowercase English letters, numbers and hyphens only (no spaces)
   - date      : YYYY-MM-DD   (newer dates appear first)
   - category  : any name; articles with the same name are grouped automatically
   - image     : "" (none) or a path such as "images/my-photo.jpg"
   - featured  : true to show in "Featured Analysis" (use true for ONE article only)
   - content   : write inside the backticks ` ` using simple HTML:
                 <p>paragraph</p>  <h2>heading</h2>  <blockquote>quote</blockquote>
                 Do not use the backtick character ` inside the text.
   - Every article block ends with  },  (comma) except you may omit it on the last one.

   ---------- ARTICLE TEMPLATE (copy from the next line) ----------
  {
    id: "your-article-id",
    title: "Your Article Title",
    date: "2026-01-01",
    category: "Geopolitics",
    summary: "One or two sentences describing the article.",
    image: "",
    featured: false,
    content: `
      <p>First paragraph.</p>
      <h2>A heading</h2>
      <p>Second paragraph.</p>
    `
  },
   ---------- (copy until the line above) ----------
*/

const ARTICLES = [
  {
    id: "sample-article",
    title: "Sample Article: Replace This With Your First Analysis",
    date: "2026-11-20",
    category: "Geopolitics",
    summary: "This is a placeholder article that shows how an article appears on the site. Delete or replace it.",
    image: "",
    featured: true,
    content: `
      <p>[PLACEHOLDER] This is sample text only. It is not an analysis and contains no claims. Replace it with your own writing.</p>
      <h2>Suggested structure for an analytical article</h2>
      <p>Research question or puzzle; theoretical lens (for example realism, liberalism or constructivism); evidence and historical context; counterarguments; conclusion and policy implications; sources.</p>
      <blockquote>Use blockquote for short, properly attributed quotations.</blockquote>
    `
  }
];
