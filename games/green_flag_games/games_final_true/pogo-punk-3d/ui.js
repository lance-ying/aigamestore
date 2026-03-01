import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let uiContext = null;

export function setupUI() {
    const uiCanvas = document.createElement('canvas');
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
    
    const phase = gameState.gamePhase;
    
    // Common HUD
    if (phase !== "START") {
        uiContext.fillStyle = "white";
        uiContext.font = "16px monospace";
        uiContext.textAlign = "left";
        uiContext.fillText(`SCORE: ${gameState.score}`, 20, 30);
        uiContext.fillText(`LEVEL: ${gameState.currentLevel}`, 20, 50);
        
        if (gameState.player) {
             // Charge bar
             const charge = gameState.player.charge || 0;
             uiContext.fillStyle = "#333";
             uiContext.fillRect(20, 70, 100, 10);
             uiContext.fillStyle = "#0f0";
             uiContext.fillRect(20, 70, 100 * charge, 10);
        }
    }
    
    if (phase === "START") {
        renderOverlay("press enter to begin", "", "ARROWS to lean, SPACE to charge jump");
    } else if (phase === "PAUSED") {
        renderOverlay("PAUSED", "PRESS ESC TO RESUME");
    } else if (phase === "GAME_OVER_WIN") {
        renderOverlay("ALL CLEARED!", `FINAL SCORE: ${gameState.score}`, "PRESS R TO RESTART", "#0f0");
    } else if (phase === "GAME_OVER_LOSE") {
        renderOverlay("CRASHED!", "WATCH YOUR HEAD", "PRESS R TO TRY AGAIN", "#f00");
    } else if (phase === "LEVEL_COMPLETE") {
        renderOverlay("LEVEL COMPLETE!", `SCORE: ${gameState.score}`, "PRESS ENTER FOR NEXT LEVEL", "#0f0");
    }
}

function renderOverlay(title, subtitle, info, titleColor = "white") {
    uiContext.fillStyle = "rgba(0, 0, 0, 0.7)";
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    uiContext.textAlign = "center";
    
    // Title
    uiContext.fillStyle = titleColor;
    uiContext.font = "bold 40px monospace";
    uiContext.fillText(title, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    // Subtitle
    uiContext.fillStyle = "white";
    uiContext.font = "bold 20px monospace";
    uiContext.fillText(subtitle, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    
    // Info
    if (info) {
        uiContext.font = "14px monospace";
        uiContext.fillStyle = "#aaa";
        uiContext.fillText(info, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    }
}