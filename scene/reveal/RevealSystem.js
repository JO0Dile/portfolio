import { AssemblyController } from './AssemblyController.js';

export class RevealSystem {
    constructor(world) {
        this.world        = world;
        this.architecture = world.architecture;

        this.assembly = new AssemblyController();

        // Smoothing state — the two values the outside world can query
        this.targetProgress  = 0;
        this.currentProgress = 0;

        // Project modules register here later (each holds its own
        // ComponentRegistry and can be shown/hidden by project index)
        this.modules = [];

        // Cache last-known values to avoid redundant writes
        this._lastRevealAmount = -1;
        this._lastStage        = null;
        this._lastProjectIdx   = null;
    }

    // ---------- Public API ----------

    // Called by InteractionSystem every frame with the raw 0..1 scroll
    setProgress(p) {
        this.targetProgress = Math.max(0, Math.min(1, p));
    }

    // Register a project module (must implement setProgress(p) and setVisible(b))
    registerModule(module) {
        this.modules.push(module);
    }

    getStage() {
        return this.assembly.getStage(this.currentProgress);
    }

    getProgress() {
        return this.currentProgress;
    }

    getRevealAmount() {
        return this._lastRevealAmount;
    }

    // ---------- Update ----------

    update(dt) {
        // Exponential smoothing toward target. Time-based so it's
        // framerate-independent. dt*3 ≈ reaching ~95% in half a second.
        const lerp = 1 - Math.exp(-dt * 3.0);
        this.currentProgress += (this.targetProgress - this.currentProgress) * lerp;

        // 1) Reveal amount for the architecture
        const revealAmount = this.assembly.getRevealAmount(this.currentProgress);
        if (Math.abs(revealAmount - this._lastRevealAmount) > 0.0005) {
            this.architecture.setReveal(revealAmount);
            this._lastRevealAmount = revealAmount;
        }

        // 2) Stage dispatch — logged only on change
        const stage = this.assembly.getStage(this.currentProgress);
        if (stage !== this._lastStage) {
            this._lastStage = stage;
            document.documentElement.setAttribute('data-scene-stage', stage);
        }

        // 3) Project module dispatch
        const active = this.assembly.getActiveProject(this.currentProgress);
        const activeIdx = active ? active.index : null;

        if (activeIdx !== this._lastProjectIdx) {
            // A different project is now in the spotlight
            this.modules.forEach((m, i) => {
                if (typeof m.setVisible === 'function') {
                    m.setVisible(i === activeIdx);
                }
            });
            this._lastProjectIdx = activeIdx;
        }

        // Sub-progress within the active project slot
        const subP = active ? active.sub : 0;
        this.modules.forEach((m, i) => {
            if (typeof m.setProgress === 'function') {
                m.setProgress(i === activeIdx ? subP : 0);
            }
        });
    }
}