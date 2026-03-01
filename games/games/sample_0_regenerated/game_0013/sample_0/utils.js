import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Generate a grid texture programmatically
export function createGridTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1a1a2e'; // Dark blue/purple
    ctx.fillRect(0, 0, size, size);

    // Grid lines
    ctx.strokeStyle = '#e94560'; // Pinkish red
    ctx.lineWidth = 4;

    // Draw grid
    const step = size / 8;
    ctx.beginPath();
    for (let i = 0; i <= size; i += step) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
    }
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

// Create a gradient texture for the jelly
export function createJellyTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#00f260'); // Green top
    grad.addColorStop(1, '#0575e6'); // Blue bottom

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    
    // Add some noise/speckles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for(let i=0; i<50; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 3;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
}