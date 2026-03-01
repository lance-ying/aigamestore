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
    uiCanvas.style.zIndex = '100'; // Above renderer
    
    // Append to container
    gameState.gameContainer.appendChild(uiCanvas);
    uiContext = uiCanvas.getContext('2d');
}

export function renderUI() {
    if (!uiContext) return;
    
    const ctx = uiContext;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Global HUD
    if (gameState.gamePhase !== 'START') {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${gameState.score}`, 20, 30);
        
        // Level Indicator (Calculated from Y depth)
        const currentLevel = Math.floor(Math.abs(gameState.cameraTargetY) / 4) + 1;
        ctx.textAlign = 'right';
        ctx.fillText(`Level: ${currentLevel}`, CANVAS_WIDTH - 20, 30);
    }
    
    // Screens
    if (gameState.gamePhase === 'START') {
        // Replaced game title with "press enter to begin" and moved controls to subtitle
        renderOverlay(ctx, 'press enter to begin', 'Use Left/Right Arrows to Rotate');
    } else if (gameState.gamePhase === 'PAUSED') {
        renderOverlay(ctx, 'PAUSED', 'Press ESC to Resume');
    } else if (gameState.gamePhase === 'GAME_OVER_LOSE') {
        renderOverlay(ctx, 'GAME OVER', 'Press R to Restart', `Final Score: ${gameState.score}`, '#ff0000');
    } else if (gameState.gamePhase === 'GAME_OVER_WIN') {
        renderOverlay(ctx, 'VICTORY!', 'Press R to Play Again', `Score: ${gameState.score}`, '#00ff00');
    }
}

function renderOverlay(ctx, title, subtitle, extra = '', titleColor = 'white') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 10;
    
    ctx.fillStyle = titleColor;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(subtitle, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    if (extra) {
        ctx.font = '18px Arial';
        ctx.fillStyle = '#cccccc';
        ctx.fillText(extra, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    }
    
    ctx.shadowBlur = 0;
}