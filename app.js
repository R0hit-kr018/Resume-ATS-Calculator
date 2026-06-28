/* ============================================================
   Resume ATS Calculator — app.js
   100% client-side. No data leaves the browser.
   ============================================================ */
(function () {
    'use strict';

    /* ----------------------------------------------------------
       Data: stopwords, skills dictionary, action verbs
       ---------------------------------------------------------- */
    const STOPWORDS = new Set(`a about above after again against all am an and any are aren't as at
      be because been before being below between both but by can cannot could couldn't did didn't do
      does doesn't doing don't down during each few for from further had hadn't has hasn't have haven't
      having he he'd he'll he's her here here's hers herself him himself his how how's i i'd i'll i'm
      i've if in into is isn't it it's its itself let's me more most mustn't my myself no nor not of off
      on once only or other ought our ours ourselves out over own same shan't she she'd she'll she's
      should shouldn't so some such than that that's the their theirs them themselves then there there's
      these they they'd they'll they're they've this those through to too under until up very was wasn't
      we we'd we'll we're we've were weren't what what's when when's where where's which while who who's
      whom why why's with won't would wouldn't you you'd you'll you're you've your yours yourself
      yourselves will shall may might must also using used use will across within without via per etc
      including include includes etc role roles team teams work working works experience years year new
      strong ability able join looking responsible help helping required preferred requirements benefits
      company we us our you your plus level good great excellent month months day days time times
      need needs needed want wants seeking seek hiring hire candidate candidates applicant ideal
      position opportunity opportunities knowledge understanding familiarity proficiency proficient`
        .split(/\s+/).filter(Boolean));

    // Categorized skill dictionary. Each entry: canonical label + alias regex fragments.
    const SKILLS = {
        'Tools & Tech': [
            'javascript','typescript','python','java','c++','c#','go','golang','rust','ruby','php','swift','kotlin','scala','r',
            'react','angular','vue','svelte','next.js','nuxt','node.js','express','django','flask','fastapi','spring','rails','laravel','.net',
            'html','css','sass','tailwind','redux','graphql','rest','grpc','websocket',
            'aws','azure','gcp','google cloud','lambda','ec2','s3','rds','dynamodb','cloudfront',
            'docker','kubernetes','terraform','ansible','jenkins','github actions','gitlab ci','circleci','ci/cd',
            'postgresql','postgres','mysql','mongodb','redis','elasticsearch','sql','nosql','kafka','rabbitmq',
            'git','linux','bash','nginx','microservices','serverless','webpack','vite','jest','cypress','playwright',
            'pandas','numpy','tensorflow','pytorch','scikit-learn','spark','hadoop','tableau','power bi','figma','jira'
        ],
        'Hard Skills': [
            'machine learning','deep learning','data analysis','data science','data engineering','etl','api design',
            'system design','distributed systems','algorithms','data structures','object-oriented','functional programming',
            'agile','scrum','kanban','tdd','unit testing','integration testing','automation','devops','security','oauth',
            'cloud architecture','database design','performance optimization','scalability','seo','ux','ui design',
            'project management','product management','financial analysis','accounting','marketing','sales','recruiting'
        ],
        'Soft Skills': [
            'communication','leadership','collaboration','problem-solving','problem solving','teamwork','mentoring',
            'time management','adaptability','critical thinking','creativity','analytical','organization',
            'attention to detail','interpersonal','presentation','negotiation','stakeholder management','decision-making'
        ],
        'Certifications': [
            'aws certified','azure certified','pmp','cpa','cfa','scrum master','csm','cissp','comptia','ccna',
            'google certified','six sigma','itil','prince2','cka','terraform associate'
        ]
    };
    // Flat lookup of every skill alias -> category
    const SKILL_INDEX = [];
    for (const [cat, list] of Object.entries(SKILLS)) {
        for (const s of list) SKILL_INDEX.push({ skill: s, cat });
    }

    const ACTION_VERBS = new Set(`led developed implemented designed built created managed launched delivered
      increased improved reduced achieved drove spearheaded architected engineered optimized automated streamlined
      established launched orchestrated coordinated directed executed founded generated grew initiated introduced
      negotiated organized oversaw pioneered produced reduced resolved restructured revamped scaled shipped
      transformed accelerated boosted championed cut deployed devised enabled expanded facilitated formulated
      headed maximized mentored modernized overhauled programmed redesigned refactored saved secured simplified
      standardized supervised trained unified upgraded`.split(/\s+/).filter(Boolean));

    const WEAK_PHRASES = [
        'responsible for', 'helped with', 'worked on', 'assisted with', 'duties included',
        'tasked with', 'in charge of', 'involved in', 'participated in'
    ];

    const SECTION_HEADERS = {
        summary: /\b(summary|objective|profile|about me)\b/i,
        experience: /\b(experience|employment|work history|professional background)\b/i,
        education: /\b(education|academic|qualifications)\b/i,
        skills: /\b(skills|competencies|technical skills|technologies|expertise)\b/i,
        projects: /\b(projects|portfolio)\b/i,
        certifications: /\b(certifications?|licenses?|credentials)\b/i
    };

    /* ----------------------------------------------------------
       Small DOM helpers
       ---------------------------------------------------------- */
    const $ = (id) => document.getElementById(id);
    const el = (tag, cls, html) => {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (html != null) n.innerHTML = html;
        return n;
    };
    const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function band(score) { return score >= 75 ? 'good' : score >= 50 ? 'mid' : 'bad'; }

    /* ----------------------------------------------------------
       Toasts
       ---------------------------------------------------------- */
    const ICONS = {
        success: '<polyline points="20 6 9 17 4 12"></polyline>',
        error: '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
        warning: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>'
    };
    function toast(message, type = 'success', ms = 3200) {
        const c = $('toastContainer');
        const t = el('div', 'toast ' + type);
        t.innerHTML = `<span class="toast-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ICONS[type] || ICONS.success}</svg></span><span>${escapeHtml(message)}</span>`;
        c.appendChild(t);
        setTimeout(() => {
            t.classList.add('toast-out');
            t.addEventListener('animationend', () => t.remove(), { once: true });
        }, ms);
    }

    /* ----------------------------------------------------------
       Text utilities
       ---------------------------------------------------------- */
    function tokenize(text) {
        return (text.toLowerCase().match(/[a-z][a-z0-9+#.\-]*[a-z0-9+#]|[a-z]/g) || []);
    }
    function wordCount(text) { return (text.trim().match(/\S+/g) || []).length; }
    function normalize(text) { return text.toLowerCase(); }

    // Build frequency map of meaningful terms (unigrams + key bigrams) from JD
    function extractKeywords(jd) {
        const tokens = tokenize(jd);
        const freq = new Map();
        const bump = (term, n = 1) => freq.set(term, (freq.get(term) || 0) + n);

        for (let i = 0; i < tokens.length; i++) {
            const w = tokens[i];
            if (w.length < 3 || STOPWORDS.has(w) || /^\d+$/.test(w)) continue;
            bump(w);
        }
        // Capture known multi-word skills explicitly so "machine learning" survives.
        const lower = normalize(jd);
        for (const { skill } of SKILL_INDEX) {
            if (skill.includes(' ') && lower.includes(skill)) bump(skill, 3);
        }

        // Rank: frequency, with a light boost for known skills.
        const ranked = [...freq.entries()].map(([term, count]) => {
            const isSkill = SKILL_INDEX.some(s => s.skill === term);
            return { term, count, weight: count + (isSkill ? 2 : 0), isSkill };
        }).sort((a, b) => b.weight - a.weight);

        // Take a sensible top slice as the "important" keyword set.
        return ranked.slice(0, 30);
    }

    function classifyKeyword(term, resumeLower, resumeTokens) {
        if (resumeLower.includes(term)) return 'matched';
        // partial: shares a stem with a resume token (handles plural / -ing / -ed)
        const stem = term.replace(/(ing|ed|es|s)$/,'');
        if (stem.length >= 4) {
            for (const rt of resumeTokens) {
                if (rt === stem || rt.startsWith(stem) || stem.startsWith(rt.replace(/(ing|ed|es|s)$/,''))) {
                    if (Math.abs(rt.length - term.length) <= 3) return 'partial';
                }
            }
        }
        return 'missing';
    }

    /* ----------------------------------------------------------
       ATS analysis engine
       ---------------------------------------------------------- */
    function analyze(resume, jd) {
        const resumeLower = normalize(resume);
        const resumeTokens = tokenize(resume);
        const resumeTokenSet = new Set(resumeTokens);
        const words = wordCount(resume);

        /* ---- Keyword match (30%) ---- */
        const keywords = extractKeywords(jd).map(k => ({
            ...k,
            status: classifyKeyword(k.term, resumeLower, resumeTokenSet),
            priority: k.weight >= 5 ? 'high' : 'normal'
        }));
        const matched = keywords.filter(k => k.status === 'matched');
        const partial = keywords.filter(k => k.status === 'partial');
        const missing = keywords.filter(k => k.status === 'missing');
        const kwTotal = keywords.length || 1;
        const keywordScore = Math.round(((matched.length + partial.length * 0.5) / kwTotal) * 100);

        /* ---- Skills match (20%) ---- */
        const jdLower = normalize(jd);
        const skillCats = {};
        let skillsRequired = 0, skillsMatched = 0;
        for (const { skill, cat } of SKILL_INDEX) {
            if (!jdLower.includes(skill)) continue;
            const inResume = resumeLower.includes(skill);
            (skillCats[cat] ||= []).push({ skill, inResume });
            skillsRequired++;
            if (inResume) skillsMatched++;
        }
        const skillsScore = skillsRequired ? Math.round((skillsMatched / skillsRequired) * 100) : 70;

        /* ---- Format & structure ---- */
        const checks = [];
        const sectionsFound = {};
        for (const [key, rx] of Object.entries(SECTION_HEADERS)) {
            sectionsFound[key] = rx.test(resume);
        }
        const coreSections = ['experience', 'education', 'skills'];
        const coreFound = coreSections.filter(s => sectionsFound[s]).length;
        checks.push({
            state: coreFound === 3 ? 'pass' : coreFound >= 2 ? 'warn' : 'fail',
            title: 'Core sections',
            note: `${coreFound}/3 found (Experience, Education, Skills). ` +
                coreSections.filter(s => !sectionsFound[s]).map(s => 'missing ' + s).join(', ') || 'All present.'
        });

        const hasEmail = /[\w.+-]+@[\w-]+\.[\w.-]+/.test(resume);
        const hasPhone = /(\+?\d[\d\s().-]{7,}\d)/.test(resume);
        const hasLinkedIn = /linkedin\.com\/|linkedin:/i.test(resume) || /\blinkedin\b/i.test(resume);
        const contactCount = [hasEmail, hasPhone, hasLinkedIn].filter(Boolean).length;
        checks.push({
            state: hasEmail && contactCount >= 2 ? 'pass' : hasEmail ? 'warn' : 'fail',
            title: 'Contact information',
            note: `Email: ${hasEmail ? '✓' : '✗'}, Phone: ${hasPhone ? '✓' : '✗'}, LinkedIn: ${hasLinkedIn ? '✓' : '✗'}.`
        });

        const bulletLines = (resume.match(/^[\s]*[•\-*▪◦‣·]\s+/gm) || []).length;
        checks.push({
            state: bulletLines >= 5 ? 'pass' : bulletLines >= 1 ? 'warn' : 'fail',
            title: 'Bullet points',
            note: bulletLines >= 1 ? `${bulletLines} bullet lines detected — good for scannability.`
                : 'No bullet points found. Use bullets for achievements, not paragraphs.'
        });

        const hasDates = /\b(19|20)\d{2}\b/.test(resume) && /(present|current|\b(19|20)\d{2}\b[\s\S]{0,12}(present|current|\b(19|20)\d{2}\b))/i.test(resume);
        checks.push({
            state: /\b(19|20)\d{2}\b/.test(resume) ? (hasDates ? 'pass' : 'warn') : 'fail',
            title: 'Dates & timeline',
            note: hasDates ? 'Employment dates detected.' : /\b(19|20)\d{2}\b/.test(resume)
                ? 'Some years found — ensure each role has a start/end range.' : 'No dates found. Add date ranges to roles.'
        });

        let lenState = 'pass', lenNote = `${words} words — within the optimal 400–800 range.`;
        if (words < 300) { lenState = 'fail'; lenNote = `${words} words — too short. Aim for 400–800.`; }
        else if (words < 400) { lenState = 'warn'; lenNote = `${words} words — a little thin. Aim for 400–800.`; }
        else if (words > 1200) { lenState = 'fail'; lenNote = `${words} words — too long. Trim toward 600–800.`; }
        else if (words > 800) { lenState = 'warn'; lenNote = `${words} words — slightly long. 600–800 is ideal.`; }
        checks.push({ state: lenState, title: 'Resume length', note: lenNote });

        const optionalSections = ['summary', 'projects', 'certifications'].filter(s => sectionsFound[s]);
        checks.push({
            state: optionalSections.length >= 1 ? 'pass' : 'warn',
            title: 'Bonus sections',
            note: optionalSections.length ? `Present: ${optionalSections.join(', ')}.`
                : 'Consider adding a Summary, Projects, or Certifications section.'
        });

        const formatPassWeight = checks.reduce((a, c) => a + (c.state === 'pass' ? 1 : c.state === 'warn' ? 0.5 : 0), 0);
        const formatScore = Math.round((formatPassWeight / checks.length) * 100);
        const formatIssues = checks.filter(c => c.state !== 'pass').length;

        /* ---- Impact ---- */
        const bulletStarts = (resume.match(/^[\s]*[•\-*▪◦‣·]\s*([A-Za-z]+)/gm) || [])
            .map(m => m.replace(/^[\s]*[•\-*▪◦‣·]\s*/, '').toLowerCase());
        const strongVerbBullets = bulletStarts.filter(w => ACTION_VERBS.has(w)).length;
        const verbRatio = bulletStarts.length ? strongVerbBullets / bulletStarts.length : 0;
        const quantHits = (resume.match(/(\$\s?\d|\d+\s?%|\b\d{2,}\b|\bthousand\b|\bmillion\b|\bbillion\b)/gi) || []).length;
        const weakHits = WEAK_PHRASES.filter(p => resumeLower.includes(p));
        let impactScore = Math.round(verbRatio * 50 + Math.min(quantHits, 8) / 8 * 40 + (weakHits.length ? 0 : 10));
        impactScore = Math.max(0, Math.min(100, impactScore));

        /* ---- Overall (weighted) ---- */
        const W = { keyword: 0.30, skills: 0.20, format: 0.25, impact: 0.25 };
        const overallScore = Math.round(
            keywordScore * W.keyword + skillsScore * W.skills + formatScore * W.format + impactScore * W.impact
        );
        const grade =
            overallScore >= 93 ? 'A+' : overallScore >= 85 ? 'A' : overallScore >= 78 ? 'B+' :
            overallScore >= 70 ? 'B' : overallScore >= 62 ? 'C+' : overallScore >= 55 ? 'C' :
            overallScore >= 45 ? 'D' : 'F';
        const rating =
            overallScore >= 85 ? 'Excellent — ATS ready' :
            overallScore >= 70 ? 'Good — minor tweaks' :
            overallScore >= 55 ? 'Fair — needs work' : 'Poor — significant gaps';

        /* ---- Suggestions ---- */
        const suggestions = [];
        const highMissing = missing.filter(k => k.priority === 'high').slice(0, 8);
        if (highMissing.length) suggestions.push({
            priority: 'critical', title: 'Add high-priority missing keywords',
            text: `These important terms from the job description are absent: ${highMissing.map(k => k.term).join(', ')}. Weave them naturally into your experience and skills.`
        });
        const missingSkillNames = Object.values(skillCats).flat().filter(s => !s.inResume).map(s => s.skill);
        if (missingSkillNames.length) suggestions.push({
            priority: 'critical', title: 'Cover required skills',
            text: `The role calls for skills not found in your resume: ${[...new Set(missingSkillNames)].slice(0, 10).join(', ')}.`
        });
        if (coreFound < 3) suggestions.push({
            priority: 'warning', title: 'Use standard section headers',
            text: `ATS parsers rely on headers like "Experience", "Education", and "Skills". Missing: ${coreSections.filter(s => !sectionsFound[s]).join(', ')}.`
        });
        if (!hasEmail || contactCount < 2) suggestions.push({
            priority: 'warning', title: 'Complete your contact block',
            text: 'Include at least an email plus phone or LinkedIn at the top so the ATS can index your contact details.'
        });
        if (quantHits < 3) suggestions.push({
            priority: 'warning', title: 'Quantify your achievements',
            text: 'Add numbers, percentages, or dollar amounts (e.g. "cut load time by 40%"). Metrics make impact concrete and ATS-friendly.'
        });
        if (verbRatio < 0.5 && bulletStarts.length) suggestions.push({
            priority: 'suggestion', title: 'Start bullets with strong action verbs',
            text: 'Lead with verbs like Led, Built, Improved, Designed. Several of your bullets begin weakly.'
        });
        if (weakHits.length) suggestions.push({
            priority: 'suggestion', title: 'Replace weak phrasing',
            text: `Avoid passive phrases like "${weakHits.join('", "')}". Rewrite as active accomplishments.`
        });
        if (words < 400 || words > 800) suggestions.push({
            priority: 'suggestion', title: 'Tune resume length',
            text: lenNote
        });
        if (!suggestions.length) suggestions.push({
            priority: 'suggestion', title: 'Looking strong',
            text: 'No major issues detected. Keep tailoring keywords to each specific role you apply to.'
        });

        /* ---- Strengths ---- */
        const strengths = [];
        if (matched.length) strengths.push(`${matched.length} job keywords matched`);
        if (skillsMatched) strengths.push(`${skillsMatched} required skills present`);
        if (quantHits >= 3) strengths.push('Quantified achievements');
        if (verbRatio >= 0.5) strengths.push('Strong action verbs');
        if (coreFound === 3) strengths.push('All core sections present');

        return {
            overallScore, grade, rating,
            scores: { keyword: keywordScore, skills: skillsScore, format: formatScore, impact: impactScore },
            keywords, matched, partial, missing, kwTotal,
            skillCats, skillsRequired, skillsMatched,
            checks, formatIssues,
            impact: { verbRatio, quantHits, weakHits, strongVerbBullets, bulletCount: bulletStarts.length },
            suggestions, strengths,
            meta: { words, generatedAt: new Date().toISOString() }
        };
    }

    /* ----------------------------------------------------------
       Rendering
       ---------------------------------------------------------- */
    let LAST_RESULT = null;

    function animateCircle(circleId, valueId, target, withSuffix) {
        const circle = $(circleId);
        const valueEl = $(valueId);
        const b = band(target);
        const col = b === 'good' ? 'var(--primary)' : b === 'mid' ? 'var(--warning)' : 'var(--danger)';
        circle.style.setProperty('--col', col);
        valueEl.classList.remove('s-good', 's-mid', 's-bad');
        valueEl.classList.add('s-' + b);

        const start = performance.now();
        const dur = 900;
        function step(now) {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            const val = Math.round(eased * target);
            valueEl.textContent = val;
            circle.style.setProperty('--pct', val);
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function setBar(barId, target) {
        const bar = $(barId);
        bar.classList.remove('fill-good', 'fill-mid', 'fill-bad');
        bar.classList.add('fill-' + band(target));
        requestAnimationFrame(() => { bar.style.width = target + '%'; });
    }

    function render(r) {
        LAST_RESULT = r;
        $('resultsSection').classList.remove('hidden');

        // Score cards
        animateCircle('overallScoreCircle', 'overallScore', r.overallScore, true);
        setBar('overallScoreBar', r.overallScore);
        const ratingEl = $('overallRating');
        ratingEl.textContent = `${r.grade} · ${r.rating}`;
        ratingEl.className = 'score-rating s-' + band(r.overallScore);

        animateCircle('keywordScoreCircle', 'keywordScore', r.scores.keyword);
        setBar('keywordScoreBar', r.scores.keyword);
        $('keywordMatchCount').textContent = `${r.matched.length} / ${r.kwTotal} matched`;

        animateCircle('skillsScoreCircle', 'skillsScore', r.scores.skills);
        setBar('skillsScoreBar', r.scores.skills);
        $('skillsMatchCount').textContent = `${r.skillsMatched} / ${r.skillsRequired} matched`;

        animateCircle('formatScoreCircle', 'formatScore', r.scores.format);
        setBar('formatScoreBar', r.scores.format);
        $('formatIssues').textContent = `${r.formatIssues} issue${r.formatIssues === 1 ? '' : 's'} found`;

        renderKeywords(r);
        renderSkills(r);
        renderFormat(r);
        renderSuggestions(r);

        $('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderKeywords(r) {
        const filter = $('keywordFilter').value;
        const cloud = $('keywordCloud');
        const list = $('keywordList');
        cloud.innerHTML = '';
        list.innerHTML = '';

        let kws = r.keywords;
        if (filter === 'matched') kws = kws.filter(k => k.status === 'matched');
        else if (filter === 'missing') kws = kws.filter(k => k.status === 'missing');
        else if (filter === 'high-priority') kws = kws.filter(k => k.priority === 'high');

        if (!kws.length) { list.appendChild(el('p', 'empty-note', 'No keywords match this filter.')); return; }

        for (const k of kws) {
            const cls = k.status === 'matched' ? 'kw-matched' : k.status === 'partial' ? 'kw-partial' : 'kw-missing';
            cloud.appendChild(el('span', 'kw ' + cls, `<span class="dot"></span>${escapeHtml(k.term)}`));
        }
        for (const k of kws) {
            const badge = k.status === 'matched' ? 'badge-matched' : k.status === 'partial' ? 'badge-partial' : 'badge-missing';
            const row = el('div', 'kw-row');
            row.innerHTML = `<span class="kw-name">${escapeHtml(k.term)}</span>
                <span class="kw-meta">
                    ${k.priority === 'high' ? '<span style="color:var(--warning)">★ high</span>' : ''}
                    <span>×${k.count}</span>
                    <span class="kw-badge ${badge}">${k.status}</span>
                </span>`;
            list.appendChild(row);
        }
    }

    function renderSkills(r) {
        const wrap = $('skillsCategories');
        wrap.innerHTML = '';
        const cats = Object.entries(r.skillCats);
        if (!cats.length) {
            wrap.appendChild(el('p', 'empty-note', 'No recognized skills detected in the job description. Add a more detailed JD for skills analysis.'));
            return;
        }
        for (const [cat, items] of cats) {
            const card = el('div', 'skill-category');
            const matchedN = items.filter(i => i.inResume).length;
            const tags = items.map(i => {
                const cls = i.inResume ? 'kw-matched' : 'kw-missing';
                return `<span class="kw ${cls}"><span class="dot"></span>${escapeHtml(i.skill)}</span>`;
            }).join('');
            card.innerHTML = `<h4>${cat}<span class="cat-count">${matchedN}/${items.length} in resume</span></h4>
                <div class="skill-tags">${tags}</div>`;
            wrap.appendChild(card);
        }
    }

    const CHECK_ICON = {
        pass: '<polyline points="20 6 9 17 4 12"></polyline>',
        warn: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
        fail: '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>'
    };
    function renderFormat(r) {
        const wrap = $('formatChecks');
        wrap.innerHTML = '';
        for (const c of r.checks) {
            const iconCls = c.state === 'pass' ? 'check-pass' : c.state === 'warn' ? 'check-warn' : 'check-fail';
            const row = el('div', 'format-check');
            row.innerHTML = `<span class="check-icon ${iconCls}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">${CHECK_ICON[c.state]}</svg>
                </span>
                <div class="check-body"><h4>${escapeHtml(c.title)}</h4><p>${escapeHtml(c.note)}</p></div>`;
            wrap.appendChild(row);
        }
    }

    function renderSuggestions(r) {
        const wrap = $('suggestionsList');
        wrap.innerHTML = '';
        const order = { critical: 0, warning: 1, suggestion: 2 };
        const sorted = [...r.suggestions].sort((a, b) => order[a.priority] - order[b.priority]);
        for (const s of sorted) {
            const item = el('div', 'suggestion-item prio-' + s.priority);
            item.innerHTML = `<span class="sugg-tag">${s.priority}</span>
                <div class="sugg-body"><h4>${escapeHtml(s.title)}</h4><p>${escapeHtml(s.text)}</p></div>`;
            wrap.appendChild(item);
        }
    }

    /* ----------------------------------------------------------
       File parsing (lazy-loaded CDN libs for pdf/docx)
       ---------------------------------------------------------- */
    const MAX_BYTES = 500 * 1024;
    let pdfjsReady = null, mammothReady = null;

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src; s.onload = resolve; s.onerror = () => reject(new Error('Failed to load ' + src));
            document.head.appendChild(s);
        });
    }
    function ensurePdfjs() {
        if (!pdfjsReady) {
            pdfjsReady = loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js')
                .then(() => { window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; });
        }
        return pdfjsReady;
    }
    function ensureMammoth() {
        if (!mammothReady) mammothReady = loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
        return mammothReady;
    }

    async function parsePdf(file) {
        await ensurePdfjs();
        const buf = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(it => it.str).join(' ') + '\n';
        }
        return text;
    }
    async function parseDocx(file) {
        await ensureMammoth();
        const buf = await file.arrayBuffer();
        const res = await window.mammoth.extractRawText({ arrayBuffer: buf });
        return res.value;
    }

    async function handleFile(file, textareaId, previewHost) {
        if (file.size > MAX_BYTES) { toast('File exceeds 500KB limit.', 'error'); return; }
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        const ta = $(textareaId);
        try {
            let text = '';
            if (ext === 'txt') text = await file.text();
            else if (ext === 'pdf') { toast('Extracting PDF text…', 'warning', 2000); text = await parsePdf(file); }
            else if (ext === 'docx') { toast('Extracting DOCX text…', 'warning', 2000); text = await parseDocx(file); }
            else if (ext === 'doc') { toast('Legacy .doc cannot be parsed in-browser. Please paste the text or save as .docx/.pdf.', 'error', 5000); return; }
            else { toast('Unsupported file type.', 'error'); return; }

            text = text.replace(/\u00a0/g, ' ').replace(/[ 	]{2,}/g, ' ').trim();
            if (!text) { toast('No text could be extracted. Try pasting instead.', 'error'); return; }
            ta.value = text;
            ta.dispatchEvent(new Event('input', { bubbles: true }));
            showPreview(previewHost, file, ta);
            toast(`Loaded ${file.name}`, 'success');
        } catch (e) {
            console.error(e);
            toast('Could not read that file. Try pasting the text instead.', 'error', 4500);
        }
    }

    function showPreview(host, file, ta) {
        const existing = host.querySelector('.file-preview');
        if (existing) existing.remove();
        const kb = (file.size / 1024).toFixed(1);
        const p = el('div', 'file-preview');
        p.innerHTML = `<span class="fp-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg></span>
            <span class="fp-name">${escapeHtml(file.name)}</span><span class="fp-size">${kb} KB</span>
            <button class="fp-remove" title="Remove" aria-label="Remove file"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>`;
        p.querySelector('.fp-remove').addEventListener('click', () => {
            p.remove(); ta.value = ''; ta.dispatchEvent(new Event('input', { bubbles: true }));
        });
        host.appendChild(p);
    }

    /* ----------------------------------------------------------
       Export
       ---------------------------------------------------------- */
    function exportJson() {
        if (!LAST_RESULT) return;
        const blob = new Blob([JSON.stringify(LAST_RESULT, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = el('a');
        a.href = url; a.download = 'ats-report.json';
        a.click();
        URL.revokeObjectURL(url);
        toast('JSON report downloaded.', 'success');
    }

    function exportPdf() {
        if (!LAST_RESULT) { toast('Run an analysis first.', 'warning'); return; }
        const r = LAST_RESULT;
        const win = window.open('', '_blank');
        if (!win) { toast('Allow pop-ups to export the report.', 'error'); return; }
        const rows = (title, items) => `<h3>${title}</h3><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
        win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>ATS Report</title>
            <style>
              body{font-family:Arial,Helvetica,sans-serif;color:#111;max-width:760px;margin:32px auto;padding:0 20px;line-height:1.5}
              h1{margin:0 0 4px}h2{border-bottom:2px solid #10B981;padding-bottom:4px;margin-top:28px}
              .big{font-size:54px;font-weight:bold;color:#10B981}.muted{color:#666}
              .grid{display:flex;gap:24px;flex-wrap:wrap;margin:12px 0}
              .grid div{font-size:15px}ul{margin:6px 0 0}li{margin:3px 0}
              .tag{display:inline-block;padding:2px 8px;border-radius:10px;background:#eee;margin:2px;font-size:12px}
            </style></head><body>
            <h1>Resume ATS Report</h1>
            <p class="muted">Generated ${new Date().toLocaleString()}</p>
            <div class="grid">
              <div><div class="big">${r.overallScore}%</div>Overall · Grade ${r.grade}<br><span class="muted">${r.rating}</span></div>
              <div>Keyword Match: <b>${r.scores.keyword}%</b><br>Skills: <b>${r.scores.skills}%</b><br>Format: <b>${r.scores.format}%</b><br>Impact: <b>${r.scores.impact}%</b></div>
            </div>
            <h2>Strengths</h2><ul>${(r.strengths.length ? r.strengths : ['—']).map(s => `<li>${s}</li>`).join('')}</ul>
            <h2>Recommendations</h2>
            ${r.suggestions.map(s => `<p><b>[${s.priority.toUpperCase()}] ${s.title}</b><br>${s.text}</p>`).join('')}
            <h2>Keyword Coverage</h2>
            <p><b>Matched:</b> ${r.matched.map(k => `<span class="tag">${k.term}</span>`).join('') || '—'}</p>
            <p><b>Missing:</b> ${r.missing.map(k => `<span class="tag">${k.term}</span>`).join('') || '—'}</p>
            <h2>Format Checks</h2>
            ${rows('', r.checks.map(c => `<b>${c.state.toUpperCase()}</b> — ${c.title}: ${c.note}`))}
            <script>window.onload=function(){setTimeout(function(){window.print();},300);}<\/script>
            </body></html>`);
        win.document.close();
        toast('Opening printable report…', 'success');
    }

    /* ----------------------------------------------------------
       Wiring
       ---------------------------------------------------------- */
    function updateCharCount(taId, countId) {
        const ta = $(taId);
        $(countId).textContent = `${ta.value.length.toLocaleString()} characters`;
    }
    function refreshAnalyzeState() {
        const hasResume = $('resumeText').value.trim().length > 0;
        const hasJd = $('jdText').value.trim().length > 0;
        const btn = $('analyzeBtn');
        const hint = document.querySelector('.analyze-hint');
        btn.disabled = !(hasResume && hasJd);
        if (hasResume && hasJd) hint.textContent = 'Ready to analyze.';
        else if (!hasResume && !hasJd) hint.textContent = 'Fill in both fields above to enable analysis';
        else hint.textContent = hasResume ? 'Add a job description to continue.' : 'Add your resume to continue.';
    }

    function runAnalysis() {
        const btn = $('analyzeBtn');
        const text = btn.querySelector('.btn-text');
        const loading = btn.querySelector('.btn-loading');
        text.classList.add('hidden'); loading.classList.remove('hidden'); btn.disabled = true;

        // Brief delay to surface the scanning animation.
        setTimeout(() => {
            try {
                const r = analyze($('resumeText').value, $('jdText').value);
                render(r);
                toast(`Analysis complete — ${r.overallScore}% (${r.grade})`, 'success');
            } catch (e) {
                console.error(e);
                toast('Something went wrong during analysis.', 'error');
            } finally {
                text.classList.remove('hidden'); loading.classList.add('hidden');
                refreshAnalyzeState();
            }
        }, 700);
    }

    function resetAnalysis() {
        $('resultsSection').classList.add('hidden');
        LAST_RESULT = null;
        document.querySelector('.calculator-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function switchTab(name) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
    }

    function openModal() { $('privacyModal').classList.remove('hidden'); }
    function closeModal() { $('privacyModal').classList.add('hidden'); }

    function init() {
        // Char counts + analyze state
        $('resumeText').addEventListener('input', () => { updateCharCount('resumeText', 'resumeCharCount'); refreshAnalyzeState(); });
        $('jdText').addEventListener('input', () => { updateCharCount('jdText', 'jdCharCount'); refreshAnalyzeState(); });

        // Clear buttons
        $('clearResume').addEventListener('click', () => {
            $('resumeText').value = ''; $('resumeInputArea').querySelector('.file-preview')?.remove();
            updateCharCount('resumeText', 'resumeCharCount'); refreshAnalyzeState();
        });
        $('clearJD').addEventListener('click', () => {
            $('jdText').value = ''; $('jdInputArea').querySelector('.file-preview')?.remove();
            updateCharCount('jdText', 'jdCharCount'); refreshAnalyzeState();
        });

        // File uploads
        $('resumeFile').addEventListener('change', (e) => {
            if (e.target.files[0]) handleFile(e.target.files[0], 'resumeText', $('resumeInputArea'));
            e.target.value = '';
        });
        $('jdFile').addEventListener('change', (e) => {
            if (e.target.files[0]) handleFile(e.target.files[0], 'jdText', $('jdInputArea'));
            e.target.value = '';
        });

        // Analyze / reset
        $('analyzeBtn').addEventListener('click', runAnalysis);
        $('newAnalysisBtn').addEventListener('click', resetAnalysis);

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));

        // Keyword filter
        $('keywordFilter').addEventListener('change', () => { if (LAST_RESULT) renderKeywords(LAST_RESULT); });

        // Exports
        $('exportJsonBtn').addEventListener('click', exportJson);
        $('exportPdfBtn').addEventListener('click', exportPdf);

        // Privacy modal
        $('privacyLink').addEventListener('click', (e) => { e.preventDefault(); openModal(); });
        $('closePrivacyModal').addEventListener('click', closeModal);
        $('privacyModal').querySelector('.modal-overlay').addEventListener('click', closeModal);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

        // Initial state
        updateCharCount('resumeText', 'resumeCharCount');
        updateCharCount('jdText', 'jdCharCount');
        refreshAnalyzeState();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
