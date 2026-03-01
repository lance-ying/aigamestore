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
    } else {
        document.body.appendChild(uiCanvas); // Fallback
    }
    
    uiContext = uiCanvas.getContext('2d');
}

export function renderUI() {
    if (!uiContext) return;
    
    // Clear
    uiContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Render based on Phase
    switch (gameState.gamePhase) {
        case "START":
            renderStartScreen();
            break;
        case "PLAYING":
            renderHUD();
            break;
        case "PAUSED":
            renderHUD();
            renderPauseScreen();
            break;
        case "GAME_OVER_WIN":
        case "GAME_OVER_LOSE":
            renderHUD(); // Show final score behind
            renderGameOverScreen();
            break;
    }
}

function renderStartScreen() {
    drawOverlay('rgba(0, 0, 0, 0.7)');
    
    drawText('TWIST JUMP 3D', CANVAS_WIDTH/2, 120, 48, '#00ffff');
    drawText('Stay on the platforms!', CANVAS_WIDTH/2, 180, 24, '#ffffff');
    drawText('Use Left/Right Arrows to Twist the World', CANVAS_WIDTH/2, 220, 18, '#aaaaaa');
    drawText('Use Space/Up to Jump', CANVAS_WIDTH/2, 250, 18, '#aaaaaa');
    
    // Pulsing press start
    const alpha = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
    drawText('PRESS ENTER TO START', CANVAS_WIDTH/2, 320, 24, `rgba(255, 255, 255, ${alpha})`);
}

function renderHUD() {
    // Score
    drawText(`Score: ${Math.floor(gameState.score)}`, 20, 40, 24, '#ffffff', 'left');
    
    // Distance
    const dist = Math.floor(gameState.player ? gameState.player.mesh.position.z : 0);
    drawText(`Distance: ${dist}m`, 20, 70, 18, '#aaaaaa', 'left');
    
    // Controls Hint (small)
    drawText('Controls: Arrows + Space', CANVAS_WIDTH - 20, 30, 12, '#888888', 'right');
}

function renderPauseScreen() {
    drawOverlay('rgba(0, 0, 0, 0.5)');
    drawText('PAUSED', CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 48, '#ffffff');
    drawText('Press ESC to Resume', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50, 20, '#cccccc');
}

function renderGameOverScreen() {
    drawOverlay('rgba(20, 0, 0, 0.8)');
    
    const msg = gameState.gamePhase === "GAME_OVER_WIN" ? "VICTORY!" : "GAME OVER";
    const color = gameState.gamePhase === "GAME_OVER_WIN" ? "#00ff00" : "#ff0000";
    
    drawText(msg, CANVAS_WIDTH/2, 140, 56, color);
    drawText(`Final Score: ${Math.floor(gameState.score)}`, CANVAS_WIDTH/2, 220, 32, '#ffffff');
    drawText('Press R to Restart', CANVAS_WIDTH/2, 300, 24, '#cccccc');
}

// Helpers
function drawOverlay(color) {
    uiContext.fillStyle = color;
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawText(text, x, y, size, color, align = 'center') {
    uiContext.fillStyle = color;
    uiContext.font = `bold ${size}px Arial`;
    uiContext.textAlign = align;
    uiContext.shadowColor = 'black';
    uiContext.shadowBlur = 4;
    uiContext.fillText(text, x, y);
    uiContext.shadowBlur = 0;
}