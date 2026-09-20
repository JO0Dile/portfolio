/* ============================================================
   FormationRegistry.js — builds and caches every formation
   ============================================================ */

import { FormationBuilder } from './FormationBuilder.js';

/* The canonical list of formations the hive can take, in the order
   the viewer meets them. SceneDirector imports this so the slot
   timeline and the formation cache can never drift apart. */
export const FORMATION_NAMES = [
    'about',
    'aaup', 'construction', 'rlscientist', 'listinglab', 'aimaze',
    'languages', 'frameworks', 'aidata', 'other'
];

export class FormationRegistry {
    constructor(fragmentCount) {
        this.fragmentCount = fragmentCount;
        this.cache = new Map();
        this.buildAll();
    }

    buildAll() {
        FORMATION_NAMES.forEach(name => {
            const formation = FormationBuilder.build(name, this.fragmentCount);
            if (formation && formation.positions && formation.positions.length) {
                this.cache.set(name, formation);
            } else {
                console.warn('[formations] failed to build:', name);
            }
        });
    }

    get(name) {
        return this.cache.get(name) || null;
    }

    // Called when the quality level changes the fragment count
    rebuild(newCount) {
        this.fragmentCount = newCount;
        this.cache.clear();
        this.buildAll();
    }
}
