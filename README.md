# Hasanur Rahman | Global Affairs

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

## টিউটোরিয়াল ২: নতুন আর্টিকেল যোগ করা

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
