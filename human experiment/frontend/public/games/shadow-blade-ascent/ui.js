import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
    if (gameState.gamePhase === 'START') {
        p.background(10, 10, 20);
        p.textAlign(p.CENTER);
        
        // "press enter to begin" message
        p.fill(255);
        p.textSize(20);
        p.text("press enter to begin", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
        
        // The HTML elements for description and controls are visible by default
        // No need to draw a redundant controls section here.
        return;
    }

    // HUD
    p.push();
    p.resetMatrix(); // Ensure HUD is static relative to screen
    
    // Bars
    // HP
    p.noStroke();
    p.fill(50);
    p.rect(20, 20, 200, 20);
    p.fill(200, 0, 0);
    const hpPct = Math.max(0, gameState.player.health / gameState.player.maxHealth);
    p.rect(20, 20, 200 * hpPct, 20);
    p.stroke(255);
    p.noFill();
    p.rect(20, 20, 200, 20);
    p.fill(255);
    p.textAlign(p.LEFT);
    p.textSize(12);
    p.text(`HP ${gameState.player.health}/${gameState.player.maxHealth}`, 25, 35);

    // Mana
    p.noStroke();
    p.fill(50);
    p.rect(20, 45, 150, 10);
    p.fill(0, 100, 255);
    const mpPct = Math.max(0, gameState.player.mana / gameState.player.maxMana);
    p.rect(20, 45, 150 * mpPct, 10);
    
    // XP
    p.fill(0, 200, 0);
    p.rect(0, CANVAS_HEIGHT - 5, CANVAS_WIDTH * (gameState.player.xp / gameState.player.xpThreshold), 5);

    // Score & Level
    p.fill(255);
    p.textAlign(p.RIGHT);
    p.textSize(18);
    p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 20, 30);
    p.textAlign(p.LEFT);
    p.text(`LVL ${gameState.player.level}`, 20, 70);
    p.text(`AREA ${gameState.currentLevel}`, 20, 90);

    // Boss UI
    const boss = gameState.enemies.find(e => e.enemyType === 'BOSS' && e.active);
    if (boss) {
        // Boss Health Bar
        const barW = 300;
        const barX = CANVAS_WIDTH/2 - barW/2;
        p.noStroke();
        p.fill(50);
        p.rect(barX, 50, barW, 15);
        p.fill(150, 0, 150); // Boss color
        p.rect(barX, 50, barW * (boss.hp / boss.maxHp), 15);
        p.stroke(255);
        p.noFill();
        p.rect(barX, 50, barW, 15);
        p.fill(255);
        p.textAlign(p.CENTER);
        p.textSize(14);
        p.text("BOSS", CANVAS_WIDTH/2, 45);

        // Direction Indicator
        // If boss is off screen to the right
        const screenRight = gameState.cameraX + CANVAS_WIDTH;
        if (boss.x > screenRight) {
             p.fill(255, 50, 50);
             p.textAlign(p.RIGHT);
             p.textSize(20);
             p.text("BOSS ->", CANVAS_WIDTH - 20, CANVAS_HEIGHT/2);
        }
    }

    // Combo
    if (gameState.player.combo > 1) {
        p.textAlign(p.RIGHT);
        p.textSize(24);
        p.fill(255, 255, 0);
        p.text(`${gameState.player.combo} HITS!`, CANVAS_WIDTH - 20, 60);
    }
    
    // Skill Ready Indicators
    p.textAlign(p.RIGHT);
    p.textSize(12);
    p.fill(gameState.player.mana >= 20 ? 255 : 100);
    p.text("Skill 1 (Down+Z): 20 MP", CANVAS_WIDTH - 20, CANVAS_HEIGHT - 40);
    p.fill(gameState.player.mana >= 15 ? 255 : 100);
    p.text("Skill 2 (L/R+Z): 15 MP", CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20);

    // Overlays
    if (gameState.gamePhase === 'GAME_OVER_LOSE') {
        p.fill(0, 0, 0, 200);
        p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        p.fill(200, 0, 0);
        p.textAlign(p.CENTER);
        p.textSize(40);
        p.text("YOU DIED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
        p.fill(255);
        p.textSize(20);
        p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    } else if (gameState.gamePhase === 'GAME_OVER_WIN') {
        p.fill(0, 0, 0, 200);
        p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        p.fill(255, 215, 0);
        p.textAlign(p.CENTER);
        p.textSize(40);
        p.text("VICTORY!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
        p.fill(255);
        p.textSize(20);
        p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
        p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    } else if (gameState.gamePhase === 'LEVEL_TRANSITION') {
        p.fill(0);
        p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        p.fill(255);
        p.textAlign(p.CENTER);
        p.textSize(30);
        p.text(`LEVEL ${gameState.currentLevel} CLEARED`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    }

    p.pop();
}