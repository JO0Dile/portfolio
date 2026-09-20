/* ============================================================
   World.js — background, atmosphere, grid, shadow, core, structure
   Hive is disabled. Structure replaces it.
   ============================================================ */

import { Atmosphere }     from './Atmosphere.js';
import { Background }     from './Background.js';
import { Core }           from './Core.js';
import { FloorGrid }      from './FloorGrid.js';
import { ShadowPool }     from './ShadowPool.js';
import { WorldStructure } from './WorldStructure.js';

export class World {
    constructor(scene, quality, cameraDirector) {
        this.scene = scene;

        this.background = new Background(scene);
        this.atmosphere = new Atmosphere(scene);
        this.floorGrid  = new FloorGrid(scene);
        this.shadowPool = new ShadowPool(scene);

        this.core = new Core(scene);
        this.structure = new WorldStructure(scene, cameraDirector);

        // Expose globally so SceneDirector can call setPose
        window.__worldStructure = this.structure;
    }

    update(dt) {
        this.background.update(dt);
        this.atmosphere.update(dt);
        this.floorGrid.update(dt);
        this.shadowPool.update(dt);
        this.core.update(dt);
        this.structure.update(dt);
    }
}