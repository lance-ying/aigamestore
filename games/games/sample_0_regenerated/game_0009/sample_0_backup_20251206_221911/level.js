import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, COLORS } from './globals.js';
import { Platform, Enemy, Collectible } from './entities.js';
import { randomRange, randomInt } from './utils.js';

export class LevelGenerator {
    constructor() {
        this.chunkHeight = 20;
        this.wellWidth = 18; // -9 to 9
        this.wellDepth = 18; // -9 to 9
        this.currentDepth = -10; // Start generating below start area
    }
    
    init() {
        // Build initial shaft walls for visual context
        this.buildShaftMesh();
        
        // Starting platform
        new Platform(0, -2, 0, 4, 1, 4);
        
        // Pre-generate deep level
        this.generateChunk(-gameState.maxDepth);
    }
    
    buildShaftMesh() {
        // A long tube
        const depth = gameState.maxDepth + 100;
        const geometry = new THREE.BoxGeometry(20, depth, 20);
        
        // Invert normals to see inside
        geometry.scale(-1, 1, 1);
        
        const material = new THREE.MeshStandardMaterial({ 
            color: COLORS.WALL,
            side: THREE.BackSide,
            roughness: 0.9
        });
        
        const shaft = new THREE.Mesh(geometry, material);
        shaft.position.y = -depth / 2 + 10;
        shaft.receiveShadow = true;
        gameState.scene.add(shaft);
    }
    
    generateChunk(targetDepth) {
        // Generate platforms until we reach target depth
        while (this.currentDepth > targetDepth) {
            const y = this.currentDepth;
            
            // Random pattern
            const pattern = randomInt(0, 3);
            
            if (pattern === 0) {
                // Two side platforms
                new Platform(-5, y, 0, 4, 1, 4);
                new Platform(5, y, 0, 4, 1, 4);
                this.spawnEnemy(0, y + 1, 0, 'floater');
            } else if (pattern === 1) {
                // Center platform
                new Platform(0, y, 0, 6, 1, 6);
                if (Math.random() > 0.3) {
                    this.spawnEnemy(0, y + 1, 0, 'crawler');
                } else {
                    new Collectible(0, y + 1.5, 0);
                }
            } else if (pattern === 2) {
                // Scattered small platforms
                const x = randomRange(-6, 6);
                const z = randomRange(-6, 6);
                new Platform(x, y, z, 3, 1, 3);
                if (Math.random() > 0.5) new Collectible(x, y + 1.5, z);
            }
            
            // Move down
            this.currentDepth -= randomRange(6, 10); // Gap between platforms
        }
        
        // Add floor at max depth
        new Platform(0, targetDepth - 5, 0, 20, 2, 20, 0xFFFFFF);
    }
    
    spawnEnemy(x, y, z, type) {
        const enemy = new Enemy(x, y, z, type);
        gameState.enemies.push(enemy);
    }
}