/* ============================================================
   FormationBuilder.js — refined formations
   Each shape: layered, structured, with emphasis fragments
   ============================================================ */

import * as THREE from 'three';

const CORE_Y = 4;

// ── Utilities ──────────────────────────────────────────────
function randQuat() {
    return new THREE.Quaternion().setFromEuler(new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    ));
}

function flatQuat() {
    return new THREE.Quaternion().setFromEuler(
        new THREE.Euler(-Math.PI / 2, 0, 0)
    );
}

// Returns a random point inside a small sphere for jitter
function jitter(amount = 0.15) {
    return new THREE.Vector3(
        (Math.random() - 0.5) * amount,
        (Math.random() - 0.5) * amount,
        (Math.random() - 0.5) * amount
    );
}

// ══════════════════════════════════════════════════════════
// 01 — AAUP ACADEMIC PLANNER
// Concept: ascending knowledge stack — tiers of plates
// ══════════════════════════════════════════════════════════
function buildAAUP(count) {
    const positions = [];
    const rotations = [];

    const levels = 7;
    const perLevel = Math.ceil(count / levels);

    for (let i = 0; i < count; i++) {
        const level = Math.floor(i / perLevel);
        const inLevel = i % perLevel;
        const levelT = level / (levels - 1);

        // Y position — rising, with slight ease so top is closer
        const y = CORE_Y - 3.8 + levelT * 8.2;

        // Width tapers upward (pyramid feel)
        const width = 6.2 - levelT * 3.0;
        const gridSide = Math.ceil(Math.sqrt(perLevel));
        const col = inLevel % gridSide;
        const row = Math.floor(inLevel / gridSide);

        const spacing = width / gridSide;
        const x = (col - (gridSide - 1) / 2) * spacing;
        const z = (row - (gridSide - 1) / 2) * spacing;

        const pos = new THREE.Vector3(
            x + (Math.random() - 0.5) * 0.14,
            y + (Math.random() - 0.5) * 0.05,
            z + (Math.random() - 0.5) * 0.14
        );
        positions.push(pos);

        // Top and bottom tiers tilt slightly — middle tiers flat
        const tiltAmount = Math.abs(levelT - 0.5) * 0.5;
        const q = flatQuat();
        q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(
            (Math.random() - 0.5) * tiltAmount,
            Math.random() * Math.PI * 2,
            (Math.random() - 0.5) * tiltAmount
        )));
        rotations.push(q);
    }

    return { positions, rotations };
}

