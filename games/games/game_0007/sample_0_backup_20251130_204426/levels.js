import { gameState } from './globals.js';
import { Platform, Coin, Hazard, ExitPipe, Player } from './entities.js';

export function loadLevel(levelIndex) {
    gameState.platforms = [];
    gameState.coins = [];
    gameState.hazards = [];
    gameState.exit = null;
    gameState.particles = [];
    
    // Default floor for all levels to prevent infinite fall at start
    // gameState.platforms.push(new Platform(-100, gameState.worldHeight - 20, gameState.worldWidth + 200, 40));
    
    if (levelIndex === 0) {
        // Level 1: Introduction
        gameState.worldWidth = 1200;
        gameState.worldHeight = 500;
        
        // Floor segments
        gameState.platforms.push(new Platform(0, 350, 400, 50));
        gameState.platforms.push(new Platform(500, 300, 300, 50));
        gameState.platforms.push(new Platform(900, 350, 300, 50));
        
        // Floating platform
        gameState.platforms.push(new Platform(600, 180, 100, 20));
        
        // Coins
        gameState.coins.push(new Coin(200, 320));
        gameState.coins.push(new Coin(300, 320));
        gameState.coins.push(new Coin(650, 150)); // High coin
        gameState.coins.push(new Coin(950, 320));
        
        // Hazards
        gameState.hazards.push(new Hazard(400, 380, 100, 20)); // Spike pit floor
        
        // Exit
        gameState.exit = new ExitPipe(1100, 290);
        
        // Player Start
        gameState.player = new Player(50, 300);
    }
    else if (levelIndex === 1) {
        // Level 2: Precision
        gameState.worldWidth = 1600;
        gameState.worldHeight = 600;
        
        // Platforms
        gameState.platforms.push(new Platform(0, 400, 200, 50)); // Start
        gameState.platforms.push(new Platform(250, 350, 100, 20));
        gameState.platforms.push(new Platform(400, 300, 100, 20));
        
        // Tight tunnel (Deflate needed?)
        gameState.platforms.push(new Platform(600, 250, 300, 20)); // Tunnel floor
        gameState.platforms.push(new Platform(600, 200, 300, 20)); // Tunnel ceiling (30px gap - need deflate or precision)
        
        // Big drop
        gameState.platforms.push(new Platform(1000, 500, 200, 50));
        
        // Stairs
        gameState.platforms.push(new Platform(1300, 450, 100, 20));
        gameState.platforms.push(new Platform(1450, 400, 150, 20));
        
        // Hazards
        gameState.hazards.push(new Hazard(200, 580, 800, 20)); // Floor spikes
        gameState.hazards.push(new Hazard(700, 240, 20, 10)); // Tiny spike in tunnel?
        
        // Coins
        gameState.coins.push(new Coin(250, 320));
        gameState.coins.push(new Coin(450, 270));
        gameState.coins.push(new Coin(750, 235)); // In tunnel
        gameState.coins.push(new Coin(1100, 470));
        
        // Exit
        gameState.exit = new ExitPipe(1500, 340);
        
        // Player
        gameState.player = new Player(50, 350);
    } 
    else {
        // Fallback or Loop
        loadLevel(0);
    }
    
    gameState.totalCoinsInLevel = gameState.coins.length;
}