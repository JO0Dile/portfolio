import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene, quality) {
        this.scene = scene;
        this.quality = quality;
        this.elapsed = 0;

        this.baseCount = 1600;
        this.count = this.baseCount;

        this._build();
        this._registerQuality();
    }

    _build() {
        const n = this.baseCount;

        this.positions = new Float32Array(n * 3);
        this.colors    = new Float32Array(n * 3);
        this.speeds    = new Float32Array(n);
        this.orbitR    = new Float32Array(n);
        this.orbitA    = new Float32Array(n);
        this.yBase     = new Float32Array(n);
        this.ySpeed    = new Float32Array(n);
        this.yAmp      = new Float32Array(n);
        this.phase     = new Float32Array(n);
        this.tier      = new Uint8Array(n);

        const cCool   = new THREE.Color(0x7a90b0);
        const cSoft   = new THREE.Color(0xb8d0f0);
        const cAccent = new THREE.Color(0x4d8bf5);
        const cFar    = new THREE.Color(0x3a4454);

        for (let i = 0; i < n; i++) {
            const roll = Math.random();
            let r, tier;
            if (roll < 0.55)      { r = 3.4 + Math.random() * 3.0; tier = 0; }
            else if (roll < 0.85) { r = 6.5 + Math.random() * 6.0; tier = 1; }
            else                  { r = 13 + Math.random() * 11;   tier = 2; }

            this.orbitR[i] = r;
            this.orbitA[i] = Math.random() * Math.PI * 2;
            this.tier[i]   = tier;

            this.yBase[i]  = (Math.random() - 0.5) * 46;
            this.ySpeed[i] = 0.14 + Math.random() * 0.35;
            this.yAmp[i]   = 1.2 + Math.random() * 2.4;

            this.speeds[i] = (0.03 + Math.random() * 0.07) * (Math.random() < 0.5 ? 1 : -1);
            this.phase[i]  = Math.random() * Math.PI * 2;

            let c = cCool.clone();
            if (tier === 0 && Math.random() < 0.28) c.lerp(cAccent, 0.6);
            else if (tier === 1)                    c.lerp(cSoft, 0.5);
            else                                    c.lerp(cFar, 0.7);

            this.colors[i * 3]     = c.r;
            this.colors[i * 3 + 1] = c.g;
            this.colors[i * 3 + 2] = c.b;

            this.positions[i * 3]     = Math.cos(this.orbitA[i]) * r;
            this.positions[i * 3 + 1] = this.yBase[i];
            this.positions[i * 3 + 2] = Math.sin(this.orbitA[i]) * r;
        }

        this.geo = new THREE.BufferGeometry();
        this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geo.setAttribute('color',    new THREE.BufferAttribute(this.colors, 3));
        this.geo.setDrawRange(0, this.count);

        this.mat = new THREE.PointsMaterial({
            size: 0.055,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity: 0.72,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.points = new THREE.Points(this.geo, this.mat);
        this.scene.add(this.points);
    }

    _registerQuality() {
        this.quality.register((level) => {
            const mult = level === 'high' ? 1 : level === 'medium' ? 0.65 : 0.35;
            this.count = Math.max(120, Math.floor(this.baseCount * mult));
            this.geo.setDrawRange(0, this.count);
        });
    }

    update(dt) {
        this.elapsed += dt;
        const t = this.elapsed;

        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;

            this.orbitA[i] += this.speeds[i] * dt * 0.6;
            this.yBase[i]  += this.ySpeed[i] * dt * 0.5;
            if (this.yBase[i] > 24) this.yBase[i] = -24;

            const y = this.yBase[i] + Math.sin(t * 0.6 + this.phase[i]) * this.yAmp[i] * 0.35;
            const rBreath = this.orbitR[i] * (1 + Math.sin(t * 0.35 + this.phase[i] * 0.5) * 0.025);

            this.positions[i3]     = Math.cos(this.orbitA[i]) * rBreath;
            this.positions[i3 + 1] = y;
            this.positions[i3 + 2] = Math.sin(this.orbitA[i]) * rBreath;
        }

        this.geo.attributes.position.needsUpdate = true;
        this.points.rotation.y = t * 0.012;
    }
}