/* ============================================================
   ProjectPanels.js — v5
   ============================================================ */

import * as THREE from 'three';
export const CANVAS_W = 1280;
export const CANVAS_H = 800;
export const PANEL_W = 6.8;
export const PANEL_H = PANEL_W * (CANVAS_H / CANVAS_W);
/* ============================================================
   AAUP shared state — driven by AaupsNarrative.js
   The panel reads from this; the narrative writes to it.
   ============================================================ */
export const aaupState = {
    semester: 0,                       // 0, 1, 2 (three semesters cycle)
    checks: [false, false, false, false],
    nextSemPressed: false,
    resetPressed: false,
    themeColor: '#4d8bf5'              // driven by the current controller
};

export function resetAaupState() {
    aaupState.semester = 0;
    aaupState.checks = [false, false, false, false];
    aaupState.nextSemPressed = false;
    aaupState.resetPressed = false;
    aaupState.themeColor = '#4d8bf5';
}
const PANEL_Y = 4.85;
const PANEL_Z = 4.0;
const FPS_BY_LEVEL = { high: 24, medium: 18, low: 11 };


function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
function lerp(a, b, u) { return a + (b - a) * u; }
function easeOutCubic(u) { return 1 - Math.pow(1 - clamp01(u), 3); }
function easeOutQuart(u) { return 1 - Math.pow(1 - clamp01(u), 4); }
function easeInOutCubic(u) { u = clamp01(u); return u < 0.5 ? 4*u*u*u : 1 - Math.pow(-2*u+2,3)/2; }
function hash01(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function fmt(n, d) { return Number(n).toFixed(d); }

function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
}

function drawChrome(ctx, W, title, statusText, statusColor) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, 56);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, 55, W, 1);
    const dots = ['#3a2a2e', '#3a3526', '#263a2d'];
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = dots[i];
        ctx.beginPath();
        ctx.arc(34 + i * 24, 28, 7, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fillStyle = '#5a616b';
    ctx.font = '500 16px "JetBrains Mono", monospace';
    ctx.fillText(title, 130, 34);
    if (statusText) {
        ctx.fillStyle = statusColor || '#3fca7d';
        ctx.font = '600 14px "JetBrains Mono", monospace';
        const tw = ctx.measureText(statusText).width;
        ctx.fillText(statusText, W - 34 - tw, 34);
    }
}

// ── Hand target recorder ──
// Each panel calls drawHand(cx, cy, press) to say where the hand should be.
// We just record it here — the 3D HandCursor in the scene reads this.
const _handTarget = { visible: false, x: 0, y: 0, press: 0 };

export function getHandTarget() {
    return _handTarget;
}

function drawHand(ctx, x, y, press) {
    _handTarget.visible = true;
    _handTarget.x = x;
    _handTarget.y = y;
    _handTarget.press = press || 0;
}

function drawFallback(ctx, W, H, t, title) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);
    drawChrome(ctx, W, title || 'panel', '● IDLE', '#4a525c');
}

const PANEL_SPECS = [
    { key: 'about',       title: 'about.md',     fn: () => typeof drawAbout        === 'function' ? drawAbout        : null },
    { key: 'aaup',        title: 'aaup-planner', fn: () => typeof drawAAUP         === 'function' ? drawAAUP         : null },
    { key: 'trades',      title: 'trades',       fn: () => typeof drawTrades       === 'function' ? drawTrades       : null },
    { key: 'rlscientist', title: 'rl-scientist', fn: () => typeof drawRLScientist  === 'function' ? drawRLScientist  : null },
    { key: 'listinglab',  title: 'listing-lab',  fn: () => typeof drawListingLab   === 'function' ? drawListingLab   : null },
    { key: 'aimaze',      title: 'aimaze',       fn: () => typeof drawAIMaze       === 'function' ? drawAIMaze       : null },
    { key: 'languages',   title: 'languages',    fn: () => typeof drawLanguages    === 'function' ? drawLanguages    : null },
    { key: 'frameworks',  title: 'frameworks',   fn: () => typeof drawFrameworks   === 'function' ? drawFrameworks   : null },
    { key: 'aidata',      title: 'ai-data',      fn: () => typeof drawAIData       === 'function' ? drawAIData       : null },
    { key: 'other',       title: 'other',        fn: () => typeof drawOther        === 'function' ? drawOther        : null }
];

export class ProjectPanels {
    constructor(scene, quality) {
        this.scene = scene;
        this.index = -1;
        this.opacity = 0;
        this.redrawAcc = 0;
        this.frameInterval = 1 / FPS_BY_LEVEL.high;
        this.panels = PANEL_SPECS.map((spec, i) => this._buildPanel(spec, i));
        this.count = this.panels.length;
        if (quality && quality.register) {
            quality.register((level) => {
                this.frameInterval = 1 / (FPS_BY_LEVEL[level] || FPS_BY_LEVEL.medium);
            });
        }
    }

    _buildPanel(spec, index) {
        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_W;
        canvas.height = CANVAS_H;
        const ctx = canvas.getContext('2d', { alpha: false });

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        texture.colorSpace = THREE.SRGBColorSpace;

        const screen = new THREE.Mesh(
            new THREE.PlaneGeometry(PANEL_W, PANEL_H),
            new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })
        );
        const bezel = new THREE.Mesh(
            new THREE.PlaneGeometry(PANEL_W + 0.16, PANEL_H + 0.16),
            new THREE.MeshBasicMaterial({ color: 0x0a1220, transparent: true, opacity: 0, depthWrite: false })
        );
        bezel.position.z = -0.012;

        const glow = new THREE.Mesh(
            new THREE.PlaneGeometry(PANEL_W + 0.9, PANEL_H + 0.9),
            new THREE.MeshBasicMaterial({ color: 0x4d8bf5, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
        );
        glow.position.z = -0.024;

        const group = new THREE.Group();
        group.add(glow, bezel, screen);
        group.position.set(0, PANEL_Y, PANEL_Z);
        group.visible = false;
        group.renderOrder = 12;
        this.scene.add(group);

        const panel = {
            index, key: spec.key, title: spec.title,
            canvas, ctx, texture, group, screen, bezel, glow,
            draw: spec.fn(),
            localTime: 0, dormant: true, broken: false
        };
        this._paint(panel);
        return panel;
    }

    _paint(panel) {
        const { ctx } = panel;
        _handTarget.visible = false;    // ← ADD THIS LINE
        try {
            if (panel.draw && !panel.broken) panel.draw(ctx, CANVAS_W, CANVAS_H, panel.localTime);
            else drawFallback(ctx, CANVAS_W, CANVAS_H, panel.localTime, panel.title);
        } catch (err) {
        
        }
        panel.texture.needsUpdate = true;
    }

    setActive(index) {
        if (index === this.index) return;
        const prev = this.panels[this.index];
        if (prev) prev.group.visible = false;
        this.index = index;
        const next = this.panels[index];
        if (!next) return;
        if (next.dormant) { next.localTime = 0; next.dormant = false; }
        next.group.visible = true;
        this.redrawAcc = this.frameInterval;
    }

    setOpacity(o) {
        this.opacity = clamp01(o);
        const p = this.panels[this.index];
        if (!p) return;
        p.screen.material.opacity = this.opacity;
        p.bezel.material.opacity = this.opacity * 0.92;
        p.glow.material.opacity = this.opacity * 0.30;
        p.group.visible = this.opacity >= 0.02;
    }

    setAccentColor(hex) {
        this.panels.forEach(p => p.glow.material.color.set(hex));
    }

    update(dt, camera, elapsed) {
        const p = this.panels[this.index];
        if (!p) return;
        if (this.opacity >= 0.02) {
            p.dormant = false;
            p.localTime += dt;
            this.redrawAcc += dt;
            if (this.redrawAcc >= this.frameInterval) {
                this.redrawAcc = 0;
                this._paint(p);
            }
        } else if (!p.dormant) {
            p.dormant = true;
        }
        if (!p.group.visible) return;
        p.group.lookAt(camera.position);
        p.group.position.y = PANEL_Y + Math.sin(elapsed * 0.6) * 0.045;
    }
}

// ============================================================
// DRAW FUNCTIONS
// ============================================================

