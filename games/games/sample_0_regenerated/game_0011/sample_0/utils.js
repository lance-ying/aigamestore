import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Seeded Random Number Generator
let rng = new Math.seedrandom('42');

export function resetRNG() {
    rng = new Math.seedrandom('42');
}

export function random() {
    return rng();
}

export function randomRange(min, max) {
    return min + rng() * (max - min);
}

export function randomInt(min, max) {
    return Math.floor(min + rng() * (max - min + 1));
}

export function randomChoice(array) {
    return array[Math.floor(rng() * array.length)];
}

// Easing functions
export function easeOutQuad(t) {
    return t * (2 - t);
}

// Collision Utils
export function boxIntersectsBox(box1, box2) {
    return (
        box1.max.x >= box2.min.x && box1.min.x <= box2.max.x &&
        box1.max.y >= box2.min.y && box1.min.y <= box2.max.y &&
        box1.max.z >= box2.min.z && box1.min.z <= box2.max.z
    );
}

export function getBox3(mesh) {
    const box = new THREE.Box3().setFromObject(mesh);
    // Shrink box slightly for forgiving gameplay
    const size = new THREE.Vector3();
    box.getSize(size);
    box.expandByScalar(-size.x * 0.1); 
    return box;
}

// Geometry Helpers
export function createBox(w, h, d, color, x, y, z) {
    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = new THREE.MeshStandardMaterial({ color: color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}