import { gameState, CONFIG } from './globals.js';

let uiCanvas, uiContext;

export function setupUI() {
    uiCanvas = document.createElement('canvas');
    uiCanvas.width = CONFIG.CANVAS_WIDTH;
    uiCanvas.height = CONFIG.CANVAS_HEIGHT;
    uiCanvas.style.position = 'absolute';
    uiCanvas.style.top = '0';
    uiCanvas.style.left = '0';
    uiCanvas.style.pointerEvents = 'none';
    
    // Append to container
    if (gameState.gameContainer) {
        gameState.gameContainer.appendChild(uiCanvas);
    } else {
        document.body.appendChild(uiCanvas);
    }
    
    uiContext = uiCanvas.getContext('2d');
}

export function renderUI() {
    // Clear
    uiContext.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    const w = CONFIG.CANVAS_WIDTH;
    const h = CONFIG.CANVAS_HEIGHT;

    // Common Text Settings
    uiContext.fillStyle = 'white';
    uiContext.textAlign = 'center';
    
    if (gameState.gamePhase === "START") {
        // Overlay
        uiContext.fillStyle = 'rgba(0,0,0,0.6)';
        uiContext.fillRect(0, 0, w, h);
        
        uiContext.fillStyle = 'white';
        uiContext.font = 'bold 30px Arial'; // Adjusted font size for single line
        uiContext.fillText("press enter to begin", w/2, h/2); // Centered message
        
    } else if (gameState.gamePhase === "PLAYING") {
        // HUD
        uiContext.font = '20px Arial';
        uiContext.textAlign = 'left';
        uiContext.fillText(`Level: ${gameState.levelIndex}`, 20, 30);
        
        // Show Brake indicator
        if (gameState.player && gameState.player.velocity.length() > 0.1) {
           // uiContext.fillText(`Speed: ${gameState.player.velocity.length().toFixed(2)}`, 20, 60);
        }

    } else if (gameState.gamePhase === "GAME_OVER_WIN") {
        uiContext.fillStyle = 'rgba(0,0,0,0.7)';
        uiContext.fillRect(0, 0, w, h);
        
        uiContext.fillStyle = '#4CAF50';
        uiContext.font = 'bold 40px Arial';
        uiContext.textAlign = 'center';
        uiContext.fillText("LEVEL COMPLETED!", w/2, h/2 - 20);
        
        uiContext.fillStyle = 'white';
        uiContext.font = '20px Arial';
        uiContext.fillText("Press R for Next Level", w/2, h/2 + 30);
        
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        uiContext.fillStyle = 'rgba(0,0,0,0.7)';
        uiContext.fillRect(0, 0, w, h);
        
        uiContext.fillStyle = '#FF5722';
        uiContext.font = 'bold 40px Arial';
        uiContext.textAlign = 'center';
        uiContext.fillText("FALLEN!", w/2, h/2 - 20);
        
        uiContext.fillStyle = 'white';
        uiContext.font = '20px Arial';
        uiContext.fillText("Press R to Try Again", w/2, h/2 + 30);
    }

    // Score Display (Always visible)
    uiContext.textAlign = 'right';
    uiContext.font = 'bold 24px Arial';
    uiContext.fillStyle = 'white';
    uiContext.shadowColor = 'rgba(0,0,0,0.5)';
    uiContext.shadowBlur = 4;
    uiContext.fillText(`Score: ${gameState.score}`, w - 20, 40);
    uiContext.shadowBlur = 0; // Reset
    uiContext.shadowColor = 'transparent';
}