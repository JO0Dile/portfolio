import * as THREE from 'three';

export class Background {
    constructor(scene) {
        this.scene = scene;
        this.elapsed = 0;

        this.layers = [];
        this._buildLayer(1800, 60, 180, 0.5, 0.14, 0x8a98b0, 0.004);
        this._buildLayer(500,  30, 80,  0.28, 0.32, 0xb8c2d4, -0.007);
    }

    _buildLayer(count, minR, maxR, size, opacity, hex, driftSpeed) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const base = new THREE.Color(hex);

        for (let i = 0; i < count; i++) {
            const r = minR + Math.random() * (maxR - minR);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.cos(phi);
            pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

            const j = 0.7 + Math.random() * 0.6;
            col[i * 3]     = base.r * j;
            col[i * 3 + 1] = base.g * j;
            col[i * 3 + 2] = base.b * j;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

        const mat = new THREE.PointsMaterial({
            size,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const points = new THREE.Points(geo, mat);
        this.scene.add(points);
        this.layers.push({ points, driftSpeed });
    }

    update(dt) {
        this.elapsed += dt;
        for (const layer of this.layers) {
            layer.points.rotation.y += layer.driftSpeed * dt;
        }
    }
}