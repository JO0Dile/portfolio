/* ============================================================
   WetFloor.js — reflective floor (replaces FloorGrid)
   ------------------------------------------------------------
   A mirror plane with a ripple overlay on top. Everything above
   it — the drones, the panel, the field lines — gets a second
   copy below, which is where most of the depth comes from.

   The Reflector renders the scene a second time into a render
   target, so its resolution is driven by the quality level and
   it drops out entirely on 'low'.
   ============================================================ */

import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

const FLOOR_Y    = 0.55;
const FLOOR_SIZE = 110;

const RES_BY_LEVEL = { high: 1024, medium: 512, low: 0 };

export class WetFloor {
    constructor(scene, quality) {
        this.scene = scene;
        this.elapsed = 0;
        this.reflector = null;
        this._currentRes = -1;

        // ── Base plate ───────────────────────────────────────
        // Sits under the reflector so the floor still reads as a
        // surface if reflections are off, and darkens the mirror
        // so it looks like wet stone rather than a clean mirror.
        this.base = new THREE.Mesh(
            new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE),
            new THREE.MeshBasicMaterial({
                color: 0x050a12,
                transparent: true,
                opacity: 0.55,
                depthWrite: false
            })
        );
        this.base.rotation.x = -Math.PI / 2;
        this.base.position.y = FLOOR_Y + 0.004;
        this.base.renderOrder = 1;
        scene.add(this.base);

        // ── Ripple overlay ───────────────────────────────────
        // Drifting horizontal streaks that break up the mirror.
        // Without this a Reflector reads as glass, not water.
        this.uniforms = {
            uTime:   { value: 0 },
            uAccent: { value: new THREE.Color(0x4d8bf5) }
        };

        this.rippleMat = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec3  uAccent;
                varying vec2 vUv;

                void main() {
                    vec2 c = vUv - 0.5;
                    float d = length(c);

                    // Streaks running across the surface, drifting slowly
                    float s1 = sin(vUv.y * 190.0 - uTime * 0.55);
                    float s2 = sin(vUv.y * 77.0  + uTime * 0.31);
                    float streak = max(0.0, s1 * 0.5 + s2 * 0.5);
                    streak = pow(streak, 7.0);

                    // A few wider swells so it is not uniform
                    float swell = pow(max(0.0, sin(vUv.y * 13.0 - uTime * 0.18)), 12.0);

                    // Fade out toward the edges of the plane
                    float radial = 1.0 - smoothstep(0.12, 0.5, d);

                    float a = (streak * 0.16 + swell * 0.1) * radial;
                    if (a < 0.004) discard;

                    gl_FragColor = vec4(uAccent * (0.5 + swell * 0.6), a);
                }
            `
        });

        this.ripple = new THREE.Mesh(
            new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE),
            this.rippleMat
        );
        this.ripple.rotation.x = -Math.PI / 2;
        this.ripple.position.y = FLOOR_Y + 0.012;
        this.ripple.renderOrder = 3;
        scene.add(this.ripple);

        // ── Quality ──────────────────────────────────────────
        if (quality && quality.register) {
            quality.register((level) => {
                this._setResolution(RES_BY_LEVEL[level] ?? RES_BY_LEVEL.medium);
            });
        } else {
            this._setResolution(RES_BY_LEVEL.high);
        }
    }

    /* Builds (or rebuilds, or removes) the mirror at a given
       render-target size. 0 disables reflections entirely. */
    _setResolution(res) {
        if (res === this._currentRes) return;
        this._currentRes = res;

        if (this.reflector) {
            this.scene.remove(this.reflector);
            if (this.reflector.dispose) this.reflector.dispose();
            this.reflector.geometry.dispose();
            this.reflector = null;
        }

        if (!res) {
            // No reflection — lean on the base plate alone.
            this.base.material.opacity = 0.9;
            return;
        }

        this.base.material.opacity = 0.55;

        try {
            this.reflector = new Reflector(
                new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE),
                {
                    clipBias: 0.004,
                    textureWidth: res,
                    textureHeight: res,
                    color: 0x2c3f55
                }
            );
            this.reflector.rotation.x = -Math.PI / 2;
            this.reflector.position.y = FLOOR_Y;
            this.reflector.renderOrder = 0;
            this.scene.add(this.reflector);
        } catch (err) {
            console.warn('[WetFloor] reflector unavailable, using flat floor:', err);
            this.reflector = null;
            this.base.material.opacity = 0.9;
        }
    }

    /* Driven by SceneDirector so the water tints with the slot. */
    setAccentColor(hex) {
        this.uniforms.uAccent.value.set(hex);
    }

    update(dt) {
        this.elapsed += dt;
        this.uniforms.uTime.value = this.elapsed;
    }
}