// ══════════════════════════════════════════════════════════
// 02 — CONSTRUCTION & TRADES
// Concept: heavy truss — pillars + diagonal bracing + top beam
// ══════════════════════════════════════════════════════════
function buildConstruction(count) {
    const positions = [];
    const rotations = [];

    // Budget: 30% pillars, 45% braces, 15% top beam, 10% base plates
    const pillarN  = Math.floor(count * 0.30);
    const braceN   = Math.floor(count * 0.45);
    const topN     = Math.floor(count * 0.15);
    const baseN    = count - pillarN - braceN - topN;

    const height = 9.5;
    const pillarX = 2.8;

    // Pillars — two vertical columns
    for (let i = 0; i < pillarN; i++) {
        const t = i / (pillarN - 1);
        const y = CORE_Y - height / 2 + t * height;
        const left = (i % 2 === 0);
        positions.push(new THREE.Vector3(
            (left ? -pillarX : pillarX) + (Math.random() - 0.5) * 0.22,
            y + (Math.random() - 0.5) * 0.15,
            (Math.random() - 0.5) * 0.22
        ));
        // Pillar fragments aligned vertically
        rotations.push(new THREE.Quaternion().setFromEuler(
            new THREE.Euler(0, Math.random() * 0.3, 0)
        ));
    }

    // Braces — X pattern between pillars, three sections up
    const braceSections = 4;
    for (let i = 0; i < braceN; i++) {
        const t = i / braceN;
        const section = Math.floor(t * braceSections);
        const within = (t * braceSections) - section;
        const sideFlip = (i % 2 === 0) ? 1 : -1; // alternate direction

        const y = CORE_Y - height / 2 + (section + within) * (height / braceSections);
        const x = -pillarX + within * (pillarX * 2) * (sideFlip > 0 ? 1 : -1) + (sideFlip > 0 ? 0 : pillarX * 2);
        const realX = sideFlip > 0
            ? -pillarX + within * (pillarX * 2)
            : pillarX - within * (pillarX * 2);

        positions.push(new THREE.Vector3(
            realX + (Math.random() - 0.5) * 0.15,
            y + (Math.random() - 0.5) * 0.15,
            (Math.random() - 0.5) * 0.35
        ));
        // Braces rotated to follow the diagonal
        rotations.push(new THREE.Quaternion().setFromEuler(
            new THREE.Euler(0, 0, sideFlip * 0.6 + (Math.random() - 0.5) * 0.2)
        ));
    }

    // Top beam — horizontal line across the top
    for (let i = 0; i < topN; i++) {
        const t = i / (topN - 1);
        positions.push(new THREE.Vector3(
            -pillarX + t * (pillarX * 2) + (Math.random() - 0.5) * 0.2,
            CORE_Y + height / 2 + (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2
        ));
        rotations.push(randQuat());
    }

    // Base plates — the foundation
    const baseSide = Math.ceil(Math.sqrt(baseN));
    for (let i = 0; i < baseN; i++) {
        const col = i % baseSide;
        const row = Math.floor(i / baseSide);
        const s = 3.2 / baseSide;
        positions.push(new THREE.Vector3(
            -1.6 + col * s + (Math.random() - 0.5) * 0.15,
            CORE_Y - height / 2 - 0.3,
            -1.6 + row * s + (Math.random() - 0.5) * 0.15
        ));
        rotations.push(flatQuat());
    }

    return { positions, rotations };
}

// ══════════════════════════════════════════════════════════
// 03 — RL-SCIENTIST
// Concept: experiment core — dense sphere + long spikes
// ══════════════════════════════════════════════════════════
function buildRLScientist(count) {
    const positions = [];
    const rotations = [];

    // 60% inner core, 40% radiating spikes
    const coreN = Math.floor(count * 0.6);
    const spikeN = count - coreN;

    // Inner core — dense, 2-layer sphere
    for (let i = 0; i < coreN; i++) {
        const layer = (i < coreN * 0.6) ? 0 : 1; // inner / outer shell
        const r = layer === 0 ? 1.35 + Math.random() * 0.25
                              : 2.05 + Math.random() * 0.35;

        const phi = Math.acos(2 * Math.random() - 1);
        const theta = Math.random() * Math.PI * 2;

        positions.push(new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            CORE_Y + r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
        ));

        // Inner shell rotates to face outward (shard-like)
        const dir = new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            Math.cos(phi),
            Math.sin(phi) * Math.sin(theta)
        );
        const q = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            dir
        );
        rotations.push(q);
    }

    // Spikes — 16 rays, each with 4-6 fragments extending outward
    const rayCount = 16;
    const perRay = Math.ceil(spikeN / rayCount);

    for (let s = 0; s < rayCount; s++) {
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = Math.random() * Math.PI * 2;
        const dir = new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            Math.cos(phi),
            Math.sin(phi) * Math.sin(theta)
        );

        for (let j = 0; j < perRay && positions.length < count; j++) {
            const r = 2.6 + (j / perRay) * 2.8;
            const pos = dir.clone().multiplyScalar(r);
            pos.y += CORE_Y;
            pos.x += (Math.random() - 0.5) * 0.18;
            pos.y += (Math.random() - 0.5) * 0.18;
            pos.z += (Math.random() - 0.5) * 0.18;

            positions.push(pos);

            // Spike fragments align to the ray
            rotations.push(new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                dir
            ));
        }
    }

    return { positions, rotations };
}

