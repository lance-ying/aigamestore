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
    
    if (gameState.gameContainer) {
        gameState.gameContainer.appendChild(uiCanvas);
    }
    
    uiContext = uiCanvas.getContext('2d');
}

export function renderUI() {
    if (!uiContext) return;
    
    // Clear
    uiContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Common Settings
    uiContext.textAlign = 'center';
    uiContext.textBaseline = 'middle';
    
    if (gameState.gamePhase === "START") {
        drawOverlay(0.7);
        drawText(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40, "COLOR ROLLER 3D", 40, "bold", "#FFF");
        drawText(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20, "Press ENTER to Start", 20, "normal", "#DDD");
        drawText(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50, "Match colors. Avoid mismatch.", 14, "normal", "#AAA");
        drawText(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 70, "Arrows to Move", 14, "normal", "#AAA");
    }
    else if (gameState.gamePhase === "PLAYING") {
        // HUD
        uiContext.textAlign = 'left';
        drawText(20, 30, `Score: ${Math.floor(gameState.score)}`, 20, "bold", "#FFF");
        drawText(20, 55, `Speed: ${Math.floor(gameState.speed)}`, 14, "normal", "#CCC");
        
        // Mode indicator
        if (gameState.controlMode !== "HUMAN") {
            uiContext.textAlign = 'right';
            drawText(CANVAS_WIDTH - 20, 30, `MODE: ${gameState.controlMode}`, 14, "bold", "#FF0055");
        }
    }
    else if (gameState.gamePhase === "PAUSED") {
        drawOverlay(0.5);
        drawText(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, "PAUSED", 30, "bold", "#FFF");
        drawText(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30, "Press ESC to Resume", 16, "normal", "#CCC");
    }
    else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        drawOverlay(0.8);
        drawText(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 30, "GAME OVER", 40, "bold", "#FF0055");
        drawText(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20, `Final Score: ${Math.floor(gameState.score)}`, 24, "bold", "#FFF");
        drawText(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60, "Press R to Restart", 16, "normal", "#CCC");
    }
}

function drawOverlay(alpha) {
    uiContext.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawText(x, y, text, size, weight, color) {
    uiContext.font = `${weight} ${size}px Arial`;
    uiContext.fillStyle = color;
    uiContext.shadowColor = 'black';
    uiContext.shadowBlur = 4;
    uiContext.fillText(text, x, y);
    uiContext.shadowBlur = 0;
}