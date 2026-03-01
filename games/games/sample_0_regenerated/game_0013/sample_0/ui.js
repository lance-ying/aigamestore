import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let uiCanvas, ctx;

export function setupUI() {
    uiCanvas = document.createElement('canvas');
    uiCanvas.width = CANVAS_WIDTH;
    uiCanvas.height = CANVAS_HEIGHT;
    uiCanvas.style.position = 'absolute';
    uiCanvas.style.top = '0';
    uiCanvas.style.left = '0';
    uiCanvas.style.pointerEvents = 'none';
    
    gameState.gameContainer.appendChild(uiCanvas);
    ctx = uiCanvas.getContext('2d');
}

export function renderUI() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Common HUD
    if (gameState.gamePhase !== 'START') {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${gameState.score}`, 20, 30);
        
        // Distance bar
        const progress = Math.min(1, gameState.player ? gameState.player.position.z / gameState.levelEndZ : 0);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(20, 50, 200, 10);
        ctx.fillStyle = '#00ffcc';
        ctx.fillRect(20, 50, 200 * progress, 10);
    }

    if (gameState.gamePhase === 'START') {
        drawOverlay('rgba(0,0,0,0.7)');
        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('JELLY SHIFTER 3D', CANVAS_WIDTH/2, 120);
        
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('Press ENTER to Start', CANVAS_WIDTH/2, 200);
        
        ctx.font = '16px Arial';
        ctx.fillStyle = '#cccccc';
        ctx.fillText('UP/DOWN: Shape Shift | LEFT/RIGHT: Move', CANVAS_WIDTH/2, 250);
        ctx.fillText('Fit through the holes!', CANVAS_WIDTH/2, 280);
    }
    else if (gameState.gamePhase === 'PAUSED') {
        drawOverlay('rgba(0,0,0,0.5)');
        ctx.fillStyle = 'white';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
        ctx.font = '16px Arial';
        ctx.fillText('Press ESC to Resume', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    }
    else if (gameState.gamePhase === 'GAME_OVER_LOSE') {
        drawOverlay('rgba(50, 0, 0, 0.8)');
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_WIDTH/2, 150);
        
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 200);
        ctx.fillText('Press R to Restart', CANVAS_WIDTH/2, 250);
    }
    else if (gameState.gamePhase === 'GAME_OVER_WIN') {
        drawOverlay('rgba(0, 50, 0, 0.8)');
        ctx.fillStyle = '#44ff44';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL COMPLETED!', CANVAS_WIDTH/2, 150);
        
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 200);
        ctx.fillText('Press R to Play Again', CANVAS_WIDTH/2, 250);
    }
}

function drawOverlay(color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}