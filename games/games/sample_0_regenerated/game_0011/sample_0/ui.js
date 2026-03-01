import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let uiCanvas = null;
let uiContext = null;

export function initUI() {
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
    
    // Clear
    uiContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Common overlay style
    const drawOverlay = (color) => {
        uiContext.fillStyle = color;
        uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    };

    const drawText = (text, x, y, size, color, align = 'center') => {
        uiContext.fillStyle = color;
        uiContext.font = `bold ${size}px Arial`;
        uiContext.textAlign = align;
        uiContext.shadowColor = 'black';
        uiContext.shadowBlur = 4;
        uiContext.fillText(text, x, y);
        uiContext.shadowBlur = 0;
    };

    // HUD (always visible in play)
    if (gameState.gamePhase === 'PLAYING' || gameState.gamePhase === 'PAUSED') {
        uiContext.textAlign = 'left';
        uiContext.fillStyle = 'white';
        uiContext.font = '20px Arial';
        uiContext.fillText(`Score: ${Math.floor(gameState.score)}`, 20, 30);
        uiContext.fillText(`Coins: ${gameState.coinsCollected}`, 20, 60);
        
        // Mode indicator
        if (gameState.controlMode !== 'HUMAN') {
            uiContext.fillStyle = '#ffaaaa';
            uiContext.font = '14px Arial';
            uiContext.fillText(`AUTO: ${gameState.controlMode}`, 20, 80);
        }
    }

    if (gameState.gamePhase === 'START') {
        drawOverlay('rgba(0,0,0,0.6)');
        drawText('TEMPLE ESCAPE 3D', CANVAS_WIDTH/2, 120, 40, '#FFD700');
        drawText('PRESS ENTER TO START', CANVAS_WIDTH/2, 250, 24, 'white');
        drawText('Arrows to Move/Jump/Slide', CANVAS_WIDTH/2, 300, 16, '#cccccc');
    } 
    else if (gameState.gamePhase === 'PAUSED') {
        drawOverlay('rgba(0,0,0,0.4)');
        drawText('PAUSED', CANVAS_WIDTH/2, 200, 40, 'white');
        drawText('Press ESC to Resume', CANVAS_WIDTH/2, 250, 20, 'white');
    }
    else if (gameState.gamePhase === 'GAME_OVER_LOSE') {
        drawOverlay('rgba(50,0,0,0.7)');
        drawText('GAME OVER', CANVAS_WIDTH/2, 150, 40, 'red');
        drawText(`Final Score: ${Math.floor(gameState.score)}`, CANVAS_WIDTH/2, 200, 24, 'white');
        drawText('The Demon caught you!', CANVAS_WIDTH/2, 240, 18, '#ffaaaa');
        drawText('Press R to Restart', CANVAS_WIDTH/2, 320, 20, 'white');
    }
}