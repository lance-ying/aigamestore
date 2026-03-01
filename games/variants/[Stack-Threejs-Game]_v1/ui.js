import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, MAX_MISSES } from './globals.js';

let uiCanvas = null;
let uiContext = null;

export function setupUI() {
    uiCanvas = document.createElement('canvas');
    uiCanvas.width = CANVAS_WIDTH;
    uiCanvas.height = CANVAS_HEIGHT;
    uiCanvas.style.position = 'absolute';
    uiCanvas.style.top = '0';
    uiCanvas.style.left = '0';
    uiCanvas.style.pointerEvents = 'none';
    uiCanvas.style.zIndex = '100'; // Above renderer
    
    if (gameState.gameContainer) {
        gameState.gameContainer.appendChild(uiCanvas);
    } else {
        // Fallback
        document.body.appendChild(uiCanvas);
    }
    
    uiContext = uiCanvas.getContext('2d');
}

export function renderUI() {
    if (!uiContext) return;
    
    // Clear
    uiContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Common settings
    uiContext.textAlign = 'center';
    uiContext.fillStyle = 'white';
    
    if (gameState.gamePhase === "START") {
        // Dim background
        uiContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
        uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        uiContext.fillStyle = 'white';
        uiContext.font = 'bold 36px Arial'; // Adjusted font size for new title
        uiContext.fillText('press enter to begin', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2); // Centered title
        
        // Removed previous title and instruction texts as per feedback
        
    } else if (gameState.gamePhase === "PLAYING") {
        // Score (Large number at top)
        uiContext.font = 'bold 60px Arial';
        uiContext.fillStyle = 'rgba(255, 255, 255, 0.8)';
        uiContext.fillText(gameState.score.toString(), CANVAS_WIDTH / 2, 80);
        
        // Lives remaining (top right)
        const livesRemaining = MAX_MISSES - gameState.missCount;
        uiContext.font = 'bold 24px Arial';
        uiContext.textAlign = 'right';
        
        // Color based on lives
        if (livesRemaining === 3) {
            uiContext.fillStyle = 'rgba(100, 255, 100, 0.9)'; // Green
        } else if (livesRemaining === 2) {
            uiContext.fillStyle = 'rgba(255, 255, 100, 0.9)'; // Yellow
        } else if (livesRemaining === 1) {
            uiContext.fillStyle = 'rgba(255, 100, 100, 0.9)'; // Red
        }
        
        uiContext.fillText(`Lives: ${livesRemaining}`, CANVAS_WIDTH - 20, 40);
        uiContext.textAlign = 'center'; // Reset
        
    } else if (gameState.gamePhase === "PAUSED") {
        uiContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
        uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        uiContext.fillStyle = 'white';
        uiContext.font = 'bold 32px Arial';
        uiContext.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        uiContext.fillStyle = 'rgba(0, 0, 0, 0.6)';
        uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        uiContext.fillStyle = 'white';
        uiContext.font = 'bold 40px Arial';
        uiContext.fillText('GAME OVER', CANVAS_WIDTH / 2, 150);
        
        uiContext.font = '24px Arial';
        uiContext.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
        
        uiContext.font = '18px Arial';
        uiContext.fillStyle = '#cccccc';
        uiContext.fillText('Press R to Restart', CANVAS_WIDTH / 2, 250);
    }
}