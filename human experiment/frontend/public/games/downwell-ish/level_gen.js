import { gameState, CANVAS_WIDTH } from './globals.js';
import { Platform, Enemy, Gem, Powerup } from './entities.js';

export function generateLevel() {
    const wellWidth = gameState.wellWidth;
    const wellLeft = (CANVAS_WIDTH - wellWidth) / 2;
    const depth = gameState.worldDepth;
    
    // Starting platform
    gameState.platforms.push(new Platform(wellLeft + 50, 200, wellWidth - 100, 30));
    
    let y = 400;
    while (y < depth - 200) {
        const segmentType = Math.floor(Math.random() * 5); // Increased variety
        const gap = 120 + Math.random() * 80;
        
        y += gap;
        
        // Determine difficulty/zone
        const zone = Math.floor(y / 2000);
        
        // Generate platforms based on pattern
        if (segmentType === 0) {
            // Left and Right ledges
            gameState.platforms.push(new Platform(wellLeft, y, 100, 20));
            gameState.platforms.push(new Platform(wellLeft + wellWidth - 100, y, 100, 20));
            
            if (Math.random() > 0.4) {
                gameState.enemies.push(new Enemy(wellLeft + wellWidth/2 - 15, y - 50, "BAT"));
            }
        } else if (segmentType === 1) {
            // Center platform
            gameState.platforms.push(new Platform(wellLeft + wellWidth/2 - 80, y, 160, 20));
            
            if (Math.random() > 0.3) {
                // Mix in SNAKEs on wide platforms
                const type = Math.random() > 0.5 ? "WALKER" : "SNAKE";
                gameState.enemies.push(new Enemy(wellLeft + wellWidth/2, y - 30, type));
            }
            
            // Chance for Powerup on center
            if (Math.random() > 0.9) {
                spawnPowerup(wellLeft + wellWidth/2 - 12, y - 40);
            }
        } else if (segmentType === 2) {
            // Zig zag (one side)
            const side = Math.random() > 0.5 ? 0 : 1;
            const px = side === 0 ? wellLeft : wellLeft + wellWidth - 150;
            gameState.platforms.push(new Platform(px, y, 150, 20));
            
            // Gem on opposite side
            gameState.gems.push(new Gem(side === 0 ? wellLeft + wellWidth - 50 : wellLeft + 50, y));
            
            // Frog on the platform
            if (Math.random() > 0.5) {
                gameState.enemies.push(new Enemy(px + 75, y - 30, "FROG"));
            }
        } else if (segmentType === 3) {
            // Scatter of small blocks
            for (let i = 0; i < 3; i++) {
                const bx = wellLeft + Math.random() * (wellWidth - 60);
                gameState.platforms.push(new Platform(bx, y + (Math.random() * 60 - 30), 60, 20));
            }
            // Jelly
            gameState.enemies.push(new Enemy(wellLeft + Math.random() * wellWidth, y + 100, "JELLY"));
        } else {
            // New Segment: Dual thin platforms with gap
             gameState.platforms.push(new Platform(wellLeft + 50, y, 80, 20));
             gameState.platforms.push(new Platform(wellLeft + wellWidth - 130, y, 80, 20));
             
             if (Math.random() > 0.5) {
                 gameState.enemies.push(new Enemy(wellLeft + wellWidth/2, y, "BAT"));
             }
        }
        
        // Random gems
        if (Math.random() > 0.7) {
             gameState.gems.push(new Gem(wellLeft + Math.random() * (wellWidth - 20), y - 50));
        }
        
        // Random Powerups (Rare)
        if (Math.random() > 0.95) {
            spawnPowerup(wellLeft + Math.random() * (wellWidth - 40), y - 80);
        }
    }
    
    // Bottom platform (Goal)
    gameState.platforms.push(new Platform(wellLeft, depth, wellWidth, 50));
}

function spawnPowerup(x, y) {
    const r = Math.random();
    let type = "HEALTH";
    if (r > 0.85) type = "MAX_HEALTH"; // 15% chance for max health upgrade
    else if (r > 0.6) type = "SHOTGUN";
    else if (r > 0.4) type = "BURST";
    else if (r > 0.2) type = "LASER";
    
    gameState.powerups.push(new Powerup(x, y, type));
}