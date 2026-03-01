import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Check AABB Collision (Axis-Aligned Bounding Box)
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

export function getBox(mesh, size) {
    const halfX = size.x / 2;
    const halfY = size.y / 2;
    const halfZ = size.z / 2;
    return {
        min: {
            x: mesh.position.x - halfX,
            y: mesh.position.y - halfY,
            z: mesh.position.z - halfZ
        },
        max: {
            x: mesh.position.x + halfX,
            y: mesh.position.y + halfY,
            z: mesh.position.z + halfZ
        }
    };
}

export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
}