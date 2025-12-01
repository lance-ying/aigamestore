import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { Enemy, Collectible } from './entities.js';

export function generateLevel(p) {
    // Reset
    gameState.platforms = [];
    
    let currentX = 0;
    let currentY = 300;
    
    // Add Start Platform
    gameState.platforms.push({x: -100, y: 300, width: 400, height: 100}); // Safe start
    gameState.spawnPoint = {x: 50, y: 200};
    
    currentX = 300;
    
    // Generate segments
    const levelLength = 20; // segments
    
    for (let i = 0; i < levelLength; i++) {
        // Gap?
        if (p.random() < 0.2) {
            currentX += 100 + p.random(50); // Gap width
        }
        
        let width = 200 + p.random(300);
        let height = 50 + p.random(100);
        let yChange = (p.random() - 0.5) * 100;
        
        currentY += yChange;
        currentY = p.constrain(currentY, 150, 350); // Keep within vertical bounds
        
        gameState.platforms.push({
            x: currentX,
            y: currentY,
            width: width,
            height: height
        });
        
        // Spawn Enemy?
        if (i > 1 && p.random() < 0.6) {
            let type = p.random() < 0.7 ? 'ZOMBIE' : 'ARCHER';
            let ex = currentX + p.random(width - 50) + 25;
            let ey = currentY - 50;
            gameState.enemies.push(new Enemy(ex, ey, type));
            gameState.entities.push(gameState.enemies[gameState.enemies.length-1]);
        }
        
        // Spawn Collectible?
        if (p.random() < 0.3) {
             let cx = currentX + p.random(width);
             let cy = currentY - 30;
             gameState.collectibles.push(new Collectible(cx, cy, 'CELL'));
        }
        
        currentX += width;
    }
    
    // End Platform and Door
    gameState.platforms.push({x: currentX + 50, y: 300, width: 200, height: 100});
    gameState.exitDoor = {
        x: currentX + 150,
        y: 240,
        width: 40,
        height: 60
    };
    
    gameState.levelWidth = currentX + 400;
}