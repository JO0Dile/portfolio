export class AssemblyController {
    constructor() {
        // Named stages — lets other systems (camera, HUD) query which phase we're in
        this.stages = [
            { name: 'hero',        start: 0.00, end: 0.15 },
            { name: 'approach',    start: 0.15, end: 0.30 },
            { name: 'disassembly', start: 0.30, end: 0.52 },
            { name: 'projects',    start: 0.52, end: 0.86 },
            { name: 'reassembly',  start: 0.86, end: 1.00 }
        ];

        // Reveal curve — keyframes for the disassembly amount over scroll
        // 0 = fully closed, 1 = fully exploded
        this.revealCurve = [
            { at: 0.00, value: 0.00 },  // hero — closed
            { at: 0.15, value: 0.00 },  // still closed during first approach
            { at: 0.30, value: 0.20 },  // shell just beginning to separate
            { at: 0.52, value: 1.00 },  // fully exploded — projects visible
            { at: 0.86, value: 1.00 },  // still open through all projects
            { at: 1.00, value: 0.00 }   // fully reassembled
        ];

        // Project display window (fraction of overall scroll)
        this.projectRange = { start: 0.52, end: 0.86 };
        this.projectCount = 5;
    }

    // ---------- Public API ----------

    getRevealAmount(p) {
        return this._sample(this.revealCurve, p);
    }

    getStage(p) {
        for (const s of this.stages) {
            if (p >= s.start && p <= s.end) return s.name;
        }
        return p < this.stages[0].start
            ? this.stages[0].name
            : this.stages[this.stages.length - 1].name;
    }

    // Returns 0..4 (project index) or null if outside the project window.
    // `sub` is the 0..1 progress within the project's own slot.
    getActiveProject(p) {
        const { start, end } = this.projectRange;
        if (p < start || p > end) return null;

        const slot = (p - start) / (end - start); // 0..1
        const scaled = slot * this.projectCount;
        const idx = Math.min(this.projectCount - 1, Math.floor(scaled));
        const sub = scaled - idx;
        return { index: idx, sub };
    }

    // ---------- Internals ----------

    _sample(curve, p) {
        p = Math.max(0, Math.min(1, p));

        if (p <= curve[0].at) return curve[0].value;
        if (p >= curve[curve.length - 1].at) return curve[curve.length - 1].value;

        for (let i = 0; i < curve.length - 1; i++) {
            const a = curve[i];
            const b = curve[i + 1];
            if (p >= a.at && p <= b.at) {
                const t = (p - a.at) / (b.at - a.at);
                const st = t * t * (3 - 2 * t); // smoothstep
                return a.value + (b.value - a.value) * st;
            }
        }
        return 0;
    }
}