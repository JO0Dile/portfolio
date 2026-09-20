/* ============================================================
   SceneDirector.js — hardcoded timeline matching page layout
   Work: 48.6% → 75.9%  (measured)
   ============================================================ */

import { FormationRegistry } from '../formations/FormationRegistry.js';

const PROJECT_INDEX = {
    aaup:         0,
    construction: 1,
    rlscientist:  2,
    listinglab:   3,
    aimaze:       4
};

const ACCENT_COLORS = {
    neutral:      0x4d8bf5,
    aaup:         0x4d8bf5,
    construction: 0xff8a5c,
    rlscientist:  0x3fca7d,
    listinglab:   0xb07cff,
    aimaze:       0xffbe5c
};

export class SceneDirector {
    constructor(world, revealSystem, cameraDirector, panels, labels) {
        this.world  = world;
        this.camera = cameraDirector;
        this.panels = panels;
        this.labels = labels;

        this.hive = world.hive;
        this.core = world.core;

        this.registry = new FormationRegistry(this.hive.count);
        ['aaup', 'construction', 'rlscientist', 'listinglab', 'aimaze'].forEach(name => {
            const f = this.registry.get(name);
            if (f) this.hive.registerFormation(name, f);
        });

        this._lastCount = this.hive.count;
        this._lastAccentName = null;

        // Timeline based on MEASURED page positions
        // Neutral holds through Hero + About (0 → 44%)
        // Work begins ~48.6% — transition completes just before
        // Lab begins ~75.9% — back to neutral by then
        this.timeline = [
            { at: 0.00, formation: 'neutral',      phase: 'hold' },
            { at: 0.44, formation: 'neutral',      phase: 'hold' },
            { at: 0.47, formation: 'aaup',         phase: 'transition' },
            { at: 0.51, formation: 'aaup',         phase: 'hold' },
            { at: 0.54, formation: 'construction', phase: 'transition' },
            { at: 0.58, formation: 'construction', phase: 'hold' },
            { at: 0.61, formation: 'rlscientist',  phase: 'transition' },
            { at: 0.65, formation: 'rlscientist',  phase: 'hold' },
            { at: 0.68, formation: 'listinglab',   phase: 'transition' },
            { at: 0.72, formation: 'listinglab',   phase: 'hold' },
            { at: 0.75, formation: 'aimaze',       phase: 'transition' },
            { at: 0.79, formation: 'aimaze',       phase: 'hold' },
            { at: 0.85, formation: 'neutral',      phase: 'transition' },
            { at: 1.00, formation: 'neutral',      phase: 'hold' }
        ];

        this.cameraTracks = {
            hero:         { pos: [ 0,   4.5, 22], look: [0, 4,   0], focus: 22 },
            about:        { pos: [-1.5, 4.5, 17], look: [0, 4,   0], focus: 17 },
            aaup:         { pos: [ 0,   5.2, 13], look: [0, 5.2, 0], focus: 13 },
            construction: { pos: [ 0,   5.2, 13], look: [0, 5.2, 0], focus: 13 },
            rlscientist:  { pos: [ 0,   5.2, 13], look: [0, 5.2, 0], focus: 13 },
            listinglab:   { pos: [ 0,   5.2, 13], look: [0, 5.2, 0], focus: 13 },
            aimaze:       { pos: [ 0,   5.2, 13], look: [0, 5.2, 0], focus: 13 },
            contact:      { pos: [ 0,   6,   20], look: [0, 5,   0], focus: 20 }
        };
    }

    update(dt, scrollProgress, elapsed) {
        if (this.hive.count !== this._lastCount) {
            this.registry.rebuild(this.hive.count);
            ['aaup', 'construction', 'rlscientist', 'listinglab', 'aimaze'].forEach(name => {
                const f = this.registry.get(name);
                if (f) this.hive.registerFormation(name, f);
            });
            this._lastCount = this.hive.count;
        }

        const slot = this._resolveSlot(scrollProgress);
        this.hive.setTransition(slot.from, slot.to, slot.t);
        this._driveCamera(scrollProgress);
        this._drivePanels(slot);
        this._driveAccent(slot);
    }

