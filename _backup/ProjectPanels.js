/* ============================================================
   ProjectPanels.js — canvas-textured UI panels
   ============================================================ */

import * as THREE from 'three';

const CANVAS_W = 1280;
const CANVAS_H = 800;
const PANEL_W = 6.8;
const PANEL_H = PANEL_W * (CANVAS_H / CANVAS_W);
const PANEL_Z = 4.0;
const PANEL_Y = 5.8;

export class ProjectPanels {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        scene.add(this.group);

        this.panels = [];
        this.index = -1;
        this.opacity = 0;

        const drawers = [
            drawAAUP, drawTrades, drawRLScientist, drawListingLab, drawAIMaze
        ];

        drawers.forEach((fn, i) => {
            this.panels.push(this._buildPanel(fn, i));
        });

        this.setActive(0);
        this.group.visible = false;
    }

    _buildPanel(drawFn, index) {
        // Canvas
        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_W;
        canvas.height = CANVAS_H;
        const ctx = canvas.getContext('2d');
        drawFn(ctx, CANVAS_W, CANVAS_H);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.colorSpace = THREE.SRGBColorSpace;

        // Screen plane
        const screenGeo = new THREE.PlaneGeometry(PANEL_W, PANEL_H);
        const screenMat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            toneMapped: false
        });
        const screen = new THREE.Mesh(screenGeo, screenMat);

        // Bezel — dark frame slightly larger
        const bezelGeo = new THREE.PlaneGeometry(PANEL_W + 0.14, PANEL_H + 0.14);
        const bezelMat = new THREE.MeshBasicMaterial({
            color: 0x0a1220,
            transparent: true,
            opacity: 0,
            depthWrite: false
        });
        const bezel = new THREE.Mesh(bezelGeo, bezelMat);
        bezel.position.z = -0.01;

        // Glow — outer soft border (accent colored)
        const glowGeo = new THREE.PlaneGeometry(PANEL_W + 0.8, PANEL_H + 0.8);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x4d8bf5,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.z = -0.02;

        const group = new THREE.Group();
        group.add(glow);
        group.add(bezel);
        group.add(screen);

        group.position.set(0, PANEL_Y, PANEL_Z);
        group.visible = false;

        this.scene.add(group);

        return { group, screen, bezel, glow, index };
    }

    setActive(index) {
        if (index === this.index) return;
        this.index = index;
        this.panels.forEach((p, i) => {
            p.group.visible = (i === index);
        });
        this.group.visible = true;
    }

    setOpacity(o) {
        this.opacity = Math.max(0, Math.min(1, o));
        const p = this.panels[this.index];
        if (!p) return;
        p.screen.material.opacity = this.opacity;
        p.bezel.material.opacity = this.opacity * 0.9;
        p.glow.material.opacity = this.opacity * 0.35;
        if (this.opacity < 0.02) p.group.visible = false;
        else p.group.visible = true;
    }
    setAccentColor(hex) {
        this.panels.forEach(p => {
            if (p.glow && p.glow.material) {
                p.glow.material.color.set(hex);
            }
        });
    }
    
    update(dt, camera, elapsed) {
        const p = this.panels[this.index];
        if (!p || !p.group.visible) return;

        // Billboard toward camera
        p.group.lookAt(camera.position);

        // Gentle float
        p.group.position.y = PANEL_Y + Math.sin(elapsed * 0.7) * 0.05;
    }
}

// ============================================================
// CANVAS DRAWING — one per project
// ============================================================

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawChrome(ctx, W, title, statusText) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, 56);
    const dots = ['#3a2a2e', '#3a3526', '#263a2d'];
    dots.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(34 + i * 24, 28, 7, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.fillStyle = '#5a616b';
    ctx.font = '500 16px "JetBrains Mono", monospace';
    ctx.fillText(title, 130, 34);

    if (statusText) {
        ctx.fillStyle = '#3fca7d';
        ctx.font = '600 14px "JetBrains Mono", monospace';
        const tw = ctx.measureText(statusText).width;
        ctx.fillText(statusText, W - 34 - tw, 34);
    }
}

