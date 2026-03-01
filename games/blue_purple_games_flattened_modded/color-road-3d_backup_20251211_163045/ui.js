import { gameState } from './globals.js';

let uiCanvas, uiContext;

export function setupUI() {
    uiCanvas = document.createElement('canvas');
    uiCanvas.width = 600;
    uiCanvas.height = 400;
    uiCanvas.style.position = 'absolute';
    uiCanvas.style.top = '0';
    uiCanvas.style.left = '0';
    uiCanvas.style.pointerEvents = 'none';
    uiCanvas.style.zIndex = '100';
    
    // Append to container
    if (gameState.gameContainer) {
        gameState.gameContainer.appendChild(uiCanvas);
    } else {
        document.body.appendChild(uiCanvas); // Fallback
    }
    
    uiContext = uiCanvas.getContext('2d');
}

export function renderUI() {
    if (!uiContext) return;
    
    // Clear
    uiContext.clearRect(0, 0, 600, 400);
    
    const w = 600;
    const h = 400;
    
    if (gameState.gamePhase === "START") {
        drawOverlay(0.7);
        // Removed original game title and "PRESS ENTER TO START"
        drawText(w/2, h/2 - 20, "press enter to begin", 36, "white", "center", "bold");
        drawText(w/2, h/2 + 40, "Controls: Arrows / WASD", 16, "#cccccc", "center");
    }
    else if (gameState.gamePhase === "PLAYING") {
        drawHUD();
    }
    else if (gameState.gamePhase === "PAUSED") {
        drawHUD(); // Keep HUD visible
        drawOverlay(0.5);
        drawText(w/2, h/2, "PAUSED", 40, "white", "center", "bold");
        drawText(w/2, h/2 + 40, "Press ESC to Resume", 20, "white", "center");
    }
    else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        drawHUD();
        drawOverlay(0.8);
        drawText(w/2, h/2 - 40, "GAME OVER", 48, "#ff3333", "center", "bold");
        drawText(w/2, h/2 + 20, `Final Score: ${gameState.score}`, 32, "white", "center");
        drawText(w/2, h/2 + 70, "Press R to Restart", 20, "white", "center");
    }
}

function drawHUD() {
    drawText(20, 40, `Score: ${gameState.score}`, 24, "white", "left", "bold");
    
    // Speed indicator
    const speedPct = Math.min(100, (gameState.speed / 50) * 100);
    uiContext.fillStyle = "rgba(0,0,0,0.5)";
    uiContext.fillRect(20, 60, 100, 10);
    uiContext.fillStyle = `hsl(${120 - speedPct}, 100%, 50%)`;
    uiContext.fillRect(20, 60, speedPct, 10);
}

function drawOverlay(alpha) {
    uiContext.fillStyle = `rgba(0,0,0,${alpha})`;
    uiContext.fillRect(0, 0, 600, 400);
}

function drawText(x, y, text, size, color, align, weight = "normal") {
    uiContext.font = `${weight} ${size}px Arial`;
    uiContext.fillStyle = color;
    uiContext.textAlign = align;
    uiContext.fillText(text, x, y);
}