import { Platform, GrapplePoint } from './entities.js';
import { gameState } from './globals.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/**
 * Procedurally generate the level
 */
export function generateLevel() {
    // Clear existing
    gameState.platforms = [];
    gameState.grapplePoints = [];
    
    let zCursor = 0;
    
    // 1. Start Area (Safe)
    new Platform(0, 0, 0, 10, 10, 'START');
    zCursor = -10;
    
    // 2. Progression
    // Generate segments until we reach level length
    while (zCursor > -gameState.levelLength) {
        const segmentType = Math.floor(Math.random() * 4); // 0: Jumps, 1: Crumble Path, 2: Grapple Gap, 3: Mixed
        
        switch (segmentType) {
            case 0: // Basic Jumps
                for (let i = 0; i < 3; i++) {
                    // Reduced gap from (6+rnd*4) to (4+rnd*3)
                    zCursor -= 4 + Math.random() * 3;
                    const xOff = (Math.random() - 0.5) * 10;
                    new Platform(xOff, Math.random() * 2, zCursor, 5, 5, 'NORMAL');
                }
                break;
                
            case 1: // Crumble Path (Dense but dangerous)
                zCursor -= 2;
                for (let i = 0; i < 5; i++) {
                    // Reduced gap from 5 to 3.5
                    zCursor -= 3.5;
                    const xOff = (Math.random() - 0.5) * 5;
                    new Platform(xOff, 0, zCursor, 4, 4, 'CRUMBLE');
                }
                break;
                
            case 2: // Grapple Gap
                zCursor -= 5;
                // Add a launch platform
                new Platform(0, 1, zCursor, 4, 4, 'NORMAL');
                
                // Add gap with grapple points
                // Reduced gap size from 25 to 18
                const gapSize = 18;
                const pointHeight = 8 + Math.random() * 4;
                
                new GrapplePoint(0, pointHeight, zCursor - gapSize/2);
                if (Math.random() > 0.5) {
                    new GrapplePoint((Math.random()-0.5)*10, pointHeight + 2, zCursor - gapSize * 0.75);
                }
                
                zCursor -= gapSize;
                // Landing platform
                new Platform(0, -2, zCursor, 6, 6, 'NORMAL');
                break;
                
            case 3: // Thin Crumble Bridge
                zCursor -= 2;
                for (let i = 0; i < 8; i++) {
                    // Reduced gap from 3.5 to 2.8
                    zCursor -= 2.8;
                    // Winding path
                    const xOff = Math.sin(i * 0.5) * 5;
                    new Platform(xOff, Math.cos(i * 0.5) * 2, zCursor, 2.5, 3, 'CRUMBLE');
                }
                break;
        }
    }
    
    // 3. Finish Line
    zCursor -= 10;
    new Platform(0, -5, zCursor, 20, 20, 'FINISH');
    
    // Add visual finish gate
    const gateGeo = new THREE.TorusGeometry(5, 0.5, 16, 32);
    const gateMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffaa00 });
    const gate = new THREE.Mesh(gateGeo, gateMat);
    gate.position.set(0, 0, zCursor);
    gameState.scene.add(gate);
}