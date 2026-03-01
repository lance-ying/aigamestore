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
        renderHUD(); // Draw only the HUD, no pause overlay
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        renderHUD();
        renderGameOverScreen();
    }
}

function renderStartScreen() {
    uiContext.fillStyle = 'rgba(0, 0, 0, 0.6)';
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Replaced 'JELLY JUMP 3D' with 'press enter to begin'
    uiContext.fillStyle = '#ffffff'; // Keep white for main message
    uiContext.font = 'bold 36px Arial'; // Adjusted font size for prominence
    uiContext.textAlign = 'center';
    uiContext.fillText('press enter to begin', CANVAS_WIDTH / 2, 140); // Positioned where title was
    
    // Kept controls section, adjusted Y position and font size
    uiContext.fillStyle = '#ffffff';
    uiContext.font = '18px Arial'; // Slightly larger for readability
    uiContext.fillText('Space to Jump | Arrows to Move', CANVAS_WIDTH / 2, 200); // Adjusted Y for better spacing
    // Removed: uiContext.fillText('Avoid the rising dark liquid!', CANVAS_WIDTH / 2, 260);
}

function renderHUD() {
    uiContext.fillStyle = '#333'; // Dark text for white background
    uiContext.font = 'bold 24px Arial';
    uiContext.textAlign = 'left';
    uiContext.fillText(`Score: ${Math.floor(gameState.score)}`, 20, 40);
    
    uiContext.textAlign = 'right';
    uiContext.font = '18px Arial';
    uiContext.fillText(`Level: ${gameState.level}`, CANVAS_WIDTH - 20, 40);
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