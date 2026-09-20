/* ============================================================
   SceneDirector.js — scroll position → scene state
   Drives panel, label, camera, and WorldStructure pose.
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
                slot: -1, pose: 'neutral'
            };
        }

        const first = N[0].at;
        const last  = N[N.length - 1].at;

        // Before the staged region → neutral
        if (p <= first) {
            return {
                from: 'neutral', to: 'neutral', t: 1,
                panel: -1, panelOpacity: 0, accent: NEUTRAL_ACCENT, stage: 0,
                slot: -1, pose: 'neutral'
            };
        }

        // After the staged region → contact
        if (p >= last) {
            return {
                from: 'contact', to: 'contact', t: 1,
                panel: -1, panelOpacity: 0, accent: NEUTRAL_ACCENT, stage: 0,
                slot: -1, pose: 'contact'
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
            pose: near.formation
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
            if (window.__worldStructure) {
                window.__worldStructure.setAccentColor(s.accent);
            }
        }

        // ── WorldStructure pose ──
        // s.pose is 'neutral' before the staged region,
        // 'contact' after it, or the current slot's formation inside it.
        if (s.pose !== this._lastPoseName) {
            this._lastPoseName = s.pose;
            if (window.__worldStructure) {
                window.__worldStructure.setPose(s.pose);
            }
        }

        // ── Camera shake on slot change ──
        if (s.to !== this._lastTo && s.t > 0.03) {
            if (this._lastTo !== undefined && this.camera.shakeImpulse) {
                this.camera.shakeImpulse(0.12);
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