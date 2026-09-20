/* ============================================================
   HandCursor.js — wrapper around Drone for the single-drone case
   ============================================================ */

import { Drone } from './Drone.js';

export class HandCursor {
    constructor() {
        this.drone = new Drone({ color: 0x4d8bf5, scale: 1.0 });
        this.group = this.drone.group;
        this._currentPanel = null;
    }

    attachToPanel(panel) {
        if (this._currentPanel === panel) return;
        if (this._currentPanel) this._currentPanel.group.remove(this.group);
        panel.group.add(this.group);
        this._currentPanel = panel;
    }

    setPosition(x, y, z) { this.drone.setPosition(x, y, z); }
    setPress(p) { this.drone.setPress(p); }
    setVisible(v) { this.drone.setVisible(v); }
    setAccentColor(hex) { this.drone.setColor(hex); }
    update(dt) { this.drone.update(dt); }
}