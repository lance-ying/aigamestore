import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderUI(p) {
    // HUD Bar
    p.fill(COLORS.UI_BG);
    p.rect(0, 0, CANVAS_WIDTH, 40);
    p.rect(0, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 30);
    
    // Top Bar Info
    p.fill(COLORS.TEXT);
    p.textSize(16);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(`Lvl ${gameState.player.level} ${gameState.player.className}`, 10, 20);
    
    // Health Bar
    p.fill(100, 0, 0);
    p.rect(150, 10, 100, 20);
    p.fill(0, 200, 0);
    const hpPct = gameState.player.hp / gameState.player.maxHp;
    p.rect(150, 10, 100 * hpPct, 20);
    p.stroke(255);
    p.noFill();
    p.rect(150, 10, 100, 20);
    p.noStroke();
    
    p.fill(255);
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`${gameState.player.hp}/${gameState.player.maxHp}`, 200, 20);
    
    // Stats
    p.textSize(14);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(`Floor: ${gameState.level}`, 270, 20);
    p.text(`Gold: ${gameState.player.gold}`, 350, 20);
    p.text(`Score: ${gameState.score}`, 440, 20);
    p.fill(COLORS.POTION);
    p.text(`Potions (Z): ${gameState.player.potions}`, 500, 20);

    // Bottom Bar (Log/Tips)
    p.fill(150);
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("Arrows: Move/Attack | Space: Wait/Stairs | Z: Potion | Esc: Pause", CANVAS_WIDTH/2, CANVAS_HEIGHT - 15);
}

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    
    p.fill(COLORS.TEXT);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("ONEBIT DUNGEON", CANVAS_WIDTH/2, 100);
    
    p.textSize(20);
    p.text("Choose Class", CANVAS_WIDTH/2, 160);
    
    // Class Selection UI
    const classes = gameState.availableClasses;
    const current = classes[gameState.selectedClassIndex];
    
    p.fill(30);
    p.rect(CANVAS_WIDTH/2 - 100, 200, 200, 100, 10);
    
    p.fill(COLORS.ACCENT);
    p.textSize(24);
    p.text(`< ${current.name} >`, CANVAS_WIDTH/2, 220);
    
    p.fill(200);
    p.textSize(14);
    p.text(`HP: ${current.hp} | ATK: ${current.atk} | DEF: ${current.def}`, CANVAS_WIDTH/2, 250);
    p.text(current.desc, CANVAS_WIDTH/2, 280);
    
    p.fill(COLORS.TEXT);
    p.textSize(18);
    p.text("Press ENTER to Start", CANVAS_WIDTH/2, 350);
    
    // Instructions
    p.fill(100);
    p.textSize(12);
    p.text("Use Arrow Keys to select class", CANVAS_WIDTH/2, 375);
}

export function renderPaused(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(COLORS.TEXT);
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

export function renderGameOver(p) {
    p.fill(0, 0, 0, 220);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const win = gameState.gamePhase === "GAME_OVER_WIN";
    p.fill(win ? COLORS.ACCENT : '#FF5555');
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(win ? "YOU ESCAPED!" : "YOU DIED", CANVAS_WIDTH/2, 120);
    
    p.fill(COLORS.TEXT);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 180);
    p.text(`Floor Reached: ${gameState.level}`, CANVAS_WIDTH/2, 220);
    p.text(`Lvl ${gameState.player.level} ${gameState.player.className}`, CANVAS_WIDTH/2, 260);
    
    p.fill(150);
    p.textSize(16);
    p.text("Press R to Restart", CANVAS_WIDTH/2, 350);
}