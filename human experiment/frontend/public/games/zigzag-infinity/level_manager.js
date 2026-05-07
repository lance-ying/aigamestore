/**
 * Procedural generation of the ZigZag path.
 */

import { gameState, BLOCK_SIZE, getGameState } from './globals.js';
import { Block, Collectible } from './entities.js';
import { getGridKey } from './iso_math.js';

export class LevelManager {
    constructor() {
        this.currentGenX = 0;
        this.currentGenZ = 0;
        this.lastDirection = 0; // 0 for X, 1 for Z
        this.sectionLength = 0;
        
        // Keep track of visited blocks to drop them
        this.lastPlayerGridKey = null;
    }

    init() {
        // Create initial platform
        // 3x3 start area so player doesn't fall immediately
        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) {
                this.addBlock(x, z);
            }
        }
        
        // Start generating path from (0,0) outwards
        this.currentGenX = 0;
        this.currentGenZ = 0;
        
        // Pre-generate some path
        for (let i = 0; i < 20; i++) {
            this.generateNextBlock();
        }
    }

    addBlock(x, z) {
        const key = getGridKey(x, z);
        if (!gameState.blocks.has(key)) {
            gameState.blocks.set(key, new Block(x, z));
        }
    }

    generateNextBlock() {
        // Decide whether to switch direction
        // Limit segment length
        if (this.sectionLength > 2) {
             if (Math.random() < 0.4) {
                 this.switchGenDirection();
             }
        }
        
        if (this.sectionLength > 8) {
             this.switchGenDirection();
        }

        // Move in current direction
        if (this.lastDirection === 0) {
            this.currentGenX++;
        } else {
            this.currentGenZ++;
        }
        
        this.sectionLength++;
        this.addBlock(this.currentGenX, this.currentGenZ);

        // Chance to add collectible
        if (Math.random() < 0.15) {
            gameState.collectibles.push(new Collectible(this.currentGenX, this.currentGenZ));
        }
    }

    switchGenDirection() {
        this.lastDirection = this.lastDirection === 0 ? 1 : 0;
        this.sectionLength = 0;
    }

    update(player) {
        // Generate more blocks as player moves
        // Simple distance check: if head of generation is close to player, generate more
        const dist = Math.abs(player.x/BLOCK_SIZE - this.currentGenX) + Math.abs(player.z/BLOCK_SIZE - this.currentGenZ);
        if (dist < 30) {
            for(let i=0; i<5; i++) {
                this.generateNextBlock();
            }
        }

        // Handle falling blocks logic
        // Identify the block the player just left
        const pGridX = Math.round(player.x / BLOCK_SIZE);
        const pGridZ = Math.round(player.z / BLOCK_SIZE);
        const currentKey = getGridKey(pGridX, pGridZ);

        if (this.lastPlayerGridKey && this.lastPlayerGridKey !== currentKey) {
            // Player moved to a new block
            // Find blocks "behind" the player to drop
            // We can iterate all blocks and drop those that are far behind
            // Optimization: Just drop the one we left?
            // "ZigZag" style usually drops the whole tail.
            
            // Let's iterate keys and drop blocks strictly "less" than current pos in the relevant axis?
            // Since path zigzags, "less" is tricky.
            // Better: Drop blocks that are effectively unreachable or passed.
            // A simple heuristic: Any block with gridX < pGridX AND gridZ < pGridZ is definitely behind?
            // No, because of zigzag.
            
            // Just drop blocks based on a delay queue or just distance.
            // Actually, the game mechanic usually drops the block immediately after you leave it.
            
            // Let's implement delayed drop for the block we just left.
            const previousBlock = gameState.blocks.get(this.lastPlayerGridKey);
            if (previousBlock) {
                 previousBlock.triggerFall(20); // Delay 20 frames
                 gameState.fallingBlocks.push(previousBlock);
                 gameState.blocks.delete(this.lastPlayerGridKey);
                 
                 // Increment score for every block passed
                 gameState.score++;
            }
        }
        this.lastPlayerGridKey = currentKey;
        
        // Clean up falling blocks that are way down
        for (let i = gameState.fallingBlocks.length - 1; i >= 0; i--) {
            const block = gameState.fallingBlocks[i];
            block.update();
            if (block.y < -500) {
                gameState.fallingBlocks.splice(i, 1);
            }
        }
        
        // Clean up collectibles
        for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
            const c = gameState.collectibles[i];
            // Remove if far behind
            if (c.gridX < pGridX - 5 && c.gridZ < pGridZ - 5) {
                gameState.collectibles.splice(i, 1);
            }
        }
    }

    reset() {
        this.currentGenX = 0;
        this.currentGenZ = 0;
        this.lastDirection = 0;
        this.sectionLength = 0;
        this.lastPlayerGridKey = null;
        this.init();
    }
}