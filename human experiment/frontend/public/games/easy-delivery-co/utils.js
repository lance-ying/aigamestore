import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Random number generator wrapper (seeded)
export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Texture Generation Helpers
export function createGridTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, 512, 512);

    // Grid lines
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;

    for (let i = 0; i <= 512; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

export function createBuildingTexture(colorStr, windows = true) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base wall
    ctx.fillStyle = colorStr;
    ctx.fillRect(0, 0, 256, 256);

    // Add noise/dirt
    for(let i=0; i<1000; i++) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
        ctx.fillRect(Math.random()*256, Math.random()*256, 2, 2);
    }

    if (windows) {
        // Windows
        ctx.fillStyle = '#4a5a6a'; // Dark unlit window
        const rows = 3;
        const cols = 3;
        const pad = 20;
        const w = (256 - (cols + 1) * pad) / cols;
        const h = (256 - (rows + 1) * pad) / rows;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // Occasional lit window
                if (Math.random() > 0.7) {
                    ctx.fillStyle = '#ffffaa'; // Lit
                } else {
                    ctx.fillStyle = '#223344'; // Dark
                }
                ctx.fillRect(pad + c * (w + pad), pad + r * (h + pad), w, h);
                
                // Frame
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#333';
                ctx.strokeRect(pad + c * (w + pad), pad + r * (h + pad), w, h);
            }
        }
    }
    
    // Door
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(100, 200, 56, 56);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

export function createRoadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Asphalt
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, 512, 512);

    // Noise
    for(let i=0; i<5000; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
        ctx.fillRect(Math.random()*512, Math.random()*512, 2, 2);
    }

    // Lines
    ctx.fillStyle = '#ffcc00'; // Double yellow center
    ctx.fillRect(250, 0, 4, 512);
    ctx.fillRect(258, 0, 4, 512);

    // White side lines
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 0, 6, 512);
    ctx.fillRect(486, 0, 6, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4); // Stretch along road length
    return texture;
}

// Math Utils
export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function getDistance(v1, v2) {
    return v1.distanceTo(v2);
}