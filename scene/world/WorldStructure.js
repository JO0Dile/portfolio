/* ============================================================
   WorldStructure.js — architectural machine placed behind panels
   Structure sits in the back, panels float in front.
   Includes a text sign that fades in during Contact.
   ============================================================ */

import * as THREE from 'three';

const POSES = {
    neutral: {
        floors: [
            [-3.4, -3.0, -3.4],
            [ 3.4, -3.0, -3.4],
            [-3.4, -3.0,  3.4],
            [ 3.4, -3.0,  3.4]
        ],
        walls: [
            [ 0, 0, -3.6,  0, 0, 0],
            [ 0, 0,  3.6,  0, 0, 0],
            [ 3.6, 0, 0,  0, Math.PI/2, 0],
            [-3.6, 0, 0,  0, Math.PI/2, 0]
        ],
        beams: [
            [-3.4, 0, -3.4,  0, 0, 0],
            [ 3.4, 0, -3.4,  0, 0, 0],
            [-3.4, 0,  3.4,  0, 0, 0],
            [ 3.4, 0,  3.4,  0, 0, 0],
            [ 0,   0, -3.4,  0, 0, 0],
            [ 0,   0,  3.4,  0, 0, 0]
        ],
        ring: [0, 0, 0, Math.PI/2, 0, 0],
        gems: { radius: 5.5, height: 1.5 },
        core: 1.0,
        roll: 0
    },

    about: {
        floors: [
            [-3.0, -3.0, -3.0],
            [ 3.0, -3.0, -3.0],
            [-3.0, -3.0,  3.0],
            [ 3.0, -3.0,  3.0]
        ],
        walls: [
            [ 0, 0, -3.2,  0, 0, 0],
            [ 0, 0,  3.2,  0, 0, 0],
            [ 3.2, 0, 0,  0, Math.PI/2, 0],
            [-3.2, 0, 0,  0, Math.PI/2, 0]
        ],
        beams: [
            [-3.0, 0, -3.0,  0, 0, 0],
            [ 3.0, 0, -3.0,  0, 0, 0],
            [-3.0, 0,  3.0,  0, 0, 0],
            [ 3.0, 0,  3.0,  0, 0, 0],
            [ 0,   0, -3.0,  0, 0, 0],
            [ 0,   0,  3.0,  0, 0, 0]
        ],
        ring: [0, 0, 0, Math.PI/2, 0, 0],
        gems: { radius: 5.0, height: 1.5 },
        core: 1.0,
        roll: 0
    },

    aaup: {
        floors: [
            [-3.8, -2.8, 0],
            [ 3.8, -1.8, 0],
            [-3.8,  3.0, 0],
            [ 3.8,  4.2, 0]
        ],
        walls: [
            [-3.7, 1.4, 0,  0, Math.PI/2, 0],
            [ 3.7, 1.4, 0,  0, Math.PI/2, 0],
            [ 0,  4.6, 0,  Math.PI/2, 0, 0],
            [ 0, -2.6, 0,  Math.PI/2, 0, 0]
        ],
        beams: [
            [-3.5, 1.4, -1.6,  0, 0, 0],
            [ 3.5, 1.4, -1.6,  0, 0, 0],
            [-3.5, 1.4,  1.6,  0, 0, 0],
            [ 3.5, 1.4,  1.6,  0, 0, 0],
            [-3.5, 1.4,  0,    0, 0, 0],
            [ 3.5, 1.4,  0,    0, 0, 0]
        ],
        ring: [0, 1.0, -2.5, 0, 0, 0],
        gems: { radius: 4.8, height: 1.2 },
        core: 0.9,
        roll: 0
    },

    construction: {
        floors: [
            [-4.2, -3.0, -4.2],
            [ 4.2, -3.0, -4.2],
            [-4.2, -3.0,  4.2],
            [ 4.2, -3.0,  4.2]
        ],
        walls: [
            [ 0, 0, -4.4,  0, 0, 0],
            [ 0, 0,  4.4,  0, 0, 0],
            [ 4.4, 0, 0,  0, Math.PI/2, 0],
            [-4.4, 0, 0,  0, Math.PI/2, 0]
        ],
        beams: [
            [-3.4, 0, -3.4,  0, 0,  Math.PI/4],
            [ 3.4, 0, -3.4,  0, 0, -Math.PI/4],
            [-3.4, 0,  3.4,  0, 0, -Math.PI/4],
            [ 3.4, 0,  3.4,  0, 0,  Math.PI/4],
            [ 0,   0, -3.4,  0, 0, 0],
            [ 0,   0,  3.4,  0, 0, 0]
        ],
        ring: [0, 0, 0, Math.PI/2, 0, Math.PI/6],
        gems: { radius: 6.5, height: 2.0 },
        core: 1.0,
        roll: Math.PI / 12
    },

    rlscientist: {
        floors: [
            [-1.2, -1.2, -1.2],
            [ 1.2, -1.2, -1.2],
            [-1.2, -1.2,  1.2],
            [ 1.2, -1.2,  1.2]
        ],
        walls: [
            [ 0, 0, -1.5,  Math.PI/2, 0, 0],
            [ 0, 0,  1.5,  Math.PI/2, 0, 0],
            [ 1.5, 0, 0,   Math.PI/2, Math.PI/2, 0],
            [-1.5, 0, 0,   Math.PI/2, Math.PI/2, 0]
        ],
        beams: [
            [-1.2, 0, -1.2,  0, 0, 0],
            [ 1.2, 0, -1.2,  0, 0, 0],
            [-1.2, 0,  1.2,  0, 0, 0],
            [ 1.2, 0,  1.2,  0, 0, 0],
            [ 0,   0, -1.2,  0, 0, 0],
            [ 0,   0,  1.2,  0, 0, 0]
        ],
        ring: [0, 0, 0, Math.PI/2, 0, 0],
        gems: { radius: 7.5, height: 3.0 },
        core: 1.8,
        roll: -Math.PI / 15
    },

    listinglab: {
        floors: [
            [-3.5, -3.0, -1.5],
            [ 3.5, -3.0, -1.5],
            [-3.5, -3.0,  1.5],
            [ 3.5, -3.0,  1.5]
        ],
        walls: [
            [-3.8, 0, -1.5,  0, Math.PI/2, 0],
            [ 3.8, 0, -1.5,  0, Math.PI/2, 0],
            [-3.8, 0,  1.5,  0, Math.PI/2, 0],
            [ 3.8, 0,  1.5,  0, Math.PI/2, 0]
        ],
        beams: [
            [-3.5, 0, -1.5,  0, 0,  Math.PI/6],
            [ 3.5, 0, -1.5,  0, 0, -Math.PI/6],
            [-3.5, 0,  1.5,  0, 0, -Math.PI/6],
            [ 3.5, 0,  1.5,  0, 0,  Math.PI/6],
            [-1.5, 0, -2.5,  0, 0, 0],
            [ 1.5, 0,  2.5,  0, 0, 0]
        ],
        ring: [0, 0, 0, Math.PI/2, 0, 0],
        gems: { radius: 6.0, height: 2.0 },
        core: 1.0,
        roll: 0
    },

    aimaze: {
        floors: [
            [-1.5, -3.0, -3.0],
            [ 1.5, -3.0, -3.0],
            [-1.5, -3.0,  3.0],
            [ 1.5, -3.0,  3.0]
        ],
        walls: [
            [-1.8, 0, 0,   0, Math.PI/2, 0],
            [ 1.8, 0, 0,   0, -Math.PI/2, 0],
            [-1.8, 0, -3,  0, Math.PI/2, 0],
            [ 1.8, 0,  3,  0, -Math.PI/2, 0]
        ],
        beams: [
            [-1.8, 0, -3.0,  0, 0, 0],
            [ 1.8, 0, -3.0,  0, 0, 0],
            [-1.8, 0,  0,    0, 0, 0],
            [ 1.8, 0,  0,    0, 0, 0],
            [-1.8, 0,  3.0,  0, 0, 0],
            [ 1.8, 0,  3.0,  0, 0, 0]
        ],
        ring: [0, 0, 0, Math.PI/2, 0, 0],
        gems: { radius: 3.0, height: 1.0 },
        core: 0.5,
        roll: Math.PI / 8
    },

    languages: {
        floors: [
            [-3.4, -3.5, -3.4],
            [ 3.4, -3.5, -3.4],
            [-3.4, -3.5,  3.4],
            [ 3.4, -3.5,  3.4]
        ],
        walls: [
            [ 0, -0.5, -3.6,  0, 0, 0],
            [ 0, -0.5,  3.6,  0, 0, 0],
            [ 3.6, -0.5, 0,  0, Math.PI/2, 0],
            [-3.6, -0.5, 0,  0, Math.PI/2, 0]
        ],
        beams: [
            [-3.4, 0, -3.4,  0, 0, 0],
            [ 3.4, 0, -3.4,  0, 0, 0],
            [-3.4, 0,  3.4,  0, 0, 0],
            [ 3.4, 0,  3.4,  0, 0, 0],
            [ 0,   0, -3.4,  0, 0, 0],
            [ 0,   0,  3.4,  0, 0, 0]
        ],
        ring: [0, 0.5, 0, Math.PI/2, 0, 0],
        gems: { radius: 5.0, height: 3.0 },
        core: 1.0,
        roll: 0
    },

    frameworks: {
        floors: [
            [ 0, -3.0, -3.5],
            [ 3.5, -3.0, 0],
            [ 0, -3.0,  3.5],
            [-3.5, -3.0, 0]
        ],
        walls: [
            [ 2.5, 0, -2.5,  0, Math.PI/4, 0],
            [ 2.5, 0,  2.5,  0, Math.PI*3/4, 0],
            [-2.5, 0,  2.5,  0, -Math.PI*3/4, 0],
            [-2.5, 0, -2.5,  0, -Math.PI/4, 0]
        ],
        beams: [
            [ 2.5, 0, -2.5,  0, 0, 0],
            [ 2.5, 0,  2.5,  0, 0, 0],
            [-2.5, 0,  2.5,  0, 0, 0],
            [-2.5, 0, -2.5,  0, 0, 0],
            [ 0,   0, -3.5,  0, 0, 0],
            [ 0,   0,  3.5,  0, 0, 0]
        ],
        ring: [0, 0, 0, Math.PI/2, 0, Math.PI/4],
        gems: { radius: 6.0, height: 2.0 },
        core: 1.0,
        roll: 0
    },

    aidata: {
        floors: [
            [-1.0, -3.0, -1.0],
            [ 1.0, -3.0, -1.0],
            [-1.0, -3.0,  1.0],
            [ 1.0, -3.0,  1.0]
        ],
        walls: [
            [ 0, 0, -3.0,  Math.PI/2, 0, 0],
            [ 0, 0,  3.0,  Math.PI/2, 0, 0],
            [ 3.0, 0, 0,   Math.PI/2, Math.PI/2, 0],
            [-3.0, 0, 0,   Math.PI/2, Math.PI/2, 0]
        ],
        beams: [
            [-3.0, 0, -3.0,  0, 0,  Math.PI/3],
            [ 3.0, 0, -3.0,  0, 0, -Math.PI/3],
            [-3.0, 0,  3.0,  0, 0, -Math.PI/3],
            [ 3.0, 0,  3.0,  0, 0,  Math.PI/3],
            [ 0,   0, -3.0,  0, 0,  Math.PI/2],
            [ 0,   0,  3.0,  0, 0, -Math.PI/2]
        ],
        ring: [0, 0, 0, Math.PI/2, 0, 0],
        gems: { radius: 8.0, height: 4.0 },
        core: 1.2,
        roll: 0
    },

    other: {
        floors: [
            [-2.0, -2.5, -2.0],
            [ 2.0, -3.0, -2.0],
            [-2.0, -2.0,  2.0],
            [ 2.0, -2.5,  2.0]
        ],
        walls: [
            [ 0, -0.5, -3.0,  0, 0, 0],
            [ 0,  0.5,  3.0,  0, 0, 0],
            [ 3.0, -0.5, 0,  0, Math.PI/2, 0],
            [-3.0, 0.5, 0,   0, Math.PI/2, 0]
        ],
        beams: [
            [-2.5, 0, -2.5,  0, 0,  Math.PI/8],
            [ 2.5, 0, -2.5,  0, 0, -Math.PI/8],
            [-2.5, 0,  2.5,  0, 0, -Math.PI/6],
            [ 2.5, 0,  2.5,  0, 0,  Math.PI/6],
            [ 0,  -1, -3.5,  0, 0, 0],
            [ 0,   1,  3.5,  0, 0, 0]
        ],
        ring: [0, 0, 0, Math.PI/2, 0, 0],
        gems: { radius: 5.0, height: 2.5 },
        core: 1.0,
        roll: 0
    },

    contact: {
        floors: [
            [-3.4, -3.0, -3.4],
            [ 3.4, -3.0, -3.4],
            [-3.4, -3.0,  3.4],
            [ 3.4, -3.0,  3.4]
        ],
        walls: [
            [ 0, 0, -3.6,  0, 0, 0],
            [ 0, 0,  3.6,  0, 0, 0],
            [ 3.6, 0, 0,  0, Math.PI/2, 0],
            [-3.6, 0, 0,  0, Math.PI/2, 0]
        ],
        beams: [
            [-3.4, 0, -3.4,  0, 0, 0],
            [ 3.4, 0, -3.4,  0, 0, 0],
            [-3.4, 0,  3.4,  0, 0, 0],
            [ 3.4, 0,  3.4,  0, 0, 0],
            [ 0,   0, -3.4,  0, 0, 0],
            [ 0,   0,  3.4,  0, 0, 0]
        ],
        ring: [0, 0, 0, Math.PI/2, 0, 0],
        gems: { radius: 5.5, height: 1.5 },
        core: 1.0,
        roll: 0
    }
};

