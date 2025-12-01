// level.js
// Procedural or Data-driven level generation

import { gameState, WORLD_WIDTH, WORLD_HEIGHT, CANVAS_HEIGHT } from './globals.js';
import { Player, Platform, Hazard, Collectible, ExitDoor } from './entities.js';

export function loadLevel() {
    // Clear entities
    gameState.entities = [];
    gameState.platforms = [];
    gameState.hazards = [];
    gameState.collectibles = [];
    gameState.particles = [];
    
    // Reset state
    gameState.score = 0;
    
    // Level Design
    // Floor
    createPlatform(0, CANVAS_HEIGHT - 40, 800, 40); // Start floor
    createPlatform(900, CANVAS_HEIGHT - 40, 400, 40); // Gap jump
    createPlatform(1400, CANVAS_HEIGHT - 100, 300, 40); // Higher platform
    createPlatform(1800, CANVAS_HEIGHT - 40, 1200, 40); // End floor
    
    // Floating platforms
    createPlatform(300, 250, 100, 20);
    createPlatform(500, 180, 100, 20);
    createPlatform(750, 220, 100, 20);
    
    createPlatform(1100, 200, 100, 20);
    
    // Obstacles - Spikes
    createHazard(600, CANVAS_HEIGHT - 70, "SPIKE");
    createHazard(630, CANVAS_HEIGHT - 70, "SPIKE");
    createHazard(660, CANVAS_HEIGHT - 70, "SPIKE");
    
    createHazard(1350, CANVAS_HEIGHT - 40, "SPIKE"); // Pit fall hazard if missed platform
    
    createHazard(1900, CANVAS_HEIGHT - 70, "SPIKE");
    createHazard(2100, CANVAS_HEIGHT - 70, "SPIKE");
    
    // Collectibles (Coins)
    createCoin(350, 200);
    createCoin(550, 130);
    createCoin(800, 170);
    createCoin(1150, 150);
    createCoin(1550, 250); // Under platform
    createCoin(2000, 300);
    
    gameState.totalCoins = gameState.collectibles.length;
    
    // Player
    gameState.player = new Player(100, 300);
    gameState.entities.push(gameState.player);
    
    // Exit
    gameState.exitDoor = new ExitDoor(2800, CANVAS_HEIGHT - 120);
    gameState.entities.push(gameState.exitDoor);
}

function createPlatform(x, y, w, h) {
    const p = new Platform(x, y, w, h);
    gameState.platforms.push(p);
    gameState.entities.push(p);
}

function createHazard(x, y, type) {
    const h = new Hazard(x, y, type);
    gameState.hazards.push(h);
    gameState.entities.push(h);
}

function createCoin(x, y) {
    const c = new Collectible(x, y);
    gameState.collectibles.push(c);
    gameState.entities.push(c);
}