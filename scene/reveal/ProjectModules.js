import * as THREE from 'three';

export class ProjectModule {
    constructor(scene, index, drawFn) {
        this.scene = scene;
        this.index = index;

        // Canvas + texture
        this.canvas = document.createElement('canvas');
        this.canvas.width  = 1024;
        this.canvas.height = 640;
        this.ctx = this.canvas.getContext('2d');
        drawFn(this.ctx, this.canvas.width, this.canvas.height);

        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.LinearFilter;
        this.texture.colorSpace = THREE.SRGBColorSpace;

        // Screen plane — wide landscape, thin bezel
        const aspect = this.canvas.width / this.canvas.height;
        const w = 5.6;
        const h = w / aspect;
        this.geometry = new THREE.PlaneGeometry(w, h);

        this.material = new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);

        // Frame around the screen — subtle bezel
        const frameGeo = new THREE.BoxGeometry(w + 0.14, h + 0.14, 0.04);
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x15181f,
            roughness: 0.3,
            metalness: 0.9,
            transparent: true,
            opacity: 0
        });
        this.frame = new THREE.Mesh(frameGeo, frameMat);

        // Group so we can move/rotate them together
        this.group = new THREE.Group();
        this.group.add(this.frame);
        this.group.add(this.mesh);

        // Mount inside the shell, at a height corresponding to the slot
        // (project 0 = lowest, project 4 = highest)
        const y = -6 + index * 3.6;
        this.group.position.set(0, y, 0);
        this.group.rotation.y = Math.PI / 2; // facing outward from spine

        scene.add(this.group);

        // State
        this.visible = false;
        this.progress = 0;
    }

    setVisible(v) {
        this.visible = v;
    }

    setProgress(p) {
        // p is 0..1 within this module's display window
        this.progress = Math.max(0, Math.min(1, p));
    }

    update(dt) {
        // Opacity fades in/out on visibility
        const targetOpacity = this.visible ? 1 : 0;
        const lerp = Math.min(1, dt * 4);
        this.material.opacity += (targetOpacity - this.material.opacity) * lerp;
        this.frame.material.opacity += (targetOpacity - this.frame.material.opacity) * lerp;

        // Subtle enter/exit curve — screen scales in on entry, slight tilt
        const enterT = this.visible
            ? Math.min(1, this.progress * 4)          // enter fast
            : Math.max(0, 1 - this.progress * 4);      // exit fast

        const scale = 0.92 + enterT * 0.08;
        this.mesh.scale.setScalar(scale);

        // Slow rotation — screen face toward camera when active
        const targetRotY = this.visible ? 0 : Math.PI / 2;
        const rotLerp = Math.min(1, dt * 2.5);
        this.group.rotation.y += (targetRotY - this.group.rotation.y) * rotLerp;

        // Gentle float
        const t = performance.now() * 0.001;
        this.group.position.y += Math.sin(t + this.index) * 0.0006;
    }
}

// ============================================================
// Canvas drawing functions — one per project
// ============================================================

