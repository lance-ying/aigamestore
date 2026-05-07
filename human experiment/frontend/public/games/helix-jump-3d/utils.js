import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

// Random number generator using seedrandom (assumed loaded globally or shimmed)
// Since explicit import of seedrandom isn't available as an ES module in the constraints directly, 
// we assume it's loaded in index.html and modifies Math.random or provides a generator.
// But constraints say "Allowed libraries: three.js, seedrandom".
// We will use a simple seeded random class if Math.seedrandom is not available, 
// but usually the script tag provided in example handles it.

export class RNG {
    constructor(seed) {
        // If seedrandom is loaded, it overrides Math.random usually, or we use new Math.seedrandom(seed)
        if (window.Math.seedrandom) {
            this.rng = new Math.seedrandom(seed);
        } else {
            // Fallback LCG
            this.seed = seed;
            this.rng = () => {
                const x = Math.sin(this.seed++) * 10000;
                return x - Math.floor(x);
            };
        }
    }

    float() {
        return this.rng();
    }

    range(min, max) {
        return min + this.float() * (max - min);
    }
    
    int(min, max) {
        return Math.floor(this.range(min, max));
    }
    
    // Returns true/false based on probability (0-1)
    bool(chance = 0.5) {
        return this.float() < chance;
    }
}

export const gameRNG = new RNG('helix_jump_seed_42');

export function normalizeAngle(angle) {
    let a = angle % (Math.PI * 2);
    if (a < 0) a += Math.PI * 2;
    return a;
}

export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

// Convert HSL to Hex
export function hslToHex(h, s, l) {
    const color = new THREE.Color();
    color.setHSL(h, s, l);
    return color.getHex();
}

// Check if angle is within an arc range [start, end]
// Handles wrapping around 2PI
export function isAngleInArc(angle, start, end) {
    const a = normalizeAngle(angle);
    const s = normalizeAngle(start);
    const e = normalizeAngle(end);
    
    if (s < e) {
        return a >= s && a <= e;
    } else {
        // Wraps around 0
        return a >= s || a <= e;
    }
}