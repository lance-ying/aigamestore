import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, LANE_WIDTH, CHUNK_LENGTH, RENDER_DISTANCE } from './globals.js';
import { Enemy, Collectible, Obstacle } from './entities.js';
import { randomRange, randomInt, randomChoice, disposeObject } from './utils.js';

class WorldChunk {
    constructor(zPosition) {
        this.zPosition = zPosition;
        this.mesh = null;
        this.entities = [];
        this.generate();
    }

    generate() {
        // Ground Mesh
        const geometry = new THREE.PlaneGeometry(LANE_WIDTH * 3 + 4, CHUNK_LENGTH);
        const material = new THREE.MeshStandardMaterial({ 
            color: (Math.abs(this.zPosition) / CHUNK_LENGTH) % 2 === 0 ? 0x228822 : 0x229922, // Striped grass
            roughness: 1.0 
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.set(0, 0, this.zPosition - CHUNK_LENGTH / 2);
        this.mesh.receiveShadow = true;
        gameState.scene.add(this.mesh);

        // Spawn Entities
        this.spawnFeatures();
    }

    spawnFeatures() {
        // Don't spawn anything in the very first chunk
        if (this.zPosition > -20) return;

        const numFeatures = randomInt(1, 3);
        
        for (let i = 0; i < numFeatures; i++) {
            const lane = randomInt(-1, 1);
            const x = lane * LANE_WIDTH;
            const z = this.zPosition - randomRange(2, CHUNK_LENGTH - 2);
            
            const roll = Math.random();
            
            if (roll < 0.4) {
                // Coins
                const coinPatternLength = randomInt(3, 6);
                for (let k = 0; k < coinPatternLength; k++) {
                    const cz = z - k * 1.5;
                    const coin = new Collectible(x, 1, cz);
                    this.entities.push(coin);
                    gameState.entities.push(coin);
                }
            } else if (roll < 0.7) {
                // Obstacle
                const obstacle = new Obstacle(x, z, 'wall');
                this.entities.push(obstacle);
                gameState.entities.push(obstacle);
            } else {
                // Enemy
                const enemy = new Enemy(x, z);
                this.entities.push(enemy);
                gameState.entities.push(enemy);
            }
        }
        
        // Side walls (decoration)
        const leftWall = new Obstacle(-LANE_WIDTH * 2, this.zPosition - CHUNK_LENGTH/2, 'rock');
        const rightWall = new Obstacle(LANE_WIDTH * 2, this.zPosition - CHUNK_LENGTH/2, 'rock');
        this.entities.push(leftWall, rightWall);
        gameState.entities.push(leftWall, rightWall);
    }

    destroy() {
        if (this.mesh) {
            disposeObject(this.mesh);
            gameState.scene.remove(this.mesh);
        }
        
        // Entities are managed globally but associated here for cleanup logic if needed
        // but global list handles their updates.
        // We will filter out "dead" entities in the main loop.
    }
}

export function updateWorld(playerZ) {
    // Generate new chunks ahead
    const frontZ = gameState.worldChunks.length > 0 
        ? gameState.worldChunks[gameState.worldChunks.length - 1].zPosition 
        : 0;

    if (frontZ > playerZ - RENDER_DISTANCE) {
        const nextZ = frontZ - CHUNK_LENGTH;
        const chunk = new WorldChunk(nextZ);
        gameState.worldChunks.push(chunk);
    }

    // Remove old chunks behind
    if (gameState.worldChunks.length > 0) {
        const backChunk = gameState.worldChunks[0];
        if (backChunk.zPosition > playerZ + CHUNK_LENGTH * 2) {
            backChunk.destroy();
            gameState.worldChunks.shift();
        }
    }
}