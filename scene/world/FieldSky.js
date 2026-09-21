/* ============================================================
   FieldSky.js — a magnetic dipole behind the scene
   ------------------------------------------------------------
   Two poles far out to the left and right with field lines
   arcing between them, and particles riding the lines.

   The left pole takes the current slot accent; the right pole
   takes its opposite hue, so the sky always has two colours and
   always shifts when the project does.
   ============================================================ */

import * as THREE from 'three';

const POLE_X    = 30;
const POLE_Y    = 5;
const POLE_Z    = -18;

const LINE_COUNT    = 22;
const SEGMENTS      = 72;
const PARTICLE_COUNT = 44;

export class FieldSky {
    constructor(scene, quality) {
        this.scene = scene;
        this.elapsed = 0;

        this.group = new THREE.Group();
        scene.add(this.group);

        this.colorA = new THREE.Color(0x4d8bf5);
        this.colorB = new THREE.Color(0xff8a5c);
        this._targetA = new THREE.Color(0x4d8bf5);
        this._targetB = new THREE.Color(0xff8a5c);

        this.poleA = new THREE.Vector3(-POLE_X, POLE_Y, POLE_Z);
        this.poleB = new THREE.Vector3( POLE_X, POLE_Y, POLE_Z);

        // Each line is defined by an angle around the pole axis and
        // how far it bulges out. Kept so particles can be evaluated
        // against the same curves at runtime.
        this.lines = [];
        for (let i = 0; i < LINE_COUNT; i++) {
            const t = i / (LINE_COUNT - 1);
            this.lines.push({
                theta: t * Math.PI * 2 * 1.618,          // spread around the axis
                amp: 9 + Math.sin(t * Math.PI) * 26 + (i % 3) * 3.5,
                bright: 0.35 + (i % 4) * 0.16
            });
        }

        this._buildLines();
        this._buildPoles();
        this._buildParticles();

        if (quality && quality.register) {
            quality.register((level) => {
                this.group.visible = true;
                this.particles.visible = (level !== 'low');

                // Vertices are laid out line by line, so a draw range is
                // a free way to render fewer of them without rebuilding
                // the geometry.
                // Only the emergency level drops lines. Medium looks
                // exactly like high, because medium is where phones sit.
                const keep = level === 'low' ? 0.5 : 1;
                const verts = LINE_COUNT * SEGMENTS * 2;
                this.lineMesh.geometry.setDrawRange(0, Math.floor(verts * keep));
            });
        }
    }

    /* Point on field line `i` at parameter u in [0,1]. */
    _pointOn(i, u, out) {
        const L = this.lines[i];
        const bulge = Math.sin(u * Math.PI) * L.amp;
        const py = Math.cos(L.theta) * bulge;
        const pz = Math.sin(L.theta) * bulge;

        out.set(
            this.poleA.x + (this.poleB.x - this.poleA.x) * u,
            this.poleA.y + py,
            this.poleA.z + pz * 0.55
        );
        return out;
    }

    _buildLines() {
        const positions = [];
        const colors = [];
        const p = new THREE.Vector3();
        const q = new THREE.Vector3();
        const c = new THREE.Color();

        for (let i = 0; i < LINE_COUNT; i++) {
            const bright = this.lines[i].bright;
            for (let s = 0; s < SEGMENTS; s++) {
                const u0 = s / SEGMENTS;
                const u1 = (s + 1) / SEGMENTS;

                this._pointOn(i, u0, p);
                this._pointOn(i, u1, q);
                positions.push(p.x, p.y, p.z, q.x, q.y, q.z);

                // Colour blends A -> B along the line
                c.copy(this.colorA).lerp(this.colorB, u0).multiplyScalar(bright);
                colors.push(c.r, c.g, c.b);
                c.copy(this.colorA).lerp(this.colorB, u1).multiplyScalar(bright);
                colors.push(c.r, c.g, c.b);
            }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        this.lineMat = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.72,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false
        });

        this.lineMesh = new THREE.LineSegments(geo, this.lineMat);
        this.lineMesh.renderOrder = -2;
        this.group.add(this.lineMesh);

