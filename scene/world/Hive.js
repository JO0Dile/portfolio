/* ============================================================
   Hive.js — queued transitions
   Only ONE transition plays at a time. New scroll targets are
   queued and applied when the current transition finishes.
   Fragments never teleport, never freeze mid-flight.
   ============================================================ */

import * as THREE from 'three';

const TRANSITION_DURATION = 4.0;

export class Hive {
    constructor(scene, quality, core) {
        this.scene = scene;
        this.quality = quality;
        this.core = core;

        this.baseCount = 400;
        this.count = this.baseCount;

        this.fragments = [];
        this.formations = new Map();

        // Target tracking
        this._targetName = 'neutral';       // where fragments are heading
        this._scrollTarget = 'neutral';     // where scroll WANTS them
        this._transitioning = false;
        this._transitionClock = 0;
        this._arrived = false;              // true when settled at target

        this._corePos = new THREE.Vector3(0, 4, 0);
        this._tmpQ = new THREE.Quaternion();

        // Flash
        this.flashMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.9, 24, 18),
            new THREE.MeshBasicMaterial({
                color: 0xdff1ff,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                toneMapped: false
            })
        );
        this.flashMesh.position.copy(this._corePos);
        this.flashMesh.visible = false;
        scene.add(this.flashMesh);

        this._buildFragments();
        this._registerQuality();
    }

    registerFormation(name, formation) {
        if (!formation || !formation.positions) return;
        this.formations.set(name, formation);
    }

    // Called by SceneDirector every frame. This method does NOT
    // start a transition directly — it just records the scroll's
    // desired target. The update() loop decides when to actually
    // start the next transition.
    setTransition(fromName, toName, t) {
        this._scrollTarget = toName;
    }

    _beginTransition(name) {
        // Snapshot current visual positions and rotations
        for (const frag of this.fragments) {
            frag.capturedFrom.copy(frag.mesh.position);
            frag.capturedFromQuat.copy(frag.mesh.quaternion);
        }
        this._targetName = name;
        this._transitionClock = 0;
        this._transitioning = true;
        this._arrived = false;
        this._prepareChoreography(name);
        if (this.core && this.core.whump) this.core.whump();
    }

    _prepareChoreography(name) {
        const form = this.formations.get(name);
        if (!form || !form.positions) return;

        const centroid = new THREE.Vector3();
        for (const p of form.positions) centroid.add(p);
        centroid.multiplyScalar(1 / form.positions.length);

        for (let i = 0; i < this.count; i++) {
            const frag = this.fragments[i];
            const idx = Math.floor(i / 5) % form.positions.length;
            const target = form.positions[idx];

            const dx = target.x - centroid.x;
            const dy = target.y - centroid.y;
            const dz = target.z - centroid.z;
            const len = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;

            frag.homeDir.set(dx / len, dy / len, dz / len);

            const sx = 0.76, sy = 0.24, sz = 0.60;
            const proj = frag.homeDir.x * sx + frag.homeDir.y * sy + frag.homeDir.z * sz;
            frag.waveCoord = THREE.MathUtils.clamp(0.5 + proj * 0.5, 0.02, 0.98);

            const upX = 0, upY = 1, upZ = 0;
            let tx = frag.homeDir.y * upZ - frag.homeDir.z * upY;
            let ty = frag.homeDir.z * upX - frag.homeDir.x * upZ;
            let tz = frag.homeDir.x * upY - frag.homeDir.y * upX;
            const tlen = Math.sqrt(tx*tx + ty*ty + tz*tz) || 1;
            frag.tangent.set(tx / tlen, ty / tlen, tz / tlen);
        }
    }

    _buildFragments() {
        const geometries = [
            new THREE.TetrahedronGeometry(0.26),
            new THREE.OctahedronGeometry(0.24),
            new THREE.IcosahedronGeometry(0.22, 0),
            new THREE.BoxGeometry(0.34, 0.10, 0.22),
            new THREE.BoxGeometry(0.16, 0.32, 0.10),
            new THREE.BoxGeometry(0.24, 0.24, 0.08)
        ];

        const makeMat = (opts) => new THREE.MeshStandardMaterial({
            color: opts.color || 0x2a3040,
            roughness: opts.roughness ?? 0.38,
            metalness: opts.metalness ?? 0.85,
            emissive: opts.emissive || 0x000000,
            emissiveIntensity: opts.emissiveIntensity || 0
        });

        const templates = [
            { make: () => makeMat({ color: 0x1a2030, roughness: 0.55, metalness: 0.7 }), emissive: false },
            { make: () => makeMat({ color: 0x2e3648, roughness: 0.30, metalness: 0.92 }), emissive: false },
            { make: () => makeMat({ color: 0x4a5470, roughness: 0.18, metalness: 0.95 }), emissive: false },
            { make: () => makeMat({
                color: 0x1a2540, roughness: 0.3, metalness: 0.8,
                emissive: 0x4d8bf5, emissiveIntensity: 0.55
            }), emissive: true }
        ];

        for (let i = 0; i < this.baseCount; i++) {
            const geo = geometries[i % geometries.length];
            const roll = Math.random();
            const template = roll < 0.42 ? templates[0]
                           : roll < 0.68 ? templates[1]
                           : roll < 0.85 ? templates[2]
                           : templates[3];

            const mat = template.make();
            const mesh = new THREE.Mesh(geo, mat);

            const r = 5 + Math.random() * 6;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            mesh.position.set(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.cos(phi) * 0.7 + 4,
                r * Math.sin(phi) * Math.sin(theta)
            );
            mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            this.scene.add(mesh);

            this.fragments.push({
                mesh,
                mat,
                ambientPhase: Math.random() * Math.PI * 2,
                timingOffset: Math.random() * 0.10,
                collapsedRadius: 0.45 + Math.random() * 0.55,
                slingshotOvershoot: 1.10 + Math.random() * 0.35,
                angularBias: (Math.random() - 0.5) * 0.6,
                spinDirection: Math.random() < 0.82 ? 1 : -1,
                holdPhaseOffset: Math.random(),
                waveCoord: 0.5,
                homeDir: new THREE.Vector3(0, 1, 0),
                tangent: new THREE.Vector3(1, 0, 0),
                capturedFrom: new THREE.Vector3(),
                capturedFromQuat: new THREE.Quaternion()
            });
        }

        this._neutralFormation = {
            positions: this.fragments.map(f => f.mesh.position.clone()),
            rotations: this.fragments.map(f => f.mesh.quaternion.clone())
        };
        this.formations.set('neutral', this._neutralFormation);
        this._targetName = 'neutral';
        this._scrollTarget = 'neutral';
        this._arrived = true;
    }

    _registerQuality() {
        this.quality.register((level) => {
            const mult = level === 'high' ? 1 : level === 'medium' ? 0.62 : 0.38;
            this.count = Math.floor(this.baseCount * mult);
            for (let i = 0; i < this.fragments.length; i++) {
                this.fragments[i].mesh.visible = i < this.count;
            }
        });
    }

    update(dt) {
        // ─────────────────────────────────────────────────
        // QUEUE LOGIC
        //
        // 1. If not transitioning, check if scroll has moved
        //    away from where we are. If yes, start the next
        //    transition.
        // 2. If transitioning, advance the clock.
        // 3. When clock finishes, either (a) settle into
        //    "arrived" state, or (b) if scroll has already
        //    moved on, immediately begin the next transition.
        // ─────────────────────────────────────────────────

        if (!this._transitioning) {
            if (this._scrollTarget !== this._targetName) {
                this._beginTransition(this._scrollTarget);
            }
        }

        if (this._transitioning) {
            this._transitionClock += dt;
            if (this._transitionClock >= TRANSITION_DURATION) {
                this._transitionClock = TRANSITION_DURATION;
                this._transitioning = false;
                this._arrived = true;

                // Immediately check: did scroll move on while we animated?
                if (this._scrollTarget !== this._targetName) {
                    this._beginTransition(this._scrollTarget);
                }
            }
        }

        const targetForm = this.formations.get(this._targetName);
        if (!targetForm) return;

        const t = this._transitioning
            ? this._transitionClock / TRANSITION_DURATION
            : 1;

        const now = performance.now() * 0.001;
        const corePos = this._corePos;

        // Core flash during the transition
        let flash = 0;
        if (this._transitioning && t > 0.50 && t < 0.72) {
            if (t < 0.58) flash = (t - 0.50) / 0.08;
            else flash = 1 - (t - 0.58) / 0.14;
        }
        this.flashMesh.material.opacity = Math.max(0, flash) * 0.9;
        this.flashMesh.scale.setScalar(1 + Math.max(0, flash) * 5);
        this.flashMesh.visible = flash > 0.01;

        const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
        const smoother = (v) => {
            v = clamp01(v);
            return v * v * v * (v * (v * 6 - 15) + 10);
        };
        const easeOutCubic = (v) => 1 - Math.pow(1 - clamp01(v), 3);

        for (let i = 0; i < this.count; i++) {
            const frag = this.fragments[i];
            const idxB = Math.floor(i / 5) % targetForm.positions.length;
            const posB = targetForm.positions[idxB];
            const from = frag.capturedFrom;

            if (this._transitioning) {
                const off = frag.timingOffset * 0.5;
                const tg = clamp01((t - off) / (1 - off));

                const v0x = from.x - corePos.x;
                const v0y = from.y - corePos.y;
                const v0z = from.z - corePos.z;
                const r0 = Math.sqrt(v0x*v0x + v0y*v0y + v0z*v0z) || 0.001;

                const v1x = posB.x - corePos.x;
                const v1y = posB.y - corePos.y;
                const v1z = posB.z - corePos.z;
                const r1 = Math.sqrt(v1x*v1x + v1y*v1y + v1z*v1z) || 0.001;

                const a0 = Math.atan2(v0z, v0x);
                const a1 = Math.atan2(v1z, v1x);

                let da = a1 - a0;
                while (da >  Math.PI) da -= Math.PI * 2;
                while (da < -Math.PI) da += Math.PI * 2;

                let finalR, finalAngle, finalY;

                if (tg < 0.15) {
                    // FREEZE + TREMOR
                    const k = tg / 0.15;
                    const tremor = Math.sin(now * 40 + frag.ambientPhase) * 0.04 * k;
                    finalR = r0 + tremor;
                    finalAngle = a0 + tremor * 0.1;
                    finalY = v0y + tremor * 0.6;
                }
                else if (tg < 0.40) {
                    // COLLAPSE INWARD
                    const u = smoother((tg - 0.15) / 0.25);
                    finalR = r0 + (frag.collapsedRadius - r0) * u;
                    finalAngle = a0 + da * u * 0.08 + frag.angularBias * u * 0.3;
                    finalY = v0y * (1 - u * 0.85);
                }
                else if (tg < 0.60) {
                    // CORKSCREW AROUND CORE
                    const u = smoother((tg - 0.40) / 0.20);
                    finalR = frag.collapsedRadius + u * 0.35;
                    const spin = u * 4.0 * frag.spinDirection + frag.angularBias;
                    finalAngle = a0 + spin;
                    finalY = v0y * 0.15 + Math.sin(u * Math.PI) * 0.4;
                }
                else if (tg < 0.80) {
                    // SLINGSHOT OUTWARD
                    const u = easeOutCubic((tg - 0.60) / 0.20);
                    const startR = frag.collapsedRadius + 0.35;
                    const overshootR = r1 * frag.slingshotOvershoot;
                    finalR = startR + (overshootR - startR) * u;
                    const spiralAngle = a0 + 4.0 * frag.spinDirection + frag.angularBias;
                    let angleDiff = a1 - spiralAngle;
                    while (angleDiff >  Math.PI) angleDiff -= Math.PI * 2;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                    finalAngle = spiralAngle + angleDiff * u;
                    finalY = v0y * 0.15 + (v1y - v0y * 0.15) * u
                             + Math.sin(u * Math.PI) * 0.5;
                }
                else if (tg < 0.95) {
                    // BEND / SETTLE
                    const u = smoother((tg - 0.80) / 0.15);
                    const overshootR = r1 * frag.slingshotOvershoot;
                    finalR = overshootR + (r1 - overshootR) * u;
                    finalAngle = a1;
                    finalY = v1y + (1 - u) * 0.35;
                }
                else {
                    // SNAP-LOCK
                    finalR = r1;
                    finalAngle = a1;
                    finalY = v1y;
                }

                frag.mesh.position.set(
                    corePos.x + Math.cos(finalAngle) * finalR,
                    corePos.y + finalY,
                    corePos.z + Math.sin(finalAngle) * finalR
                );

                const rotB = targetForm.rotations ? targetForm.rotations[idxB] : null;
                if (rotB) {
                    frag.mesh.quaternion.copy(frag.capturedFromQuat).slerp(rotB, smoother(tg));

                    let extraSpin = 0;
                    if (tg > 0.35 && tg < 0.85) {
                        const s = Math.sin(((tg - 0.35) / 0.50) * Math.PI);
                        extraSpin = s * Math.PI * 5 * frag.spinDirection;
                    }
                    if (extraSpin !== 0) {
                        this._tmpQ.setFromAxisAngle(new THREE.Vector3(0, 1, 0), extraSpin);
                        frag.mesh.quaternion.multiply(this._tmpQ);
                    }
                }
            }
            else {
                // HOLD — dead still except for the wave pulse every ~6s
                const HOLD_CYCLE = 6.0;
                const holdT = (now + frag.holdPhaseOffset * 0.4) % HOLD_CYCLE;

                let pulse = 0;
                if (holdT > 3.5 && holdT < 5.0) {
                    const front = (holdT - 3.5) / 1.5;
                    const d = frag.waveCoord - front;
                    const influence = Math.exp(-d * d * 45);
                    const osc = Math.sin((holdT - 3.5) * 16);
                    pulse = influence * osc * 0.35;
                }

                frag.mesh.position.set(
                    posB.x + frag.homeDir.x * pulse,
                    posB.y + frag.homeDir.y * pulse,
                    posB.z + frag.homeDir.z * pulse
                );

                const rotB = targetForm.rotations ? targetForm.rotations[idxB] : null;
                if (rotB) {
                    frag.mesh.quaternion.copy(rotB);
                    if (pulse !== 0) {
                        this._tmpQ.setFromAxisAngle(new THREE.Vector3(0, 0, 1), pulse * 0.2);
                        frag.mesh.quaternion.multiply(this._tmpQ);
                    }
                }
            }

            frag.mesh.updateMatrix();
        }
    }
}   