import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// AABB Collision Detection
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

// Helper to get AABB from a mesh that might be scaled
export function getTransformedAABB(mesh) {
    // Create a new box
    const box = new THREE.Box3();
    // Set from object automatically handles scale and rotation
    box.setFromObject(mesh);
    // Shrink slightly to be forgiving
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    
    const margin = 0.05; // 5% forgiveness
    box.min.addScalar(margin);
    box.max.subScalar(margin);
    
    return box;
}

export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}