        this._lineColorAttr = geo.getAttribute('color');
    }

    _buildPoles() {
        const mk = (colour) => {
            const g = new THREE.Group();

            const core = new THREE.Mesh(
                new THREE.SphereGeometry(0.85, 20, 20),
                new THREE.MeshBasicMaterial({ color: colour, toneMapped: false })
            );
            g.add(core);

            const halo = new THREE.Mesh(
                new THREE.SphereGeometry(3.0, 20, 20),
                new THREE.MeshBasicMaterial({
                    color: colour,
                    transparent: true,
                    opacity: 0.1,
                    side: THREE.BackSide,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending,
                    toneMapped: false
                })
            );
            g.add(halo);

            this.group.add(g);
            return { group: g, core, halo };
        };

        this.pA = mk(this.colorA.getHex());
        this.pB = mk(this.colorB.getHex());
        this.pA.group.position.copy(this.poleA);
        this.pB.group.position.copy(this.poleB);
    }

    _buildParticles() {
        this._parts = [];
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const colors = new Float32Array(PARTICLE_COUNT * 3);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            this._parts.push({
                line: i % LINE_COUNT,
                u: (i * 0.137) % 1,
                speed: 0.035 + (i % 5) * 0.012,
                dir: (i % 2) ? 1 : -1
            });
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        this.particles = new THREE.Points(geo, new THREE.PointsMaterial({
            size: 0.42,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            toneMapped: false
        }));
        this.particles.renderOrder = -1;
        this.group.add(this.particles);

        this._partPos = geo.getAttribute('position');
        this._partCol = geo.getAttribute('color');
    }

    /* SceneDirector hands us the slot accent. The opposite pole
       takes the opposing hue so the sky never goes monochrome. */
    setAccentColor(hex) {
        this._targetA.set(hex);

        const hsl = { h: 0, s: 0, l: 0 };
        this._targetA.getHSL(hsl);
        this._targetB.setHSL((hsl.h + 0.5) % 1, Math.max(0.45, hsl.s), Math.min(0.68, hsl.l + 0.08));
    }

    update(dt) {
        this.elapsed += dt;

        // Ease the poles toward their targets
        const k = 1 - Math.exp(-2.2 * dt);
        const movedA = this.colorA.getHex() !== this._targetA.getHex();
        const movedB = this.colorB.getHex() !== this._targetB.getHex();
        this.colorA.lerp(this._targetA, k);
        this.colorB.lerp(this._targetB, k);

        if (movedA || movedB) {
            this.pA.core.material.color.copy(this.colorA);
            this.pA.halo.material.color.copy(this.colorA);
            this.pB.core.material.color.copy(this.colorB);
            this.pB.halo.material.color.copy(this.colorB);
            this._recolorLines();
        }

        // Poles breathe on offset phases
        const bA = 1 + Math.sin(this.elapsed * 0.7) * 0.09;
        const bB = 1 + Math.sin(this.elapsed * 0.7 + 2.1) * 0.09;
        this.pA.halo.scale.setScalar(bA);
        this.pB.halo.scale.setScalar(bB);

        // Whole field drifts, so it is never quite still
        this.group.rotation.x = Math.sin(this.elapsed * 0.08) * 0.035;
        this.group.rotation.z = Math.cos(this.elapsed * 0.06) * 0.025;

        if (this.particles.visible) this._moveParticles(dt);
    }

    _recolorLines() {
        const arr = this._lineColorAttr.array;
        const c = new THREE.Color();
        let w = 0;
        for (let i = 0; i < LINE_COUNT; i++) {
            const bright = this.lines[i].bright;
            for (let s = 0; s < SEGMENTS; s++) {
                const u0 = s / SEGMENTS;
                const u1 = (s + 1) / SEGMENTS;
                c.copy(this.colorA).lerp(this.colorB, u0).multiplyScalar(bright);
                arr[w++] = c.r; arr[w++] = c.g; arr[w++] = c.b;
                c.copy(this.colorA).lerp(this.colorB, u1).multiplyScalar(bright);
                arr[w++] = c.r; arr[w++] = c.g; arr[w++] = c.b;
            }
        }
        this._lineColorAttr.needsUpdate = true;
    }

    _moveParticles(dt) {
        const pos = this._partPos.array;
        const col = this._partCol.array;
        const p = new THREE.Vector3();
        const c = new THREE.Color();

        for (let i = 0; i < this._parts.length; i++) {
            const part = this._parts[i];
            part.u += part.speed * part.dir * dt;
            if (part.u > 1) part.u -= 1;
            if (part.u < 0) part.u += 1;

            this._pointOn(part.line, part.u, p);
            pos[i * 3]     = p.x;
            pos[i * 3 + 1] = p.y;
            pos[i * 3 + 2] = p.z;

            c.copy(this.colorA).lerp(this.colorB, part.u).multiplyScalar(1.6);
            col[i * 3]     = c.r;
            col[i * 3 + 1] = c.g;
            col[i * 3 + 2] = c.b;
        }

        this._partPos.needsUpdate = true;
        this._partCol.needsUpdate = true;
    }
}
