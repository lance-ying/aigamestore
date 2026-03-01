/**
 * Renders the Heads-Up Display (HUD) and menu screens.
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderUI(p) {
    // HUD
    renderHUD(p);

    // Screens
    if (gameState.gamePhase === "START") {
        renderStartScreen(p);
    } else if (gameState.gamePhase === "PAUSED") {
        renderPauseScreen(p);
    } else if (gameState.gamePhase === "GAME_OVER_WIN") {
        renderGameOverScreen(p, true);
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        renderGameOverScreen(p, false);
    }
}

function renderHUD(p) {
    p.push();
    
    // Score
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(18);
    p.fill(COLORS.text);
    p.text(`Score: ${gameState.score}`, 20, 20);
    
    // Stars
    p.fill(COLORS.collectible);
    p.text(`★ ${gameState.starsCollected}`, 20, 45);
    
    // Health Bar
    const hpPercent = gameState.player.health / gameState.player.maxHealth;
    p.noFill();
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(20, 70, 150, 15);
    
    p.noStroke();
    p.fill(hpPercent > 0.3 ? '#00ff00' : '#ff0000');
    p.rect(22, 72, 146 * hpPercent, 11);
    
    // Ability Icon
    if (gameState.player.canDash) {
        p.fill(COLORS.powerup);
        p.circle(CANVAS_WIDTH - 40, 40, 30);
        p.fill(0);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(16);
        p.text("⚡", CANVAS_WIDTH - 40, 40);
        
        // Cooldown overlay
        if (gameState.player.dashCooldown > 0) {
            p.fill(0, 0, 0, 150);
            p.arc(CANVAS_WIDTH - 40, 40, 30, 30, -Math.PI/2, -Math.PI/2 + (Math.PI*2 * (gameState.player.dashCooldown/60)));
        }
    }
    
    p.pop();
}

function renderStartScreen(p) {
    p.push();
    p.fill(0, 0, 0, 220);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER);
    p.fill(COLORS.player_outline);
    p.textSize(40);
    p.textStyle(p.BOLD);
    p.text("PHANTOM CAT RESCUE", CANVAS_WIDTH/2, 150);
    
    p.fill(255);
    p.textSize(16);
    p.textStyle(p.NORMAL);
    p.text("Rescue Ina from the Phantom World!", CANVAS_WIDTH/2, 200);
    p.text("Collect Stars ★ and Powerups ⚡", CANVAS_WIDTH/2, 230);
    
    p.fill(COLORS.collectible);
    p.textSize(20);
    if (Math.floor(p.frameCount / 30) % 2 === 0) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 300);
    }
    p.pop();
}

function renderPauseScreen(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.pop();
}

function renderGameOverScreen(p, win) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER);
    
    if (win) {
        p.fill('#00ff00');
        p.textSize(50);
        p.text("MISSION COMPLETE!", CANVAS_WIDTH/2, 150);
        p.fill(255);
        p.textSize(20);
        p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 220);
        p.text(`Stars Found: ${gameState.starsCollected}`, CANVAS_WIDTH/2, 250);
    } else {
        p.fill('#ff0000');
        p.textSize(50);
        p.text("GAME OVER", CANVAS_WIDTH/2, 150);
        p.fill(255);
        p.textSize(20);
        p.text("Don't give up, Ari!", CANVAS_WIDTH/2, 220);
    }
    
    p.fill(200);
    p.textSize(16);
    p.text("Press R to Restart", CANVAS_WIDTH/2, 320);
    p.pop();
}