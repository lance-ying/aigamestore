import { gameState, CANVAS_HEIGHT } from './globals.js';
import { Platform, Coin, Spike, Goal } from './entities.js';

export function loadLevel() {
    const platforms = gameState.platforms;
    const hazards = gameState.hazards;
    const coins = gameState.collectibles;

    const groundY = CANVAS_HEIGHT - 40;

    // 1. Intro Floor
    platforms.push(new Platform(0, groundY, 800, 40));
    
    // Coins
    coins.push(new Coin(300, groundY - 50));
    coins.push(new Coin(400, groundY - 50));
    coins.push(new Coin(500, groundY - 80));

    // 2. The Gap (Need Float)
    // Gap from 800 to 1200
    // Small island in middle
    platforms.push(new Platform(950, groundY + 20, 100, 40)); // Low island
    coins.push(new Coin(900, groundY - 100)); // Arc guide
    coins.push(new Coin(1000, groundY - 120));
    coins.push(new Coin(1100, groundY - 100));

    // Landing
    platforms.push(new Platform(1200, groundY, 400, 40));

    // 3. High Steps (Need momentum or float)
    platforms.push(new Platform(1600, groundY - 50, 100, 90));
    platforms.push(new Platform(1750, groundY - 120, 100, 160));
    platforms.push(new Platform(1900, groundY - 190, 100, 230));
    
    coins.push(new Coin(1650, groundY - 80));
    coins.push(new Coin(1800, groundY - 150));
    coins.push(new Coin(1950, groundY - 220));

    // 4. The Drop (Deflate precision)
    platforms.push(new Platform(2100, groundY - 190, 300, 230));
    // Spikes below
    platforms.push(new Platform(2400, groundY, 500, 40));
    hazards.push(new Spike(2500, groundY - 30, 300));
    
    // Safe platform above spikes? No, jump over spikes.
    // Or float over.
    coins.push(new Coin(2650, groundY - 150)); // High coin forcing float

    // 5. Physics Puzzle Area (Tight squeeze)
    // Tunnel
    platforms.push(new Platform(2900, groundY, 600, 40));
    platforms.push(new Platform(2900, groundY - 100, 600, 40)); // Ceiling
    
    // Coins in tunnel
    coins.push(new Coin(3000, groundY - 50));
    coins.push(new Coin(3100, groundY - 50));
    coins.push(new Coin(3200, groundY - 50));

    // 6. Final Stretch
    platforms.push(new Platform(3500, groundY, 400, 40));
    
    // Goal
    gameState.goal = new Goal(3800, groundY - 40);
    
    gameState.totalCoins = coins.length;
}