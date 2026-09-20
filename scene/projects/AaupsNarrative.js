/* ============================================================
   AaupsNarrative.js — 50-second cycle
   3 drones, 3 themes, tight pacing, instant kills.
   ============================================================ */

import * as THREE from 'three';
import { Drone } from './Drone.js';
import { aaupState, resetAaupState } from './ProjectPanels.js';

const CYCLE = 50;
const CX = 1280, CY = 800;
const PW = 6.8, PH = 4.25;

function toPanel(cx, cy, z = 0.45) {
    return new THREE.Vector3(
        (cx / CX - 0.5) * PW,
        -(cy / CY - 0.5) * PH + 0.5,
        z
    );
}

const PT = {
    blueHome:     toPanel(260, 190),
    blueEntry:    toPanel(1500, 120),
    redEntry:     toPanel(1700, 260),
    redAttack:    toPanel(650, 260),
    yellowEntry:  toPanel(1700, 260),
    nextSemBtn:   toPanel(790, 700),
    resetBtn:     toPanel(300, 700),
    check1:       toPanel(505, 165),
    check2:       toPanel(505, 255),
    check3:       toPanel(505, 345),
    check4:       toPanel(505, 435),
    nukeEntry:    toPanel(1900, -100),
    nukeHit:      toPanel(650, 260),
    tabPeek:      toPanel(500, -220),
    yellowCheck:  toPanel(700, 300)      // ← FIX: the missing definition
};

function easeOutCubic(u) { return 1 - Math.pow(1 - u, 3); }
function easeInOut(u) { return u < 0.5 ? 4*u*u*u : 1 - Math.pow(-2*u+2,3)/2; }
function lerp(a, b, u) { return a + (b - a) * Math.max(0, Math.min(1, u)); }

export class AaupsNarrative {
    constructor(panelGroup) {
        this.group = new THREE.Group();
        panelGroup.add(this.group);
        this.group.renderOrder = 25;

        this.elapsed = 0;
        this.started = false;

        this._buildTint();
        this._buildDrones();
        this._buildLaser();
        this._buildNuke();
        this._buildFlashes();

        this._flags = {};
    }

    _buildTint() {
        this.tint = new THREE.Mesh(
            new THREE.PlaneGeometry(PW, PH),
            new THREE.MeshBasicMaterial({
                color: 0xff3030,
                transparent: true,
                opacity: 0,
                depthWrite: false,
                toneMapped: false
            })
        );
        this.tint.position.z = 0.04;
        this.tint.renderOrder = 22;
        this.group.add(this.tint);
    }

    _buildDrones() {
        this.blue = new Drone({ color: 0x4d8bf5, scale: 1.0 });
        this.blue.setVisible(false);
        this.group.add(this.blue.group);

        this.red = new Drone({ color: 0xff3030, scale: 1.0 });
        this.red.setVisible(false);
        this.group.add(this.red.group);

        this.yellow = new Drone({ color: 0xffd83d, scale: 1.0 });
        this.yellow.setVisible(false);
        this.group.add(this.yellow.group);
    }

