import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, COLORS } from './globals.js';

export function createPlatform(x, y, z, w, h, d, color = 0x444444) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.9,
        metalness: 0.1
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    gameState.scene.add(mesh);
    gameState.platforms.push({ mesh, width: w, height: h, depth: d });
}

export function generateLevel() {
    // Clear old platforms
    gameState.platforms.forEach(p => gameState.scene.remove(p.mesh));
    gameState.platforms = [];

    // Main Floor
    createPlatform(0, -0.5, 0, 100, 1, 100, COLORS.ground);
    
    // Arena Walls
    createPlatform(0, 5, -50, 100, 10, 1, 0x333333); // North
    createPlatform(0, 5, 50, 100, 10, 1, 0x333333);  // South
    createPlatform(-50, 5, 0, 1, 10, 100, 0x333333); // West
    createPlatform(50, 5, 0, 1, 10, 100, 0x333333);  // East
    
    // Center Pillars / Obstacles
    createPlatform(15, 2, 15, 4, 4, 4, 0x666666);
    createPlatform(-15, 2, -15, 4, 4, 4, 0x666666);
    createPlatform(15, 3, -15, 4, 6, 4, 0x666666);
    createPlatform(-15, 1, 15, 4, 2, 4, 0x666666);
    
    // Ramp-like stairs
    createPlatform(0, 1, 20, 10, 2, 5, 0x555555);
    createPlatform(0, 2, 25, 10, 4, 5, 0x555555);
}

export function spawnWave(waveNum) {
    // Clear dead
    gameState.enemies = gameState.enemies.filter(e => !e.isDead);
    
    if (gameState.enemies.length > 0) return; // Don't spawn if enemies exist
    
    const count = 3 + waveNum * 2;
    import('./entities.js').then(({ Filth, Stray }) => {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 10 + Math.random() * 20;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            
            // Mix of enemies
            if (Math.random() > 0.7 && waveNum > 1) {
                const enemy = new Stray(x, 2, z);
                gameState.enemies.push(enemy);
            } else {
                const enemy = new Filth(x, 2, z);
                gameState.enemies.push(enemy);
            }
        }
    });
}