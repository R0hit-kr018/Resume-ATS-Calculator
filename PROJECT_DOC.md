# Resume ATS Calculator — Project Documentation & Interview Prep

> A personal reference doc covering what this project is, how it works, the
> technologies/concepts used, and a full set of cross-questions with answers
> to confidently defend the project in a viva / interview / presentation.

---

## 1. Project Overview

**Resume ATS Calculator** is a fully client-side web application that analyzes a
resume against a job description and produces an **ATS (Applicant Tracking System)
compatibility score (0–100)** with a letter grade, sub-scores, matched/missing
keywords, format checks, and actionable improvement suggestions.

- **Goal:** Help job seekers optimize their resume so it passes automated ATS
  filters used by most companies before a human ever sees it.
- **Privacy-first:** All processing happens in the browser. No resume or job
  description data is ever sent to a server.
- **No backend, no build step:** Pure static files that run by opening in a browser.

### What it does, step by step
1. User pastes (or uploads) their resume and a target job description.
2. The app extracts keywords, detects skills, checks formatting, and measures impact.
3. It computes a weighted overall score, assigns a grade, and lists what to fix.
4. User can export the report as JSON or a printable PDF.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 (semantic structure) |
| Styling | CSS3 — custom design system (no framework) |
| Logic | Vanilla JavaScript (ES6+), no frameworks |
| File parsing | pdf.js (PDF) and mammoth.js (DOCX) — lazy-loaded from CDN only when needed |
| Fonts | Inter, JetBrains Mono (Google Fonts) |

**Why no framework (React/Vue/etc.)?** To demonstrate core JavaScript, DOM, async,
and algorithm skills directly, and because a single-page static tool does not need
the overhead of a framework.

### File structure
```
RESUME/
├── index.html   — page structure, sections, results layout, modal
├── styles.css   — dark glass-morphism design system
└── app.js       — ATS analysis engine + all UI logic
```

---

## 3. Coding Level & Concepts Used

**Level:** Intermediate vanilla JavaScript (ES6+), ~900 lines, fully client-side.

### Architecture
- **IIFE module pattern** with `'use strict'` — private scope, no global pollution.
- **Separation of concerns:** data → engine (pure functions) → rendering → event wiring.

### Data structures (and why)
- **`Set`** for stopwords and action verbs → O(1) lookups instead of O(n) array scans.
- **`Map`** for the keyword frequency counter → fast key/value counting.
- **Object dictionary** for the categorized skills database.
- **Regex map** for detecting standard resume sections.

### The ATS algorithm (core logic)
- **Tokenization** (regex) + **stopword filtering** + **term-frequency ranking** (NLP-lite).
- **Bigram matching** so multi-word skills like "machine learning" survive.
- **Keyword classification:** matched / partial / missing, with **basic stemming**
  (stripping `-ing/-ed/-s`) so "developing" matches "develop".
- **Weighted scoring model** → composite 0–100 → letter grade.
- **Heuristic checks:** regex for email/phone/LinkedIn, action-verb detection at
  bullet starts, quantified-achievement detection (`%`, `$`, numbers), weak-phrase detection.

### Async & file handling
- **`async/await`** + **dynamic script injection** to **lazy-load** pdf.js / mammoth
  only when a file is actually uploaded (performance optimization).
- **`File` / `FileReader` / `arrayBuffer`** APIs; 500KB size validation.

### UI / DOM
- **`requestAnimationFrame`** + **cubic ease-out** for smooth 60fps score count-up
  (not `setInterval`).
- **CSS custom properties + conic-gradient** driven from JS for circular progress rings.
- **`Blob` + `URL.createObjectURL`** for JSON download; **`window.open` + print** for PDF.
- **`escapeHtml()`** before injecting user text → prevents **XSS injection**.
- Event-driven UI: live char counts, conditional button enabling, tabs, modal with
  Escape-key and overlay close.

---

## 4. Scoring Model (How the Score Is Calculated)

The overall score is a **weighted average** of four sub-scores, each normalized 0–100:

| Sub-score | Weight | What it measures |
|-----------|--------|------------------|
| Keyword Match | 30% | How many important job-description terms appear in the resume |
| Skills Match | 20% | How many required skills (from a curated dictionary) are present |
| Format & Structure | 25% | Sections, contact info, bullets, dates, length |
| Impact | 25% | Action verbs, quantified achievements, absence of weak phrasing |

