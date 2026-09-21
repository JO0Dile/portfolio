/* ============================================================
   PanelRig.js — four drones carry the panel
   ------------------------------------------------------------
   Replaces WorldStructure. Public surface:

       setPose(name)        12 poses, eased
       setAccentColor(hex)
       update(dt)
       attachPanels(panels) so it can move what it carries
       setTransit(u, dir)   0 parked, 1 mid-haul between slots

   MOTION
   Nothing here is a raw sine written onto a transform. Each drone
   has a station and chases it with a spring, so it lags, overshoots
   and settles. Bank and pitch are read back OUT of that velocity,
   the way a real quadcopter leans into a move, and rotor RPM
   follows the same signal.

   POSE
   A pose is an ATTITUDE, not an offset. It says how the panel is
   turned — pitched back, yawed away, rolled crooked, flipped — and
   the drones' grip points are then rotated by that same orientation.
   Tip the panel back and the top pair fly up and away on their own;
   nobody wrote numbers for that. It is the difference between
   choreographing four dots and carrying an object.

   A pose also says WHERE each drone grips (anchors), how far past
   the grip it sits (out / up), and whether it lets go entirely and
   circles instead (roam). Four drones welded to four corners is what
   made this read as furniture.
   ============================================================ */

import * as THREE from 'three';
import { Drone } from '../projects/Drone.js';
import { PANEL_W, PANEL_H } from '../projects/ProjectPanels.js';

/* Must track ProjectPanels' PANEL_Y / PANEL_Z, which are private to
   that module. If you move the panel, move these with it. */
const PANEL_Y = 4.85;
const PANEL_Z = 4.0;

const DRONE_SCALE = 1.8;
const OFFSET_Z = -0.55;          // formation sits behind the panel face

const POSE_DURATION = 1.15;

/* Flight feel. Stiff enough to look powered, damped enough that it
   does not wobble like jelly. */
const DRONE_STIFF = 30;
const DRONE_DAMP  = 8.0;

/* The panel is heavier than the drones, so it lags further behind. */
const PANEL_STIFF = 15;
const PANEL_DAMP  = 5.6;

/* TL, TR, BL, BR, in half-extent units: [-1, 1] is the top-left
   corner whatever size and shape the panel happens to be. */
const CORNER = [[-1, 1], [1, 1], [-1, -1], [1, -1]];

/* How much each drone lags into a haul. The stagger is what makes it
   read as carrying rather than sliding. */
const LEAD_BIAS = [0.00, 0.14, 0.07, 0.21];

const _WHITE = new THREE.Color(0xffffff);

/* The things that come at you at the end. One Points cloud rather than
   44 sprites, so it is a single draw call and a single texture -- this
   has to survive a phone. They all travel at the same rate; what makes
   them arrive at different moments is a fixed offset each, so at any
   instant they are spread the length of the run. */
const MOTE_COUNT  = 44;
const MOTE_FAR    = -46;      // where they fade in, well past the drones
const MOTE_NEAR   = 26;       // past the camera
const MOTE_SECONDS = 12;      // one end to the other

/* ── The twelve presentations ────────────────────────────────────
   pitch  -  negative leans the panel back, positive looms it forward
   yaw    -  positive pushes the right edge away
   roll   -  in-plane, PI is upside down
   edgeOn -  extra yaw while hauling, so it flies in as a sliver and
             swings open as it parks
   out    -  per drone, distance past its grip point
   up     -  per drone, extra world-space height
   roam   -  per drone, 0 holds the grip, 1 lets go and orbits
   ---------------------------------------------------------------- */
