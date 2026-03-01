import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let uiCanvas = null;
let uiContext = null;

export function setupUI() {
    uiCanvas = document.createElement('canvas');
    uiCanvas.width = CANVAS_WIDTH;
    uiCanvas.height = CANVAS_HEIGHT;
    uiCanvas.className = 'ui-overlay'; // Add class for specific styling
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
    
    const phase = gameState.gamePhase;
    
    // Common HUD - now includes PAUSED so HUD stays visible when paused
    if (phase === "PLAYING" || phase === "PAUSED" || phase === "GAME_OVER_WIN" || phase === "GAME_OVER_LOSE") {
        drawHUD();
    }
    
    // Phase specific screens
    if (phase === "START") {
        drawStartScreen();
    } else if (phase === "GAME_OVER_WIN") {
        drawWinScreen();
    } else if (phase === "GAME_OVER_LOSE") {
        drawLoseScreen();
    }
    // PAUSED phase rendering removed to show NO visual overlay/text/instructions
}

function drawHUD() {
    uiContext.font = 'bold 20px Arial';
    uiContext.fillStyle = 'white';
    uiContext.strokeStyle = 'black';
    uiContext.lineWidth = 3;
    
    // Qualified Count - moved to x=100
    const text = `Qualified: ${gameState.qualifiedCount} / ${gameState.qualificationLimit}`;
    uiContext.strokeText(text, 100, 40);
    uiContext.fillText(text, 100, 40);
    
    // Level Info - moved to x=100
    const levelText = `Level: ${gameState.currentLevel} / ${gameState.maxLevels}`;
    uiContext.strokeText(levelText, 100, 70);
    uiContext.fillText(levelText, 100, 70);
    
    // Score - moved to x=100
    const scoreText = `Score: ${gameState.totalScore}`;
    uiContext.strokeText(scoreText, 100, 100);
    uiContext.fillText(scoreText, 100, 100);
    
    // Timer
    const time = (gameState.elapsedTime).toFixed(1);
    const timeText = `Time: ${time}`;
    uiContext.strokeText(timeText, CANVAS_WIDTH - 90, 40);
    uiContext.fillText(timeText, CANVAS_WIDTH - 90, 40);
}

function drawStartScreen() {
    drawOverlay();
    
    uiContext.textAlign = 'center';
    uiContext.fillStyle = 'white'; // Simple and clean styling
    uiContext.font = 'bold 36px Arial'; // Adjusted font size for new main title
    uiContext.fillText('press enter to begin', CANVAS_WIDTH/2, 180); // New text and position
    
    // Original game title "TUMBLE GUYS" and "PRESS ENTER TO START" message removed/replaced.
    // Removed canvas-drawn controls to rely solely on the HTML controls section.
}

function drawWinScreen() {
    drawOverlay(0.5);
    uiContext.textAlign = 'center';
    uiContext.fillStyle = '#00FF66';
    uiContext.font = 'bold 40px Arial';
    uiContext.fillText('CHAMPION!', CANVAS_WIDTH/2, 160);
    
    uiContext.fillStyle = '#FFDD00';
    uiContext.font = 'bold 28px Arial';
    uiContext.fillText(`FINAL SCORE: ${gameState.totalScore}`, CANVAS_WIDTH/2, 210);
    
    uiContext.fillStyle = 'white';
    uiContext.font = '20px Arial';
    uiContext.fillText('Press R to Play Again', CANVAS_WIDTH/2, 260);
}

function drawLoseScreen() {
    drawOverlay(0.5);
    uiContext.textAlign = 'center';
    uiContext.fillStyle = '#FF0055';
    uiContext.font = 'bold 40px Arial';
    uiContext.fillText('ELIMINATED!', CANVAS_WIDTH/2, 180);
    
    uiContext.fillStyle = 'white';
    uiContext.font = '20px Arial';
    uiContext.fillText('Press R to Retry', CANVAS_WIDTH/2, 240);
}

function drawOverlay(alpha = 0.7) {
    uiContext.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}