**Overall = K×0.30 + S×0.20 + F×0.25 + I×0.25**, then mapped to a letter grade
(A+ … F) and a rating label (Excellent / Good / Fair / Poor).

---

## 5. Cross-Questions & Answers

### General / Conceptual

**Q: Is this real AI / machine learning?**
No, and I won't claim it is. It's a **rule-based / heuristic NLP engine** — term-frequency
keyword extraction, a curated skills dictionary, and regex pattern matching. Real ATS
systems also rely heavily on deterministic parsing rather than ML for keyword scanning,
so this mirrors how they actually work.

**Q: Why is there no backend?**
**Privacy and simplicity.** Resume data is sensitive, so keeping all processing in the
browser means nothing is ever uploaded. It also makes the app free to host as static files
and removes server costs and latency.

**Q: How is the overall score calculated?**
A **weighted average** of four sub-scores (Keyword 30%, Skills 20%, Format 25%, Impact 25%),
each normalized to 0–100, then mapped to a letter grade.

**Q: Why vanilla JavaScript instead of React/Angular/Vue?**
To demonstrate core DOM, async, and algorithm skills without a framework abstracting them
away — and a single-page static tool doesn't need framework overhead.

### Technical Deep-Dive

**Q: How does keyword extraction work?**
I tokenize the job description with regex, remove ~250 stopwords, count term frequency
with a `Map`, give a boost to known skills, and take the top ~30 terms as the "important"
keyword set. I also match known multi-word skills (bigrams) explicitly.

**Q: How do you match keywords if the wording differs slightly?**
Three states: **matched** (exact substring present), **partial** (shares a stem after
stripping `-ing/-ed/-s`, with a length check to avoid false positives), and **missing**.

**Q: Why use `Set` and `Map` instead of arrays?**
`Set` gives O(1) membership checks for stopwords/verbs (vs O(n) for arrays), and `Map`
is the natural structure for counting term frequencies.

**Q: How does file upload handle PDF and DOCX?**
`.txt` is read natively with the File API. For `.pdf` and `.docx`, I **lazy-load**
pdf.js and mammoth.js from a CDN only when a file is uploaded, then extract raw text from
the array buffer. `.doc` (legacy binary) can't be parsed in-browser, so it prompts the
user to paste instead. Files are capped at 500KB.

**Q: How is the score animation done smoothly?**
`requestAnimationFrame` with a cubic ease-out easing function, updating both the number
and a CSS conic-gradient ring each frame — runs at ~60fps, unlike a `setInterval` timer.

**Q: How do you generate the PDF report without a library?**
I open a new window, write a clean print-styled HTML report into it, and trigger the
browser's native print-to-PDF. JSON export uses a `Blob` and `URL.createObjectURL`.

### Security

**Q: How do you prevent security issues like XSS?**
All user-supplied text is passed through an `escapeHtml()` function before being inserted
into the DOM, so a resume containing `<script>` or HTML can't execute.

**Q: Is user data safe?**
Yes — nothing leaves the browser. There's no server, no analytics, no tracking. Data only
exists in the current page session and is gone on refresh.

### Limitations & Improvements (shows maturity — keep ready)

**Q: What are the limitations of this approach?**
Keyword extraction is **term-frequency based, not full TF-IDF**, so very common words can
rank slightly high — I mitigate this with an expanded stopword list. It also does **exact/stem
matching, not semantic matching**, so "JS" won't automatically equal "JavaScript" unless both
are in the dictionary.

**Q: How would you improve it?**
- Implement **TF-IDF** or a small **embedding model** for semantic keyword matching.
- Expand the skills taxonomy and add a synonym map.
- Add bundled jsPDF for richer PDF export.
- Add drag-and-drop upload and saved analysis history (localStorage).
- Potentially an optional backend for AI-powered rewrite suggestions.

**Q: How accurate is it compared to a real ATS?**
It approximates the **deterministic keyword + format checks** real ATS systems use, but every
ATS vendor differs, so it's a strong directional guide rather than an exact replica. I'm honest
that it's an optimization tool, not a guarantee.

---

## 6. One-Line Honest Pitch (use this framing)

> "It's a **heuristic keyword-and-format analyzer** that scores a resume against a job
> description entirely in the browser for privacy — built from scratch in vanilla JavaScript
> to demonstrate algorithms, async file handling, and DOM/UI engineering without a framework."

Leading with this accurate framing means every follow-up question has a clean answer —
overselling it as "AI" is the only thing that would break under questioning.
