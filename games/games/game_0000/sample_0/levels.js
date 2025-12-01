import { Platform, Coin, Spike, LevelExit } from './entities.js';
import { gameState } from './globals.js';

export function loadLevel(index) {
    // Clear existing
    gameState.platforms = [];
    gameState.collectibles = [];
    gameState.hazards = [];
    gameState.exits = [];
    gameState.particles = [];
    gameState.entities = [];
    gameState.player = null;
    
    // Level Design
    if (index === 0) {
        // Tutorial Level
        new Platform(0, 350, 800, 50, "stone"); // Floor
        new Platform(300, 250, 100, 20, "wood");
        new Platform(500, 200, 100, 20, "wood");
        
        new Coin(350, 220);
        new Coin(550, 170);
        new Coin(700, 320);
        
        new LevelExit(750, 290);
        
        return { startX: 50, startY: 300, width: 800 };
    } else if (index === 1) {
        // Spikes and Gaps
        new Platform(0, 350, 300, 50, "stone");
        new Platform(400, 350, 200, 50, "stone");
        new Platform(700, 300, 300, 50, "stone");
        
        new Spike(300, 380, 100); // Spikes in the pit? No, spike hitbox is simple rect. Place carefully.
        // Actually spikes at bottom
        new Spike(300, 350, 100); // Wait, spikes need to be visible.
        
        // Floating platforms
        new Platform(320, 250, 60, 20, "wood");
        
        new Coin(350, 200);
        new Coin(500, 320);
        new Coin(850, 270);
        
        new LevelExit(900, 240);
        
        return { startX: 50, startY: 300, width: 1000 };
    } else {
        // Win State
        return null;
    }
}