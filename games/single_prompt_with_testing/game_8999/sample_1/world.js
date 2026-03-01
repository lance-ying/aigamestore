import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, WORLD_SIZE, WORLD_HEIGHT, BLOCK_SIZE, BLOCKS } from './globals.js';
import { noise2D } from './utils.js';
import { materials } from './textures.js';

export class World {
    constructor() {
        this.data = new Uint8Array(WORLD_SIZE * WORLD_HEIGHT * WORLD_SIZE);
        this.blockMeshes = {}; // Map of ID -> InstancedMesh
        this.dummy = new THREE.Object3D(); // Helper for matrix calculations
        this.generate();
    }

    getIndex(x, y, z) {
        return x + WORLD_SIZE * (y + WORLD_HEIGHT * z);
    }
    
    getPosition(index) {
        const z = Math.floor(index / (WORLD_SIZE * WORLD_HEIGHT));
        const rem = index % (WORLD_SIZE * WORLD_HEIGHT);
        const y = Math.floor(rem / WORLD_SIZE);
        const x = rem % WORLD_SIZE;
        return { x, y, z };
    }

    getBlock(x, y, z) {
        if (!this.inBounds(x, y, z)) return BLOCKS.AIR;
        return this.data[this.getIndex(x, y, z)];
    }

    setBlock(x, y, z, id) {
        if (!this.inBounds(x, y, z)) return;
        this.data[this.getIndex(x, y, z)] = id;
        gameState.blockUpdatesNeeded = true;
    }

    inBounds(x, y, z) {
        return x >= 0 && x < WORLD_SIZE && y >= 0 && y < WORLD_HEIGHT && z >= 0 && z < WORLD_SIZE;
    }

    generate() {
        console.log("Generating world...");
        for (let x = 0; x < WORLD_SIZE; x++) {
            for (let z = 0; z < WORLD_SIZE; z++) {
                // Terrain Height
                const groundHeight = Math.floor(noise2D(x, z, 0.15, 6)) + 4; // Base height 4, max +6 = 10
                
                for (let y = 0; y < WORLD_HEIGHT; y++) {
                    let type = BLOCKS.AIR;
                    
                    if (y === 0) type = BLOCKS.BEDROCK;
                    else if (y < groundHeight - 1) type = BLOCKS.STONE;
                    else if (y < groundHeight) type = BLOCKS.DIRT;
                    else if (y === groundHeight) type = BLOCKS.GRASS;
                    
                    // Trees?
                    if (y === groundHeight + 1 && Math.random() < 0.02) {
                        this.generateTree(x, y, z);
                    } else if (type !== BLOCKS.AIR) {
                        this.setBlock(x, y, z, type);
                    }
                }
            }
        }
        this.updateMeshes();
    }
    
    generateTree(rootX, rootY, rootZ) {
        // Simple tree: 3 wood, some leaves
        if (rootY + 4 >= WORLD_HEIGHT) return;
        
        // Trunk
        for (let i = 0; i < 3; i++) {
            this.setBlock(rootX, rootY + i, rootZ, BLOCKS.WOOD);
        }
        
        // Leaves
        for (let x = rootX - 1; x <= rootX + 1; x++) {
            for (let z = rootZ - 1; z <= rootZ + 1; z++) {
                for (let y = rootY + 2; y <= rootY + 3; y++) {
                    if (this.inBounds(x, y, z) && this.getBlock(x, y, z) === BLOCKS.AIR) {
                        if (x === rootX && z === rootZ && y < rootY + 3) continue; // Don't overwrite trunk
                        this.setBlock(x, y, z, BLOCKS.LEAVES);
                    }
                }
            }
        }
        // Top leaf
        this.setBlock(rootX, rootY + 3, rootZ, BLOCKS.LEAVES);
    }

    updateMeshes() {
        // Clear existing
        for (const key in this.blockMeshes) {
            gameState.scene.remove(this.blockMeshes[key]);
            this.blockMeshes[key].dispose(); // Clean up geometry/materials? careful with shared mats
        }
        this.blockMeshes = {};

        // Count blocks per type
        const counts = {};
        for (let i = 0; i < this.data.length; i++) {
            const id = this.data[i];
            if (id !== BLOCKS.AIR) {
                counts[id] = (counts[id] || 0) + 1;
            }
        }

        // Create InstancedMeshes
        const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        
        for (const [idStr, count] of Object.entries(counts)) {
            const id = parseInt(idStr);
            if (count === 0) continue;

            const mesh = new THREE.InstancedMesh(geometry, materials[id], count);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.blockMeshes[id] = mesh;
            gameState.scene.add(mesh);
        }

        // Set matrices
        const indices = {}; // Track index for each type
        for (let x = 0; x < WORLD_SIZE; x++) {
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                for (let z = 0; z < WORLD_SIZE; z++) {
                    const id = this.getBlock(x, y, z);
                    if (id !== BLOCKS.AIR) {
                        const idx = indices[id] || 0;
                        indices[id] = idx + 1;
                        
                        this.dummy.position.set(x, y, z);
                        this.dummy.updateMatrix();
                        this.blockMeshes[id].setMatrixAt(idx, this.dummy.matrix);
                    }
                }
            }
        }
        
        // Mark updates
        for (const key in this.blockMeshes) {
            this.blockMeshes[key].instanceMatrix.needsUpdate = true;
        }
        
        gameState.blockUpdatesNeeded = false;
    }
}