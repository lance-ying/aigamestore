import { Platform, Coin, Hazard, Goal } from './entities.js';

export function getLevelData(index) {
    const data = {
        platforms: [],
        hazards: [],
        coins: [],
        goal: null,
        playerStart: { x: 50, y: 300 },
        worldWidth: 1200,
        worldHeight: 600
    };

    // Floor for all levels
    data.platforms.push(new Platform(-100, 350, 2000, 100)); // Main ground

    if (index === 0) {
        // Level 1: Basics
        data.worldWidth = 1200;
        data.platforms.push(new Platform(200, 280, 100, 20, 'wood'));
        data.platforms.push(new Platform(400, 220, 100, 20, 'wood'));
        data.platforms.push(new Platform(600, 300, 50, 50, 'stone')); // Blockage
        
        data.coins.push(new Coin(250, 250));
        data.coins.push(new Coin(450, 190));
        data.coins.push(new Coin(625, 250));
        
        data.goal = new Goal(1100, 250, 60, 100);
        
    } else if (index === 1) {
        // Level 2: Spikes and Inflation (Floating)
        data.worldWidth = 1600;
        data.platforms.push(new Platform(300, 250, 150, 20)); // Platform over spikes
        
        // Spike pit
        data.hazards.push(new Hazard(500, 340, 200, 20)); // Spikes on floor
        
        // High platform requiring float
        data.platforms.push(new Platform(800, 200, 200, 20));
        
        data.coins.push(new Coin(350, 200));
        data.coins.push(new Coin(600, 300)); // Risky coin above spikes
        data.coins.push(new Coin(900, 150));
        
        data.goal = new Goal(1500, 250, 60, 100);
        
    } else if (index === 2) {
        // Level 3: Deflation (Precision/Drop)
        data.worldWidth = 2000;
        
        // Tight squeeze
        data.platforms.push(new Platform(300, 250, 100, 20));
        data.platforms.push(new Platform(300, 150, 100, 20)); // Ceiling
        
        // Drop shaft
        data.platforms.push(new Platform(600, 100, 20, 250)); // Wall
        data.platforms.push(new Platform(750, 100, 20, 250)); // Wall
        // Coins in shaft
        data.coins.push(new Coin(685, 150));
        data.coins.push(new Coin(685, 250));
        
        data.hazards.push(new Hazard(900, 340, 100, 20));
        
        data.goal = new Goal(1900, 250, 60, 100);
    }

    return data;
}