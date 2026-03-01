import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Check if a point is inside an AABB (Axis Aligned Bounding Box)
// box: { min: Vector3, max: Vector3 }
// point: Vector3
export function pointInAABB(point, box) {
    return (
        point.x >= box.min.x && point.x <= box.max.x &&
        point.y >= box.min.y && point.y <= box.max.y &&
        point.z >= box.min.z && point.z <= box.max.z
    );
}

// Check AABB vs AABB collision
export function intersectAABB(box1, box2) {
    return (
        box1.min.x <= box2.max.x && box1.max.x >= box2.min.x &&
        box1.min.y <= box2.max.y && box1.max.y >= box2.min.y &&
        box1.min.z <= box2.max.z && box1.max.z >= box2.min.z
    );
}

// Easing function for smooth animations
export function easeOutBack(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

// Convert degrees to radians
export function degToRad(deg) {
    return deg * (Math.PI / 180);
}

// Generate a random color variant
export function randomColorVariant(baseColorHex, variance = 20) {
    const color = new THREE.Color(baseColorHex);
    const r = clamp(color.r * 255 + randomRange(-variance, variance), 0, 255) / 255;
    const g = clamp(color.g * 255 + randomRange(-variance, variance), 0, 255) / 255;
    const b = clamp(color.b * 255 + randomRange(-variance, variance), 0, 255) / 255;
    return new THREE.Color(r, g, b);
}