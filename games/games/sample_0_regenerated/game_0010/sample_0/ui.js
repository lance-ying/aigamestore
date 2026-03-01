import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let uiCanvas = null;
let ctx = null;

export function setupUI() {
    uiCanvas = document.createElement('canvas');
    uiCanvas.width = CANVAS_WIDTH;
    uiCanvas.height = CANVAS_HEIGHT;
    uiCanvas.style.position = 'absolute';
    uiCanvas.style.top = '0';
    uiCanvas.style.left = '0';
    uiCanvas.style.pointerEvents = 'none'; // Click-through
    uiCanvas.style.zIndex = '100'; // Above renderer
    
    if (gameState.gameContainer) {
        gameState.gameContainer.appendChild(uiCanvas);
    } else {
        document.body.appendChild(uiCanvas);
    }
    
    ctx = uiCanvas.getContext('2d');
}

export function renderUI() {
    if (!ctx) return;
    
    // Clear
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const phase = gameState.gamePhase;
    
    if (phase === "START") {
        drawOverlay("HUNTER'S DOMAIN", "Press ENTER to Start");
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.fillText("WASD/Arrows to Move | Space to Roll | Z to Attack | H to Heal", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    }
    else if (phase === "PLAYING") {
        drawHUD();
    }
    else if (phase === "PAUSED") {
        drawHUD();
        drawOverlay("PAUSED", "Press ESC to Resume");
    }
    else if (phase === "GAME_OVER_WIN") {
        drawHUD();
        drawOverlay("MISSION ACCOMPLISHED", "Press R to Restart", "#44ff44");
    }
    else if (phase === "GAME_OVER_LOSE") {
        drawHUD();
        drawOverlay("MISSION FAILED", "Press R to Retry", "#ff4444");
    }
}

function drawOverlay(title, subtitle, color = "white") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.textAlign = "center";
    ctx.fillStyle = color;
    ctx.font = "bold 40px Arial";
    ctx.fillText(title, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(subtitle, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

function drawHUD() {
    if (!gameState.player) return;
    
    const p = gameState.player;
    
    // Health Bar
    drawBar(20, 20, 200, 20, p.health, p.maxHealth, "#00ff00", "#550000");
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    ctx.fillText("HP", 25, 34);
    
    // Stamina Bar
    drawBar(20, 45, 150, 10, p.stamina, p.maxStamina, "#ffff00", "#555500");
    
    // Potions
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(`Potions: ${p.potions}`, 20, 75);
    
    // Boss Health (if engaged)
    if (gameState.monster && !gameState.monster.isDead) {
        const m = gameState.monster;
        const width = 300;
        const x = (CANVAS_WIDTH - width) / 2;
        drawBar(x, 350, width, 20, m.health, m.maxHealth, "#ff0000", "#330000");
        ctx.textAlign = "center";
        ctx.fillStyle = "white";
        ctx.fillText("FEROCIOUS BEAST", CANVAS_WIDTH/2, 345);
    }
}

function drawBar(x, y, w, h, val, max, colorFg, colorBg) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    
    ctx.fillStyle = colorBg;
    ctx.fillRect(x, y, w, h);
    
    const ratio = Math.max(0, val / max);
    ctx.fillStyle = colorFg;
    ctx.fillRect(x, y, w * ratio, h);
}