/* ============================================================
   SectionLabels.js — floating monospace labels in the scene
   ============================================================ */

import * as THREE from 'three';

const LABELS = [
    { id: 'aaup',         num: '01', title: 'AAUP Academic Planner',  color: 0x4d8bf5, y: 11.4 },
    { id: 'construction', num: '02', title: 'Construction & Trades',  color: 0xff8a5c, y: 11.4 },
    { id: 'rlscientist',  num: '03', title: 'RL-Scientist',           color: 0x3fca7d, y: 11.4 },
    { id: 'listinglab',   num: '04', title: 'Listing Lab',            color: 0xb07cff, y: 11.4 },
    { id: 'aimaze',       num: '05', title: 'AIMaze',                 color: 0xffbe5c, y: 11.4 }
];

export class SectionLabels {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        scene.add(this.group);

        this.labels = [];
        this.activeIndex = -1;
        this.opacity = 0;

        LABELS.forEach((cfg, i) => {
            this.labels.push(this._buildLabel(cfg, i));
        });
    }

    _buildLabel(cfg, index) {
        const canvas = document.createElement('canvas');
        const W = 1024;
        const H = 128;
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        // Background — very subtle dark strip
        ctx.fillStyle = 'rgba(8, 12, 20, 0.0)';
        ctx.fillRect(0, 0, W, H);

        // Left vertical bar
        const colStr = '#' + cfg.color.toString(16).padStart(6, '0');
        ctx.fillStyle = colStr;
        ctx.fillRect(0, 20, 3, H - 40);

        // Number
        ctx.fillStyle = colStr;
        ctx.font = '600 28px "JetBrains Mono", monospace';
        ctx.fillText(cfg.num, 32, 76);

        // Title
        ctx.fillStyle = '#ededf0';
        ctx.font = '500 40px "Inter", sans-serif';
        ctx.fillText(cfg.title, 90, 76);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.colorSpace = THREE.SRGBColorSpace;

        const geo = new THREE.PlaneGeometry(6.4, 0.8);
        const mat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            depthTest: false,
            toneMapped: false
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, cfg.y, 0);
        mesh.renderOrder = 10;
        mesh.visible = false;
        this.group.add(mesh);

        return { mesh, mat, index };
    }

    setActive(index) {
        if (index === this.activeIndex) return;
        this.activeIndex = index;
        this.labels.forEach((l, i) => {
            l.mesh.visible = (i === index);
        });
    }

    setOpacity(o) {
        this.opacity = Math.max(0, Math.min(1, o));
        const active = this.labels[this.activeIndex];
        if (!active) return;
        active.mat.opacity = this.opacity;
        if (this.opacity < 0.02) active.mesh.visible = false;
        else active.mesh.visible = true;
    }

    update(dt, camera, elapsed) {
        const active = this.labels[this.activeIndex];
        if (!active || !active.mesh.visible) return;

        // Billboard
        active.mesh.lookAt(camera.position);

        // Gentle float
        active.mesh.position.y = active.mesh.position.y +
            Math.sin(elapsed * 0.8) * 0.004;
    }
}