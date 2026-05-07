import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let canvas, ctx;

export function setupUI() {
    canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none'; // Click through
    
    if (gameState.gameContainer) {
        gameState.gameContainer.appendChild(canvas);
    }
    
    ctx = canvas.getContext('2d');
}

export function renderUI() {
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Font setup
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;

    if (gameState.gamePhase === 'START') {
        // Removed game name title
        drawCenteredText("press enter to begin", 0); // Replaced title with simple message
        
        ctx.font = '14px Arial'; // Font for controls section
        drawCenteredText("Use Arrows/WASD to Move & Jump", 40);
        drawCenteredText("SPACE to Attack Enemies", 60);
        drawCenteredText("Collect Coins, Avoid Walls", 80);
    } 
    else if (gameState.gamePhase === 'PLAYING' || gameState.gamePhase === 'PAUSED') {
        // HUD (same for both PLAYING and PAUSED - no visual difference)
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${Math.floor(gameState.score)}`, 20, 30);
        
        // Health Bar
        const maxBarWidth = 200;
        const currentBarWidth = (gameState.player.health / gameState.player.maxHealth) * maxBarWidth;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 40, maxBarWidth, 20);
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(20, 40, currentBarWidth, 20);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(20, 40, maxBarWidth, 20);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`HP: ${gameState.player.health}`, 25, 55);
    }
    else if (gameState.gamePhase === 'GAME_OVER_LOSE') {
        ctx.fillStyle = 'rgba(50, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        drawCenteredText("GAME OVER", -20, 50, 'red');
        drawCenteredText(`Final Score: ${Math.floor(gameState.score)}`, 20);
        drawCenteredText("Press R to Restart", 60);
    }
}

function drawCenteredText(text, yOffset, size = 20, color = 'white') {
    ctx.font = `bold ${size}px Arial`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + yOffset);
}