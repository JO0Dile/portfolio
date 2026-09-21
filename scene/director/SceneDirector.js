/* ============================================================
   SceneDirector.js — scroll position → scene state
   Drives panel, label, camera, and rig pose.
   ============================================================ */

import { FormationRegistry, FORMATION_NAMES } from '../formations/FormationRegistry.js';

/* Slot order must match .stage-slot document order. */
const SLOTS = [
    { formation: 'about',        accent: 0x4d8bf5 },
    { formation: 'aaup',         accent: 0x4d8bf5 },
    { formation: 'construction', accent: 0xff8a5c },
    { formation: 'rlscientist',  accent: 0x3fca7d },
    { formation: 'listinglab',   accent: 0xb07cff },
    { formation: 'aimaze',       accent: 0xffbe5c },
    { formation: 'languages',    accent: 0x4d8bf5 },
    { formation: 'frameworks',   accent: 0xff8a5c },
    { formation: 'aidata',       accent: 0x3fca7d },
    { formation: 'other',        accent: 0xb07cff }
];

const NEUTRAL_ACCENT = 0x4d8bf5;

const HOLD_BAND = 0.32;

/* How long the ending takes to play once you have arrived at contact.
   It is a timer rather than a scroll range because there is less than
   one screen of page left after the last project — scrubbing it by the
   wheel would flash the whole thing past in a flick. */
const FAREWELL_SECONDS = 12.0;

const POSE_SLOT    = { pos: [0, 5.0, 14.2], look: [0, 4.9, 0], focus: 11.5 };
const POSE_NEUTRAL = { pos: [0, 4.4, 22.0], look: [0, 4.2, 0], focus: 21.0 };

function smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / Math.max(1e-6, edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

export class SceneDirector {
    constructor(world, _unused, cameraDirector, panels, labels) {
        this.world  = world;
        this.camera = cameraDirector;
        this.panels = panels;
        this.labels = labels;
        this._fwT   = 0;

        // The rig carries the panel, so it needs to reach it.
        if (world.rig && world.rig.attachPanels) world.rig.attachPanels(panels);

        this.core = world.core;

        this.hive = world.hive || null;

        if (this.hive) {
            this.registry = new FormationRegistry(this.hive.count);
            FORMATION_NAMES.forEach(name => {
                const f = this.registry.get(name);
                if (f) this.hive.registerFormation(name, f);
            });
            this._lastCount = this.hive.count;
        }

        this._lastAccent = null;
        this._lastPoseName = null;
        this._lastTo = undefined;

        this.anchors = [];
        this.nodes = [];
        this._lastDocHeight = 0;
        this._measureTick = 0;

        this.measure();
        window.addEventListener('load',   () => this.measure());
        window.addEventListener('resize', () => this.measure());
    }

    // ── MEASURE ──
    measure() {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        this._lastDocHeight = doc.scrollHeight;

        if (max <= 0) { this.anchors = []; this.nodes = []; return; }

        const vh = window.innerHeight;
        const els = document.querySelectorAll('.stage-slot');

        this.anchors = [];
        for (let i = 0; i < els.length && i < SLOTS.length; i++) {
            const el = els[i];
            const top = el.getBoundingClientRect().top + window.scrollY;
            const centre = top + el.offsetHeight / 2 - vh / 2;
            this.anchors.push(Math.min(1, Math.max(0, centre / max)));
        }

        if (!this.anchors.length) { this.nodes = []; return; }

        const n = this.anchors.length;
        const gap = n > 1 ? (this.anchors[n - 1] - this.anchors[0]) / (n - 1) : 0.12;

        this.nodes = [
            { formation: 'neutral', panel: -1, accent: NEUTRAL_ACCENT,
              at: this.anchors[0] - gap * 0.85 }
        ];
        for (let i = 0; i < n; i++) {
            this.nodes.push({
                formation: SLOTS[i].formation,
                panel: i,
                accent: SLOTS[i].accent,
                at: this.anchors[i]
            });
        }
        this.nodes.push({
            formation: 'contact', panel: -1, accent: NEUTRAL_ACCENT,
            at: this.anchors[n - 1] + gap * 0.85
        });
    }

    // ── RESOLVE ──
    _resolve(p) {
        const N = this.nodes;
        if (N.length < 2) {
            return {
                from: 'neutral', to: 'neutral', t: 1,
                panel: -1, panelOpacity: 0, accent: NEUTRAL_ACCENT, stage: 0,
                slot: -1, pose: 'neutral', transit: 0, transitDir: 1
            };
        }

        const first = N[0].at;
        const last  = N[N.length - 1].at;

        // Before the staged region → neutral
        if (p <= first) {
            return {
                from: 'neutral', to: 'neutral', t: 1,
                panel: -1, panelOpacity: 0, accent: NEUTRAL_ACCENT, stage: 0,
                slot: -1, pose: 'neutral', transit: 0, transitDir: 1
            };
        }

        // After the staged region → contact
        // Note: with the current page this branch does not run — the
        // contact node lands just past scroll 1.0, so contact is reached
        // through the last segment below instead. Kept correct for a
        // longer page.
        if (p >= last) {
            return {
                from: 'contact', to: 'contact', t: 1,
                panel: -1, panelOpacity: 0, accent: NEUTRAL_ACCENT, stage: 0,
                slot: -1, pose: 'contact', transit: 0, transitDir: 1
            };
        }

        let i = 0;
        for (let k = 0; k < N.length - 1; k++) {
            if (p >= N[k].at && p <= N[k + 1].at) { i = k; break; }
        }

        const a = N[i], b = N[i + 1];
        const u = (p - a.at) / Math.max(1e-6, b.at - a.at);

        const t = smoothstep(HOLD_BAND, 1 - HOLD_BAND, u);

        const nearIsB = u >= 0.5;
        const near = nearIsB ? b : a;
        const d = nearIsB ? (1 - u) : u;
        const closeness = 1 - smoothstep(0.16, 0.40, d);

        return {
            from: a.formation,
            to: b.formation,
            t,
            panel: near.panel,
            panelOpacity: near.panel < 0 ? 0 : closeness,
            accent: near.accent,
            stage: near.panel < 0 ? 0 : (1 - smoothstep(0.06, 0.46, d)),
            slot: near.panel,
            pose: near.formation,
            // 0 parked on a slot, 1 at the midpoint between two.
            transit: 1 - closeness,
            // First half carries the old panel out one way, second half
            // brings the new one in from the other. The swap happens at
            // the midpoint, where opacity is already zero.
            transitDir: nearIsB ? 1 : -1
        };
    }

    // ── UPDATE ──
    update(dt, scrollProgress, elapsed) {
        if (this.hive && this.hive.count !== this._lastCount) {
            this.registry.rebuild(this.hive.count);
            FORMATION_NAMES.forEach(name => {
                const f = this.registry.get(name);
                if (f) this.hive.registerFormation(name, f);
            });
            this._lastCount = this.hive.count;
        }

        this._measureTick += dt;
        if (this._measureTick > 0.5) {
            this._measureTick = 0;
            if (document.documentElement.scrollHeight !== this._lastDocHeight) {
                this.measure();
            }
        }

        const s = this._resolve(scrollProgress);

        if (this.hive && typeof this.hive.setTransition === 'function') {
            this.hive.setTransition(s.from, s.to, s.t);
        }

        if (s.panel >= 0) {
            this.panels.setActive(s.panel);
            this.panels.setOpacity(s.panelOpacity);
            if (this.labels) {
                this.labels.setActive(s.panel);
                this.labels.setOpacity(s.panelOpacity);
            }
        } else {
            this.panels.setOpacity(0);
            if (this.labels) this.labels.setOpacity(0);
        }

        // ── Accent color ──
        if (s.accent !== this._lastAccent) {
            this._lastAccent = s.accent;
            if (this.core && this.core.setAccentColor) this.core.setAccentColor(s.accent);
            if (this.panels && this.panels.setAccentColor) this.panels.setAccentColor(s.accent);
            if (this.world.rig)      this.world.rig.setAccentColor(s.accent);
            if (this.world.fieldSky) this.world.fieldSky.setAccentColor(s.accent);
            if (this.world.wetFloor) this.world.wetFloor.setAccentColor(s.accent);
        }

        // ── Rig pose ──
        // s.pose is 'neutral' before the staged region,
        // 'contact' after it, or the current slot's formation inside it.
        if (s.pose !== this._lastPoseName) {
            this._lastPoseName = s.pose;
            if (this.world.rig) this.world.rig.setPose(s.pose);
        }

        if (this.world.rig && this.world.rig.setTransit) {
            this.world.rig.setTransit(s.transit, s.transitDir);
        }

        // ── The ending ──
        // Runs itself once you have settled on contact, and rewinds a bit
        // over twice as fast if you scroll back up, so leaving and
        // returning does not strand the drones halfway to the horizon.
        const arrived = s.pose === 'contact' && s.t >= 0.85;
        this._fwT = Math.max(0, Math.min(1, this._fwT + (arrived
            ? dt / FAREWELL_SECONDS
            : -dt / (FAREWELL_SECONDS * 0.45))));

        if (this.world.rig && this.world.rig.setFarewell) {
            this.world.rig.setFarewell(this._fwT);
        }

        // ── Camera shake on slot change ──
        if (s.to !== this._lastTo && s.t > 0.03) {
            if (this._lastTo !== undefined) {
                if (this.camera.shakeImpulse) this.camera.shakeImpulse(0.12);
                // Core.whump() has existed since the start and never fired:
                // its only caller was Hive, which is dead. Every delivery
                // now sets off the ring and the flare.
                if (this.core && this.core.whump) this.core.whump();
            }
            this._lastTo = s.to;
        }

        this._driveCamera(s);
    }

    _driveCamera(s) {
        const k = s.stage;
        const P = POSE_SLOT, Q = POSE_NEUTRAL;

        const sway = s.slot >= 0 ? Math.sin(s.slot * 1.71) * 1.25 : 0;

        const px = (Q.pos[0] + (P.pos[0] - Q.pos[0]) * k) + sway * k;
        const py =  Q.pos[1] + (P.pos[1] - Q.pos[1]) * k;
        const pz =  Q.pos[2] + (P.pos[2] - Q.pos[2]) * k;

        const lx = Q.look[0] + (P.look[0] - Q.look[0]) * k + sway * k * 0.35;
        const ly = Q.look[1] + (P.look[1] - Q.look[1]) * k;
        const lz = Q.look[2] + (P.look[2] - Q.look[2]) * k;

        const focus = Q.focus + (P.focus - Q.focus) * k;

        this.camera.setTrack({ x: px, y: py, z: pz }, { x: lx, y: ly, z: lz }, focus);
    }
}