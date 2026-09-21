/* ============================================================
   scene/systems/InteractionSystem.js
   Feeds mouse → CameraDirector, scroll → RevealSystem,
   and on a phone, a sideways flick → the next section.
   ============================================================ */

import { IS_MOBILE } from '../performance/device.js';

export class InteractionSystem {
    constructor({ cameraDirector, reveal }) {
        this.cameraDirector = cameraDirector;
        this.reveal         = reveal;

        this.mouse       = { x: 0, y: 0 };
        this.targetMouse = { x: 0, y: 0 };

        this.scrollTarget = 0;
        this.scrollSmooth = 0;
        this._glideId = 0;

        this._bind();
        this._measureScroll();
    }

    _bind() {
        window.addEventListener('mousemove', (e) => {
            this.targetMouse.x = (e.clientX / window.innerWidth)  * 2 - 1;
            this.targetMouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (!e.touches.length) return;
            const t = e.touches[0];
            this.targetMouse.x = (t.clientX / window.innerWidth)  * 2 - 1;
            this.targetMouse.y = -((t.clientY / window.innerHeight) * 2 - 1);
        }, { passive: true });

        window.addEventListener('scroll', () => this._measureScroll(), { passive: true });
        window.addEventListener('resize', () => this._measureScroll());

        if (IS_MOBILE) this._bindSwipe();
    }

    /* Flick left for the next section, right for the previous one.
       Every listener is passive and nothing acts until touchend, so
       ordinary vertical scrolling is never blocked or slowed -- a
       gesture has to be clearly sideways and quick before it counts. */
    _bindSwipe() {
        let sx = 0, sy = 0, st = 0, tracking = false;

        window.addEventListener('touchstart', (e) => {
            tracking = e.touches.length === 1;      // never fight a pinch
            if (!tracking) return;
            sx = e.touches[0].clientX;
            sy = e.touches[0].clientY;
            st = performance.now();
        }, { passive: true });

        window.addEventListener('touchend', (e) => {
            if (!tracking) return;
            tracking = false;

            const t = e.changedTouches && e.changedTouches[0];
            if (!t) return;

            const dx = t.clientX - sx;
            const dy = t.clientY - sy;

            if (performance.now() - st > 700) return;        // a drag, not a flick
            if (Math.abs(dx) < 55) return;                   // too small to mean it
            if (Math.abs(dx) < Math.abs(dy) * 1.6) return;   // that was a scroll

            this._stepSection(dx < 0 ? 1 : -1);
        }, { passive: true });
    }

    /* Where a flick can land: the top, each slot's centre, the bottom. */
    _sectionStops() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max <= 0) return [];

        const slots = [...document.querySelectorAll('.stage-slot')];
        const mid = slots.map(el =>
            Math.round(el.getBoundingClientRect().top + window.scrollY
                       + el.offsetHeight / 2 - window.innerHeight / 2));

        return [0, ...mid, max]
            .map(v => Math.max(0, Math.min(max, v)))
            .filter((v, i, a) => i === 0 || v - a[i - 1] > 8);
    }

    _stepSection(dir) {
        const stops = this._sectionStops();
        if (stops.length < 2) return;

        const y = window.scrollY;
        let at = 0, best = Infinity;
        for (let i = 0; i < stops.length; i++) {
            const d = Math.abs(stops[i] - y);
            if (d < best) { best = d; at = i; }
        }

        const next = Math.max(0, Math.min(stops.length - 1, at + dir));
        if (next === at) return;

        this._glideTo(stops[next]);
    }

    /* Driven here rather than handed to behavior: 'smooth'.

       Browser smooth scrolling is animated by the frame loop and is a
       silent no-op wherever that loop is not running or the user has
       reduced motion on -- a navigation gesture that sometimes does
       nothing at all is worse than not having the gesture. Each step
       below is written with behavior 'instant' so the page's own
       CSS scroll-behavior: smooth does not fight this tween. */
    _glideTo(target) {
        const from = window.scrollY;
        const dist = target - from;
        if (Math.abs(dist) < 2) return;

        const dur = Math.min(900, 340 + Math.abs(dist) * 0.22);
        const t0 = performance.now();
        const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

        this._glideId++;
        const mine = this._glideId;

        const frame = (now) => {
            if (mine !== this._glideId) return;      // a newer flick won
            const u = Math.min(1, (now - t0) / dur);
            window.scrollTo({ top: Math.round(from + dist * ease(u)), behavior: 'instant' });
            if (u < 1) requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
    }

    _measureScroll() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        this.scrollTarget = max > 0
            ? Math.min(Math.max(window.scrollY / max, 0), 1)
            : 0;
    }
    
    update(dt) {
        const mSmooth = Math.min(1, dt * 6);
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * mSmooth;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * mSmooth;
        this.cameraDirector.setMouse(this.mouse.x, this.mouse.y);

        const sSmooth = Math.min(1, dt * 2.5);
        this.scrollSmooth += (this.scrollTarget - this.scrollSmooth) * sSmooth;

        // Reveal is optional — SceneDirector handles scroll now
        if (this.reveal && typeof this.reveal.setProgress === 'function') {
            this.reveal.setProgress(this.scrollSmooth);
        }
    }
}