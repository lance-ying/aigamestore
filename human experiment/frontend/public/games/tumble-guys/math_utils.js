import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Linear interpolation
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

// Clamp value
export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

// Check intersection between two AABBs (Axis Aligned Bounding Boxes)
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

// Check Sphere vs AABB collision
export function checkSphereAABB(sphere, box) {
    // Get the point on the box closest to the sphere center
    const x = Math.max(box.min.x, Math.min(sphere.center.x, box.max.x));
    const y = Math.max(box.min.y, Math.min(sphere.center.y, box.max.y));
    const z = Math.max(box.min.z, Math.min(sphere.center.z, box.max.z));

    // Distance between closest point and sphere center
    const distanceSq = 
        (x - sphere.center.x) ** 2 +
        (y - sphere.center.y) ** 2 +
        (z - sphere.center.z) ** 2;

    return distanceSq < (sphere.radius * sphere.radius);
}

// Get random color
export function getRandomColor() {
    const colors = [
        0xFF0055, // Hot Pink
        0x00AAFF, // Cyan
        0xFFDD00, // Yellow
        0xAA00FF, // Purple
        0x00FF66, // Green
        0xFF6600  // Orange
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}