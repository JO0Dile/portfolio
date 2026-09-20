export class QualityManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.listeners = [];

        this.level = 'high';
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

    _apply(level) {
        if (level === this.level) return;
        this.level = level;

        const dpr = window.devicePixelRatio || 1;
        if (level === 'high') {
            this.renderer.setPixelRatio(Math.min(dpr, 2));
        } else if (level === 'medium') {
            this.renderer.setPixelRatio(Math.min(dpr, 1.25));
        } else {
            this.renderer.setPixelRatio(1);
        }

        console.log('[quality] →', level);
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
            if (this.level === 'low') this._apply('medium');
            else if (this.level === 'medium' && fps > this.hiThreshold + 12) this._apply('high');
            this.goodStreak = 0;
        }
    }
}