/**
 * Procedural generation or static definition of game levels.
 * Creates platforms, enemies, and collectibles based on coordinates.
 */
import { Platform, Enemy, Collectible, Player } from './entities.js';
import { gameState, CANVAS_HEIGHT } from './globals.js';

export function loadLevel() {
    // Reset objects
    gameState.platforms = [];
    gameState.enemies = [];
    gameState.collectibles = [];
    
    // Create Ground Floor (long strip with gaps)
    createPlatform(0, CANVAS_HEIGHT - 40, 600, 40);
    createPlatform(700, CANVAS_HEIGHT - 40, 500, 40); // Gap 600-700
    createPlatform(1300, CANVAS_HEIGHT - 40, 800, 40);
    createPlatform(2200, CANVAS_HEIGHT - 40, 1000, 40); // Final stretch
    
    // Create Platforms (Parkour)
    createPlatform(300, 250, 100, 20);
    createPlatform(450, 200, 100, 20);
    createPlatform(650, 250, 100, 20); // Bridge the gap
    
    // Higher route
    createPlatform(800, 150, 200, 20);
    createPlatform(1100, 200, 100, 20);
    
    // Dash Challenge Section
    createPlatform(1500, 250, 50, 200); // Wall to jump over
    createPlatform(1400, 150, 80, 20); // Step up
    
    // Spikes/Hazards are implied by pits for now (y > bound)
    
    // Enemies
    new Enemy(400, 320, 'PATROL');
    new Enemy(900, 110, 'PATROL');
    new Enemy(1400, 320, 'JUMP');
    new Enemy(2400, 320, 'PATROL');
    new Enemy(2600, 320, 'JUMP');

    // Collectibles
    new Collectible(350, 220, 'STAR');
    new Collectible(500, 170, 'STAR');
    new Collectible(650, 300, 'STAR'); // Pit bait
    new Collectible(900, 120, 'STAR');
    
    // Powerups
    new Collectible(200, 300, 'POWERUP_DASH'); // Early dash unlock
    
    // Goal Portal
    const portal = new Collectible(2900, 300, 'PORTAL');
    portal.radius = 20;

    // Initialize Player
    gameState.player = new Player(50, 300);
    gameState.entities.push(gameState.player);
}

function createPlatform(x, y, w, h, type) {
    new Platform(x, y, w, h, type);
}