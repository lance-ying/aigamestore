import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

/**
 * Math helper to clamp values
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

/**
 * Check collision between a sphere (player) and an Axis-Aligned Bounding Box (AABB)
 * @param {THREE.Vector3} spherePos 
 * @param {number} radius 
 * @param {Object} box - {min: Vector3, max: Vector3}
 * @returns {boolean}
 */
export function sphereAABBIntersection(spherePos, radius, box) {
    // Find the point on the AABB closest to the sphere center
    const x = Math.max(box.min.x, Math.min(spherePos.x, box.max.x));
    const y = Math.max(box.min.y, Math.min(spherePos.y, box.max.y));
    const z = Math.max(box.min.z, Math.min(spherePos.z, box.max.z));

    // Distance between sphere center and closest point
    const distanceSq = 
        (x - spherePos.x) * (x - spherePos.x) +
        (y - spherePos.y) * (y - spherePos.y) +
        (z - spherePos.z) * (z - spherePos.z);

    return distanceSq < (radius * radius);
}

/**
 * Get collision normal and penetration depth for response
 */
export function getSphereAABBCollisionInfo(spherePos, radius, box) {
    const closestPoint = new THREE.Vector3(
        Math.max(box.min.x, Math.min(spherePos.x, box.max.x)),
        Math.max(box.min.y, Math.min(spherePos.y, box.max.y)),
        Math.max(box.min.z, Math.min(spherePos.z, box.max.z))
    );

    const difference = new THREE.Vector3().subVectors(spherePos, closestPoint);
    const distance = difference.length();
    
    // If center is inside box (distance is 0), push up by default
    if (distance === 0) {
        return {
            normal: new THREE.Vector3(0, 1, 0),
            depth: radius // Push out by radius
        };
    }

    return {
        normal: difference.normalize(),
        depth: radius - distance
    };
}

/**
 * Generate a random color variant
 */
export function randomColorVariant(baseColorHex, variation = 0.1) {
    const color = new THREE.Color(baseColorHex);
    const offset = (Math.random() - 0.5) * variation;
    color.offsetHSL(0, 0, offset);
    return color;
}

/**
 * Smooth step function
 */
export function smoothStep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
}