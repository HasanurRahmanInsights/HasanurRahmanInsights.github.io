# Hasanur Rahman

Personal academic website. Plain HTML, CSS and JavaScript. No build process. Works directly on GitHub Pages.

**Live URL:** https://hasanurrahmaninsights.github.io

## ফাইল কাঠামো

| ফাইল | কাজ |
|---|---|
| `index.html` | মূল পেজ (About, Research Interests, Contact ইত্যাদির লেখা) |
| `style.css` | ডিজাইন (রং, ফন্ট, লেআউট) |
| `script.js` | আর্টিকেল দেখানো, search, filter (সাধারণত এডিট করবেন না) |
| `articles.js` | **আপনার প্রধান এডিটিং ফাইল:** আর্টিকেল, ইমেইল ও social link |
| `404.html` | ভুল ঠিকানার পেজ |
| `README.md` | এই নির্দেশিকা |
| `images/` (ঐচ্ছিক) | আর্টিকেলের ছবি রাখার ফোল্ডার, ছবি আপলোড করলে নিজে তৈরি হবে |

সব ফাইল repository-র **root**-এ থাকবে, কোনো ফোল্ডারের ভেতরে নয়।

---

## টিউটোরিয়াল ১: Android ফোন থেকে প্রথমবার আপলোড

1. ফোনের ব্রাউজারে (Chrome) https://github.com খুলে লগইন করুন।
2. Chrome-এর মেনু (⋮) থেকে **Desktop site** চালু করুন। এতে বোতামগুলো সহজে পাবেন।
3. https://github.com/HasanurRahmanInsights/HasanurRahmanInsights.github.io খুলুন। repository না থাকলে **New repository** চাপুন। নাম অবশ্যই `HasanurRahmanInsights.github.io`, visibility **Public**।
4. repository-তে **Add file → Upload files** চাপুন।
5. ফোনের ফাইল ম্যানেজার থেকে `index.html`, `style.css`, `script.js`, `articles.js`, `404.html`, `README.md` নির্বাচন করুন।
6. নিচে **Commit changes** চাপুন।
7. **Settings → Pages**-এ যান। **Source:** `Deploy from a branch`, **Branch:** `main`, folder `/ (root)` নির্বাচন করে **Save** করুন।
8. ১–৩ মিনিট পর https://hasanurrahmaninsights.github.io খুলুন।

> আগের ফাইল থাকলে একই নামের ফাইল আপলোড করলে সেটি প্রতিস্থাপিত হয়।

---

## ~~টিউটোরিয়াল ২: নতুন আর্টিকেল যোগ করা~~ (বাতিল)

> **এই পদ্ধতি আর ব্যবহার হয় না।** এখন আর্টিকেল `admin.html` দিয়ে লেখা হয় (নিচে টিউটোরিয়াল ৫)। `articles.js` এখন শুধু contact, social, slider, video ও Firebase কনফিগের জন্য।

পুরোনো নির্দেশ (শুধু ইতিহাসের জন্য):

শুধু `articles.js` এডিট করবেন।

