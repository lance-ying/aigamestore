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
    
    uiContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (gameState.gamePhase === "START") {
        renderStartScreen();
    } else if (gameState.gamePhase === "PLAYING") {
        renderHUD();
    } else if (gameState.gamePhase === "PAUSED") {
        renderHUD(); // Draw HUD behind pause menu
        renderPauseScreen();
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        renderGameOverScreen();
    }
}

function renderStartScreen() {
    // Gradient Background
    const gradient = uiContext.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, 'rgba(255, 69, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(139, 0, 0, 0.8)');
    
    uiContext.fillStyle = gradient;
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    uiContext.fillStyle = 'white';
    uiContext.font = 'bold 40px Arial';
    uiContext.textAlign = 'center';
    uiContext.shadowColor = 'black';
    uiContext.shadowBlur = 10;
    uiContext.fillText('HORIZON DRIVE', CANVAS_WIDTH/2, 120);
    uiContext.font = 'bold 30px Arial';
    uiContext.fillText('MEXICO', CANVAS_WIDTH/2, 160);
    
    uiContext.shadowBlur = 0;
    uiContext.font = '16px Arial';
    uiContext.fillText('Explore the open world, collect all 10 Tokens,', CANVAS_WIDTH/2, 220);
    uiContext.fillText('and expand the festival before time runs out!', CANVAS_WIDTH/2, 245);
    
    uiContext.font = 'bold 20px Arial';
    uiContext.fillText('PRESS ENTER TO START', CANVAS_WIDTH/2, 320);
}

function renderHUD() {
    // Speedometer (Bottom Right)
    const speed = gameState.player ? Math.abs(Math.round(gameState.player.speed * 3.6)) : 0; // km/h approx
    
    uiContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
    uiContext.beginPath();
    uiContext.arc(520, 320, 60, 0, Math.PI * 2);
    uiContext.fill();
    
    uiContext.fillStyle = 'white';
    uiContext.font = 'bold 30px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText(`${speed}`, 520, 320);
    uiContext.font = '12px Arial';
    uiContext.fillText('KM/H', 520, 340);
    
    // Tokens (Top Left)
    uiContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
    uiContext.fillRect(10, 10, 180, 80);
    
    uiContext.fillStyle = '#FFD700'; // Gold
    uiContext.font = 'bold 20px Arial';
    uiContext.textAlign = 'left';
    uiContext.fillText(`TOKENS: ${gameState.tokensCollected} / ${gameState.totalTokens}`, 20, 40);
    
    // Time
    const timeColor = gameState.timeLeft < 30 ? '#FF4444' : 'white';
    uiContext.fillStyle = timeColor;
    uiContext.fillText(`TIME: ${Math.ceil(gameState.timeLeft)}s`, 20, 70);
    
    // Score
    uiContext.fillStyle = 'white';
    uiContext.textAlign = 'right';
    uiContext.fillText(`SCORE: ${gameState.score}`, 580, 40);
}

function renderPauseScreen() {
    uiContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    uiContext.fillStyle = 'white';
    uiContext.font = 'bold 30px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText('PAUSED', CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    uiContext.font = '16px Arial';
    uiContext.fillText('Press ESC to Resume', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
}

function renderGameOverScreen() {
    uiContext.fillStyle = 'rgba(0, 0, 0, 0.85)';
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    uiContext.fillStyle = 'white';
    uiContext.font = 'bold 40px Arial';
    uiContext.textAlign = 'center';
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        uiContext.fillStyle = '#44FF44';
        uiContext.fillText('FESTIVAL EXPANDED!', CANVAS_WIDTH/2, 150);
        uiContext.fillStyle = 'white';
        uiContext.font = '20px Arial';
        uiContext.fillText('You collected all tokens!', CANVAS_WIDTH/2, 200);
    } else {
        uiContext.fillStyle = '#FF4444';
        uiContext.fillText('OUT OF TIME', CANVAS_WIDTH/2, 150);
        uiContext.fillStyle = 'white';
        uiContext.font = '20px Arial';
        uiContext.fillText(`You collected ${gameState.tokensCollected} / ${gameState.totalTokens} tokens.`, CANVAS_WIDTH/2, 200);
    }
    
    uiContext.font = '24px Arial';
    uiContext.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 250);
    
    uiContext.font = 'bold 20px Arial';
    uiContext.fillText('PRESS R TO RESTART', CANVAS_WIDTH/2, 320);
}