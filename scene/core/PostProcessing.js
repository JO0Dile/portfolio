/* ============================================================
   PostProcessing.js — with DOF
   ============================================================ */

import * as THREE from 'three';
import { EffectComposer }   from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }       from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass }  from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass }        from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass }       from 'three/addons/postprocessing/ShaderPass.js';

export class PostProcessing {
    constructor(manager, quality) {
        this.manager = manager;
        this.quality = quality;
        this.elapsed = 0;

        const { renderer, scene, camera } = manager;
        const w = window.innerWidth;
        const h = window.innerHeight;

        this.composer = new EffectComposer(renderer);
        this.composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        this.composer.setSize(w, h);

        this.renderPass = new RenderPass(scene, camera);
        this.composer.addPass(this.renderPass);

        // Bloom
        this.bloom = new UnrealBloomPass(
            new THREE.Vector2(w, h),
            0.42,
            0.65,
            0.88
        );
        this.composer.addPass(this.bloom);

        // Bokeh / DOF
        this.bokeh = new BokehPass(scene, camera, {
            focus: 22,
            aperture: 0.00018,
            maxblur: 0.008
        });
        this.composer.addPass(this.bokeh);

        // Final grade
        this.finalShader = {
            uniforms: {
                tDiffuse:    { value: null },
                uTime:       { value: 0 },
                uResolution: { value: new THREE.Vector2(w, h) },
                uGrain:      { value: 0.038 },
                uVignette:   { value: 0.72 },
                uFade:       { value: 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float uTime;
                uniform vec2  uResolution;
                uniform float uGrain;
                uniform float uVignette;
                uniform float uFade;
                varying vec2 vUv;

                float rand(vec2 co) {
                    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
                }

                void main() {
                    vec2 uv = vUv;
                    vec2 d  = uv - 0.5;

                    vec3 col = texture2D(tDiffuse, uv).rgb;

                    float vig = 1.0 - dot(d, d) * uVignette;
                    col *= vig;

                    float n = rand(uv * uResolution + uTime * 90.0);
                    col += (n - 0.5) * uGrain;

                    col = max(col, vec3(0.005, 0.007, 0.011));
                    col *= uFade;

                    gl_FragColor = vec4(col, 1.0);
                }
            `
        };

        this.finalPass = new ShaderPass(this.finalShader);
        this.finalPass.renderToScreen = true;
        this.composer.addPass(this.finalPass);

        quality.register((level) => {
            if (!this.bloom || !this.bokeh) return;
            if (level === 'high') {
                this.bloom.enabled = true;
                this.bokeh.enabled = true;
                if (this.bokeh.uniforms && this.bokeh.uniforms['maxblur']) {
                    this.bokeh.uniforms['maxblur'].value = 0.008;
                }
                this.composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
            } else if (level === 'medium') {
                this.bloom.enabled = true;
                this.bokeh.enabled = true;
                if (this.bokeh.uniforms && this.bokeh.uniforms['maxblur']) {
                    this.bokeh.uniforms['maxblur'].value = 0.005;
                }
                this.composer.setPixelRatio(1);
            } else {
                this.bloom.enabled = false;
                this.bokeh.enabled = false;
                this.composer.setPixelRatio(1);
            }
        });

        this._onResize = this._onResize.bind(this);
        window.addEventListener('resize', this._onResize);
    }

    setFocus(distance) {
        if (!this.bokeh || !this.bokeh.uniforms) return;
        const u = this.bokeh.uniforms['focus'];
        if (u) u.value = distance;
    }

    setFade(v) {
        this.finalShader.uniforms.uFade.value = v;
    }

    _onResize() {
        const w = window.innerWidth, h = window.innerHeight;
        this.composer.setSize(w, h);
        if (this.bloom) this.bloom.setSize(w, h);
        if (this.bokeh && this.bokeh.setSize) this.bokeh.setSize(w, h);
        this.finalShader.uniforms.uResolution.value.set(w, h);
    }

    render() {
        this.elapsed += 0.016;
        this.finalShader.uniforms.uTime.value = this.elapsed;
        this.composer.render();
    }
}