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
export const FormationBuilder = {
    build(name, count) {
        switch (name) {
            case 'aaup':         return buildAAUP(count);
            case 'construction': return buildConstruction(count);
            case 'rlscientist':  return buildRLScientist(count);
            case 'listinglab':   return buildListingLab(count);
            case 'aimaze':       return buildAIMaze(count);
            default:             return null;
        }
    }
};