// ══════════════════════════════════════════════════════════
// 04 — LISTING LAB
// Concept: two facing structures exchanging — a marketplace
// ══════════════════════════════════════════════════════════
function buildListingLab(count) {
    const positions = [];
    const rotations = [];

    // 40% left shelf, 40% right shelf, 20% exchange stream in the middle
    const shelfN = Math.floor(count * 0.4);
    const streamN = count - shelfN * 2;

    function buildShelf(sideX, sign) {
        // Shelf: 4x4 grid of "items" arranged in a slight arc
        const cols = 4;
        const rows = 4;
        const perShelf = Math.floor(shelfN / 2);
        for (let i = 0; i < perShelf; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const colT = col / (cols - 1);
            const rowT = row / (rows - 1);

            // Arc shape — curves toward the center
            const x = sideX + sign * (0.4 + colT * 0.9);
            const y = CORE_Y - 2.4 + rowT * 4.8;
            const z = -1.6 + colT * 3.2;

            positions.push(new THREE.Vector3(
                x + (Math.random() - 0.5) * 0.15,
                y + (Math.random() - 0.5) * 0.15,
                z + (Math.random() - 0.5) * 0.15
            ));

            // Shelf items face outward toward the center
            rotations.push(new THREE.Quaternion().setFromEuler(
                new THREE.Euler(0, sign * Math.PI / 2 + (Math.random() - 0.5) * 0.3, 0)
            ));
        }
    }

    buildShelf(-3.4, 1);
    buildShelf( 3.4, -1);

    // Middle stream — fragments flowing from one side to the other
    for (let i = 0; i < streamN; i++) {
        const t = i / streamN;
        // Fragments spread along a horizontal line but with vertical wave
        const wave = Math.sin(t * Math.PI * 2) * 0.8;
        const x = -1.6 + t * 3.2;
        const y = CORE_Y + wave + (Math.random() - 0.5) * 0.4;
        const z = (Math.random() - 0.5) * 2.4;

        positions.push(new THREE.Vector3(x, y, z));
        // Stream fragments rotate along their direction of travel
        rotations.push(new THREE.Quaternion().setFromEuler(
            new THREE.Euler(0, Math.PI / 2, 0)
        ));
    }

    return { positions, rotations };
}

// ══════════════════════════════════════════════════════════
// 05 — AIMAZE
// Concept: lattice grid with one illuminated path
// ══════════════════════════════════════════════════════════
function buildAIMaze(count) {
    const positions = [];
    const rotations = [];

    const side = 4;
    const cell = side * side * side;
    const perCell = Math.max(1, Math.floor(count / cell));

    const size = 6.0;
    const halfSize = size / 2;
    const step = size / (side - 1);

    // Define a "path" through the lattice — a snaking route
    // Path cells get denser fragments + rotated orientation
    const path = new Set();
    // Path: (0,0,0) → (1,0,0) → (2,0,0) → (2,1,0) → (2,2,0)
    //       → (2,2,1) → (2,2,2) → (3,2,2) → (3,3,2) → (3,3,3)
    const pathCells = [
        [0,0,0],[1,0,0],[2,0,0],[2,1,0],[2,2,0],
        [2,2,1],[2,2,2],[3,2,2],[3,3,2],[3,3,3]
    ];
    pathCells.forEach(([x,y,z]) => path.add(`${x},${y},${z}`));

    let i = 0;
    for (let x = 0; x < side; x++) {
        for (let y = 0; y < side; y++) {
            for (let z = 0; z < side; z++) {
                const isPath = path.has(`${x},${y},${z}`);
                const density = isPath ? perCell * 2 : perCell;

                for (let k = 0; k < density && i < count; k++) {
                    const px = -halfSize + x * step;
                    const py = CORE_Y - halfSize + y * step;
                    const pz = -halfSize + z * step;

                    positions.push(new THREE.Vector3(
                        px + (Math.random() - 0.5) * 0.25,
                        py + (Math.random() - 0.5) * 0.25,
                        pz + (Math.random() - 0.5) * 0.25
                    ));

                    if (isPath) {
                        // Path fragments point along their travel direction
                        const q = new THREE.Quaternion().setFromEuler(
                            new THREE.Euler(0, Math.atan2(pz, px) + Math.PI / 2, 0)
                        );
                        rotations.push(q);
                    } else {
                        rotations.push(randQuat());
                    }
                    i++;
                }
            }
        }
    }

    // Fill any remainder
    while (positions.length < count) {
        positions.push(new THREE.Vector3(
            (Math.random() - 0.5) * size,
            CORE_Y + (Math.random() - 0.5) * size,
            (Math.random() - 0.5) * size
        ));
        rotations.push(randQuat());
    }

    return { positions, rotations };
}


