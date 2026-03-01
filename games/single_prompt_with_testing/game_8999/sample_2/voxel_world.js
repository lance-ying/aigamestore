import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, WORLD_SIZE, WORLD_HEIGHT, BLOCKS } from './globals.js';
import { textureManager } from './textures.js';

export class VoxelWorld {
    constructor() {
        this.cellSize = WORLD_SIZE;
        this.cellHeight = WORLD_HEIGHT;
        this.data = new Uint8Array(this.cellSize * this.cellHeight * this.cellSize);
        
        // Instanced Meshes for rendering
        this.meshes = {};
        this.dirty = true;
        
        // Initialize instanced meshes for each block type
        this.blockTypes = [BLOCKS.DIRT, BLOCKS.STONE, BLOCKS.WOOD, BLOCKS.BRICK, BLOCKS.LEAF];
        this.maxInstances = 5000; // Max blocks per type for this demo
        this.dummy = new THREE.Object3D();
        
        this.generateTerrain();
        this.initMeshes();
    }

    initMeshes() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        
        this.blockTypes.forEach(type => {
            const material = textureManager.getMaterial(type);
            const mesh = new THREE.InstancedMesh(geometry, material, this.maxInstances);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.count = 0; // Start with 0 visible
            this.meshes[type] = mesh;
            gameState.scene.add(mesh);
        });
    }

    getIndex(x, y, z) {
        return y * this.cellSize * this.cellSize + z * this.cellSize + x;
    }

    getBlock(x, y, z) {
        if (!this.inBounds(x, y, z)) return BLOCKS.AIR;
        return this.data[this.getIndex(x, y, z)];
    }

    setBlock(x, y, z, type) {
        if (!this.inBounds(x, y, z)) return;
        this.data[this.getIndex(x, y, z)] = type;
        this.dirty = true;
    }

    inBounds(x, y, z) {
        return x >= 0 && x < this.cellSize &&
               y >= 0 && y < this.cellHeight &&
               z >= 0 && z < this.cellSize;
    }

    generateTerrain() {
        // Use Math.seedrandom as the library attaches to the Math object
        const p = new Math.seedrandom('voxel_seed'); 
        
        for (let x = 0; x < this.cellSize; x++) {
            for (let z = 0; z < this.cellSize; z++) {
                // Simple heightmap
                const height = Math.floor(5 + Math.abs(Math.sin(x * 0.1) + Math.cos(z * 0.1)) * 3);
                
                for (let y = 0; y < this.cellHeight; y++) {
                    let type = BLOCKS.AIR;
                    
                    if (y < height) {
                        type = BLOCKS.DIRT;
                        if (y < height - 2) type = BLOCKS.STONE;
                    } else if (y === height) {
                        type = BLOCKS.DIRT; // Top layer dirt (could be grass)
                        // Random trees
                        if (x > 5 && x < this.cellSize-5 && z > 5 && z < this.cellSize-5) {
                            if (p() > 0.98) {
                                this.generateTree(x, y + 1, z);
                            }
                        }
                    }
                    
                    if (type !== BLOCKS.AIR) {
                        this.setBlock(x, y, z, type);
                    }
                }
            }
        }
    }

    generateTree(x, y, z) {
        // Trunk
        for (let i = 0; i < 4; i++) {
            this.setBlock(x, y + i, z, BLOCKS.WOOD);
        }
        // Leaves
        for (let lx = -2; lx <= 2; lx++) {
            for (let lz = -2; lz <= 2; lz++) {
                for (let ly = 2; ly <= 4; ly++) {
                    if (Math.abs(lx) + Math.abs(lz) + Math.abs(ly-3) <= 4) { // Roughly spherical
                        const bx = x + lx;
                        const by = y + ly;
                        const bz = z + lz;
                        if (this.getBlock(bx, by, bz) === BLOCKS.AIR) {
                            this.setBlock(bx, by, bz, BLOCKS.LEAF);
                        }
                    }
                }
            }
        }
    }

    update() {
        if (!this.dirty) return;

        // Rebuild instances (Naive approach: iterate all blocks)
        // Optimization: only iterate populated blocks if we had a sparse structure, 
        // but dense array is fast for this size.
        
        const counts = {};
        this.blockTypes.forEach(t => counts[t] = 0);

        // Limit range around player to keep instance count within limits if needed?
        // For now, iterate whole world. 64x32x64 = 131k cells. Too many for JS loop every frame.
        // Solution: Only update when changed, and only render visible faces? 
        // Simplification: We only update when 'dirty' flag is true (on place/break).
        // Also, we only add instances for non-air blocks.
        
        // Clear all
        this.blockTypes.forEach(t => {
            this.meshes[t].count = 0;
        });

        let instanceIdx = {};
        this.blockTypes.forEach(t => instanceIdx[t] = 0);

        for (let y = 0; y < this.cellHeight; y++) {
            for (let z = 0; z < this.cellSize; z++) {
                for (let x = 0; x < this.cellSize; x++) {
                    const type = this.getBlock(x, y, z);
                    if (type !== BLOCKS.AIR && this.meshes[type]) {
                        // Check visibility (occlusion culling basic)
                        if (this.isBlockVisible(x, y, z)) {
                             const mesh = this.meshes[type];
                             const idx = instanceIdx[type];
                             
                             if (idx < this.maxInstances) {
                                 this.dummy.position.set(x + 0.5, y + 0.5, z + 0.5);
                                 this.dummy.updateMatrix();
                                 mesh.setMatrixAt(idx, this.dummy.matrix);
                                 instanceIdx[type]++;
                             }
                        }
                    }
                }
            }
        }

        this.blockTypes.forEach(t => {
            this.meshes[t].count = instanceIdx[t];
            this.meshes[t].instanceMatrix.needsUpdate = true;
        });

        this.dirty = false;
    }

    isBlockVisible(x, y, z) {
        // A block is visible if any of its 6 neighbors is AIR or out of bounds
        return (
            this.getBlock(x+1, y, z) === BLOCKS.AIR ||
            this.getBlock(x-1, y, z) === BLOCKS.AIR ||
            this.getBlock(x, y+1, z) === BLOCKS.AIR ||
            this.getBlock(x, y-1, z) === BLOCKS.AIR ||
            this.getBlock(x, y, z+1) === BLOCKS.AIR ||
            this.getBlock(x, y, z-1) === BLOCKS.AIR
        );
    }
    
    // Physics helper: check box intersection
    checkIntersection(x, y, z, w, h, d) {
        const minX = Math.floor(x);
        const maxX = Math.floor(x + w);
        const minY = Math.floor(y);
        const maxY = Math.floor(y + h);
        const minZ = Math.floor(z);
        const maxZ = Math.floor(z + d);
        
        for (let ix = minX; ix <= maxX; ix++) {
            for (let iy = minY; iy <= maxY; iy++) {
                for (let iz = minZ; iz <= maxZ; iz++) {
                    if (this.getBlock(ix, iy, iz) !== BLOCKS.AIR) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}