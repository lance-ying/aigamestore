/**
 * world.js
 * Terrain generation and management.
 */

import { WORLD_WIDTH, WORLD_HEIGHT, BLOCK, gameState, TILE_SIZE } from './globals.js';
import { ParticleSystem } from './particles.js';

export class World {
    constructor() {
        // Initialize empty world
        gameState.worldTiles = Array(WORLD_WIDTH).fill().map(() => Array(WORLD_HEIGHT).fill(BLOCK.AIR));
    }

    /**
     * Procedural Generation using 1D noise for surface and blobs for caves.
     */
    generate(p) {
        p.noiseDetail(4, 0.5);
        
        // 1. Terrain Heightmap
        for (let x = 0; x < WORLD_WIDTH; x++) {
            const noiseVal = p.noise(x * 0.05);
            const surfaceY = Math.floor(p.map(noiseVal, 0, 1, 10, 30));
            
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                if (y < surfaceY) {
                    gameState.worldTiles[x][y] = BLOCK.AIR;
                } else if (y === surfaceY) {
                    gameState.worldTiles[x][y] = BLOCK.GRASS;
                } else if (y > surfaceY && y < surfaceY + 5) {
                    gameState.worldTiles[x][y] = BLOCK.DIRT;
                } else if (y >= WORLD_HEIGHT - 2) {
                    gameState.worldTiles[x][y] = BLOCK.BEDROCK;
                } else {
                    gameState.worldTiles[x][y] = BLOCK.STONE;
                }
            }
        }

        // 2. Caves (Simplex-ish noise threshold)
        for (let x = 0; x < WORLD_WIDTH; x++) {
            for (let y = 15; y < WORLD_HEIGHT - 2; y++) {
                const caveNoise = p.noise(x * 0.08, y * 0.08);
                if (caveNoise > 0.6) {
                    gameState.worldTiles[x][y] = BLOCK.AIR;
                }
            }
        }

        // 3. Place the Blue Core (Win condition)
        // Ensure it's reachable but deep
        const coreX = Math.floor(p.random(10, WORLD_WIDTH - 10));
        const coreY = Math.floor(p.random(WORLD_HEIGHT - 10, WORLD_HEIGHT - 3));
        gameState.worldTiles[coreX][coreY] = BLOCK.CORE;
        
        // 4. Trees
        for (let x = 5; x < WORLD_WIDTH - 5; x++) {
            if (p.random() < 0.1) {
                this.growTree(x);
            }
        }
    }

    growTree(x) {
        // Find surface
        let y = 0;
        while (y < WORLD_HEIGHT && gameState.worldTiles[x][y] === BLOCK.AIR) {
            y++;
        }
        
        if (gameState.worldTiles[x][y] === BLOCK.GRASS) {
            // Trunk
            const height = Math.floor(Math.random() * 3) + 3;
            for (let i = 1; i <= height; i++) {
                if (y - i >= 0) gameState.worldTiles[x][y - i] = BLOCK.WOOD;
            }
            // Leaves
            const top = y - height;
            for (let lx = x - 2; lx <= x + 2; lx++) {
                for (let ly = top - 2; ly <= top; ly++) {
                    if (lx >= 0 && lx < WORLD_WIDTH && ly >= 0 && ly < WORLD_HEIGHT) {
                        if (gameState.worldTiles[lx][ly] === BLOCK.AIR) {
                            gameState.worldTiles[lx][ly] = BLOCK.LEAVES;
                        }
                    }
                }
            }
        }
    }

    /**
     * Safe setter for blocks.
     */
    setBlock(x, y, type) {
        if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
            gameState.worldTiles[x][y] = type;
        }
    }

    getBlock(x, y) {
        if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
            return gameState.worldTiles[x][y];
        }
        return BLOCK.BEDROCK; // Out of bounds acts as bedrock
    }

    /**
     * Render visible chunks.
     */
    render(p) {
        const startCol = Math.floor(gameState.cameraX / TILE_SIZE);
        const endCol = startCol + (p.width / TILE_SIZE) + 1;
        const startRow = Math.floor(gameState.cameraY / TILE_SIZE);
        const endRow = startRow + (p.height / TILE_SIZE) + 1;

        p.noStroke();
        
        for (let x = startCol; x <= endCol; x++) {
            for (let y = startRow; y <= endRow; y++) {
                if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
                    const block = gameState.worldTiles[x][y];
                    if (block !== BLOCK.AIR) {
                        const screenX = x * TILE_SIZE - gameState.cameraX;
                        const screenY = y * TILE_SIZE - gameState.cameraY;
                        
                        this.drawBlock(p, block, screenX, screenY);
                    }
                }
            }
        }
    }

    drawBlock(p, type, x, y) {
        switch (type) {
            case BLOCK.DIRT: p.fill(101, 67, 33); break;
            case BLOCK.GRASS: p.fill(34, 139, 34); break;
            case BLOCK.STONE: p.fill(128, 128, 128); break;
            case BLOCK.WOOD: p.fill(139, 69, 19); break;
            case BLOCK.LEAVES: p.fill(50, 205, 50); break;
            case BLOCK.BEDROCK: p.fill(20, 20, 20); break;
            case BLOCK.CORE: p.fill(0, 200, 255); p.stroke(255); p.strokeWeight(2); break;
            default: p.fill(255, 0, 255); break; // Error pink
        }
        p.rect(x, y, TILE_SIZE, TILE_SIZE);
        p.noStroke();
    }
}