    _buildLaser() {
        const geo = new THREE.CylinderGeometry(0.035, 0.035, 1, 12, 1, true);
        this.laser = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
            color: 0xff4040, transparent: true, opacity: 0.9,
            blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
        }));
        this.laser.visible = false;
        this.group.add(this.laser);

        this.laserGlow = new THREE.Mesh(
            new THREE.CylinderGeometry(0.11, 0.11, 1, 12, 1, true),
            new THREE.MeshBasicMaterial({
                color: 0xff2020, transparent: true, opacity: 0.3,
                blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
            })
        );
        this.laserGlow.visible = false;
        this.group.add(this.laserGlow);
    }

    _buildNuke() {
        this.nuke = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 20, 16),
            new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.95, toneMapped: false })
        );
        this.nuke.visible = false;
        this.group.add(this.nuke);

        this.nukeGlow = new THREE.Mesh(
            new THREE.SphereGeometry(0.7, 20, 16),
            new THREE.MeshBasicMaterial({
                color: 0xffd83d, transparent: true, opacity: 0.45,
                blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
            })
        );
        this.nukeGlow.visible = false;
        this.group.add(this.nukeGlow);

        this.nukeFlash = new THREE.Mesh(
            new THREE.SphereGeometry(1.8, 24, 18),
            new THREE.MeshBasicMaterial({
                color: 0xffe680, transparent: true, opacity: 0,
                blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
            })
        );
        this.nukeFlash.visible = false;
        this.group.add(this.nukeFlash);
    }

    _buildFlashes() {
        const make = (hex) => {
            const m = new THREE.Mesh(
                new THREE.SphereGeometry(0.9, 20, 16),
                new THREE.MeshBasicMaterial({
                    color: hex, transparent: true, opacity: 0,
                    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
                })
            );
            m.visible = false;
            this.group.add(m);
            return m;
        };
        this.blueFlash = make(0x6ba8ff);
        this.redFlash = make(0xff7070);
        this.yellowFlash = make(0xffe680);
    }

    start() {
        this.elapsed = 0;
        this.started = true;
        this._flags = {};

        resetAaupState();

        this.blue.reset();  this.red.reset();  this.yellow.reset();

        this.blue.setVisible(false);
        this.red.setVisible(false);
        this.yellow.setVisible(false);

        this.laser.visible = false;
        this.laserGlow.visible = false;
        this.nuke.visible = false;
        this.nukeGlow.visible = false;
        this.nukeFlash.visible = false;
        this.nukeFlash.scale.setScalar(1);

        this.blueFlash.visible = false;
        this.redFlash.visible = false;
        this.yellowFlash.visible = false;
        this.blueFlash.scale.setScalar(1);
        this.redFlash.scale.setScalar(1);
        this.yellowFlash.scale.setScalar(1);

        this.tint.material.opacity = 0;
        this.tint.material.color.set(0xff3030);
    }

    stop() { this.started = false; }

    _once(key, fn) {
        if (this._flags[key]) return;
        this._flags[key] = true;
        fn();
    }

    update(dt, camera) {
        if (!this.started) return;
        this.elapsed += dt;
        if (this.elapsed >= CYCLE) {
            this.start();
            return;
        }
        const t = this.elapsed;

        this._driveBlue(t);
        this._driveRed(t);
        this._driveYellow(t);
        this._driveLaser(t);
        this._driveNuke(t);
        this._driveTheme(t, dt);
        this._driveFlashes(dt);

        this.blue.update(dt);
        this.red.update(dt);
        this.yellow.update(dt);
    }

    // ── BLUE: 0-2.5 fly in, 2.5-6 hover, 6-9 ambushed, 9-36 dead,
    //          36-38 rise from behind tab, 38 ram yellow, then reset ──
    _driveBlue(t) {
        // Dead window
        if (t >= 9.5 && t < 35.0) { this.blue.setVisible(false); return; }

        // 0-2.5 fly in
        if (t < 2.5) {
            this._once('blueVis', () => {
                this.blue.reset();
                this.blue.setVisible(true);
            });
            const u = easeOutCubic(t / 2.5);
            this.blue.snapTo(
                lerp(PT.blueEntry.x, PT.blueHome.x, u),
                lerp(PT.blueEntry.y, PT.blueHome.y, u),
                lerp(PT.blueEntry.z, PT.blueHome.z, u)
            );
            return;
        }

        // 2.5-9 hover at home
        if (t < 9.5) {
            this.blue.snapTo(PT.blueHome.x, PT.blueHome.y, PT.blueHome.z);
            this.blue.setPress(Math.sin(t * 2) * 0.05);
            return;
        }

        // 9.5-10 explode
        if (t < 10.0) {
            this._once('blueDie', () => {
                this.blue.explode();
                this.blueFlash.position.copy(this.blue.group.position);
                this.blueFlash.material.opacity = 1;
                this.blueFlash.scale.setScalar(0.3);
                this.blueFlash.visible = true;
            });
            this.blue.setVisible(false);
            return;
        }

        // 35-36.5 rise from tab
        if (t < 36.5) {
            this._once('blueReturn', () => {
                this.blue.reset();
                this.blue.setVisible(true);
                this.blue.snapTo(PT.tabPeek.x, PT.tabPeek.y, PT.tabPeek.z);
            });
            const u = easeOutCubic((t - 35.0) / 1.5);
            this.blue.snapTo(
                lerp(PT.tabPeek.x, PT.yellowCheck.x, u),
                lerp(PT.tabPeek.y, PT.yellowCheck.y + 0.4, u),
                lerp(PT.tabPeek.z, PT.yellowCheck.z, u)
            );
            return;
        }

        // 36.5-37.5 charge
        if (t < 37.5) {
            const u = easeInOut((t - 36.5) / 1.0);
            const yellowPos = this.yellow.group.position;
            this.blue.snapTo(
                lerp(PT.yellowCheck.x, yellowPos.x, u),
                lerp(PT.yellowCheck.y + 0.4, yellowPos.y, u),
                lerp(PT.yellowCheck.z, yellowPos.z, u)
            );
            return;
        }

        // 37.5 detonate yellow
        if (t < 37.6) {
            this._once('yellowDie', () => {
                this.yellow.explode();
                this.yellowFlash.position.copy(this.yellow.group.position);
                this.yellowFlash.material.opacity = 1;
                this.yellowFlash.scale.setScalar(0.4);
                this.yellowFlash.visible = true;
            });
            this.yellow.setVisible(false);
            return;
        }

        // 37.6-39.5 fly to Reset
        if (t < 39.5) {
            const u = easeInOut((t - 37.6) / 1.9);
            const yellowPos = PT.yellowCheck;
            this.blue.snapTo(
                lerp(yellowPos.x, PT.resetBtn.x, u),
                lerp(yellowPos.y + 0.4, PT.resetBtn.y, u),
                lerp(yellowPos.z, PT.resetBtn.z, u)
            );
            return;
        }

        // 39.5-41.5 press Reset
        if (t < 41.5) {
            this.blue.snapTo(PT.resetBtn.x, PT.resetBtn.y, PT.resetBtn.z);
            const u = (t - 39.5) / 2.0;
            this.blue.setPress(Math.sin(u * Math.PI));

            if (u > 0.5) {
                this._once('resetApplied', () => {
                    resetAaupState();
                    aaupState.resetPressed = true;
                    setTimeout(() => { aaupState.resetPressed = false; }, 400);
                });
            }
            return;
        }

        // 41.5-42.5 red spawns and shoots blue
        if (t < 42.5) {
            this.blue.snapTo(PT.resetBtn.x, PT.resetBtn.y + 0.4, PT.resetBtn.z);
            // The actual blue death is triggered below, no movement
            return;
        }

        // 42.5: blue instantly dies
        if (t < 43.0) {
            this._once('blueFinalDie', () => {
                this.blue.explode();
                this.blueFlash.position.copy(this.blue.group.position);
                this.blueFlash.material.opacity = 1;
                this.blueFlash.scale.setScalar(0.3);
                this.blueFlash.visible = true;
            });
            this.blue.setVisible(false);
            return;
        }

        // Done — hidden until next cycle
        this.blue.setVisible(false);
    }

    // ── RED: arrives 6, fires 8.5, kills 10, presses Next Sem 13,
    //         checks 4 boxes 16-24, dies to nuke AT 24 ──
    _driveRed(t) {
        if (t < 6.0) { this.red.setVisible(false); return; }
        if (t >= 24.0) { this.red.setVisible(false); return; }

        // Fly in 6-8.5
        if (t < 8.5) {
            this._once('redVis', () => {
                this.red.reset();
                this.red.setVisible(true);
            });
            const u = easeOutCubic((t - 6.0) / 2.5);
            this.red.snapTo(
                lerp(PT.redEntry.x, PT.redAttack.x, u),
                lerp(PT.redEntry.y, PT.redAttack.y, u),
                lerp(PT.redEntry.z, PT.redAttack.z, u)
            );
            return;
        }

        // Aim 8.5-9.5
        if (t < 9.5) {
            this.red.snapTo(PT.redAttack.x, PT.redAttack.y, PT.redAttack.z);
            this.red.setPress(Math.sin((t - 8.5) * Math.PI) * 0.4);
            return;
        }

        // Watch the kill 9.5-11
        if (t < 11.0) {
            this.red.snapTo(PT.redAttack.x, PT.redAttack.y, PT.redAttack.z);
            this.red.setPress(0);
            return;
        }

        // Fly to Next Sem 11-13
        if (t < 13.0) {
            const u = easeInOut((t - 11.0) / 2.0);
            this.red.snapTo(
                lerp(PT.redAttack.x, PT.nextSemBtn.x, u),
                lerp(PT.redAttack.y, PT.nextSemBtn.y, u),
                lerp(PT.redAttack.z, PT.nextSemBtn.z, u)
            );
            return;
        }

        // Press Next Sem 13-14.5
        if (t < 14.5) {
            this.red.snapTo(PT.nextSemBtn.x, PT.nextSemBtn.y, PT.nextSemBtn.z);
            const u = (t - 13.0) / 1.5;
            this.red.setPress(Math.sin(u * Math.PI));

            if (u > 0.5) {
                this._once('nextSemApplied', () => {
                    aaupState.semester = 1;
                    aaupState.checks = [false, false, false, false];
                    aaupState.themeColor = '#ff3030';
                    aaupState.nextSemPressed = true;
                    setTimeout(() => { aaupState.nextSemPressed = false; }, 400);
                });
            }
            return;
        }

        // Reposition 14.5-16
        if (t < 16.0) {
            const u = easeInOut((t - 14.5) / 1.5);
            this.red.snapTo(
                lerp(PT.nextSemBtn.x, PT.check1.x, u),
                lerp(PT.nextSemBtn.y, PT.check1.y, u),
                lerp(PT.nextSemBtn.z, PT.check1.z, u)
            );
            return;
        }

        // Check 4 boxes: 16-18, 18-20, 20-22, 22-24
        const checkTimes = [16.0, 18.0, 20.0, 22.0];
        const checks = [PT.check1, PT.check2, PT.check3, PT.check4];
        for (let i = 0; i < 4; i++) {
            const start = checkTimes[i];
            const end = start + 2.0;
            if (t >= start && t < end) {
                const u = (t - start) / 2.0;
                const prevPt = i === 0 ? PT.check1 : checks[i - 1];
                const thisPt = checks[i];

                if (u < 0.55) {
                    if (i === 0) {
                        this.red.snapTo(thisPt.x, thisPt.y, thisPt.z);
                    } else {
                        const mvu = easeInOut(u / 0.55);
                        this.red.snapTo(
                            lerp(prevPt.x, thisPt.x, mvu),
                            lerp(prevPt.y, thisPt.y, mvu),
                            lerp(prevPt.z, thisPt.z, mvu)
                        );
                    }
                    this.red.setPress(0);
                } else {
                    this.red.snapTo(thisPt.x, thisPt.y, thisPt.z);
                    const pu = (u - 0.55) / 0.3;
                    if (pu < 1) this.red.setPress(Math.sin(pu * Math.PI));
                    else this.red.setPress(0);

                    if (u > 0.6) {
                        this._once('redCheck' + i, () => {
                            aaupState.checks[i] = true;
                        });
                    }
                }
                return;
            }
        }
    }

    // ── YELLOW: nuke arrives 22-24, yellow arrives 24.5-27,
    //           presses Next Sem 27-28.5, checks 30-38, rammed at 38 ──
    _driveYellow(t) {
        if (t < 24.5) { this.yellow.setVisible(false); return; }
        if (t >= 38.0) { this.yellow.setVisible(false); return; }

        // Fly in 24.5-27
        if (t < 27.0) {
            this._once('yellowVis', () => {
                this.yellow.reset();
                this.yellow.setVisible(true);
            });
            const u = easeOutCubic((t - 24.5) / 2.5);
            this.yellow.snapTo(
                lerp(PT.yellowEntry.x, PT.nextSemBtn.x, u),
                lerp(PT.yellowEntry.y, PT.nextSemBtn.y, u),
                lerp(PT.yellowEntry.z, PT.nextSemBtn.z, u)
            );
            return;
        }

        // Press Next Sem 27-28.5
        if (t < 28.5) {
            this.yellow.snapTo(PT.nextSemBtn.x, PT.nextSemBtn.y, PT.nextSemBtn.z);
            const u = (t - 27.0) / 1.5;
            this.yellow.setPress(Math.sin(u * Math.PI));

            if (u > 0.5) {
                this._once('yellowNextSem', () => {
                    aaupState.semester = 2;
                    aaupState.checks = [false, false, false, false];
                    aaupState.themeColor = '#ffd83d';
                    aaupState.nextSemPressed = true;
                    setTimeout(() => { aaupState.nextSemPressed = false; }, 400);
                });
            }
            return;
        }

        // Reposition 28.5-30
        if (t < 30.0) {
            const u = easeInOut((t - 28.5) / 1.5);
            this.yellow.snapTo(
                lerp(PT.nextSemBtn.x, PT.check1.x, u),
                lerp(PT.nextSemBtn.y, PT.check1.y, u),
                lerp(PT.nextSemBtn.z, PT.check1.z, u)
            );
            return;
        }

        // Check 4 boxes: 30-32, 32-34, 34-36, 36-38
        const checkTimes = [30.0, 32.0, 34.0, 36.0];
        const checks = [PT.check1, PT.check2, PT.check3, PT.check4];
        for (let i = 0; i < 4; i++) {
            const start = checkTimes[i];
            const end = start + 2.0;
            if (t >= start && t < end) {
                const u = (t - start) / 2.0;
                const prevPt = i === 0 ? PT.check1 : checks[i - 1];
                const thisPt = checks[i];

                if (u < 0.55) {
                    if (i === 0) {
                        this.yellow.snapTo(thisPt.x, thisPt.y, thisPt.z);
                    } else {
                        const mvu = easeInOut(u / 0.55);
                        this.yellow.snapTo(
                            lerp(prevPt.x, thisPt.x, mvu),
                            lerp(prevPt.y, thisPt.y, mvu),
                            lerp(prevPt.z, thisPt.z, mvu)
                        );
                    }
                    this.yellow.setPress(0);
                } else {
                    this.yellow.snapTo(thisPt.x, thisPt.y, thisPt.z);
                    const pu = (u - 0.55) / 0.3;
                    if (pu < 1) this.yellow.setPress(Math.sin(pu * Math.PI));
                    else this.yellow.setPress(0);

                    if (u > 0.6) {
                        this._once('yellowCheck' + i, () => {
                            aaupState.checks[i] = true;
                        });
                    }
                }
                return;
            }
        }
    }

    _driveLaser(t) {
        if (t >= 8.5 && t < 9.5) {
            this.laser.visible = true;
            this.laserGlow.visible = true;

            const from = this.red.group.position.clone();
            const to = this.blue.group.position.clone();
            const dir = new THREE.Vector3().subVectors(to, from);
            const len = dir.length();

            const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
            const q = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                dir.clone().normalize()
            );

            this.laser.position.copy(mid);
            this.laser.scale.set(1, len, 1);
            this.laser.quaternion.copy(q);
            this.laserGlow.position.copy(mid);
            this.laserGlow.scale.set(1, len, 1);
            this.laserGlow.quaternion.copy(q);

            const flicker = 0.7 + 0.3 * Math.random();
            this.laser.material.opacity = 0.9 * flicker;
            this.laserGlow.material.opacity = 0.35 * flicker;
        } else {
            this.laser.visible = false;
            this.laserGlow.visible = false;
        }
    }

    _driveNuke(t) {
        // Nuke streaks in FAST: 22-23.5
        if (t >= 22.0 && t < 23.5) {
            this.nuke.visible = true;
            this.nukeGlow.visible = true;

            const u = (t - 22.0) / 1.5;
            const eu = easeInOut(u);
            const p = new THREE.Vector3().lerpVectors(PT.nukeEntry, PT.nukeHit, eu);
            this.nuke.position.copy(p);
            this.nukeGlow.position.copy(p);
            this.nukeGlow.scale.setScalar(1 + u * 0.8);
            return;
        }

        // Hit at 23.5 — red dies instantly
        if (t >= 23.5 && t < 24.0) {
            this.nuke.visible = false;
            this.nukeGlow.visible = false;
            this._once('redDie', () => {
                this.red.explode();
                this.redFlash.position.copy(this.red.group.position);
                this.redFlash.material.opacity = 1;
                this.redFlash.scale.setScalar(0.4);
                this.redFlash.visible = true;
            });
            this.red.setVisible(false);

            this.nukeFlash.visible = true;
            this.nukeFlash.position.copy(PT.nukeHit);
            const u = (t - 23.5) / 0.5;
            this.nukeFlash.material.opacity = (1 - u) * 0.95;
            this.nukeFlash.scale.setScalar(0.4 + u * 4);
            return;
        }

        // Fade the flash
        if (t >= 24.0 && t < 25.0) {
            const u = (t - 24.0) / 1.0;
            this.nukeFlash.material.opacity = (1 - u) * 0.5;
            this.nukeFlash.scale.setScalar(4.4 + u * 2);
            return;
        }

        this.nuke.visible = false;
        this.nukeGlow.visible = false;
        this.nukeFlash.visible = false;
    }

    _driveTheme(t, dt) {
        // Theme tint color follows the controller
        let tintColor = 0xff3030;
        let opacity = 0;

        if (t >= 14.5 && t < 28.5) {
            // Red in control
            tintColor = 0xff3030;
            opacity = 0.35;
        } else if (t >= 28.5 && t < 41.5) {
            // Yellow in control
            tintColor = 0xffd83d;
            opacity = 0.35;
        } else if (t >= 41.5 && t < 42.5) {
            // Reset transition — back to blue
            tintColor = 0x4d8bf5;
            opacity = 0.15;
        }

        this.tint.material.color.set(tintColor);
        const cur = this.tint.material.opacity;
        this.tint.material.opacity = cur + (opacity - cur) * Math.min(1, dt * 1.5);
    }

    _driveFlashes(dt) {
        [this.blueFlash, this.redFlash, this.yellowFlash].forEach(f => {
            if (!f.visible) return;
            f.material.opacity = Math.max(0, f.material.opacity - dt * 1.6);
            f.scale.setScalar(f.scale.x + dt * 3.5);
            if (f.material.opacity < 0.02) {
                f.visible = false;
                f.scale.setScalar(1);
            }
        });
    }
}