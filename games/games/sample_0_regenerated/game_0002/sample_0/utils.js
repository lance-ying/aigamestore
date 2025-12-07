import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Pseudo-random number generator wrapper
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

// Texture Generators
export function createStoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base Grey
    ctx.fillStyle = '#555555';
    ctx.fillRect(0, 0, 256, 256);

    // Noise
    for (let i = 0; i < 5000; i++) {
        const shade = Math.floor(randomRange(50, 150));
        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
        ctx.fillRect(random() * 256, random() * 256, 2, 2);
    }
    
    // Cracks
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(random() * 256, random() * 256);
        ctx.lineTo(random() * 256, random() * 256);
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

export function createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, 64, 256);
    
    // Grain
    for(let i=0; i<100; i++) {
        ctx.fillStyle = '#654321';
        ctx.fillRect(random()*64, random()*256, 2, 20);
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
}