import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Random range helper
export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Box collision check (AABB)
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

// Get bounding box for mesh
export function getBoundingBox(mesh) {
    const box = new THREE.Box3().setFromObject(mesh);
    return box;
}

// Simple distance check
export function getDistance(ent1, ent2) {
    return ent1.mesh.position.distanceTo(ent2.mesh.position);
}