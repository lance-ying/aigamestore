import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_OPTS } from './globals.js';
import { Obstacle } from './entities.js';
import { randomRange } from './utils.js';

export class LevelGenerator {
    constructor() {
        this.nextSpawnX = CANVAS_WIDTH + 100;
        this.difficulty = 1;
        this.chunkSize = 300; // Standard gap between obstacles
    }
    
    reset() {
        this.nextSpawnX = CANVAS_WIDTH + 100;
        this.difficulty = 1;
    }
    
    update(scrollSpeed) {
        // Adjust nextSpawnX based on scrollSpeed so we track where to place things in world space relative to screen
        this.nextSpawnX -= scrollSpeed;
        
        if (this.nextSpawnX < CANVAS_WIDTH + 100) {
            this.spawnChunk();
        }
    }
    
    spawnChunk() {
        // Decide what to spawn
        const type = Math.random();
        
        // Ensure obstacles are reachable
        // Max height manageable is roughly (Canvas height - buffer) / egg size.
        // Let's say max 10 eggs = 300px.
        
        const maxHeight = 300;
        const minHeight = GAME_OPTS.eggSize;
        
        // Spawn an obstacle
        let h = Math.floor(randomRange(1, 10)) * GAME_OPTS.eggSize;
        // Sometimes make it "staircase" friendly
        
        if (type < 0.1) {
            // Gap - do nothing
            this.nextSpawnX += this.chunkSize;
        } else if (type < 0.4) {
            // Short wall
            h = GAME_OPTS.eggSize * Math.floor(randomRange(1, 3));
            gameState.obstacles.push(new Obstacle(CANVAS_WIDTH + 100, 50, h));
            this.nextSpawnX += this.chunkSize;
        } else if (type < 0.8) {
            // Medium/Tall wall
            h = GAME_OPTS.eggSize * Math.floor(randomRange(3, 8));
            gameState.obstacles.push(new Obstacle(CANVAS_WIDTH + 100, 50, h));
            this.nextSpawnX += this.chunkSize;
        } else {
            // "Staircase" or Double wall
            // Wall 1
            h = GAME_OPTS.eggSize * Math.floor(randomRange(2, 5));
            gameState.obstacles.push(new Obstacle(CANVAS_WIDTH + 100, 50, h));
            
            // Wall 2 closely after
            const h2 = GAME_OPTS.eggSize * Math.floor(randomRange(4, 9));
            gameState.obstacles.push(new Obstacle(CANVAS_WIDTH + 100 + 80, 50, h2));
            
            this.nextSpawnX += this.chunkSize * 1.5;
        }
    }
}