const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
const smoother = (v) => {
    v = clamp01(v);
    return v * v * v * (v * (v * 6 - 15) + 10);
};

// ───────────────────────────────────────────────────────────
// Text sign — drawn onto a canvas so we don't need font loading.
// Shown only during the "contact" pose, faded in/out smoothly.
// ───────────────────────────────────────────────────────────
function makeSignTexture(line1, line2) {
    const W = 1024;
    const H = 320;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, W, H);

    // Top line — small, spaced, uppercase, muted
    ctx.font = '500 34px "Inter", "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '14px';
    ctx.fillText(line1.toUpperCase(), W / 2, 90);

    // Bottom line — big, thin weight, bright
    ctx.font = '300 96px "Inter", "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
    ctx.letterSpacing = '2px';
    ctx.fillText(line2, W / 2, 200);

    // Thin divider line under the top text
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 260, 130);
    ctx.lineTo(W / 2 + 260, 130);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
}

export class WorldStructure {
    constructor(scene, cameraDirector) {
        this.scene = scene;
        this.cameraDirector = cameraDirector;

        this.group = new THREE.Group();
        this.group.position.set(0, 4.2, -1.8);
        this.group.scale.setScalar(1.05);
        scene.add(this.group);

        this.currentAccent = new THREE.Color(0x4d8bf5);
        this.targetAccent = new THREE.Color(0x4d8bf5);

        this.currentPose = POSES.neutral;
        this.targetPose = POSES.neutral;
        this.poseStartTime = performance.now() * 0.001;

        this.floors = [];
        this.walls = [];
        this.beams = [];
        this.gems = [];
        this.gemMats = [];

        // Text sign
        this.signOpacity = 0;
        this.targetSignOpacity = 0;

        this._build();
        this._snapToPose(POSES.neutral);
    }