1. repository-তে গিয়ে `articles.js` ফাইলটি চাপুন।
2. উপরের ডান দিকে **পেন্সিল আইকন (Edit this file)** চাপুন।
3. `const ARTICLES = [` লাইনটি খুঁজুন। এর ঠিক নিচে নতুন আর্টিকেল বসাবেন (সবচেয়ে উপরে)।
4. ফাইলের ওপরের মন্তব্যে থাকা **ARTICLE TEMPLATE** কপি করে সেখানে পেস্ট করুন।
5. টেক্সট পরিবর্তন করুন:
   - `id`: ইংরেজি ছোট হাতের অক্ষর ও হাইফেন, যেমন `indo-pacific-balance`। প্রতিটি আর্টিকেলে আলাদা হতে হবে।
   - `date`: `2026-11-20` ধরনের ফরম্যাট।
   - `category`: যেমন `Geopolitics`। একই নামের আর্টিকেল নিজে থেকে একই filter-এ আসবে।
   - `summary`: ১–২ বাক্যের সারসংক্ষেপ।
   - `image`: ছবি না থাকলে `""` রাখুন।
   - `content`: ব্যাকটিকের (`` ` ``) ভেতরে লিখুন। প্রতি অনুচ্ছেদ `<p>...</p>`-এর ভেতরে, শিরোনাম `<h2>...</h2>`-এর ভেতরে।
6. **নিশ্চিত করুন** আর্টিকেলের শেষে `},` (কমা সহ) আছে।
7. **Commit changes… → Commit changes** চাপুন।
8. ১–২ মিনিট পর সাইট রিফ্রেশ করুন। আর্টিকেল নিজে থেকে Latest Articles-এ আসবে।

### ছবি যোগ করা
1. **Add file → Upload files**-এ ছবি আপলোড করুন (ফাইলের নাম ছোট হাতের ইংরেজিতে, যেমন `map.jpg`, সাইজ ৫০০ KB-এর কম হলে ভালো)।
2. আপলোডের সময় ফাইলের নামের আগে `images/` লিখলে ফোল্ডার তৈরি হয়; না পারলে root-এ রেখে `image: "map.jpg"` লিখুন।
3. আর্টিকেলে `image: "images/map.jpg"` লিখুন।

### আর্টিকেল মুছতে বা বদলাতে
ওই আর্টিকেলের `{ ... },` ব্লকটি মুছুন বা সংশোধন করে Commit করুন।

### সাধারণ ভুল
- `},` কমা ভুলে গেলে পুরো আর্টিকেল তালিকা ভেঙে যায়। সাইটে কিছু না দেখালে প্রথমে কমা ও ব্যাকটিক (`` ` ``) মিলেছে কিনা দেখুন।
- `content`-এর ভেতরে ব্যাকটিক ব্যবহার করবেন না।
- সমস্যা হলে GitHub-এ **History** থেকে আগের সংস্করণে ফিরে যেতে পারবেন।

---

## টিউটোরিয়াল ৩: নিজের তথ্য যোগ করা

- **ইমেইল ও social link:** `articles.js`-এর `SITE` অংশে। ফাঁকা রাখলে ওই লিংক সাইটে দেখাবে না, তাই কোনো ভাঙা লিংক থাকবে না।
- **About ও Publications:** `index.html` খুলে `[PLACEHOLDER: ...]` লেখা অংশগুলো আপনার প্রকৃত তথ্য দিয়ে বদলান। যে তথ্য সত্য নয় তা লিখবেন না।

## নিরাপত্তা সম্পর্কে

এটি একটি static website। কোনো অ্যাডমিন প্যানেল, লগইন বা ডেটাবেস নেই। আর্টিকেল প্রকাশ মানে GitHub-এ ফাইল এডিট করা। শুধু আপনার GitHub অ্যাকাউন্টই সাইট পরিবর্তন করতে পারবে, তাই অ্যাকাউন্টে **two-factor authentication** চালু রাখুন।

---

## টিউটোরিয়াল ৪: Slider, Video, Maps ও Reports

সবই `articles.js`-এর নিচের অংশে। ফাইলের ভেতরে প্রতিটির উদাহরণ মন্তব্য আকারে দেওয়া আছে।

- **Hero slider:** `SLIDES` তালিকার লেখা বদলান। সব মুছলে slider লুকিয়ে যাবে।
- **YouTube video:** লিংক `youtube.com/watch?v=ABC123xyz` হলে `ABC123xyz` অংশটি `id`-তে বসান। `VIDEOS`-এ লাইনটি যোগ করুন (`//` মুছে)।
- **Map, বই, রিপোর্ট:** `RESOURCES`-এ `type`, `title`, `description`, `image`, `link` দিয়ে যোগ করুন। ছবি আপলোড করে `images/` পথ ব্যবহার করুন।
- কোনো তালিকা ফাঁকা থাকলে সেই সেকশনে `[PLACEHOLDER]` বার্তা দেখাবে।

