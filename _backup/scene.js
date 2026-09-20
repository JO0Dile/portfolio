/* ============================================================
   scene.js — entry point
   ============================================================ */
import * as THREE from 'three';

import { SceneManager }         from './scene/core/SceneManager.js';
import { Lighting }             from './scene/core/Lighting.js';
import { PostProcessing }       from './scene/core/PostProcessing.js';
import { CameraDirector }       from './scene/camera/CameraDirector.js';
import { QualityManager }       from './scene/performance/QualityManager.js';

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

        this.lighting  = new Lighting(this.manager.scene);
        this.world     = new World(this.manager.scene, this.quality);
        this.particles = new ParticleSystem(this.manager.scene, this.quality);

        this.cameraDirector = new CameraDirector(this.manager.camera);

        this.panels = new ProjectPanels(this.manager.scene);
        this.labels = new SectionLabels(this.manager.scene);

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