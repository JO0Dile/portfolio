/* ============================================================
   FloorGrid.js — grounded grid plane under the hive
   ============================================================ */

import * as THREE from 'three';

export class FloorGrid {
    constructor(scene) {
        this.group = new THREE.Group();
        scene.add(this.group);

        // Radial fade shader — grid disappears toward edges
        this.uniforms = {
            uTime:      { value: 0 },
            uColor:     { value: new THREE.Color(0x3a5f9a) },
            uAccent:    { value: new THREE.Color(0x4d8bf5) }
        };

        const vert = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const frag = `
            uniform float uTime;
            uniform vec3  uColor;
            uniform vec3  uAccent;
            varying vec2 vUv;

            float gridLine(float v, float density) {
                float f = fract(v * density);
                float dist = min(f, 1.0 - f);
                return smoothstep(0.48, 0.5, 1.0 - dist * 0.9);
            }

            void main() {
                // Grid — thin lines
                float gx = gridLine(vUv.x, 40.0);
                float gy = gridLine(vUv.y, 40.0);
                float grid = max(gx, gy);

                // Radial fade from center
                vec2 c = vUv - 0.5;
                float radial = 1.0 - smoothstep(0.15, 0.5, length(c));

                // Slow travelling pulse ring
                float pulseRadius = fract(uTime * 0.06) * 0.5;
                float pulse = smoothstep(0.02, 0.0, abs(length(c) - pulseRadius));

                float intensity = grid * radial;

                vec3 col = uColor * intensity * 0.55;
                col += uAccent * intensity * pulse * 2.4;

                float alpha = intensity * 0.42 + pulse * radial * 0.18;

                if (alpha < 0.005) discard;
                gl_FragColor = vec4(col, alpha);
            }
        `;

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vert,
            fragmentShader: frag,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });

        const geo = new THREE.PlaneGeometry(80, 80);
        this.plane = new THREE.Mesh(geo, this.material);
        this.plane.rotation.x = -Math.PI / 2;
        this.plane.position.y = -1.5;
        this.group.add(this.plane);

        this.elapsed = 0;
    }

    update(dt) {
        this.elapsed += dt;
        this.uniforms.uTime.value = this.elapsed;
    }
}