---

## টিউটোরিয়াল ৫: Admin প্যানেল দিয়ে আর্টিকেল প্রকাশ

**ঠিকানা:** https://hasanurrahmaninsights.github.io/admin.html (সাইটের কোথাও এর লিংক নেই, ঠিকানাটি বুকমার্ক করে রাখুন)

1. ইমেইল ও পাসওয়ার্ড দিয়ে **Log in**।
2. **+ New article** চাপুন।
3. শিরোনাম লিখুন (slug নিজে তৈরি হবে; বাংলা শিরোনাম হলে slug ইংরেজিতে হাতে লিখুন)।
4. Category, Tags, Summary লিখুন। Cover image থাকলে তার পাথ বা URL দিন।
5. Content-এ লিখুন, আর toolbar দিয়ে Heading, **B**, *I*, List, Link, Quote দিন।
6. Status: **Draft** (গোপন) বা **Published** (সবার জন্য)। **Save** চাপুন।
7. ড্যাশবোর্ড থেকে যেকোনো সময় **Edit**, **Publish/Unpublish** বা **Delete** করুন।
8. কাজ শেষে **Log out**।

**নিরাপত্তা:** পাসওয়ার্ড কাউকে দেবেন না। অন্য কারও ফোনে লগইন করলে শেষে অবশ্যই Log out করুন। Firebase অ্যাকাউন্টে two-factor চালু রাখুন।

## ফাইল তালিকা (এখন ৯টি)

`index.html`, `style.css`, `script.js`, `articles.js`, `admin.html`, `admin.js`, `404.html`, `README.md` এবং `images/logo.png`।

---

## টিউটোরিয়াল ৬: ছবি, PDF ও ভিডিও (Google Drive ও YouTube)

- **ছবি ও PDF:** Google Drive-এ আপলোড করুন → ফাইলে চেপে **Share → General access → Anyone with the link (Viewer)** → **Copy link**। সেই লিংক admin প্যানেলের Cover image / PDF ঘরে বা toolbar-এর Image / PDF বোতামে পেস্ট করুন। **ফোল্ডারের লিংক চলবে না, ফাইলের লিংক লাগবে।**
- **ভিডিও:** YouTube ভিডিওর সাধারণ লিংক (youtube.com বা youtu.be) পেস্ট করুন।
- সাইটের Videos ও Maps/Reports অংশেও একই নিয়ম: `articles.js`-এর `VIDEOS` ও `RESOURCES`-এ লিংক বসান।
- Drive ফাইল "Anyone with the link" না হলে ছবি দেখা যাবে না।

---

## টিউটোরিয়াল ৭: Videos ও Maps & Reports (admin প্যানেল থেকে)

`admin.html`-এ লগইন করে উপরের ট্যাব বদলান: **Articles | Videos | Maps & Reports**।

- **Videos:** **+ Add video** → শিরোনাম ও YouTube লিংক → Status → **Save**।
- **Maps & Reports:** **+ Add item** → ধরন (Map/Book/Report), শিরোনাম, বিবরণ, ছবি (Drive লিংক), PDF বা ওয়েবসাইট লিংক → **Save**।
- প্রতিটি আইটেমের পাশে **Edit, Publish/Unpublish, Delete**।
- আগে `articles.js`-এ থাকা `VIDEOS` ও `RESOURCES` এখন নেই। সবকিছু admin থেকে।
- **জরুরি:** নতুন Firestore rules (`videos` ও `resources` সহ) Firebase Console-এ Publish না করলে এই ট্যাবগুলো কাজ করবে না।

- **Research & Publications:** admin প্যানেলের **Publications** ট্যাবে প্রকাশনা যোগ করুন (ধরন, শিরোনাম, লেখক, বছর, লিংক)। সাইটে বছর অনুযায়ী নতুনটি আগে দেখায়।