    _resolveSlot(p) {
        const tl = this.timeline;
        if (!tl || tl.length === 0) {
            return { from: 'neutral', to: 'neutral', t: 1, phase: 'hold', formation: 'neutral' };
        }

        if (p <= tl[0].at) {
            return { from: tl[0].formation, to: tl[0].formation, t: 1, phase: 'hold', holdT: 0, formation: tl[0].formation };
        }

        for (let i = 0; i < tl.length - 1; i++) {
            const a = tl[i];
            const b = tl[i + 1];
            if (p >= a.at && p <= b.at) {
                const t = (p - a.at) / Math.max(0.0001, b.at - a.at);

                if (b.phase === 'transition') {
                    return { from: a.formation, to: b.formation, t, phase: 'transition' };
                } else {
                    return {
                        from: a.formation,
                        to: a.formation,
                        t: 1,
                        phase: 'hold',
                        holdT: t,
                        formation: a.formation
                    };
                }
            }
        }

        const last = tl[tl.length - 1];
        return { from: last.formation, to: last.formation, t: 1, phase: 'hold', holdT: 1, formation: last.formation };
    }

    _drivePanels(slot) {
        let projectIdx = -1;
        let opacity = 0;

        if (slot.phase === 'hold') {
            projectIdx = PROJECT_INDEX[slot.formation] ?? -1;
            if (projectIdx >= 0) {
                const ht = slot.holdT ?? 0;
                if (ht < 0.20) opacity = ht / 0.20;
                else if (ht > 0.80) opacity = (1 - ht) / 0.20;
                else opacity = 1;
            }
        } else {
            const fromIdx = PROJECT_INDEX[slot.from] ?? -1;
            const toIdx   = PROJECT_INDEX[slot.to]   ?? -1;

            if (slot.t < 0.5) {
                projectIdx = fromIdx;
                opacity = 1 - (slot.t / 0.5);
            } else {
                projectIdx = toIdx;
                opacity = (slot.t - 0.5) / 0.5;
            }
        }

        if (projectIdx >= 0) {
            this.panels.setActive(projectIdx);
            this.panels.setOpacity(opacity * 0.85);   // sit slightly behind text
        } else {
            this.panels.setOpacity(0);
        }

        if (this.labels) {
            if (projectIdx >= 0) {
                this.labels.setActive(projectIdx);
                this.labels.setOpacity(opacity);
            } else {
                this.labels.setOpacity(0);
            }
        }
    }

    _driveAccent(slot) {
        let activeName;
        if (slot.phase === 'hold') {
            activeName = slot.formation;
        } else {
            activeName = slot.t < 0.5 ? slot.from : slot.to;
        }

        if (activeName === this._lastAccentName) return;
        this._lastAccentName = activeName;

        const hex = ACCENT_COLORS[activeName] ?? ACCENT_COLORS.neutral;

        if (this.core && typeof this.core.setAccentColor === 'function') {
            this.core.setAccentColor(hex);
        }
        if (this.panels && typeof this.panels.setAccentColor === 'function') {
            this.panels.setAccentColor(hex);
        }
        if (this.camera && typeof this.camera.shakeImpulse === 'function' && activeName !== 'neutral') {
            this.camera.shakeImpulse(0.14);
        }
    }

    _driveCamera(p) {
        let name = 'hero';
        if (p < 0.10)      name = 'hero';
        else if (p < 0.44) name = 'about';
        else if (p < 0.54) name = 'aaup';
        else if (p < 0.61) name = 'construction';
        else if (p < 0.68) name = 'rlscientist';
        else if (p < 0.75) name = 'listinglab';
        else if (p < 0.85) name = 'aimaze';
        else               name = 'contact';

        const track = this.cameraTracks[name];
        this.camera.setTrack(
            { x: track.pos[0],  y: track.pos[1],  z: track.pos[2] },
            { x: track.look[0], y: track.look[1], z: track.look[2] },
            track.focus
        );
    }
}