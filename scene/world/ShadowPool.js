/* ============================================================
   ShadowPool.js — soft ambient shadow beneath the swarm
   One additive plane that fades radially. No real shadows.
   ============================================================ */

import * as THREE from 'three';

export class ShadowPool {
    constructor(scene) {
        this.scene = scene;
        this.elapsed = 0;

        // Radial gradient texture — dark center, transparent edge
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        g.addColorStop(0.0, 'rgba(0, 0, 0, 0.85)');
        g.addColorStop(0.4, 'rgba(0, 0, 0, 0.5)');
        g.addColorStop(0.75, 'rgba(0, 0, 0, 0.15)');
        g.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);

        this.texture = new THREE.CanvasTexture(canvas);
        this.texture.minFilter = THREE.LinearFilter;

        this.material = new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true,
            opacity: 0.42,
            depthWrite: false,
            blending: THREE.NormalBlending
        });

        this.mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(14, 14),
            this.material
        );
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = -1.35; // just above floor grid
        scene.add(this.mesh);
    }

    // Reveal progress 0..1 — shadow grows with the swarm's spread
    setSpread(v) {
        const s = 0.75 + v * 0.5; // 0.75 to 1.25
        this.mesh.scale.setScalar(s);
        this.material.opacity = 0.30 + v * 0.18;
    }

    update(dt) {
        this.elapsed += dt;
        // Very subtle breathing so it doesn't feel static
        const breathe = Math.sin(this.elapsed * 0.4) * 0.02;
        this.mesh.material.opacity += breathe * 0.01;
    }
}