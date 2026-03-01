/**
 * ui.js
 * Handles rendering of the User Interface, HUD, and Menus.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { renderParticles } from './particles.js';

export function renderHUD(p) {
    if (!gameState.player) return;

    const pStats = gameState.player.stats;

    // --- Portrait & Bars ---
    p.push();
    p.translate(10, 10);

    // Frame
    p.fill(COLORS.ui.bg);
    p.stroke(COLORS.ui.border);
    p.strokeWeight(2);
    p.rect(0, 0, 220, 80, 5);

    // Portrait Placeholder
    p.fill(COLORS.player.skin);
    p.rect(10, 10, 60, 60);
    p.fill(COLORS.player.hair); // Simple hair
    p.rect(10, 10, 60, 20);

    // Bars Container
    p.translate(80, 10);
    
    // HP Bar
    drawBar(p, 0, 0, 120, 15, pStats.hp, pStats.maxHp, COLORS.ui.hp, "HP");
    
    // MP Bar
    drawBar(p, 0, 22, 120, 10, pStats.mp, pStats.maxMp, COLORS.ui.mp, "MP");
    
    // XP Bar
    drawBar(p, 0, 38, 120, 6, pStats.xp, pStats.nextLevelXp, COLORS.ui.xp, "XP");

    // Level Text
    p.fill(COLORS.ui.text);
    p.noStroke();
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`LVL ${pStats.level}`, 0, 50);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`SCORE: ${gameState.score}`, 120, 50);

    p.pop();
    
    // Boss Health Bar (if spawned)
    if (gameState.bossSpawned) {
        const boss = gameState.entities.find(e => e.type === 'ENEMY' && e.enemyType === 'BOSS');
        if (boss) {
            p.push();
            p.translate(CANVAS_WIDTH / 2 - 150, 40);
            drawBar(p, 0, 0, 300, 20, boss.stats.hp, boss.stats.maxHp, COLORS.enemies.boss, "DARK GENERAL");
            p.pop();
        }
    }
}

function drawBar(p, x, y, w, h, val, max, color, label) {
    p.noStroke();
    p.fill(30);
    p.rect(x, y, w, h); // Background
    
    p.fill(color);
    let fillW = Math.max(0, (val / max) * w);
    p.rect(x, y, fillW, h); // Fill
    
    // Glint effect
    p.fill(255, 50);
    p.rect(x, y, fillW, h/2);

    p.stroke(0);
    p.strokeWeight(1);
    p.noFill();
    p.rect(x, y, w, h); // Border
    
    if (label) {
        p.fill(255);
        p.noStroke();
        p.textSize(h * 0.8);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(`${label}`, x + w/2, y + h/2);
    }
}

export function renderStartScreen(p) {
    p.background(COLORS.background);
    
    // Title
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.ui.xp);
    p.textSize(40);
    p.text("LEGENDS OF ZENONIA", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    p.textSize(24);
    p.fill(255);
    p.text("The Pixel Return", CANVAS_WIDTH/2, CANVAS_HEIGHT/3 + 40);
    
    // Instructions
    p.textSize(16);
    p.fill(200);
    p.text("Defeat the Monster Army & The Dark General", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.fill(COLORS.ui.hp);
    p.textSize(20);
    let blink = p.frameCount % 60 < 30;
    if (blink) p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.75);
    
    p.textSize(12);
    p.fill(150);
    p.text("Arrows: Move | Space: Attack | Z: Skill | Shift: Dash", CANVAS_WIDTH/2, CANVAS_HEIGHT - 30);
}

export function renderGameOver(p, win) {
    p.push();
    p.fill(0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); // Overlay
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (win) {
        p.fill(COLORS.ui.xp);
        p.textSize(48);
        p.text("LEGEND RETURNED!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        p.textSize(24);
        p.fill(255);
        p.text("You have defeated the Dark General.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    } else {
        p.fill(COLORS.ui.hp);
        p.textSize(48);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        p.textSize(24);
        p.fill(255);
        p.text("The world has fallen to darkness...", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    }
    
    p.textSize(20);
    p.fill(200);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    
    if (p.frameCount % 60 < 30) {
        p.text("PRESS 'R' TO RESTART", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.8);
    }
    p.pop();
}

export function renderPaused(p) {
    p.push();
    p.fill(0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.pop();
}