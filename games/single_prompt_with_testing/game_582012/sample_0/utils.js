import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Random number generator wrapper (will use seedrandom globally)
export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Simple easing
export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

// Check intersection between two spheres
export function checkSphereIntersection(pos1, radius1, pos2, radius2) {
    const distSq = pos1.distanceToSquared(pos2);
    const radSum = radius1 + radius2;
    return distSq < (radSum * radSum);
}

// Check intersection between box (AABB) and sphere
// Simplified: treat box as sphere for broad phase, then closer check if needed
// For this game, sphere-sphere is mostly sufficient for dynamic entities
export function checkAABBIntersection(boxMin, boxMax, point) {
    return (
        point.x >= boxMin.x && point.x <= boxMax.x &&
        point.y >= boxMin.y && point.y <= boxMax.y &&
        point.z >= boxMin.z && point.z <= boxMax.z
    );
}

export function createColorMaterial(colorHex) {
    return new THREE.MeshStandardMaterial({ 
        color: colorHex, 
        roughness: 0.7, 
        metalness: 0.1 
    });
}