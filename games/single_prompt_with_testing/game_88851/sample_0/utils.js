import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Random Number Generator (seeded)
let rng = new Math.seedrandom('tf2_demake_seed');

export function random() {
    return rng();
}

export function randomRange(min, max) {
    return min + rng() * (max - min);
}

export function randomInt(min, max) {
    return Math.floor(min + rng() * (max - min + 1));
}

// Math helpers
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function getDistance(v1, v2) {
    return v1.distanceTo(v2);
}

// Texture Generation Helpers
export function createStripedTexture(color1, color2) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, 64, 64);
    
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(32, 0);
    ctx.lineTo(0, 32);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(64, 0);
    ctx.lineTo(64, 32);
    ctx.lineTo(32, 64);
    ctx.lineTo(0, 64);
    ctx.lineTo(0, 32);
    ctx.lineTo(32, 0);
    ctx.fill(); // Crude attempt at stripes, good enough for lo-fi
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    return texture;
}

export function createCrossTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(24, 10, 16, 44);
    ctx.fillRect(10, 24, 44, 16);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}