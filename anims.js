/* ============================================================
   ANIMS.JS v3 — text overlap fixed
   ============================================================ */

(function () {
    try {
        /* --- Split letters / words --- */
        function splitLetters(el) {
            if (el.dataset.split === '1') return;
            el.dataset.split = '1';
            const text = el.textContent;
            el.textContent = '';
            text.split('').forEach(ch => {
                const span = document.createElement('span');
                span.className = ch === ' ' ? 'char space' : 'char';
                span.textContent = ch === ' ' ? '\u00A0' : ch;
                el.appendChild(span);
            });
        }

        function splitWords(el) {
            if (el.dataset.split === '1') return;
            if (el.querySelector('.word')) return;
            el.dataset.split = '1';
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            const textNodes = [];
            let node;
            while ((node = walker.nextNode())) {
                if (node.textContent.trim()) textNodes.push(node);
            }
            textNodes.forEach(tn => {
                const words = tn.textContent.split(/(\s+)/);
                const frag = document.createDocumentFragment();
                words.forEach(w => {
                    if (w.trim() === '') {
                        frag.appendChild(document.createTextNode(w));
                    } else {
                        const s = document.createElement('span');
                        s.className = 'word';
                        s.textContent = w;
                        frag.appendChild(s);
                    }
                });
                tn.parentNode.replaceChild(frag, tn);
            });
        }

        document.querySelectorAll('.reveal-text').forEach(splitLetters);
        document.querySelectorAll('.reveal-word').forEach(splitWords);

        /* --- Panel enter directions --- */
        const panelDirections = ['left', 'right', 'spin', 'up', 'zoom', 'down'];
        document.querySelectorAll('.panel[data-panel]').forEach((p, i) => {
            p.setAttribute('data-enter', panelDirections[i % panelDirections.length]);
        });

        /* --- Reveal observer --- */
        const revealTargets = document.querySelectorAll(
            '.panel, .reveal-text, .reveal-word, .project-card, .chip, .lab-box, ' +
            '.building-row, .status-pill, .hero-hint, .email-btn, .interest-tag'
        );

        document.querySelectorAll('.chip-list').forEach(list => {
            list.querySelectorAll('.chip').forEach((c, i) => {
                c.style.animationDelay = (i * 0.08) + 's';
            });
        });
        document.querySelectorAll('.building-rows').forEach(list => {
            list.querySelectorAll('.building-row').forEach((r, i) => {
                r.style.animationDelay = (i * 0.12) + 's';
            });
        });
        document.querySelectorAll('.lab-grid').forEach(grid => {
            grid.querySelectorAll('.lab-box').forEach((b, i) => {
                b.style.animationDelay = (i * 0.12) + 's';
            });
        });

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const el = entry.target;
                if (entry.isIntersecting) {
                    el.classList.remove('anim-in');
                    void el.offsetWidth;
                    el.classList.add('anim-in');
                } else {
                    el.classList.remove('anim-in');
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

        revealTargets.forEach(t => revealObserver.observe(t));

        setTimeout(() => {
            revealTargets.forEach(el => {
                if (el.classList.contains('anim-in')) return;
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    el.classList.add('anim-in');
                }
            });
        }, 2500);

        /* --- Click ripple --- */
        document.addEventListener('click', (e) => {
            if (e.target.closest('.mockup')) return;
            const ripple = document.createElement('div');
            ripple.className = 'click-ripple';
            ripple.style.left = e.clientX + 'px';
            ripple.style.top = e.clientY + 'px';
            document.body.appendChild(ripple);
            setTimeout(() => ripple.remove(), 750);
        });

        /* --- Cursor proximity --- */
        const proximityTargets = document.querySelectorAll(
            '.chip, .lab-box, .project-card, .building-row, .interest-tag'
        );
        let mouseX = 0, mouseY = 0;
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        function proximityLoop() {
            proximityTargets.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.bottom < -50 || rect.top > window.innerHeight + 50) return;
                const dist = Math.hypot(
                    mouseX - (rect.left + rect.width / 2),
                    mouseY - (rect.top + rect.height / 2)
                );
                el.classList.toggle('cursor-near', dist < 120);
            });
            requestAnimationFrame(proximityLoop);
        }
        proximityLoop();

        /* --- Scroll velocity --- */
        let lastScrollY = window.scrollY;
        let lastScrollTime = performance.now();
        let fastTimeout = null;
        window.addEventListener('scroll', () => {
            const now = performance.now();
            const velocity = Math.abs(window.scrollY - lastScrollY) / Math.max(now - lastScrollTime, 1);
            lastScrollY = window.scrollY;
            lastScrollTime = now;
            if (velocity > 1.5) {
                document.body.classList.add('scrolling-fast');
                clearTimeout(fastTimeout);
                fastTimeout = setTimeout(() => {
                    document.body.classList.remove('scrolling-fast');
                }, 220);
            }
        }, { passive: true });

        /* --- Section indicator dots --- */
        const sectionIds = ['hero', 'about', 'work', 'lab', 'contact'];
        const sectionsEls = sectionIds.map(id => document.getElementById(id)).filter(Boolean);
        if (sectionsEls.length > 0 && !document.querySelector('.section-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'section-indicator';
            sectionsEls.forEach((sec) => {
                const dot = document.createElement('div');
                dot.className = 'section-indicator-dot';
                dot.dataset.target = sec.id;
                indicator.appendChild(dot);
            });
            document.body.appendChild(indicator);
            indicator.querySelectorAll('.section-indicator-dot').forEach(dot => {
                dot.addEventListener('click', () => {
                    const target = document.getElementById(dot.dataset.target);
                    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            });
            const updateIndicator = () => {
                const scrollY = window.scrollY + window.innerHeight / 3;
                let activeId = sectionsEls[0].id;
                sectionsEls.forEach(sec => {
                    if (scrollY >= sec.offsetTop) activeId = sec.id;
                });
                indicator.querySelectorAll('.section-indicator-dot').forEach(dot => {
                    dot.classList.toggle('active', dot.dataset.target === activeId);
                });
            };
            window.addEventListener('scroll', updateIndicator, { passive: true });
            updateIndicator();
        }

        /* --- Stat counters --- */
        document.querySelectorAll('.stat-number').forEach(el => {
            const target = parseInt(el.dataset.value || el.textContent, 10);
            if (isNaN(target)) return;
            el.textContent = '0';
            const start = performance.now();
            const step = (now) => {
                const p = Math.min((now - start) / 1400, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.floor(eased * target);
                if (p < 1) requestAnimationFrame(step);
                else el.textContent = target;
            };
            const obs = new IntersectionObserver(entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        requestAnimationFrame(step);
                        obs.disconnect();
                    }
                });
            }, { threshold: 0.5 });
            obs.observe(el);
        });

        /* --- Ambient panel sparkles --- */
        function ambientSparkle() {
            const panels = document.querySelectorAll('.panel');
            if (panels.length === 0) { setTimeout(ambientSparkle, 3000); return; }
            const p = panels[Math.floor(Math.random() * panels.length)];
            const rect = p.getBoundingClientRect();
            if (rect.top > window.innerHeight || rect.bottom < 0) {
                setTimeout(ambientSparkle, 2500);
                return;
            }
            const s = document.createElement('span');
            s.className = 'sparkle';
            s.textContent = ['✦', '◆', '★', '✧', '●'][Math.floor(Math.random() * 5)];
            s.style.left = (rect.left + Math.random() * rect.width) + 'px';
            s.style.top = (rect.top + Math.random() * rect.height) + 'px';
            s.style.color = ['#4fc4dc', '#6fdba0', '#a690f0', '#ff6b9d'][Math.floor(Math.random() * 4)];
            s.style.fontSize = '14px';
            s.style.position = 'fixed';
            s.style.setProperty('--dx', (Math.random() - 0.5) * 100 + 'px');
            s.style.setProperty('--dy', '-80px');
            document.body.appendChild(s);
            setTimeout(() => s.remove(), 1000);
            setTimeout(ambientSparkle, 1800 + Math.random() * 3500);
        }
        ambientSparkle();

        /* --- Keyframe injection --- */
        const style = document.createElement('style');
        style.textContent = `
            @keyframes navClickWiggle {
                0% { transform: translateX(0) rotate(0); }
                25% { transform: translateX(-6px) rotate(-3deg); }
                50% { transform: translateX(6px) rotate(3deg); }
                75% { transform: translateX(-3px) rotate(-1deg); }
                100% { transform: translateX(0) rotate(0); }
            }
        `;
        document.head.appendChild(style);

        /* --- Nav link wiggle on click --- */
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                link.style.animation = 'none';
                void link.offsetWidth;
                link.style.animation = 'navClickWiggle 0.5s ease';
                setTimeout(() => { link.style.animation = ''; }, 550);
            });
        });

        /* --- Project card 3D tilt --- */
        document.querySelectorAll('.project-card').forEach(card => {
            let raf = null;
            card.addEventListener('mousemove', (e) => {
                if (raf) cancelAnimationFrame(raf);
                raf = requestAnimationFrame(() => {
                    const rect = card.getBoundingClientRect();
                    const px = (e.clientX - rect.left) / rect.width;
                    const py = (e.clientY - rect.top) / rect.height;
                    const rx = (py - 0.5) * -8;
                    const ry = (px - 0.5) * 10;
                    card.style.transform =
                        `perspective(900px) translate(-4px, -4px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(-0.5deg)`;
                });
            });
            card.addEventListener('mouseleave', () => {
                if (raf) cancelAnimationFrame(raf);
                card.style.transform = '';
            });
        });

        /* --- Building row pulse --- */
        setInterval(() => {
            const rows = document.querySelectorAll('.building-row');
            if (rows.length === 0) return;
            const r = rows[Math.floor(Math.random() * rows.length)];
            r.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.4s ease';
            r.style.transform = 'translateX(10px)';
            r.style.background = 'var(--mint-soft)';
            setTimeout(() => {
                r.style.transform = '';
                r.style.background = '';
            }, 800);
        }, 2500);

        /* --- Marquee hue shift --- */
        window.addEventListener('scroll', () => {
            const hue = (window.scrollY / 20) % 40;
            document.querySelectorAll('.marquee-strip').forEach(m => {
                m.style.filter = `hue-rotate(${hue}deg)`;
            });
        }, { passive: true });

        /* --- Hero name sparkle burst --- */
        window.addEventListener('load', () => {
            setTimeout(() => {
                const heroName = document.querySelector('.hero-name');
                if (!heroName) return;
                const rect = heroName.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                for (let i = 0; i < 20; i++) {
                    const s = document.createElement('span');
                    s.className = 'sparkle';
                    s.textContent = ['✦', '◆', '★', '✧'][Math.floor(Math.random() * 4)];
                    s.style.left = cx + 'px';
                    s.style.top = cy + 'px';
                    s.style.color = ['#4fc4dc', '#6fdba0', '#a690f0', '#ff6b9d'][Math.floor(Math.random() * 4)];
                    s.style.fontSize = '20px';
                    const angle = (i / 20) * Math.PI * 2;
                    const dist = 80 + Math.random() * 100;
                    s.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
                    s.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
                    document.body.appendChild(s);
                    setTimeout(() => s.remove(), 1000);
                }
            }, 1800);
        });

        console.log('✨ anims.js v3 loaded');

    } catch (err) {
        console.error('anims.js error:', err);
        document.querySelectorAll(
            '.panel, .project-card, .chip, .lab-box, .building-row, ' +
            '.status-pill, .hero-hint, .email-btn, .interest-tag'
        ).forEach(el => el.classList.add('anim-in'));
    }
})();