import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let uiCanvas, ctx;

export function setupUI() {
    uiCanvas = document.createElement('canvas');
    uiCanvas.width = CANVAS_WIDTH;
    uiCanvas.height = CANVAS_HEIGHT;
    uiCanvas.style.position = 'absolute';
    uiCanvas.style.top = '0';
    uiCanvas.style.left = '0';
    uiCanvas.style.pointerEvents = 'none'; // Click through
    
    if (gameState.gameContainer) {
        gameState.gameContainer.appendChild(uiCanvas);
    }
    
    ctx = uiCanvas.getContext('2d');
}

export function renderUI() {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // HUD
    if (gameState.gamePhase === "PLAYING") {
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(10, 10, 150, 40);
        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.fillText(`Score: ${Math.floor(gameState.score)}`, 20, 35);
        
        // Timer
        const time = ((Date.now() - gameState.startTime) / 1000).toFixed(1);
        ctx.fillText(`Time: ${time}s`, 90, 35);
    }
    
    // START SCREEN
    if (gameState.gamePhase === "START") {
        drawOverlay("rgba(0,0,0,0.7)");
        drawCenteredText("TUMBLE GUYS", -50, 40, "#FF69B4");
        drawCenteredText("Press ENTER to Start", 20, 20);
        drawCenteredText("Use Arrow Keys/WASD to Move", 50, 16);
        drawCenteredText("SPACE to Jump, SHIFT to Dive", 80, 16);
    }
    
    // PAUSED
    if (gameState.gamePhase === "PAUSED") {
        drawOverlay("rgba(0,0,0,0.5)");
        drawCenteredText("PAUSED", 0, 40);
        drawCenteredText("Press ESC to Resume", 40, 20);
    }
    
    // WIN
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        drawOverlay("rgba(0,200,0,0.6)");
        drawCenteredText("QUALIFIED!", -30, 50, "white");
        drawCenteredText(`Final Score: ${gameState.score}`, 20, 24);
        drawCenteredText("Press R to Restart", 60, 20);
    }
    
    // LOSE
    if (gameState.gamePhase === "GAME_OVER_LOSE") {
        drawOverlay("rgba(200,0,0,0.6)");
        drawCenteredText("ELIMINATED", -30, 50, "white");
        drawCenteredText("Press R to Restart", 30, 20);
    }
}

function drawOverlay(color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawCenteredText(text, yOffset, size, color = "white") {
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px Arial`;
    ctx.textAlign = "center";
    ctx.shadowColor = "black";
    ctx.shadowBlur = 4;
    ctx.fillText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + yOffset);
    ctx.shadowBlur = 0;
}