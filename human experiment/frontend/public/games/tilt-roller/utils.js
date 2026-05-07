import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Math Utilities

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

// Axis Aligned Bounding Box for Physics
export class AABB {
    constructor(center, size) {
        this.center = center.clone();
        this.size = size.clone();
        this.min = new THREE.Vector3().subVectors(this.center, this.size.clone().multiplyScalar(0.5));
        this.max = new THREE.Vector3().addVectors(this.center, this.size.clone().multiplyScalar(0.5));
    }

    update(position) {
        this.center.copy(position);
        this.min.set(
            this.center.x - this.size.x / 2,
            this.center.y - this.size.y / 2,
            this.center.z - this.size.z / 2
        );
        this.max.set(
            this.center.x + this.size.x / 2,
            this.center.y + this.size.y / 2,
            this.center.z + this.size.z / 2
        );
    }
    
    // Check intersection with another AABB
    intersects(other) {
        return (
            this.min.x <= other.max.x && this.max.x >= other.min.x &&
            this.min.y <= other.max.y && this.max.y >= other.min.y &&
            this.min.z <= other.max.z && this.max.z >= other.min.z
        );
    }
    
    // Closest point on this AABB to a point p
    closestPointToPoint(p) {
        return new THREE.Vector3(
            clamp(p.x, this.min.x, this.max.x),
            clamp(p.y, this.min.y, this.max.y),
            clamp(p.z, this.min.z, this.max.z)
        );
    }
}

// Random Number Generator Wrapper
export class RNG {
    constructor(seed) {
        // Use the global seeded math if available, else fallback
        this.rng = new Math.seedrandom(seed);
    }
    
    // Float between 0 and 1
    random() {
        return this.rng();
    }
    
    // Float between min and max
    range(min, max) {
        return min + this.random() * (max - min);
    }
    
    // Integer between min and max (inclusive min, exclusive max)
    rangeInt(min, max) {
        return Math.floor(this.range(min, max));
    }
    
    // Pick random element from array
    pick(array) {
        return array[this.rangeInt(0, array.length)];
    }
}