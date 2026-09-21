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

/* How each project is presented in space. PanelRig supplies the
   attitude; this supplies the shape. Anything not listed is flat. */
const PANEL_FORM = {
    languages:  'portrait',   // E - code is a tall thing, not a wide one
    frameworks: 'curved'      // I - wraps around you
};
/* Bends a plane back around a vertical axis so its far edges wrap
   away from the viewer. UVs survive the bend, so the canvas still
   maps onto it normally. */
function bendPlane(geo, radius) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const a = x / radius;
        pos.setX(i, Math.sin(a) * radius);
        pos.setZ(i, pos.getZ(i) + (Math.cos(a) - 1) * radius);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
}

function makeScreenTexture(canvas) {
    const t = new THREE.CanvasTexture(canvas);
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

/* The portrait form is the canvas cut exactly in half, no overlap:
   the top plate is the source and the bottom plate is what that source
   produced. drawLanguages lays the canvas out to match -- editor above
   the midline, terminal below it -- so the two plates are two different
   things rather than the same thing twice, which is what made the first
   two attempts look like a duplicate.

   UV terms, v counting up from the bottom. x is capped at 56% because
   that is all the portrait plate shows, so drawLanguages keeps every
   box inside x < 732. */
const PORTRAIT_TOP = { x: 0.012, y: 0.50, w: 0.56, h: 0.50 };
const PORTRAIT_BOT = { x: 0.012, y: 0.00, w: 0.56, h: 0.50 };

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

        // Written by PanelRig so the drones can actually carry the
        // panel rather than hover beside a fixed one.
        this.rigOffset = new THREE.Vector3();
        this.rigRoll  = 0;
        this.rigPitch = 0;
        this.rigYaw   = 0;
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

        const form = PANEL_FORM[spec.key] || 'flat';
        const built = this['_form_' + form](canvas);

        const group = new THREE.Group();
        group.add(built.glow, ...built.backs, ...built.screens);
        group.position.set(0, PANEL_Y, PANEL_Z);
        group.visible = false;
        group.renderOrder = 12;
        this.scene.add(group);

        const panel = {
            index, key: spec.key, title: spec.title, form,
            canvas, ctx, group,
            textures: built.textures,
            screens:  built.screens,
            backs:    built.backs,
            glow:     built.glow,
            halfW:    built.halfW,
            halfH:    built.halfH,
            draw: spec.fn(),
            localTime: 0, dormant: true, broken: false
        };
        this._paint(panel);
        return panel;
    }

    /* ---- forms -------------------------------------------------
       Each returns { screens, backs, glow, textures, halfW, halfH }.
       halfW / halfH are what PanelRig hangs its grip points off, so a
       tall panel gets gripped top-and-bottom rather than corner to
       corner without anyone having to say so.
       ------------------------------------------------------------ */

    _form_flat(canvas) {
        const tex = makeScreenTexture(canvas);
        const screen = new THREE.Mesh(
            new THREE.PlaneGeometry(PANEL_W, PANEL_H),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })
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

        return {
            screens: [screen], backs: [bezel], glow, textures: [tex],
            halfW: PANEL_W / 2, halfH: PANEL_H / 2
        };
    }

    /* E - portrait. The canvas stays 1280x800 so no draw function has
       to change. Two crops of it, stacked, both magnified about 1.8x:
       the upper half of the document on top, the lower half below. */
    _form_portrait(canvas) {
        const PW = 6.0;
        const PH = 7.0;
        const SW = PW - 0.30;
        const SH = SW * (PORTRAIT_TOP.h * CANVAS_H) / (PORTRAIT_TOP.w * CANVAS_W);
        const gapY = SH / 2 + 0.09;

        const crop = (spec) => {
            const t = makeScreenTexture(canvas);
            t.wrapS = THREE.ClampToEdgeWrapping;
            t.wrapT = THREE.ClampToEdgeWrapping;
            t.repeat.set(spec.w, spec.h);
            t.offset.set(spec.x, spec.y);
            return t;
        };

        const fullTex = crop(PORTRAIT_TOP);
        const full = new THREE.Mesh(
            new THREE.PlaneGeometry(SW, SH),
            new THREE.MeshBasicMaterial({ map: fullTex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })
        );
        full.position.set(0, gapY, 0);

        const detailTex = crop(PORTRAIT_BOT);
        const detail = new THREE.Mesh(
            new THREE.PlaneGeometry(SW, SH),
            new THREE.MeshBasicMaterial({ map: detailTex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })
        );
        detail.position.set(0, -gapY, 0);

        // A hairline between the two, so it reads as one device with a
        // detail view rather than two panels stuck together.
        const rule = new THREE.Mesh(
            new THREE.PlaneGeometry(SW * 0.5, 0.025),
            new THREE.MeshBasicMaterial({ color: 0x27384f, transparent: true, opacity: 0, depthWrite: false })
        );
        rule.position.set(0, 0, 0.004);

        const bezel = new THREE.Mesh(
            new THREE.PlaneGeometry(PW + 0.16, PH + 0.16),
            new THREE.MeshBasicMaterial({ color: 0x0a1220, transparent: true, opacity: 0, depthWrite: false })
        );
        bezel.position.z = -0.012;

        const glow = new THREE.Mesh(
            new THREE.PlaneGeometry(PW + 0.9, PH + 0.9),
            new THREE.MeshBasicMaterial({ color: 0x4d8bf5, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
        );
        glow.position.z = -0.024;

        return {
            screens: [full, detail], backs: [bezel, rule], glow,
            textures: [fullTex, detailTex],
            halfW: PW / 2, halfH: PH / 2
        };
    }

    /* I - bent around the viewer. The cost is that whatever is drawn
       near the edges curves with them; that is inherent to the shape,
       not a bug to be tuned out. */
    _form_curved(canvas) {
        const R = PANEL_W * 0.78;
        const tex = makeScreenTexture(canvas);

        const screen = new THREE.Mesh(
            bendPlane(new THREE.PlaneGeometry(PANEL_W, PANEL_H, 48, 1), R),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })
        );
        const bezel = new THREE.Mesh(
            bendPlane(new THREE.PlaneGeometry(PANEL_W + 0.16, PANEL_H + 0.16, 48, 1), R),
            new THREE.MeshBasicMaterial({ color: 0x0a1220, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
        );
        bezel.position.z = -0.014;

        const glow = new THREE.Mesh(
            bendPlane(new THREE.PlaneGeometry(PANEL_W + 0.9, PANEL_H + 0.9, 48, 1), R),
            new THREE.MeshBasicMaterial({ color: 0x4d8bf5, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
        );
        glow.position.z = -0.03;

        const halfAngle = (PANEL_W / 2) / R;
        return {
            screens: [screen], backs: [bezel], glow, textures: [tex],
            halfW: Math.sin(halfAngle) * R, halfH: PANEL_H / 2
        };
    }

    _paint(panel) {
        const { ctx } = panel;
        _handTarget.visible = false;
        try {
            if (panel.draw && !panel.broken) panel.draw(ctx, CANVAS_W, CANVAS_H, panel.localTime);
            else drawFallback(ctx, CANVAS_W, CANVAS_H, panel.localTime, panel.title);
        } catch (err) {
        
        }
        for (const t of panel.textures) t.needsUpdate = true;
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
        for (const s of p.screens) {
            s.material.opacity = this.opacity * (s.userData.opacityMul || 1);
        }
        for (const b of p.backs) {
            b.material.opacity = this.opacity * 0.92 * (b.userData.opacityMul || 1);
        }
        p.glow.material.opacity = this.opacity * 0.30;
        p.group.visible = this.opacity >= 0.02;
    }

    /* PanelRig calls this every frame. pitch / yaw / roll are applied
       on top of facing the camera, so passing 0, 0, 0 gives exactly the
       square-on panel this used to be. */
    setRig(x, y, z, roll, pitch, yaw) {
        this.rigOffset.set(x, y, z);
        this.rigRoll  = roll  || 0;
        this.rigPitch = pitch || 0;
        this.rigYaw   = yaw   || 0;
    }

    /* And reads the result back out. PanelRig puts its grip points on
       the panel's real corners, so it needs the real orientation and
       the real size, which differ per form. */
    getRigFrame() {
        const p = this.panels[this.index];
        if (!p) return null;
        return { quat: p.group.quaternion, halfW: p.halfW, halfH: p.halfH, form: p.form };
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
        // Oriented even while hidden. PanelRig reads this quaternion
        // back every frame to place its grip points, and a stale one
        // would send the drones to the wrong corners on the first frame
        // of a fade-in.
        p.group.lookAt(camera.position);
        p.group.rotateY(this.rigYaw);
        p.group.rotateX(this.rigPitch);
        p.group.rotateZ(this.rigRoll);
        p.group.position.set(
            this.rigOffset.x,
            PANEL_Y + this.rigOffset.y + Math.sin(elapsed * 0.6) * 0.045,
            PANEL_Z + this.rigOffset.z
        );
        p.group.updateMatrixWorld();
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
        'aimaze · Cubi v3.0 · MazeCube.onnx',
        '● MAZE ' + (mazeIdx + 1) + ' / ' + AIMAZE_MAZES.length);

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
        'PPO · 4 FANS × 13 RAYS × 18 CH · LSTM 256 · lr 3e-4 · beta 1.2e-2',
        barX + 24, barY + 30
    );

    ctx.fillStyle = '#3fca7d';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    const liveW = ctx.measureText('● RUNNING').width;
    ctx.fillText('● RUNNING', barX + barW - 24 - liveW, barY + 30);

    // The point of the project, stated plainly.
    ctx.fillStyle = '#5a616b';
    ctx.font = '500 14px "Inter", sans-serif';
    ctx.fillText(
        'It has never seen this maze, and it never gets the view you are looking at — only the rays.',
        barX + 2, barY + barH + 30
    );

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

    // ── What Cubi actually sees ──
    // The real model takes four fans of 13 rays, 18 channels each, and
    // is never given the goal's position or a map. Drawing the fan is
    // the only honest way to show that the thing solving this maze
    // cannot see the picture you are looking at.
    const RAYS = 13;
    const RAY_SPREAD = Math.PI * 0.64;
    const RAY_MAX = cell * 5.2;
    const acx = ax + cell / 2;
    const acy = ay + cell / 2;

    let heading = Math.atan2(nxtStep[1] - curStep[1], nxtStep[0] - curStep[0]);
    if (nxtStep[0] === curStep[0] && nxtStep[1] === curStep[1]) {
        heading = Math.sin(t * 0.7) * Math.PI;      // arrived, still looking around
    }

    const solidAt = (px, py) => {
        const c = Math.floor((px - mx) / (cell + gap));
        const r = Math.floor((py - my) / (cell + gap));
        if (c < 0 || r < 0 || c >= cols || r >= rows) return true;
        return maze.walls[r][c] === 1;
    };

    for (let i = 0; i < RAYS; i++) {
        const a = heading + (i / (RAYS - 1) - 0.5) * RAY_SPREAD;
        const dx = Math.cos(a), dy = Math.sin(a);

        let d = cell * 0.42;
        while (d < RAY_MAX && !solidAt(acx + dx * d, acy + dy * d)) d += 5;

        const hit = d < RAY_MAX;
        const rx = acx + dx * d, ry = acy + dy * d;
        const fade = 1 - d / RAY_MAX;

        ctx.strokeStyle = hit
            ? 'rgba(255,190,92,' + (0.16 + fade * 0.26).toFixed(3) + ')'
            : 'rgba(124,176,255,0.16)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(acx, acy);
        ctx.lineTo(rx, ry);
        ctx.stroke();

        if (hit) {
            ctx.fillStyle = 'rgba(255,190,92,0.7)';
            ctx.beginPath();
            ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

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
/* The editor half was one flat grey while the terminal half was
   coloured, and flat grey is what made it unreadable next to it. This
   is the smallest tokenizer that fixes that: comments dim, strings
   green, numbers warm, keywords in the file's own accent. */
const CODE_KEYWORDS = new Set([
    'import', 'from', 'class', 'def', 'return', 'if', 'else', 'for', 'while',
    'in', 'const', 'let', 'var', 'function', 'func', 'enum', 'case', 'object',
    'fun', 'val', 'export', 'new', 'struct', 'true', 'false', 'null', 'None',
    'self', 'String', 'Long', 'Int', 'float', 'str', 'dataclass'
]);

function drawCodeLine(ctx, text, x, y, accent) {
    const trimmed = text.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('///')) {
        ctx.fillStyle = '#7286a0';
        ctx.fillText(text, x, y);
        return;
    }

    // A trailing comment, but only if it is not inside a string.
    let head = text, tail = '';
    for (const mark of ['//', '#']) {
        const ci = text.indexOf(mark);
        if (ci > 0 && (text.slice(0, ci).split('"').length - 1) % 2 === 0) {
            head = text.slice(0, ci);
            tail = text.slice(ci);
            break;
        }
    }

    let cx = x;
    for (const part of head.split(/("[^"]*"|[A-Za-z_]\w*|\d[\w.\-]*)/)) {
        if (!part) continue;
        let col = '#e9edf4';
        if (part[0] === '"') col = '#8fd9a8';
        else if (CODE_KEYWORDS.has(part)) col = accent;
        else if (/^\d/.test(part)) col = '#ffbe5c';
        ctx.fillStyle = col;
        ctx.fillText(part, cx, y);
        cx += ctx.measureText(part).width;
    }

    if (tail) {
        ctx.fillStyle = '#7286a0';
        ctx.fillText(tail, cx, y);
    }
}

function drawLanguages(ctx, W, H, t) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);

    /* Real code from the four repos, and the real thing each one does.
       Nothing invented: the comments are lifted off disk, because the
       comments are the part that says how he works.

       The canvas is laid out for the portrait plate: the top half is
       the source, the bottom half is the output, and everything stays
       inside x < 714 because that is all the plate crops. */
    const files = [
        {
            name: 'proposer.py', lang: 'PYTHON', accent: '#4d8bf5', repo: 'RL-Scientist',
            code: [
                '# rl_scientist/agent/proposer.py',
                '# The local LLM proposes one change at a time.',
                'OLLAMA_URL = "localhost:11434/api/generate"',
                'DEFAULT_MODEL = "qwen2.5:7b"',
                '',
                '@dataclass',
                'class Proposal:',
                '    parameter: str',
                '    value: float | int',
                '    confidence: str'
            ],
            cmd: 'python -m rl_scientist run --episodes 500',
            out: [
                ['proposal   lr   3e-4  ->  1e-4', '#b0b8c4'],
                ['reason     reward plateaued at 381', '#5a616b'],
                ['whitelist  ok, 1 parameter', '#5a616b'],
                ['running experiment 14 ...', '#5a616b'],
                ['score 412.7   (was 381.2)', '#ededf0'],
                ['kept', '#3fca7d']
            ]
        },
        {
            name: 'HireCost.kt', lang: 'KOTLIN', accent: '#ff8a5c', repo: 'Construction-trades',
            code: [
                '// core/money/HireCost.kt',
                'object HireCost {',
                '  // Part days count as whole days, because',
                '  // hire companies charge that way.',
                '  fun daysOnHire(start: Long?, end: Long?,',
                '                 now: Long): Long {',
                '    val until = minOf(end ?: now, now)',
                '    if (until <= start) return 0L',
                '    return ceilDays(until - start)',
                '  }'
            ],
            cmd: 'daysOnHire(start = 3 Mar, end = 17 Mar, now = 2 Apr)',
            out: [
                ['machine went back Tue 17 Mar', '#b0b8c4'],
                ['charging stops that day, not today', '#5a616b'],
                ['14 days on hire', '#ededf0'],
                ['hire bill and job sheet agree', '#3fca7d']
            ]
        },
        {
            name: 'Exporter.swift', lang: 'SWIFT', accent: '#ffbe5c', repo: 'TradesManager iOS',
            code: [
                '/// One type, not three exporters, so a CSV',
                '/// and a PDF can never drift apart.',
                'enum ExportDocument {',
                '  case inventory([StockItem])',
                '  case project(Project, tasks: [ProjectTask])',
                '  case checklist(SafetyTemplate, run: Run)',
                '',
                '  func fileStem(_ loc: Localization) -> String',
                '}'
            ],
            cmd: 'export .inventory(214 items)',
            out: [
                ['inventory-2026-04-02.csv     214 rows', '#b0b8c4'],
                ['inventory-2026-04-02.pdf       9 pages', '#b0b8c4'],
                ['one ExportDocument, both files', '#5a616b'],
                ['spreadsheet and printout agree', '#3fca7d']
            ]
        },
        {
            name: 'ai-worker.js', lang: 'JAVASCRIPT', accent: '#b07cff', repo: 'AAUPath',
            code: [
                '// ai/cloudflare-worker.js',
                '// Static site, so it cannot hold a key.',
                '// This Worker is where the key lives.',
                'const TIERS = [',
                '  "gemini-flash-latest",       // ~250/day',
                '  "gemini-flash-lite-latest",  // ~1k/day',
                '  "@cf/meta/llama-3.1-8b"      // 10k/day',
                '];',
                '// Aliases, not pins. Pinned ones expire.'
            ],
            cmd: 'POST /ask',
            out: [
                ['tier 1   gemini-flash-latest      429', '#ff8a5c'],
                ['tier 2   gemini-flash-lite        200', '#b0b8c4'],
                ['answered in 1.4s', '#5a616b'],
                ['the key never left the Worker', '#3fca7d']
            ]
        }
    ];

    const FILE_DURATION = 7.5;
    const activeIdx = Math.floor(t / FILE_DURATION) % files.length;
    const ft = t % FILE_DURATION;
    const file = files[activeIdx];

    drawChrome(ctx, W, 'languages \u00b7 ' + file.repo, '\u25cf ' + file.lang);

    const LX = 34, LW = 680;           // everything lives inside the crop

    // ================= TOP HALF - the source =================
    const tabW = 160, tabGap = 10, tabY = 66, tabH = 42;
    files.forEach((f, i) => {
        const tx = LX + i * (tabW + tabGap);
        const isActive = i === activeIdx;

        ctx.fillStyle = isActive ? '#12151a' : 'transparent';
        ctx.strokeStyle = isActive ? f.accent : '#1a2028';
        ctx.lineWidth = isActive ? 1.5 : 1;
        roundRect(ctx, tx, tabY, tabW, tabH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isActive ? '#f0f3f8' : '#6f7d8e';
        ctx.font = '600 13px "JetBrains Mono", monospace';
        ctx.fillText(f.name, tx + 14, tabY + 26);

        if (isActive) {
            ctx.fillStyle = f.accent;
            ctx.beginPath();
            ctx.arc(tx + tabW - 14, tabY + 21, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Same near-black as the terminal below. The old lighter box was
    // costing the code most of its contrast.
    const ey = 118, eh = 272;
    ctx.fillStyle = '#070b11';
    ctx.strokeStyle = '#1d2632';
    ctx.lineWidth = 1.5;
    roundRect(ctx, LX, ey, LW, eh, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#04070b';
    ctx.fillRect(LX + 1, ey + 1, 52, eh - 2);

    const code = file.code;
    const lineH = 26;
    const lineDelay = 0.17;
    const visibleLines = Math.min(code.length, Math.floor(ft / lineDelay) + 1);

    for (let i = 0; i < visibleLines; i++) {
        const y = ey + 34 + i * lineH;

        ctx.fillStyle = '#4d5866';
        ctx.font = '500 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(String(i + 1), LX + 42, y);
        ctx.textAlign = 'left';

        ctx.globalAlpha = easeOutCubic(clamp01((ft - i * lineDelay) * 6));
        ctx.font = '500 16px "JetBrains Mono", monospace';
        drawCodeLine(ctx, code[i], LX + 66, y, file.accent);
        ctx.globalAlpha = 1;
    }

    if (visibleLines > 0 && visibleLines <= code.length && Math.sin(ft * 9) > 0) {
        const last = code[visibleLines - 1] || '';
        ctx.font = '500 16px "JetBrains Mono", monospace';
        ctx.fillStyle = file.accent;
        ctx.fillRect(LX + 66 + ctx.measureText(last).width + 4, ey + 34 + (visibleLines - 1) * lineH - 14, 2, 20);
    }

    // ================= the midline =================
    // The portrait plate cuts here, so the two halves are two plates.
    ctx.strokeStyle = '#1a2430';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(LX, 400.5);
    ctx.lineTo(LX + LW, 400.5);
    ctx.stroke();

    // ================= BOTTOM HALF - what it produced =================
    const codeDone = code.length * lineDelay + 0.25;

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText('OUTPUT', LX, 432);

    const runU = clamp01((ft - codeDone) * 2.2);
    ctx.fillStyle = runU > 0.5 ? '#3fca7d' : '#3a4048';
    ctx.beginPath();
    ctx.arc(LX + LW - 10, 428, 4, 0, Math.PI * 2);
    ctx.fill();

    const oy = 448, oh = 330;
    ctx.fillStyle = '#080c12';
    ctx.strokeStyle = '#1a2028';
    ctx.lineWidth = 1.5;
    roundRect(ctx, LX, oy, LW, oh, 10);
    ctx.fill();
    ctx.stroke();

    // the command
    ctx.fillStyle = file.accent;
    ctx.font = '600 15px "JetBrains Mono", monospace';
    ctx.fillText('$', LX + 22, oy + 40);

    const cmd = file.cmd;
    const cmdChars = Math.floor(clamp01((ft - codeDone) * 3.4) * cmd.length);
    ctx.fillStyle = '#d0d4dc';
    ctx.font = '500 15px "JetBrains Mono", monospace';
    ctx.fillText(cmd.slice(0, cmdChars), LX + 44, oy + 40);

    // the result
    const outStart = codeDone + cmd.length / (3.4 * cmd.length) + 0.45;
    const outDelay = 0.30;
    file.out.forEach((row, i) => {
        const u = clamp01((ft - outStart - i * outDelay) * 5);
        if (u <= 0) return;
        ctx.globalAlpha = easeOutCubic(u);

        const y = oy + 82 + i * 38;
        const isLast = i === file.out.length - 1;

        if (isLast) {
            ctx.fillStyle = '#3fca7d';
            ctx.font = '600 16px "JetBrains Mono", monospace';
            ctx.fillText('\u2713', LX + 26, y);
            ctx.fillStyle = row[1];
            ctx.font = '500 16px "JetBrains Mono", monospace';
            ctx.fillText(row[0], LX + 52, y);
        } else {
            ctx.fillStyle = '#2b3a4e';
            ctx.fillRect(LX + 26, y - 5, 5, 5);
            ctx.fillStyle = row[1];
            ctx.font = '500 15px "JetBrains Mono", monospace';
            ctx.fillText(row[0], LX + 52, y);
        }
        ctx.globalAlpha = 1;
    });
}

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
/* One pass of rl-scientist: eight real parameters, the score each one
   got, and whether it survived. The curve, the scatter and the log all
   read off this one list, so they can never disagree with each other. */
const AIDATA_EXPERIMENTS = [
    { param: 'gamma',     from: '.99',  to: '.995',   score: 344.1, kept: false, sx: 0.18, sy: 0.80,
      why: 'credit is arriving too late to matter' },
    { param: 'batch',     from: '512',  to: '1024',   score: 371.8, kept: true,  sx: 0.34, sy: 0.58,
      why: 'gradient noise is drowning the signal' },
    { param: 'beta',      from: '5e-3', to: '1.2e-2', score: 381.2, kept: true,  sx: 0.46, sy: 0.34,
      why: 'entropy std fell 0.44 to 0.05, it stopped exploring' },
    { param: 'epsilon',   from: '.2',   to: '.3',     score: 356.0, kept: false, sx: 0.62, sy: 0.74,
      why: 'let it take bigger policy steps' },
    { param: 'hidden',    from: '128',  to: '256',    score: 379.4, kept: false, sx: 0.28, sy: 0.24,
      why: 'maybe the network is simply too small' },
    { param: 'num_epoch', from: '3',    to: '5',      score: 392.5, kept: true,  sx: 0.72, sy: 0.46,
      why: 'reuse each batch harder before dropping it' },
    { param: 'lambd',     from: '.95',  to: '.92',    score: 401.3, kept: true,  sx: 0.84, sy: 0.62,
      why: 'trade a little bias for far less variance' },
    { param: 'lr',        from: '3e-4', to: '1e-4',   score: 412.7, kept: true,  sx: 0.56, sy: 0.18,
      why: 'reward flat at 381 for 40k steps' }
];

const AIDATA_STEPS = ['PROPOSE', 'RUN', 'SCORE', 'KEEP / REVERT'];
/* One experiment, in seconds. Propose long enough to read the quote,
   run long enough that it looks like work, judge quickly. */
const AIDATA_BOUNDS = [0, 4.4, 10.2, 13.0, 17.0];

/* The ring. Nodes sit on it at the quarter angles and the token runs
   round it, so the token passes through each step exactly as that step
   becomes the live one -- the geometry and the timing come off the same
   number and cannot drift apart. */
const RING_CX = 640, RING_CY = 414, RING_RX = 484, RING_RY = 302;

function ringPoint(ang) {
    return [RING_CX + Math.cos(ang) * RING_RX, RING_CY + Math.sin(ang) * RING_RY];
}

function drawStepNode(ctx, ang, label, live, accent) {
    const [cx, cy] = ringPoint(ang);
    const w = 22 + label.length * 9.2, h = 52;
    const x = cx - w / 2, y = cy - h / 2;

    ctx.fillStyle = live ? '#0f2419' : '#0a1410';
    ctx.strokeStyle = live ? accent : '#1d4032';
    ctx.lineWidth = live ? 2 : 1.2;
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    if (live) {
        ctx.save();
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = accent;
        roundRect(ctx, x - 5, y - 5, w + 10, h + 10, 11);
        ctx.fill();
        ctx.restore();
    }

    ctx.fillStyle = live ? '#c8ffe4' : '#4a7d63';
    ctx.font = '600 15px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy + 6);
    ctx.textAlign = 'left';
    return [cx, cy, w, h];
}

function drawAIData(ctx, W, H, t) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);

    const ACCENT = '#3fca7d';
    const EXP = AIDATA_BOUNDS[4];
    const total = AIDATA_EXPERIMENTS.length;
    const idx = Math.floor(t / EXP) % total;
    const et = t % EXP;
    const exp = AIDATA_EXPERIMENTS[idx];

    let step = 0;
    for (let i = 0; i < 4; i++) {
        if (et >= AIDATA_BOUNDS[i] && et < AIDATA_BOUNDS[i + 1]) { step = i; break; }
    }
    const stepU = clamp01((et - AIDATA_BOUNDS[step]) /
                          (AIDATA_BOUNDS[step + 1] - AIDATA_BOUNDS[step]));

    drawChrome(ctx, W, 'ai-data \u00b7 rl-scientist', '\u25cf EXPERIMENT ' + (idx + 1) + ' / ' + total);

    // ================= the ring =================
    ctx.strokeStyle = '#14291f';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 9]);
    ctx.beginPath();
    ctx.ellipse(RING_CX, RING_CY, RING_RX, RING_RY, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // The token's position comes off the PHASE, not off raw time, so it
    // sits exactly on whichever node is lit. Taking it from et / EXP
    // meant the phases (which are not equal lengths) did not line up with
    // the quarter turns, and the token ran up to a quarter of the ring
    // past the live step. That desync is what read as lighting late.
    const u = (step + stepU) / 4;
    const a0 = -Math.PI / 2;
    ctx.strokeStyle = 'rgba(63,202,125,0.42)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(RING_CX, RING_CY, RING_RX, RING_RY, 0, a0, a0 + u * Math.PI * 2);
    ctx.stroke();

    const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
    for (let i = 0; i < 4; i++) {
        drawStepNode(ctx, angles[i], AIDATA_STEPS[i], i === step, ACCENT);
    }

    // the token
    const [tx, ty] = ringPoint(a0 + u * Math.PI * 2);
    const glow = ctx.createRadialGradient(tx, ty, 0, tx, ty, 26);
    glow.addColorStop(0, 'rgba(200,255,228,0.85)');
    glow.addColorStop(1, 'rgba(63,202,125,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(tx, ty, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8fff4';
    ctx.beginPath();
    ctx.arc(tx, ty, 5, 0, Math.PI * 2);
    ctx.fill();

    // what the model just said, under PROPOSE
    if (step === 0) {
        ctx.globalAlpha = easeOutCubic(clamp01(stepU * 2.4));
        ctx.fillStyle = '#9096a0';
        ctx.font = '500 15px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('"' + exp.why + '"', RING_CX, 170);
        ctx.fillStyle = '#c8ffe4';
        ctx.font = '600 16px "JetBrains Mono", monospace';
        ctx.fillText(exp.param + '   ' + exp.from + '  \u2192  ' + exp.to, RING_CX, 196);
        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;
    }

    // ================= D4 - the curve, with the scar in it =================
    const cX = 330, cY = 214, cW = 300, cH = 232;

    ctx.fillStyle = '#080f0c';
    ctx.strokeStyle = '#16301f';
    ctx.lineWidth = 1.2;
    roundRect(ctx, cX, cY, cW, cH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a7d63';
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillText('MEAN REWARD', cX + 14, cY + 22);

    const lo = 320, hi = 430;
    const px = (i) => cX + 26 + (i / (total - 1)) * (cW - 48);
    const py = (s) => cY + cH - 26 - ((s - lo) / (hi - lo)) * (cH - 58);

    ctx.strokeStyle = '#11231a';
    ctx.lineWidth = 0.8;
    for (let g = 0; g <= 3; g++) {
        const gy = cY + 34 + g * ((cH - 60) / 3);
        ctx.beginPath();
        ctx.moveTo(cX + 20, gy);
        ctx.lineTo(cX + cW - 16, gy);
        ctx.stroke();
    }

    // points up to and including the one running now
    const shown = idx + (step >= 1 ? 1 : 0);
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < shown; i++) {
        const e = AIDATA_EXPERIMENTS[i];
        const x = px(i), y = py(e.score);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    for (let i = 0; i < shown; i++) {
        const e = AIDATA_EXPERIMENTS[i];
        ctx.fillStyle = e.kept ? '#7be8ae' : '#8a5050';
        ctx.beginPath();
        ctx.arc(px(i), py(e.score), e.kept ? 3.4 : 2.8, 0, Math.PI * 2);
        ctx.fill();
    }

    // mark the worst revert, because the dip is the honest part
    let worst = 0;
    for (let i = 1; i < Math.max(1, shown); i++) {
        if (!AIDATA_EXPERIMENTS[i].kept &&
            AIDATA_EXPERIMENTS[i].score < AIDATA_EXPERIMENTS[worst].score) worst = i;
    }
    if (shown > worst && !AIDATA_EXPERIMENTS[worst].kept) {
        const wx = px(worst), wy = py(AIDATA_EXPERIMENTS[worst].score);
        ctx.strokeStyle = 'rgba(255,107,107,0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(wx, wy + 6);
        ctx.lineTo(wx, cY + cH - 16);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#8a5050';
        ctx.font = '500 10px "JetBrains Mono", monospace';
        ctx.fillText('reverted', wx - 18, cY + cH - 6);
    }

    // the live score, resolving during SCORE
    if (step >= 2) {
        const su = step === 2 ? easeOutCubic(stepU) : 1;
        ctx.fillStyle = '#c8ffe4';
        ctx.font = '600 26px "Inter", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText((exp.score * su).toFixed(1), cX + cW - 16, cY + 32);
        ctx.textAlign = 'left';
    }

    // ================= D5 - the search space =================
    const sX = 650, sY = 214, sW = 300, sH = 232;

    ctx.fillStyle = '#080f0c';
    ctx.strokeStyle = '#16301f';
    ctx.lineWidth = 1.2;
    roundRect(ctx, sX, sY, sW, sH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a7d63';
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillText('SEARCH SPACE', sX + 14, sY + 22);

    ctx.strokeStyle = '#16301f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sX + 34, sY + 34);
    ctx.lineTo(sX + 34, sY + sH - 30);
    ctx.lineTo(sX + sW - 18, sY + sH - 30);
    ctx.stroke();

    const dotX = (e) => sX + 44 + e.sx * (sW - 74);
    const dotY = (e) => sY + 44 + (1 - e.sy) * (sH - 88);

    let best = -1;
    for (let i = 0; i < shown; i++) {
        const e = AIDATA_EXPERIMENTS[i];
        const norm = clamp01((e.score - lo) / (hi - lo));
        const r = 3 + norm * 5;
        ctx.fillStyle = e.kept
            ? 'rgba(63,202,125,' + (0.35 + norm * 0.6).toFixed(2) + ')'
            : 'rgba(120,80,80,0.55)';
        ctx.beginPath();
        ctx.arc(dotX(e), dotY(e), r, 0, Math.PI * 2);
        ctx.fill();
        if (best < 0 || e.score > AIDATA_EXPERIMENTS[best].score) best = i;
    }

    if (best >= 0) {
        const e = AIDATA_EXPERIMENTS[best];
        const bx = dotX(e), by = dotY(e);
        const pulse = 13 + Math.sin(t * 1.1) * 1.6;
        ctx.strokeStyle = '#7be8ae';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(bx, by, pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#c8ffe4';
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.fillText(e.score.toFixed(1), bx + 19, by - 2);
        ctx.fillStyle = '#4a7d63';
        ctx.font = '500 10px "JetBrains Mono", monospace';
        ctx.fillText('best so far', bx + 19, by + 12);
    }

    ctx.fillStyle = '#3a5f4c';
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.fillText('learning rate', sX + sW - 96, sY + sH - 14);
    ctx.save();
    ctx.translate(sX + 22, sY + 92);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('beta', 0, 0);
    ctx.restore();

    // ================= D2 - the little log tab =================
    const lX = 330, lY = 496, lW = 620, lH = 146;

    ctx.fillStyle = '#0a1410';
    ctx.strokeStyle = '#1d4032';
    ctx.lineWidth = 1.2;
    roundRect(ctx, lX + 14, lY - 20, 74, 24, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7be8ae';
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillText('LOG', lX + 34, lY - 4);

    ctx.fillStyle = '#080f0c';
    ctx.strokeStyle = '#16301f';
    ctx.lineWidth = 1.2;
    roundRect(ctx, lX, lY, lW, lH, 8);
    ctx.fill();
    ctx.stroke();

    // the last four, newest at the bottom
    const first = Math.max(0, shown - 4);
    for (let i = first; i < shown; i++) {
        const e = AIDATA_EXPERIMENTS[i];
        const row = i - first;
        const y = lY + 30 + row * 29;
        const isLive = (i === idx);
        const fade = isLive ? 1 : 0.34 + row * 0.13;

        if (isLive) {
            ctx.fillStyle = '#0f2419';
            ctx.strokeStyle = 'rgba(63,202,125,0.5)';
            ctx.lineWidth = 1;
            roundRect(ctx, lX + 10, y - 17, lW - 20, 25, 4);
            ctx.fill();
            ctx.stroke();
        }

        ctx.globalAlpha = fade;
        ctx.font = '500 13px "JetBrains Mono", monospace';
        ctx.fillStyle = '#4a7d63';
        ctx.fillText(String(i + 1).padStart(2, '0'), lX + 22, y);
        ctx.fillStyle = isLive ? '#ededf0' : '#b0b8c4';
        ctx.fillText(e.param, lX + 58, y);
        ctx.fillText(e.from + '  \u2192  ' + e.to, lX + 190, y);

        // the verdict only lands once the run is judged
        const judged = !isLive || step === 3;
        if (judged) {
            ctx.fillStyle = isLive ? '#c8ffe4' : '#9096a0';
            ctx.fillText(e.score.toFixed(1), lX + 400, y);
            ctx.fillStyle = e.kept ? '#3fca7d' : '#ff6b6b';
            ctx.font = '600 14px "JetBrains Mono", monospace';
            ctx.fillText(e.kept ? '\u2713 kept' : '\u2715 reverted', lX + 482, y);
        } else {
            ctx.fillStyle = '#4a7d63';
            const dots = '.'.repeat(1 + Math.floor((t * 1.3) % 3));
            ctx.fillText('running' + dots, lX + 400, y);
        }
        ctx.globalAlpha = 1;
    }
}

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