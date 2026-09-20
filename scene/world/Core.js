import * as THREE from 'three';

export class Core {
    constructor(scene) {
        this.scene = scene;
        this.elapsed = 0;

        this.group = new THREE.Group();
        scene.add(this.group);

        this.currentColor = new THREE.Color(0x4d8bf5);
        this.targetColor  = new THREE.Color(0x4d8bf5);

        this.uniforms = {
            uTime:       { value: 0 },
            uPulse:      { value: 0 },
            uBaseColor:  { value: new THREE.Color(0x0a0f1a) },
            uGlowColor:  { value: new THREE.Color(0x4d8bf5) }
        };

        const vert = `
            varying vec3 vNormal;
            varying vec3 vViewPos;
            void main() {
                vec4 mv = modelViewMatrix * vec4(position, 1.0);
                vNormal = normalize(normalMatrix * normal);
                vViewPos = -mv.xyz;
                gl_Position = projectionMatrix * mv;
            }
        `;

        const frag = `
            uniform float uTime;
            uniform float uPulse;
            uniform vec3  uBaseColor;
            uniform vec3  uGlowColor;
            varying vec3 vNormal;
            varying vec3 vViewPos;

            void main() {
                vec3 N = normalize(vNormal);
                vec3 V = normalize(vViewPos);

                float fres = pow(1.0 - abs(dot(N, V)), 2.6);
                float breathe = 0.5 + 0.5 * sin(uTime * 0.6);

                vec3 col = uBaseColor;
                col += uGlowColor * fres * (0.4 + breathe * 0.18);
                col += uGlowColor * uPulse * 2.2;

                gl_FragColor = vec4(col, 1.0);
            }
        `;

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vert,
            fragmentShader: frag
        });

        this.sphere = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.7, 3),
            this.material
        );
        this.group.add(this.sphere);

        this.light = new THREE.PointLight(0x4d8bf5, 3.2, 28, 2);
        this.group.add(this.light);

        // Expanding ring on WHUMP
        const ringGeo = new THREE.RingGeometry(0.75, 0.82, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x8fb0e8,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.ring = new THREE.Mesh(ringGeo, ringMat);
        this.group.add(this.ring);

        this.ringActive = false;
        this.ringTime = 0;
        this.ringDuration = 1.1;

        // Slow halo — a bigger, softer sphere around the core
        const haloGeo = new THREE.SphereGeometry(1.4, 24, 24);
        const haloMat = new THREE.MeshBasicMaterial({
            color: 0x4d8bf5,
            transparent: true,
            opacity: 0.06,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.halo = new THREE.Mesh(haloGeo, haloMat);
        this.group.add(this.halo);
        this.haloMat = haloMat;

        // ── FLARE sprite — bright radial burst on WHUMP ──
        const flareSize = 256;
        const flareCanvas = document.createElement('canvas');
        flareCanvas.width = flareCanvas.height = flareSize;
        const fctx = flareCanvas.getContext('2d');
        const fg = fctx.createRadialGradient(
            flareSize / 2, flareSize / 2, 0,
            flareSize / 2, flareSize / 2, flareSize / 2
        );
        fg.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
        fg.addColorStop(0.15, 'rgba(180, 210, 255, 0.75)');
        fg.addColorStop(0.4, 'rgba(90, 130, 220, 0.35)');
        fg.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        fctx.fillStyle = fg;
        fctx.fillRect(0, 0, flareSize, flareSize);

        this.flareTexture = new THREE.CanvasTexture(flareCanvas);
        this.flareTexture.minFilter = THREE.LinearFilter;

        this.flareMat = new THREE.SpriteMaterial({
            map: this.flareTexture,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.flare = new THREE.Sprite(this.flareMat);
        this.flare.scale.set(0.1, 0.1, 1);
        this.group.add(this.flare);

        this.flareTime = 0;
        this.flareActive = false;
        this.flareDuration = 0.65;
    }

    setAccentColor(hex) {
        this.targetColor.set(hex);
    }

    whump() {
        this.uniforms.uPulse.value = 1.0;
        this.ringActive = true;
        this.ringTime = 0;
        this.ring.rotation.set(
            (Math.random() - 0.5) * 0.6,
            Math.random() * Math.PI * 2,
            (Math.random() - 0.5) * 0.6
        );

        // Fire the flare
        this.flareActive = true;
        this.flareTime = 0;
    }

    update(dt) {
        this.elapsed += dt;
        this.uniforms.uTime.value = this.elapsed;

        // Lerp current color toward target
        this.currentColor.lerp(this.targetColor, 1 - Math.exp(-2.5 * dt));

        this.uniforms.uGlowColor.value.copy(this.currentColor);
        this.light.color.copy(this.currentColor);
        this.ring.material.color.copy(this.currentColor).multiplyScalar(1.8);
        this.haloMat.color.copy(this.currentColor);
        this.flareMat.color.copy(this.currentColor).multiplyScalar(1.5);

        // Pulse decay
        if (this.uniforms.uPulse.value > 0) {
            this.uniforms.uPulse.value = Math.max(
                0,
                this.uniforms.uPulse.value - dt * 1.9
            );
        }

        const pulse = this.uniforms.uPulse.value;
        this.light.intensity = 3.2 + Math.sin(this.elapsed * 0.8) * 0.55 + pulse * 5.5;

        // Halo breathing
        this.haloMat.opacity = 0.05 + Math.sin(this.elapsed * 0.5) * 0.02 + pulse * 0.15;

        // Ring expansion
        if (this.ringActive) {
            this.ringTime += dt;
            const t = this.ringTime / this.ringDuration;

            if (t >= 1) {
                this.ringActive = false;
                this.ring.material.opacity = 0;
            } else {
                const ease = 1 - Math.pow(1 - t, 2.2);
                const scale = 1 + ease * 14;
                this.ring.scale.setScalar(scale);
                this.ring.material.opacity = (1 - t) * 0.9;
            }
        }

        // Flare — bright flash then decay
        if (this.flareActive) {
            this.flareTime += dt;
            const t = this.flareTime / this.flareDuration;

            if (t >= 1) {
                this.flareActive = false;
                this.flareMat.opacity = 0;
                this.flare.scale.set(0.1, 0.1, 1);
            } else {
                // Sharp rise (0 → 0.08s), then slow fall
                const rise = Math.min(1, t / 0.12);
                const fall = 1 - Math.pow(t, 1.6);

                const intensity = rise * fall;
                this.flareMat.opacity = intensity * 0.95;
                const s = 2.5 + intensity * 4.5;
                this.flare.scale.set(s, s, 1);
            }
        }
    }
}