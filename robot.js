/* ============================================================
   COMPANION ROBOT — cool-cute pet (Hammam's version)
   ============================================================ */
(function () {
    const robot = document.getElementById('companion');
    const speech = document.getElementById('companion-speech');
    if (!robot) return;

    // Loader failsafe
    (function ensureLoaderHides() {
        const loader = document.getElementById('loader');
        if (!loader) return;
        const hide = () => {
            if (loader.dataset.hidden === '1') return;
            loader.dataset.hidden = '1';
            loader.style.transition = 'opacity 0.6s ease';
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 700);
        };
        window.addEventListener('load', () => setTimeout(hide, 2000));
        setTimeout(hide, 3500);
        setTimeout(hide, 5500);
    })();

    // State
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let robotX = window.innerWidth - 150;
    let robotY = 200;
    let idleTimer = null;
    let isSleeping = false;
    let lastScrollY = window.scrollY;
    let scrollSurpriseCooldown = 0;
    let bobPhase = 0;
    let swingPhase = 0;

    const speechLines = [":3", "hi!", "◕‿◕", "wow.", "•••", "beep!", "♥", "nyaa~", "hehe"];

    function showSpeech(text, duration = 1400) {
        speech.textContent = text;
        speech.classList.add('show');
        clearTimeout(showSpeech._t);
        showSpeech._t = setTimeout(() => speech.classList.remove('show'), duration);
    }

    // Mouse tracking
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (isSleeping) {
            robot.classList.remove('sleepy');
            isSleeping = false;
            showSpeech("!", 700);
        }
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            robot.classList.add('sleepy');
            isSleeping = true;
        }, 8000);
    });

    // Fast scroll surprise
    window.addEventListener('scroll', () => {
        const now = performance.now();
        const deltaY = Math.abs(window.scrollY - lastScrollY);
        lastScrollY = window.scrollY;
        if (deltaY > 120 && now - scrollSurpriseCooldown > 2000) {
            scrollSurpriseCooldown = now;
            robot.classList.add('surprised');
            showSpeech("!", 500);
            setTimeout(() => robot.classList.remove('surprised'), 700);
        }
    });

    // Hover reactions
    const hoverSelector = 'a, button, .nav-link, .project-card, .email-btn, .back-top, .modal-close, .chip, .lab-box';
    document.querySelectorAll(hoverSelector).forEach((el) => {
        el.addEventListener('mouseenter', () => {
            robot.classList.add('excited');
            if (Math.random() < 0.5) showSpeech(":D", 900);
        });
        el.addEventListener('mouseleave', () => robot.classList.remove('excited'));
    });

    // Blink loop
    function blinkLoop() {
        if (!isSleeping) {
            const eyeL = robot.querySelector('.companion-eye.left');
            const eyeR = robot.querySelector('.companion-eye.right');
            if (eyeL && eyeR) {
                eyeL.style.transform = 'scaleY(0.1)';
                eyeR.style.transform = 'scaleY(0.1)';
                setTimeout(() => {
                    eyeL.style.transform = '';
                    eyeR.style.transform = '';
                }, 130);
            }
        }
        setTimeout(blinkLoop, 2400 + Math.random() * 3200);
    }
    blinkLoop();

    // Idle speech
    function idleSpeech() {
        if (!isSleeping && Math.random() < 0.35) {
            showSpeech(speechLines[Math.floor(Math.random() * speechLines.length)], 1200);
        }
        setTimeout(idleSpeech, 6000 + Math.random() * 7000);
    }
    setTimeout(idleSpeech, 3500);

    // Continuous visible idle motion — ear wiggles + head tilts
    function idleWiggle() {
        if (!isSleeping) {
            const earL = robot.querySelector('.companion-ear.left');
            const earR = robot.querySelector('.companion-ear.right');
            if (earL && earR) {
                const tilt = (Math.random() - 0.5) * 12;
                earL.style.transform = `rotate(${-20 + tilt}deg)`;
                earR.style.transform = `rotate(${20 + tilt}deg)`;
                setTimeout(() => {
                    earL.style.transform = '';
                    earR.style.transform = '';
                }, 500);
            }
        }
        setTimeout(idleWiggle, 3000 + Math.random() * 4000);
    }
    setTimeout(idleWiggle, 2000);

    // Follow loop — with stronger visible motion (bigger bob + side swing)
    function follow() {
        const targetX = Math.max(50, Math.min(window.innerWidth - 110, mouseX + 55));
        const targetY = Math.max(80, Math.min(window.innerHeight - 130, mouseY - 40));
        robotX += (targetX - robotX) * 0.08;
        robotY += (targetY - robotY) * 0.08;

        bobPhase += 0.06;
        swingPhase += 0.04;

        const bob = Math.sin(bobPhase) * 8;          // up/down bob
        const swing = Math.sin(swingPhase) * 4;      // side sway
        const tilt = Math.sin(swingPhase * 0.8) * 4; // slight rotation

        robot.style.transform =
            `translate3d(${robotX + swing}px, ${robotY + bob}px, 0) rotate(${tilt}deg)`;
        requestAnimationFrame(follow);
    }
    follow();

    // Section reactions
    const sections = document.querySelectorAll('section');
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                const line = {
                    hero: "hi hi!",
                    about: "who's this?",
                    work: "oooh projects ✦",
                    lab: "tools!",
                    contact: "say hi to me ♥"
                }[id];
                if (line) showSpeech(line, 1500);
            }
        });
    }, { threshold: 0.5 });
    sections.forEach(s => sectionObserver.observe(s));

    // Click the robot itself
    robot.style.pointerEvents = 'auto';
    robot.addEventListener('click', (e) => {
        e.stopPropagation();
        const reactions = ["!", ":D", ":3", "wow", "hehe", "♥"];
        showSpeech(reactions[Math.floor(Math.random() * reactions.length)], 1000);
        robot.classList.add('excited');
        setTimeout(() => robot.classList.remove('excited'), 900);
        spawnSparkles(e.clientX, e.clientY, 12);
    });

    // Loader text rotate
    const loaderText = document.getElementById('loader-text');
    const loaderLines = [
        "waking up...",
        "fluffing pixels...",
        "brewing tea...",
        "building tiny worlds...",
        "almost ready...",
        "hello :3"
    ];
    let loaderIdx = 0;
    const loaderInt = setInterval(() => {
        loaderIdx++;
        if (loaderIdx >= loaderLines.length) { clearInterval(loaderInt); return; }
        if (loaderText) {
            loaderText.style.opacity = '0';
            setTimeout(() => {
                loaderText.textContent = loaderLines[loaderIdx];
                loaderText.style.opacity = '1';
            }, 150);
        }
    }, 430);

    // Sparkle helper — cool palette
    function spawnSparkles(x, y, count = 8) {
        const chars = ['✦', '◆', '●', '★', '✧', '⬢', '☁'];
        const colors = ['#4fc4dc', '#6fdba0', '#a690f0', '#7fc4f0', '#ff6b9d'];
        for (let i = 0; i < count; i++) {
            const s = document.createElement('span');
            s.className = 'sparkle';
            s.textContent = chars[Math.floor(Math.random() * chars.length)];
            s.style.left = x + 'px';
            s.style.top = y + 'px';
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
            const dist = 45 + Math.random() * 70;
            s.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
            s.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
            s.style.color = colors[Math.floor(Math.random() * colors.length)];
            document.body.appendChild(s);
            setTimeout(() => s.remove(), 1000);
        }
    }

    // Sparkles on interactive clicks
    document.querySelectorAll('button, .email-btn, .back-top, .nav-link, .project-card, .modal-close, .chip').forEach(el => {
        el.addEventListener('click', (e) => {
            const rect = el.getBoundingClientRect();
            spawnSparkles(rect.left + rect.width / 2, rect.top + rect.height / 2, 10);
            robot.classList.add('happy');
            setTimeout(() => robot.classList.remove('happy'), 900);
        });
    });

    // Hover sparkles on cards
    document.querySelectorAll('.project-card, .lab-box').forEach(card => {
        card.addEventListener('mouseenter', (e) => {
            const rect = card.getBoundingClientRect();
            spawnSparkles(rect.right - 40, rect.top + 40, 4);
        });
    });

    // Footer greeting
    const footer = document.querySelector('.footer');
    if (footer) {
        const footerObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    showSpeech("bye bye ♥", 2500);
                    robot.classList.add('happy');
                    setTimeout(() => robot.classList.remove('happy'), 2200);
                }
            });
        }, { threshold: 0.4 });
        footerObs.observe(footer);
    }

    // Modal greeting
    const modal = document.getElementById('project-modal');
    if (modal) {
        const mo = new MutationObserver(() => {
            if (modal.classList.contains('active')) {
                showSpeech("ooh ✦", 1200);
            }
        });
        mo.observe(modal, { attributes: true, attributeFilter: ['class'] });
    }

    // Ambient sparkles around the robot every so often
    setInterval(() => {
        if (!isSleeping && Math.random() < 0.5) {
            const rect = robot.getBoundingClientRect();
            spawnSparkles(rect.left + rect.width / 2, rect.top + rect.height / 2, 2);
        }
    }, 5000);

    // Photo mode — press P
    document.addEventListener('keydown', (e) => {
        if ((e.key === 'p' || e.key === 'P') && !e.target.matches('input, textarea')) {
            document.body.classList.toggle('photo-mode');
            if (document.body.classList.contains('photo-mode')) {
                showSpeech("cheese!", 1200);
            }
        }
    });

    // "dile" easter egg — type anywhere
    let typedBuffer = "";
    document.addEventListener('keydown', (e) => {
        if (e.target.matches('input, textarea')) return;
        if (e.key.length !== 1) return;
        typedBuffer += e.key.toLowerCase();
        if (typedBuffer.length > 6) typedBuffer = typedBuffer.slice(-6);
        if (typedBuffer.endsWith('dile')) {
            typedBuffer = "";
            triggerParty();
        }
    });

    // "hammam" easter egg too — because it's his name
    let typedBuffer2 = "";
    document.addEventListener('keydown', (e) => {
        if (e.target.matches('input, textarea')) return;
        if (e.key.length !== 1) return;
        typedBuffer2 += e.key.toLowerCase();
        if (typedBuffer2.length > 8) typedBuffer2 = typedBuffer2.slice(-8);
        if (typedBuffer2.endsWith('hammam')) {
            typedBuffer2 = "";
            triggerParty();
        }
    });

    function triggerParty() {
        showSpeech("!!!", 1800);
        robot.classList.add('excited', 'happy');
        const emojis = ['✦', '◆', '★', '⚙', '☁', '🤖', '⬢', '⬡', '✧', '♥'];
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const s = document.createElement('span');
                s.className = 'sparkle';
                s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                s.style.left = Math.random() * window.innerWidth + 'px';
                s.style.top = (window.innerHeight - 100) + 'px';
                s.style.setProperty('--dx', (Math.random() - 0.5) * 80 + 'px');
                s.style.setProperty('--dy', '-260px');
                s.style.color = ['#4fc4dc', '#6fdba0', '#a690f0', '#7fc4f0', '#ff6b9d', '#ffd9b8'][Math.floor(Math.random() * 6)];
                s.style.fontSize = '24px';
                document.body.appendChild(s);
                setTimeout(() => s.remove(), 1100);
            }, i * 22);
        }
        setTimeout(() => robot.classList.remove('excited', 'happy'), 2600);
    }

    // Occasional random wave — the pet notices you
    setInterval(() => {
        if (!isSleeping && Math.random() < 0.2) {
            robot.classList.add('excited');
            showSpeech(":3", 900);
            setTimeout(() => robot.classList.remove('excited'), 900);
        }
    }, 12000);
})();