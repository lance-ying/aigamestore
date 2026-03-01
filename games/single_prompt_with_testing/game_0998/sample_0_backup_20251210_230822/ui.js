import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let uiCanvas, uiContext;

export function setupUI() {
    uiCanvas = document.createElement('canvas');
    uiCanvas.width = CANVAS_WIDTH;
    uiCanvas.height = CANVAS_HEIGHT;
    uiCanvas.style.position = 'absolute';
    uiCanvas.style.top = '0';
    uiCanvas.style.left = '0';
    uiCanvas.style.pointerEvents = 'none';
    uiCanvas.style.zIndex = '1000';
    
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
    
    // Common styles
    uiContext.shadowColor = 'black';
    uiContext.shadowBlur = 4;
    
    if (gameState.gamePhase === "START") {
        renderStartScreen();
    } else if (gameState.gamePhase === "PLAYING") {
        renderHUD();
    } else if (gameState.gamePhase === "PAUSED") {
        renderHUD(); // Draw HUD behind overlay
        renderPauseScreen();
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        renderHUD();
        renderGameOverScreen();
    }
}

function renderStartScreen() {
    uiContext.fillStyle = 'rgba(0, 0, 0, 0.6)';
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    uiContext.fillStyle = '#00ffff';
    uiContext.font = 'bold 40px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText('JELLY JUMP 3D', CANVAS_WIDTH / 2, 140);
    
    uiContext.fillStyle = '#ffffff';
    uiContext.font = '20px Arial';
    uiContext.fillText('Press ENTER to Start', CANVAS_WIDTH / 2, 200);
    
    uiContext.font = '14px Arial';
    uiContext.fillText('Space/Up to Jump | Arrows to Move', CANVAS_WIDTH / 2, 240);
    uiContext.fillText('Avoid the rising dark liquid!', CANVAS_WIDTH / 2, 260);
}

function renderHUD() {
    uiContext.fillStyle = 'white';
    uiContext.font = 'bold 24px Arial';
    uiContext.textAlign = 'left';
    uiContext.fillText(`Score: ${Math.floor(gameState.score)}`, 20, 40);
    
    uiContext.textAlign = 'right';
    uiContext.font = '18px Arial';
    uiContext.fillText(`Level: ${gameState.level}`, CANVAS_WIDTH - 20, 40);
}

function renderPauseScreen() {
    uiContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    uiContext.fillStyle = 'white';
    uiContext.font = 'bold 30px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    uiContext.font = '16px Arial';
    uiContext.fillText('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

function renderGameOverScreen() {
    uiContext.fillStyle = 'rgba(50, 0, 0, 0.7)';
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    uiContext.fillStyle = '#ff4444';
    uiContext.font = 'bold 40px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText('GAME OVER', CANVAS_WIDTH / 2, 140);
    
    uiContext.fillStyle = 'white';
    uiContext.font = '24px Arial';
    uiContext.fillText(`Final Score: ${Math.floor(gameState.score)}`, CANVAS_WIDTH / 2, 200);
    
    uiContext.font = '18px Arial';
    uiContext.fillText('Press R to Restart', CANVAS_WIDTH / 2, 250);
}