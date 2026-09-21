import { IS_MOBILE } from './device.js';

const ORDER = ['low', 'medium', 'high'];

export class QualityManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.listeners = [];

        /* A phone starts at the bottom and is never allowed to climb to
           high. Starting at high and waiting for the sampler to notice
           meant roughly five seconds of visible jank on every load --
           warmup, then a sample window, then two bad streaks -- before
           it settled where it was always going to end up. */
        this.ceiling = IS_MOBILE ? 'medium' : 'high';
        this.level = IS_MOBILE ? 'medium' : 'high';
        this.frames = 0;
        this.accum = 0;
        this.sampleWindow = 1.0;
        this.warmup = 2.0;
        this.elapsed = 0;

        this.loThreshold = 38;
        this.hiThreshold = 55;

        this.badStreak = 0;
        this.goodStreak = 0;
    }

    register(cb) {
        this.listeners.push(cb);
        cb(this.level);
    }

    /* The pixel ratio for a level. Called once at startup too, so the
       first frame is already at the right resolution. */
    applyPixelRatio() {
        const dpr = window.devicePixelRatio || 1;
        if (this.level === 'high') {
            this.renderer.setPixelRatio(Math.min(dpr, 2));
        } else if (this.level === 'medium') {
            this.renderer.setPixelRatio(Math.min(dpr, IS_MOBILE ? 1 : 1.25));
        } else {
            this.renderer.setPixelRatio(IS_MOBILE ? 0.75 : 1);
        }
    }

    _apply(level) {
        if (ORDER.indexOf(level) > ORDER.indexOf(this.ceiling)) level = this.ceiling;
        if (level === this.level) return;
        this.level = level;

        this.applyPixelRatio();
        this.listeners.forEach(cb => cb(level));
    }

    update(dt) {
        this.elapsed += dt;
        this.frames++;
        this.accum += dt;

        if (this.elapsed < this.warmup) return;
        if (this.accum < this.sampleWindow) return;

        const fps = this.frames / this.accum;
        this.frames = 0;
        this.accum = 0;

        if (fps < this.loThreshold) {
            this.badStreak++;
            this.goodStreak = 0;
        } else if (fps > this.hiThreshold) {
            this.goodStreak++;
            this.badStreak = 0;
        } else {
            this.badStreak = 0;
            this.goodStreak = 0;
        }

        if (this.badStreak >= 2) {
            if (this.level === 'high') this._apply('medium');
            else if (this.level === 'medium') this._apply('low');
            this.badStreak = 0;
        }

        if (this.goodStreak >= 4) {
            if (this.level === 'low' && this.ceiling !== 'low') this._apply('medium');
            else if (this.level === 'medium' && this.ceiling === 'high' &&
                     fps > this.hiThreshold + 12) this._apply('high');
            this.goodStreak = 0;
        }
    }
}