const POSES = {
    /* J — idle. Two hold, two break formation and drift. */
    neutral: {
        letter: 'J', pitch: 0, yaw: 0, roll: 0,
        side: 0, lift: 0, depth: 0, spread: 1.00, edgeOn: 0, camRoll: 0,
        anchors: CORNER,
        out: [1.10, 1.10, 1.10, 1.10],
        up:  [0.35, 0.35, -0.20, -0.20],
        roam: [0, 0, 1, 1]
    },

    /* B — leaned back like a drafting table. */
    about: {
        letter: 'B', pitch: -0.42, yaw: 0.06, roll: 0.03,
        side: 0, lift: 0.18, depth: -0.25, spread: 0.96, edgeOn: 0, camRoll: 0.015,
        anchors: CORNER,
        out: [1.00, 1.00, 1.15, 1.15],
        up:  [0.50, 0.50, -0.15, -0.15],
        roam: [0, 0, 0, 0]
    },

    /* D — hung crooked. One drone visibly higher than the other, and
       it never quite settles. The narrative's hand is a child of the
       panel group, so it stays on its marks through the tilt. */
    aaup: {
        letter: 'D', pitch: -0.05, yaw: -0.10, roll: 0.20,
        side: 0, lift: 0.05, depth: 0, spread: 1.04, edgeOn: 0, camRoll: -0.02,
        anchors: CORNER,
        out: [1.28, 0.84, 1.10, 1.10],
        up:  [0.64, 0.10, -0.20, -0.20],
        roam: [0, 0, 0, 0.90]
    },

    /* F — looming, bottom edge almost in your face. */
    construction: {
        letter: 'F', pitch: 0.40, yaw: -0.08, roll: -0.04,
        side: 0, lift: -0.15, depth: 0.30, spread: 1.10, edgeOn: 0, camRoll: 0.03,
        anchors: CORNER,
        out: [1.20, 1.20, 0.95, 0.95],
        up:  [0.70, 0.70, -0.35, -0.35],
        roam: [0, 0, 0, 0]
    },

    /* C — turned away, one edge near and one far. */
    rlscientist: {
        letter: 'C', pitch: 0.06, yaw: 0.38, roll: -0.03,
        side: -0.25, lift: 0.30, depth: -0.15, spread: 0.98, edgeOn: 0, camRoll: -0.025,
        anchors: CORNER,
        out: [0.90, 1.30, 0.90, 1.30],
        up:  [0.40, 0.55, -0.20, -0.20],
        roam: [0, 0, 0, 0]
    },

    /* L — arrives edge on and swings open as it parks. Not a pose so
       much as a move: the haul carries a thin sliver, and the panel
       rotates open in the last moment. */
    listinglab: {
        letter: 'L', pitch: 0.04, yaw: 0.10, roll: 0.02,
        side: 0, lift: 0.10, depth: 0.05, spread: 1.05, edgeOn: 1.45, camRoll: 0.02,
        anchors: CORNER,
        out: [1.15, 1.15, 1.15, 1.15],
        up:  [0.45, 0.45, -0.20, -0.20],
        roam: [0, 0, 0, 0]
    },

    /* G — carried flat, a board you look down into. A maze is a
       top-down thing, so let it be one. */
    aimaze: {
        letter: 'G', pitch: -0.98, yaw: 0.05, roll: 0.02,
        side: 0, lift: -0.45, depth: 0.50, spread: 1.06, edgeOn: 0, camRoll: -0.035,
        anchors: CORNER,
        out: [0.85, 0.85, 0.85, 0.85],
        up:  [1.45, 1.45, 2.35, 2.35],
        roam: [0, 0, 0, 0]
    },

    /* E — portrait. halfW / halfH come from the panel itself, so the
       grips pinch a narrow tall thing without being told it is one. */
    languages: {
        letter: 'E', pitch: -0.06, yaw: -0.18, roll: -0.02,
        side: 0.15, lift: 0.15, depth: -0.10, spread: 1.00, edgeOn: 0, camRoll: 0.018,
        anchors: [[-0.55, 1], [0.55, 1], [-0.55, -1], [0.55, -1]],
        out: [0.80, 0.80, 0.80, 0.80],
        up:  [0.55, 0.55, -0.35, -0.35],
        roam: [0, 0, 0, 0]
    },

    /* I — bent around you, so the grips sit out on the wrapped edges. */
    frameworks: {
        letter: 'I', pitch: 0.02, yaw: 0.04, roll: 0,
        side: 0, lift: 0, depth: 0.35, spread: 1.00, edgeOn: 0, camRoll: -0.022,
        anchors: [[-1.04, 1], [1.04, 1], [-1.04, -1], [1.04, -1]],
        out: [1.35, 1.35, 1.35, 1.35],
        up:  [0.50, 0.50, -0.25, -0.25],
        roam: [0, 0, 0, 0]
    },

    /* H — three plates in depth, three drones on them, one loose. */
    aidata: {
        letter: 'H', pitch: -0.04, yaw: 0.24, roll: 0.02,
        side: -0.20, lift: 0.22, depth: -0.20, spread: 1.00, edgeOn: 0, camRoll: 0.026,
        anchors: [[-1, 1], [0.02, 1.12], [1, 1], [0.50, -1]],
        out: [0.95, 0.80, 0.95, 1.00],
        up:  [0.50, 0.75, 0.50, -0.30],
        roam: [0, 0, 0, 0.85]
    },

    /* K — upside down. Your call, and the one I would still argue
       with: nobody reads inverted text, so this slot stops doing its
       job while it is like this. Set roll to 0 and it is a normal
       panel again — that is the whole change. The drones end up
       underneath on their own, because the grips rotate with it. */
    other: {
        letter: 'K', pitch: -0.04, yaw: -0.06, roll: Math.PI,
        side: 0, lift: -0.05, depth: 0.10, spread: 1.02, edgeOn: 0, camRoll: -0.02,
        anchors: CORNER,
        out: [1.10, 1.10, 1.10, 1.10],
        up:  [-0.50, -0.50, 0.28, 0.28],
        roam: [0, 0, 0, 0]
    },

    /* A — square on. The sign is the one thing that has to read clean,
       so it gets no attitude at all. */
    contact: {
        letter: 'A', pitch: 0, yaw: 0, roll: 0,
        side: 0, lift: -0.60, depth: -0.85, spread: 1.38, edgeOn: 0, camRoll: 0,
        anchors: CORNER,
        out: [1.30, 1.30, 1.30, 1.30],
        up:  [0.50, 0.50, -0.30, -0.30],
        roam: [0, 0, 0, 0]
    }
};

