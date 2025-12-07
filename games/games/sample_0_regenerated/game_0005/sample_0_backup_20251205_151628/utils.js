/**
 * utils.js
 * Helper functions for math, collisions, and randomization.
 */

import { TILE_SIZE } from './globals.js';
// Corrected import path for p5.collide2d as an ES module
import { collideRectRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/dist/p5.collide2d.min.js?module';

// Simple random range helper since we shouldn't use p.random everywhere to keep logic clean,
// but for p5 sketch consistency we usually pass 'p' or use Math.random if deterministic seeding isn't strictly required by logic outside setup.
// However, the instructions say 'p.randomSeed(42)' in setup. This affects p.random().
// We should pass 'p' to functions needing random numbers to respect the seed.

export function randomRange(p, min, max) {
    return p.random(min, max);
}

export function randomInt(p, min, max) {
    return Math.floor(p.random(min, max));
}

export function randomChoice(p, array) {
    return array[Math.floor(p.random(array.length))];
}

export function checkAABB(r1, r2) {
    return collideRectRect(r1.x, r1.y, r1.w, r1.h, r2.x, r2.y, r2.w, r2.h);
}

export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

export function distSq(x1, y1, x2, y2) {
    return (x2 - x1) ** 2 + (y2 - y1) ** 2;
}

export function constrain(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

// Generates a unique ID for entities
let idCounter = 0;
export function generateID() {
    return ++idCounter;
}