// ── ABOUT (unchanged) ────────────────────────────────────
function drawAbout(ctx, W, H, t) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);
    drawChrome(ctx, W, 'about.md', '● ONLINE');

    const cL = 80, cT = 160;
    const cycle = t % 8;
    const name1 = 'Hammam', name2 = 'Al Natsha';
    const p1 = Math.min(1, cycle / 0.9);
    const p2 = Math.min(1, Math.max(0, (cycle - 0.9) / 0.9));

    ctx.fillStyle = '#4d8bf5';
    ctx.fillRect(cL, cT - 30, 40, 2);
    ctx.font = '600 16px "JetBrains Mono", monospace';
    ctx.fillText('AI & ROBOTICS ENGINEERING', cL + 56, cT - 24);

    ctx.fillStyle = '#ededf0';
    ctx.font = '600 76px "Inter", sans-serif';
    ctx.fillText(name1.slice(0, Math.floor(p1 * name1.length)), cL, cT + 80);

    ctx.fillStyle = '#9096a0';
    ctx.fillText(name2.slice(0, Math.floor(p2 * name2.length)), cL, cT + 160);

    const bios = ['Building software, training models,', 'shipping experiments.', 'Focus: reinforcement learning and local LLMs.'];
    ctx.font = '400 24px "Inter", sans-serif';
    bios.forEach((line, i) => {
        const u = clamp01((cycle - 2 - i * 0.5) * 1.4);
        ctx.globalAlpha = easeOutCubic(u);
        ctx.fillStyle = '#9096a0';
        ctx.fillText(line, cL, cT + 260 + i * 40);
        ctx.globalAlpha = 1;
    });

    const rX = cL + 700, rW = W - rX - 80, rY = cT - 40, rH = 300;
    ctx.fillStyle = '#0d1119';
    roundRect(ctx, rX, rY, rW, rH, 12);
    ctx.fill();
    ctx.strokeStyle = '#1a2028';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('LIVE ACTIVITY', rX + 24, rY + 34);

    const colors = ['#4d8bf5', '#3fca7d', '#ffbe5c', '#b07cff'];
    for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        for (let i = 0; i <= rW - 48; i += 2) {
            const px = rX + 24 + i;
            const phase = t * (0.7 + k * 0.25) + k * 2;
            const py = rY + 120 + k * 42 + Math.sin(i * 0.022 + phase) * 12;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = colors[k];
        ctx.lineWidth = 1.6;
        ctx.globalAlpha = 0.85 - k * 0.13;
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

// ── 01 · AAUP ────────────────────────────────────────────
function drawAAUP(ctx, W, H, t) {
    const THEME = aaupState.themeColor;

    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);

    const semesterLabels = ['fall-2026', 'spring-2027', 'summer-2027'];
    const semesterCaps = ['FALL 2026', 'SPRING 2027', 'SUMMER 2027'];

    drawChrome(ctx, W, 'aaup-planner · ' + semesterLabels[aaupState.semester], '● SYNCED', THEME);

    const semesterCourses = [
        [
            { code: 'CS201',   name: 'Data Structures',  pct: 0.72 },
            { code: 'AI310',   name: 'Intro to AI',      pct: 0.41 },
            { code: 'MATH220', name: 'Linear Algebra',   pct: 0.88 },
            { code: 'ENG150',  name: 'Technical Writing',pct: 0.14 }
        ],
        [
            { code: 'CS202',   name: 'Algorithms',        pct: 0.55 },
            { code: 'AI311',   name: 'Machine Learning',  pct: 0.33 },
            { code: 'MATH221', name: 'Probability',       pct: 0.62 },
            { code: 'CS230',   name: 'Operating Systems', pct: 0.25 }
        ],
        [
            { code: 'CS303',   name: 'Computer Graphics', pct: 0.40 },
            { code: 'AI420',   name: 'Deep Learning',     pct: 0.20 },
            { code: 'CS340',   name: 'Databases',         pct: 0.50 },
            { code: 'CS310',   name: 'Software Eng.',     pct: 0.30 }
        ]
    ];
    const courses = semesterCourses[aaupState.semester];

    const sx = 60, sy = 110, rowH = 78, rowGap = 12;
    const rowStride = rowH + rowGap;

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('COURSE PLAN · 4 COURSES · 13 CR · ' + semesterCaps[aaupState.semester], sx, sy - 20);

    courses.forEach((c, i) => {
        const ry = sy + 20 + i * rowStride;
        const isDone = aaupState.checks[i];

        ctx.fillStyle = isDone ? 'rgba(63,202,125,0.08)' : '#0d1119';
        ctx.strokeStyle = isDone ? '#3fca7d' : '#1a2028';
        ctx.lineWidth = 1.5;
        roundRect(ctx, sx, ry, 520, rowH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isDone ? '#3fca7d' : THEME;
        ctx.font = '600 14px "JetBrains Mono", monospace';
        ctx.fillText(c.code, sx + 24, ry + 30);

        ctx.fillStyle = isDone ? '#d0d4dc' : '#9096a0';
        ctx.font = '500 18px "Inter", sans-serif';
        ctx.fillText(c.name, sx + 24, ry + 56);

        const barX = sx + 180, barW = 260;
        ctx.fillStyle = '#1a2028';
        roundRect(ctx, barX, ry + 46, barW, 6, 3);
        ctx.fill();

        const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        grad.addColorStop(0, isDone ? '#3fca7d' : THEME);
        grad.addColorStop(1, isDone ? '#6fdba0' : THEME);
        ctx.fillStyle = grad;
        roundRect(ctx, barX, ry + 46, barW * c.pct, 6, 3);
        ctx.fill();

        if (isDone) {
            ctx.save();
            ctx.translate(sx + 480, ry + 42);
            ctx.fillStyle = '#3fca7d';
            ctx.font = '700 30px monospace';
            ctx.fillText('✓', -12, 12);
            ctx.restore();
        }
    });

    const ccx = 860, ccy = 340, cr = 120;
    const doneCount = aaupState.checks.filter(Boolean).length;

    ctx.strokeStyle = '#1a2028';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(ccx, ccy, cr, 0, Math.PI * 2);
    ctx.stroke();

    const totalP = doneCount / courses.length;
    if (totalP > 0.005) {
        ctx.strokeStyle = THEME;
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(ccx, ccy, cr, -Math.PI / 2, -Math.PI / 2 + totalP * Math.PI * 2);
        ctx.stroke();
        ctx.lineCap = 'butt';
    }

    ctx.fillStyle = '#ededf0';
    ctx.font = '600 56px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(doneCount + '/' + courses.length, ccx, ccy + 12);
    ctx.font = '500 16px "Inter", sans-serif';
    ctx.fillStyle = '#9096a0';
    ctx.fillText('courses complete', ccx, ccy + 48);
    ctx.textAlign = 'left';

    const drawBtn = (cx, cy, w, h, label, col, pressed) => {
        const pulse = pressed ? Math.sin(((performance.now() * 0.001) % 1) * Math.PI) : 0;
        const inflate = pressed ? 1 + pulse * 0.04 : 1;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(inflate, inflate);

        ctx.fillStyle = pressed ? col + '33' : '#0d1119';
        ctx.strokeStyle = col;
        ctx.lineWidth = pressed ? 2.5 : 1.8;
        roundRect(ctx, -w / 2, -h / 2, w, h, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = col;
        ctx.font = '600 16px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, 0, 6);
        ctx.textAlign = 'left';
        ctx.restore();
    };

    drawBtn(300, 700, 260, 54, '↺ RESET PLAN', '#9096a0', aaupState.resetPressed);
    drawBtn(790, 700, 260, 54, 'NEXT SEMESTER →', THEME, aaupState.nextSemPressed);
}

// ── 02 · TRADES ──────────────────────────────────────────
function drawTrades(ctx, W, H, t) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);
    drawChrome(ctx, W, 'trades · site-04-tlv', '● OFFLINE · SYNCING');

    const pw = 620;
    const ph = H - 140;
    const px = (W - pw) / 2;
    const py = 90;

    ctx.fillStyle = '#0d1119';
    roundRect(ctx, px, py, pw, ph, 20);
    ctx.fill();
    ctx.strokeStyle = '#1a2028';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#d0d4dc';
    ctx.font = '600 16px "JetBrains Mono", monospace';
    ctx.fillText('SITE #04 · TLV', px + 30, py + 50);

    const livePulse = 0.5 + 0.5 * Math.sin(t * 3);
    ctx.fillStyle = `rgba(63,202,125,${0.5 + livePulse * 0.5})`;
    ctx.beginPath();
    ctx.arc(px + pw - 80, py + 44, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3fca7d';
    ctx.font = '600 14px "JetBrains Mono", monospace';
    ctx.fillText('LIVE', px + pw - 66, py + 50);

    // Tabs
    const tabs = ['Workers', 'Hours', 'Payroll'];
    const tabCycle = t % 15;
    const activeTab = Math.floor(tabCycle / 5);
    const tabW = (pw - 60) / 3 - 8;

    tabs.forEach((tab, i) => {
        const tx = px + 30 + i * (tabW + 8);
        const ty = py + 80;
        const isActive = i === activeTab;
        ctx.fillStyle = isActive ? 'rgba(77,139,245,0.12)' : '#12151a';
        ctx.strokeStyle = isActive ? '#4d8bf5' : '#1a2028';
        ctx.lineWidth = 1.5;
        roundRect(ctx, tx, ty, tabW, 48, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isActive ? '#ffffff' : '#666c78';
        ctx.font = '600 14px "Inter", sans-serif';
        const tw = ctx.measureText(tab).width;
        ctx.fillText(tab, tx + (tabW - tw) / 2, ty + 30);
    });

    const contentY = py + 150;

    if (activeTab === 0) {
        // WORKERS
        const workers = [
            { initial: 'A', name: 'Ahmed Mansour' },
            { initial: 'Y', name: 'Yousef Haddad' },
            { initial: 'M', name: 'Mahmoud Said' },
            { initial: 'K', name: 'Khaled Nasser' }
        ];

        const rowH = 62;
        const rowTops = workers.map((_, i) => contentY + i * (rowH + 8));

        const statuses = workers.map((_, i) => {
            const workerCycle = (t + i * 1.4) % 6;
            if (workerCycle < 2.5) return 'here';
            if (workerCycle < 3.8) return 'late';
            if (workerCycle < 4.6) return 'off';
            return 'here';
        });

        let wage = 0;
        statuses.forEach(s => { if (s === 'here') wage += 310; });

        workers.forEach((w, i) => {
            const ry = rowTops[i];
            const status = statuses[i];

            ctx.fillStyle = '#12151a';
            ctx.strokeStyle = '#1a2028';
            ctx.lineWidth = 1;
            roundRect(ctx, px + 30, ry, pw - 60, rowH, 10);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#191c22';
            ctx.beginPath();
            ctx.arc(px + 60, ry + rowH / 2, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#6ba0ff';
            ctx.font = '700 16px "Inter", sans-serif';
            ctx.fillText(w.initial, px + 54, ry + rowH / 2 + 6);

            ctx.fillStyle = '#d0d4dc';
            ctx.font = '500 16px "Inter", sans-serif';
            ctx.fillText(w.name, px + 96, ry + rowH / 2 + 6);

            const colors = {
                here: { bg: 'rgba(63,202,125,0.12)', fg: '#3fca7d' },
                late: { bg: 'rgba(255,190,92,0.12)', fg: '#ffbe5c' },
                off:  { bg: '#191c22', fg: '#5a616b' }
            };
            const c = colors[status];
            const label = status.toUpperCase();
            ctx.font = '600 12px "JetBrains Mono", monospace';
            const lw = ctx.measureText(label).width + 24;
            ctx.fillStyle = c.bg;
            roundRect(ctx, px + pw - 30 - lw, ry + rowH / 2 - 13, lw, 26, 13);
            ctx.fill();
            ctx.fillStyle = c.fg;
            ctx.fillText(label, px + pw - 30 - lw + 12, ry + rowH / 2 + 4);
        });

        const wageY = contentY + 4 * (rowH + 8) + 20;
        const wageDisplay = Math.round(wage * easeOutQuart(clamp01(t / 2)));

        ctx.fillStyle = 'rgba(77,139,245,0.1)';
        ctx.strokeStyle = 'rgba(77,139,245,0.3)';
        ctx.lineWidth = 1.5;
        roundRect(ctx, px + 30, wageY, pw - 60, 60, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#9096a0';
        ctx.font = '600 13px "JetBrains Mono", monospace';
        ctx.fillText("TODAY'S WAGES", px + 48, wageY + 36);

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 24px "JetBrains Mono", monospace';
        const totalStr = '₪' + wageDisplay.toLocaleString();
        const totW = ctx.measureText(totalStr).width;
        ctx.fillText(totalStr, px + pw - 48 - totW, wageY + 40);

    } else if (activeTab === 1) {
        // HOURS
        const workers = [
            { name: 'Ahmed Mansour', hours: [8, 9, 8, 8, 9, 0, 0] },
            { name: 'Yousef Haddad', hours: [9, 8, 8, 9, 8, 0, 0] },
            { name: 'Mahmoud Said',  hours: [7, 8, 9, 7, 8, 0, 0] },
            { name: 'Khaled Nasser', hours: [8, 8, 8, 8, 0, 0, 0] }
        ];
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

        ctx.fillStyle = '#4a525c';
        ctx.font = '600 13px "JetBrains Mono", monospace';
        ctx.fillText('WEEKLY HOURS · 32h / worker avg', px + 30, contentY + 20);

        const rowH = 78;
        workers.forEach((w, i) => {
            const ry = contentY + 50 + i * rowH;

            ctx.fillStyle = '#12151a';
            roundRect(ctx, px + 30, ry, pw - 60, rowH - 12, 10);
            ctx.fill();
            ctx.strokeStyle = '#1a2028';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = '#d0d4dc';
            ctx.font = '500 15px "Inter", sans-serif';
            ctx.fillText(w.name, px + 48, ry + 24);

            const barAreaX = px + 220;
            const barAreaW = pw - 260;
            const barW = (barAreaW - 6 * 4) / 7;
            let total = 0;

            w.hours.forEach((h, d) => {
                const bx = barAreaX + d * (barW + 4);
                const maxH = 26;
                const barH = (h / 10) * maxH;
                const by = ry + 44;

                ctx.fillStyle = '#1a2028';
                roundRect(ctx, bx, by - maxH, barW, maxH, 3);
                ctx.fill();

                if (h > 0) {
                    const grow = clamp01((t - 1 - i * 0.15 - d * 0.08) * 2);
                    const animatedH = barH * easeOutCubic(grow);
                    const grad = ctx.createLinearGradient(bx, by, bx, by - animatedH);
                    grad.addColorStop(0, '#4d8bf5');
                    grad.addColorStop(1, '#6ba0ff');
                    ctx.fillStyle = grad;
                    roundRect(ctx, bx, by - animatedH, barW, animatedH, 3);
                    ctx.fill();
                    total += h;
                }
            });

            ctx.fillStyle = '#6ba0ff';
            ctx.font = '600 14px "JetBrains Mono", monospace';
            const totStr = total + 'h';
            const totW = ctx.measureText(totStr).width;
            ctx.fillText(totStr, px + pw - 48 - totW, ry + 24);
        });

        const labelY = contentY + 50 + 4 * rowH + 4;
        const barAreaX = px + 220;
        const barAreaW = pw - 260;
        const barW = (barAreaW - 6 * 4) / 7;
        days.forEach((d, i) => {
            const bx = barAreaX + i * (barW + 4);
            ctx.fillStyle = '#4a525c';
            ctx.font = '600 11px "JetBrains Mono", monospace';
            const tw = ctx.measureText(d).width;
            ctx.fillText(d, bx + barW / 2 - tw / 2, labelY);
        });

    } else {
        // PAYROLL
        ctx.fillStyle = '#4a525c';
        ctx.font = '600 13px "JetBrains Mono", monospace';
        ctx.fillText('PAYROLL · WEEK 42 · SITE #04', px + 30, contentY + 20);

        const items = [
            { label: 'Base wages',       value: '₪18,420', color: '#d0d4dc' },
            { label: 'Overtime (8.5h)',  value: '₪  1,275', color: '#6ba0ff' },
            { label: 'Travel allowance', value: '₪    680', color: '#6ba0ff' },
            { label: 'Tax deducted',     value: '₪ -2,108', color: '#ff8a5c' },
            { label: 'Insurance',        value: '₪   -420', color: '#ff8a5c' },
            { label: 'Net payout',       value: '₪ 17,847', color: '#3fca7d', bold: true }
        ];

        items.forEach((it, i) => {
            const ry = contentY + 60 + i * 52;
            const appear = clamp01((t - i * 0.25) * 3);
            ctx.globalAlpha = easeOutCubic(appear);

            if (i === items.length - 1) {
                ctx.fillStyle = 'rgba(63,202,125,0.08)';
                ctx.strokeStyle = 'rgba(63,202,125,0.3)';
                ctx.lineWidth = 1;
                roundRect(ctx, px + 30, ry, pw - 60, 42, 8);
                ctx.fill();
                ctx.stroke();
            }

            ctx.fillStyle = '#9096a0';
            ctx.font = '500 15px "Inter", sans-serif';
            ctx.fillText(it.label, px + 48, ry + 27);

            ctx.fillStyle = it.color;
            ctx.font = (it.bold ? '700 ' : '600 ') + '17px "JetBrains Mono", monospace';
            const vw = ctx.measureText(it.value).width;
            ctx.fillText(it.value, px + pw - 48 - vw, ry + 28);

            ctx.globalAlpha = 1;
        });
    }
}
// ── 03 · RL-SCIENTIST (unchanged) ────────────────────────
function drawRLScientist(ctx, W, H, t) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);
    drawChrome(ctx, W, 'rl-scientist · run #47', '● TRAINING');

    const LOOP = 9;
    const u = (t % LOOP) / LOOP;

    let progress = 0;
    if (u < 0.10) progress = 0;
    else if (u > 0.85) progress = 0;
    else progress = easeOutCubic(clamp01((u - 0.10) / 0.75));

    const cx1 = 60, cy = 100, cw = 460;

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('AGENT METRICS', cx1, cy + 20);

    const stats = [
        ['reward / mean', (progress * 0.847).toFixed(3)],
        ['loss',          (0.85 - progress * 0.83).toFixed(3)],
        ['steps',         Math.round(progress * 12400).toLocaleString() + 'k'],
        ['episodes',      Math.round(progress * 340)]
    ];

    stats.forEach((s, i) => {
        const y = cy + 70 + i * 46;
        ctx.fillStyle = '#4a525c';
        ctx.font = '500 16px "Inter", sans-serif';
        ctx.fillText(s[0], cx1, y);
        ctx.fillStyle = '#6ba0ff';
        ctx.font = '600 20px "JetBrains Mono", monospace';
        const w = ctx.measureText(String(s[1])).width;
        ctx.fillText(String(s[1]), cx1 + cw - w, y);
    });

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('LLM PROPOSALS', cx1, cy + 320);

    const proposals = ['increase entropy → 0.015', 'learning rate → 3e-4', 'add LSTM layer'];
    proposals.forEach((p, i) => {
        const pu = clamp01((progress - 0.2 - i * 0.2) * 5);
        ctx.globalAlpha = easeOutCubic(pu);
        ctx.fillStyle = '#4d8bf5';
        ctx.font = '600 13px "JetBrains Mono", monospace';
        ctx.fillText('0' + (i + 2) + ':' + (10 + i * 12), cx1, cy + 360 + i * 34);
        ctx.fillStyle = '#b0b8c4';
        ctx.font = '500 14px "JetBrains Mono", monospace';
        ctx.fillText(p, cx1 + 70, cy + 360 + i * 34);
        ctx.globalAlpha = 1;
    });

    const cx2 = 580, cw2 = W - cx2 - 60;
    ctx.fillStyle = '#0d1119';
    ctx.strokeStyle = '#1a2028';
    ctx.lineWidth = 1.5;
    roundRect(ctx, cx2, cy, cw2, 540, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('REWARD CURVE · LAST 100 EPOCHS', cx2 + 26, cy + 34);

    const gx = cx2 + 40, gy = cy + 80, gw = cw2 - 80, gh = 340;

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(gx, gy + (gh / 5) * i);
        ctx.lineTo(gx + gw, gy + (gh / 5) * i);
        ctx.stroke();
    }

    const N = 60;
    const points = [];
    for (let i = 0; i <= N; i++) {
        const uu = i / N;
        if (uu > progress) break;
        const x = gx + uu * gw;
        const yBase = gy + gh * (0.92 - uu * 0.75);
        const jitter = Math.sin(uu * 18) * 8 * (1 - uu);
        points.push({ x, y: yBase + jitter });
    }

    if (points.length > 1) {
        const grad = ctx.createLinearGradient(0, gy, 0, gy + gh);
        grad.addColorStop(0, 'rgba(77,139,245,0.35)');
        grad.addColorStop(1, 'rgba(77,139,245,0)');
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.lineTo(points[points.length - 1].x, gy + gh);
        ctx.lineTo(points[0].x, gy + gh);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.strokeStyle = '#4d8bf5';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        const head = points[points.length - 1];
        const pulse = 0.5 + 0.5 * Math.sin(t * 6);
        ctx.fillStyle = `rgba(255,255,255,${0.6 + pulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4d8bf5';
        ctx.beginPath();
        ctx.arc(head.x, head.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('BEST REWARD', cx2 + 40, cy + 470);
    ctx.fillStyle = '#3fca7d';
    ctx.font = '600 32px "JetBrains Mono", monospace';
    ctx.fillText((progress * 0.847).toFixed(3), cx2 + 40, cy + 510);

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('IMPROVEMENT', cx2 + 300, cy + 470);
    ctx.fillStyle = '#6ba0ff';
    ctx.font = '600 32px "JetBrains Mono", monospace';
    ctx.fillText('+' + (progress * 0.328).toFixed(3), cx2 + 300, cy + 510);
}

// ── 04 · LISTING LAB — price timing fixed ────────────────
function drawListingLab(ctx, W, H, t) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);
    drawChrome(ctx, W, 'listing-lab · local', 'ollama · qwen2.5');

    const LOOP = 11;
    const u = (t % LOOP) / LOOP;

    const gap = 24;
    const cw = (W - 40 - gap * 2) / 2;
    const lx = 20, ly = 80, lh = H - 120;

    // ── Left input ──
    ctx.fillStyle = '#0d1119';
    ctx.strokeStyle = '#1a2028';
    ctx.lineWidth = 1.5;
    roundRect(ctx, lx, ly, cw, lh, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('INPUT', lx + 26, ly + 38);

    ctx.fillStyle = '#3fca7d';
    ctx.beginPath();
    ctx.arc(lx + cw - 40, ly + 34, 6, 0, Math.PI * 2);
    ctx.fill();

    const product = 'Vintage denim jacket';
    let typed = '';
    if (u > 0.06 && u < 0.28) {
        typed = product.slice(0, Math.floor(((u - 0.06) / 0.22) * product.length));
    } else if (u >= 0.28) {
        typed = product;
    }

    const fields = [
        { label: 'PRODUCT',   value: typed,                 typed: true },
        { label: 'CONDITION', value: 'Good · Size M',      typed: false },
        { label: 'CATEGORY',  value: 'Fashion → Outerwear', typed: false }
    ];

    fields.forEach((f, i) => {
        const fy = ly + 78 + i * 104;
        ctx.fillStyle = '#4a525c';
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.fillText(f.label, lx + 26, fy);

        ctx.fillStyle = '#12151a';
        ctx.strokeStyle = '#1a2028';
        ctx.lineWidth = 1;
        roundRect(ctx, lx + 26, fy + 16, cw - 52, 54, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#d0d4dc';
        ctx.font = '500 16px "Inter", sans-serif';
        ctx.fillText(f.value, lx + 44, fy + 52);

        if (f.typed && u > 0.06 && u < 0.30 && Math.sin(t * 20) > 0) {
            const tw = ctx.measureText(f.value).width;
            ctx.fillStyle = '#4d8bf5';
            ctx.fillRect(lx + 44 + tw + 2, fy + 38, 2, 20);
        }
    });

    // Generate button
    const btnY = ly + lh - 80;
    const genU = u >= 0.30 && u < 0.42;
    const pulse = genU ? Math.sin((u - 0.30) / 0.12 * Math.PI) : 0;

    ctx.fillStyle = `rgba(77,139,245,${0.15 + pulse * 0.35})`;
    ctx.strokeStyle = '#4d8bf5';
    ctx.lineWidth = 1.5 + pulse * 2;
    roundRect(ctx, lx + 26, btnY, cw - 52, 54, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#6ba0ff';
    ctx.font = '600 15px "JetBrains Mono", monospace';
    const btnText = genU ? '● GENERATING' : (u < 0.30 ? '▶  GENERATE' : '✓  GENERATED');
    const bw = ctx.measureText(btnText).width;
    ctx.fillText(btnText, lx + 26 + (cw - 52 - bw) / 2, btnY + 34);

    // ── Right output ──
    const rx = lx + cw + gap;
    const ry2 = 80;

    ctx.fillStyle = '#0d1119';
    roundRect(ctx, rx, ry2, cw, lh, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('GENERATED', rx + 26, ry2 + 38);

    ctx.fillStyle = '#4d8bf5';
    ctx.font = '700 18px monospace';
    ctx.fillText('✦', rx + cw - 50, ry2 + 38);

    // Output timing (fixed)
    const o1Start = 0.42;   // title
    const o2Start = 0.52;   // description
    const tagStart = 0.62;
    const priceStart = 0.75; // ← moved earlier, appears at 75%

    const o1u = clamp01((u - o1Start) * 6);
    const o2u = clamp01((u - o2Start) * 6);

    // Output 1
    ctx.globalAlpha = easeOutCubic(o1u);
    const o1Slide = (1 - easeOutCubic(o1u)) * 30;
    ctx.fillStyle = '#12151a';
    ctx.strokeStyle = '#1a2028';
    ctx.lineWidth = 1;
    roundRect(ctx, rx + 26 + o1Slide, ry2 + 68, cw - 52, 100, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#d0d4dc';
    ctx.font = '600 18px "Inter", sans-serif';
    ctx.fillText('Vintage 90s Denim Jacket', rx + 44 + o1Slide, ry2 + 106);
    ctx.fillStyle = '#9096a0';
    ctx.font = '500 15px "Inter", sans-serif';
    ctx.fillText("Men's Medium", rx + 44 + o1Slide, ry2 + 134);
    ctx.globalAlpha = 1;

    // Output 2
    ctx.globalAlpha = easeOutCubic(o2u);
    const o2Slide = (1 - easeOutCubic(o2u)) * 30;
    ctx.fillStyle = '#12151a';
    roundRect(ctx, rx + 26 + o2Slide, ry2 + 184, cw - 52, 116, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9096a0';
    ctx.font = '500 14px "Inter", sans-serif';
    ctx.fillText('Classic washed denim with original', rx + 44 + o2Slide, ry2 + 216);
    ctx.fillText('hardware. Soft broken-in feel —', rx + 44 + o2Slide, ry2 + 240);
    ctx.fillText('perfect layering piece for fall.', rx + 44 + o2Slide, ry2 + 264);
    ctx.globalAlpha = 1;

    // Tags
    const tags = ['vintage', 'denim', '90s', 'menswear'];
    let tx = rx + 26;
    tags.forEach((tag, i) => {
        const tu = clamp01((u - tagStart - i * 0.04) * 16);
        const s = easeOutCubic(tu);
        if (s < 0.01) return;

        ctx.font = '600 12px "JetBrains Mono", monospace';
        const tw = ctx.measureText(tag).width + 24;

        ctx.globalAlpha = s;
        ctx.save();
        ctx.translate(tx + tw / 2, ry2 + 332);
        ctx.scale(s, s);
        ctx.translate(-tw / 2, -14);

        ctx.fillStyle = 'rgba(77,139,245,0.12)';
        ctx.strokeStyle = 'rgba(77,139,245,0.4)';
        ctx.lineWidth = 1;
        roundRect(ctx, 0, 0, tw, 28, 14);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#6ba0ff';
        ctx.fillText(tag, 12, 19);
        ctx.restore();
        ctx.globalAlpha = 1;
        tx += tw + 8;
    });

    // Price — now appears reliably at u > 0.75
    const priceU = clamp01((u - priceStart) * 6);
    const py2 = ry2 + lh - 100;

    ctx.globalAlpha = easeOutCubic(priceU);
    const priceSlide = (1 - easeOutCubic(priceU)) * 20;
    ctx.fillStyle = 'rgba(63,202,125,0.08)';
    ctx.strokeStyle = 'rgba(63,202,125,0.3)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, rx + 26, py2 + priceSlide, cw - 52, 72, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9096a0';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('SUGGESTED PRICE', rx + 44, py2 + 44 + priceSlide);

    ctx.fillStyle = '#3fca7d';
    ctx.font = '600 28px "JetBrains Mono", monospace';
    const priceStr = '₪185';
    const priceW = ctx.measureText(priceStr).width;
    ctx.fillText(priceStr, rx + cw - 44 - priceW, py2 + 48 + priceSlide);
    ctx.globalAlpha = 1;
}

// ── 05 · AIMAZE (unchanged) ──────────────────────────────
// ============================================================
// AIMaze — 3 mazes, agent solves each in turn
// ============================================================
const AIMAZE_MAZES = [
    {
        walls: [
            [1,1,0,0,0,1,0,0,0,0,0,0],
            [0,0,0,1,0,1,0,1,1,1,0,0],
            [0,1,0,1,0,0,0,0,0,1,0,0],
            [0,1,0,1,1,1,1,1,0,1,0,1],
            [0,1,0,0,0,0,0,1,0,1,0,1],
            [0,1,1,1,1,1,0,1,0,1,0,1],
            [0,0,0,0,0,1,0,1,0,1,0,1],
            [1,1,1,1,0,1,0,0,0,1,0,2]
        ],
        path: [
            [2,0],[3,0],[4,0],
            [4,1],[4,2],[5,2],[6,2],[6,1],[6,0],
            [7,0],[8,0],[9,0],[10,0],
            [10,1],[10,2],[10,3],[10,4],[10,5],[10,6],[10,7],
            [11,7]
        ]
    },
    {
        walls: [
            [0,0,0,0,0,1,0,0,0,0,0,1],
            [0,1,1,1,0,1,0,1,1,1,0,0],
            [0,0,0,1,0,0,0,0,0,1,0,1],
            [1,1,0,1,1,1,1,1,0,1,0,0],
            [0,0,0,0,0,0,0,1,0,0,0,1],
            [0,1,1,1,1,1,0,1,1,1,0,0],
            [0,0,0,0,0,1,0,0,0,0,0,0],
            [1,1,1,1,0,1,1,1,1,1,0,2]
        ],
        path: [
            [0,0],[1,0],[2,0],[3,0],[4,0],
            [4,1],[4,2],[5,2],[6,2],[6,1],[6,0],
            [7,0],[8,0],[9,0],[10,0],
            [10,1],[10,2],[10,3],[10,4],[10,5],
            [11,5],[11,6],[11,7]
        ]
    },
    {
        walls: [
            [0,0,0,0,1,1,1,1,1,1,1,1],
            [1,1,1,0,1,0,0,0,0,0,0,1],
            [1,0,0,0,1,0,1,1,0,1,0,1],
            [1,0,1,0,0,0,0,0,0,1,0,1],
            [1,0,1,1,1,1,1,1,1,1,0,1],
            [1,0,0,0,0,0,1,0,0,0,0,1],
            [1,1,1,1,1,0,1,0,1,1,0,1],
            [1,1,1,1,1,0,1,0,1,1,0,2]
        ],
        path: [
            [0,0],[1,0],[2,0],[3,0],
            [3,1],[3,2],[3,3],
            [4,3],[5,3],[6,3],[7,3],[8,3],
            [8,2],[8,1],
            [9,1],[10,1],
            [10,2],[10,3],[10,4],[10,5],[10,6],[10,7],
            [11,7]
        ]
    }
];

function drawAIMaze(ctx, W, H, t) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);

    const STEP_TIME = 0.32;
    const HOLD_TIME = 1.8;

    const mazeTimes = AIMAZE_MAZES.map(m => (m.path.length - 1) * STEP_TIME + HOLD_TIME);
    const cycleTime = mazeTimes.reduce((a, b) => a + b, 0);
    const cycle = t % cycleTime;

    // Find which maze we're currently on
    let mazeIdx = 0;
    let mazeT = cycle;
    for (let i = 0; i < mazeTimes.length; i++) {
        if (mazeT < mazeTimes[i]) { mazeIdx = i; break; }
        mazeT -= mazeTimes[i];
    }

    const maze = AIMAZE_MAZES[mazeIdx];
    const totalSteps = maze.path.length - 1;
    const stepIdx = Math.min(totalSteps, Math.floor(mazeT / STEP_TIME));
    const stepFrac = Math.min(1, (mazeT - stepIdx * STEP_TIME) / STEP_TIME);
    const holding = stepIdx >= totalSteps;

    drawChrome(ctx, W,
        'aimaze · maze ' + (mazeIdx + 1) + ' / ' + AIMAZE_MAZES.length,
        '● TRAINING');

    // Top bar
    const barX = 40, barY = 90, barW = W - 80, barH = 48;
    ctx.fillStyle = '#0d1119';
    ctx.strokeStyle = '#1a2028';
    ctx.lineWidth = 1.5;
    roundRect(ctx, barX, barY, barW, barH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText(
        'ML-AGENTS · POLICY : PPO · MAZE ' + (mazeIdx + 1) + '/' + AIMAZE_MAZES.length,
        barX + 24, barY + 30
    );

    ctx.fillStyle = '#3fca7d';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    const liveW = ctx.measureText('● RUNNING').width;
    ctx.fillText('● RUNNING', barX + barW - 24 - liveW, barY + 30);

    // Grid geometry
    const cols = 12, rows = 8;
    const cell = 62, gap = 2;
    const mw = cols * cell + (cols - 1) * gap;
    const mh = rows * cell + (rows - 1) * gap;
    const mx = (W - mw) / 2;
    const my = barY + barH + 50;

    // Trail behind the agent
    for (let i = 0; i <= stepIdx; i++) {
        const [c, r] = maze.path[i];
        const x = mx + c * (cell + gap);
        const y = my + r * (cell + gap);
        const isHead = i === stepIdx;
        ctx.fillStyle = isHead ? 'rgba(77,139,245,0.4)' : 'rgba(77,139,245,0.16)';
        roundRect(ctx, x, y, cell, cell, 4);
        ctx.fill();
    }

    // Walls + goal
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = mx + c * (cell + gap);
            const y = my + r * (cell + gap);
            const w = maze.walls[r][c];

            if (w === 1) {
                const grad = ctx.createLinearGradient(x, y, x, y + cell);
                grad.addColorStop(0, '#2a3240');
                grad.addColorStop(1, '#1a2029');
                ctx.fillStyle = grad;
                roundRect(ctx, x, y, cell, cell, 4);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                ctx.lineWidth = 1;
                ctx.stroke();
            } else if (w === 2) {
                const pulse = 0.5 + 0.5 * Math.sin(t * 3);
                const grad = ctx.createRadialGradient(
                    x + cell / 2, y + cell / 2, 4,
                    x + cell / 2, y + cell / 2, cell * 0.7
                );
                grad.addColorStop(0, `rgba(63,202,125,${0.7 + pulse * 0.3})`);
                grad.addColorStop(1, 'rgba(63,202,125,0.05)');
                ctx.fillStyle = grad;
                roundRect(ctx, x, y, cell, cell, 4);
                ctx.fill();
                ctx.strokeStyle = '#3fca7d';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else {
                ctx.fillStyle = '#0d1016';
                roundRect(ctx, x, y, cell, cell, 4);
                ctx.fill();
            }
        }
    }

    // Agent
    const curStep = maze.path[stepIdx];
    const nxtStep = maze.path[Math.min(stepIdx + 1, maze.path.length - 1)];
    const stepEase = holding ? 1 : stepFrac;

    const ax = lerp(
        mx + curStep[0] * (cell + gap),
        mx + nxtStep[0] * (cell + gap),
        stepEase
    );
    const ay = lerp(
        my + curStep[1] * (cell + gap),
        my + nxtStep[1] * (cell + gap),
        stepEase
    );

    const agGrad = ctx.createLinearGradient(ax, ay, ax, ay + cell);
    agGrad.addColorStop(0, '#7cb0ff');
    agGrad.addColorStop(1, '#4d8bf5');
    ctx.fillStyle = agGrad;
    roundRect(ctx, ax, ay, cell, cell, 4);
    ctx.fill();

    // Success glow when holding on the goal
    if (holding) {
        const holdU = (mazeT - totalSteps * STEP_TIME) / HOLD_TIME;
        const pulse = Math.sin(holdU * Math.PI);
        ctx.save();
        ctx.globalAlpha = pulse * 0.7;
        ctx.shadowColor = '#3fca7d';
        ctx.shadowBlur = 40;
        ctx.strokeStyle = '#3fca7d';
        ctx.lineWidth = 2;
        roundRect(ctx, ax, ay, cell, cell, 4);
        ctx.stroke();
        ctx.restore();
    }

    ctx.shadowColor = 'rgba(77,139,245,0.9)';
    ctx.shadowBlur = 24;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Bottom stats
    const statsY = my + mh + 40;
    const statProgress = stepIdx / Math.max(1, totalSteps);
    const stats = [
        { label: 'MAZE',    value: (mazeIdx + 1) + ' / ' + AIMAZE_MAZES.length },
        { label: 'REWARD',  value: '+' + fmt(0.42 + statProgress * 8, 2) },
        { label: 'SUCCESS', value: Math.round(30 + statProgress * 64) + '%' }
    ];

    const sw = (W - 80) / 3 - 12;
    stats.forEach((s, i) => {
        const sx = 40 + i * (sw + 18);
        ctx.fillStyle = '#0d1119';
        ctx.strokeStyle = '#1a2028';
        ctx.lineWidth = 1.5;
        roundRect(ctx, sx, statsY, sw, 70, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#4a525c';
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.fillText(s.label, sx + 24, statsY + 28);

        ctx.fillStyle = '#d0d4dc';
        ctx.font = '600 22px "JetBrains Mono", monospace';
        ctx.fillText(s.value, sx + 24, statsY + 56);
    });
}
// ── 06 · LANGUAGES — with popups ─────────────────────────
function drawLanguages(ctx, W, H, t) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);
    drawChrome(ctx, W, 'languages · editor', '● EDITING');

    const files = [
        { name: 'main.py',   accent: '#4d8bf5', code: [
            '# ── python ────────────',
            'import torch',
            'from agent import PPO',
            '',
            'def train(env):',
            '    agent = PPO(env)',
            '    for epoch in range(100):',
            '        agent.step()',
            '    return agent'
        ], popups: [
            { t: 'Torch imported', icon: '✓', color: '#3fca7d' },
            { t: 'Agent initialized', icon: '✓', color: '#3fca7d' },
            { t: 'Training · 100 epochs', icon: '⏵', color: '#4d8bf5' }
        ]},
        { name: 'core.cpp', accent: '#ff8a5c', code: [
            '// ── c++ ──────────────',
            '#include <iostream>',
            '#include <vector>',
            '',
            'int main() {',
            '    std::cout << "ready\\n";',
            '    return 0;',
            '}'
        ], popups: [
            { t: 'Compiling...', icon: '⏵', color: '#4d8bf5' },
            { t: 'Build succeeded', icon: '✓', color: '#3fca7d' },
            { t: 'Binary: 12.4 KB', icon: '◆', color: '#ff8a5c' }
        ]},
        { name: 'app.js',   accent: '#ffbe5c', code: [
            '// ── js ───────────────',
            'const server = new Server();',
            '',
            'server.use("/api", router);',
            'server.listen(3000);'
        ], popups: [
            { t: 'Dependencies loaded', icon: '✓', color: '#3fca7d' },
            { t: 'Server on :3000', icon: '◆', color: '#ffbe5c' },
            { t: 'Ready for requests', icon: '⏵', color: '#4d8bf5' }
        ]},
        { name: 'query.sql', accent: '#b07cff', code: [
            '-- ── sql ────────────',
            'SELECT player,',
            '       AVG(score) AS avg',
            'FROM scores',
            'GROUP BY player',
            'ORDER BY avg DESC;'
        ], popups: [
            { t: 'Query compiled', icon: '✓', color: '#3fca7d' },
            { t: '3 rows · 4ms', icon: '◆', color: '#b07cff' },
            { t: 'Cached for 60s', icon: '✓', color: '#3fca7d' }
        ]}
    ];

    const FILE_DURATION = 6;
    const activeIdx = Math.floor(t / FILE_DURATION) % files.length;
    const tabT = (t % FILE_DURATION);
    const file = files[activeIdx];

    // Tabs
    const tabW = 240;
    files.forEach((f, i) => {
        const tx = 40 + i * (tabW + 12);
        const isActive = i === activeIdx;

        ctx.fillStyle = isActive ? '#12151a' : 'transparent';
        ctx.strokeStyle = isActive ? f.accent : '#1a2028';
        ctx.lineWidth = isActive ? 1.5 : 1;
        roundRect(ctx, tx, 76, tabW, 44, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isActive ? '#d0d4dc' : '#5a616b';
        ctx.font = '600 14px "JetBrains Mono", monospace';
        ctx.fillText(f.name, tx + 22, 104);

        if (isActive) {
            ctx.fillStyle = f.accent;
            ctx.beginPath();
            ctx.arc(tx + tabW - 18, 98, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Editor
    const ex = 40, ey = 138, ew = W - 80, editorH = 400;

    ctx.fillStyle = '#0d1119';
    ctx.strokeStyle = '#1a2028';
    ctx.lineWidth = 1.5;
    roundRect(ctx, ex, ey, ew, editorH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(ex + 1, ey + 1, 60, editorH - 2);

    const code = file.code;
    const lineDelay = 0.35;
    const visibleLines = Math.min(code.length, Math.floor(tabT / lineDelay) + 1);
    const lineH = 34;

    for (let i = 0; i < visibleLines; i++) {
        const y = ey + 46 + i * lineH;

        ctx.fillStyle = '#3a4048';
        ctx.font = '500 14px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(String(i + 1), ex + 50, y);
        ctx.textAlign = 'left';

        const lineU = clamp01((tabT - i * lineDelay) * 5);
        ctx.globalAlpha = easeOutCubic(lineU);

        const text = code[i];
        const isCmt = text.trim().startsWith('//') || text.trim().startsWith('#') || text.trim().startsWith('--');
        ctx.fillStyle = isCmt ? '#4a525c' : '#d0d4dc';
        ctx.font = '500 16px "JetBrains Mono", monospace';
        ctx.fillText(text, ex + 80, y);
        ctx.globalAlpha = 1;
    }

    // Cursor at end
    if (Math.sin(tabT * 8) > 0 && visibleLines > 0 && visibleLines <= code.length) {
        const lastLine = code[visibleLines - 1] || '';
        const cursorY = ey + 46 + (visibleLines - 1) * lineH;
        ctx.font = '500 16px "JetBrains Mono", monospace';
        const lw = ctx.measureText(lastLine).width;
        ctx.fillStyle = file.accent;
        ctx.fillRect(ex + 80 + lw + 4, cursorY - 15, 2, 22);
    }

    // ── Popups appear in the lower-left corner of the editor ──
    const popupBaseTime = code.length * lineDelay + 0.4;
    file.popups.forEach((popup, i) => {
        const appearAt = popupBaseTime + i * 0.9;
        const disappearAt = appearAt + 1.8;

        if (tabT < appearAt || tabT > disappearAt + 0.3) return;

        let progress;
        if (tabT < appearAt + 0.25) {
            progress = easeOutCubic((tabT - appearAt) / 0.25);
        } else if (tabT < disappearAt - 0.25) {
            progress = 1;
        } else {
            progress = 1 - easeOutCubic((tabT - (disappearAt - 0.25)) / 0.55);
        }

        if (progress <= 0.01) return;

        const popupW = 280;
        const popupH = 46;
        const popupX = ex + 20 + (1 - progress) * -40;
        const popupY = ey + editorH - 60 - i * 56;
        const alpha = progress;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 3;

        // Popup bg
        ctx.fillStyle = '#0a1220';
        roundRect(ctx, popupX, popupY, popupW, popupH, 10);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Accent border
        ctx.strokeStyle = popup.color;
        ctx.lineWidth = 1.5;
        roundRect(ctx, popupX, popupY, popupW, popupH, 10);
        ctx.stroke();

        // Left accent bar
        ctx.fillStyle = popup.color;
        ctx.fillRect(popupX, popupY + 8, 3, popupH - 16);

        // Icon
        ctx.fillStyle = popup.color;
        ctx.font = '700 18px monospace';
        ctx.fillText(popup.icon, popupX + 20, popupY + 30);

        // Text
        ctx.fillStyle = '#d0d4dc';
        ctx.font = '500 14px "Inter", sans-serif';
        ctx.fillText(popup.t, popupX + 48, popupY + 29);

        ctx.restore();
    });

    // Bottom status
    ctx.fillStyle = '#4a525c';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    const fileNum = activeIdx + 1;
    ctx.fillText('FILE ' + fileNum + ' / ' + files.length + ' · ln ' + visibleLines, ex + 22, ey + editorH + 30);
}

// ── 07 · FRAMEWORKS — more alive ─────────────────────────
function drawFrameworks(ctx, W, H, t) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);
    drawChrome(ctx, W, 'frameworks · modules', '● 4/4 CONNECTED');

    const modules = [
        { id: 0, name: 'FastAPI',    x: W / 2,        y: 220, color: '#4d8bf5', icon: '⚡' },
        { id: 1, name: 'Android',    x: W / 2 + 340,  y: 400, color: '#3fca7d', icon: '◆' },
        { id: 2, name: 'PostgreSQL', x: W / 2,        y: 580, color: '#b07cff', icon: '▤' },
        { id: 3, name: 'Unity',      x: W / 2 - 340,  y: 400, color: '#ffbe5c', icon: '◈' }
    ];

    const clickTimes = [0.15, 0.32, 0.49, 0.66];
    const cycle = t % 8;
    const connected = modules.map((_, i) => cycle > clickTimes[i] + 0.05);

    // Connection lines with travelling particles
    for (let i = 0; i < modules.length; i++) {
        const a = modules[i];
        const b = modules[(i + 1) % modules.length];
        const lineU = clamp01((cycle - 0.75 - i * 0.12) / 0.2);

        if (lineU > 0.005) {
            const pulse = 0.4 + 0.6 * Math.abs(Math.sin(t * 2.5 + i * 0.8));

            // Dashed line
            ctx.setLineDash([6, 6]);
            ctx.strokeStyle = `rgba(77,139,245,${0.22 * lineU * pulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Two travelling particles per line, offset for richness
            for (let k = 0; k < 2; k++) {
                const dotU = ((t * 0.6 + i * 0.25 + k * 0.5) % 1);
                const dx = lerp(a.x, b.x, dotU);
                const dy = lerp(a.y, b.y, dotU);
                const alpha = Math.sin(dotU * Math.PI) * lineU;
                ctx.fillStyle = `rgba(180, 220, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(dx, dy, 4, 0, Math.PI * 2);
                ctx.fill();

                // Glow
                ctx.fillStyle = `rgba(77, 139, 245, ${alpha * 0.4})`;
                ctx.beginPath();
                ctx.arc(dx, dy, 10, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Modules
    modules.forEach((m, i) => {
        const isOn = connected[i];
        const pulse = isOn ? (0.5 + 0.5 * Math.sin(t * 3 + i)) : 0;
        // Gentle per-module bob
        const bob = Math.sin(t * 1.2 + i * 1.3) * 3;

        const cardW = 280;
        const cardH = 130;
        const cx = m.x - cardW / 2;
        const cy = m.y - cardH / 2 + (isOn ? bob : 0);

        // Outer glow when active
        if (isOn) {
            ctx.save();
            ctx.shadowColor = m.color;
            ctx.shadowBlur = 25 + pulse * 20;
            ctx.strokeStyle = m.color;
            ctx.lineWidth = 1.5;
            roundRect(ctx, cx, cy, cardW, cardH, 14);
            ctx.stroke();
            ctx.restore();
        }

        // Card
        ctx.fillStyle = isOn ? '#0d1119' : '#0a0d12';
        ctx.strokeStyle = isOn ? m.color : '#1a2028';
        ctx.lineWidth = isOn ? 2 : 1.5;
        roundRect(ctx, cx, cy, cardW, cardH, 14);
        ctx.fill();
        ctx.stroke();

        // Top accent bar with pulse
        ctx.fillStyle = isOn ? m.color : '#1a2028';
        ctx.fillRect(cx + 1, cy + 1, cardW - 2, 4);

        // Icon
        ctx.fillStyle = isOn ? m.color : '#3a4048';
        ctx.font = '700 32px monospace';
        ctx.fillText(m.icon, cx + 24, cy + 62);

        // Name
        ctx.fillStyle = isOn ? '#ededf0' : '#4a525c';
        ctx.font = '600 24px "Inter", sans-serif';
        ctx.fillText(m.name, cx + 72, cy + 58);

        // Status
        ctx.fillStyle = isOn ? m.color : '#3a4048';
        ctx.beginPath();
        ctx.arc(cx + 78, cy + 92, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isOn ? '#9096a0' : '#5a616b';
        ctx.font = '600 13px "JetBrains Mono", monospace';
        ctx.fillText(isOn ? 'READY' : 'INIT', cx + 94, cy + 96);

        // Live stat when active
        if (isOn) {
            const stat = 40 + Math.round(Math.sin(t * 0.8 + i) * 20 + 60);
            ctx.fillStyle = m.color;
            ctx.font = '600 16px "JetBrains Mono", monospace';
            const statStr = stat + ' rpm';
            const sw = ctx.measureText(statStr).width;
            ctx.fillText(statStr, cx + cardW - 24 - sw, cy + 96);
        }
    });

    // Hand clicks modules
    const activeClick = clickTimes.findIndex((c) => cycle > c - 0.08 && cycle < c + 0.12);
    if (activeClick >= 0) {
        const cu = clamp01((cycle - (clickTimes[activeClick] - 0.08)) / 0.20);
        const m = modules[activeClick];
        const startX = W / 2;
        const startY = H - 40;
        const cx = lerp(startX, m.x, easeOutCubic(cu));
        const cy = lerp(startY, m.y, easeOutCubic(cu));
        const press = (cu > 0.65 && cu < 0.9) ? Math.sin((cu - 0.65) / 0.25 * Math.PI) : 0;
        drawHand(ctx, cx, cy, press);
    }
}

// ── 08 · AI / DATA — bobbing, more alive ─────────────────
function drawAIData(ctx, W, H, t) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);

    const LOOP = 10;
    const cycle = t % LOOP;
    const progress = easeOutCubic(clamp01(cycle / 8));
    const epoch = Math.min(10, Math.floor(progress * 10) + 1);

    drawChrome(ctx, W, 'ai-data · training', '● EPOCH ' + epoch + ' / 10');

    // ── Whole network panel bobs gently ──
    const bob = Math.sin(t * 0.7) * 3;

    const nnX = 60, nnY = 120 + bob, nnW = W - 120, nnH = 380;

    ctx.fillStyle = '#0d1119';
    ctx.strokeStyle = '#1a2028';
    ctx.lineWidth = 1.5;
    roundRect(ctx, nnX, nnY, nnW, nnH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('NETWORK · 8 → 12 → 4', nnX + 24, nnY + 34);

    const layers = [8, 12, 4];
    const nodes = [];
    const layerSpacing = (nnW - 180) / (layers.length - 1);

    for (let L = 0; L < layers.length; L++) {
        const n = layers[L];
        const x = nnX + 90 + L * layerSpacing;
        const vSpacing = (nnH - 140) / (n - 1);
        const startY = nnY + 80;
        const layerNodes = [];
        for (let i = 0; i < n; i++) {
            layerNodes.push({ x, y: startY + i * vSpacing });
        }
        nodes.push(layerNodes);
    }

    // Connections
    for (let L = 0; L < nodes.length - 1; L++) {
        const from = nodes[L];
        const to = nodes[L + 1];
        for (let i = 0; i < from.length; i++) {
            for (let j = 0; j < to.length; j++) {
                if (hash01(i * 17 + j * 31 + L * 7) > 0.5) continue;
                const n1 = from[i];
                const n2 = to[j];
                const strength = hash01(i + j * 3 + L * 5);
                const pulse = Math.max(0, Math.sin(t * 2.5 - (i + j) * 0.18 - L * 0.6));
                // More visible pulse
                ctx.strokeStyle = `rgba(77,139,245,${0.04 + pulse * 0.28 * strength})`;
                ctx.lineWidth = 0.5 + strength * 1.0;
                ctx.beginPath();
                ctx.moveTo(n1.x, n1.y);
                ctx.lineTo(n2.x, n2.y);
                ctx.stroke();

                // Fast travel particle on strong connections
                if (strength > 0.75 && pulse > 0.5) {
                    const dotU = (t * 1.5 + i * 0.3 + j * 0.2) % 1;
                    const px = lerp(n1.x, n2.x, dotU);
                    const py = lerp(n1.y, n2.y, dotU);
                    ctx.fillStyle = `rgba(180, 220, 255, ${pulse * 0.9})`;
                    ctx.beginPath();
                    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    // Nodes — more alive with breathing
    for (let L = 0; L < nodes.length; L++) {
        for (let i = 0; i < nodes[L].length; i++) {
            const n = nodes[L][i];
            const phase = i * 0.4 + L * 1.3;
            const glow = 0.5 + 0.5 * Math.sin(t * 3 + phase); // faster
            const brightness = L === 0 ? 0.5 : (L === 1 ? 0.75 : 1.0);
            const size = 6 + glow * 2;

            ctx.fillStyle = `rgba(77,139,245,${(0.5 + glow * 0.5) * brightness})`;
            ctx.beginPath();
            ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
            ctx.fill();

            if (glow > 0.6) {
                ctx.fillStyle = `rgba(160,200,255,${(glow - 0.6) * 2.5 * brightness})`;
                ctx.beginPath();
                ctx.arc(n.x, n.y, size * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // ── Bottom row ──
    const botY = nnY + nnH + 30;
    const botH = H - botY - 40 + bob * -0.5; // bottom bobs opposite

    // Loss chart
    const chartW = (W - 120) * 0.55;
    const chartX = 60;

    ctx.fillStyle = '#0d1119';
    ctx.strokeStyle = '#1a2028';
    ctx.lineWidth = 1.5;
    roundRect(ctx, chartX, botY, chartW, botH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('TRAINING LOSS', chartX + 22, botY + 30);

    const cx2 = chartX + 22;
    const cy2 = botY + 55;
    const cw2 = chartW - 44;
    const chh2 = botH - 80;

    const N = 40;
    const pts = [];
    for (let i = 0; i <= N; i++) {
        const u = i / N;
        if (u > progress) break;
        const x = cx2 + u * cw2;
        const y = cy2 + chh2 * (0.12 + u * 0.65) + Math.sin(u * 18) * 3 * (1 - u);
        pts.push({ x, y });
    }

    if (pts.length > 1) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.strokeStyle = '#3fca7d';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Gradient fill under
        ctx.lineTo(pts[pts.length - 1].x, cy2 + chh2);
        ctx.lineTo(pts[0].x, cy2 + chh2);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, cy2, 0, cy2 + chh2);
        g.addColorStop(0, 'rgba(63, 202, 125, 0.15)');
        g.addColorStop(1, 'rgba(63, 202, 125, 0)');
        ctx.fillStyle = g;
        ctx.fill();

        const head = pts[pts.length - 1];
        const pulse = 0.5 + 0.5 * Math.sin(t * 6);
        ctx.fillStyle = `rgba(63,202,125,${0.6 + pulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Stats cards
    const statsX = chartX + chartW + 30;
    const statsW = W - statsX - 60;
    const statCardW = (statsW - 20) / 3;

    const stats = [
        ['LOSS',     fmt(0.847 - progress * 0.759, 3), '#3fca7d'],
        ['ACCURACY', (42 + progress * 54).toFixed(1) + '%', '#6ba0ff'],
        ['EPOCH',    epoch + ' / 10', '#d0d4dc']
    ];

    stats.forEach((s, i) => {
        const sx = statsX + i * (statCardW + 10);
        const statBob = Math.sin(t * 0.9 + i * 0.8) * 2;

        ctx.fillStyle = '#0d1119';
        ctx.strokeStyle = '#1a2028';
        ctx.lineWidth = 1.5;
        roundRect(ctx, sx, botY + statBob, statCardW, botH - statBob, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#4a525c';
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.fillText(s[0], sx + 20, botY + 30 + statBob);

        ctx.fillStyle = s[2];
        ctx.font = '600 26px "JetBrains Mono", monospace';
        ctx.fillText(s[1], sx + 20, botY + 72 + statBob);
    });
}

// ── 09 · OTHER — more detail, alive, notifications ───────
function drawOther(ctx, W, H, t) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);
    drawChrome(ctx, W, 'other · terminal + tools', '● ACTIVE');

    const gap = 24;
    const colW = (W - 60 - gap) / 2;
    const ly = 90;
    const lh = H - 140;

    // ── Left: git terminal ──
    const lx = 30;

    ctx.fillStyle = '#0d1119';
    ctx.strokeStyle = '#1a2028';
    ctx.lineWidth = 1.5;
    roundRect(ctx, lx, ly, colW, lh, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('GIT LOG', lx + 22, ly + 32);

    // Live indicator
    const gitPulse = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.fillStyle = `rgba(77,139,245,${0.4 + gitPulse * 0.6})`;
    ctx.beginPath();
    ctx.arc(lx + colW - 30, ly + 28, 5, 0, Math.PI * 2);
    ctx.fill();

    const gitLines = [
        { prompt: '$ ', text: 'git log --oneline -5' },
        { text: 'a3f9d21  add score submission' },
        { text: 'b81c04e  fix rigidbody force' },
        { text: '7d2a905  initial player controller' },
        { text: '2e6b9ac  player movement' },
        { text: '1c4f703  project scaffold' },
        { prompt: '$ ', text: 'git status' },
        { text: 'On branch main · 3 files changed' },
        { prompt: '$ ', text: 'git push' },
        { text: '✓ pushed to origin/main' }
    ];

    const lineDelay = 0.55;
    const lineH = 32;
    const cycT = t % 9;
    const visibleLines = Math.min(gitLines.length, Math.floor(cycT / lineDelay) + 1);

    // Blinking cursor at end
    const cursorLine = visibleLines < gitLines.length ? visibleLines : gitLines.length;

    for (let i = 0; i < visibleLines; i++) {
        const line = gitLines[i];
        const y = ly + 68 + i * lineH;

        const lineU = clamp01((cycT - i * lineDelay) * 3);
        ctx.globalAlpha = easeOutCubic(lineU);

        if (line.prompt) {
            ctx.fillStyle = '#4d8bf5';
            ctx.font = '600 14px "JetBrains Mono", monospace';
            ctx.fillText(line.prompt, lx + 22, y);
            const pw = ctx.measureText(line.prompt).width;
            ctx.fillStyle = '#d0d4dc';
            ctx.font = '500 14px "JetBrains Mono", monospace';
            ctx.fillText(line.text, lx + 22 + pw, y);
        } else {
            const color = line.text.startsWith('✓') ? '#3fca7d'
                        : line.text.startsWith('On branch') ? '#ffbe5c'
                        : '#b0b8c4';
            ctx.fillStyle = color;
            ctx.font = '500 14px "JetBrains Mono", monospace';
            ctx.fillText(line.text, lx + 22, y);
        }
        ctx.globalAlpha = 1;
    }

    // Blinking cursor
    if (Math.sin(t * 4) > 0 && cursorLine < gitLines.length) {
        const y = ly + 68 + cursorLine * lineH;
        ctx.fillStyle = '#4d8bf5';
        ctx.fillRect(lx + 22, y - 14, 8, 18);
    }

    // ── Right: REST + responsive ──
    const rx = lx + colW + gap;
    const apiH = lh * 0.62;

    ctx.fillStyle = '#0d1119';
    ctx.strokeStyle = '#1a2028';
    ctx.lineWidth = 1.5;
    roundRect(ctx, rx, ly, colW, apiH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('REST API', rx + 22, ly + 32);

    const apis = [
        { method: 'POST', path: '/api/scores',     status: 201, base: 0 },
        { method: 'GET',  path: '/api/players',    status: 200, base: 1.2 },
        { method: 'GET',  path: '/api/leaderboard', status: 200, base: 2.4 }
    ];

    apis.forEach((api, i) => {
        const y = ly + 90 + i * 60;
        const reqT = (t - api.base) % 3;
        const requestActive = reqT < 1.5;
        const methodColor = api.method === 'POST' ? '#3fca7d' : '#4d8bf5';

        // Method pill with glow when active
        if (requestActive) {
            ctx.save();
            ctx.shadowColor = methodColor;
            ctx.shadowBlur = 12;
        }

        ctx.font = '600 12px "JetBrains Mono", monospace';
        const mw = ctx.measureText(api.method).width + 20;

        ctx.fillStyle = requestActive ? methodColor + '44' : methodColor + '22';
        ctx.strokeStyle = methodColor;
        ctx.lineWidth = requestActive ? 1.5 : 1;
        roundRect(ctx, rx + 22, y - 16, mw, 24, 12);
        ctx.fill();
        ctx.stroke();

        if (requestActive) ctx.restore();

        ctx.fillStyle = methodColor;
        ctx.fillText(api.method, rx + 32, y);

        ctx.fillStyle = '#d0d4dc';
        ctx.font = '500 15px "JetBrains Mono", monospace';
        ctx.fillText(api.path, rx + 22 + mw + 12, y);

        const statusT = requestActive ? easeOutCubic((reqT - 0.5) / 0.8) : 1;
        const alpha = 0.3 + statusT * 0.7;

        ctx.fillStyle = `rgba(63,202,125,${alpha})`;
        ctx.font = '600 13px "JetBrains Mono", monospace';
        const sw = ctx.measureText(String(api.status)).width;
        ctx.fillText(String(api.status), rx + colW - 22 - sw, y);

        // Small travelling dot on the path when request is being made
        if (requestActive && reqT < 0.8) {
            const dotU = reqT / 0.8;
            const dotX = lerp(rx + 22 + mw + 12, rx + colW - 50, dotU);
            const dotY = y - 5;
            ctx.fillStyle = `rgba(77, 200, 255, ${1 - dotU})`;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Responsive bar
    const respY = ly + apiH + 24;
    const respH = lh - apiH - 24;

    ctx.fillStyle = '#0d1119';
    ctx.strokeStyle = '#1a2028';
    roundRect(ctx, rx, respY, colW, respH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('RESPONSIVE PREVIEW', rx + 22, respY + 32);

    const barY = respY + 76;
    const maxBarW = colW - 44;
    const wU = (Math.sin(t * 0.6) + 1) * 0.5;
    const barW = maxBarW * (0.45 + wU * 0.55);

    ctx.fillStyle = '#1a2028';
    roundRect(ctx, rx + 22, barY, maxBarW, 40, 8);
    ctx.fill();

    const rGrad = ctx.createLinearGradient(rx + 22, 0, rx + 22 + barW, 0);
    rGrad.addColorStop(0, '#4d8bf5');
    rGrad.addColorStop(1, '#b07cff');
    ctx.fillStyle = rGrad;
    roundRect(ctx, rx + 22, barY, barW, 40, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 15px "JetBrains Mono", monospace';
    const pctStr = Math.round((0.45 + wU * 0.55) * 100) + '%';
    const pctW = ctx.measureText(pctStr).width;
    ctx.fillText(pctStr, rx + 22 + barW - 12 - pctW, barY + 26);

    // Device breakdown — small bars showing three viewport widths
    const deviceY = barY + 60;
    const devices = [
        { label: 'mobile',  pct: 0.35, color: '#4d8bf5' },
        { label: 'tablet',  pct: 0.62, color: '#6ba0ff' },
        { label: 'desktop', pct: 1.00, color: '#b07cff' }
    ];

    devices.forEach((d, i) => {
        const dy = deviceY + i * 26;
        ctx.fillStyle = '#4a525c';
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.fillText(d.label, rx + 22, dy);

        const trackX = rx + 100;
        const trackW = maxBarW - 80;
        ctx.fillStyle = '#1a2028';
        roundRect(ctx, trackX, dy - 8, trackW, 6, 3);
        ctx.fill();

        // Bars gently "wiggle" to show live measurement
        const wiggle = Math.sin(t * 1.5 + i * 0.5) * 0.02;
        const w = trackW * clamp01(d.pct + wiggle);
        ctx.fillStyle = d.color;
        roundRect(ctx, trackX, dy - 8, w, 6, 3);
        ctx.fill();
    });
}