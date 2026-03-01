/**
 * ui.js
 * Rendering HUD and Screens.
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderHUD(p) {
    // Top Bar
    p.push();
    
    // Health Bar
    const hpPct = Math.max(0, gameState.player.health / gameState.player.maxHealth);
    p.fill(50, 0, 0);
    p.rect(10, 10, 200, 20);
    p.fill(COLORS.player_active || [0, 255, 0]);
    p.rect(10, 10, 200 * hpPct, 20);
    p.noFill();
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(10, 10, 200, 20);
    p.noStroke();
    
    p.fill(255);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(14);
    p.text(`${Math.ceil(gameState.player.health)} / ${Math.ceil(gameState.player.maxHealth)}`, 20, 20);
    
    // Money
    p.fill(255, 215, 0);
    p.text(`$ ${gameState.player.money}`, 10, 50);
    
    // Time & Difficulty
    const mins = Math.floor(gameState.time / 60);
    const secs = Math.floor(gameState.time % 60);
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
    
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(20);
    p.text(timeStr, CANVAS_WIDTH - 10, 10);
    
    // Difficulty Bar
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(12);
    let diffName = "EASY";
    if (gameState.difficultyCoeff > 1.5) diffName = "MEDIUM";
    if (gameState.difficultyCoeff > 2.5) diffName = "HARD";
    if (gameState.difficultyCoeff > 4.0) diffName = "INSANE";
    p.text(diffName, CANVAS_WIDTH - 10, 35);
    
    // Objective / Event
    if (gameState.teleporterState === 'CHARGING') {
        p.textAlign(p.CENTER, p.TOP);
        p.fill(255, 100, 100);
        p.text(`SURVIVE: ${Math.floor(100 - gameState.teleporterCharge)}%`, CANVAS_WIDTH/2, 50);
    } else if (gameState.teleporterState === 'CHARGED') {
        p.textAlign(p.CENTER, p.TOP);
        p.fill(100, 255, 100);
        p.text("BOSS DEFEATED! TELEPORTER READY!", CANVAS_WIDTH/2, 50);
    }
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(COLORS.background);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("RISK OF RAIN: JS EDITION", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    p.textSize(16);
    p.text("Press ENTER to Start", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    p.fill(150);
    p.text("Arrows to Move/Interact | Z to Shoot | Shift to Dodge", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}

export function renderGameOver(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        p.textSize(40);
        p.fill(100, 255, 100);
        p.text("MISSION ACCOMPLISHED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    } else {
        p.textSize(40);
        p.fill(255, 50, 50);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    }
    
    p.fill(255);
    p.textSize(20);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.text(`Time: ${Math.floor(gameState.time)}s`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    
    p.textSize(16);
    p.fill(150);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
}