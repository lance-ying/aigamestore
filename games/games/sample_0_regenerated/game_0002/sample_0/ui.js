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
    
    if (gameState.gamePhase === "START") {
        renderOverlay('rgba(0,0,0,0.6)');
        drawText('TEMPLE ESCAPE', 40, CANVAS_HEIGHT/2 - 40, '#FFD700');
        drawText('Press ENTER to Start', 20, CANVAS_HEIGHT/2 + 20, '#FFF');
        drawText('Arrows to Move/Jump/Slide', 16, CANVAS_HEIGHT/2 + 60, '#AAA');
    } 
    else if (gameState.gamePhase === "PLAYING") {
        drawHUD();
    } 
    else if (gameState.gamePhase === "PAUSED") {
        drawHUD();
        renderOverlay('rgba(0,0,0,0.5)');
        drawText('PAUSED', 40, CANVAS_HEIGHT/2, '#FFF');
        drawText('ESC to Resume', 20, CANVAS_HEIGHT/2 + 40, '#CCC');
    }
    else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        drawHUD();
        renderOverlay('rgba(50,0,0,0.7)');
        drawText('GAME OVER', 50, CANVAS_HEIGHT/2 - 20, '#FF0000');
        drawText(`Score: ${gameState.score}`, 30, CANVAS_HEIGHT/2 + 40, '#FFF');
        drawText('Press R to Restart', 20, CANVAS_HEIGHT/2 + 80, '#CCC');
    }
}

function drawHUD() {
    uiContext.fillStyle = 'rgba(0,0,0,0.5)';
    uiContext.fillRect(10, 10, 150, 60);
    
    uiContext.font = '16px Arial';
    uiContext.fillStyle = '#FFD700';
    uiContext.textAlign = 'left';
    uiContext.fillText(`Score: ${gameState.score}`, 20, 35);
    
    uiContext.fillStyle = '#FFF';
    uiContext.fillText(`Distance: ${Math.floor(gameState.distanceTraveled)}m`, 20, 60);
}

function renderOverlay(color) {
    uiContext.fillStyle = color;
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawText(text, size, y, color) {
    uiContext.font = `bold ${size}px Arial`;
    uiContext.fillStyle = color;
    uiContext.textAlign = 'center';
    uiContext.shadowColor = 'black';
    uiContext.shadowBlur = 4;
    uiContext.fillText(text, CANVAS_WIDTH/2, y);
    uiContext.shadowBlur = 0;
}