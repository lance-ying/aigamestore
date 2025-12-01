import { gameState, CANVAS_HEIGHT } from './globals.js';
import { Platform, Sawblade, Enemy, Goal } from './entities.js';

export function generateLevel(levelNum) {
    // Reset state lists
    gameState.platforms = [];
    gameState.hazards = [];
    gameState.enemies = [];
    gameState.goal = null;

    let currentX = 50;
    let currentY = CANVAS_HEIGHT - 100;
    
    // Starting platform
    gameState.platforms.push(new Platform(0, CANVAS_HEIGHT - 50, 200, 500));
    
    // Procedural generation parameters
    const segmentCount = 10 + levelNum * 2;
    
    for (let i = 0; i < segmentCount; i++) {
        const segmentType = Math.floor(Math.random() * 4); // 0: Flat, 1: Gap, 2: Wall, 3: Hazard Pit
        
        switch(segmentType) {
            case 0: // Flat run with possible enemy
                gameState.platforms.push(new Platform(currentX + 150, currentY, 300, 50));
                if (Math.random() > 0.5) {
                    gameState.enemies.push(new Enemy(currentX + 300, currentY - 30));
                }
                currentX += 450;
                break;
                
            case 1: // Jump Gap
                // Platform 1
                gameState.platforms.push(new Platform(currentX + 50, currentY, 100, 50));
                // Gap of 150
                gameState.platforms.push(new Platform(currentX + 300, currentY - 50 * Math.floor(Math.random()*2), 200, 50));
                
                // Maybe a sawblade in the gap
                if (Math.random() > 0.3) {
                    gameState.hazards.push(new Sawblade(currentX + 225, currentY + 20, 20));
                }
                
                currentX += 500;
                currentY = currentY - (Math.random() > 0.5 ? 50 : 0);
                break;
                
            case 2: // Wall Jump Section
                // Tall wall
                gameState.platforms.push(new Platform(currentX + 100, currentY - 150, 30, 300));
                // Platform after wall higher up
                gameState.platforms.push(new Platform(currentX + 250, currentY - 200, 200, 50));
                
                // Hazard on wall?
                if (Math.random() > 0.6) {
                    gameState.hazards.push(new Sawblade(currentX + 115, currentY - 100, 15));
                }
                
                currentX += 450;
                currentY -= 200;
                break;
                
            case 3: // Hazard Pit
                gameState.platforms.push(new Platform(currentX, currentY, 50, 400)); // Edge
                // Pit floor (deadly)
                // gameState.hazards.push(new Sawblade(currentX + 150, CANVAS_HEIGHT - 20, 30)); 
                // Actually let's just make it a gap with a sawblade floating
                gameState.hazards.push(new Sawblade(currentX + 150, currentY - 20, 25));
                
                gameState.platforms.push(new Platform(currentX + 250, currentY, 200, 400));
                currentX += 450;
                break;
        }
        
        // Ensure Y stays within bounds
        if (currentY < 100) currentY = 200;
        if (currentY > CANVAS_HEIGHT - 100) currentY = CANVAS_HEIGHT - 150;
    }
    
    // Final Platform and Goal
    gameState.platforms.push(new Platform(currentX, currentY, 300, 400));
    gameState.goal = new Goal(currentX + 150, currentY - 30);
    
    gameState.worldWidth = currentX + 500;
    
    // Spawn player
    // gameState.player was created in setup, just reset pos
    if (gameState.player) {
        gameState.player.x = 50;
        gameState.player.y = CANVAS_HEIGHT - 200;
        gameState.player.vx = 0;
        gameState.player.vy = 0;
        gameState.player.isDead = false;
    }
}