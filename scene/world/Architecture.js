import * as THREE from 'three';
import { Materials } from '../materials/Materials.js';

export class Architecture {
    constructor(scene, quality) {
        this.scene = scene;
        this.quality = quality;
        this.group = new THREE.Group();
        scene.add(this.group);

        this.elapsed = 0;
        this.revealProgress = 0;

        // Every animated component registers here.
        // Each entry: { mesh, closed: {pos, rot}, open: {pos, rot}, delay: 0..1 }
        this.components = [];

        this._buildSpine();
        this._buildOuterShell();
        this._buildUpperRing();
        this._buildLowerRing();
        this._buildPanels();
        this._buildCore();
        this._buildConnectingRods();
        this._buildLightChannels();

        // Cache initial transforms as "closed"
        this.components.forEach(c => {
            c.closedPos = c.mesh.position.clone();
            c.closedRot = c.mesh.rotation.clone();
        });
    }

    // ----------------------------------------------------------
    // Register a component for animated reveal
    // ----------------------------------------------------------
    _register(mesh, openPos, openRot = null, delay = 0) {
        this.components.push({
            mesh,
            openPos,
            openRot: openRot || mesh.rotation.clone(),
            delay
        });
    }

    // ----------------------------------------------------------
    // SPINE — vertical central column, static (never moves)
    // ----------------------------------------------------------
    _buildSpine() {
        const height = 46;

        // Main matte column
        const geo = new THREE.CylinderGeometry(0.9, 1.2, height, 40, 1, true);
        const spine = new THREE.Mesh(geo, Materials.matteDeep());
        spine.position.y = 3;
        this.group.add(spine);

        // Interior wall (visible when shell opens)
        const innerGeo = new THREE.CylinderGeometry(0.6, 0.7, height - 2, 32, 1, true);
        const innerMat = new THREE.MeshStandardMaterial({
            color: 0x0a1220,
            roughness: 0.5,
            metalness: 0.6,
            side: THREE.BackSide
        });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        inner.position.y = 3;
        this.group.add(inner);

        this.spine = spine;
    }

