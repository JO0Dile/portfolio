/* ============================================================
   SCRIPT.JS — work list, modal, nav, reveal, status bar
   ============================================================ */

// ============================================================
// 1. PROJECT DATA
// ============================================================
const projectData = {
    "01": {
        num: "01",
        title: "AAUP Academic Planner",
        status: "Active Development",
        year: "2025",
        brief: "Academic planning platform — prerequisites, progress, RTL.",
        desc: "An academic planning platform built for university students — covers course sequencing, prerequisites, progress tracking, and long-term planning. Designed to handle multi-university, multi-major logic with full Arabic RTL support.",
        features: [
            "Prerequisite and course-dependency logic",
            "Progress tracking across majors and universities",
            "Full Arabic RTL support",
            "AI-assisted planning",
            "PostgreSQL backend with REST APIs"
        ],
        tech: ["JavaScript", "PostgreSQL", "REST APIs", "RTL", "AI"],
        note: "Private — In Development"
    },
    "02": {
        num: "02",
        title: "Construction & Trades",
        status: "Active Development",
        year: "2025",
        brief: "Offline-first work management for real-world crews.",
        desc: "A construction and work-management application designed around real-world site workflows. Built offline-first so crews can operate reliably without an internet connection.",
        features: [
            "Offline-first Android architecture",
            "Multi-language support — Hebrew, Arabic, English",
            "Dynamic RTL / LTR layout switching",
            "Trade catalogs and inventory",
            "Attendance tracking and wage calculation"
        ],
        tech: ["Android", "Offline-First", "Multi-lang", "RTL/LTR", "Payroll"],
        note: "Private — In Development"
    },
    "03": {
        num: "03",
        title: "RL-Scientist",
        status: "Research Experiment",
        year: "2025",
        brief: "A local LLM that proposes and evaluates its own RL experiments.",
        desc: "A local reinforcement-learning research experiment. A local LLM proposes experiment changes, training runs are executed, results are evaluated, and research memory is persisted across runs.",
        features: [
            "Local LLM integration via Ollama",
            "Automated experiment proposal and evaluation",
            "Reinforcement-learning training loops",
            "Persistent research memory",
            "FastAPI orchestration layer"
        ],
        tech: ["Python", "Ollama", "Reinforcement Learning", "FastAPI", "Local LLMs"],
        note: "Private — In Development"
    },
    "04": {
        num: "04",
        title: "Listing Lab",
        status: "Prototype",
        year: "2025",
        brief: "Local-first AI for generating product listings.",
        desc: "A local-first AI-assisted listing creation tool. Helps sellers generate product titles, descriptions, tags, and price suggestions using local models rather than cloud APIs.",
        features: [
            "Local inference via Ollama and LM Studio",
            "Automated title and description generation",
            "Tag and keyword suggestions",
            "Price suggestions from market data",
            "Streamlined seller workflow"
        ],
        tech: ["Ollama", "LM Studio", "Local AI", "Product Data"],
        note: "Private — In Development"
    },
    "05": {
        num: "05",
        title: "AIMaze",
        status: "Simulation",
        year: "2025",
        brief: "Reinforcement learning agents navigating mazes in Unity.",
        desc: "A Unity reinforcement-learning experiment. An AI agent learns to navigate mazes, avoid traps, and interact with buttons inside a scalable grid-based environment.",
        features: [
            "Unity ML-Agents integration",
            "Reinforcement learning for maze navigation",
            "Trap avoidance and hazard detection",
            "Button interaction and puzzle solving",
            "Scalable grid-based level design"
        ],
        tech: ["Unity", "Reinforcement Learning", "Simulation", "C#", "ML-Agents"],
        note: "Private — In Development"
    }
};

// ============================================================
// 2. RENDER WORK LIST
// ============================================================
(function renderWork() {
    const list = document.getElementById('work-list');
    if (!list) return;

    const order = ["01", "02", "03", "04", "05"];
    order.forEach((id, i) => {
        const d = projectData[id];
        const row = document.createElement('button');
        row.className = 'work-row';
        row.setAttribute('data-project', id);
        row.setAttribute('data-reveal-delay', String(i * 70));
        row.innerHTML = `
            <span class="work-num">${d.num}</span>
            <div class="work-body">
                <h3 class="work-name">${d.title}</h3>
                <p class="work-brief">${d.brief}</p>
            </div>
            <div class="work-meta">
                <span class="work-year">${d.year}</span>
                <span class="work-arrow">→</span>
            </div>
        `;
        list.appendChild(row);
    });
})();

// ============================================================
// 3. NAV — background on scroll
// ============================================================
(function navScroll() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    let ticking = false;
    function update() {
        nav.classList.toggle('scrolled', window.scrollY > 24);
        ticking = false;
    }
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });
    update();
})();

// ============================================================
// 4. NAV — active section highlighting
// ============================================================
(function activeSection() {
    const sections = document.querySelectorAll('section[data-section]');
    const links = document.querySelectorAll('.nav-link[data-section]');
    if (!sections.length || !links.length) return;

    const map = {};
    links.forEach(l => map[l.getAttribute('data-section')] = l);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('data-section');
                links.forEach(l => l.classList.remove('active'));
                if (map[id]) map[id].classList.add('active');
            }
        });
    }, {
        rootMargin: '-40% 0px -55% 0px',
        threshold: 0
    });

    sections.forEach(s => observer.observe(s));
})();