// ══════════════════════════════════════════════════════════
// ABOUT — orbital identity
// Concept: a dense core with two tilted rings sweeping around it.
// Calm, personal, not a diagram. This is the first formation the
// viewer meets, so it reads as "a person" rather than "a system".
// ══════════════════════════════════════════════════════════
function buildAbout(count) {
    const positions = [];
    const rotations = [];

    const coreN      = Math.floor(count * 0.30);
    const ringN      = Math.floor(count * 0.52);
    const satelliteN = count - coreN - ringN;

    // 1) Dense central cluster
    for (let i = 0; i < coreN; i++) {
        const r = 0.9 + Math.pow(Math.random(), 0.6) * 1.1;
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = Math.random() * Math.PI * 2;
        positions.push(new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            CORE_Y + r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
        ));
        rotations.push(randQuat());
    }

    // 2) Two tilted rings crossing through the core
    const perRing = Math.floor(ringN / 2);
    const rings = [
        { radius: 4.3, tiltX:  0.62, tiltZ:  0.18 },
        { radius: 5.1, tiltX: -0.40, tiltZ:  0.74 }
    ];

    rings.forEach((ring, rIdx) => {
        const n = (rIdx === rings.length - 1) ? (ringN - perRing * rIdx) : perRing;
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            // Ring in the XZ plane, then tilted
            let x = Math.cos(a) * ring.radius;
            let z = Math.sin(a) * ring.radius;
            let y = 0;

            // rotate about X
            const cy = Math.cos(ring.tiltX), sy = Math.sin(ring.tiltX);
            const y1 = y * cy - z * sy;
            const z1 = y * sy + z * cy;
            // rotate about Z
            const cz = Math.cos(ring.tiltZ), sz = Math.sin(ring.tiltZ);
            const x2 = x * cz - y1 * sz;
            const y2 = x * sz + y1 * cz;

            const band = 0.22;
            positions.push(new THREE.Vector3(
                x2 + (Math.random() - 0.5) * band,
                CORE_Y + y2 + (Math.random() - 0.5) * band,
                z1 + (Math.random() - 0.5) * band
            ));

            // Fragments lie tangent to the ring so it reads as a band
            const tangent = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).normalize();
            rotations.push(new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(1, 0, 0), tangent
            ));
        }
    });

    // 3) Loose satellites far out
    for (let i = 0; i < satelliteN; i++) {
        const r = 6.5 + Math.random() * 2.2;
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = Math.random() * Math.PI * 2;
        positions.push(new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            CORE_Y + r * Math.cos(phi) * 0.55,
            r * Math.sin(phi) * Math.sin(theta)
        ));
        rotations.push(randQuat());
    }

    return { positions, rotations };
}

// ══════════════════════════════════════════════════════════
// LANGUAGES — stacked code slabs
// Concept: four horizontal planes of "code lines", stacked and
// slightly staggered in depth. Reads as an editor seen in 3D.
// ══════════════════════════════════════════════════════════
function buildLanguages(count) {
    const positions = [];
    const rotations = [];

    const slabs = 4;
    const perSlab = Math.ceil(count / slabs);

    // Indent pattern per line, as a fraction of full width — gives the
    // silhouette the ragged left edge that reads as code.
    const indents = [0.00, 0.10, 0.18, 0.18, 0.10, 0.00, 0.10, 0.26];
    const lengths = [0.72, 0.56, 0.64, 0.44, 0.50, 0.80, 0.38, 0.46];

    for (let s = 0; s < slabs; s++) {
        const slabY = CORE_Y - 3.4 + s * 2.35;
        const slabZ = -1.6 + s * 1.05;
        const fullW = 7.4;
        const linesPerSlab = 8;
        const perLine = Math.ceil(perSlab / linesPerSlab);

        for (let ln = 0; ln < linesPerSlab; ln++) {
            const lineY = slabY + (ln - (linesPerSlab - 1) / 2) * 0.30;
            const startX = -fullW / 2 + indents[ln % indents.length] * fullW;
            const runW = lengths[ln % lengths.length] * fullW;

            for (let k = 0; k < perLine; k++) {
                if (positions.length >= count) break;
                const u = perLine > 1 ? k / (perLine - 1) : 0;
                positions.push(new THREE.Vector3(
                    startX + u * runW + (Math.random() - 0.5) * 0.10,
                    lineY + (Math.random() - 0.5) * 0.10,
                    slabZ + (Math.random() - 0.5) * 0.34
                ));
                // Lie flat, aligned along the line direction
                rotations.push(new THREE.Quaternion().setFromEuler(
                    new THREE.Euler(0, 0, (Math.random() - 0.5) * 0.14)
                ));
            }
        }
    }

    while (positions.length < count) {
        positions.push(new THREE.Vector3(
            (Math.random() - 0.5) * 7.4,
            CORE_Y + (Math.random() - 0.5) * 7,
            (Math.random() - 0.5) * 3
        ));
        rotations.push(randQuat());
    }

    return { positions, rotations };
}

