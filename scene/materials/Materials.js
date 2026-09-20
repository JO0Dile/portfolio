import * as THREE from 'three';

const cache = new Map();

function cached(key, factory) {
    if (cache.has(key)) return cache.get(key);
    const m = factory();
    cache.set(key, m);
    return m;
}

export const Materials = {
    // ── Structural ──
    matte: () => cached('matte', () => new THREE.MeshStandardMaterial({
        color: 0x0e1014,
        roughness: 0.92,
        metalness: 0.06
    })),

    matteDeep: () => cached('matteDeep', () => new THREE.MeshStandardMaterial({
        color: 0x08090c,
        roughness: 0.96,
        metalness: 0.03,
        side: THREE.DoubleSide
    })),

    polished: () => cached('polished', () => new THREE.MeshStandardMaterial({
        color: 0x181c22,
        roughness: 0.26,
        metalness: 0.88
    })),

    brushed: () => cached('brushed', () => new THREE.MeshStandardMaterial({
        color: 0x22262c,
        roughness: 0.58,
        metalness: 0.9
    })),

    // ── Interior (visible when shell opens) ──
    interiorWall: () => cached('interiorWall', () => new THREE.MeshStandardMaterial({
        color: 0x0a1220,
        roughness: 0.5,
        metalness: 0.7,
        side: THREE.BackSide
    })),

    // ── Glass ──
    glass: () => new THREE.MeshPhysicalMaterial({
        color: 0x0a1a2e,
        roughness: 0.08,
        metalness: 0.1,
        transparent: true,
        opacity: 0.55,
        transmission: 0.7,
        thickness: 0.4
    }),

    // ── Emissive strips ──
    accent: (hex = 0x4d8bf5, opacity = 0.9) => new THREE.MeshBasicMaterial({
        color: hex,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    }),

    // ── Disposal (called from World on teardown) ──
    disposeAll() {
        cache.forEach(m => m.dispose && m.dispose());
        cache.clear();
    }
};