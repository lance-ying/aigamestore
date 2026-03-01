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
    
    // Common HUD
    if (gameState.gamePhase === "PLAYING") {
        renderHUD();
    }
    
    // Screens
    if (gameState.gamePhase === "START") {
        renderStartScreen();
    } else if (gameState.gamePhase === "PAUSED") {
        renderPauseScreen();
    } else if (gameState.gamePhase === "GAME_OVER_WIN") {
        renderWinScreen();
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        renderLoseScreen();
    }
}

function renderHUD() {
    uiContext.fillStyle = 'white';
    uiContext.font = 'bold 16px Arial';
    uiContext.textAlign = 'left';
    uiContext.fillText(`Distance: ${Math.abs(Math.round(gameState.player?.position.z || 0))}m`, 20, 30);
    
    // Grapple Indicator
    if (gameState.player && gameState.player.isGrappling) {
        uiContext.fillStyle = '#ff00ff';
        uiContext.fillText("HOOKED!", 20, 55);
    }
    
    // Controls Hint
    uiContext.fillStyle = 'rgba(255, 255, 255, 0.5)';
    uiContext.font = '12px Arial';
    uiContext.fillText("WASD: Move | SPACE: Jump | Z: Grapple", 20, CANVAS_HEIGHT - 20);
}

function renderOverlay(color) {
    uiContext.fillStyle = color;
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function renderStartScreen() {
    renderOverlay('rgba(0, 0, 0, 0.7)');
    
    uiContext.fillStyle = '#0088ff';
    uiContext.font = 'bold 48px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText('CRUMBLE CHAOS', CANVAS_WIDTH/2, 150);
    
    uiContext.fillStyle = 'white';
    uiContext.font = '20px Arial';
    uiContext.fillText('Roll, Jump, and Swing to Survive!', CANVAS_WIDTH/2, 200);
    
    uiContext.font = 'bold 24px Arial';
    uiContext.fillStyle = '#ffff00';
    uiContext.fillText('PRESS ENTER TO START', CANVAS_WIDTH/2, 300);
}

function renderPauseScreen() {
    renderOverlay('rgba(0, 0, 0, 0.5)');
    
    uiContext.fillStyle = 'white';
    uiContext.font = 'bold 40px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText('PAUSED', CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    uiContext.font = '20px Arial';
    uiContext.fillText('Press ESC to Resume', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}

function renderWinScreen() {
    renderOverlay('rgba(0, 50, 0, 0.8)');
    
    uiContext.fillStyle = '#00ff00';
    uiContext.font = 'bold 48px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText('LEVEL CLEARED!', CANVAS_WIDTH/2, 150);
    
    uiContext.fillStyle = 'white';
    uiContext.font = '20px Arial';
    uiContext.fillText('You survived the crumbling chaos.', CANVAS_WIDTH/2, 200);
    
    uiContext.font = 'bold 24px Arial';
    uiContext.fillText('PRESS R TO PLAY AGAIN', CANVAS_WIDTH/2, 300);
}

function renderLoseScreen() {
    renderOverlay('rgba(50, 0, 0, 0.8)');
    
    uiContext.fillStyle = '#ff0000';
    uiContext.font = 'bold 48px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText('CRUMBLED!', CANVAS_WIDTH/2, 150);
    
    uiContext.fillStyle = 'white';
    uiContext.font = '20px Arial';
    uiContext.fillText('The void claimed you.', CANVAS_WIDTH/2, 200);
    
    uiContext.font = 'bold 24px Arial';
    uiContext.fillText('PRESS R TO RESTART', CANVAS_WIDTH/2, 300);
}