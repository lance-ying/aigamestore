import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let uiContext = null;

export function setupUI() {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none'; // Click through
    canvas.style.zIndex = '10';
    
    if (gameState.gameContainer) {
        gameState.gameContainer.appendChild(canvas);
    } else {
        document.body.appendChild(canvas);
    }
    
    uiContext = canvas.getContext('2d');
}

export function renderUI() {
    if (!uiContext) return;
    
    // Clear
    uiContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // HUD
    if (gameState.gamePhase !== "START") {
        uiContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
        uiContext.fillRect(10, 10, 150, 40);
        
        uiContext.fillStyle = '#00ffff';
        uiContext.font = 'bold 16px Arial';
        uiContext.textAlign = 'left';
        uiContext.fillText(`Score: ${gameState.score}`, 20, 35);
    }
    
    // Screens
    if (gameState.gamePhase === "START") {
        drawOverlay("NEON ROLL", "Press ENTER to Start", "Controls: Arrows/WASD to Move, SPACE to Jump", "#00ffff");
    } else if (gameState.gamePhase === "PAUSED") {
        drawOverlay("PAUSED", "Press ESC to Resume", "", "#ffff00");
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        drawOverlay("GAME OVER", "Press R to Restart", `Final Score: ${gameState.score}`, "#ff0000");
    } else if (gameState.gamePhase === "GAME_OVER_WIN") {
        drawOverlay("LEVEL COMPLETE", "Press R to Play Again", `Final Score: ${gameState.score}`, "#00ff00");
    }
}

function drawOverlay(title, subtitle, info, color) {
    uiContext.fillStyle = 'rgba(0, 0, 0, 0.8)';
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    uiContext.shadowBlur = 10;
    uiContext.shadowColor = color;
    
    uiContext.fillStyle = color;
    uiContext.font = 'bold 40px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText(title, CANVAS_WIDTH/2, 150);
    
    uiContext.shadowBlur = 0;
    
    uiContext.fillStyle = '#ffffff';
    uiContext.font = 'bold 24px Arial';
    uiContext.fillText(subtitle, CANVAS_WIDTH/2, 220);
    
    if (info) {
        uiContext.font = '16px Arial';
        uiContext.fillStyle = '#cccccc';
        uiContext.fillText(info, CANVAS_WIDTH/2, 260);
    }
}