import * as THREE from 'three';

export class Lighting {
    constructor(scene) {
        this.scene = scene;
        this.elapsed = 0;

        // Ambient — enough to see shapes, not so much that it looks flat
        this.ambient = new THREE.AmbientLight(0x3a4560, 0.75);
        scene.add(this.ambient);

        // Key light — the sun
        this.key = new THREE.DirectionalLight(0xdce8ff, 1.4);
        this.key.position.set(-14, 22, 12);
        scene.add(this.key);

        // Front fill — lights fragments from the camera side
        this.front = new THREE.DirectionalLight(0xa8c0e8, 0.9);
        this.front.position.set(0, 6, 20);
        scene.add(this.front);

        // Rim light behind — separates from background
        this.rim = new THREE.PointLight(0xff8a5c, 2.4, 70, 2);
        this.rim.position.set(0, 10, -16);
        scene.add(this.rim);

        // Accent — orbiting, the moving highlight
        this.accent = new THREE.PointLight(0x4d8bf5, 3.2, 40, 2);
        this.accent.position.set(7, 4, 7);
        scene.add(this.accent);

        // Bottom fill — subtle up-light so undersides aren't black
        this.fill = new THREE.PointLight(0x3a5f9a, 1.2, 45, 2);
        this.fill.position.set(0, -18, 6);
        scene.add(this.fill);
    }

    update(dt) {
        this.elapsed += dt;

        const a = this.elapsed * 0.10;
        this.accent.position.x = Math.cos(a) * 8;
        this.accent.position.z = Math.sin(a) * 8;
        this.accent.position.y = 3.5 + Math.sin(this.elapsed * 0.4) * 1.4;

        this.rim.intensity = 2.1 + Math.sin(this.elapsed * 0.42) * 0.35;
    }
}