---

## টিউটোরিয়াল ৭: নতুন সুবিধাগুলো

- **স্বয়ংক্রিয় ড্রাফট-সংরক্ষণ:** লিখতে লিখতে লেখা এই ব্রাউজারে সংরক্ষিত হয়। ট্যাব বন্ধ হলে আবার খুললে "Restore it?" জিজ্ঞাসা করবে। সংরক্ষণ না করে বের হতে গেলেও সতর্ক করে।
- **Preview:** আর্টিকেল সম্পাদনার ফর্মে **Preview** চাপলে সাইটে যেমন দেখাবে তেমন দেখা যায়।
- **Featured:** ফর্মের টিকবক্সে বেছে নিন। একাধিক হলে সবচেয়ে নতুনটি দেখায়।
- **Sources / References:** প্রতি লাইনে একটি উৎস লিখুন। আর্টিকেলের শেষে "Sources" তালিকা হয়ে দেখায়, লিংক চালু থাকে।
- **বাংলা শিরোনাম:** slug নিজে `article-তারিখ-সময়` নামে তৈরি হয়।
- **Settings ট্যাব:** ইমেইল, social লিংক, hero slider (৩টি পর্যন্ত) ও About-এর শুরুর লেখা বদলান। কোড ফাইল ছুঁতে হয় না।
- **Download backup:** ড্যাশবোর্ডের নিচে বোতাম। সব তথ্য এক ফাইলে ফোনে নামে। নিয়মিত করুন।
- **জরুরি:** নতুন Firestore rules (`settings` সহ) Publish না করলে Settings ট্যাব কাজ করবে না।

---

## টিউটোরিয়াল ৮: Settings-এর নতুন অংশ ও স্বয়ংক্রিয় সেকশন

**নিয়ম:** যে সেকশনে কনটেন্ট নেই, সেটি সাইটে **দেখায় না** (মেনু-লিংকসহ)। শুধু admin প্যানেলে সব সময় দেখা যায়। কনটেন্ট যোগ করলেই সাইটে নিজে প্রকাশ পায়।

| সেকশন | কোথায় কনটেন্ট দেবেন |
|---|---|
| Articles | admin → Articles |
| Research & Publications | admin → Publications |
| Media (Videos, Maps, Books, Reports) | admin → Videos, Maps & Reports |
| Academic Profile (CV, Research Statement, ORCID, Scholar, ResearchGate, Academia) | admin → Settings |
| Stay Updated (newsletter) | admin → Settings → Newsletter |
| আপনার ছবি, লেখক-পরিচিতি | admin → Settings |

**আর্টিকেল পাতায় স্বয়ংক্রিয়:** পড়ার সময়, Share বোতাম, সূচিপত্র (৩টি বা বেশি heading থাকলে), লেখক-বাক্স, সংশ্লিষ্ট আর্টিকেল।

**ফাইল:** এখন `sitemap.xml` ও `robots.txt` ও আছে। এগুলো Google-কে সাইট চিনতে সাহায্য করে, এডিট করতে হবে না।

---

## টিউটোরিয়াল ৯: নতুন আর্টিকেল-সুবিধা

- **Key takeaways:** আর্টিকেল সম্পাদনার ফর্মে "Key takeaways" ঘরে প্রতি লাইনে একটি (প্রায় ৩টি) পয়েন্ট। আর্টিকেলের ওপরে বাক্স হয়ে দেখায়।
- **Cite this article:** নিজে তৈরি হয় (APA ধাঁচে), পাঠক এক চাপে কপি করে।
- **Updated তারিখ:** আর্টিকেল সংশোধন করে Save করলে প্রকাশের তারিখের পাশে "Updated" দেখায় (দুই দিনের বেশি পার্থক্য হলে)।
- **Reading progress bar:** আর্টিকেল পড়ার সময় ওপরে সরু দাগ।
- **Areas of Interest → Browse articles:** প্রতিটি বিষয়ের নিচের লিংক চাপলে সংশ্লিষ্ট আর্টিকেল খোঁজা হয়। আর্টিকেল না থাকলে লিংক দেখায় না।
- **Short bio:** About the Author-এ "Copy bio" বোতাম (সম্মেলন ও প্রকাশনার জন্য)।
- **`og.png`:** সোশ্যাল মিডিয়ায় সাইটের লিংক শেয়ার করলে এই ছবি আসে।