// ============================================================
// 5. SMOOTH SCROLL — nav links
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (id === '#' || id === '#top') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const navH = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top, behavior: 'smooth' });
    });
});

// ============================================================
// 6. HERO READY (triggers reveal animation)
// ============================================================
(function heroReady() {
    const hero = document.querySelector('.section-hero');
    if (!hero) return;
    requestAnimationFrame(() => {
        setTimeout(() => hero.classList.add('is-ready'), 80);
    });
})();

// ============================================================
// 7. SCROLL REVEAL
// ============================================================
(function scrollReveal() {
    const targets = document.querySelectorAll(
        '.work-row, .lab-card, .about-body, .about-side, .contact-grid, .section-head, .footer'
    );
    if (!targets.length) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
        targets.forEach(t => t.classList.add('revealed'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const delay = parseInt(el.dataset.revealDelay || '0', 10);
                setTimeout(() => el.classList.add('revealed'), delay);
                observer.unobserve(el);
            }
        });
    }, {
        threshold: 0.08,
        rootMargin: '0px 0px -60px 0px'
    });

    targets.forEach(t => observer.observe(t));
})();

// ============================================================
// 8. PROJECT MODAL
// ============================================================
(function projectModal() {
    const modal = document.getElementById('project-modal');
    if (!modal) return;

    const numEl      = document.getElementById('modal-num');
    const titleEl    = document.getElementById('modal-title');
    const statusEl   = document.getElementById('modal-status');
    const yearEl     = document.getElementById('modal-year');
    const previewEl  = document.getElementById('modal-preview');
    const descEl     = document.getElementById('modal-desc');
    const featuresEl = document.getElementById('modal-features');
    const chipsEl    = document.getElementById('modal-chips');
    const footEl     = document.getElementById('modal-foot-note');

    let lastFocused = null;

    function open(id) {
        const d = projectData[id];
        if (!d) return;

        lastFocused = document.activeElement;

        numEl.textContent = d.num;
        titleEl.textContent = d.title;
        statusEl.textContent = d.status;
        if (yearEl) yearEl.textContent = d.year;
        descEl.textContent = d.desc;
        footEl.textContent = d.note || 'Private — In Development';

        // Preview mockup
        if (previewEl) {
            previewEl.innerHTML = '';
            if (typeof window.createMockup === 'function') {
                const mock = window.createMockup(id);
                if (mock) previewEl.appendChild(mock);
            }
        }

        featuresEl.innerHTML = '';
        d.features.forEach(f => {
            const li = document.createElement('li');
            li.textContent = f;
            featuresEl.appendChild(li);
        });

        chipsEl.innerHTML = '';
        d.tech.forEach(t => {
            const s = document.createElement('span');
            s.textContent = t;
            chipsEl.appendChild(s);
        });

        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) setTimeout(() => closeBtn.focus(), 60);
    }

    function close() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastFocused && typeof lastFocused.focus === 'function') {
            lastFocused.focus();
        }
    }

    // Open on work row click
    document.querySelectorAll('.work-row').forEach(row => {
        row.addEventListener('click', () => {
            open(row.getAttribute('data-project'));
        });
    });

    modal.querySelectorAll('[data-close]').forEach(el => {
        el.addEventListener('click', close);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            close();
        }
    });
})();

// ============================================================
// 9. EMAIL COPY
// ============================================================
(function emailCopy() {
    const btn = document.getElementById('email-btn');
    if (!btn) return;

    const hint = document.getElementById('email-hint');
    const email = btn.getAttribute('data-email');

    btn.addEventListener('click', () => {
        const done = () => {
            btn.classList.add('copied');
            if (hint) hint.textContent = 'Copied to clipboard';
            setTimeout(() => {
                btn.classList.remove('copied');
                if (hint) hint.textContent = 'Click to copy';
            }, 1800);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(email).then(done).catch(() => fallback());
        } else {
            fallback();
        }

        function fallback() {
            const ta = document.createElement('textarea');
            ta.value = email;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); done(); }
            catch (e) { if (hint) hint.textContent = email; }
            ta.remove();
        }
    });
})();

// ============================================================
// 10. STATUS BAR (fixed bottom)
// ============================================================
(function statusBar() {
    const elSection = document.getElementById('status-section');
    const elScroll  = document.getElementById('status-scroll');
    const elTime    = document.getElementById('status-time');
    if (!elSection || !elScroll || !elTime) return;

    // Live clock
    function tick() {
        const d = new Date();
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        const s = String(d.getSeconds()).padStart(2, '0');
        elTime.textContent = `${h}:${m}:${s}`;
    }
    tick();
    setInterval(tick, 1000);

    // Live section + scroll percent
    const sections = document.querySelectorAll('section[data-section]');
    function updateStatus() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const pct = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
        elScroll.textContent = pct + '%';

        let current = 'hero';
        const y = window.scrollY + window.innerHeight / 3;
        sections.forEach(s => {
            if (s.offsetTop <= y) current = s.getAttribute('data-section');
        });
        elSection.textContent = current;
    }
    window.addEventListener('scroll', () => {
        requestAnimationFrame(updateStatus);
    }, { passive: true });
    updateStatus();
})();

// ============================================================
// 11. HERO PANEL — local time
// ============================================================
(function heroTime() {
    const el = document.getElementById('local-time');
    if (!el) return;
    function update() {
        const d = new Date();
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        el.textContent = `${h}:${m}`;
    }
    update();
    setInterval(update, 30 * 1000);
})();

console.log('script — loaded');