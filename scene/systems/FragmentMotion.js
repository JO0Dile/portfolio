/* ============================================================
   FragmentMotion.js — reusable motion technology
   Bezier arcs + wave delays + overshoot settle + reversible
   ============================================================ */

import * as THREE from 'three';

export const FragmentMotion = {
    // ── Easing curves ───────────────────────────────────────
    easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    },

    easeOutQuint(t) {
        return 1 - Math.pow(1 - t, 5);
    },

    // ── Bezier position ─────────────────────────────────────
    // Quadratic bezier: start → control → end
    bezier(start, control, end, t, out) {
        const oneMinusT = 1 - t;
        const a = oneMinusT * oneMinusT;
        const b = 2 * oneMinusT * t;
        const c = t * t;
        out.set(
            a * start.x + b * control.x + c * end.x,
            a * start.y + b * control.y + c * end.y,
            a * start.z + b * control.z + c * end.z
        );
        return out;
    },

    // ── Compute control point for the transition arc ────────
    // Every fragment arcs outward from the core, then settles in
    computeControl(fromPos, toPos, corePos, out) {
        // Direction away from core, in the XY of the fragment's current position
        const fromCore = new THREE.Vector3().subVectors(fromPos, corePos);
        const dist = fromCore.length() || 1;
        fromCore.multiplyScalar(1 / dist);

        // Push outward + slightly up
        out.copy(fromPos)
           .addScaledVector(fromCore, 2.8)
           .add(new THREE.Vector3(0, 1.6, 0));

        // Blend toward the midpoint so paths don't feel uniform
        const mid = new THREE.Vector3().addVectors(fromPos, toPos).multiplyScalar(0.5);
        out.lerp(mid, 0.35);

        return out;
    },

    // ── Wave delay ──────────────────────────────────────────
    // Fragments closest to the core leave earliest. Far fragments
    // leave latest. WaveStrength controls how pronounced the wave is.
    computeWaveDelay(fragmentPos, corePos, waveStrength = 0.35) {
        const dist = fragmentPos.distanceTo(corePos);
        // Normalize into 0..1 — assume distances between 2 and 14
        const normalized = Math.max(0, Math.min(1, (dist - 2) / 12));
        return normalized * waveStrength;
    },

    // ── Settle behaviour ────────────────────────────────────
    // Applied AFTER t reaches 1: small overshoot then settle.
    // Returns a multiplier to extend the position past target.
    settleOffset(elapsedSinceArrival) {
        if (elapsedSinceArrival <= 0) return 0;
        // ~0.6s settle window
        const t = Math.min(elapsedSinceArrival / 0.6, 1);
        // Damped sine
        const amplitude = 0.14;
        const freq = 7.0;
        const decay = Math.exp(-6 * t);
        return Math.sin(t * freq) * amplitude * decay;
    },

    // ── Orientation lerp ───────────────────────────────────
    // Slower than position — reads as "attention settling"
    quaternionSlerp(fromQ, toQ, t, out) {
        out.copy(fromQ).slerp(toQ, t);
        return out;
    }
};