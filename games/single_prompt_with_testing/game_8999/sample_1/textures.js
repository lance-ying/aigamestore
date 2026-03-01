import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { BLOCKS } from './globals.js';

// Procedural texture generation
function createNoiseTexture(width, height, color1, color2, noiseScale = 1) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Fill base
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, width, height);

    // Add noise
    for (let i = 0; i < (width * height) / 2; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2 + 1;
        ctx.fillStyle = color2;
        ctx.globalAlpha = Math.random() * 0.3;
        ctx.fillRect(x, y, size * noiseScale, size * noiseScale);
    }
    
    // Border for block definition
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter; // Pixelated look
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

const TEXTURE_SIZE = 64;

export const materials = {};

export function initMaterials() {
    // Dirt
    const dirtTex = createNoiseTexture(TEXTURE_SIZE, TEXTURE_SIZE, '#8B4513', '#5C2E0E');
    materials[BLOCKS.DIRT] = new THREE.MeshStandardMaterial({ map: dirtTex, roughness: 1.0 });

    // Grass (Top different from sides ideally, but using one for simplicity or we can use array)
    const grassTop = createNoiseTexture(TEXTURE_SIZE, TEXTURE_SIZE, '#4C9A2A', '#3A7A20');
    const grassSide = createNoiseTexture(TEXTURE_SIZE, TEXTURE_SIZE, '#8B4513', '#4C9A2A', 2); 
    // Create canvas that mixes dirt and grass for side
    
    materials[BLOCKS.GRASS] = new THREE.MeshStandardMaterial({ map: grassTop, roughness: 1.0 }); // Simplification: All sides grass

    // Stone
    const stoneTex = createNoiseTexture(TEXTURE_SIZE, TEXTURE_SIZE, '#7D7D7D', '#555555');
    materials[BLOCKS.STONE] = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.8 });

    // Wood
    const woodTex = createNoiseTexture(TEXTURE_SIZE, TEXTURE_SIZE, '#654321', '#4A3219');
    materials[BLOCKS.WOOD] = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.9 });

    // Leaves
    const leavesTex = createNoiseTexture(TEXTURE_SIZE, TEXTURE_SIZE, '#228B22', '#006400');
    materials[BLOCKS.LEAVES] = new THREE.MeshStandardMaterial({ map: leavesTex, roughness: 1.0, transparent: false }); // Opaque for perf

    // Bedrock
    const bedrockTex = createNoiseTexture(TEXTURE_SIZE, TEXTURE_SIZE, '#222222', '#000000');
    materials[BLOCKS.BEDROCK] = new THREE.MeshStandardMaterial({ map: bedrockTex, roughness: 1.0 });
    
    // Selection Highlight Material
    materials['selection'] = new THREE.MeshBasicMaterial({ 
        color: 0x000000, 
        wireframe: true, 
        transparent: true, 
        opacity: 0.5,
        depthTest: false,
        depthWrite: false
    });
}