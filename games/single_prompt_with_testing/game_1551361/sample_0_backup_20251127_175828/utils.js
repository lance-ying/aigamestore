import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Simple pseudo-random number generator for reproducibility
let seed = 42;
export function random() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

export function randomRange(min, max) {
    return min + random() * (max - min);
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// 2D Noise function (simple value noise)
// Based on simple interpolation for terrain generation
export function noise2D(x, z, scale = 0.1) {
    return Math.sin(x * scale) * Math.cos(z * scale);
}

// Map physics coordinates to biome colors
export function getBiomeColor(x, z) {
    // Biome Logic:
    // Center (0,0) -> Festival (Asphalt)
    // North (+Z) -> Desert
    // South (-Z) -> Jungle
    // East/West -> Mixed/Canyon
    
    const dist = Math.sqrt(x*x + z*z);
    
    // Festival Area
    if (dist < 20) return new THREE.Color(0x333333); // Asphalt
    
    // Normalize direction
    const angle = Math.atan2(z, x); // -PI to PI
    
    // Simple blending
    if (angle > 0.5 && angle < 2.5) {
        return new THREE.Color(0xE6C288); // Desert
    } else if (angle < -0.5 && angle > -2.5) {
        return new THREE.Color(0x2E8B57); // Jungle
    } else {
        return new THREE.Color(0xCD5C5C); // Canyon
    }
}

export function getTerrainHeight(x, z) {
    const dist = Math.sqrt(x*x + z*z);
    
    // Flat festival area
    if (dist < 25) return 0;
    
    // General noise
    let h = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2;
    h += Math.sin(x * 0.15 + 2) * Math.cos(z * 0.1 + 1) * 1;
    
    // Hills increase with distance
    const hillFactor = Math.min((dist - 25) / 50, 1.0) * 5;
    
    return h * hillFactor;
}