    _build() {
        const darkMat = new THREE.MeshStandardMaterial({
            color: 0x14171c,
            roughness: 0.62,
            metalness: 0.82
        });

        const midMat = new THREE.MeshStandardMaterial({
            color: 0x24282f,
            roughness: 0.38,
            metalness: 0.92
        });

        const accentMat = new THREE.MeshBasicMaterial({
            color: 0x4d8bf5,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false
        });
        this.accentMat = accentMat;

        // FLOORS
        for (let i = 0; i < 4; i++) {
            const g = new THREE.Group();
            const slab = new THREE.Mesh(
                new THREE.BoxGeometry(3.6, 0.3, 3.6),
                darkMat
            );
            g.add(slab);
            const edge = new THREE.Mesh(
                new THREE.BoxGeometry(3.65, 0.04, 3.65),
                accentMat
            );
            edge.position.y = 0.17;
            g.add(edge);
            this.group.add(g);
            this.floors.push(g);
        }

        // WALLS
        for (let i = 0; i < 4; i++) {
            const g = new THREE.Group();
            const panel = new THREE.Mesh(
                new THREE.BoxGeometry(3.4, 4.0, 0.25),
                midMat
            );
            g.add(panel);
            const strip = new THREE.Mesh(
                new THREE.BoxGeometry(3.45, 0.06, 0.3),
                accentMat
            );
            strip.position.y = -1.95;
            g.add(strip);
            this.group.add(g);
            this.walls.push(g);
        }

        // BEAMS
        for (let i = 0; i < 6; i++) {
            const beam = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 6.5, 0.4),
                midMat
            );
            this.group.add(beam);
            this.beams.push(beam);
        }

        // RING
        this.ringGroup = new THREE.Group();
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x24282f,
            roughness: 0.32,
            metalness: 0.95,
            emissive: 0x0a1220,
            emissiveIntensity: 0.6
        });
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(3.9, 0.16, 16, 80),
            ringMat
        );
        this.ringGroup.add(ring);
        this.ringMesh = ring;

        this.ringSpin = new THREE.Group();
        const innerRing = new THREE.Mesh(
            new THREE.TorusGeometry(3.8, 0.045, 12, 80),
            accentMat
        );
        this.ringSpin.add(innerRing);
        this.ringGroup.add(this.ringSpin);

        this.group.add(this.ringGroup);

        // GEMS
        for (let i = 0; i < 4; i++) {
            const mat = new THREE.MeshBasicMaterial({
                color: 0x4d8bf5,
                toneMapped: false
            });
            const gem = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.24, 0),
                mat
            );
            this.group.add(gem);
            this.gems.push(gem);
            this.gemMats.push(mat);
        }

        // CORE
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0x0a0c10,
            roughness: 0.28,
            metalness: 0.92,
            emissive: 0x4d8bf5,
            emissiveIntensity: 0.4
        });
        this.coreMat = coreMat;
        this.core = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.7, 2),
            coreMat
        );
        this.group.add(this.core);

        // ── TEXT SIGN ──
        // Sits centered in the structure, behind the ring, faces the camera.
        // Only visible during the "contact" pose.
        const signTex = makeSignTexture('A note from the end', 'Look forward');
        const signMat = new THREE.MeshBasicMaterial({
            map: signTex,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            depthTest: false,
            toneMapped: false
        });
        this.signMat = signMat;

        const signGeo = new THREE.PlaneGeometry(9.6, 3.0);
        this.sign = new THREE.Mesh(signGeo, signMat);
        // Position: center of structure, just behind the ring, facing camera
        // (no rotation needed — PlaneGeometry faces +Z by default)
        this.sign.position.set(0, 1.0, -3.4);
        this.sign.renderOrder = 10;
        this.group.add(this.sign);
    }

    _snapToPose(pose) {
        this._applyPose(pose, 1);
    }

    setPose(name) {
        const pose = POSES[name] || POSES.neutral;
        this._captureFrom();
        this.currentPose = this.targetPose;
        this.targetPose = pose;
        this.poseStartTime = performance.now() * 0.001;

        if (this.cameraDirector && pose.roll !== undefined) {
            this.cameraDirector.setRoll(pose.roll);
        }

        // Only show the sign during Contact
        this.targetSignOpacity = (name === 'contact') ? 1 : 0;
    }

    _captureFrom() {
        this._fromFloors = this.floors.map(g => ({
            pos: g.position.clone(),
            rot: new THREE.Euler(g.rotation.x, g.rotation.y, g.rotation.z)
        }));
        this._fromWalls = this.walls.map(g => ({
            pos: g.position.clone(),
            rot: new THREE.Euler(g.rotation.x, g.rotation.y, g.rotation.z)
        }));
        this._fromBeams = this.beams.map(g => ({
            pos: g.position.clone(),
            rot: new THREE.Euler(g.rotation.x, g.rotation.y, g.rotation.z)
        }));
        this._fromRing = {
            pos: this.ringGroup.position.clone(),
            rot: new THREE.Euler(
                this.ringGroup.rotation.x,
                this.ringGroup.rotation.y,
                this.ringGroup.rotation.z
            )
        };
    }

    setAccentColor(hex) {
        this.targetAccent.set(hex);
    }

    _applyPose(pose, k) {
        const kk = k;

        for (let i = 0; i < 4; i++) {
            const p = pose.floors[i];
            const g = this.floors[i];
            const from = this._fromFloors ? this._fromFloors[i] : { pos: g.position, rot: g.rotation };
            g.position.set(
                from.pos.x + (p[0] - from.pos.x) * kk,
                from.pos.y + (p[1] - from.pos.y) * kk,
                from.pos.z + (p[2] - from.pos.z) * kk
            );
        }

        for (let i = 0; i < 4; i++) {
            const p = pose.walls[i];
            const g = this.walls[i];
            const from = this._fromWalls ? this._fromWalls[i] : { pos: g.position, rot: g.rotation };
            g.position.set(
                from.pos.x + (p[0] - from.pos.x) * kk,
                from.pos.y + (p[1] - from.pos.y) * kk,
                from.pos.z + (p[2] - from.pos.z) * kk
            );
            g.rotation.set(
                from.rot.x + (p[3] - from.rot.x) * kk,
                from.rot.y + (p[4] - from.rot.y) * kk,
                from.rot.z + (p[5] - from.rot.z) * kk
            );
        }

        for (let i = 0; i < 6; i++) {
            const p = pose.beams[i];
            const g = this.beams[i];
            const from = this._fromBeams ? this._fromBeams[i] : { pos: g.position, rot: g.rotation };
            g.position.set(
                from.pos.x + (p[0] - from.pos.x) * kk,
                from.pos.y + (p[1] - from.pos.y) * kk,
                from.pos.z + (p[2] - from.pos.z) * kk
            );
            g.rotation.set(
                from.rot.x + (p[3] - from.rot.x) * kk,
                from.rot.y + (p[4] - from.rot.y) * kk,
                from.rot.z + (p[5] - from.rot.z) * kk
            );
        }

        const rp = pose.ring;
        const fromR = this._fromRing || { pos: this.ringGroup.position, rot: this.ringGroup.rotation };
        this.ringGroup.position.set(
            fromR.pos.x + (rp[0] - fromR.pos.x) * kk,
            fromR.pos.y + (rp[1] - fromR.pos.y) * kk,
            fromR.pos.z + (rp[2] - fromR.pos.z) * kk
        );
        this.ringGroup.rotation.set(
            fromR.rot.x + (rp[3] - fromR.rot.x) * kk,
            fromR.rot.y + (rp[4] - fromR.rot.y) * kk,
            fromR.rot.z + (rp[5] - fromR.rot.z) * kk
        );

        const cs = pose.core;
        const currentCS = this.core.scale.x;
        this.core.scale.setScalar(currentCS + (cs - currentCS) * kk);
    }

    update(dt) {
        const now = performance.now() * 0.001;
        const elapsed = now - this.poseStartTime;

        const rawProgress = clamp01(elapsed / 2.2);
        const eased = smoother(rawProgress);

        this._applyPose(this.targetPose, eased);

        // Idle motions
        const gems = this.targetPose.gems;
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + now * 0.35;
            const g = this.gems[i];
            g.position.set(
                Math.cos(angle) * gems.radius,
                Math.sin(now * 0.6 + i * 1.4) * 0.6 + gems.height,
                Math.sin(angle) * gems.radius
            );
            g.rotation.y += dt * 1.4;
            g.rotation.x += dt * 0.7;
        }

        // Ring inner accent spins continuously on its own child
        this.ringSpin.rotation.z += dt * 0.3;

        // Core breathing
        const baseScale = this.targetPose.core;
        const pulse = 1 + Math.sin(now * 1.4) * 0.03;
        this.core.scale.setScalar(baseScale * pulse);
        this.core.rotation.y += dt * 0.15;

        // Sign opacity fade
        const signLerp = 1 - Math.exp(-dt * 1.4);
        this.signOpacity += (this.targetSignOpacity - this.signOpacity) * signLerp;
        this.signMat.opacity = this.signOpacity;
        this.sign.visible = this.signOpacity > 0.01;

        // Accent color lerp
        const ck = 1 - Math.exp(-dt * 2.0);
        this.currentAccent.lerp(this.targetAccent, ck);
        this.accentMat.color.copy(this.currentAccent);
        this.coreMat.emissive.copy(this.currentAccent);
        for (const m of this.gemMats) m.color.copy(this.currentAccent);
    }
}