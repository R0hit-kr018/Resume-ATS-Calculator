# 📄 Resume ATS Calculator

A web app that checks your resume against a job description and gives an **ATS compatibility score (0–100)** with keyword analysis and improvement tips. Runs fully in the browser — your data never leaves your device.

## Features
- ATS score with letter grade (A+ → F)
- Keyword match: found / missing
- Skills, format, and impact analysis
- Suggestions to improve your resume
- Upload `.txt` / `.pdf` / `.docx` or paste text
- Export report as JSON or PDF

## Project Structure
```
RESUME/
├── index.html   # Page layout & content
├── styles.css   # Styling (dark theme)
└── app.js       # Logic: analysis engine + UI
```

## How to Run
No installation needed — it's a static site.

1. Open the project folder.
2. Double-click `index.html` (or run `start index.html`).

For PDF/DOCX upload, use a local server instead:
```bash
python -m http.server 8000
```
Then open `http://localhost:8000`.

## How to Use
1. Paste your resume on the left.
2. Paste the job description on the right.
3. Click **Analyze Resume** to see your score and suggestions.

## Tech Stack
HTML, CSS, and Vanilla JavaScript — no frameworks.

---
Built by **Rohit Kumar** · © 2026
# Resume-ATS-Calculator