function drawAAUP(ctx, W, H) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);

    // Chrome bar
    ctx.fillStyle = '#111620';
    ctx.fillRect(0, 0, W, 44);
    const dots = ['#3a2a2e', '#3a3526', '#263a2d'];
    dots.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(28 + i * 22, 22, 7, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.fillStyle = '#5a616b';
    ctx.font = '600 15px "JetBrains Mono", monospace';
    ctx.fillText('aaup-planner · /plan/fall-2026', 110, 27);

    // Left sidebar
    ctx.fillStyle = '#0d121a';
    ctx.fillRect(0, 44, 260, H - 44);

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillText('PREREQUISITE CHAIN', 24, 90);

    const nodes = [
        { y: 120, label: 'CS101 · Intro CS', state: 'done' },
        { y: 172, label: 'CS201 · Data Structures', state: 'done' },
        { y: 224, label: 'CS301 · Algorithms', state: 'active' },
        { y: 276, label: 'CS401 · Compilers', state: 'locked' },
        { y: 328, label: 'CS499 · Thesis', state: 'locked' }
    ];
    nodes.forEach(n => {
        ctx.strokeStyle = n.state === 'active' ? '#4d8bf5'
                        : n.state === 'done'   ? '#22303f'
                        : '#1a2028';
        ctx.lineWidth = 1.5;
        ctx.fillStyle = n.state === 'active' ? 'rgba(77,139,245,0.08)'
                      : n.state === 'done'   ? 'rgba(63,202,125,0.04)'
                      : 'rgba(255,255,255,0.02)';
        roundRect(ctx, 20, n.y, 220, 40, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = n.state === 'active' ? '#ffffff'
                      : n.state === 'done'   ? '#b0b8c4'
                      : '#3a4048';
        ctx.font = '600 13px "JetBrains Mono", monospace';
        ctx.fillText(n.label, 34, n.y + 25);

        if (n.state === 'done') {
            ctx.fillStyle = '#3fca7d';
            ctx.font = '700 14px monospace';
            ctx.fillText('✓', 210, n.y + 26);
        } else if (n.state === 'active') {
            ctx.fillStyle = '#4d8bf5';
            ctx.font = '700 12px monospace';
            ctx.fillText('▶', 214, n.y + 26);
        }
    });

    // Right content
    ctx.fillStyle = '#d0d4dc';
    ctx.font = '500 22px "Inter", sans-serif';
    ctx.fillText('Fall 2026 · Semester Plan', 296, 100);

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillText('4 COURSES · 13 CREDITS', 296, 124);

    // Course cards
    const courses = [
        { code: 'CS201', name: 'Data Structures', pct: 0.72 },
        { code: 'AI310', name: 'Intro to Artificial Intelligence', pct: 0.41 },
        { code: 'MATH220', name: 'Linear Algebra', pct: 0.88 },
        { code: 'ENG150', name: 'Technical Writing', pct: 0.14 }
    ];
    courses.forEach((c, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 296 + col * 340;
        const y = 160 + row * 140;

        ctx.fillStyle = '#0d1119';
        roundRect(ctx, x, y, 320, 120, 10);
        ctx.fill();
        ctx.strokeStyle = '#1a2028';
        ctx.stroke();

        ctx.fillStyle = '#4d8bf5';
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.fillText(c.code, x + 20, y + 30);

        ctx.fillStyle = '#d0d4dc';
        ctx.font = '500 16px "Inter", sans-serif';
        ctx.fillText(c.name, x + 20, y + 58);

        // Progress bar
        ctx.fillStyle = '#1a2028';
        roundRect(ctx, x + 20, y + 84, 280, 6, 3);
        ctx.fill();

        const grad = ctx.createLinearGradient(x + 20, 0, x + 300, 0);
        grad.addColorStop(0, '#4d8bf5');
        grad.addColorStop(1, '#6ba0ff');
        ctx.fillStyle = grad;
        roundRect(ctx, x + 20, y + 84, 280 * c.pct, 6, 3);
        ctx.fill();
    });
}

function drawTrades(ctx, W, H) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);

    // Chrome
    ctx.fillStyle = '#111620';
    ctx.fillRect(0, 0, W, 44);
    const dots = ['#3a2a2e', '#3a3526', '#263a2d'];
    dots.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(28 + i * 22, 22, 7, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.fillStyle = '#5a616b';
    ctx.font = '600 15px "JetBrains Mono", monospace';
    ctx.fillText('trades · site-04-tlv', 110, 27);

    ctx.fillStyle = '#3fca7d';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('● OFFLINE · SYNCING', W - 260, 27);

    // Phone in center
    const pw = 340, ph = 520;
    const px = (W - pw) / 2, py = (H - ph) / 2 + 10;

    ctx.fillStyle = '#0d1119';
    roundRect(ctx, px, py, pw, ph, 24);
    ctx.fill();
    ctx.strokeStyle = '#1a2028';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Top bar
    ctx.fillStyle = '#d0d4dc';
    ctx.font = '600 14px "JetBrains Mono", monospace';
    ctx.fillText('SITE #04 · TLV', px + 24, py + 42);

    ctx.fillStyle = '#3fca7d';
    ctx.beginPath();
    ctx.arc(px + pw - 60, py + 38, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText('LIVE', px + pw - 48, py + 42);

    // Tabs
    const tabs = ['Workers', 'Hours', 'Payroll'];
    tabs.forEach((t, i) => {
        const tw = (pw - 48) / 3 - 6;
        const tx = px + 24 + i * (tw + 6);
        ctx.fillStyle = i === 0 ? 'rgba(77,139,245,0.12)' : '#12151a';
        ctx.strokeStyle = i === 0 ? '#4d8bf5' : '#1a2028';
        ctx.lineWidth = 1.5;
        roundRect(ctx, tx, py + 66, tw, 40, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = i === 0 ? '#ffffff' : '#666c78';
        ctx.font = '600 13px "Inter", sans-serif';
        const tw2 = ctx.measureText(t).width;
        ctx.fillText(t, tx + (tw - tw2) / 2, py + 92);
    });

    // Worker rows
    const workers = [
        { initial: 'A', name: 'Ahmed Mansour', status: 'here' },
        { initial: 'Y', name: 'Yousef Haddad', status: 'here' },
        { initial: 'M', name: 'Mahmoud Said',  status: 'late' },
        { initial: 'K', name: 'Khaled Nasser', status: 'off'  }
    ];
    workers.forEach((w, i) => {
        const ry = py + 130 + i * 66;
        ctx.fillStyle = '#12151a';
        ctx.strokeStyle = '#1a2028';
        ctx.lineWidth = 1;
        roundRect(ctx, px + 24, ry, pw - 48, 56, 10);
        ctx.fill();
        ctx.stroke();

        // Avatar
        ctx.fillStyle = '#191c22';
        ctx.beginPath();
        ctx.arc(px + 52, ry + 28, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#6ba0ff';
        ctx.font = '700 16px "Inter", sans-serif';
        ctx.fillText(w.initial, px + 47, ry + 34);

        // Name
        ctx.fillStyle = '#d0d4dc';
        ctx.font = '500 15px "Inter", sans-serif';
        ctx.fillText(w.name, px + 86, ry + 34);

        // Status badge
        const colors = {
            here: { bg: 'rgba(63,202,125,0.12)', fg: '#3fca7d' },
            late: { bg: 'rgba(255,190,92,0.12)', fg: '#ffbe5c' },
            off:  { bg: '#191c22', fg: '#5a616b' }
        };
        const c = colors[w.status];
        const label = w.status.toUpperCase();
        ctx.font = '600 11px "JetBrains Mono", monospace';
        const lw = ctx.measureText(label).width + 20;
        ctx.fillStyle = c.bg;
        roundRect(ctx, px + pw - 24 - lw, ry + 18, lw, 22, 11);
        ctx.fill();
        ctx.fillStyle = c.fg;
        ctx.fillText(label, px + pw - 24 - lw + 10, ry + 33);
    });

    // Total
    const ty = py + ph - 80;
    ctx.fillStyle = 'rgba(77,139,245,0.1)';
    ctx.strokeStyle = 'rgba(77,139,245,0.3)';
    roundRect(ctx, px + 24, ty, pw - 48, 56, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9096a0';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText("TODAY'S WAGES", px + 40, ty + 34);

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 22px "JetBrains Mono", monospace';
    const totW = ctx.measureText('₪1,240').width;
    ctx.fillText('₪1,240', px + pw - 40 - totW, ty + 38);
}

function drawRLScientist(ctx, W, H) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);

    // Chrome
    ctx.fillStyle = '#111620';
    ctx.fillRect(0, 0, W, 44);
    const dots = ['#3a2a2e', '#3a3526', '#263a2d'];
    dots.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(28 + i * 22, 22, 7, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.fillStyle = '#5a616b';
    ctx.font = '600 15px "JetBrains Mono", monospace';
    ctx.fillText('rl-scientist · run #47', 110, 27);

    ctx.fillStyle = '#3fca7d';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('● TRAINING', W - 180, 27);

    // Left card — metrics
    const cx1 = 40, cy = 80, cw = 420, ch = H - 120;

    ctx.fillStyle = '#0d1119';
    ctx.strokeStyle = '#1a2028';
    ctx.lineWidth = 1.5;
    roundRect(ctx, cx1, cy, cw, ch, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText('AGENT METRICS', cx1 + 24, cy + 34);

    const stats = [
        ['reward / mean', '0.847'],
        ['loss',          '0.023'],
        ['steps',         '12.4k'],
        ['episodes',      '340']
    ];
    stats.forEach((s, i) => {
        ctx.fillStyle = '#4a525c';
        ctx.font = '500 14px "Inter", sans-serif';
        ctx.fillText(s[0], cx1 + 24, cy + 80 + i * 32);

        ctx.fillStyle = '#6ba0ff';
        ctx.font = '600 15px "JetBrains Mono", monospace';
        const w = ctx.measureText(s[1]).width;
        ctx.fillText(s[1], cx1 + cw - 24 - w, cy + 80 + i * 32);
    });

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText('LLM PROPOSALS', cx1 + 24, cy + 240);

    const logs = [
        ['01:12', 'increase entropy → 0.015'],
        ['01:24', 'learning rate → 3e-4'],
        ['01:37', 'add LSTM layer']
    ];
    logs.forEach((l, i) => {
        ctx.fillStyle = '#4d8bf5';
        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.fillText(l[0], cx1 + 24, cy + 272 + i * 28);

        ctx.fillStyle = '#b0b8c4';
        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.fillText(l[1], cx1 + 72, cy + 272 + i * 28);
    });

    // Right card — chart
    const cx2 = 480, cw2 = W - cx2 - 40;

    ctx.fillStyle = '#0d1119';
    roundRect(ctx, cx2, cy, cw2, ch, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText('REWARD CURVE · LAST 100 EPOCHS', cx2 + 24, cy + 34);

    // Chart area
    const chx = cx2 + 24;
    const chy = cy + 70;
    const chw = cw2 - 48;
    const chh = 220;

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(chx, chy + (chh / 5) * i);
        ctx.lineTo(chx + chw, chy + (chh / 5) * i);
        ctx.stroke();
    }

    // Gradient fill
    const grad = ctx.createLinearGradient(0, chy, 0, chy + chh);
    grad.addColorStop(0, 'rgba(77,139,245,0.35)');
    grad.addColorStop(1, 'rgba(77,139,245,0)');

    const points = [];
    for (let i = 0; i <= 40; i++) {
        const x = chx + (i / 40) * chw;
        const t = i / 40;
        const y = chy + chh * (0.85 - t * 0.7) - Math.sin(t * 8) * 8;
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

    // Line
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
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Stats bottom
    ctx.fillStyle = '#4a525c';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText('BEST REWARD', cx2 + 24, cy + 340);
    ctx.fillStyle = '#3fca7d';
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.fillText('0.847', cx2 + 24, cy + 370);

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText('IMPROVEMENT', cx2 + 220, cy + 340);
    ctx.fillStyle = '#6ba0ff';
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.fillText('+0.328', cx2 + 220, cy + 370);
}

function drawListingLab(ctx, W, H) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);

    // Chrome
    ctx.fillStyle = '#111620';
    ctx.fillRect(0, 0, W, 44);
    const dots = ['#3a2a2e', '#3a3526', '#263a2d'];
    dots.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(28 + i * 22, 22, 7, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.fillStyle = '#5a616b';
    ctx.font = '600 15px "JetBrains Mono", monospace';
    ctx.fillText('listing-lab · local', 110, 27);

    ctx.fillStyle = '#3fca7d';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText('ollama · qwen2.5', W - 200, 27);

    // Split layout
    const gap = 20;
    const cw = (W - 40 - gap) / 2;

    // LEFT
    const lx = 20, ly = 80, lh = H - 120;
    ctx.fillStyle = '#0d1119';
    ctx.strokeStyle = '#1a2028';
    ctx.lineWidth = 1.5;
    roundRect(ctx, lx, ly, cw, lh, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText('INPUT', lx + 24, ly + 34);

    ctx.fillStyle = '#3fca7d';
    ctx.beginPath();
    ctx.arc(lx + cw - 32, ly + 30, 5, 0, Math.PI * 2);
    ctx.fill();

    const fields = [
        { label: 'PRODUCT',   value: 'Vintage denim jacket' },
        { label: 'CONDITION', value: 'Good · Size M' },
        { label: 'CATEGORY',  value: 'Fashion → Outerwear' }
    ];
    fields.forEach((f, i) => {
        const fy = ly + 70 + i * 92;

        ctx.fillStyle = '#4a525c';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.fillText(f.label, lx + 24, fy);

        ctx.fillStyle = '#12151a';
        ctx.strokeStyle = '#1a2028';
        ctx.lineWidth = 1;
        roundRect(ctx, lx + 24, fy + 14, cw - 48, 48, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#d0d4dc';
        ctx.font = '500 15px "Inter", sans-serif';
        ctx.fillText(f.value, lx + 40, fy + 46);
    });

    // Generate button
    const by = ly + lh - 70;
    ctx.fillStyle = 'rgba(77,139,245,0.15)';
    ctx.strokeStyle = '#4d8bf5';
    roundRect(ctx, lx + 24, by, cw - 48, 48, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#6ba0ff';
    ctx.font = '600 14px "JetBrains Mono", monospace';
    const btnText = '▶ GENERATE';
    const bw = ctx.measureText(btnText).width;
    ctx.fillText(btnText, lx + 24 + (cw - 48 - bw) / 2, by + 30);

    // RIGHT
    const rx = lx + cw + gap;
    const ry2 = 80;

    ctx.fillStyle = '#0d1119';
    roundRect(ctx, rx, ry2, cw, lh, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText('GENERATED', rx + 24, ry2 + 34);

    ctx.fillStyle = '#4d8bf5';
    ctx.font = '700 16px monospace';
    ctx.fillText('✦', rx + cw - 40, ry2 + 34);

    // Output 1
    ctx.fillStyle = '#12151a';
    ctx.strokeStyle = '#1a2028';
    roundRect(ctx, rx + 24, ry2 + 60, cw - 48, 90, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#d0d4dc';
    ctx.font = '600 16px "Inter", sans-serif';
    ctx.fillText('Vintage 90s Denim Jacket', rx + 40, ry2 + 92);
    ctx.font = '500 14px "Inter", sans-serif';
    ctx.fillStyle = '#9096a0';
    ctx.fillText('Men\'s Medium', rx + 40, ry2 + 116);

    // Output 2 — description
    ctx.fillStyle = '#12151a';
    roundRect(ctx, rx + 24, ry2 + 165, cw - 48, 100, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9096a0';
    ctx.font = '500 13px "Inter", sans-serif';
    ctx.fillText('Classic washed denim with original', rx + 40, ry2 + 195);
    ctx.fillText('hardware. Soft broken-in feel —', rx + 40, ry2 + 216);
    ctx.fillText('perfect layering piece for fall.', rx + 40, ry2 + 237);

    // Tags
    const tags = ['vintage', 'denim', '90s', 'menswear'];
    let tx = rx + 24;
    tags.forEach(t => {
        ctx.font = '600 11px "JetBrains Mono", monospace';
        const tw = ctx.measureText(t).width + 20;
        ctx.fillStyle = 'rgba(77,139,245,0.12)';
        ctx.strokeStyle = 'rgba(77,139,245,0.4)';
        roundRect(ctx, tx, ry2 + 285, tw, 24, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#6ba0ff';
        ctx.fillText(t, tx + 10, ry2 + 301);
        tx += tw + 8;
    });

    // Price
    const py2 = ry2 + lh - 90;
    ctx.fillStyle = 'rgba(63,202,125,0.08)';
    ctx.strokeStyle = 'rgba(63,202,125,0.3)';
    roundRect(ctx, rx + 24, py2, cw - 48, 64, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9096a0';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText('SUGGESTED PRICE', rx + 40, py2 + 40);

    ctx.fillStyle = '#3fca7d';
    ctx.font = '600 24px "JetBrains Mono", monospace';
    const priceW = ctx.measureText('₪185').width;
    ctx.fillText('₪185', rx + cw - 40 - priceW, py2 + 44);
}

function drawAIMaze(ctx, W, H) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);

    // Chrome
    ctx.fillStyle = '#111620';
    ctx.fillRect(0, 0, W, 44);
    const dots = ['#3a2a2e', '#3a3526', '#263a2d'];
    dots.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(28 + i * 22, 22, 7, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.fillStyle = '#5a616b';
    ctx.font = '600 15px "JetBrains Mono", monospace';
    ctx.fillText('aimaze · episode 1284', 110, 27);

    ctx.fillStyle = '#3fca7d';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText('● TRAINING', W - 180, 27);

    // Top bar
    const barX = 40, barY = 80, barW = W - 80, barH = 44;

    ctx.fillStyle = '#0d1119';
    ctx.strokeStyle = '#1a2028';
    ctx.lineWidth = 1.5;
    roundRect(ctx, barX, barY, barW, barH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a525c';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText('ML-AGENTS · POLICY : PPO', barX + 20, barY + 28);

    ctx.fillStyle = '#3fca7d';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    const liveW = ctx.measureText('RUNNING').width;
    ctx.fillText('● RUNNING', barX + barW - 20 - liveW - 10, barY + 28);

    // Maze grid — 12x9
    const cols = 12, rows = 8;
    const cell = 54;
    const gap = 2;
    const mw = cols * cell + (cols - 1) * gap;
    const mh = rows * cell + (rows - 1) * gap;
    const mx = (W - mw) / 2;
    const my = barY + barH + 40;

    // Wall layout — 1 = wall, 2 = goal
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

    // Agent — bright blue, at position (col=6, row=4)
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
    ctx.shadowBlur = 20;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Bottom stats
    const statsY = my + mh + 40;
    const stats = [
        { label: 'STEPS', value: '124' },
        { label: 'REWARD', value: '+8.42' },
        { label: 'SUCCESS', value: '94%' }
    ];

    const sw = (W - 80) / 3 - 10;
    stats.forEach((s, i) => {
        const sx = 40 + i * (sw + 15);
        ctx.fillStyle = '#0d1119';
        ctx.strokeStyle = '#1a2028';
        ctx.lineWidth = 1.5;
        roundRect(ctx, sx, statsY, sw, 60, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#4a525c';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.fillText(s.label, sx + 20, statsY + 24);

        ctx.fillStyle = '#d0d4dc';
        ctx.font = '600 20px "JetBrains Mono", monospace';
        ctx.fillText(s.value, sx + 20, statsY + 48);
    });
}

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

// ============================================================
// Factory — build all five modules
// ============================================================
export function createProjectModules(scene) {
    const drawers = [
        drawAAUP,
        drawTrades,
        drawRLScientist,
        drawListingLab,
        drawAIMaze
    ];
    return drawers.map((fn, i) => new ProjectModule(scene, i, fn));
}