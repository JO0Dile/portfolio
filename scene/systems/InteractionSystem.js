/* ============================================================
   scene/systems/InteractionSystem.js
   Feeds mouse → CameraDirector, scroll → RevealSystem
   ============================================================ */

export class InteractionSystem {
    constructor({ cameraDirector, reveal }) {
        this.cameraDirector = cameraDirector;
        this.reveal         = reveal;

        this.mouse       = { x: 0, y: 0 };
        this.targetMouse = { x: 0, y: 0 };

        this.scrollTarget = 0;
        this.scrollSmooth = 0;

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