const SCALARS = ['pitch', 'yaw', 'roll', 'side', 'lift', 'depth', 'spread', 'edgeOn', 'camRoll'];
const QUADS   = ['out', 'up', 'roam'];

function clonePose(p) {
    const o = {};
    for (const k of SCALARS) o[k] = p[k];
    for (const k of QUADS) o[k] = p[k].slice();
    o.anchors = p.anchors.map(a => a.slice());
    return o;
}

function lerpPose(out, a, b, k) {
    for (const key of SCALARS) out[key] = a[key] + (b[key] - a[key]) * k;
    for (const key of QUADS) {
        const oa = a[key], ob = b[key], oo = out[key];
        for (let i = 0; i < 4; i++) oo[i] = oa[i] + (ob[i] - oa[i]) * k;
    }
    for (let i = 0; i < 4; i++) {
        const aa = a.anchors[i], bb = b.anchors[i], cc = out.anchors[i];
        cc[0] = aa[0] + (bb[0] - aa[0]) * k;
        cc[1] = aa[1] + (bb[1] - aa[1]) * k;
    }
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function smooth01(u) {
    const t = u < 0 ? 0 : u > 1 ? 1 : u;
    return t * t * (3 - 2 * t);
}
function easeInOut(u) {
    return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
}

function makeSignTexture() {
    const W = 1024, H = 320;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#4d8bf5';
    ctx.fillRect(0, 56, 4, H - 112);
    ctx.fillStyle = '#ededf0';
    ctx.font = '600 62px "Inter", sans-serif';
    ctx.fillText('Have something worth building?', 34, 118);
    ctx.fillStyle = '#9096a0';
    ctx.font = '400 34px "Inter", sans-serif';
    ctx.fillText('a.natsha1@student.aaup.edu', 36, 180);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(34, 218, W - 120, 1);
    ctx.fillStyle = '#3fca7d';
    ctx.beginPath();
    ctx.arc(46, 256, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '600 24px "JetBrains Mono", monospace';
    ctx.fillText('AVAILABLE', 68, 264);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

/* The eleventh panel: a frame with nothing in it. Deliberately empty,
   so it stays correct until there is something to put in it. */
function makeFrameTexture() {
    const W = 1024, H = 640;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    const m = 26;
    ctx.strokeStyle = 'rgba(120, 165, 235, 0.70)';
    ctx.lineWidth = 3;
    ctx.setLineDash([16, 11]);
    ctx.strokeRect(m, m, W - m * 2, H - m * 2);
    ctx.setLineDash([]);

    // Corner ticks, so it reads as a frame waiting rather than a box.
    ctx.strokeStyle = 'rgba(165, 205, 255, 0.95)';
    ctx.lineWidth = 5;
    const c = 54;
    const corners = [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]];
    for (const [x, y, sx, sy] of corners) {
        ctx.beginPath();
        ctx.moveTo(x + sx * c, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + sy * c);
        ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(200, 222, 252, 0.94)';
    ctx.font = '600 86px "Inter", sans-serif';
    ctx.fillText('yours?', W / 2, H / 2 + 12);

    ctx.fillStyle = 'rgba(125, 155, 195, 0.65)';
    ctx.font = '500 26px "JetBrains Mono", monospace';
    ctx.fillText('slot 11 · not built yet', W / 2, H / 2 + 66);
    ctx.textAlign = 'left';

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

export class PanelRig {
    constructor(scene, cameraDirector, quality) {
        this.scene = scene;
        this.cameraDirector = cameraDirector;
        this.elapsed = 0;
        this.panels = null;

        this.group = new THREE.Group();
        this.group.position.set(0, PANEL_Y, PANEL_Z);
        scene.add(this.group);

        this.accent = new THREE.Color(0x4d8bf5);
        this._targetAccent = new THREE.Color(0x4d8bf5);

        this.currentPose = clonePose(POSES.neutral);
        this.fromPose    = clonePose(POSES.neutral);
        this.targetPose  = POSES.neutral;
        this.poseT = 1;
        this._lastPoseName = 'neutral';

        // Haul state
        this.transit = 0;
        this._transitShown = 0;
        this.transitDir = 1;

        // What the panel actually is this frame, read back from it
        this._quat = new THREE.Quaternion();
        this.halfW = PANEL_W / 2;
        this.halfH = PANEL_H / 2;

        // Panel pendulum
        this.panelPos   = new THREE.Vector3();
        this.panelVel   = new THREE.Vector3();
        this.panelRoll  = 0;
        this.panelPitch = 0;
        this.panelYaw   = 0;

        this.drones = [];
        this.tethers = [];

        this._buildDrones();
        this._buildTethers();
        this._buildSign();
        this._buildFrame();

        this._tmp      = new THREE.Vector3();
        this._off      = new THREE.Vector3();
        this._push     = new THREE.Vector3();
        this._orb      = new THREE.Vector3();
        this._centroid = new THREE.Vector3();
        this._meanOff  = new THREE.Vector3();

        if (quality && quality.register) {
            quality.register((level) => {
                const on = level !== 'low';
                this.tethers.forEach(t => { t.line.visible = on; });
            });
        }
    }

    _buildDrones() {
        for (let i = 0; i < 4; i++) {
            const d = new Drone({ color: 0x4d8bf5, scale: DRONE_SCALE, carrier: true });

            // Drone forces renderOrder 30 so it can draw over a panel as a
            // cursor. In the rig it is world geometry — depth-sort normally.
            d.group.traverse(c => { c.renderOrder = 0; });
            d.setVisible(true);
            this.group.add(d.group);

            const [sx, sy] = CORNER[i];
            this.drones.push({
                drone: d,
                phase: i * 2.399,                 // never lines up between drones
                lead: LEAD_BIAS[i],
                anchor: new THREE.Vector3(),
                pos:    new THREE.Vector3(sx * (PANEL_W / 2 + 1.1), sy * (PANEL_H / 2 + 0.9), OFFSET_Z),
                vel:    new THREE.Vector3(),
                target: new THREE.Vector3()
            });
        }
    }

    _buildTethers() {
        for (let i = 0; i < 4; i++) {
            const geo = new THREE.BufferGeometry();
            // 3 points, so the line can sag when it is not under load
            geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));

            const mat = new THREE.LineBasicMaterial({
                color: 0x4d8bf5,
                transparent: true,
                opacity: 0.7,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                toneMapped: false
            });

            const line = new THREE.Line(geo, mat);
            line.frustumCulled = false;
            this.group.add(line);
            this.tethers.push({ line, geo, mat, attr: geo.getAttribute('position') });
        }
    }

    _buildSign() {
        this.signMat = new THREE.MeshBasicMaterial({
            map: makeSignTexture(),
            transparent: true,
            opacity: 0,
            depthWrite: false,
            toneMapped: false
        });
        this.sign = new THREE.Mesh(new THREE.PlaneGeometry(9.0, 2.81), this.signMat);
        this.sign.position.set(0, -3.8, -1.2);
        this.sign.visible = false;
        this.group.add(this.sign);

        this.signOpacity = 0;
        this.targetSignOpacity = 0;
    }

    _buildFrame() {
        this.frameMat = new THREE.MeshBasicMaterial({
            map: makeFrameTexture(),
            transparent: true,
            opacity: 0,
            depthWrite: false,
            toneMapped: false
        });
        this.frame = new THREE.Mesh(new THREE.PlaneGeometry(PANEL_W, PANEL_H), this.frameMat);
        this.frame.visible = false;
        this.frame.renderOrder = 12;
        this.group.add(this.frame);

        // Something a long way off, coming this way. Not another copy of
        // the frame -- a different thing entirely, starting out beyond
        // where the drones went and taking its time.
        const MS = 256;
        const mc = document.createElement('canvas');
        mc.width = mc.height = MS;
        const mctx = mc.getContext('2d');
        const mg = mctx.createRadialGradient(MS / 2, MS / 2, 0, MS / 2, MS / 2, MS / 2);
        mg.addColorStop(0.00, 'rgba(255, 255, 255, 0.98)');
        mg.addColorStop(0.09, 'rgba(214, 234, 255, 0.86)');
        mg.addColorStop(0.28, 'rgba(112, 166, 246, 0.36)');
        mg.addColorStop(0.60, 'rgba(58, 100, 190, 0.11)');
        mg.addColorStop(1.00, 'rgba(0, 0, 0, 0)');
        mctx.fillStyle = mg;
        mctx.fillRect(0, 0, MS, MS);

        const moteTex = new THREE.CanvasTexture(mc);
        moteTex.minFilter = THREE.LinearFilter;

        this.approachMat = new THREE.PointsMaterial({
            map: moteTex,
            size: 2.7,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this._motePos = new Float32Array(MOTE_COUNT * 3);
        this._moteCol = new Float32Array(MOTE_COUNT * 3);
        const moteGeo = new THREE.BufferGeometry();
        moteGeo.setAttribute('position', new THREE.BufferAttribute(this._motePos, 3));
        moteGeo.setAttribute('color', new THREE.BufferAttribute(this._moteCol, 3));
        moteGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400);

        // Lanes on a golden-angle spiral, so they never line up into rows
        // and you fly into a field rather than down a queue.
        this._moteLane = [];
        for (let i = 0; i < MOTE_COUNT; i++) {
            const a = i * 2.39996;
            const r = Math.sqrt((i + 0.5) / MOTE_COUNT) * 22;
            this._moteLane.push({
                x: Math.cos(a) * r,
                y: Math.sin(a) * r * 0.78,
                off: i / MOTE_COUNT          // same speed, different start
            });
        }

        this.approach = new THREE.Points(moteGeo, this.approachMat);
        this.approach.frustumCulled = false;
        this.approach.visible = false;
        this.approach.renderOrder = 13;
        this.group.add(this.approach);

        this._moteT = 0;
        this._moteColor = new THREE.Color();

        this.farewell = 0;
        this._fwShown = 0;
    }

    // ========================================================
    // PUBLIC
    // ========================================================

    /* Lets the rig move the panel instead of hovering beside it. */
    attachPanels(panels) { this.panels = panels; }

    /* u: 0 parked on a slot, 1 at the midpoint between two.
       dir: +1 moving to a later slot, -1 to an earlier one. */
    setTransit(u, dir) {
        this.transit = clamp(u, 0, 1);
        if (dir) this.transitDir = dir;
    }

    setPose(name) {
        const pose = POSES[name] || POSES.neutral;
        if (name === this._lastPoseName) return;
        this._lastPoseName = name;

        this.fromPose = clonePose(this.currentPose);
        this.targetPose = pose;
        this.poseT = 0;

        this.targetSignOpacity = (name === 'contact') ? 1 : 0;

        if (this.cameraDirector && this.cameraDirector.setRoll) {
            this.cameraDirector.setRoll(pose.camRoll);
        }
    }

    setAccentColor(hex) { this._targetAccent.set(hex); }

    /* 0 while the contact section is arriving, 1 at the very bottom of
       the page. Drives the whole ending. */
    setFarewell(u) { this.farewell = clamp(u || 0, 0, 1); }

    update(dt) {
        this.elapsed += dt;
        const t = this.elapsed;

        // ── Pose easing ──
        if (this.poseT < 1) {
            this.poseT = Math.min(1, this.poseT + dt / POSE_DURATION);
            lerpPose(this.currentPose, this.fromPose, this.targetPose, easeInOut(this.poseT));
        }
        const P = this.currentPose;

        // ── Accent ──
        const ck = 1 - Math.exp(-2.5 * dt);
        this.accent.lerp(this._targetAccent, ck);
        const hex = this.accent.getHex();
        for (const d of this.drones) d.drone.setColor(hex);
        for (const tt of this.tethers) tt.mat.color.copy(this.accent);

        // ── Haul ──
        const smoothT = 1 - Math.exp(-7 * dt);
        this._transitShown += (this.transit - this._transitShown) * smoothT;
        const hv = easeInOut(this._transitShown);
        const dir = this.transitDir;

        const carryX = dir * hv * 6.2;
        const carryY = -hv * 1.35;
        const carryZ = -hv * 2.1;
        const gripMul = 1 - hv * 0.16;   // formation tightens to carry

        // ── The ending ──
        // Both halves come off one scroll value, so they cannot get out
        // of step with each other. First the empty frame is brought
        // forward and held out to you; then the drones take it and go.
        this._fwShown += (this.farewell - this._fwShown) * (1 - Math.exp(-5 * dt));
        const f = this._fwShown;
        const comeUp = smooth01((f - 0.03) / 0.19);   // in and forward
        const depart = smooth01((f - 0.34) / 0.24);   // then away

        const fwY     = comeUp * 0.35 + depart * 8.0;
        const fwZ     = comeUp * 2.40 - depart * 30.0;
        const fwGrip  = 1 - depart * 0.50;      // they close in around it to carry
        const fwScale = 1 + comeUp * 0.08 - depart * 0.62;
        const fwOpacity = Math.min(
            smooth01((f - 0.02) / 0.14),
            1 - smooth01((f - 0.56) / 0.16)
        );

        // ── How the panel is actually turned, and how big it is ──
        // Read back from the panel itself, so a portrait panel or a
        // three-plate one gets gripped correctly without the rig
        // knowing anything about forms.
        const frame = this.panels && this.panels.getRigFrame ? this.panels.getRigFrame() : null;
        if (frame) {
            this._quat.copy(frame.quat);
            this.halfW = frame.halfW;
            this.halfH = frame.halfH;
        }

        // ── Drone stations ──
        this._centroid.set(0, 0, 0);
        this._meanOff.set(0, 0, 0);
        let totalSpeed = 0;

        for (let i = 0; i < 4; i++) {
            const d = this.drones[i];
            const ph = d.phase;
            const a = P.anchors[i];

            // The grip point on the panel, turned by the panel's own
            // orientation. This is the whole trick: tip the panel back
            // and the top pair fly up and away by themselves.
            const gx = a[0] * this.halfW * P.spread * gripMul * fwGrip;
            const gy = a[1] * this.halfH * P.spread * gripMul * fwGrip;
            this._off.set(gx, gy, 0).applyQuaternion(this._quat);
            d.anchor.copy(this._off);          // the tether lands here

            // Then push the drone out past the grip along the same line.
            const len = Math.hypot(gx, gy) || 1;
            this._push
                .set(gx / len * P.out[i], gy / len * P.out[i], 0)
                .applyQuaternion(this._quat);
            this._off.add(this._push);
            this._off.y += P.up[i];

            this._meanOff.add(this._off);

            // Station keeping: layered, incommensurate, never visibly
            // repeats and never syncs across the four.
            const nx = Math.sin(t * 0.63 + ph) * 0.085 + Math.sin(t * 1.47 + ph * 2.3) * 0.042;
            const ny = Math.sin(t * 0.48 + ph * 1.7) * 0.105 + Math.sin(t * 1.19 + ph) * 0.038;
            const nz = Math.sin(t * 0.71 + ph * 0.9) * 0.075;

            const lag = 1 - d.lead * hv;

            d.target.set(
                P.side  + this._off.x + carryX * lag + nx,
                P.lift  + this._off.y + carryY * lag + ny + fwY,
                P.depth + this._off.z + OFFSET_Z + carryZ * lag + nz + fwZ
            );

            // A roaming drone lets go and circles the panel instead.
            if (P.roam[i] > 0.001) {
                const orb = t * 0.55 + ph;
                this._orb.set(
                    P.side  + Math.cos(orb) * (this.halfW + 1.5),
                    P.lift  + Math.sin(orb * 1.3) * (this.halfH * 0.75) + 0.20,
                    P.depth + OFFSET_Z + Math.sin(orb) * 1.8
                );
                d.target.lerp(this._orb, P.roam[i]);
            }

            // Spring toward the station
            this._tmp.copy(d.target).sub(d.pos).multiplyScalar(DRONE_STIFF);
            d.vel.addScaledVector(this._tmp, dt);
            d.vel.multiplyScalar(Math.exp(-DRONE_DAMP * dt));
            d.pos.addScaledVector(d.vel, dt);

            const g = d.drone.group;
            g.position.copy(d.pos);

            // Bank read back out of velocity — lean into the move
            g.rotation.z = clamp(-d.vel.x * 0.135, -0.55, 0.55);
            g.rotation.x = clamp(d.vel.z * 0.115, -0.42, 0.42);
            g.rotation.y = clamp(-d.vel.x * 0.045, -0.30, 0.30);

            const speed = d.vel.length();
            totalSpeed += speed;
            d.drone.setLoad(speed * 0.16 + hv * 0.35);
            d.drone.update(dt);

            this._centroid.add(d.pos);
        }

        this._centroid.multiplyScalar(0.25);
        this._meanOff.multiplyScalar(0.25);
        const avgSpeed = totalSpeed * 0.25;

        // ── The panel hangs off where the drones actually got to ──
        // Not off where they were told to go. That gap IS the swing:
        // subtract the stations' mean offset and what is left over is
        // the formation's error, which the panel inherits.
        this._tmp.copy(this._centroid).sub(this._meanOff);
        this._tmp.z -= OFFSET_Z;
        this._tmp.sub(this.panelPos).multiplyScalar(PANEL_STIFF);
        this.panelVel.addScaledVector(this._tmp, dt);
        this.panelVel.multiplyScalar(Math.exp(-PANEL_DAMP * dt));
        this.panelPos.addScaledVector(this.panelVel, dt);

        // ── Attitude: the pose, plus sway read out of its own velocity ──
        const swayRoll  = clamp(-this.panelVel.x * 0.055, -0.20, 0.20);
        const swayPitch = clamp( this.panelVel.y * 0.045, -0.16, 0.16);
        const swayYaw   = clamp(-this.panelVel.x * 0.030, -0.14, 0.14);

        const ak = 1 - Math.exp(-7 * dt);
        this.panelRoll  += ((P.roll  + swayRoll)  - this.panelRoll)  * ak;
        this.panelPitch += ((P.pitch + swayPitch) - this.panelPitch) * ak;
        this.panelYaw   += ((P.yaw + P.edgeOn * hv + swayYaw) - this.panelYaw) * ak;

        if (this.panels && this.panels.setRig) {
            this.panels.setRig(
                this.panelPos.x, this.panelPos.y, this.panelPos.z,
                this.panelRoll, this.panelPitch, this.panelYaw
            );
        }

        // ── Tethers, taut under load and slack at rest ──
        const sag = 0.22 * Math.max(0, 1 - avgSpeed * 0.5);
        for (let i = 0; i < 4; i++) {
            const d = this.drones[i];

            const ax = this.panelPos.x + d.anchor.x;
            const ay = this.panelPos.y + d.anchor.y;
            const az = this.panelPos.z + d.anchor.z;

            const T = this.tethers[i];
            const arr = T.attr.array;
            arr[0] = d.pos.x; arr[1] = d.pos.y; arr[2] = d.pos.z;
            arr[3] = (d.pos.x + ax) * 0.5;
            arr[4] = (d.pos.y + ay) * 0.5 - sag;
            arr[5] = (d.pos.z + az) * 0.5;
            arr[6] = ax; arr[7] = ay; arr[8] = az;

            T.attr.needsUpdate = true;
            T.geo.computeBoundingSphere();

            // A drone that has let go has nothing to hold.
            T.mat.opacity = (0.55 + Math.min(0.4, avgSpeed * 0.28)) * (1 - P.roam[i] * 0.96);
        }

        // ── The eleventh frame ──
        // It hangs off panelPos like any other panel would, so it swings
        // on the tethers and banks with the formation for free.
        this.frameMat.opacity = fwOpacity;
        this.frame.visible = fwOpacity > 0.01;
        if (this.frame.visible) {
            this.frame.position.copy(this.panelPos);
            this.frame.quaternion.copy(this._quat);
            this.frame.rotateX(comeUp * 0.30 - depart * 0.55);
            this.frame.scale.setScalar(Math.max(0.05, fwScale));
        }

        // ── they keep coming ──
        // The field starts once the drones are away and then runs on its
        // own clock, so nothing freezes if you sit at the bottom of the
        // page. The z travel is LINEAR and identical for all of them --
        // perspective does the accelerating, the way it does in life, so
        // each one creeps for a long time and only rushes at the end.
        const fieldOn = smooth01((f - 0.46) / 0.14);
        this.approachMat.opacity = fieldOn * 0.95;
        this.approach.visible = fieldOn > 0.01;

        if (this.approach.visible) {
            this._moteT += dt / MOTE_SECONDS;

            this._moteColor.copy(this.accent).lerp(_WHITE, 0.5);
            const cr = this._moteColor.r, cg = this._moteColor.g, cb = this._moteColor.b;

            for (let i = 0; i < MOTE_COUNT; i++) {
                const L = this._moteLane[i];
                let u = (this._moteT - L.off) % 1;
                if (u < 0) u += 1;

                const k = i * 3;
                this._motePos[k]     = L.x + 0.9;
                // Biased down: the contact copy sits high in frame and
                // the bottom half was coming up empty.
                this._motePos[k + 1] = L.y - 1.1 + u * 1.4;
                this._motePos[k + 2] = MOTE_FAR + u * (MOTE_NEAR - MOTE_FAR);

                // Dark at both ends, so the wrap back to the far side is
                // never something you can catch happening.
                const b = Math.min(smooth01(u / 0.10), 1 - smooth01((u - 0.88) / 0.12));
                this._moteCol[k]     = cr * b;
                this._moteCol[k + 1] = cg * b;
                this._moteCol[k + 2] = cb * b;
            }

            this.approach.geometry.attributes.position.needsUpdate = true;
            this.approach.geometry.attributes.color.needsUpdate = true;
        }

        // ── Contact sign ──
        // Steps aside once the frame is out front, so the two are never
        // competing for the same sentence.
        const sk = 1 - Math.exp(-3.2 * dt);
        this.signOpacity += (this.targetSignOpacity - this.signOpacity) * sk;
        this.signMat.opacity = this.signOpacity * (1 - comeUp * 0.85);
        this.sign.visible = this.signMat.opacity > 0.01;
    }
}
