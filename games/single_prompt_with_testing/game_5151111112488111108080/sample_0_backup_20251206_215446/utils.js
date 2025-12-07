import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

/**
 * Clamps a number between min and max
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
 * Generate a random number between min and max
 */
export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Generate a random integer between min and max (inclusive)
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Check collision between a sphere and an Axis-Aligned Bounding Box (AABB)
 * @param {THREE.Vector3} spherePos - Position of the sphere center
 * @param {number} sphereRadius - Radius of the sphere
 * @param {Object} box - Object with position, width, height, depth
 */
export function checkSphereBoxCollision(spherePos, sphereRadius, box) {
    // Calculate box min and max bounds
    const boxMinX = box.position.x - box.width / 2;
    const boxMaxX = box.position.x + box.width / 2;
    const boxMinY = box.position.y - box.height / 2;
    const boxMaxY = box.position.y + box.height / 2;
    const boxMinZ = box.position.z - box.depth / 2;
    const boxMaxZ = box.position.z + box.depth / 2;

    // Find the closest point on the box to the sphere center
    const closestX = Math.max(boxMinX, Math.min(spherePos.x, boxMaxX));
    const closestY = Math.max(boxMinY, Math.min(spherePos.y, boxMaxY));
    const closestZ = Math.max(boxMinZ, Math.min(spherePos.z, boxMaxZ));

    // Calculate distance between closest point and sphere center
    const distanceX = spherePos.x - closestX;
    const distanceY = spherePos.y - closestY;
    const distanceZ = spherePos.z - closestZ;

    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY) + (distanceZ * distanceZ);

    return distanceSquared < (sphereRadius * sphereRadius);
}

/**
 * Helper to log game info safely
 */
export function logGameEvent(status, data = {}) {
    if (window.logs && window.logs.game_info) {
        window.logs.game_info.push({
            game_status: status,
            data: data,
            framecount: gameState.frameCount,
            timestamp: Date.now()
        });
    }
}

/**
 * Helper to create a standard material with error handling
 */
export function createMaterial(color, roughness = 0.5, metalness = 0.1, emissive = 0x000000) {
    return new THREE.MeshStandardMaterial({
        color: color,
        roughness: roughness,
        metalness: metalness,
        emissive: emissive
    });
}

/**
 * Generate a new color based on a base hue but slightly shifted
 */
export function generateVariedColor(baseHex, variance = 0.1) {
    const color = new THREE.Color(baseHex);
    const hsl = {};
    color.getHSL(hsl);
    
    hsl.h += (Math.random() - 0.5) * variance;
    hsl.s += (Math.random() - 0.5) * variance;
    hsl.l += (Math.random() - 0.5) * variance;
    
    // Clamp values
    hsl.h = (hsl.h + 1) % 1;
    hsl.s = clamp(hsl.s, 0, 1);
    hsl.l = clamp(hsl.l, 0, 1);
    
    color.setHSL(hsl.h, hsl.s, hsl.l);
    return color;
}