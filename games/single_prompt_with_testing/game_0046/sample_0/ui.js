// ui.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawUI(p) {
  p.push();
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    drawStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    drawPlayingUI(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    drawPlayingUI(p);
    drawPausedOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    drawGameOverScreen(p);
  }
  
  p.pop();
}

function drawStartScreen(p) {
  p.background(20, 15, 30);
  
  // Title
  p.fill(200, 150, 50);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("SKUL", CANVAS_WIDTH / 2, 80);
  p.textSize(24);
  p.text("The Hero Slayer", CANVAS_WIDTH / 2, 120);
  
  // Skull decoration
  p.fill(240, 240, 230);
  p.ellipse(CANVAS_WIDTH / 2, 170, 40, 45);
  p.fill(50, 50, 50);
  p.circle(CANVAS_WIDTH / 2 - 8, 165, 10);
  p.circle(CANVAS_WIDTH / 2 + 8, 165, 10);
  
  // Description
  p.fill(200, 200, 220);
  p.textSize(14);
  p.text("The Demon King has been captured!", CANVAS_WIDTH / 2, 230);
  p.text("Guide Skul through enemy territory", CANVAS_WIDTH / 2, 250);
  p.text("to rescue him from the Imperial Army.", CANVAS_WIDTH / 2, 270);
  
  // Instructions
  p.fill(255, 255, 255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text("← → : Move", 180, 300);
  p.text("↑ : Jump", 180, 320);
  p.text("Z : Attack", 180, 340);
  p.text("SHIFT : Dash", 370, 300);
  p.text("SPACE : Switch Skull", 370, 320);
  p.text("ESC : Pause", 370, 340);
  
  // Start prompt
  p.fill(255, 255, 150);
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  const flash = p.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 150, 150 + flash * 105);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 380);
}

function drawPlayingUI(p) {
  if (!gameState.player) return;
  
  // Health bar
  p.fill(50, 50, 50);
  p.rect(10, 10, 204, 24);
  p.fill(200, 50, 50);
  p.rect(12, 12, 200 * (gameState.player.health / gameState.player.maxHealth), 20);
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`HP: ${Math.ceil(gameState.player.health)}/${gameState.player.maxHealth}`, 15, 14);
  
  // Score
  p.fill(255, 255, 200);
  p.textSize(14);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  p.textSize(12);
  p.text(`Enemies: ${gameState.enemiesDefeated}`, CANVAS_WIDTH - 10, 30);
  
  // Current skull indicator
  p.fill(255, 255, 255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const skullName = gameState.player.getCurrentSkull().toUpperCase();
  p.text(`Skull: ${skullName}`, 10, 40);
  
  // Equipped skulls
  for (let i = 0; i < gameState.player.equippedSkulls.length; i++) {
    const skull = gameState.player.equippedSkulls[i];
    const isActive = i === gameState.player.currentSkullIndex;
    
    p.fill(...(isActive ? [255, 255, 150] : [150, 150, 150]));
    p.rect(10 + i * 30, 55, 25, 25);
    
    // Draw mini skull icon
    p.fill(240, 240, 230);
    p.circle(22.5 + i * 30, 67.5, 12);
    
    if (skull === 'warrior') {
      p.fill(100, 100, 120);
      p.arc(22.5 + i * 30, 65, 14, 10, p.PI, p.TWO_PI);
    } else if (skull === 'mage') {
      p.fill(50, 30, 80);
      p.triangle(17 + i * 30, 67.5, 28 + i * 30, 67.5, 22.5 + i * 30, 60);
    }
  }
  
  // Boss health bar (when boss is active and not dead)
  if (gameState.boss && !gameState.boss.dead && gameState.player.x > 1800) {
    p.fill(50, 50, 50);
    p.rect(CANVAS_WIDTH / 2 - 152, CANVAS_HEIGHT - 40, 304, 24);
    p.fill(150, 50, 150);
    p.rect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT - 38, 300 * (gameState.boss.health / gameState.boss.maxHealth), 20);
    p.fill(255, 255, 255);
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("CORRUPTED KNIGHT", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 28);
  }
}

function drawPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textSize(14);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function drawGameOverScreen(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(isWin ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH / 2, 120);
  
  // Message
  p.fill(255, 255, 255);
  p.textSize(18);
  if (isWin) {
    p.text("The Demon King has been rescued!", CANVAS_WIDTH / 2, 170);
    p.text("The Imperial Army retreats!", CANVAS_WIDTH / 2, 195);
  } else {
    p.text("Skul has fallen...", CANVAS_WIDTH / 2, 170);
    p.text("The Demon King remains captive.", CANVAS_WIDTH / 2, 195);
  }
  
  // Stats
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 240);
  p.text(`Enemies Defeated: ${gameState.enemiesDefeated}`, CANVAS_WIDTH / 2, 265);
  
  // Restart prompt
  p.fill(255, 255, 150);
  p.textSize(18);
  const flash = p.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 150, 150 + flash * 105);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 330);
}