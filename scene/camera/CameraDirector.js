/* ============================================================
   CameraDirector.js — spring camera with roll
   ============================================================ */

import * as THREE from 'three';

export class CameraDirector {
    constructor(camera) {
        this.camera = camera;

        this.pos    = new THREE.Vector3(0, 5, 28);
        this.lookAt = new THREE.Vector3(0, 5, 0);
        this.focus  = 28;

        this.targetPos    = new THREE.Vector3(0, 5, 28);
        this.targetLookAt = new THREE.Vector3(0, 5, 0);
        this.targetFocus  = 28;

        this.mouseYaw   = 0;
        this.mousePitch = 0;
        this.targetYaw   = 0;
        this.targetPitch = 0;
        this.velYaw     = 0;
        this.velPitch   = 0;

        this.velX = 0;
        this.velY = 0;
        this.velZ = 0;

        this.posStiffness = 18;
        this.posDamping   = 8;

        this.driftPhase = 0;

        // ── Roll ──
        this.roll = 0;
        this.targetRoll = 0;

        // Shake
        this.shake = {
            magnitude: 0,
            decay: 6.5,
            offset: new THREE.Vector3()
        };

        this._scratchLook = new THREE.Vector3();
        this._apply();
    }

    setTrack(position, lookAt, focusDistance) {
        this.targetPos.set(position.x, position.y, position.z);
        this.targetLookAt.set(lookAt.x, lookAt.y, lookAt.z);
        this.targetFocus = focusDistance;
    }

    setMouse(mx, my) {
        this.targetYaw   = mx * 0.11;
        this.targetPitch = my * 0.055;
    }

    setRoll(r) {
        this.targetRoll = r;
    }

    shakeImpulse(magnitude = 0.16) {
        this.shake.magnitude = Math.min(0.5, this.shake.magnitude + magnitude);
    }

    get position()      { return this.pos; }
    get focusDistance() { return this.focus; }

    update(dt) {
        // Mouse spring
        const ay = (this.targetYaw   - this.mouseYaw)   * 42;
        const ap = (this.targetPitch - this.mousePitch) * 42;
        this.velYaw   += ay * dt;
        this.velPitch += ap * dt;
        const mdamp = Math.exp(-9 * dt);
        this.velYaw   *= mdamp;
        this.velPitch *= mdamp;
        this.mouseYaw   += this.velYaw   * dt;
        this.mousePitch += this.velPitch * dt;

        // Position spring
        this.driftPhase += dt * 0.14;
        const driftX = Math.sin(this.driftPhase) * 0.22;
        const driftY = Math.cos(this.driftPhase * 0.7) * 0.09;

        const tx = this.targetPos.x + driftX;
        const ty = this.targetPos.y + driftY;
        const tz = this.targetPos.z;

        const ax = (tx - this.pos.x) * this.posStiffness;
        const ay2 = (ty - this.pos.y) * this.posStiffness;
        const az = (tz - this.pos.z) * this.posStiffness;

        this.velX += ax * dt;
        this.velY += ay2 * dt;
        this.velZ += az * dt;

        const pdamp = Math.exp(-this.posDamping * dt);
        this.velX *= pdamp;
        this.velY *= pdamp;
        this.velZ *= pdamp;

        this.pos.x += this.velX * dt;
        this.pos.y += this.velY * dt;
        this.pos.z += this.velZ * dt;

        // Shake decay
        if (this.shake.magnitude > 0.0005) {
            const s = this.shake.magnitude;
            this.shake.offset.set(
                (Math.random() - 0.5) * s,
                (Math.random() - 0.5) * s,
                (Math.random() - 0.5) * s * 0.5
            );
            this.shake.magnitude *= Math.exp(-this.shake.decay * dt);
        } else {
            this.shake.magnitude = 0;
            this.shake.offset.set(0, 0, 0);
        }

        // Look spring
        const lokLerp = 1 - Math.exp(-4.5 * dt);
        this.lookAt.x += (this.targetLookAt.x - this.lookAt.x) * lokLerp;
        this.lookAt.y += (this.targetLookAt.y - this.lookAt.y) * lokLerp;
        this.lookAt.z += (this.targetLookAt.z - this.lookAt.z) * lokLerp;

        // Focus spring
        const focusLerp = 1 - Math.exp(-3.0 * dt);
        this.focus += (this.targetFocus - this.focus) * focusLerp;

        // Roll spring
        const rollLerp = 1 - Math.exp(-2.0 * dt);
        this.roll += (this.targetRoll - this.roll) * rollLerp;

        this._apply();
    }

    _apply() {
        this.camera.position.copy(this.pos).add(this.shake.offset);

        this._scratchLook.copy(this.lookAt);
        this._scratchLook.x += this.mouseYaw * 14;
        this._scratchLook.y += this.mousePitch * 10;
        this._scratchLook.x += this.shake.offset.x * 2.4;
        this._scratchLook.y += this.shake.offset.y * 2.4;

        this.camera.lookAt(this._scratchLook);
        this.camera.rotateZ(this.roll);
    }
}