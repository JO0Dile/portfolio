/* ============================================================
   Drone.js — reusable hovering drone
   Blue, red, and yellow drones are all instances of this class.
   ============================================================ */

import * as THREE from 'three';

export class Drone {
    constructor(opts = {}) {
        this.accent = new THREE.Color(opts.color ?? 0x4d8bf5);
        this.scaleMul = opts.scale ?? 1.0;

        this.group = new THREE.Group();
        this.group.visible = false;

        this.elapsed = Math.random() * 10;
        this.press = 0;
        this.targetPress = 0;

        this.exploding = false;
        this.explosionTime = 0;
        this.explosionDuration = 1.2;
        this.pieces = [];

        this._build();
        this.group.traverse(c => { c.renderOrder = 30; });
    }

    _build() {
        this.bodyGroup = new THREE.Group();
        this.group.add(this.bodyGroup);

        // Body
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 24, 18),
            new THREE.MeshStandardMaterial({
                color: 0x2a2f38,
                roughness: 0.35,
                metalness: 0.85,
                emissive: 0x0a1220,
                emissiveIntensity: 0.5
            })
        );
        body.scale.set(1.0, 0.85, 1.0);
        this.bodyGroup.add(body);

        // Cap
        const cap = new THREE.Mesh(
            new THREE.SphereGeometry(0.165, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.42),
            new THREE.MeshStandardMaterial({ color: 0x4a5260, roughness: 0.22, metalness: 0.95 })
        );
        cap.scale.set(1.0, 0.55, 1.0);
        cap.position.y = 0.055;
        this.bodyGroup.add(cap);

        // Accent ring
        this.accentLine = new THREE.Mesh(
            new THREE.TorusGeometry(0.158, 0.006, 8, 32),
            new THREE.MeshBasicMaterial({
                color: this.accent,
                transparent: true,
                opacity: 0.85,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                toneMapped: false
            })
        );
        this.accentLine.rotation.x = Math.PI / 2;
        this.accentLine.position.y = 0.055;
        this.bodyGroup.add(this.accentLine);

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.042, 20, 16);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xdff1ff, toneMapped: false });
        this.eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        this.eyeL.position.set(-0.062, 0.01, 0.152);
        this.bodyGroup.add(this.eyeL);
        this.eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        this.eyeR.position.set(0.062, 0.01, 0.152);
        this.bodyGroup.add(this.eyeR);

        // Eye glows
        const glowGeo = new THREE.SphereGeometry(0.085, 16, 12);
        this.eyeGlowL = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({
            color: this.accent, transparent: true, opacity: 0.45,
            blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
        }));
        this.eyeGlowL.position.copy(this.eyeL.position);
        this.bodyGroup.add(this.eyeGlowL);

        this.eyeGlowR = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({
            color: this.accent, transparent: true, opacity: 0.45,
            blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
        }));
        this.eyeGlowR.position.copy(this.eyeR.position);
        this.bodyGroup.add(this.eyeGlowR);

        // Halo rings
        this.halo = new THREE.Mesh(
            new THREE.TorusGeometry(0.28, 0.011, 10, 64),
            new THREE.MeshBasicMaterial({
                color: this.accent, transparent: true, opacity: 0.85,
                blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
            })
        );
        this.halo.rotation.x = Math.PI / 2;
        this.halo.position.y = -0.03;
        this.group.add(this.halo);

        this.halo2 = new THREE.Mesh(
            new THREE.TorusGeometry(0.33, 0.007, 10, 64),
            new THREE.MeshBasicMaterial({
                color: 0xa8d4ff, transparent: true, opacity: 0.55,
                blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
            })
        );
        this.halo2.rotation.set(Math.PI / 3, 0, 0);
        this.group.add(this.halo2);

        // Antenna
        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.007, 0.007, 0.1, 8),
            new THREE.MeshStandardMaterial({ color: 0x4a5260, metalness: 0.9, roughness: 0.3 })
        );
        stem.position.y = 0.2;
        this.group.add(stem);

        this.antennaTip = new THREE.Mesh(
            new THREE.SphereGeometry(0.022, 14, 10),
            new THREE.MeshBasicMaterial({ color: 0xdff1ff, toneMapped: false })
        );
        this.antennaTip.position.y = 0.27;
        this.group.add(this.antennaTip);

        this.antennaGlow = new THREE.Mesh(
            new THREE.SphereGeometry(0.055, 14, 10),
            new THREE.MeshBasicMaterial({
                color: this.accent, transparent: true, opacity: 0.5,
                blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
            })
        );
        this.antennaGlow.position.copy(this.antennaTip.position);
        this.group.add(this.antennaGlow);

        // Fins
        const finGeo = new THREE.BoxGeometry(0.055, 0.018, 0.11);
        const finMat = new THREE.MeshStandardMaterial({
            color: 0x3a4150, metalness: 0.9, roughness: 0.25,
            emissive: 0x0a1220, emissiveIntensity: 0.4
        });
        this.finL = new THREE.Mesh(finGeo, finMat);
        this.finL.position.set(-0.15, -0.02, 0);
        this.group.add(this.finL);
        this.finR = new THREE.Mesh(finGeo, finMat);
        this.finR.position.set(0.15, -0.02, 0);
        this.group.add(this.finR);

        // Beam
        this.beam = new THREE.Mesh(
            new THREE.ConeGeometry(0.12, 0.42, 24, 1, true),
            new THREE.MeshBasicMaterial({
                color: this.accent, transparent: true, opacity: 0.22,
                blending: THREE.AdditiveBlending, depthWrite: false,
                side: THREE.DoubleSide, toneMapped: false
            })
        );
        this.beam.position.y = -0.28;
        this.beam.rotation.x = Math.PI;
        this.group.add(this.beam);

        // Target dot
        this.targetDot = new THREE.Mesh(
            new THREE.SphereGeometry(0.036, 16, 12),
            new THREE.MeshBasicMaterial({ color: 0xdff1ff, transparent: true, opacity: 0.95, toneMapped: false })
        );
        this.targetDot.position.y = -0.5;
        this.group.add(this.targetDot);

        // Click ripple
        this.ripple = new THREE.Mesh(
            new THREE.RingGeometry(0.05, 0.08, 32),
            new THREE.MeshBasicMaterial({
                color: this.accent, transparent: true, opacity: 0,
                side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
                depthWrite: false, toneMapped: false
            })
        );
        this.ripple.position.y = -0.5;
        this.ripple.rotation.x = -Math.PI / 2;
        this.ripple.visible = false;
        this.group.add(this.ripple);

        // Point light
        this.light = new THREE.PointLight(this.accent.getHex(), 0.9, 1.8, 2);
        this.light.position.set(0, -0.08, 0.2);
        this.group.add(this.light);
    }

    // ── API ──
    setPosition(x, y, z) { this.group.position.set(x, y, z); }
    snapTo(x, y, z) { this.group.position.set(x, y, z); }
    getPosition() { return this.group.position; }
    setVisible(v) { this.group.visible = v; }
    setPress(p) { this.targetPress = Math.max(0, Math.min(1, p)); }
    getPress() { return this.press; }

    setColor(hex) {
        this.accent.set(hex);
        this.accentLine.material.color.copy(this.accent);
        this.halo.material.color.copy(this.accent);
        this.beam.material.color.copy(this.accent);
        this.eyeGlowL.material.color.copy(this.accent);
        this.eyeGlowR.material.color.copy(this.accent);
        this.antennaGlow.material.color.copy(this.accent);
        this.ripple.material.color.copy(this.accent);
        this.light.color.copy(this.accent);
    }

    // Blow the drone apart into debris
    explode() {
        this._maybeResetPieces();

        this.exploding = true;
        this.explosionTime = 0;

        this.bodyGroup.visible = false;
        this.halo.visible = false;
        this.halo2.visible = false;
        this.antennaTip.visible = false;
        this.antennaGlow.visible = false;
        this.finL.visible = false;
        this.finR.visible = false;
        this.beam.visible = false;
        this.targetDot.visible = false;
        this.ripple.visible = false;

        this.pieces = [];
        for (let i = 0; i < 14; i++) {
            const size = 0.02 + Math.random() * 0.05;
            const piece = new THREE.Mesh(
                new THREE.BoxGeometry(size, size, size),
                new THREE.MeshStandardMaterial({
                    color: 0x2a2f38,
                    metalness: 0.9,
                    roughness: 0.3,
                    emissive: this.accent.getHex(),
                    emissiveIntensity: 0.6
                })
            );
            piece.position.set(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            );
            this.group.add(piece);
            this.pieces.push({
                mesh: piece,
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 2.6,
                    (Math.random() - 0.5) * 2.6 + 0.6,
                    (Math.random() - 0.5) * 2.6
                ),
                rot: new THREE.Vector3(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10
                )
            });
        }
    }

    // Bring the drone back
    reset() {
        this.exploding = false;
        this.pieces.forEach(p => {
            this.group.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
        });
        this.pieces = [];

        this.bodyGroup.visible = true;
        this.halo.visible = true;
        this.halo2.visible = true;
        this.antennaTip.visible = true;
        this.antennaGlow.visible = true;
        this.finL.visible = true;
        this.finR.visible = true;
        this.beam.visible = true;
        this.targetDot.visible = true;
        this.ripple.visible = false;
        this.ripple.scale.setScalar(1);
        this.ripple.material.opacity = 0;
        this.press = 0;
        this.targetPress = 0;
        this.group.scale.setScalar(this.scaleMul);
    }

    update(dt) {
        this.elapsed += dt;
        const t = this.elapsed;

        // Exploding — animate debris, don't run normal loop
        if (this.exploding) {
            this.explosionTime += dt;
            const e = this.explosionTime;
            this.pieces.forEach(p => {
                p.mesh.position.addScaledVector(p.vel, dt);
                p.vel.y -= 4 * dt;
                p.mesh.rotation.x += p.rot.x * dt;
                p.mesh.rotation.y += p.rot.y * dt;
                p.mesh.rotation.z += p.rot.z * dt;
                const fade = Math.max(0, 1 - e / this.explosionDuration);
                p.mesh.scale.setScalar(fade);
            });
            if (e >= this.explosionDuration) {
                this.pieces.forEach(p => this.group.remove(p.mesh));
                this.pieces = [];
                this.exploding = false;
            }
            return;
        }

        // Normal
        this.press += (this.targetPress - this.press) * Math.min(1, dt * 16);

        const pulse = 0.5 + 0.5 * Math.sin(t * 3.5);
        const hoverBob = Math.sin(t * 2.2) * 0.035;
        const dip = this.press * 0.14;

        this.bodyGroup.position.y = hoverBob - dip;
        this.bodyGroup.rotation.y = Math.sin(t * 0.7) * 0.35;
        this.bodyGroup.rotation.z = Math.sin(t * 1.4) * 0.06;

        this.halo.rotation.z = t * 1.2;
        this.halo2.rotation.y = t * 0.8;
        this.halo.position.y = -0.03 + hoverBob * 0.5 - dip * 0.4;
        this.halo2.position.y = hoverBob * 0.3 - dip * 0.3;

        const blinkCycle = t % 3.2;
        const blinkScale = (blinkCycle > 3.05 && blinkCycle < 3.15) ? 0.1 : 1;
        this.eyeL.scale.y = blinkScale;
        this.eyeR.scale.y = blinkScale;

        const eyeAlpha = 0.35 + pulse * 0.15 + this.press * 0.45;
        this.eyeGlowL.material.opacity = eyeAlpha;
        this.eyeGlowR.material.opacity = eyeAlpha;

        this.antennaTip.scale.setScalar(1 + pulse * 0.22 + this.press * 0.5);
        this.antennaGlow.scale.setScalar(1 + pulse * 0.35);
        this.antennaGlow.material.opacity = 0.4 + pulse * 0.18 + this.press * 0.45;

        this.beam.material.opacity = 0.18 + pulse * 0.06 + this.press * 0.55;
        this.targetDot.scale.setScalar(1 + pulse * 0.15 + this.press * 0.7);
        this.targetDot.material.opacity = 0.75 + this.press * 0.25;

        if (this.press > 0.05) {
            const r = Math.min(0.95, 1 - this.press);
            this.ripple.visible = true;
            this.ripple.scale.setScalar(1 + r * 4);
            this.ripple.material.opacity = this.press * 0.5;
        } else {
            this.ripple.visible = false;
            this.ripple.scale.setScalar(1);
        }

        this.light.intensity = 0.7 + pulse * 0.25 + this.press * 1.8;
        this.group.scale.setScalar(this.scaleMul * (1 + this.press * 0.08));
    }

    // Soft check — allows multiple explosions in the same lifetime
    _maybeResetPieces() {
        if (!this.exploding && this.pieces.length > 0) {
            this.pieces.forEach(p => this.group.remove(p.mesh));
            this.pieces = [];
        }
    }
}