// ============================================================
// PROJECT DATA (mockups embedded — no external files needed)
// ============================================================
const projectData = {
    "01": {
        num: "01",
        title: "AAUP Academic Planner",
        status: "active development",
        desc: "An academic planning platform for university students — courses, prerequisites, progress tracking, and planning. Designed to handle complex multi-university, multi-major logic with full Arabic RTL support.",
        features: ["Prerequisite & course dependency logic","Progress tracking across majors & universities","Full Arabic RTL support","AI-assisted smart planning","PostgreSQL backend with REST APIs"],
        tech: ["JavaScript", "PostgreSQL", "APIs", "RTL", "AI"],
        mockup: `
            <div class="mockup-chrome">
                <span class="mockup-dot mockup-red"></span>
                <span class="mockup-dot mockup-yellow"></span>
                <span class="mockup-dot mockup-green"></span>
                <span class="mockup-title">aaup-planner ✦ العربية</span>
            </div>
            <div class="mockup-body mockup-aaup">
                <div class="aaup-side">
                    <div class="aaup-side-title">prereqs</div>
                    <div class="aaup-node active">CS101</div>
                    <div class="aaup-line"></div>
                    <div class="aaup-node active">CS201</div>
                    <div class="aaup-line"></div>
                    <div class="aaup-node locked">CS301</div>
                </div>
                <div class="aaup-main">
                    <div class="aaup-header"><span>Fall 2026</span><span class="aaup-count">3 / 5 courses</span></div>
                    <div class="aaup-grid">
                        <div class="aaup-card"><div class="aaup-card-code">CS201</div><div class="aaup-card-name">Data Structures</div><div class="aaup-card-bar"><span style="width:72%"></span></div></div>
                        <div class="aaup-card"><div class="aaup-card-code">AI310</div><div class="aaup-card-name">Intro to AI</div><div class="aaup-card-bar"><span style="width:40%"></span></div></div>
                        <div class="aaup-card"><div class="aaup-card-code">MATH220</div><div class="aaup-card-name">Linear Algebra</div><div class="aaup-card-bar"><span style="width:88%"></span></div></div>
                        <div class="aaup-card"><div class="aaup-card-code">ENG150</div><div class="aaup-card-name">Technical Writing</div><div class="aaup-card-bar"><span style="width:15%"></span></div></div>
                    </div>
                    <div class="aaup-progress"><span>Progress</span><div class="aaup-progress-bar"><span></span></div><span>42%</span></div>
                </div>
            </div>
        `
    },
    "02": {
        num: "02",
        title: "Construction & Trades",
        status: "active development",
        desc: "A construction / work management app designed around real-world workflows. Built offline-first so crews can access everything without an internet connection.",
        features: ["Offline-first Android architecture","Multi-language: Hebrew, Arabic, English","Dynamic RTL / LTR layout switching","Trade catalogs & inventory","Attendance + wage calculations"],
        tech: ["Android", "Offline-First", "Multi-lang", "RTL/LTR", "Wage Calc"],
        mockup: `
            <div class="mockup-chrome">
                <span class="mockup-dot mockup-red"></span>
                <span class="mockup-dot mockup-yellow"></span>
                <span class="mockup-dot mockup-green"></span>
                <span class="mockup-title">site-manager v2.1</span>
            </div>
            <div class="mockup-body mockup-phone">
                <div class="phone-frame">
                    <div class="phone-top"><span>SITE #4 · TLV</span><span class="phone-live"></span></div>
                    <div class="phone-tabs"><div class="phone-tab active">Workers</div><div class="phone-tab">Att.</div><div class="phone-tab">Wages</div></div>
                    <div class="phone-list">
                        <div class="phone-row"><div class="phone-avatar" style="background:var(--cyan-soft)">A</div><div class="phone-name">Ahmed</div><span class="phone-status here">here</span></div>
                        <div class="phone-row"><div class="phone-avatar" style="background:var(--mint-soft)">Y</div><div class="phone-name">Yousef</div><span class="phone-status here">here</span></div>
                        <div class="phone-row"><div class="phone-avatar" style="background:var(--lav)">M</div><div class="phone-name">Mahmoud</div><span class="phone-status late">late</span></div>
                        <div class="phone-row"><div class="phone-avatar" style="background:var(--peach)">K</div><div class="phone-name">Khaled</div><span class="phone-status off">off</span></div>
                    </div>
                    <div class="phone-total"><span>TODAY</span><span class="phone-total-value">₪1,240</span></div>
                </div>
            </div>
        `
    },
    "03": {
        num: "03",
        title: "RL-Scientist",
        status: "research experiment",
        desc: "A local reinforcement-learning research experiment. A local LLM proposes experiment changes, training runs, results get evaluated, and research memory is maintained across runs.",
        features: ["Local LLM via Ollama","Automatic experiment proposal & evaluation","Reinforcement-learning training loops","Persistent experiment memory","FastAPI orchestration layer"],
        tech: ["Python", "Ollama", "RL", "FastAPI", "Local LLMs"],
        mockup: `
            <div class="mockup-chrome">
                <span class="mockup-dot mockup-red"></span>
                <span class="mockup-dot mockup-yellow"></span>
                <span class="mockup-dot mockup-green"></span>
                <span class="mockup-title">rl-scientist · local</span>
            </div>
            <div class="mockup-body mockup-rls">
                <div class="rls-top"><span>EXPERIMENT · ITER 47 / 100</span><span class="rls-live"><span class="rls-live-dot"></span>LIVE</span></div>
                <div class="rls-grid">
                    <div class="rls-card">
                        <div class="rls-card-title">Agent</div>
                        <div class="rls-stat"><span>reward</span><span>0.847</span></div>
                        <div class="rls-stat"><span>loss</span><span>0.023</span></div>
                        <div class="rls-stat"><span>steps</span><span>12.4k</span></div>
                        <div class="rls-card-title" style="margin-top:8px">LLM proposal</div>
                        <div class="rls-log">
                            <div class="rls-log-entry"><span class="rls-log-time">01:12</span><span>increase entropy</span></div>
                            <div class="rls-log-entry"><span class="rls-log-time">01:24</span><span>tune lr → 3e-4</span></div>
                            <div class="rls-log-entry"><span class="rls-log-time">01:37</span><span>add lstm layer</span></div>
                        </div>
                    </div>
                    <div class="rls-card">
                        <div class="rls-card-title">Reward curve</div>
                        <svg class="rls-chart" viewBox="0 0 200 60" preserveAspectRatio="none">
                            <polyline points="0,54 20,48 40,50 60,40 80,42 100,30 120,32 140,20 160,22 180,10 200,14"
                                      fill="none" stroke="#4fc4dc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rls-line"/>
                        </svg>
                        <div class="rls-card-title" style="margin-top:10px">Reward</div>
                        <div class="rls-stat"><span>best</span><span>0.847</span></div>
                        <div class="rls-stat"><span>mean</span><span>0.712</span></div>
                    </div>
                </div>
            </div>
        `
    },
    "04": {
        num: "04",
        title: "Listing Lab",
        status: "prototype",
        desc: "A local-first AI-assisted listing creation tool. Helps sellers generate product titles, descriptions, tags, and price suggestions using local models.",
        features: ["Local inference via Ollama & LM Studio","Automated title + description generation","Smart tags & keyword suggestions","Market-based price suggestions","Streamlined seller workflow"],
        tech: ["Ollama", "LM Studio", "Local AI", "Product Data"],
        mockup: `
            <div class="mockup-chrome">
                <span class="mockup-dot mockup-red"></span>
                <span class="mockup-dot mockup-yellow"></span>
                <span class="mockup-dot mockup-green"></span>
                <span class="mockup-title">listing-lab · ollama</span>
            </div>
            <div class="mockup-body mockup-split">
                <div class="split-left">
                    <div class="split-title"><span>input</span><span>✦</span></div>
                    <div class="split-input"><label>product</label><div class="split-input-value typing">Vintage denim jacket</div></div>
                    <div class="split-input"><label>condition</label><div class="split-input-value">Good · size M</div></div>
                    <div class="split-input"><label>category</label><div class="split-input-value">Fashion → outerwear</div></div>
                </div>
                <div class="split-right">
                    <div class="split-title"><span>generated</span><span class="split-spark">✦</span></div>
                    <div class="split-output">Vintage 90s Denim Jacket · Men's Medium</div>
                    <div class="split-output" style="font-weight:600; font-size:0.55rem;">Classic washed denim with original hardware. Soft broken-in feel.</div>
                    <div class="split-tags"><span class="split-tag">vintage</span><span class="split-tag">denim</span><span class="split-tag">90s</span><span class="split-tag">menswear</span></div>
                    <div class="split-price"><span>suggested price</span><span class="split-price-value">₪185</span></div>
                </div>
            </div>
        `
    },
    "05": {
        num: "05",
        title: "AIMaze",
        status: "simulation",
        desc: "A Unity reinforcement-learning experiment. An AI agent learns to navigate mazes, avoid traps, and interact with buttons inside a scalable grid-based environment.",
        features: ["Unity ML-Agents integration","RL for maze navigation","Trap avoidance & hazard detection","Button interaction & puzzles","Scalable grid-based levels"],
        tech: ["Unity", "RL", "Simulation", "C#", "ML-Agents"],
        mockup: `
            <div class="mockup-chrome">
                <span class="mockup-dot mockup-red"></span>
                <span class="mockup-dot mockup-yellow"></span>
                <span class="mockup-dot mockup-green"></span>
                <span class="mockup-title">unity · aimaze.unity</span>
            </div>
            <div class="mockup-body mockup-maze">
                <div class="maze-top"><span>ML-Agents · training</span><span class="maze-play">▶ running</span></div>
                <div class="maze-layout">
                    <div class="maze-hierarchy">
                        <div class="maze-hierarchy-item active">▸ Scene</div>
                        <div class="maze-hierarchy-item">  Maze</div>
                        <div class="maze-hierarchy-item">  Agent</div>
                        <div class="maze-hierarchy-item">  Goal</div>
                        <div class="maze-hierarchy-item">  Traps</div>
                    </div>
                    <div class="maze-scene">
                        <div class="maze-grid">
                            <div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell wall"></div><div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell"></div>
                            <div class="maze-cell wall"></div><div class="maze-cell wall"></div><div class="maze-cell"></div><div class="maze-cell wall"></div><div class="maze-cell"></div><div class="maze-cell wall"></div><div class="maze-cell"></div>
                            <div class="maze-cell"></div><div class="maze-cell agent"></div><div class="maze-cell"></div><div class="maze-cell wall"></div><div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell"></div>
                            <div class="maze-cell"></div><div class="maze-cell wall"></div><div class="maze-cell wall"></div><div class="maze-cell wall"></div><div class="maze-cell wall"></div><div class="maze-cell wall"></div><div class="maze-cell"></div>
                            <div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell"></div>
                            <div class="maze-cell wall"></div><div class="maze-cell wall"></div><div class="maze-cell"></div><div class="maze-cell wall"></div><div class="maze-cell wall"></div><div class="maze-cell wall"></div><div class="maze-cell"></div>
                            <div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell goal"></div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }
};

// ============================================================
// HTML DECO LAYER — floating symbols
// ============================================================
(function buildDecoLayer() {
    let layer = document.getElementById('deco-layer');
    if (!layer) {
        layer = document.createElement('div');
        layer.id = 'deco-layer';
        document.body.appendChild(layer);
    }
    const symbols = ['✦','◆','●','▲','⬢','⬡','✧','✺','</>','{ }','[ ]','01','10','λ','π','🤖','⚙','☁','★','♥','⚡','∫','∑'];
    const colors = ['#4fc4dc', '#6fdba0', '#a690f0', '#7fc4f0', '#223b4a', '#ff6b9d', '#ffa878'];
    const total = window.innerWidth < 768 ? 40 : 90;
    for (let i = 0; i < total; i++) {
        const el = document.createElement('div');
        el.className = 'deco';
        el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        el.style.color = colors[Math.floor(Math.random() * colors.length)];
        el.style.left = Math.random() * 100 + 'vw';
        el.style.fontSize = (12 + Math.random() * 26) + 'px';
        el.style.opacity = (0.35 + Math.random() * 0.55).toString();
        const duration = 7 + Math.random() * 12;
        el.style.animation = `floatUp ${duration}s linear ${Math.random() * duration}s infinite`;
        layer.appendChild(el);
    }
    const anchored = [
        { side: 'left',  top: '18%', emoji: '✦', size: 46 },
        { side: 'right', top: '26%', emoji: '◆', size: 38 },
        { side: 'left',  top: '48%', emoji: '☁', size: 42 },
        { side: 'right', top: '62%', emoji: '⚙', size: 36 },
        { side: 'left',  top: '78%', emoji: '★', size: 44 },
        { side: 'right', top: '10%', emoji: '♥', size: 32 }
    ];
    anchored.forEach((a, i) => {
        const el = document.createElement('div');
        el.className = 'deco';
        el.textContent = a.emoji;
        el.style.color = colors[i % colors.length];
        el.style.fontSize = a.size + 'px';
        el.style.opacity = '0.8';
        if (a.side === 'left') el.style.left = '3vw'; else el.style.right = '3vw';
        el.style.top = a.top;
        el.style.animation = `bobFloat ${2.5 + i * 0.4}s ease-in-out infinite`;
        el.style.animationDelay = (i * 0.3) + 's';
        layer.appendChild(el);
    });
})();

// ============================================================
// CURSOR + TRAIL
// ============================================================
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');
let lastTrailTime = 0;
window.addEventListener('mousemove', (e) => {
    if (cursorDot) { cursorDot.style.left = e.clientX + 'px'; cursorDot.style.top = e.clientY + 'px'; }
    if (cursorOutline && typeof gsap !== 'undefined') {
        gsap.to(cursorOutline, { left: e.clientX, top: e.clientY, duration: 0.12, ease: "power2.out" });
    }
    const now = performance.now();
    if (now - lastTrailTime > 55) {
        lastTrailTime = now;
        const t = document.createElement('div');
        t.className = 'cursor-trail';
        t.style.left = e.clientX + 'px';
        t.style.top = e.clientY + 'px';
        const c = ['#4fc4dc', '#6fdba0', '#a690f0'][Math.floor(Math.random() * 3)];
        t.style.background = c;
        t.style.boxShadow = `0 0 10px ${c}`;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 700);
    }
});
document.querySelectorAll('a, button, .nav-link, .project-card, .modal-close, .email-btn, .back-top, .chip, .lab-box').forEach(t => {
    t.addEventListener('mouseenter', () => cursorOutline && cursorOutline.classList.add('hover'));
    t.addEventListener('mouseleave', () => cursorOutline && cursorOutline.classList.remove('hover'));
});

// ============================================================
// THREE.JS
// ============================================================
const container = document.getElementById('webgl-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfe3ff);
scene.fog = new THREE.FogExp2(0xbfe3ff, 0.012);
const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(0, 5, 22);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);
const isMobile = window.innerWidth < 768;
scene.add(new THREE.AmbientLight(0xe8f6ff, 0.95));
const sunLight = new THREE.DirectionalLight(0xffffff, 0.95); sunLight.position.set(10, 18, 10); scene.add(sunLight);
const coolBounce = new THREE.DirectionalLight(0x8fd8ff, 0.55); coolBounce.position.set(-10, 5, -8); scene.add(coolBounce);
const mintBounce = new THREE.DirectionalLight(0xb5f0d0, 0.45); mintBounce.position.set(8, 3, -10); scene.add(mintBounce);

const world = new THREE.Group();
scene.add(world);

const M = {
    white: new THREE.MeshPhysicalMaterial({ color: 0xf5fbff, roughness: 0.5, clearcoat: 0.4 }),
    sky: new THREE.MeshPhysicalMaterial({ color: 0x7fc4f0, roughness: 0.55, clearcoat: 0.4 }),
    skySoft: new THREE.MeshPhysicalMaterial({ color: 0xbfe3ff, roughness: 0.6, clearcoat: 0.35 }),
    cyan: new THREE.MeshPhysicalMaterial({ color: 0xa8e8f5, roughness: 0.5, clearcoat: 0.5 }),
    cyanDeep: new THREE.MeshPhysicalMaterial({ color: 0x4fc4dc, roughness: 0.45, clearcoat: 0.5 }),
    mint: new THREE.MeshPhysicalMaterial({ color: 0xb5f0d0, roughness: 0.5, clearcoat: 0.5 }),
    mintDeep: new THREE.MeshPhysicalMaterial({ color: 0x6fdba0, roughness: 0.5, clearcoat: 0.5 }),
    lav: new THREE.MeshPhysicalMaterial({ color: 0xd5c8ff, roughness: 0.55, clearcoat: 0.4 }),
    lavDeep: new THREE.MeshPhysicalMaterial({ color: 0xa690f0, roughness: 0.5, clearcoat: 0.45 }),
    peach: new THREE.MeshPhysicalMaterial({ color: 0xffd9b8, roughness: 0.55, clearcoat: 0.4 }),
    brown: new THREE.MeshPhysicalMaterial({ color: 0x8b6a6a, roughness: 0.75, clearcoat: 0.15 }),
    ink: new THREE.MeshBasicMaterial({ color: 0x223b4a }),
    whiteBasic: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    blush: new THREE.MeshBasicMaterial({ color: 0xffb3ce, transparent: true, opacity: 0.75 })
};

function createIsland(radius, grassMat) {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.5), grassMat);
    top.scale.y = 0.55; top.position.y = 0.15; g.add(top);
    const bottom = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.95, radius * 1.6, 16, 3), M.brown);
    bottom.rotation.x = Math.PI; bottom.position.y = -radius * 0.7; g.add(bottom);
    return g;
}
function createTree(x, z, canopyMat) {
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.3, 8), M.brown);
    trunk.position.y = 0.15; t.add(trunk);
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 14), canopyMat);
    canopy.position.y = 0.42; t.add(canopy);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
    hl.position.set(0.07, 0.5, 0.08); t.add(hl);
    t.position.set(x, 0.15, z);
    t.userData = { canopy, swayPhase: Math.random() * Math.PI * 2 };
    return t;
}
function createChibi(bodyMat, innerEarMat) {
    const bot = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 18), bodyMat);
    body.scale.y = 0.85; body.position.y = 0.22; bot.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 24), M.white);
    head.scale.set(1.05, 0.95, 1); head.position.y = 0.75; bot.add(head);
    const earGeo = new THREE.SphereGeometry(0.13, 20, 14); earGeo.scale(1, 1.4, 0.6);
    const earL = new THREE.Mesh(earGeo, M.white); earL.position.set(-0.22, 1.05, 0); earL.rotation.z = 0.25; bot.add(earL);
    const earR = new THREE.Mesh(earGeo, M.white); earR.position.set(0.22, 1.05, 0); earR.rotation.z = -0.25; bot.add(earR);
    const innerGeo = new THREE.SphereGeometry(0.07, 16, 12); innerGeo.scale(1, 1.3, 0.5);
    const inL = new THREE.Mesh(innerGeo, innerEarMat); inL.position.set(-0.22, 1.05, 0.04); inL.rotation.z = 0.25; bot.add(inL);
    const inR = new THREE.Mesh(innerGeo, innerEarMat); inR.position.set(0.22, 1.05, 0.04); inR.rotation.z = -0.25; bot.add(inR);
    const eyeGeo = new THREE.SphereGeometry(0.06, 16, 12); eyeGeo.scale(1, 1.15, 0.4);
    const eyeL = new THREE.Mesh(eyeGeo, M.ink); eyeL.position.set(-0.12, 0.78, 0.34); bot.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, M.ink); eyeR.position.set(0.12, 0.78, 0.34); bot.add(eyeR);
    const shineGeo = new THREE.SphereGeometry(0.018, 8, 8);
    const sL = new THREE.Mesh(shineGeo, M.whiteBasic); sL.position.set(-0.10, 0.81, 0.37); bot.add(sL);
    const sR = new THREE.Mesh(shineGeo, M.whiteBasic); sR.position.set(0.14, 0.81, 0.37); bot.add(sR);
    const blushGeo = new THREE.SphereGeometry(0.05, 14, 10); blushGeo.scale(1, 0.55, 0.25);
    const blL = new THREE.Mesh(blushGeo, M.blush); blL.position.set(-0.24, 0.68, 0.30); bot.add(blL);
    const blR = new THREE.Mesh(blushGeo, M.blush); blR.position.set(0.24, 0.68, 0.30); bot.add(blR);
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 12, Math.PI), M.ink);
    mouth.position.set(0, 0.68, 0.36); mouth.rotation.z = Math.PI; bot.add(mouth);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 6), M.brown);
    ant.position.y = 1.20; bot.add(ant);
    const tipMat = new THREE.MeshBasicMaterial({ color: bodyMat.color });
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), tipMat); tip.position.y = 1.32; bot.add(tip);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), new THREE.MeshBasicMaterial({ color: bodyMat.color, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending }));
    glow.position.y = 1.32; bot.add(glow);
    bot.userData = { head, eyeL, eyeR, tip, glow, phase: Math.random() * Math.PI * 2 };
    return bot;
}

const allIslands = [];
const mascots = [];
const trees = [];
const mushrooms = [];

const centerIsland = createIsland(1.8, M.mint);
centerIsland.position.set(0, -1, 0);
world.add(centerIsland);
allIslands.push(centerIsland);

const ringColors = [M.sky, M.mint, M.lav, M.peach, M.cyan, M.skySoft, M.mintDeep, M.lavDeep];
const RING_RADIUS = 20;
for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * RING_RADIUS;
    const z = Math.sin(angle) * RING_RADIUS;
    const y = -1 + Math.sin(i * 2.1) * 3;
    const radius = 2 + Math.random() * 1;
    const island = createIsland(radius, ringColors[i]);
    island.position.set(x, y, z);
    island.userData = { baseY: y, phase: Math.random() * Math.PI * 2 };
    world.add(island);
    allIslands.push(island);
    const behaviors = ['hop', 'spin', 'wave', 'peek', 'wander', 'float', 'bounce', 'orbit'];
    const bodyMats = [M.sky, M.mint, M.lav, M.peach, M.cyan, M.skySoft, M.mintDeep, M.lavDeep];
    const bot = createChibi(bodyMats[i], M.mint);
    bot.position.set(0, 0.15, 0);
    bot.userData.behavior = behaviors[i];
    bot.userData.baseY = 0.15;
    bot.userData.phase = Math.random() * Math.PI * 2;
    bot.userData.orbitCenter = new THREE.Vector3(0, 0.15, 0);
    island.add(bot);
    mascots.push(bot);
    for (let t = 0; t < 2; t++) {
        const tree = createTree((Math.random() - 0.5) * radius * 0.9, (Math.random() - 0.5) * radius * 0.9, [M.mint, M.lav, M.sky][Math.floor(Math.random() * 3)]);
        tree.scale.setScalar(0.7);
        island.add(tree);
        trees.push(tree);
    }
}
[[-1, 0.3, M.mint], [-1.1, -0.4, M.lav], [1, 0.4, M.mint], [0.9, -0.7, M.sky]].forEach(d => {
    const t = createTree(d[0], d[1], d[2]);
    centerIsland.add(t); trees.push(t);
});
for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.6 + Math.random() * 1.0;
    const m = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.1, 6), M.white);
    stem.position.y = 0.05; m.add(stem);
    const capColor = [0x4fc4dc, 0x6fdba0, 0xa690f0][i % 3];
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), new THREE.MeshBasicMaterial({ color: capColor }));
    cap.scale.y = 0.8; cap.position.y = 0.1; m.add(cap);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), new THREE.MeshBasicMaterial({ color: capColor, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending }));
    glow.position.y = 0.1; m.add(glow);
    m.position.set(Math.cos(angle) * radius, 0.15, Math.sin(angle) * radius);
    m.userData = { glow, phase: Math.random() * Math.PI * 2 };
    centerIsland.add(m); mushrooms.push(m);
}
const rings = [];
for (let i = 0; i < 4; i++) {
    const ringGeo = new THREE.TorusGeometry(14 + i * 4, 0.12, 8, 140);
    const ringMat = new THREE.MeshBasicMaterial({ color: [0x4fc4dc, 0x6fdba0, 0xa690f0, 0xffa878][i], transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2 + (i * 0.4); ring.rotation.z = i * 0.6;
    world.add(ring); rings.push(ring);
}
const glyphs = [];
const glyphShapes = [new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.OctahedronGeometry(0.4), new THREE.TetrahedronGeometry(0.45), new THREE.TorusGeometry(0.32, 0.1, 8, 16), new THREE.IcosahedronGeometry(0.35)];
const glyphColors = [0x4fc4dc, 0x6fdba0, 0xa690f0, 0x7fc4f0, 0xffa878];
for (let i = 0; i < 55; i++) {
    const geo = glyphShapes[i % glyphShapes.length];
    const color = glyphColors[i % glyphColors.length];
    const mat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.4, clearcoat: 0.7, emissive: color, emissiveIntensity: 0.25 });
    const g = new THREE.Mesh(geo, mat);
    const angle = (i / 55) * Math.PI * 2;
    const radius = 8 + Math.random() * 16;
    const y = -4 + Math.random() * 16;
    g.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    g.userData = { baseY: y, phase: Math.random() * Math.PI * 2, rotSpeedX: (Math.random() - 0.5) * 2, rotSpeedY: (Math.random() - 0.5) * 2, orbitSpeed: (Math.random() - 0.5) * 0.8, orbitAngle: angle, orbitRadius: radius };
    world.add(g); glyphs.push(g);
}
const petalCount = isMobile ? 150 : 400;
const petalGeo = new THREE.BufferGeometry();
const petalPos = new Float32Array(petalCount * 3);
const petalCol = new Float32Array(petalCount * 3);
const petalPalette = [new THREE.Color(0xbfe3ff), new THREE.Color(0x7fc4f0), new THREE.Color(0xb5f0d0), new THREE.Color(0xa8e8f5), new THREE.Color(0xd5c8ff), new THREE.Color(0xffd9b8)];
for (let i = 0; i < petalCount; i++) {
    petalPos[i*3]   = (Math.random() - 0.5) * 60;
    petalPos[i*3+1] = (Math.random() - 0.5) * 40 + 5;
    petalPos[i*3+2] = (Math.random() - 0.5) * 60;
    const c = petalPalette[Math.floor(Math.random() * petalPalette.length)];
    petalCol[i*3] = c.r; petalCol[i*3+1] = c.g; petalCol[i*3+2] = c.b;
}
petalGeo.setAttribute('position', new THREE.BufferAttribute(petalPos, 3));
petalGeo.setAttribute('color', new THREE.BufferAttribute(petalCol, 3));
const petals = new THREE.Points(petalGeo, new THREE.PointsMaterial({ size: 0.28, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, sizeAttenuation: true }));
scene.add(petals);
const petalVel = [];
for (let i = 0; i < petalCount; i++) {
    petalVel.push({ vy: -0.06 - Math.random() * 0.05, vx: (Math.random() - 0.5) * 0.03, vz: (Math.random() - 0.5) * 0.03, swayPhase: Math.random() * Math.PI * 2, swaySpeed: 1.2 + Math.random() * 2 });
}
const starCount = isMobile ? 250 : 600;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(starCount * 3);
const starCol = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
    const r = 40 + Math.random() * 60;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    starPos[i*3+1] = r * Math.cos(phi) * 0.7 + 5;
    starPos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
    const c = petalPalette[Math.floor(Math.random() * petalPalette.length)];
    starCol[i*3] = c.r; starCol[i*3+1] = c.g; starCol[i*3+2] = c.b;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.4, vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
scene.add(stars);

const clock = new THREE.Clock();
let mouseX = 0, mouseY = 0;
let smoothMouseX = 0, smoothMouseY = 0;
window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
});
const cameraBase = { x: 0, y: 5, z: 22 };
const camLookAt = { x: 0, y: 0, z: 0 };

function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    smoothMouseX += (mouseX - smoothMouseX) * 0.05;
    smoothMouseY += (mouseY - smoothMouseY) * 0.05;
    world.rotation.y = t * 0.08 + Math.sin(t * 0.2) * 0.06;
    world.position.y = Math.sin(t * 0.5) * 0.4;
    trees.forEach(tree => {
        if (tree.userData.canopy) {
            tree.rotation.z = Math.sin(t * 1.4 + tree.userData.swayPhase) * 0.12;
            tree.rotation.x = Math.cos(t * 1.1 + tree.userData.swayPhase) * 0.08;
        }
    });
    mushrooms.forEach(m => { m.userData.glow.scale.setScalar(1 + Math.sin(t * 2.2 + m.userData.phase) * 0.35); });
    mascots.forEach(bot => {
        const u = bot.userData;
        const blinkScale = Math.sin(t * 2 + u.phase) > 0.96 ? 0.08 : 1;
        u.eyeL.scale.y = blinkScale;
        u.eyeR.scale.y = blinkScale;
        u.glow.scale.setScalar(1 + Math.sin(t * 3.5 + u.phase) * 0.35);
        u.tip.scale.setScalar(1 + Math.sin(t * 3.5 + u.phase) * 0.5);
        switch (u.behavior) {
            case 'hop': bot.position.y = u.baseY + Math.abs(Math.sin(t * 4)) * 0.9; bot.rotation.z = Math.sin(t * 8) * 0.15; break;
            case 'spin': bot.rotation.y = t * 3.5; bot.position.y = u.baseY + Math.sin(t * 1.8) * 0.2; break;
            case 'wave': bot.rotation.z = Math.sin(t * 6) * 0.4; bot.rotation.y = Math.sin(t * 1.4) * 0.8; bot.position.y = u.baseY + Math.sin(t * 2.5) * 0.25; break;
            case 'peek': bot.position.y = u.baseY + 0.7 + Math.sin(t * 2.4) * 0.25; bot.rotation.y = Math.sin(t * 1.1) * 1.4; break;
            case 'wander': bot.position.x = u.orbitCenter.x + Math.sin(t * 0.9 + u.phase) * 1.1; bot.position.z = u.orbitCenter.z + Math.cos(t * 1.05 + u.phase) * 1.1; bot.position.y = u.baseY + Math.abs(Math.sin(t * 2.4)) * 0.2; bot.rotation.y = Math.cos(t * 0.9 + u.phase) * 0.9; break;
            case 'float': bot.position.y = u.baseY + 0.6 + Math.sin(t * 1.6 + u.phase) * 0.5; bot.rotation.z = Math.sin(t * 1.0 + u.phase) * 0.25; bot.rotation.y = Math.sin(t * 0.7) * 0.8; break;
            case 'bounce': bot.position.y = u.baseY + Math.sin(t * 5) * 0.55 + 0.55; bot.rotation.x = Math.sin(t * 5) * 0.25; break;
            case 'orbit': { const a = t * 2 + u.phase; bot.position.x = Math.cos(a) * 1.4; bot.position.z = Math.sin(a) * 1.4; bot.position.y = u.baseY + Math.sin(t * 2.5) * 0.35; bot.rotation.y = -a + Math.PI / 2; break; }
        }
    });
    allIslands.forEach((island, i) => {
        if (i === 0) return;
        island.position.y = island.userData.baseY + Math.sin(t * 0.8 + island.userData.phase) * 0.7;
    });
    rings.forEach((ring, i) => {
        ring.rotation.z += 0.012 * (i % 2 === 0 ? 1 : -1);
        ring.rotation.x = Math.PI / 2 + Math.sin(t * 0.5 + i) * 0.5;
    });
    glyphs.forEach(g => {
        const u = g.userData;
        g.rotation.x += u.rotSpeedX * 0.025;
        g.rotation.y += u.rotSpeedY * 0.025;
        u.orbitAngle += u.orbitSpeed * 0.025;
        g.position.x = Math.cos(u.orbitAngle) * u.orbitRadius;
        g.position.z = Math.sin(u.orbitAngle) * u.orbitRadius;
        g.position.y = u.baseY + Math.sin(t * 1.6 + u.phase) * 1.0;
    });
    const positions = petals.geometry.attributes.position.array;
    for (let i = 0; i < petalCount; i++) {
        const v = petalVel[i];
        positions[i*3]   += v.vx + Math.sin(t * v.swaySpeed + v.swayPhase) * 0.02;
        positions[i*3+1] += v.vy;
        positions[i*3+2] += v.vz;
        if (positions[i*3+1] < -20) {
            positions[i*3]   = (Math.random() - 0.5) * 60;
            positions[i*3+1] = 20 + Math.random() * 8;
            positions[i*3+2] = (Math.random() - 0.5) * 60;
        }
    }
    petals.geometry.attributes.position.needsUpdate = true;
    stars.rotation.y = t * 0.02;
    camera.position.x = cameraBase.x + smoothMouseX * 1.5;
    camera.position.y = cameraBase.y - smoothMouseY * 1.2;
    camera.position.z = cameraBase.z;
    camera.lookAt(camLookAt.x, camLookAt.y, camLookAt.z);
    renderer.render(scene, camera);
}

// ============================================================
// GSAP SCROLL
// ============================================================
if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    gsap.to(cameraBase, { x: -12, y: 3, z: 14, scrollTrigger: { trigger: "#about", start: "top bottom", end: "top top", scrub: 1.4 } });
    gsap.to(camLookAt, { x: -6, y: 1, z: 0, scrollTrigger: { trigger: "#about", start: "top bottom", end: "top top", scrub: 1.4 } });
    gsap.to(cameraBase, { x: 16, y: 6, z: 12, scrollTrigger: { trigger: "#work", start: "top bottom", end: "top top", scrub: 1.4 } });
    gsap.to(camLookAt, { x: 8, y: 2, z: -4, scrollTrigger: { trigger: "#work", start: "top bottom", end: "top top", scrub: 1.4 } });
    gsap.to(cameraBase, { x: -10, y: 10, z: 16, scrollTrigger: { trigger: "#lab", start: "top bottom", end: "top top", scrub: 1.4 } });
    gsap.to(camLookAt, { x: -4, y: 1, z: 0, scrollTrigger: { trigger: "#lab", start: "top bottom", end: "top top", scrub: 1.4 } });
    gsap.to(cameraBase, { x: 0, y: 16, z: 40, scrollTrigger: { trigger: "#contact", start: "top bottom", end: "top top", scrub: 1.8 } });
    gsap.to(camLookAt, { x: 0, y: 2, z: 0, scrollTrigger: { trigger: "#contact", start: "top bottom", end: "top top", scrub: 1.8 } });
    gsap.utils.toArray('.panel').forEach(panel => {
        gsap.from(panel, { y: 120, opacity: 0, scale: 0.9, rotate: -3, duration: 1.2, ease: "back.out(1.4)", scrollTrigger: { trigger: panel, start: "top 85%", toggleActions: "play none none reverse" } });
    });
}

// ============================================================
// HERO NAME SPLIT
// ============================================================
const heroName = document.querySelector('.hero-name');
if (heroName && !heroName.querySelector('.hero-name-letter')) {
    const text = heroName.textContent.trim();
    heroName.innerHTML = '';
    text.split('').forEach(ch => {
        const span = document.createElement('span');
        span.className = 'hero-name-letter';
        span.textContent = ch === ' ' ? '\u00A0' : ch;
        heroName.appendChild(span);
    });
}

// ============================================================
// SCROLL PROGRESS + ACTIVE NAV
// ============================================================
const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll(".nav-link");
const progressFill = document.querySelector(".nav-progress-fill");
window.addEventListener("scroll", () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (progressFill) progressFill.style.width = `${(scrollTop / docHeight) * 100}%`;
    let current = "";
    sections.forEach((section) => {
        if (scrollTop >= section.offsetTop - section.clientHeight / 3) current = section.getAttribute("id");
    });
    navLinks.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href").includes(current)) link.classList.add("active");
    });
});
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// ============================================================
// MODAL — bulletproof (mockup embedded in projectData)
// ============================================================
const modal = document.getElementById('project-modal');

function openModal(id) {
    const d = projectData[id];
    if (!d || !modal) return;
    document.getElementById('modal-num').textContent = d.num;
    document.getElementById('modal-title').textContent = d.title;
    document.getElementById('modal-status').textContent = d.status;
    document.getElementById('modal-desc').textContent = d.desc;

    const visual = document.getElementById('modal-visual');
    if (visual) {
        visual.innerHTML = '<div class="mockup mockup-' + id + '">' + d.mockup + '</div>';
    }

    const fList = document.getElementById('modal-features');
    fList.innerHTML = '';
    d.features.forEach(f => {
        const li = document.createElement('li');
        li.textContent = f;
        fList.appendChild(li);
    });

    const chips = document.getElementById('modal-chips');
    chips.innerHTML = '';
    d.tech.forEach(t => {
        const s = document.createElement('span');
        s.textContent = t;
        chips.appendChild(s);
    });

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

document.addEventListener('click', (e) => {
    const card = e.target.closest('.project-card');
    if (card) { openModal(card.getAttribute('data-project')); return; }
    if (e.target.closest('.modal-close')) { closeModal(); return; }
    if (e.target === modal) closeModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) closeModal();
});

// ============================================================
// EMAIL COPY
// ============================================================
const emailBtn = document.getElementById('email-btn');
if (emailBtn) {
    const emailHint = document.getElementById('email-hint');
    const emailText = emailBtn.querySelector('.email-text');
    const originalEmail = emailBtn.getAttribute('data-email');
    emailBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(originalEmail).then(() => {
            emailBtn.classList.add('copied');
            emailText.textContent = 'copied ✦';
            emailHint.textContent = 'email is on your clipboard';
            setTimeout(() => {
                emailBtn.classList.remove('copied');
                emailText.textContent = originalEmail;
                emailHint.textContent = 'click to copy ✦';
            }, 2200);
        }).catch(() => { emailHint.textContent = `email: ${originalEmail}`; });
    });
}

const backTop = document.getElementById('back-top');
if (backTop) backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ============================================================
// LOADER
// ============================================================
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (loader && typeof gsap !== 'undefined') {
        gsap.to(loader, { opacity: 0, duration: 0.9, delay: 0.4, onComplete: () => { loader.style.display = 'none'; } });
    }
});
setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader && loader.style.display !== 'none') {
        loader.style.opacity = '0';
        setTimeout(() => { loader.style.display = 'none'; }, 700);
    }
}, 4500);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches && typeof gsap !== 'undefined') {
    gsap.globalTimeline.timeScale(0.1);
}

animate();