import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let canvas, ctx;

export function setupUI() {
    canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    
    if (gameState.gameContainer) {
        gameState.gameContainer.appendChild(canvas);
    }
    
    ctx = canvas.getContext('2d');
}

export function renderUI() {
    if (!ctx) return;
    
    // Clear
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (gameState.gamePhase === 'START') {
        drawStartScreen();
    } else if (gameState.gamePhase === 'PLAYING' || gameState.gamePhase === 'PAUSED') {
        drawHUD();
        if (gameState.gamePhase === 'PAUSED') drawPauseScreen();
    } else if (gameState.gamePhase === 'GAME_OVER_WIN') {
        drawWinScreen();
    } else if (gameState.gamePhase === 'GAME_OVER_LOSE') {
        drawLoseScreen();
    }
}

function drawStartScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MONSTER HUNTER', CANVAS_WIDTH/2, 120);
    ctx.font = '24px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Browser Edition', CANVAS_WIDTH/2, 150);
    
    ctx.font = '16px Arial';
    ctx.fillText('Press ENTER to Start', CANVAS_WIDTH/2, 250);
    
    ctx.fillStyle = '#CCCCCC';
    ctx.font = '14px Arial';
    ctx.fillText('WASD: Move | SPACE: Attack | SHIFT: Dodge | Z: Potion', CANVAS_WIDTH/2, 300);
}

function drawHUD() {
    if (!gameState.player || !gameState.monster) return;

    // Player Health Bar
    const pHealthPct = gameState.player.health / gameState.player.maxHealth;
    drawBar(20, 20, 200, 20, pHealthPct, '#00FF00', '#333333');
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${Math.ceil(gameState.player.health)}`, 25, 35);
    
    // Stamina Bar
    const pStamPct = gameState.player.stamina / gameState.player.maxStamina;
    drawBar(20, 45, 150, 10, pStamPct, '#FFFF00', '#333333');
    
    // Potions
    ctx.fillText(`Potions: ${gameState.player.potions}`, 20, 70);

    // Boss Health Bar
    const mHealthPct = Math.max(0, gameState.monster.health / gameState.monster.maxHealth);
    const barW = 300;
    drawBar((CANVAS_WIDTH - barW)/2, 350, barW, 25, mHealthPct, '#FF0000', '#333333');
    ctx.textAlign = 'center';
    ctx.fillText('WYVERN', CANVAS_WIDTH/2, 367);
}

function drawBar(x, y, w, h, pct, color, bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * pct, h);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
}

function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

function drawWinScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QUEST CLEARED', CANVAS_WIDTH/2, 150);
    
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('The Wyvern has been slain!', CANVAS_WIDTH/2, 200);
    ctx.fillText('Press R to Play Again', CANVAS_WIDTH/2, 250);
}

function drawLoseScreen() {
    ctx.fillStyle = 'rgba(50, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QUEST FAILED', CANVAS_WIDTH/2, 150);
    
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('You have fainted.', CANVAS_WIDTH/2, 200);
    ctx.fillText('Press R to Retry', CANVAS_WIDTH/2, 250);
}