    // ----------------------------------------------------------
    // OUTER SHELL — 4 large curved panels that lift and rotate away
    // ----------------------------------------------------------
    _buildOuterShell() {
        const height = 34;
        const radius = 3.4;
        const segments = 4;

        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const arc = (Math.PI * 2 / segments) * 0.82;

            const geo = new THREE.CylinderGeometry(
                radius, radius, height,
                48, 1, true,
                angle - arc / 2,
                arc
            );
            const shell = new THREE.Mesh(geo, Materials.matte());
            shell.position.y = 3;
            this.group.add(shell);

            // Open position: radial push + vertical lift + rotation
            const dist = radius + 3.2;
            const openPos = new THREE.Vector3(
                Math.cos(angle) * dist,
                3 + 6.5,
                Math.sin(angle) * dist
            );
            const openRot = new THREE.Euler(0, angle, 0);

            // Store the shell's angle for later
            shell.userData.shellAngle = angle;

            this._register(shell, openPos, openRot, 0.05 * i);
        }
    }

    // ----------------------------------------------------------
    // UPPER RING — big ring that rises and expands
    // ----------------------------------------------------------
    _buildUpperRing() {
        const radius = 5.2;

        // Main ring
        const ringGeo = new THREE.TorusGeometry(radius, 0.16, 10, 96);
        const ring = new THREE.Mesh(ringGeo, Materials.polished());
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 16;
        this.group.add(ring);

        // Struts on this ring
        const struts = [];
        for (let s = 0; s < 8; s++) {
            const a = (s / 8) * Math.PI * 2;
            const len = radius - 1.2;
            const strut = new THREE.Mesh(
                new THREE.BoxGeometry(len, 0.06, 0.06),
                Materials.brushed()
            );
            strut.position.set(
                Math.cos(a) * (len / 2 + 1.2),
                16,
                Math.sin(a) * (len / 2 + 1.2)
            );
            strut.rotation.y = -a;
            this.group.add(strut);
            struts.push(strut);
        }

        // Register ring as one animated group
        this._register(ring, new THREE.Vector3(0, 26, 0), new THREE.Euler(Math.PI / 2, 0, 0.4), 0.15);

        // Each strut expands outward
        struts.forEach((s, i) => {
            const a = (i / 8) * Math.PI * 2;
            const dist = radius + 4;
            this._register(
                s,
                new THREE.Vector3(
                    Math.cos(a) * dist,
                    22,
                    Math.sin(a) * dist
                ),
                new THREE.Euler(0, -a, 0),
                0.15
            );
        });

        this.upperRing = ring;
    }

    // ----------------------------------------------------------
    // LOWER RING — mirror of upper, drops down
    // ----------------------------------------------------------
    _buildLowerRing() {
        const radius = 4.4;

        const ringGeo = new THREE.TorusGeometry(radius, 0.14, 10, 88);
        const ring = new THREE.Mesh(ringGeo, Materials.polished());
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -9;
        this.group.add(ring);

        const struts = [];
        for (let s = 0; s < 6; s++) {
            const a = (s / 6) * Math.PI * 2;
            const len = radius - 1.2;
            const strut = new THREE.Mesh(
                new THREE.BoxGeometry(len, 0.055, 0.055),
                Materials.brushed()
            );
            strut.position.set(
                Math.cos(a) * (len / 2 + 1.2),
                -9,
                Math.sin(a) * (len / 2 + 1.2)
            );
            strut.rotation.y = -a;
            this.group.add(strut);
            struts.push(strut);
        }

        this._register(ring, new THREE.Vector3(0, -20, 0), new THREE.Euler(Math.PI / 2, 0, -0.4), 0.18);

        struts.forEach((s, i) => {
            const a = (i / 6) * Math.PI * 2;
            const dist = radius + 3.5;
            this._register(
                s,
                new THREE.Vector3(
                    Math.cos(a) * dist,
                    -16,
                    Math.sin(a) * dist
                ),
                new THREE.Euler(0, -a, 0),
                0.18
            );
        });

        this.lowerRing = ring;
    }

    // ----------------------------------------------------------
    // PANELS — vertical strips that swing open on hinges
    // ----------------------------------------------------------
    _buildPanels() {
        const count = 20;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + 0.15;
            const y = -14 + Math.random() * 30;
            const r = 3.8 + Math.random() * 2.2;
            const w = 0.85 + Math.random() * 1.5;
            const h = 2.5 + Math.random() * 5.0;

            const useGlass = Math.random() > 0.7;
            const panel = new THREE.Mesh(
                new THREE.BoxGeometry(w, h, 0.06),
                useGlass ? Materials.glass() : Materials.matte()
            );
            panel.position.set(
                Math.cos(angle) * r,
                y,
                Math.sin(angle) * r
            );
            panel.rotation.y = -angle + Math.PI / 2;

            this.group.add(panel);

            // Open: swing outward around their inner edge, tilt down
            const dist = r + 2.8;
            const openPos = new THREE.Vector3(
                Math.cos(angle) * dist,
                y - 1.5,
                Math.sin(angle) * dist
            );
            const openRot = new THREE.Euler(
                -0.35,
                -angle + Math.PI / 2,
                (Math.random() - 0.5) * 0.4
            );

            // Delay relative to vertical position — lower panels open first
            const delay = 0.2 + (y + 14) / 44 * 0.25;
            this._register(panel, openPos, openRot, delay);
        }
    }

    // ----------------------------------------------------------
    // CORE — the inner chamber, glows brighter as it's exposed
    // ----------------------------------------------------------
    _buildCore() {
        // Central glowing column
        const h = 26;
        const geo = new THREE.CylinderGeometry(0.55, 0.65, h, 32, 1, true);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x2a5cb8,
            transparent: true,
            opacity: 0.0,  // starts invisible, animates up with reveal
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const core = new THREE.Mesh(geo, mat);
        core.position.y = 3;
        this.group.add(core);

        this.core = core;
        this.coreMat = mat;

        // A bright inner line
        const innerGeo = new THREE.CylinderGeometry(0.12, 0.12, h - 4, 12);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0x8fb0e8,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        inner.position.y = 3;
        this.group.add(inner);

        this.coreInner = inner;
        this.coreInnerMat = innerMat;
    }

    // ----------------------------------------------------------
    // CONNECTING RODS — thin rods from spine to rings, retract when open
    // ----------------------------------------------------------
    _buildConnectingRods() {
        this.rods = [];
        const pairs = [
            { y: 16, count: 8, length: 4.3 },
            { y: -9, count: 6, length: 3.5 },
            { y: 6,  count: 10, length: 4.8 },
            { y: -3, count: 10, length: 4.8 }
        ];

        for (const p of pairs) {
            for (let i = 0; i < p.count; i++) {
                const a = (i / p.count) * Math.PI * 2;
                const rod = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.018, 0.018, p.length, 6),
                    Materials.accent(0x8fb0e8, 0.55)
                );
                rod.position.set(
                    Math.cos(a) * (p.length / 2 + 0.7),
                    p.y,
                    Math.sin(a) * (p.length / 2 + 0.7)
                );
                rod.rotation.z = Math.PI / 2;
                rod.rotation.y = -a;
                this.group.add(rod);
                this.rods.push({ rod, phase: Math.random() * Math.PI * 2, baseY: p.y });
            }
        }
    }

    // ----------------------------------------------------------
    // LIGHT CHANNELS — vertical emissive strips along the spine
    // ----------------------------------------------------------
    _buildLightChannels() {
        this.channels = [];
        const count = 6;
        for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2 + 0.4;
            const h = 22 + Math.random() * 12;
            const geo = new THREE.BoxGeometry(0.02, h, 0.02);
            const mat = Materials.accent(0x4d8bf5, 0.75);
            const line = new THREE.Mesh(geo, mat);
            line.position.set(
                Math.cos(a) * 2.6,
                2,
                Math.sin(a) * 2.6
            );
            this.group.add(line);
            this.channels.push({
                mesh: line,
                baseMat: mat,
                phase: Math.random() * Math.PI * 2,
                baseOpacity: 0.75
            });
        }
    }

    // ----------------------------------------------------------
    // SET REVEAL PROGRESS (called by RevealSystem)
    // ----------------------------------------------------------
    setReveal(p) {
        this.revealProgress = Math.max(0, Math.min(1, p));
    }

    // ----------------------------------------------------------
    // UPDATE
    // ----------------------------------------------------------
    update(dt) {
        this.elapsed += dt;

        const rp = this.revealProgress;

        // Animate all registered components by lerping between closed and open
        for (const c of this.components) {
            // Apply per-component delay: progress maps from delay → 1
            let t = rp === 0 ? 0 :
                    rp === 1 ? 1 :
                    Math.max(0, Math.min(1, (rp - c.delay) / (1 - c.delay)));
            // smoothstep for cinematic easing
            t = t * t * (3 - 2 * t);

            c.mesh.position.lerpVectors(c.closedPos, c.openPos, t);
            c.mesh.rotation.x = c.closedRot.x + (c.openRot.x - c.closedRot.x) * t;
            c.mesh.rotation.y = c.closedRot.y + (c.openRot.y - c.closedRot.y) * t;
            c.mesh.rotation.z = c.closedRot.z + (c.openRot.z - c.closedRot.z) * t;
        }

        // Core glow — appears as the shell separates
        const coreP = Math.max(0, Math.min(1, (rp - 0.3) / 0.6));
        this.coreMat.opacity = coreP * 0.55;
        this.coreInnerMat.opacity = coreP * 0.95;

        // Rods — retract & fade as shell opens
        const rodP = Math.max(0, Math.min(1, rp / 0.5));
        for (const r of this.rods) {
            r.rod.material.opacity = 0.55 * (1 - rodP * 0.85);
            r.rod.scale.set(1, 1 - rodP * 0.7, 1);
        }

        // Light channels — pulse, slightly dimmer when closed
        for (const c of this.channels) {
            const pulse = 0.65 + Math.sin(this.elapsed * 1.1 + c.phase) * 0.28;
            c.baseMat.opacity = c.baseOpacity * pulse * (0.7 + rp * 0.5);
        }

        // Subtle global rotation
        this.group.rotation.y = this.elapsed * 0.014;

        // Very slight vertical drift
        this.group.position.y = Math.sin(this.elapsed * 0.28) * 0.08;
    }
}