import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

export function dist(v1, v2) {
    return v1.distanceTo(v2);
}

// Check if a point is within a circular zone
export function isInZone(position, zone) {
    const d = Math.sqrt(Math.pow(position.x - zone.x, 2) + Math.pow(position.z - zone.z, 2));
    return d <= zone.radius;
}

// A simple box-box collision check (AABB)
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

// Helper to create simple mesh
export function createMesh(geometry, color, x, y, z, shadow = true) {
    const material = new THREE.MeshStandardMaterial({ 
        color: color, 
        flatShading: true,
        roughness: 0.8,
        metalness: 0.1
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (shadow) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }
    return mesh;
}