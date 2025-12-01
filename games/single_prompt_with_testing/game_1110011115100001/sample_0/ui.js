import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let uiCanvas = null;
let uiContext = null;

export function setupUI() {
    uiCanvas = document.createElement('canvas');
    uiCanvas.width = CANVAS_WIDTH;
    uiCanvas.height = CANVAS_HEIGHT;
    uiCanvas.style.position = 'absolute';
    uiCanvas.style.top = '0';
    uiCanvas.style.left = '0';
    uiCanvas.style.pointerEvents = 'none';
    uiCanvas.style.zIndex = '100';
    
    // Ensure container exists
    if (gameState.gameContainer) {
        gameState.gameContainer.appendChild(uiCanvas);
    } else {
        document.body.appendChild(uiCanvas);
    }
    
    uiContext = uiCanvas.getContext('2d');
}

export function renderUI() {
    if (!uiContext) return;
    
    uiContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Common text settings
    uiContext.textAlign = 'center';
    uiContext.fillStyle = 'white';
    
    if (gameState.gamePhase === "START") {
        uiContext.fillStyle = 'rgba(0,0,0,0.7)';
        uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        uiContext.fillStyle = 'white';
        uiContext.font = '30px monospace';
        uiContext.fillText("STONE STORY 3D", CANVAS_WIDTH/2, 150);
        
        uiContext.font = '16px monospace';
        uiContext.fillText("Collect 9 Soul Stones", CANVAS_WIDTH/2, 200);
        uiContext.fillText("WASD/Arrows to Move | Space to Jump", CANVAS_WIDTH/2, 240);
        uiContext.fillText("Z to Swap Weapon (Sword/Hammer)", CANVAS_WIDTH/2, 260);
        uiContext.fillText("PRESS ENTER TO START", CANVAS_WIDTH/2, 320);
        
    } else if (gameState.gamePhase === "PLAYING") {
        // HUD
        uiContext.textAlign = 'left';
        uiContext.font = '14px monospace';
        
        // Health Bar
        if (gameState.player) {
            const hpWidth = 100;
            uiContext.fillStyle = '#444';
            uiContext.fillRect(20, 20, hpWidth, 10);
            uiContext.fillStyle = '#ff3333';
            uiContext.fillRect(20, 20, hpWidth * (gameState.player.health / gameState.player.maxHealth), 10);
            uiContext.fillStyle = 'white';
            uiContext.fillText(`HP: ${Math.floor(gameState.player.health)}`, 20, 15);
        }
        
        // Weapon
        if (gameState.player) {
            uiContext.fillText(`Weapon: ${gameState.player.weapon.toUpperCase()}`, 20, 50);
        }
        
        // Score & Stones
        uiContext.textAlign = 'right';
        uiContext.fillText(`Score: ${gameState.score}`, CANVAS_WIDTH - 20, 25);
        uiContext.fillText(`Stones: ${gameState.stonesCollected}/${gameState.totalStones}`, CANVAS_WIDTH - 20, 45);
        
    } else if (gameState.gamePhase === "PAUSED") {
        uiContext.fillStyle = 'rgba(0,0,0,0.5)';
        uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        uiContext.fillStyle = 'white';
        uiContext.textAlign = 'center';
        uiContext.font = '30px monospace';
        uiContext.fillText("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
        
    } else if (gameState.gamePhase === "GAME_OVER_WIN") {
        uiContext.fillStyle = 'rgba(0,0,0,0.8)';
        uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        uiContext.fillStyle = '#00ff00';
        uiContext.textAlign = 'center';
        uiContext.font = '30px monospace';
        uiContext.fillText("YOU RESTORED THE LIGHT!", CANVAS_WIDTH/2, 150);
        uiContext.fillStyle = 'white';
        uiContext.font = '20px monospace';
        uiContext.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 200);
        uiContext.fillText("Press R to Play Again", CANVAS_WIDTH/2, 250);
        
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        uiContext.fillStyle = 'rgba(0,0,0,0.8)';
        uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        uiContext.fillStyle = '#ff0000';
        uiContext.textAlign = 'center';
        uiContext.font = '30px monospace';
        uiContext.fillText("YOU PERISHED IN DARKNESS", CANVAS_WIDTH/2, 150);
        uiContext.fillStyle = 'white';
        uiContext.font = '20px monospace';
        uiContext.fillText(`Stones Found: ${gameState.stonesCollected}`, CANVAS_WIDTH/2, 200);
        uiContext.fillText("Press R to Restart", CANVAS_WIDTH/2, 250);
    }
}