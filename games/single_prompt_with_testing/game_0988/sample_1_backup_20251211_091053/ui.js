import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let uiCanvas = null;
let ctx = null;

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
    
    ctx = uiCanvas.getContext('2d');
}

export function renderUI() {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Common: Score
    if (gameState.gamePhase !== "START") {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "right";
        ctx.fillText(`${Math.floor(gameState.score)}`, CANVAS_WIDTH - 20, 40);
        
        ctx.font = "14px Arial";
        ctx.fillText(`Gems: ${gameState.gemsCollected}`, CANVAS_WIDTH - 20, 60);
    }
    
    if (gameState.gamePhase === "START") {
        renderScreenOverlay("TWIST 3D", "Press ENTER to Start", "Arrows to Turn | Space to Jump");
    } else if (gameState.gamePhase === "PAUSED") {
        renderScreenOverlay("PAUSED", "Press ESC to Resume");
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        renderScreenOverlay("GAME OVER", "Press R to Restart", `Final Score: ${Math.floor(gameState.score)}`);
    } else if (gameState.gamePhase === "GAME_OVER_WIN") {
        renderScreenOverlay("YOU WIN?", "How did you do that?", "Press R to Restart");
    }
    
    // Debug overlay for tests
    if (gameState.controlMode.startsWith("TEST")) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        ctx.textAlign = "left";
        ctx.font = "12px Monospace";
        ctx.fillText(`MODE: ${gameState.controlMode}`, 10, 20);
        ctx.fillText(`FPS: ${Math.round(1/gameState.deltaTime)}`, 10, 35);
    }
}

function renderScreenOverlay(title, subtitle, info) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    
    // Title
    ctx.font = "bold 48px Arial";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 10;
    ctx.fillText(title, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    // Subtitle
    ctx.font = "bold 24px Arial";
    ctx.shadowBlur = 0;
    ctx.fillText(subtitle, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    
    // Info
    if (info) {
        ctx.fillStyle = "#cccccc";
        ctx.font = "16px Arial";
        ctx.fillText(info, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 70);
    }
}