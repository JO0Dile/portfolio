import * as THREE from 'three';

export class Atmosphere {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.elapsed = 0;

        this._buildHazeTexture();
        this._buildLayers();
        this._buildDust();
    }

    _buildHazeTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        g.addColorStop(0.0, 'rgba(90, 130, 210, 0.16)');
        g.addColorStop(0.35, 'rgba(50, 80, 140, 0.06)');
        g.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);

        this.hazeTex = new THREE.CanvasTexture(canvas);
        this.hazeTex.minFilter = THREE.LinearFilter;
    }

    _buildLayers() {
        this.layers = [];
        const depthZ = [-8, -20, -34, -52];
        const sizes  = [70, 110, 150, 200];
        const opac   = [0.55, 0.42, 0.28, 0.16];

        for (let i = 0; i < depthZ.length; i++) {
            const mat = new THREE.MeshBasicMaterial({
                map: this.hazeTex,
                transparent: true,
                opacity: opac[i],
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            const plane = new THREE.Mesh(
                new THREE.PlaneGeometry(sizes[i], sizes[i]),
                mat
            );
            plane.position.set(0, 4, depthZ[i]);
            this.group.add(plane);
            this.layers.push({
                mesh: plane,
                baseZ: depthZ[i],
                phase: i * 1.4,
                driftAmp: 1.5 + i * 0.5
            });
        }
    }

    _buildDust() {
        const count = 320;
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3]     = (Math.random() - 0.5) * 70;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

        const mat = new THREE.PointsMaterial({
            color: 0x8fb0e8,
            size: 0.085,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.28,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.dust = new THREE.Points(geo, mat);
        this.group.add(this.dust);
    }

    update(dt) {
        this.elapsed += dt;

        for (const layer of this.layers) {
            layer.mesh.position.z = layer.baseZ +
                Math.sin(this.elapsed * 0.06 + layer.phase) * layer.driftAmp;
            // Very slight rotation — makes haze feel alive
            layer.mesh.rotation.z = Math.sin(this.elapsed * 0.02 + layer.phase) * 0.02;
        }

        this.dust.rotation.y = this.elapsed * 0.012;
    }
}