// ══════════════════════════════════════════════════════════
// FRAMEWORKS — service graph
// Concept: a dominant hub with four satellite services, joined by
// visible edges made of fragments. Mirrors the panel's diagram.
// ══════════════════════════════════════════════════════════
function buildFrameworks(count) {
    const positions = [];
    const rotations = [];

    const hub = new THREE.Vector3(0, CORE_Y, 0);
    const nodes = [
        new THREE.Vector3(-4.6, CORE_Y + 2.7, -0.9),  // Android
        new THREE.Vector3(-4.6, CORE_Y - 2.7,  0.9),  // Unity
        new THREE.Vector3( 4.6, CORE_Y + 2.7,  0.9),  // PostgreSQL
        new THREE.Vector3( 4.6, CORE_Y - 2.7, -0.9)   // Redis
    ];

    const hubN   = Math.floor(count * 0.24);
    const nodeN  = Math.floor(count * 0.40);
    const edgeN  = count - hubN - nodeN;
    const perNode = Math.floor(nodeN / nodes.length);
    const perEdge = Math.floor(edgeN / nodes.length);

    function cluster(centre, n, radius) {
        for (let i = 0; i < n; i++) {
            if (positions.length >= count) return;
            const r = Math.pow(Math.random(), 0.55) * radius;
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = Math.random() * Math.PI * 2;
            positions.push(new THREE.Vector3(
                centre.x + r * Math.sin(phi) * Math.cos(theta),
                centre.y + r * Math.cos(phi),
                centre.z + r * Math.sin(phi) * Math.sin(theta)
            ));
            rotations.push(randQuat());
        }
    }

    // Hub — bigger and denser than the satellites
    cluster(hub, hubN, 1.55);

    // Satellite services
    nodes.forEach(n => cluster(n, perNode, 1.05));

    // Edges — fragments strung along each hub-to-node line
    nodes.forEach(n => {
        const dir = new THREE.Vector3().subVectors(n, hub).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(1, 0, 0), dir
        );
        for (let i = 0; i < perEdge; i++) {
            if (positions.length >= count) return;
            // Keep clear of both cluster radii
            const u = 0.26 + (i / Math.max(1, perEdge - 1)) * 0.48;
            positions.push(new THREE.Vector3(
                THREE.MathUtils.lerp(hub.x, n.x, u) + (Math.random() - 0.5) * 0.16,
                THREE.MathUtils.lerp(hub.y, n.y, u) + (Math.random() - 0.5) * 0.16,
                THREE.MathUtils.lerp(hub.z, n.z, u) + (Math.random() - 0.5) * 0.16
            ));
            rotations.push(q.clone());
        }
    });

    while (positions.length < count) {
        cluster(hub, count - positions.length, 1.8);
    }

    return { positions, rotations };
}

