/**
 * Utility functions for math, randomness, and easing
 */

// Seedable random wrapper using the globally available library or fallback
let rng = Math.random;

export function initRandom(seed) {
    if (window.Math.seedrandom) {
        rng = new Math.seedrandom(seed);
        console.log("Random seeded with:", seed);
    } else {
        console.warn("seedrandom not found, using Math.random");
        rng = Math.random;
    }
}

export function random() {
    return rng();
}

export function randomRange(min, max) {
    return min + rng() * (max - min);
}

export function randomInt(min, max) {
    return Math.floor(min + rng() * (max - min + 1));
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

export function easeOutQuad(t) {
    return t * (2 - t);
}

// Check AABB collision (Axis-Aligned Bounding Box)
export function checkAABB(box1, box2) {
    return (
        box1.min.x <= box2.max.x &&
        box1.max.x >= box2.min.x &&
        box1.min.y <= box2.max.y &&
        box1.max.y >= box2.min.y &&
        box1.min.z <= box2.max.z &&
        box1.max.z >= box2.min.z
    );
}

// Simple sphere-box intersection for the ball
export function sphereIntersectsBox(spherePos, sphereRadius, boxMin, boxMax) {
    // get box closest point to sphere center by clamping
    const x = Math.max(boxMin.x, Math.min(spherePos.x, boxMax.x));
    const y = Math.max(boxMin.y, Math.min(spherePos.y, boxMax.y));
    const z = Math.max(boxMin.z, Math.min(spherePos.z, boxMax.z));

    // this is the same as isPointInsideSphere
    const distance = Math.sqrt(
        (x - spherePos.x) * (x - spherePos.x) +
        (y - spherePos.y) * (y - spherePos.y) +
        (z - spherePos.z) * (z - spherePos.z)
    );

    return distance < sphereRadius;
}