import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';

export function renderUI(p) {
    p.push();
    
    if (gameState.gamePhase === PHASE_START) {
        drawStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED) {
        drawHUD(p);
        if (gameState.gamePhase === PHASE_PAUSED) {
            drawPauseOverlay(p);
        }
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
        drawHUD(p); // Show hud still
        drawGameOverScreen(p);
    }
    
    p.pop();
}

function drawStartScreen(p) {
    p.background(20, 30, 40);
    p.textAlign(p.CENTER);
    p.fill(0, 255, 100);
    p.textSize(48);
    p.text("TOWER FORTRESS", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    p.textSize(24);
    p.text("ASCENSION", CANVAS_WIDTH/2, CANVAS_HEIGHT/3 + 40);
    
    p.fill(200);
    p.textSize(16);
    p.text("Ascend the tower. Escape the smoke. Destroy the evil.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.fill(255);
    p.textSize(20);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.75);
    
    p.textSize(12);
    p.fill(150);
    p.text("Controls: Arrows to Move, Space to Jump, Z to Shoot, Shift to Dash", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.9);
}

function drawHUD(p) {
    // Health Bar
    p.noStroke();
    p.fill(50);
    p.rect(10, 10, 104, 14);
    if (gameState.player) {
        let hpPct = gameState.player.health / gameState.player.maxHealth;
        p.fill(255 * (1-hpPct), 255 * hpPct, 0);
        p.rect(12, 12, 100 * hpPct, 10);
    }

    // Score
    p.fill(255);
    p.textAlign(p.RIGHT);
    p.textSize(18);
    p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 25);
    
    // Weapon
    if (gameState.player) {
        p.textAlign(p.LEFT);
        p.textSize(14);
        p.text(`WEAPON: ${gameState.player.weapon}`, 10, 40);
        
        // Height/Floor
        let heightMetric = Math.floor(Math.abs(gameState.player.y - CANVAS_HEIGHT) / 100);
        p.text(`HEIGHT: ${heightMetric}m`, 10, 60);
    }
    
    // Smoke Warning
    if (gameState.player && gameState.smokeY < gameState.player.y + 200) {
        p.fill(255, 0, 0, 150 + Math.sin(p.frameCount * 0.2) * 100);
        p.textAlign(p.CENTER);
        p.text("! SMOKE RISING !", CANVAS_WIDTH/2, 50);
    }
}

function drawPauseOverlay(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER);
    p.textSize(32);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

function drawGameOverScreen(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER);
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
        p.fill(0, 255, 0);
        p.textSize(40);
        p.text("MISSION ACCOMPLISHED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    } else {
        p.fill(255, 0, 0);
        p.textSize(40);
        p.text("CRITICAL FAILURE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    
    p.textSize(16);
    p.fill(180);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 70);
}