import { gameState, TOWER_TYPES } from './globals.js';
import { Tower } from './entities.js';
import { isValidPlacement } from './physics.js';

export function handleInput(p) {
    // Continuous cursor movement
    const speed = gameState.cursor.speed;
    const shiftMult = p.keyIsDown(16) ? 2 : 1; // Shift to move faster? Or Shift is Upgrade? 
    // Instructions say Shift is Upgrade. Let's keep speed constant for simplicity or use a different modifier if needed. 
    // Actually, precision is important.
    
    if (gameState.gamePhase === "PLAYING") {
        if (p.keyIsDown(37)) gameState.cursor.x -= speed;
        if (p.keyIsDown(39)) gameState.cursor.x += speed;
        if (p.keyIsDown(38)) gameState.cursor.y -= speed;
        if (p.keyIsDown(40)) gameState.cursor.y += speed;
        
        // Clamp
        gameState.cursor.x = Math.max(0, Math.min(600, gameState.cursor.x));
        gameState.cursor.y = Math.max(0, Math.min(400, gameState.cursor.y));
    }
}

export function handleKeyPress(p) {
    // Global keys
    if (p.keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
        }
    }
    
    if (p.keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    
    if (p.keyCode === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
             import('./globals.js').then(m => m.resetGameState());
        }
    }

    if (gameState.gamePhase !== "PLAYING") return;

    // Game Actions
    if (p.keyCode === 90) { // Z - Cycle Towers
        gameState.cursor.selectedTowerIndex = (gameState.cursor.selectedTowerIndex + 1) % TOWER_TYPES.length;
    }
    
    if (p.keyCode === 32) { // SPACE - Build
        // Check hover first (Selection logic?) - Actually simple: if hover, do nothing (or select), if empty, build.
        // We simplified interactions. Hover shows range. Space builds.
        // If we are hovering a tower, maybe Space does nothing?
        const hovered = gameState.towers.find(t => p.dist(t.x, t.y, gameState.cursor.x, gameState.cursor.y) < 15);
        
        if (!hovered) {
            const type = TOWER_TYPES[gameState.cursor.selectedTowerIndex];
            if (gameState.money >= type.cost && isValidPlacement(gameState.cursor.x, gameState.cursor.y)) {
                gameState.money -= type.cost;
                gameState.towers.push(new Tower(gameState.cursor.x, gameState.cursor.y, type.id));
                // Add placement particles?
            }
        }
    }
    
    if (p.keyCode === 16) { // SHIFT - Upgrade
        const hovered = gameState.towers.find(t => p.dist(t.x, t.y, gameState.cursor.x, gameState.cursor.y) < 15);
        if (hovered) {
            if (gameState.money >= hovered.upgradeCost) {
                gameState.money -= hovered.upgradeCost;
                hovered.upgrade();
            }
        }
    }
}