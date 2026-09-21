/* ============================================================
   scene.js — entry point
   ============================================================ */
import * as THREE from 'three';

import { AaupsNarrative } from './scene/projects/AaupsNarrative.js';
import { SceneManager }         from './scene/core/SceneManager.js';
import { Lighting }             from './scene/core/Lighting.js';
import { PostProcessing }       from './scene/core/PostProcessing.js';
import { CameraDirector }       from './scene/camera/CameraDirector.js';
import { QualityManager }       from './scene/performance/QualityManager.js';
import { HandCursor }           from './scene/projects/HandCursor.js';
import { getHandTarget, CANVAS_W, CANVAS_H, PANEL_W, PANEL_H } from './scene/projects/ProjectPanels.js';
import { World }                from './scene/world/World.js';
import { ProjectPanels }        from './scene/projects/ProjectPanels.js';
import { SectionLabels }        from './scene/projects/SectionLabels.js';
import { ParticleSystem }       from './scene/systems/ParticleSystem.js';
import { InteractionSystem }    from './scene/systems/InteractionSystem.js';
import { SceneDirector }        from './scene/director/SceneDirector.js';

class PortfolioScene {
    constructor(canvas) {
        this.manager = new SceneManager(canvas);
        this.quality = new QualityManager(this.manager.renderer);
        this.quality.applyPixelRatio();     // before the first frame, not after

        this.lighting  = new Lighting(this.manager.scene);

        this.cameraDirector = new CameraDirector(this.manager.camera);

        this.world     = new World(this.manager.scene, this.quality, this.cameraDirector);
        this.particles = new ParticleSystem(this.manager.scene, this.quality);

        // Was constructed without quality, which pinned the canvas
        // repaints at 24fps on every device. Repainting and re-uploading
        // a 1280x800 canvas 24 times a second is the single most
        // expensive thing this scene does on a phone.
        this.panels = new ProjectPanels(this.manager.scene, this.quality);
        this.handCursor = new HandCursor();
        this.aaupsNarrative = null; // created once panels exist
        this.handPos = new THREE.Vector3();
        this._handAttachedIndex = -1;
        this.labels = new SectionLabels(this.manager.scene);

        // Expose to SceneDirector for accent color syncing
        window.__handCursor = this.handCursor;
                // Build the narrative attached to the AAUP panel
        const aaupPanel = this.panels.panels.find(p => p.key === 'aaup');
        if (aaupPanel) {
            this.aaupsNarrative = new AaupsNarrative(aaupPanel.group);
        }
        this.director = new SceneDirector(
            this.world,
            null,
            this.cameraDirector,
            this.panels,
            this.labels
        );

        this.interaction = new InteractionSystem({
            cameraDirector: this.cameraDirector,
            reveal:         null
        });

        // Same pattern as __handCursor / __panelRig above.
        window.__interaction = this.interaction;

        /* The composer runs everywhere, phone included. Its final pass
           is not an effect you can drop: it carries the vignette, the
           grain and the floor clamp that the whole scene is graded
           against. Skipping it on mobile rendered the frame ungraded
           and every accent came out wrong. */
        try {
            this.post = new PostProcessing(this.manager, this.quality);
        } catch (err) {
            console.warn('post-processing unavailable:', err);
            this.post = null;
        }

        this.clock = new THREE.Clock();
        this.elapsed = 0;
        this._animate = this._animate.bind(this);
        requestAnimationFrame(this._animate);

        console.log('scene — ready');
    }

    _animate() {
        const dt = Math.min(this.clock.getDelta(), 0.05);
        this.elapsed += dt;

        this.interaction.update(dt);
        this.cameraDirector.update(dt);
        this.director.update(dt, this.interaction.scrollSmooth, this.elapsed);

        this.panels.update(dt, this.manager.camera, this.elapsed);
        this._updateHandCursor(dt);
        this._updateNarrative(dt);
        this.labels.update(dt, this.manager.camera, this.elapsed);
        this.world.update(dt);
        this.particles.update(dt);
        this.lighting.update(dt);
        this.quality.update(dt);

        if (this.post) {
            this.post.setFocus(this.cameraDirector.focusDistance);
            this.post.render();
        } else {
            this.manager.renderer.render(this.manager.scene, this.manager.camera);
        }

        requestAnimationFrame(this._animate);
    }
    _updateNarrative(dt) {
        if (!this.aaupsNarrative) return;
        if (!this.panels) return;

        const active = this.panels.panels[this.panels.index];
        const isAaup = active && active.key === 'aaup' && this.panels.opacity > 0.5;

        if (isAaup) {
            this.handCursor.setVisible(false);
            if (!this.aaupsNarrative.started) {
                this.aaupsNarrative.start();
            }
        } else if (this.aaupsNarrative.started) {
            this.aaupsNarrative.stop();
        }

        this.aaupsNarrative.update(dt, this.manager.camera);
    }
    _updateHandCursor(dt) {
        // If nothing visible, hide
        if (!this.panels || this.panels.index < 0 || this.panels.opacity < 0.5) {
            this.handCursor.setVisible(false);
            return;
        }

        const activePanel = this.panels.panels[this.panels.index];
        if (!activePanel) {
            this.handCursor.setVisible(false);
            return;
        }

        // Skip on AAUP — the narrative owns that panel
        if (activePanel.key === 'aaup') {
            this.handCursor.setVisible(false);
            return;
        }

        // Attach the hand to the active panel the first time we see it
        if (this._handAttachedIndex !== this.panels.index) {
            this.handCursor.attachToPanel(activePanel);
            this._handAttachedIndex = this.panels.index;
            this.handPos.set(0, 6, 0.6);
        }

        const target = getHandTarget();
        if (!target.visible) {
            this.handCursor.setVisible(false);
            return;
        }

        const u = target.x / CANVAS_W;
        const v = target.y / CANVAS_H;
        const lx = (u - 0.5) * PANEL_W;
        const ly = -(v - 0.5) * PANEL_H;
        const lz = 0.4;

        const k = 1 - Math.exp(-dt * 3);
        this.handPos.x += (lx - this.handPos.x) * k;
        this.handPos.y += (ly - this.handPos.y) * k;
        this.handPos.z += (lz - this.handPos.z) * k;

        this.handCursor.setPosition(this.handPos.x, this.handPos.y, this.handPos.z);
        this.handCursor.setPress(target.press);
        this.handCursor.setVisible(true);
        this.handCursor.update(dt);
    }
}

function initScene() {
    const canvas = document.getElementById('scene');
    if (!canvas) {
        console.warn('[scene] #scene canvas not found');
        return;
    }
    try {
        new PortfolioScene(canvas);
    } catch (err) {
        console.error('[scene] constructor failed:', err);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScene);
} else {
    initScene();
}