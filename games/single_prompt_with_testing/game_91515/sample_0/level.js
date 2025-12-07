import { gameState, CANVAS_HEIGHT } from './globals.js';
import { Player, Enemy, Collectible } from './entities.js';

export class Platform {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }
}

export function generateLevel() {
    gameState.entities = [];
    gameState.platforms = [];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.collectibles = [];
    
    // Create Ground
    createPlatform(0, CANVAS_HEIGHT - 40, 3000, 40);
    
    // Walls
    createPlatform(-20, 0, 20, CANVAS_HEIGHT * 2);
    createPlatform(3000, 0, 20, CANVAS_HEIGHT * 2);
    
    // Level Design
    // 1. Initial platforms
    createPlatform(300, 250, 100, 20);
    createPlatform(500, 200, 100, 20);
    
    // 2. High wall requiring jump
    createPlatform(700, 200, 50, 200);
    
    // 3. Floating islands
    createPlatform(800, 150, 200, 20);
    createPlatform(1100, 250, 150, 20);
    
    // 4. Tunnel section (Cat specific area, technically optional for win, but good for bonus)
    // A low ceiling tunnel
    createPlatform(1300, 200, 400, 20); // Ceiling
    createPlatform(1300, 250, 400, 20); // Floor (tight squeeze 30px, Mech is 48px)
    // Wait, if Mech is 48 high, gap needs to be < 48 to block it. 
    // Gap: 250 - (200 + 20) = 30px. Mech height 48. Cat height 14. Perfect.
    
    // Route above tunnel for Mech?
    createPlatform(1300, 100, 100, 20);
    createPlatform(1500, 100, 100, 20);
    
    // 5. Boss/End area
    createPlatform(1800, 200, 200, 20);
    createPlatform(2100, 300, 300, 20);
    
    // Entities
    gameState.player = new Player(100, 300);
    gameState.entities.push(gameState.player);
    
    // Enemies
    gameState.enemies.push(new Enemy(500, 100, 'FLYER'));
    gameState.enemies.push(new Enemy(900, 120, 'WALKER'));
    gameState.enemies.push(new Enemy(1400, 220, 'WALKER')); // In tunnel? No, walker fits? Walker is 30x30, fits exactly.
    gameState.enemies.push(new Enemy(1900, 150, 'FLYER'));
    
    gameState.enemies.forEach(e => gameState.entities.push(e));
    
    // Collectibles
    const ship = new Collectible(2300, 250, 'GOAL');
    gameState.collectibles.push(ship);
    gameState.entities.push(ship);
    
    const hp = new Collectible(1500, 225, 'HEALTH'); // Inside tunnel
    gameState.collectibles.push(hp);
    gameState.entities.push(hp);
}

function createPlatform(x, y, w, h) {
    gameState.platforms.push(new Platform(x, y, w, h));
}