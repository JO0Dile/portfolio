/* ============================================================
   EXTRAS.JS — small ambient motion helpers
   (Does NOT contain projectData — that lives in script.js)
   ============================================================ */

(function () {
    /* ----------------------------------------------------------
       1. PANEL PARALLAX — panels lean toward mouse
       ---------------------------------------------------------- */
    const panels = document.querySelectorAll('.panel[data-panel]');
    let targetRX = 0, targetRY = 0;
    let currentRX = 0, currentRY = 0;

    window.addEventListener('mousemove', (e) => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        targetRY = ((e.clientX - cx) / cx) * 4;
        targetRX = ((e.clientY - cy) / cy) * -4;
    });

    function panelParallaxLoop() {
        currentRX += (targetRX - currentRX) * 0.08;
        currentRY += (targetRY - currentRY) * 0.08;
        panels.forEach(p => {
            // Only apply when NOT currently running its entrance animation
            if (p.classList.contains('anim-in')) return;
            p.style.transform = `perspective(1200px) rotateX(${currentRX}deg) rotateY(${currentRY}deg)`;
        });
        requestAnimationFrame(panelParallaxLoop);
    }
    panelParallaxLoop();

    /* ----------------------------------------------------------
       2. NAV / CHIP / LAB-LINK TINY WIGGLE ON HOVER
       ---------------------------------------------------------- */
    document.querySelectorAll('.nav-link, .chip, .lab-box').forEach(el => {
        el.addEventListener('mouseenter', () => {
            if (el.classList.contains('cursor-near')) return;
            const a = (Math.random() - 0.5) * 5;
            el.style.transition = 'transform 0.15s ease-out';
            el.style.transform = `rotate(${a}deg) translateY(-2px)`;
            setTimeout(() => {
                el.style.transform = '';
            }, 180);
        });
    });

    /* ----------------------------------------------------------
       3. RIPPLE ON EVERY INTERACTIVE CLICK
       ---------------------------------------------------------- */
    document.addEventListener('click', (e) => {
        const target = e.target.closest(
            '.project-card, .email-btn, .back-top, .nav-link, .chip, ' +
            '.lab-box, .modal-close, .building-row, .interest-tag'
        );
        if (!target) return;
        if (e.target.closest('.mockup')) return;

        const rect = target.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.style.position = 'fixed';
        ripple.style.left = (rect.left + rect.width / 2) + 'px';
        ripple.style.top = (rect.top + rect.height / 2) + 'px';
        ripple.style.width = '8px';
        ripple.style.height = '8px';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(79, 196, 220, 0.6)';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '99998';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.transition = 'width 0.55s ease-out, height 0.55s ease-out, opacity 0.55s ease-out';
        document.body.appendChild(ripple);
        requestAnimationFrame(() => {
            ripple.style.width = '160px';
            ripple.style.height = '160px';
            ripple.style.opacity = '0';
        });
        setTimeout(() => ripple.remove(), 600);
    });

    /* ----------------------------------------------------------
       4. NAV LOGO HOP LETTERS
       ---------------------------------------------------------- */
    const navLogo = document.querySelector('.nav-logo');
    if (navLogo && !navLogo.querySelector('.nav-logo-letter')) {
        const html = navLogo.innerHTML;
        // Only wrap if not already wrapped
        const textNode = navLogo.firstChild;
        if (textNode && textNode.nodeType === 3) {
            const text = textNode.textContent.trim();
            const rest = navLogo.innerHTML.substring(navLogo.innerHTML.indexOf(text) + text.length);
            navLogo.innerHTML = text.split('').map(ch => 
                `<span class="nav-logo-letter">${ch}</span>`
            ).join('') + rest;
        }
    }

    /* ----------------------------------------------------------
       5. PROJECT TITLE WOBBLE ON SCROLL
       ---------------------------------------------------------- */
    let scrollTicking = false;
    let scrollY = window.scrollY;
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
        if (!scrollTicking) {
            requestAnimationFrame(() => {
                document.querySelectorAll('.panel-title').forEach((t, i) => {
                    const offset = Math.sin((scrollY + i * 200) / 400) * 2;
                    if (!t.dataset.hovering) t.style.transform = `translateX(${offset}px)`;
                });
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }, { passive: true });

    /* ----------------------------------------------------------
       6. MAGNETIC CURSOR ON BIG BUTTONS
       ---------------------------------------------------------- */
    document.querySelectorAll('.email-btn, .back-top, .modal-close').forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = (e.clientX - cx) * 0.12;
            const dy = (e.clientY - cy) * 0.12;
            el.style.transform = `translate(${dx}px, ${dy}px)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
        });
    });

    /* ----------------------------------------------------------
       7. FLOATING BADGE WIGGLE
       ---------------------------------------------------------- */
    const badges = document.querySelectorAll('.panel-badge, .hero-badge');
    badges.forEach((b, i) => {
        b.style.animationDelay = (i * 0.4) + 's';
    });

    /* ----------------------------------------------------------
       8. AMBIENT TITLE GLOW PULSE
       ---------------------------------------------------------- */
    setInterval(() => {
        const t = document.querySelector('.panel-title');
        if (!t) return;
        t.style.transition = 'text-shadow 0.8s ease';
        t.style.textShadow = '0 0 20px rgba(79, 196, 220, 0.4)';
        setTimeout(() => {
            t.style.textShadow = '';
        }, 800);
    }, 8000);

    console.log('✨ extras.js loaded');
})();