import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TOOL_NAMES } from './globals.js';

let canvas, ctx;

export function setupUI() {
    canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    
    // Append to same container as game
    if (gameState.gameContainer) {
        gameState.gameContainer.appendChild(canvas);
    }
    
    ctx = canvas.getContext('2d');
}

export function renderUI() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (gameState.gamePhase === "START") {
        drawScreen("", "", "press enter to begin");
    } else if (gameState.gamePhase === "PLAYING") {
        drawCrosshair();
        drawHUD();
    } else if (gameState.gamePhase === "PAUSED") {
        drawScreen("PAUSED", "", "PRESS ESC TO RESUME");
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        drawScreen("GAME OVER", "You fell out of the world!", "PRESS R TO RESTART");
    }
}

function drawCrosshair() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;
    const size = 10;
    
    ctx.beginPath();
    ctx.moveTo(cx - size, cy);
    ctx.lineTo(cx + size, cy);
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx, cy + size);
    ctx.stroke();
}

function drawHUD() {
    // Score
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#FFD700'; // Gold color
    ctx.textAlign = 'right';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 20, 30);

    // Current Tool
    const toolName = TOOL_NAMES[gameState.selectedToolIndex];
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = 'white';
    ctx.fillText(`TOOL: ${toolName} [Shift to Cycle]`, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20);
    ctx.fillText(`[Z] Action`, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 40);
    
    // Debug info
    if (gameState.player) {
        ctx.textAlign = 'left';
        const pos = gameState.player.position;
        ctx.font = '12px monospace';
        ctx.fillStyle = 'white';
        ctx.fillText(`X: ${pos.x.toFixed(1)} Y: ${pos.y.toFixed(1)} Z: ${pos.z.toFixed(1)}`, 10, 20);
        
        if (gameState.targetBlock) {
             const t = gameState.targetBlock;
             ctx.fillText(`Target: ${t.x},${t.y},${t.z}`, 10, 40);
        }
    }
}

function drawScreen(title, subtitle, action) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    
    // Only draw title if it's not empty
    if (title) {
        ctx.font = 'bold 40px monospace';
        ctx.fillText(title, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    }
    
    // Only draw subtitle if it's not empty
    if (subtitle) {
        ctx.font = '20px monospace';
        ctx.fillText(subtitle, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + (title ? 20 : -20)); // Adjust position if title is absent
    }
    
    // Blinking effect for action message
    ctx.font = 'bold 16px monospace';
    if (Math.floor(Date.now() / 500) % 2 === 0) {
        let actionY = CANVAS_HEIGHT/2 + 60;
        if (!title && !subtitle) { // If no title or subtitle, center the action more
            actionY = CANVAS_HEIGHT/2;
        } else if (!title) { // If only subtitle, adjust
            actionY = CANVAS_HEIGHT/2 + 20;
        }
        ctx.fillText(action, CANVAS_WIDTH/2, actionY);
    }
}