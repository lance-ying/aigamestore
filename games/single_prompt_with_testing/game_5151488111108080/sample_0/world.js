/**
 * world.js
 * Manages procedural generation of the path, tiles, and collectibles.
 */

import { gameState, CONSTANTS, CANVAS_HEIGHT } from './globals.js';
import { Tile, Collectible } from './entities.js';
import { randomRange, randomInt } from './utils.js';

export class WorldManager {
    constructor() {
        this.tiles = [];
        this.nextSpawnY = 0;
        this.lastTileX = 0;
        this.tileIndex = 0;
        
        // Generation parameters
        this.pathWidth = CONSTANTS.LANE_WIDTH;
        this.difficulty = 1;
    }
    
    init() {
        this.tiles = [];
        this.nextSpawnY = 0;
        this.lastTileX = 0;
        this.tileIndex = 0;
        
        // Spawn initial safety platform
        const startTile = new Tile(0, 0, 120, 400); // Big start platform
        startTile.active = true; // Safe to land
        this.tiles.push(startTile);
        gameState.entities.push(startTile);
        
        this.nextSpawnY = 400; // Next tile starts after the big platform
        
        // Pre-generate some tiles
        for (let i = 0; i < 10; i++) {
            this.spawnNextTile();
        }
    }
    
    update(playerY) {
        // Spawn new tiles ahead of player
        // We want tiles to exist up to Y + 1000
        while (this.nextSpawnY < playerY + 1200) {
            this.spawnNextTile();
        }
        
        // Clean up old tiles behind player
        const cleanupThreshold = playerY - 400; // Tiles far behind
        
        // Filter out dead tiles from main entities list
        for (let i = gameState.entities.length - 1; i >= 0; i--) {
            const ent = gameState.entities[i];
            if (ent instanceof Tile && ent.y + ent.height < cleanupThreshold) {
                ent.dead = true;
                gameState.entities.splice(i, 1);
                
                // Also remove from local tiles array
                const tileIdx = this.tiles.indexOf(ent);
                if (tileIdx > -1) this.tiles.splice(tileIdx, 1);
            }
        }
        
        // Update difficulty based on distance
        this.difficulty = 1 + (playerY / 5000);
        gameState.difficultyMultiplier = this.difficulty;
        gameState.currentSpeed = Math.min(
            CONSTANTS.FORWARD_SPEED_MAX, 
            CONSTANTS.FORWARD_SPEED_INITIAL + (playerY / 2000)
        );
    }
    
    spawnNextTile() {
        this.tileIndex++;
        
        // Calculate X position
        // Random walk constrained to lane width
        const maxStep = 150 * Math.min(1.5, this.difficulty);
        let nextX = this.lastTileX + randomRange(-maxStep, maxStep);
        
        // Keep within bounds with margin
        const limit = (CONSTANTS.LANE_WIDTH / 2) - CONSTANTS.TILE_WIDTH;
        if (nextX < -limit) nextX = -limit + 50;
        if (nextX > limit) nextX = limit - 50;
        
        // Tile properties
        // Shrink width as difficulty increases
        let w = Math.max(50, CONSTANTS.TILE_WIDTH - (this.difficulty * 5));
        let h = CONSTANTS.TILE_HEIGHT;
        
        // Tile Type
        let type = 'NORMAL';
        if (this.difficulty > 1.5 && Math.random() < 0.3) {
            type = 'MOVING';
        }
        
        const tile = new Tile(nextX, this.nextSpawnY, w, h, type);
        this.tiles.push(tile);
        gameState.entities.push(tile);
        
        this.lastTileX = nextX;
        
        // Chance to spawn collectible
        if (Math.random() < 0.4) {
            const gem = new Collectible(nextX, this.nextSpawnY + h/2);
            gameState.collectibles.push(gem);
            gameState.entities.push(gem);
        }
        
        // Advance Y
        const gap = CONSTANTS.TILE_SPACING_Y * Math.min(1.2, this.difficulty);
        this.nextSpawnY += gap;
    }
    
    getTiles() {
        return this.tiles;
    }
}