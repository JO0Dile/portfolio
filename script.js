/* ============================================================
   SCRIPT.JS — nav, scroll spy, stage rail, status bar, contact
   ------------------------------------------------------------
   Work / Lab / About are painted by the 3D scene now, so there
   is no work list, no lab grid and no modals in here. The only
   interactive control left on the page is the email button.
   ============================================================ */

// ============================================================
// 1. NAV — background on scroll
// ============================================================
(function navScroll() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    function update() {
        nav.classList.toggle('is-scrolled', window.scrollY > 24);
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
})();

// ============================================================
// 2. NAV — active section highlighting
// ============================================================
(function navActive() {
    const sections = document.querySelectorAll('section[data-section]');
    const links = document.querySelectorAll('.nav-link[data-section]');
    if (!sections.length || !links.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const id = entry.target.getAttribute('data-section');
            links.forEach(l => {
                l.classList.toggle('active', l.getAttribute('data-section') === id);
            });
        });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    sections.forEach(s => observer.observe(s));
})();

// ============================================================
// 3. Smooth scroll for in-page anchors
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// ============================================================
// 4. Hero entrance
// ============================================================
(function heroReady() {
    const hero = document.querySelector('.section-hero');
    if (!hero) return;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => hero.classList.add('is-ready'));
    });
})();

// ============================================================
// 5. Scroll reveal for the remaining HTML blocks
// ============================================================
(function scrollReveal() {
    const targets = document.querySelectorAll(
        '.section-head, .contact-grid, .footer'
    );
    if (!targets.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    targets.forEach(t => observer.observe(t));
})();

// ============================================================
// 6. STAGE RAIL — one dot per scene slot, marks where you are
//    Mirrors the anchor math the SceneDirector uses, so the rail
//    and the 3D scene always agree on which slot is active.
// ============================================================
(function stageRail() {
    const slots = Array.from(document.querySelectorAll('.stage-slot'));
    if (!slots.length) return;

    const rail = document.createElement('div');
    rail.className = 'stage-rail';
    const dots = slots.map(() => {
        const d = document.createElement('span');
        d.className = 'stage-rail-dot';
        rail.appendChild(d);
        return d;
    });
    document.body.appendChild(rail);

    let anchors = [];

    function measure() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max <= 0) { anchors = []; return; }
        const vh = window.innerHeight;
        anchors = slots.map(el => {
            const top = el.getBoundingClientRect().top + window.scrollY;
            const centre = top + el.offsetHeight / 2 - vh / 2;
            return Math.min(1, Math.max(0, centre / max));
        });
    }

    function update() {
        if (!anchors.length) return;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? window.scrollY / max : 0;

        // Nearest anchor wins.
        let best = 0, bestD = Infinity;
        for (let i = 0; i < anchors.length; i++) {
            const d = Math.abs(anchors[i] - p);
            if (d < bestD) { bestD = d; best = i; }
        }

        // Only show the rail once we are actually inside the staged
        // region — it is noise on the hero and the contact block.
        const inRange = p >= anchors[0] - 0.05 &&
                        p <= anchors[anchors.length - 1] + 0.05;
        rail.classList.toggle('is-visible', inRange);

        dots.forEach((d, i) => d.classList.toggle('is-active', i === best && inRange));
    }

    measure();
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', () => { measure(); update(); });
    window.addEventListener('load', () => { measure(); update(); });
})();

// ============================================================
// 7. CONTACT — copy email to clipboard
// ============================================================
(function emailCopy() {
    const btn = document.getElementById('email-btn');
    const hint = document.getElementById('email-hint');
    if (!btn) return;

    const email = btn.getAttribute('data-email') || '';
    let resetTimer = null;

    function flash(message) {
        btn.classList.add('is-copied');
        if (hint) hint.textContent = message;
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
            btn.classList.remove('is-copied');
            if (hint) hint.textContent = 'Click to copy';
        }, 2000);
    }

    function fallback() {
        const ta = document.createElement('textarea');
        ta.value = email;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(ta);
        flash(ok ? 'Copied to clipboard' : email);
    }

    btn.addEventListener('click', () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(email)
                .then(() => flash('Copied to clipboard'))
                .catch(fallback);
        } else {
            fallback();
        }
    });
})();

// ============================================================
// 8. STATUS BAR — section / scroll % / local time
// ============================================================
(function statusBar() {
    const elSection = document.getElementById('status-section');
    const elScroll  = document.getElementById('status-scroll');
    const elTime    = document.getElementById('status-time');

    function tick() {
        if (elTime) {
            const d = new Date();
            elTime.textContent =
                String(d.getHours()).padStart(2, '0') + ':' +
                String(d.getMinutes()).padStart(2, '0') + ':' +
                String(d.getSeconds()).padStart(2, '0');
        }
    }
    tick();
    setInterval(tick, 1000);

    const sections = document.querySelectorAll('section[data-section]');

    function updateStatus() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        if (elScroll) elScroll.textContent = Math.round(p * 100) + '%';

        if (!elSection) return;
        const probe = window.scrollY + window.innerHeight * 0.4;
        let current = 'hero';
        sections.forEach(s => {
            if (probe >= s.offsetTop) current = s.getAttribute('data-section');
        });
        elSection.textContent = current;
    }

    updateStatus();
    window.addEventListener('scroll', updateStatus, { passive: true });
    window.addEventListener('resize', updateStatus);
})();

// ============================================================
// 9. HERO — local time in the status panel
// ============================================================
(function heroClock() {
    const el = document.getElementById('local-time');
    if (!el) return;
    function update() {
        const d = new Date();
        el.textContent =
            String(d.getHours()).padStart(2, '0') + ':' +
            String(d.getMinutes()).padStart(2, '0');
    }
    update();
    setInterval(update, 30000);
})();

console.log('script — loaded');
