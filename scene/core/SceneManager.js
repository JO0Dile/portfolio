import * as THREE from 'three';
import { IS_MOBILE, MAX_DPR } from '../performance/device.js';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;

        this.renderer = new THREE.WebGLRenderer({
            canvas,
            // MSAA on a phone costs more than it is worth at 1.5x DPR.
            antialias: !IS_MOBILE,
            alpha: false,
            powerPreference: 'high-performance'
        });
        this.renderer.setClearColor(0x05060a, 1);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.35;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x05060a);
        // Less aggressive fog — fragments visible at close range
        this.scene.fog = new THREE.FogExp2(0x05060a, 0.014);

        this.camera = new THREE.PerspectiveCamera(
            42,
            window.innerWidth / window.innerHeight,
            0.1,
            400
        );

        this._onResize = this._onResize.bind(this);
        window.addEventListener('resize', this._onResize);
    }

    _onResize() {
        const w = window.innerWidth, h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    }
}