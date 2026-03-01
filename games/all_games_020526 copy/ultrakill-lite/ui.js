import { gameState, CONSTANTS } from './globals.js';

let uiCanvas, ctx;
let styleEvents = []; // Queue for style text
let damageAlpha = 0; // Visual feedback for taking damage

export function initUI() {
    uiCanvas = document.createElement('canvas');
    uiCanvas.width = CONSTANTS.CANVAS_WIDTH;
    uiCanvas.height = CONSTANTS.CANVAS_HEIGHT;
    uiCanvas.style.position = 'absolute';
    uiCanvas.style.top = '0';
    uiCanvas.style.left = '0';
    uiCanvas.style.pointerEvents = 'none';
    uiCanvas.id = 'game-ui';
    
    // Append to container
    gameState.gameContainer.appendChild(uiCanvas);
    ctx = uiCanvas.getContext('2d');
    
    // Expose style label adder
    window.showStyleLabel = (text) => {
        styleEvents.push({ text, time: 1.0, y: 200 + Math.random() * 50 });
    };

    // Expose damage flash trigger
    window.triggerDamageFlash = () => {
        damageAlpha = 0.6; // Set initial opacity for the red flash
    };
}

export function renderUI() {
    ctx.clearRect(0, 0, uiCanvas.width, uiCanvas.height);
    
    if (gameState.gamePhase === "START") {
        // Replaced game title with "press enter to begin" and adjusted Y position
        drawCenteredText("press enter to begin", 40, 200, "#fff");
        // Removed redundant "PRESS ENTER TO START"
        drawCenteredText("WASD: Move | ARROWS: Aim | Z: Shoot | SHIFT: Dash | SPACE: Jump", 14, 350, "#888");
        return;
    }
    
    if (gameState.gamePhase === "GAME_OVER_LOSE") {
        ctx.fillStyle = "rgba(50, 0, 0, 0.5)";
        ctx.fillRect(0, 0, uiCanvas.width, uiCanvas.height);
        drawCenteredText("YOU DIED", 50, 180, "#f00");
        drawCenteredText(`SCORE: ${gameState.score}`, 30, 230, "#fff");
        drawCenteredText("PRESS 'R' TO RESTART", 20, 270, "#ccc");
        return;
    }
    
    // === PLAYING HUD (also shown when PAUSED) ===

    // Damage Flash
    if (damageAlpha > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${damageAlpha})`;
        ctx.fillRect(0, 0, uiCanvas.width, uiCanvas.height);
        damageAlpha -= 0.02; // Decay
        if (damageAlpha < 0) damageAlpha = 0;
    }
    
    // Crosshair
    ctx.strokeStyle = "#0f0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(uiCanvas.width/2, uiCanvas.height/2, 4, 0, Math.PI*2);
    ctx.stroke();
    
    // Health Bar
    const hpPct = Math.max(0, gameState.player ? gameState.player.health / gameState.player.maxHealth : 0);
    drawBar(20, 350, 200, 20, hpPct, "#f00", "#500", `HP: ${Math.ceil(gameState.player ? gameState.player.health : 0)}`);
    
    // Stamina (Dash)
    if (gameState.player) {
        for (let i = 0; i < 3; i++) {
            const filled = gameState.player.stamina >= i + 1;
            ctx.fillStyle = filled ? "#00f" : "#222";
            ctx.fillRect(20 + i * 70, 320, 60, 10);
            ctx.strokeStyle = "#fff";
            ctx.strokeRect(20 + i * 70, 320, 60, 10);
        }
    }
    
    // Style Meter (Right Side)
    const stylePct = gameState.styleRank / 100;
    // Decay style (only when playing, not when paused)
    if (gameState.gamePhase === "PLAYING") {
        gameState.styleRank = Math.max(0, gameState.styleRank - 0.1);
    }
    
    // Style Rank Letter
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffcc00";
    ctx.font = "italic bold 40px Arial";
    ctx.fillText(gameState.styleGrade, 580, 100);
    
    // Style Bar
    drawBar(380, 110, 200, 10, stylePct, "#ffcc00", "#443300", "");
    
    // Score
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = "20px Monospace";
    ctx.fillText(`SCORE: ${gameState.score}`, 580, 40);
    
    // Style Popups
    ctx.textAlign = "right";
    ctx.font = "italic 16px Arial";
    styleEvents.forEach((evt, i) => {
        ctx.globalAlpha = evt.time;
        ctx.fillStyle = "#fff";
        ctx.fillText(`+ ${evt.text}`, 550, 150 + i * 20);
        evt.time -= 0.02;
    });
    ctx.globalAlpha = 1.0;
    styleEvents = styleEvents.filter(e => e.time > 0);
}

function drawBar(x, y, w, h, pct, colorFg, colorBg, label) {
    ctx.fillStyle = colorBg;
    ctx.fillRect(x, y, w, h);
    
    ctx.fillStyle = colorFg;
    ctx.fillRect(x, y, w * pct, h);
    
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    
    if (label) {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "left";
        ctx.fillText(label, x + 5, y + 15);
    }
}

function drawCenteredText(text, size, y, color) {
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(text, uiCanvas.width / 2, y);
}