// ══════════════════════════════════════════════════════════
// AI / DATA — narrowing pipeline
// Concept: four gates of decreasing radius with a dense stream
// running through their centres. Data funnelling into a model.
// ══════════════════════════════════════════════════════════
function buildAIData(count) {
    const positions = [];
    const rotations = [];

    const gates = [
        { x: -5.6, r: 3.10 },
        { x: -1.9, r: 2.45 },
        { x:  1.9, r: 1.80 },
        { x:  5.6, r: 1.15 }
    ];

    const gateN   = Math.floor(count * 0.62);
    const streamN = count - gateN;
    const perGate = Math.floor(gateN / gates.length);

    // 1) The gates — rings standing in the YZ plane
    gates.forEach(g => {
        for (let i = 0; i < perGate; i++) {
            if (positions.length >= count) return;
            const a = (i / perGate) * Math.PI * 2;
            positions.push(new THREE.Vector3(
                g.x + (Math.random() - 0.5) * 0.30,
                CORE_Y + Math.sin(a) * g.r + (Math.random() - 0.5) * 0.16,
                Math.cos(a) * g.r + (Math.random() - 0.5) * 0.16
            ));
            // Tangent to the ring
            const tangent = new THREE.Vector3(0, Math.cos(a), -Math.sin(a)).normalize();
            rotations.push(new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0), tangent
            ));
        }
    });

    // 2) The stream — a dense axial core running the whole length,
    //    tightening as it advances so the funnel reads clearly.
    const alongX = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0)
    );
    for (let i = 0; i < streamN; i++) {
        if (positions.length >= count) break;
        const u = i / Math.max(1, streamN - 1);
        const x = -6.6 + u * 13.2;
        const spread = THREE.MathUtils.lerp(1.05, 0.22, u);
        const a = Math.random() * Math.PI * 2;
        const r = Math.pow(Math.random(), 0.5) * spread;
        positions.push(new THREE.Vector3(
            x + (Math.random() - 0.5) * 0.28,
            CORE_Y + Math.sin(a) * r,
            Math.cos(a) * r
        ));
        rotations.push(alongX.clone());
    }

    while (positions.length < count) {
        positions.push(new THREE.Vector3(
            -6 + Math.random() * 12,
            CORE_Y + (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4
        ));
        rotations.push(randQuat());
    }

    return { positions, rotations };
}

// ══════════════════════════════════════════════════════════
// OTHER — tool tray
// Concept: a tilted 4x4 tray of tight clusters, a few lifted out
// of their slots. Reads as a set of tools laid out and in use.
// ══════════════════════════════════════════════════════════
function buildOther(count) {
    const positions = [];
    const rotations = [];

    const cols = 4, rows = 4;
    const cells = cols * rows;
    const spacing = 2.0;
    const tilt = -0.42; // tray tips toward the viewer

    const trayN  = Math.floor(count * 0.84);
    const perCell = Math.floor(trayN / cells);

    // A few cells float above the tray, as if picked up.
    const lifted = new Set([5, 10, 3]);

    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            const idx = c * rows + r;
            const lift = lifted.has(idx) ? 1.5 : 0;

            const localX = (c - (cols - 1) / 2) * spacing;
            const localZ = (r - (rows - 1) / 2) * spacing;
            const localY = lift;

            // Tilt the whole tray about the X axis
            const ct = Math.cos(tilt), st = Math.sin(tilt);
            const y = localY * ct - localZ * st;
            const z = localY * st + localZ * ct;

            for (let k = 0; k < perCell; k++) {
                if (positions.length >= count) break;
                const rr = Math.pow(Math.random(), 0.6) * 0.52;
                const phi = Math.acos(2 * Math.random() - 1);
                const theta = Math.random() * Math.PI * 2;
                positions.push(new THREE.Vector3(
                    localX + rr * Math.sin(phi) * Math.cos(theta),
                    CORE_Y + y + rr * Math.cos(phi),
                    z + rr * Math.sin(phi) * Math.sin(theta)
                ));
                rotations.push(new THREE.Quaternion().setFromEuler(
                    new THREE.Euler(tilt, Math.random() * Math.PI * 2, 0)
                ));
            }
        }
    }

    // Remainder: dust drifting above the tray
    while (positions.length < count) {
        positions.push(new THREE.Vector3(
            (Math.random() - 0.5) * 8.5,
            CORE_Y + 2.4 + Math.random() * 2.6,
            (Math.random() - 0.5) * 6
        ));
        rotations.push(randQuat());
    }

    return { positions, rotations };
}

// ══════════════════════════════════════════════════════════
export const FormationBuilder = {
    build(name, count) {
        switch (name) {
            // Work
            case 'aaup':         return buildAAUP(count);
            case 'construction': return buildConstruction(count);
            case 'rlscientist':  return buildRLScientist(count);
            case 'listinglab':   return buildListingLab(count);
            case 'aimaze':       return buildAIMaze(count);
            // About
            case 'about':        return buildAbout(count);
            // Lab
            case 'languages':    return buildLanguages(count);
            case 'frameworks':   return buildFrameworks(count);
            case 'aidata':       return buildAIData(count);
            case 'other':        return buildOther(count);
            default:             return null;
        }
    }
};
