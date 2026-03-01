import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { COLORS } from './globals.js';

/**
 * Utility functions for geometry, random numbers, and math.
 */

// Initialize random seed (using external library if loaded, or simple fallback)
export function seedRandom(seed) {
    if (window.Math.seedrandom) {
        window.Math.seedrandom(seed);
    } else {
        console.warn("seedrandom library not found, using Math.random");
    }
}

/**
 * Returns a random floating point number between min and max
 */
export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min and max (inclusive)
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a random element from an array
 */
export function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Gets the numeric hex color value from a color name string
 */
export function getColorValue(colorName) {
    return COLORS[colorName] || COLORS.WHITE;
}

/**
 * Creates a texture programmatically for the road stripes
 */
export function createRoadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, 64, 64);
    
    // Side lines
    ctx.fillStyle = '#555555';
    ctx.fillRect(0, 0, 4, 64);
    ctx.fillRect(60, 0, 4, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // Anisotropy helps with texture blurring at oblique angles
    texture.anisotropy = 16; 
    
    return texture;
}

/**
 * Creates a simple noise-based texture for balls
 */
export function createBallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Base gradient
    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(1, '#888888');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    
    // Add some noise dots
    for(let i=0; i<100; i++) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
        ctx.beginPath();
        ctx.arc(Math.random()*128, Math.random()*128, Math.random()*5, 0, Math.PI*2);
        ctx.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
}

/**
 * Check collision between two spheres
 */
export function checkSphereCollision(pos1, radius1, pos2, radius2) {
    const distSq = pos1.distanceToSquared(pos2);
    const radSum = radius1 + radius2;
    return distSq < (radSum * radSum);
}

/**
 * Check collision between sphere and box (AABBish approximation for ramps)
 */
export function checkSphereBoxCollision(spherePos, sphereRadius, boxPos, boxSize) {
    // Transform sphere center to box local space (assuming axis aligned for simplicity or handled externally)
    // For this game, ramps are aligned with Z axis mostly.
    
    const x = Math.max(boxPos.x - boxSize.x/2, Math.min(spherePos.x, boxPos.x + boxSize.x/2));
    const y = Math.max(boxPos.y - boxSize.y/2, Math.min(spherePos.y, boxPos.y + boxSize.y/2));
    const z = Math.max(boxPos.z - boxSize.z/2, Math.min(spherePos.z, boxPos.z + boxSize.z/2));

    const distance = Math.sqrt(
        (x - spherePos.x) * (x - spherePos.x) +
        (y - spherePos.y) * (y - spherePos.y) +
        (z - spherePos.z) * (z - spherePos.z)
    );

    return distance < sphereRadius;
}