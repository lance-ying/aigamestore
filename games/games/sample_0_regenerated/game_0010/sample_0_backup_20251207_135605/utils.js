import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

// Random number generator wrapper
export function random() {
    if (gameState.rng) {
        return gameState.rng();
    }
    return Math.random();
}

export function randomRange(min, max) {
    return min + random() * (max - min);
}

export function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
}

// Math helpers
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function getDistance(ent1, ent2) {
    return ent1.mesh.position.distanceTo(ent2.mesh.position);
}

export function getDirection(from, to) {
    return new THREE.Vector3().subVectors(to, from).normalize();
}

// Easing functions
export function easeOutQuad(t) {
    return t * (2 - t);
}

export function easeInQuad(t) {
    return t * t;
}

// Collision Helpers
export function checkSphereCollision(sphere1, sphere2) {
    const d2 = sphere1.position.distanceToSquared(sphere2.position);
    const r = sphere1.radius + sphere2.radius;
    return d2 < r * r;
}

export function checkAABBCollision(box1, box2) {
    return (
        box1.min.x <= box2.max.x &&
        box1.max.x >= box2.min.x &&
        box1.min.y <= box2.max.y &&
        box1.max.y >= box2.min.y &&
        box1.min.z <= box2.max.z &&
        box1.max.z >= box2.min.z
    );
}