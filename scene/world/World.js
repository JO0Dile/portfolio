/* ============================================================
   World.js — background, atmosphere, field, water, core, rig
   ------------------------------------------------------------
   Hive is disabled. WorldStructure is retired: PanelRig holds the
   panels now, FieldSky is the sky and WetFloor is the floor.
   ============================================================ */

import { Atmosphere } from './Atmosphere.js';
import { Background } from './Background.js';
import { Core }       from './Core.js';
import { WetFloor }   from './WetFloor.js';
import { FieldSky }   from './FieldSky.js';
import { PanelRig }   from './PanelRig.js';

export class World {
    constructor(scene, quality, cameraDirector) {
        this.scene = scene;

        this.background = new Background(scene);
        this.atmosphere = new Atmosphere(scene);

        // Sky and floor
        this.fieldSky = new FieldSky(scene, quality);
        this.wetFloor = new WetFloor(scene, quality);

        this.core = new Core(scene);

        // The thing that holds the screens
        this.rig = new PanelRig(scene, cameraDirector, quality);

        // SceneDirector reaches for these by name
        window.__panelRig = this.rig;
    }

    update(dt) {
        this.background.update(dt);
        this.atmosphere.update(dt);
        this.fieldSky.update(dt);
        this.wetFloor.update(dt);
        this.core.update(dt);
        this.rig.update(dt);
    }
}
