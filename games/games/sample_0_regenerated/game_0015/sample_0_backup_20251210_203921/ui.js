/**
 * User Interface rendering: HUD, Screens, Overlays.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderHUD(p) {
    const player = gameState.player;
    if (!player) return;

    // --- Portrait Frame ---
    p.push();
    p.translate(10, 10);
    
    // Background
    p.fill(COLORS.ui_bg);
    p.stroke(200);
    p.rect(0, 0, 200, 70, 5);
    
    // Character Portrait (Abstract)
    p.fill(200, 200, 200);
    p.rect(10, 10, 50, 50);
    p.fill(240, 240, 50); // Hair
    p.triangle(20, 20, 35, 10, 50, 20);
    p.fill(0); // Eyes
    p.rect(25, 30, 5, 5);
    p.rect(45, 30, 5, 5);

    // Bars
    const barX = 70;
    const barW = 120;
    
    // HP
    p.noStroke();
    p.fill(50, 0, 0);
    p.rect(barX, 15, barW, 12);
    p.fill(COLORS.hp_bar);
    const hpRatio = p.constrain(player.stats.hp / player.stats.maxHp, 0, 1);
    p.rect(barX, 15, barW * hpRatio, 12);
    p.fill(255);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`${Math.floor(player.stats.hp)}/${player.stats.maxHp}`, barX + barW/2, 21);

    // XP
    p.fill(0, 50, 50);
    p.rect(barX, 32, barW, 8);
    p.fill(COLORS.xp_bar);
    const xpRatio = p.constrain(player.xp / player.maxXp, 0, 1);
    p.rect(barX, 32, barW * xpRatio, 8);
    
    // MP (Placeholder for Skill resource)
    p.fill(0, 0, 50);
    p.rect(barX, 45, barW, 8);
    p.fill(COLORS.mp_bar);
    // Let's assume Spin uses MP in a full version, here static or cooldown viz
    // Just full for visuals
    p.rect(barX, 45, barW, 8);
    
    // Level Badge
    p.fill(255, 215, 0);
    p.stroke(0);
    p.circle(10, 10, 24);
    p.fill(0);
    p.noStroke();
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(gameState.level, 10, 10);

    p.pop();

    // Minimap / Score
    p.push();
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.fill(255);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
    p.textSize(12);
    p.text(`Kills: ${gameState.killCount}`, CANVAS_WIDTH - 10, 30);
    p.pop();
    
    // Skill Cooldowns
    renderSkillIcons(p);
}

function renderSkillIcons(p) {
    const startX = CANVAS_WIDTH - 150;
    const y = CANVAS_HEIGHT - 50;
    
    // Dash (Shift)
    renderSkillSlot(p, startX, y, 'Shift', gameState.player.skills.dash);
    
    // Spin (Z)
    renderSkillSlot(p, startX + 50, y, 'Z', gameState.player.skills.spin);
    
    // Attack (Space)
    renderSkillSlot(p, startX + 100, y, 'Space', { currentCooldown: gameState.player.attackCooldown, maxCooldown: 20 });
}

function renderSkillSlot(p, x, y, keyName, skillObj) {
    p.push();
    p.translate(x, y);
    p.fill(0, 0, 0, 150);
    p.stroke(200);
    p.rect(0, 0, 40, 40, 4);
    
    // Fill overlay for cooldown
    if (skillObj.currentCooldown > 0) {
        const ratio = skillObj.currentCooldown / skillObj.maxCooldown;
        p.fill(0, 0, 0, 200);
        p.noStroke();
        p.rect(0, 40 * (1 - ratio), 40, 40 * ratio);
    }
    
    p.fill(255);
    p.noStroke();
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(keyName, 20, 20);
    p.pop();
}

export function renderStartScreen(p) {
    p.background(COLORS.background);
    
    p.textAlign(p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("ZENONIA 4 DEMAKE", CANVAS_WIDTH/2, 120);
    
    p.textSize(20);
    p.fill(200);
    p.text("Return of the Legend", CANVAS_WIDTH/2, 160);
    
    p.textSize(16);
    p.fill(150);
    p.text("Defeat the Abyss Lord!", CANVAS_WIDTH/2, 200);
    
    // Flashing text
    if (Math.floor(p.millis() / 500) % 2 === 0) {
        p.fill(255, 255, 0);
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 300);
    }
    
    // Instructions
    p.fill(100);
    p.textSize(12);
    p.text("Arrows: Move | Space: Attack | Z: Skill | Shift: Dash", CANVAS_WIDTH/2, 350);
}

export function renderPausedScreen(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER);
    p.fill(255);
    p.textSize(32);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}

export function renderGameOver(p, win) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER);
    p.textSize(48);
    
    if (win) {
        p.fill(100, 255, 100);
        p.text("LEGENDARY!", CANVAS_WIDTH/2, 150);
        p.textSize(20);
        p.fill(255);
        p.text("You have defeated the Abyss Lord.", CANVAS_WIDTH/2, 200);
    } else {
        p.fill(255, 50, 50);
        p.text("GAME OVER", CANVAS_WIDTH/2, 150);
        p.textSize(20);
        p.fill(255);
        p.text("The legend fades...", CANVAS_WIDTH/2, 200);
    }
    
    p.text(`Final Level: ${gameState.level}`, CANVAS_WIDTH/2, 250);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 280);
    
    p.fill(255, 255, 0);
    p.text("Press R to Restart", CANVAS_WIDTH/2, 340);
}