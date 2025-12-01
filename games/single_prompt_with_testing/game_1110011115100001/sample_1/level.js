import { gameState, CANVAS_HEIGHT, CANVAS_WIDTH } from './globals.js';
import { Player, Enemy, SoulStone } from './entities.js';

export class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

export function generateLevel() {
    // Reset State
    gameState.entities = [];
    gameState.platforms = [];
    gameState.collectibles = [];
    gameState.score = 0;
    gameState.stonesCollected = 0;
    
    // Create Player
    gameState.player = new Player(50, 300);
    
    // Generate Procedural-ish Level
    // Section 1: Start area
    createPlatform(0, CANVAS_HEIGHT - 20, 400, 20);
    
    // Section 2: Steps up
    createPlatform(450, 300, 100, 20);
    createPlatform(600, 250, 100, 20);
    
    // Enemy on platform
    gameState.entities.push(new Enemy(630, 220));
    
    // Section 3: Long run with gaps
    createPlatform(750, 250, 300, 20);
    gameState.collectibles.push(new SoulStone(900, 220));
    gameState.entities.push(new Enemy(850, 220));

    // Section 4: High tower
    createPlatform(1100, 200, 80, 20);
    createPlatform(1200, 150, 80, 20);
    createPlatform(1300, 100, 200, 20); // Top
    gameState.collectibles.push(new SoulStone(1400, 70));
    
    // Section 5: The Drop
    createPlatform(1600, 300, 400, 20);
    gameState.entities.push(new Enemy(1700, 270));
    gameState.entities.push(new Enemy(1800, 270));
    
    // Section 6: Final Gauntlet
    createPlatform(2100, 250, 100, 20);
    createPlatform(2300, 250, 100, 20);
    createPlatform(2500, 200, 200, 20);
    
    // Final Stone
    gameState.collectibles.push(new SoulStone(2600, 170));
    
    gameState.totalStones = gameState.collectibles.length;
}

function createPlatform(x, y, w, h) {
    gameState.platforms.push(new Platform(x, y, w, h));
}