function drawAAUP(ctx, W, H) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);
    drawChrome(ctx, W, 'aaup-planner · /plan/fall-2026', '● SYNCED');

    // Left sidebar — prereq chain
    const sx = 40;
    ctx.fillStyle = '#0d121a';
    roundRect(ctx, sx, 88, 300, H - 130, 10);
    ctx.fill();

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText('PREREQUISITE CHAIN', sx + 22, 122);

    const nodes = [
        { label: 'CS101 · Intro CS',           state: 'done' },
        { label: 'CS201 · Data Structures',    state: 'done' },
        { label: 'CS301 · Algorithms',         state: 'active' },
        { label: 'CS401 · Compilers',          state: 'locked' },
        { label: 'CS499 · Thesis',             state: 'locked' }
    ];
    nodes.forEach((n, i) => {
        const ny = 150 + i * 62;
        ctx.strokeStyle = n.state === 'active' ? '#4d8bf5'
                        : n.state === 'done'   ? '#22303f'
                        : '#1a2028';
        ctx.lineWidth = 1.5;
        ctx.fillStyle = n.state === 'active' ? 'rgba(77,139,245,0.08)'
                      : n.state === 'done'   ? 'rgba(63,202,125,0.05)'
                      : 'rgba(255,255,255,0.02)';
        roundRect(ctx, sx + 20, ny, 260, 46, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = n.state === 'active' ? '#ffffff'
                      : n.state === 'done'   ? '#b0b8c4'
                      : '#3a4048';
        ctx.font = '600 14px "JetBrains Mono", monospace';
        ctx.fillText(n.label, sx + 36, ny + 30);

        if (n.state === 'done') {
            ctx.fillStyle = '#3fca7d';
            ctx.font = '700 16px monospace';
            ctx.fillText('✓', sx + 248, ny + 30);
        } else if (n.state === 'active') {
            ctx.fillStyle = '#4d8bf5';
            ctx.font = '700 14px monospace';
            ctx.fillText('▶', sx + 250, ny + 30);
        }
    });

    // Right — semester info + course cards
    const rx = 370;

    ctx.fillStyle = '#d0d4dc';
    ctx.font = '500 24px "Inter", sans-serif';
    ctx.fillText('Fall 2026 · Semester Plan', rx, 130);

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText('4 COURSES · 13 CREDITS', rx, 156);

    const courses = [
        { code: 'CS201',   name: 'Data Structures',                pct: 0.72 },
        { code: 'AI310',   name: 'Intro to Artificial Intelligence', pct: 0.41 },
        { code: 'MATH220', name: 'Linear Algebra',                 pct: 0.88 },
        { code: 'ENG150',  name: 'Technical Writing',              pct: 0.14 }
    ];
    courses.forEach((c, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cx = rx + col * 440;
        const cy = 190 + row * 200;

        ctx.fillStyle = '#0d1119';
        roundRect(ctx, cx, cy, 400, 170, 10);
        ctx.fill();
        ctx.strokeStyle = '#1a2028';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#4d8bf5';
        ctx.font = '600 14px "JetBrains Mono", monospace';
        ctx.fillText(c.code, cx + 24, cy + 36);

        ctx.fillStyle = '#d0d4dc';
        ctx.font = '500 20px "Inter", sans-serif';
        ctx.fillText(c.name, cx + 24, cy + 76);

        ctx.fillStyle = '#1a2028';
        roundRect(ctx, cx + 24, cy + 118, 352, 8, 4);
        ctx.fill();

        const grad = ctx.createLinearGradient(cx + 24, 0, cx + 376, 0);
        grad.addColorStop(0, '#4d8bf5');
        grad.addColorStop(1, '#6ba0ff');
        ctx.fillStyle = grad;
        roundRect(ctx, cx + 24, cy + 118, 352 * c.pct, 8, 4);
        ctx.fill();

        ctx.fillStyle = '#4a525c';
        ctx.font = '500 14px "JetBrains Mono", monospace';
        ctx.fillText(Math.round(c.pct * 100) + '%', cx + 340, cy + 158);
    });
}

