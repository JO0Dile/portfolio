/* ============================================================
   SectionLabels.js — the project / skill titles, rendered in 3D
   ------------------------------------------------------------
   With the HTML work rows and lab cards gone, this is how the
   name and one-line description of each slot reach the viewer.
   One label per slot, index-aligned with ProjectPanels.
   ============================================================ */

import * as THREE from 'three';

const CANVAS_W = 1100;
const CANVAS_H = 230;
const LABEL_W  = 7.0;
const LABEL_H  = LABEL_W * (CANVAS_H / CANVAS_W);

// Sits just above the panel, in the same forward plane, drawn on top.
const LABEL_Y = 7.90;
const LABEL_Z = 4.0;

const LABELS = [
    // ── About ────────────────────────────────────────────────
    { num: '—',  title: 'AI & Robotics Engineering',
      sub: 'Arab American University of Palestine',       color: 0x4d8bf5 },

    // ── Work ─────────────────────────────────────────────────
    { num: '01', title: 'AAUP Academic Planner',
      sub: 'Prerequisites · progress tracking · full RTL', color: 0x4d8bf5 },
    { num: '02', title: 'Construction & Trades',
      sub: 'Offline-first management for real-world crews', color: 0xff8a5c },
    { num: '03', title: 'RL-Scientist',
      sub: 'A local LLM that runs its own experiments',    color: 0x3fca7d },
    { num: '04', title: 'Listing Lab',
      sub: 'Local-first AI for product listings',          color: 0xb07cff },
    { num: '05', title: 'AIMaze',
      sub: 'Unity ML-Agents · PPO maze navigation',        color: 0xffbe5c },

    // ── Lab ──────────────────────────────────────────────────
    { num: '01', title: 'Languages',
      sub: 'Python · C++ · JavaScript · SQL',              color: 0x4d8bf5 },
    { num: '02', title: 'Frameworks',
      sub: 'FastAPI · Android · PostgreSQL · Unity',       color: 0xff8a5c },
    { num: '03', title: 'AI / Data',
      sub: 'Reinforcement learning · local LLMs · ETL',    color: 0x3fca7d },
    { num: '04', title: 'Other',
      sub: 'REST APIs · responsive web · Git · Linux',     color: 0xb07cff }
];

export class SectionLabels {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        scene.add(this.group);

        this.labels = LABELS.map((cfg, i) => this._buildLabel(cfg, i));
        this.activeIndex = -1;
        this.opacity = 0;
        this.count = this.labels.length;
    }

    _buildLabel(cfg, index) {
        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_W;
        canvas.height = CANVAS_H;
        const ctx = canvas.getContext('2d');

        const col = '#' + cfg.color.toString(16).padStart(6, '0');

        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

        // Accent rule on the left
        ctx.fillStyle = col;
        ctx.fillRect(0, 26, 4, CANVAS_H - 52);

        // Slot number
        ctx.fillStyle = col;
        ctx.font = '600 30px "JetBrains Mono", monospace';
        ctx.fillText(cfg.num, 30, 84);

        // Title
        ctx.fillStyle = '#ededf0';
        ctx.font = '600 46px "Inter", sans-serif';
        ctx.fillText(cfg.title, 96, 88);

        // Subtitle
        ctx.fillStyle = '#9096a0';
        ctx.font = '400 24px "Inter", sans-serif';
        ctx.fillText(cfg.sub, 98, 142);

        // Hairline under the block
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.fillRect(96, 172, CANVAS_W - 150, 1);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.colorSpace = THREE.SRGBColorSpace;

        const geo = new THREE.PlaneGeometry(LABEL_W, LABEL_H);
        const mat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            depthTest: false,
            toneMapped: false
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, LABEL_Y, LABEL_Z);
        mesh.renderOrder = 20;
        mesh.visible = false;
        this.group.add(mesh);

        return { mesh, mat, index };
    }

    setActive(index) {
        if (index === this.activeIndex) return;
        this.activeIndex = index;
        this.labels.forEach((l, i) => {
            l.mesh.visible = (i === index);
            if (i !== index) l.mat.opacity = 0;
        });
    }

    setOpacity(o) {
        this.opacity = Math.max(0, Math.min(1, o));
        const active = this.labels[this.activeIndex];
        if (!active) return;
        active.mat.opacity = this.opacity;
        active.mesh.visible = this.opacity >= 0.02;
    }

    update(dt, camera, elapsed) {
        const active = this.labels[this.activeIndex];
        if (!active || !active.mesh.visible) return;

        active.mesh.lookAt(camera.position);

        // Slow drift, anchored to LABEL_Y so it never accumulates.
        active.mesh.position.y = LABEL_Y + Math.sin(elapsed * 0.7) * 0.05;
    }
}
