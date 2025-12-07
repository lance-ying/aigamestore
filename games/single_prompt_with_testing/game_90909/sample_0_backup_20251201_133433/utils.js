import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Texture Generators using Canvas API to avoid external assets

export function createStoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Base grey
    ctx.fillStyle = '#555';
    ctx.fillRect(0, 0, 256, 256);
    
    // Noise
    for(let i=0; i<5000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#666' : '#444';
        const size = Math.random() * 4 + 1;
        ctx.fillRect(Math.random()*256, Math.random()*256, size, size);
    }
    
    // Cracks/Bricks
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for(let i=0; i<=256; i+=64) {
        ctx.moveTo(0, i);
        ctx.lineTo(256, i);
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 256);
    }
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

export function createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0,0,64,64);
    // Grain
    ctx.fillStyle = '#A0522D';
    for(let i=0; i<20; i++) ctx.fillRect(Math.random()*64, 0, 2, 64);
    
    return new THREE.CanvasTexture(canvas);
}

export function checkAABB(box1, box2) {
    return (
        box1.min.x <= box2.max.x && box1.max.x >= box2.min.x &&
        box1.min.y <= box2.max.y && box1.max.y >= box2.min.y &&
        box1.min.z <= box2.max.z && box1.max.z >= box2.min.z
    );
}