import { gameState, COLORS, TEAMS } from './globals.js';

let uiCanvas = null;
let uiContext = null;

export function setupUI() {
    uiCanvas = document.createElement('canvas');
    uiCanvas.width = 600;
    uiCanvas.height = 400;
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
    
    const ctx = uiContext;
    ctx.clearRect(0, 0, 600, 400);
    
    if (gameState.gamePhase === "START") {
        drawOverlay(ctx, "rgba(0,0,0,0.8)");
        drawText(ctx, "TF2 DEMAKE", 300, 100, 48, "#fff");
        drawText(ctx, "Capture the Point!", 300, 160, 24, "#ccc");
        drawText(ctx, "Select Class:", 300, 220, 20, "#aaa");
        
        // Class Selector
        const classes = ['SCOUT', 'SOLDIER', 'HEAVY'];
        const colors = ['#ffffff', '#ffffff', '#ffffff'];
        const idx = classes.indexOf(gameState.selectedClass);
        colors[idx] = '#ff0000'; // Highlight
        
        drawText(ctx, `< ${gameState.selectedClass} >`, 300, 250, 28, colors[idx]);
        
        drawText(ctx, "Use Left/Right Arrow to Change", 300, 290, 14, "#888");
        drawText(ctx, "Press ENTER to Deploy", 300, 350, 20, "#fff");
        
    } else if (gameState.gamePhase === "PLAYING") {
        // HUD
        if (gameState.player) {
            // Health
            ctx.fillStyle = COLORS.HUD_BG;
            ctx.fillRect(10, 340, 150, 50);
            ctx.fillStyle = "#fff";
            ctx.font = "bold 24px Arial";
            ctx.textAlign = "left";
            ctx.fillText(`HEALTH: ${Math.ceil(gameState.player.health)}`, 20, 375);
            
            // Ammo/Cooldown (Simulated)
            ctx.fillStyle = COLORS.HUD_BG;
            ctx.fillRect(440, 340, 150, 50);
            ctx.fillStyle = "#fff";
            ctx.textAlign = "right";
            const ready = gameState.player.cooldown <= 0 ? "READY" : "RELOADING";
            ctx.fillText(ready, 580, 375);
            
            // Crosshair
            ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(300 - 10, 200);
            ctx.lineTo(300 + 10, 200);
            ctx.moveTo(300, 200 - 10);
            ctx.lineTo(300, 200 + 10);
            ctx.stroke();
        }
        
        // Capture Point Status
        const capPct = Math.abs(gameState.captureProgress);
        const ownerColor = gameState.captureProgress > 0 ? '#B8383B' : (gameState.captureProgress < 0 ? '#5885A2' : '#cccccc');
        
        ctx.fillStyle = COLORS.HUD_BG;
        ctx.fillRect(250, 340, 100, 50);
        ctx.fillStyle = ownerColor;
        ctx.fillRect(260, 355, 80 * (capPct / 100), 20);
        ctx.strokeStyle = "#fff";
        ctx.strokeRect(260, 355, 80, 20);
        
        // Timer
        const mins = Math.floor(gameState.matchTime / 60);
        const secs = Math.floor(gameState.matchTime % 60);
        const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText(timeStr, 300, 50);
        
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        drawOverlay(ctx, "rgba(0,0,0,0.8)");
        const msg = gameState.gamePhase === "GAME_OVER_WIN" ? "VICTORY!" : "DEFEAT!";
        const color = gameState.gamePhase === "GAME_OVER_WIN" ? "#00ff00" : "#ff0000";
        drawText(ctx, msg, 300, 180, 60, color);
        drawText(ctx, "Press R to Restart", 300, 250, 24, "#fff");
    }
}

function drawOverlay(ctx, color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 600, 400);
}

function drawText(ctx, text, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(text, x, y);
}