import { gameState } from './globals.js';
import { Platform, Coin, Hazard, ExitPipe, Player } from './entities.js';

export function loadLevel(levelIndex) {
    gameState.platforms = [];
    gameState.coins = [];
    gameState.hazards = [];
    gameState.exit = null;
    gameState.particles = [];
    
    // Default floor for all levels to prevent infinite fall at start if missed
    // But we will design levels carefully.
    
    if (levelIndex === 0) {
        // LEVEL 1: EASY - Introduction
        gameState.worldWidth = 1200;
        gameState.worldHeight = 500;
        
        // Basics
        gameState.platforms.push(new Platform(0, 350, 400, 50)); // Start floor
        gameState.platforms.push(new Platform(500, 300, 300, 50)); // Second floor
        gameState.platforms.push(new Platform(900, 350, 300, 50)); // End floor
        
        // Floating platform (Lowered slightly to ensure accessibility)
        gameState.platforms.push(new Platform(600, 200, 100, 20));
        
        // Coins
        gameState.coins.push(new Coin(200, 320));
        gameState.coins.push(new Coin(300, 320));
        gameState.coins.push(new Coin(650, 170)); // High coin, now reachable with higher jump
        gameState.coins.push(new Coin(950, 320));
        
        // Hazards
        gameState.hazards.push(new Hazard(400, 380, 100, 20)); // Pit spikes
        
        // Exit
        gameState.exit = new ExitPipe(1100, 290);
        
        // Player Start
        gameState.player = new Player(50, 300);
    }
    else if (levelIndex === 1) {
        // LEVEL 2: EASY - Verticality & Floating
        gameState.worldWidth = 1200;
        gameState.worldHeight = 800;
        
        // Stairs up
        gameState.platforms.push(new Platform(0, 700, 300, 50));
        gameState.platforms.push(new Platform(350, 600, 150, 20));
        gameState.platforms.push(new Platform(550, 500, 150, 20));
        gameState.platforms.push(new Platform(350, 400, 150, 20));
        gameState.platforms.push(new Platform(550, 300, 150, 20));
        
        // Top platform
        gameState.platforms.push(new Platform(200, 200, 400, 20));
        
        // Float down area
        gameState.platforms.push(new Platform(800, 700, 400, 50)); // Exit area
        
        // Coins
        gameState.coins.push(new Coin(425, 570));
        gameState.coins.push(new Coin(625, 470));
        gameState.coins.push(new Coin(425, 370));
        gameState.coins.push(new Coin(400, 170)); // Top
        
        // Floating coins
        gameState.coins.push(new Coin(700, 400));
        gameState.coins.push(new Coin(750, 550));
        
        // Exit
        gameState.exit = new ExitPipe(1000, 640);
        
        // Player
        gameState.player = new Player(50, 650);
    }
    else if (levelIndex === 2) {
        // LEVEL 3: MEDIUM - Precision
        gameState.worldWidth = 1500;
        gameState.worldHeight = 600;
        
        gameState.platforms.push(new Platform(0, 400, 200, 50));
        
        // Island hopping
        gameState.platforms.push(new Platform(300, 400, 80, 20));
        gameState.platforms.push(new Platform(500, 350, 80, 20));
        gameState.platforms.push(new Platform(700, 400, 80, 20));
        gameState.platforms.push(new Platform(900, 300, 80, 20));
        
        // Long platform with gap
        gameState.platforms.push(new Platform(1100, 350, 400, 50));
        
        // Hazards
        gameState.hazards.push(new Hazard(200, 580, 900, 20)); // Sea of spikes
        
        // Coins
        gameState.coins.push(new Coin(340, 370));
        gameState.coins.push(new Coin(540, 320));
        gameState.coins.push(new Coin(740, 370));
        gameState.coins.push(new Coin(940, 270));
        
        gameState.exit = new ExitPipe(1400, 290);
        gameState.player = new Player(50, 350);
    }
    else if (levelIndex === 3) {
        // LEVEL 4: MEDIUM - The Tunnel
        gameState.worldWidth = 1600;
        gameState.worldHeight = 600;
        
        gameState.platforms.push(new Platform(0, 300, 200, 50));
        
        // Tunnel Floor
        gameState.platforms.push(new Platform(300, 400, 1000, 50));
        // Tunnel Ceiling (Raised to widen tunnel)
        gameState.platforms.push(new Platform(300, 200, 1000, 50));
        
        // Obstacles in tunnel
        gameState.platforms.push(new Platform(500, 350, 50, 50)); // Block
        gameState.platforms.push(new Platform(800, 250, 50, 50)); // Hanging Block (Raised)
        
        // Spikes (Raised to ensure damage)
        gameState.hazards.push(new Hazard(600, 390, 100, 20));
        gameState.hazards.push(new Hazard(900, 390, 100, 20));
        
        // Coins
        gameState.coins.push(new Coin(400, 370));
        gameState.coins.push(new Coin(650, 350)); // Over spike
        gameState.coins.push(new Coin(1000, 370));
        
        gameState.exit = new ExitPipe(1400, 340); // End of tunnel
        gameState.player = new Player(50, 250);
    }
    else if (levelIndex === 4) {
        // LEVEL 5: HARD - High Stakes
        gameState.worldWidth = 2000;
        gameState.worldHeight = 800;
        
        gameState.platforms.push(new Platform(0, 600, 200, 50));
        
        // High jumps
        gameState.platforms.push(new Platform(300, 500, 100, 20));
        gameState.platforms.push(new Platform(500, 400, 100, 20));
        gameState.platforms.push(new Platform(700, 300, 100, 20));
        gameState.platforms.push(new Platform(900, 200, 100, 20)); // Peak
        
        // Long float down
        gameState.platforms.push(new Platform(1300, 500, 100, 20));
        gameState.platforms.push(new Platform(1600, 400, 400, 50));
        
        // Hazards everywhere below
        gameState.hazards.push(new Hazard(200, 780, 1400, 20));
        
        // Coins
        gameState.coins.push(new Coin(350, 470));
        gameState.coins.push(new Coin(550, 370));
        gameState.coins.push(new Coin(750, 270));
        gameState.coins.push(new Coin(950, 170));
        gameState.coins.push(new Coin(1100, 300)); // Mid-air
        
        gameState.exit = new ExitPipe(1800, 340);
        gameState.player = new Player(50, 550);
    }
    else if (levelIndex === 5) {
        // LEVEL 6: HARD - The Gauntlet
        gameState.worldWidth = 2000;
        gameState.worldHeight = 600;
        
        gameState.platforms.push(new Platform(0, 300, 150, 50));
        
        // Tiny platforms
        gameState.platforms.push(new Platform(250, 300, 60, 20));
        gameState.platforms.push(new Platform(400, 300, 60, 20));
        gameState.platforms.push(new Platform(550, 250, 60, 20)); // Higher
        gameState.platforms.push(new Platform(700, 350, 60, 20)); // Lower
        
        // Spike wall jump (platform between spikes)
        gameState.platforms.push(new Platform(900, 300, 60, 20));
        gameState.hazards.push(new Hazard(850, 500, 300, 20));
        
        // Final stretch
        gameState.platforms.push(new Platform(1200, 300, 60, 20));
        gameState.platforms.push(new Platform(1400, 250, 60, 20));
        gameState.platforms.push(new Platform(1600, 300, 400, 50));
        
        // Spikes on platforms (Raised to ensure collision)
        gameState.hazards.push(new Hazard(1650, 290, 50, 20));
        
        // Coins
        gameState.coins.push(new Coin(280, 270));
        gameState.coins.push(new Coin(580, 220));
        gameState.coins.push(new Coin(730, 320));
        gameState.coins.push(new Coin(1230, 270));
        
        gameState.exit = new ExitPipe(1900, 240);
        gameState.player = new Player(50, 250);
    }
    else {
        // Fallback
        loadLevel(0);
    }
    
    gameState.totalCoinsInLevel = gameState.coins.length;
}