function drawTrades(ctx, W, H) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);
    drawChrome(ctx, W, 'trades · site-04-tlv', '● OFFLINE · SYNCING');

    // Central phone
    const pw = 420;
    const ph = H - 140;
    const px = (W - pw) / 2;
    const py = 90;

    ctx.fillStyle = '#0d1119';
    roundRect(ctx, px, py, pw, ph, 20);
    ctx.fill();
    ctx.strokeStyle = '#1a2028';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Phone header
    ctx.fillStyle = '#d0d4dc';
    ctx.font = '600 16px "JetBrains Mono", monospace';
    ctx.fillText('SITE #04 · TLV', px + 30, py + 50);

    ctx.fillStyle = '#3fca7d';
    ctx.beginPath();
    ctx.arc(px + pw - 80, py + 44, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '600 14px "JetBrains Mono", monospace';
    ctx.fillText('LIVE', px + pw - 66, py + 50);

    // Tabs
    const tabs = ['Workers', 'Hours', 'Payroll'];
    const tabW = (pw - 60) / 3 - 8;
    tabs.forEach((t, i) => {
        const tx = px + 30 + i * (tabW + 8);
        const ty = py + 80;
        ctx.fillStyle = i === 0 ? 'rgba(77,139,245,0.12)' : '#12151a';
        ctx.strokeStyle = i === 0 ? '#4d8bf5' : '#1a2028';
        ctx.lineWidth = 1.5;
        roundRect(ctx, tx, ty, tabW, 48, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = i === 0 ? '#ffffff' : '#666c78';
        ctx.font = '600 14px "Inter", sans-serif';
        const tw = ctx.measureText(t).width;
        ctx.fillText(t, tx + (tabW - tw) / 2, ty + 30);
    });

    // Worker rows
    const workers = [
        { initial: 'A', name: 'Ahmed Mansour',  status: 'here' },
        { initial: 'Y', name: 'Yousef Haddad',  status: 'here' },
        { initial: 'M', name: 'Mahmoud Said',   status: 'late' },
        { initial: 'K', name: 'Khaled Nasser',  status: 'off'  }
    ];
    workers.forEach((w, i) => {
        const ry = py + 156 + i * 78;
        ctx.fillStyle = '#12151a';
        ctx.strokeStyle = '#1a2028';
        ctx.lineWidth = 1;
        roundRect(ctx, px + 30, ry, pw - 60, 66, 10);
        ctx.fill();
        ctx.stroke();

        // Avatar
        ctx.fillStyle = '#191c22';
        ctx.beginPath();
        ctx.arc(px + 62, ry + 33, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6ba0ff';
        ctx.font = '700 18px "Inter", sans-serif';
        ctx.fillText(w.initial, px + 56, ry + 40);

        // Name
        ctx.fillStyle = '#d0d4dc';
        ctx.font = '500 16px "Inter", sans-serif';
        ctx.fillText(w.name, px + 100, ry + 40);

        // Status
        const colors = {
            here: { bg: 'rgba(63,202,125,0.12)', fg: '#3fca7d' },
            late: { bg: 'rgba(255,190,92,0.12)', fg: '#ffbe5c' },
            off:  { bg: '#191c22', fg: '#5a616b' }
        };
        const c = colors[w.status];
        const label = w.status.toUpperCase();
        ctx.font = '600 12px "JetBrains Mono", monospace';
        const lw = ctx.measureText(label).width + 24;
        ctx.fillStyle = c.bg;
        roundRect(ctx, px + pw - 30 - lw, ry + 20, lw, 26, 13);
        ctx.fill();
        ctx.fillStyle = c.fg;
        ctx.fillText(label, px + pw - 30 - lw + 12, ry + 38);
    });

    // Total
    const ty = py + ph - 90;
    ctx.fillStyle = 'rgba(77,139,245,0.1)';
    ctx.strokeStyle = 'rgba(77,139,245,0.3)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, px + 30, ty, pw - 60, 64, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9096a0';
    ctx.font = '600 14px "JetBrains Mono", monospace';
    ctx.fillText("TODAY'S WAGES", px + 48, ty + 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 26px "JetBrains Mono", monospace';
    const tw2 = ctx.measureText('₪1,240').width;
    ctx.fillText('₪1,240', px + pw - 48 - tw2, ty + 44);
}

function drawRLScientist(ctx, W, H) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);
    drawChrome(ctx, W, 'rl-scientist · run #47', '● TRAINING');

    const cx1 = 40, cy = 90, cw = 460, ch = H - 140;

    // Left card — metrics
    ctx.fillStyle = '#0d1119';
    ctx.strokeStyle = '#1a2028';
    ctx.lineWidth = 1.5;
    roundRect(ctx, cx1, cy, cw, ch, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('AGENT METRICS', cx1 + 26, cy + 38);

    const stats = [
        ['reward / mean', '0.847'],
        ['loss',          '0.023'],
        ['steps',         '12.4k'],
        ['episodes',      '340']
    ];
    stats.forEach((s, i) => {
        ctx.fillStyle = '#4a525c';
        ctx.font = '500 16px "Inter", sans-serif';
        ctx.fillText(s[0], cx1 + 26, cy + 88 + i * 38);

        ctx.fillStyle = '#6ba0ff';
        ctx.font = '600 17px "JetBrains Mono", monospace';
        const w = ctx.measureText(s[1]).width;
        ctx.fillText(s[1], cx1 + cw - 26 - w, cy + 88 + i * 38);
    });

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('LLM PROPOSALS', cx1 + 26, cy + 272);

    const logs = [
        ['01:12', 'increase entropy → 0.015'],
        ['01:24', 'learning rate → 3e-4'],
        ['01:37', 'add LSTM layer']
    ];
    logs.forEach((l, i) => {
        ctx.fillStyle = '#4d8bf5';
        ctx.font = '500 14px "JetBrains Mono", monospace';
        ctx.fillText(l[0], cx1 + 26, cy + 308 + i * 32);

        ctx.fillStyle = '#b0b8c4';
        ctx.font = '500 14px "JetBrains Mono", monospace';
        ctx.fillText(l[1], cx1 + 84, cy + 308 + i * 32);
    });

    // Right card — chart
    const cx2 = 530;
    const cw2 = W - cx2 - 40;

    ctx.fillStyle = '#0d1119';
    roundRect(ctx, cx2, cy, cw2, ch, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('REWARD CURVE · LAST 100 EPOCHS', cx2 + 26, cy + 38);

    // Chart
    const chx = cx2 + 26;
    const chy = cy + 78;
    const chw = cw2 - 52;
    const chh = 260;

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(chx, chy + (chh / 5) * i);
        ctx.lineTo(chx + chw, chy + (chh / 5) * i);
        ctx.stroke();
    }

    const grad = ctx.createLinearGradient(0, chy, 0, chy + chh);
    grad.addColorStop(0, 'rgba(77,139,245,0.35)');
    grad.addColorStop(1, 'rgba(77,139,245,0)');

    const points = [];
    for (let i = 0; i <= 40; i++) {
        const x = chx + (i / 40) * chw;
        const t = i / 40;
        const y = chy + chh * (0.85 - t * 0.7) - Math.sin(t * 8) * 10;
        points.push({ x, y });
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(chx + chw, chy + chh);
    ctx.lineTo(chx, chy + chh);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = '#4d8bf5';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Baseline
    ctx.beginPath();
    ctx.moveTo(chx, chy + chh * 0.95);
    for (let i = 0; i <= 40; i++) {
        const x = chx + (i / 40) * chw;
        const t = i / 40;
        const y = chy + chh * (0.9 - t * 0.5);
        ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(63,202,125,0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Stats bottom
    ctx.fillStyle = '#4a525c';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('BEST REWARD', cx2 + 26, cy + 400);
    ctx.fillStyle = '#3fca7d';
    ctx.font = '600 24px "JetBrains Mono", monospace';
    ctx.fillText('0.847', cx2 + 26, cy + 434);

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('IMPROVEMENT', cx2 + 260, cy + 400);
    ctx.fillStyle = '#6ba0ff';
    ctx.font = '600 24px "JetBrains Mono", monospace';
    ctx.fillText('+0.328', cx2 + 260, cy + 434);
}

function drawListingLab(ctx, W, H) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);
    drawChrome(ctx, W, 'listing-lab · local', 'ollama · qwen2.5');

    const gap = 24;
    const cw = (W - 40 - gap * 2) / 2;
    const lx = 20;
    const ly = 80;
    const lh = H - 120;

    // Left
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

    const fields = [
        { label: 'PRODUCT',   value: 'Vintage denim jacket' },
        { label: 'CONDITION', value: 'Good · Size M' },
        { label: 'CATEGORY',  value: 'Fashion → Outerwear' }
    ];
    fields.forEach((f, i) => {
        const fy = ly + 78 + i * 104;

        ctx.fillStyle = '#4a525c';
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.fillText(f.label, lx + 26, fy);

        ctx.fillStyle = '#12151a';
        ctx.strokeStyle = '#1a2028';
        roundRect(ctx, lx + 26, fy + 16, cw - 52, 54, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#d0d4dc';
        ctx.font = '500 16px "Inter", sans-serif';
        ctx.fillText(f.value, lx + 44, fy + 52);
    });

    // Generate button
    const by = ly + lh - 80;
    ctx.fillStyle = 'rgba(77,139,245,0.15)';
    ctx.strokeStyle = '#4d8bf5';
    ctx.lineWidth = 1.5;
    roundRect(ctx, lx + 26, by, cw - 52, 54, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#6ba0ff';
    ctx.font = '600 15px "JetBrains Mono", monospace';
    const btnText = '▶  GENERATE';
    const bw = ctx.measureText(btnText).width;
    ctx.fillText(btnText, lx + 26 + (cw - 52 - bw) / 2, by + 34);

    // Right
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

    // Output 1
    ctx.fillStyle = '#12151a';
    ctx.strokeStyle = '#1a2028';
    roundRect(ctx, rx + 26, ry2 + 68, cw - 52, 100, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#d0d4dc';
    ctx.font = '600 18px "Inter", sans-serif';
    ctx.fillText('Vintage 90s Denim Jacket', rx + 44, ry2 + 106);
    ctx.font = '500 15px "Inter", sans-serif';
    ctx.fillStyle = '#9096a0';
    ctx.fillText("Men's Medium", rx + 44, ry2 + 134);

    // Output 2 — description
    ctx.fillStyle = '#12151a';
    roundRect(ctx, rx + 26, ry2 + 184, cw - 52, 116, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9096a0';
    ctx.font = '500 14px "Inter", sans-serif';
    ctx.fillText('Classic washed denim with original', rx + 44, ry2 + 216);
    ctx.fillText('hardware. Soft broken-in feel —', rx + 44, ry2 + 240);
    ctx.fillText('perfect layering piece for fall.', rx + 44, ry2 + 264);

    // Tags
    const tags = ['vintage', 'denim', '90s', 'menswear'];
    let tx = rx + 26;
    tags.forEach(t => {
        ctx.font = '600 12px "JetBrains Mono", monospace';
        const tw = ctx.measureText(t).width + 24;
        ctx.fillStyle = 'rgba(77,139,245,0.12)';
        ctx.strokeStyle = 'rgba(77,139,245,0.4)';
        ctx.lineWidth = 1;
        roundRect(ctx, tx, ry2 + 318, tw, 28, 14);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#6ba0ff';
        ctx.fillText(t, tx + 12, ry2 + 337);
        tx += tw + 8;
    });

    // Price
    const py2 = ry2 + lh - 100;
    ctx.fillStyle = 'rgba(63,202,125,0.08)';
    ctx.strokeStyle = 'rgba(63,202,125,0.3)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, rx + 26, py2, cw - 52, 72, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9096a0';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('SUGGESTED PRICE', rx + 44, py2 + 44);

    ctx.fillStyle = '#3fca7d';
    ctx.font = '600 28px "JetBrains Mono", monospace';
    const priceW = ctx.measureText('₪185').width;
    ctx.fillText('₪185', rx + cw - 44 - priceW, py2 + 48);
}

function drawAIMaze(ctx, W, H) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);
    drawChrome(ctx, W, 'aimaze · episode 1284', '● TRAINING');

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
    ctx.fillText('ML-AGENTS · POLICY : PPO', barX + 24, barY + 30);

    ctx.fillStyle = '#3fca7d';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    const liveW = ctx.measureText('● RUNNING').width;
    ctx.fillText('● RUNNING', barX + barW - 24 - liveW, barY + 30);

    // Maze
    const cols = 12, rows = 8;
    const cell = 62;
    const gap = 2;
    const mw = cols * cell + (cols - 1) * gap;
    const mh = rows * cell + (rows - 1) * gap;
    const mx = (W - mw) / 2;
    const my = barY + barH + 50;

    const walls = [
        [1,1,0,0,0,1,0,0,0,0,0,0],
        [0,0,0,1,0,1,0,1,1,1,0,0],
        [0,1,0,1,0,0,0,0,0,1,0,0],
        [0,1,0,1,1,1,1,1,0,1,0,1],
        [0,1,0,0,0,0,0,1,0,1,0,1],
        [0,1,1,1,1,1,0,1,0,1,0,1],
        [0,0,0,0,0,1,0,1,0,1,0,1],
        [1,1,1,1,0,1,0,0,0,1,0,2]
    ];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = mx + c * (cell + gap);
            const y = my + r * (cell + gap);
            const w = walls[r][c];

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
                const grad = ctx.createRadialGradient(
                    x + cell / 2, y + cell / 2, 4,
                    x + cell / 2, y + cell / 2, cell * 0.7
                );
                grad.addColorStop(0, 'rgba(63,202,125,0.7)');
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

    // Agent — bright blue
    const agCol = 6, agRow = 4;
    const ax = mx + agCol * (cell + gap);
    const ay = my + agRow * (cell + gap);

    const agGrad = ctx.createLinearGradient(ax, ay, ax, ay + cell);
    agGrad.addColorStop(0, '#7cb0ff');
    agGrad.addColorStop(1, '#4d8bf5');
    ctx.fillStyle = agGrad;
    roundRect(ctx, ax, ay, cell, cell, 4);
    ctx.fill();

    ctx.shadowColor = 'rgba(77,139,245,0.8)';
    ctx.shadowBlur = 24;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Stats
    const statsY = my + mh + 40;
    const stats = [
        { label: 'STEPS',   value: '124' },
        { label: 'REWARD',  value: '+8.42' },
        { label: 'SUCCESS', value: '94%' }
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