---

## টিউটোরিয়াল ১০: বিষয়-কাঠামো (Topic, Region, Type)

প্রতিটি আর্টিকেলে এখন তিনটি আলাদা তালিকা থেকে বাছাই:
- **Topic:** Politics & Governance, Geopolitics & IR, Military & Strategic Studies, Intelligence & National Security, Cyber & Technology Security, Political Economy, History & Political Analysis
- **Region:** Bangladesh, South Asia, Middle East, Europe, Global
- **Type:** Explainer, Analysis, Brief, Data note, Review
- ঐচ্ছিক: **Analytical confidence** (High/Moderate/Low) ও **Series**।

তালিকা বদলাতে `articles.js`-এর নিচের `TOPICS`, `REGIONS`, `TYPES` সম্পাদনা করুন।

**Bangladesh:** Region = "Bangladesh" দেওয়া আর্টিকেল থাকলে মেনু ও hero-তে "Bangladesh" লিংক আসে, চাপলে শুধু সেগুলো দেখায়।
**Glossary:** admin → Glossary ট্যাবে শব্দ ও সংজ্ঞা যোগ করুন। সাইটে A–Z তালিকা হয়ে দেখায়।
**Table:** আর্টিকেল editor-এর toolbar-এ **Table** (যেমন 3x4 = ৩ কলাম, ৪ সারি)।
**জরুরি:** Firestore rules-এ `glossary` যোগ না করলে Glossary ট্যাব কাজ করবে না।

- **Countries & actors:** আর্টিকেল সম্পাদনার ফর্মে চেকবক্সে United States, China, Russia, India ইত্যাদি বাছুন (তালিকা `articles.js`-এর `ACTORS`-এ)। তালিকায় না থাকলে "Other"-এ লিখুন। সাইটে Articles অংশে চিপ-সারি হয়ে দেখায় (সংখ্যাসহ), চাপলে ওই দেশ/সংস্থার আর্টিকেল ফিল্টার হয়।

---

## টিউটোরিয়াল ১১: নতুন আর্টিকেল-পাতা, Series, Start here, আইকন

- **ছবির বর্ণনা (alt text) ও credit:** আর্টিকেল ফর্মে Cover-এর নিচে দুটি ঘর। credit ছবির নিচে ডানে ছোট করে দেখায়। ছবির উৎস বা "Image generated with AI" এখানে লিখুন।
- **Series:** একই সিরিজের সব পর্বে **হুবহু একই নাম** লিখুন (লিখতে গেলে আগের নাম সাজেস্ট করে)। সাইটে Articles অংশে "Series" চিপ আসে, চাপলে পর্বগুলো ক্রমানুসারে দেখায়।
- **Start here:** আর্টিকেল ফর্মের টিকবক্স (সর্বোচ্চ ৩টি, নতুনটি আগে)। কোনোটি না বাছলে সেকশন দেখায় না।
- **আর্টিকেল-পাতা:** পুরো-প্রস্থের কভার (না থাকলে ব্র্যান্ডেড ব্যানার), শিরোনামের ওপরে Topic ও Type, শিরোনামের নিচে ভূমিকা-অনুচ্ছেদ (Subtitle থাকলে সেটি, নইলে Short summary), "By Hasanur Rahman", তারিখ, পড়ার সময়, শেষে সম্পাদকীয় নোট।
- **ফোনের হোম-স্ক্রিন আইকন:** Chrome মেনু (⋮) → "Add to Home screen"। নতুন ফাইল: `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `manifest.json`।
