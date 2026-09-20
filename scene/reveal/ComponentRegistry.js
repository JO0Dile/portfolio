import * as THREE from 'three';

export class ComponentRegistry {
    constructor() {
        this.components = [];
    }

    // Register a mesh. `openPos` and `openRot` are the target transforms
    // at full reveal. `delay` (0..1) offsets when this mesh starts moving.
    register(mesh, openPos, openRot = null, delay = 0) {
        const entry = {
            mesh,
            closedPos: mesh.position.clone(),
            closedRot: mesh.rotation.clone(),
            openPos:   openPos.clone(),
            openRot:   openRot
                ? new THREE.Euler(openRot.x, openRot.y, openRot.z)
                : mesh.rotation.clone(),
            delay: Math.max(0, Math.min(0.95, delay))
        };
        this.components.push(entry);
        return entry;
    }

    // Apply a global progress value 0..1 to every registered component
    applyProgress(p) {
        const clamped = Math.max(0, Math.min(1, p));

        for (const c of this.components) {
            // Per-component local progress (with delay offset)
            let t = c.delay === 0
                ? clamped
                : Math.max(0, Math.min(1, (clamped - c.delay) / (1 - c.delay)));

            // Smoothstep — but only interpolate, never hold
            t = t * t * (3 - 2 * t);

            // Position
            c.mesh.position.lerpVectors(c.closedPos, c.openPos, t);

            // Rotation
            c.mesh.rotation.x = c.closedRot.x + (c.openRot.x - c.closedRot.x) * t;
            c.mesh.rotation.y = c.closedRot.y + (c.openRot.y - c.closedRot.y) * t;
            c.mesh.rotation.z = c.closedRot.z + (c.openRot.z - c.closedRot.z) * t;
        }
    }

    clear() {
        this.components.length = 0;
    }

    get count() {
        return this.components.length;
    }
}