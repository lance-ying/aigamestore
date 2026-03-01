import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

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
    
    // Common HUD
    if (phase === "PLAYING" || phase === "GAME_OVER_WIN" || phase === "GAME_OVER_LOSE") {
        drawHUD();
    }
    
    // Phase specific screens
    if (phase === "START") {
        drawStartScreen();
    } else if (phase === "PAUSED") {
        drawPauseScreen();
    } else if (phase === "GAME_OVER_WIN") {
        drawWinScreen();
    } else if (phase === "GAME_OVER_LOSE") {
        drawLoseScreen();
    }
}

function drawHUD() {
    uiContext.font = 'bold 20px Arial';
    uiContext.fillStyle = 'white';
    uiContext.strokeStyle = 'black';
    uiContext.lineWidth = 3;
    
    // Qualified Count
    const text = `Qualified: ${gameState.qualifiedCount} / ${gameState.qualificationLimit}`;
    uiContext.strokeText(text, 20, 40);
    uiContext.fillText(text, 20, 40);
    
    // Level Info
    const levelText = `Level: ${gameState.currentLevel} / ${gameState.maxLevels}`;
    uiContext.strokeText(levelText, 20, 70);
    uiContext.fillText(levelText, 20, 70);
    
    // Score
    const scoreText = `Score: ${gameState.totalScore}`;
    uiContext.strokeText(scoreText, 20, 100);
    uiContext.fillText(scoreText, 20, 100);
    
    // Timer
    const time = (gameState.elapsedTime).toFixed(1);
    const timeText = `Time: ${time}`;
    uiContext.strokeText(timeText, CANVAS_WIDTH - 120, 40);
    uiContext.fillText(timeText, CANVAS_WIDTH - 120, 40);
}

function drawStartScreen() {
    drawOverlay();
    
    uiContext.textAlign = 'center';
    uiContext.fillStyle = '#FFDD00';
    uiContext.font = 'bold 48px Arial';
    uiContext.fillText('TUMBLE GUYS', CANVAS_WIDTH/2, 150);
    
    uiContext.fillStyle = 'white';
    uiContext.font = '20px Arial';
    uiContext.fillText('PRESS ENTER TO START', CANVAS_WIDTH/2, 250);
    
    uiContext.font = '14px Arial';
    uiContext.fillText('WASD: Move | SPACE: Jump | SHIFT: Dive', CANVAS_WIDTH/2, 300);
}

function drawPauseScreen() {
    drawOverlay();
    uiContext.textAlign = 'center';
    uiContext.fillStyle = 'white';
    uiContext.font = 'bold 32px Arial';
    uiContext.fillText('PAUSED', CANVAS_WIDTH/2, 200);
    uiContext.font = '16px Arial';
    uiContext.fillText('Press ESC to Resume', CANVAS_WIDTH/2, 240);
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