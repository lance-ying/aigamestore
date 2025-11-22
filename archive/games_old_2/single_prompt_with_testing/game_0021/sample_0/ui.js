// ui.js - UI rendering functions
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASE, gameState } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 20, 35);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glow
  p.fill(100, 150, 255, 50);
  p.noStroke();
  p.textSize(48);
  p.text("DUNGEON TRACER", CANVAS_WIDTH / 2 + 2, 80 + 2);
  
  // Title
  p.fill(200, 220, 255);
  p.textSize(48);
  p.text("DUNGEON TRACER", CANVAS_WIDTH / 2, 80);
  
  // Instructions
  p.textSize(16);
  p.fill(220, 220, 255);
  p.textAlign(p.CENTER, p.TOP);
  
  const instructions = [
    "Connect 3+ matching tiles to activate effects:",
    "",
    "⚔ SWORD tiles - Attack all enemies",
    "🛡 SHIELD tiles - Gain defense for next turn",
    "🧪 POTION tiles - Restore health",
    "",
    "Controls:",
    "SPACE - Select/confirm tiles to create path",
    "SHIFT - Cancel current path",
    "Arrow Keys - Navigate (if needed)",
    "",
    "Survive waves of enemies and level up!",
    "Defeat enemies to gain gold and experience."
  ];
  
  let yPos = 140;
  for (const line of instructions) {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 20;
  }
  
  // Prompt
  p.textSize(20);
  p.fill(255, 255, 100);
  const pulse = Math.sin(p.frameCount * 0.1) * 20 + 235;
  p.fill(pulse, pulse, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

export function renderPausedIndicator(p) {
  p.push();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.fill(255, 255, 100);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

export function renderGameOver(p) {
  p.background(20, 20, 35, 200);
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  const isWin = gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN;
  
  // Game Over text
  p.textSize(48);
  if (isWin) {
    p.fill(100, 255, 100);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
  } else {
    p.fill(255, 100, 100);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
  }
  
  // Stats
  p.textSize(20);
  p.fill(220, 220, 255);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 160);
  p.text(`Level Reached: ${gameState.level}`, CANVAS_WIDTH / 2, 190);
  p.text(`Waves Survived: ${gameState.waveNumber}`, CANVAS_WIDTH / 2, 220);
  p.text(`Max Combo: ${gameState.maxCombo}`, CANVAS_WIDTH / 2, 250);
  p.text(`Gold Earned: ${gameState.gold}`, CANVAS_WIDTH / 2, 280);
  
  // Restart prompt
  p.textSize(18);
  p.fill(255, 255, 100);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

export function renderUI(p) {
  p.push();
  
  // Top bar background
  p.fill(30, 30, 50, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 70);
  
  // Player stats
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.fill(255, 255, 255);
  
  // Health bar
  p.text("HP:", 10, 10);
  p.fill(50, 50, 50);
  p.rect(40, 10, 150, 16);
  const healthPercent = gameState.player.health / gameState.player.maxHealth;
  p.fill(...(healthPercent > 0.5 ? [0, 255, 0] : healthPercent > 0.25 ? [255, 255, 0] : [255, 0, 0]));
  p.rect(40, 10, 150 * healthPercent, 16);
  p.fill(255, 255, 255);
  p.text(`${Math.ceil(gameState.player.health)}/${gameState.player.maxHealth}`, 100, 10);
  
  // Experience bar
  p.text("EXP:", 10, 32);
  p.fill(50, 50, 50);
  p.rect(40, 32, 150, 12);
  const expPercent = gameState.experience / gameState.expToNextLevel;
  p.fill(100, 150, 255);
  p.rect(40, 32, 150 * expPercent, 12);
  
  // Stats
  p.fill(255, 255, 255);
  p.text(`Level: ${gameState.level}`, 10, 50);
  p.text(`ATK: ${gameState.player.attack}`, 80, 50);
  p.text(`DEF: ${gameState.player.defense}`, 140, 50);
  
  // Right side stats
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  p.text(`Gold: ${gameState.gold}`, CANVAS_WIDTH - 10, 28);
  p.text(`Wave: ${gameState.waveNumber}`, CANVAS_WIDTH - 10, 46);
  
  // Defense bonus indicator
  if (gameState.defenseBonus > 0) {
    p.textAlign(p.CENTER, p.TOP);
    p.fill(100, 200, 255);
    p.text(`🛡 +${gameState.defenseBonus} DEF`, CANVAS_WIDTH / 2, 50);
  }
  
  // Match feedback
  if (gameState.lastMatchType && gameState.framesSinceLastAction < 60) {
    p.textAlign(p.CENTER, p.CENTER);
    const alpha = Math.max(0, 255 - gameState.framesSinceLastAction * 4);
    if (gameState.lastMatchType === "ATTACK") {
      p.fill(255, 100, 100, alpha);
      p.textSize(20);
      p.text("⚔ ATTACK!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    } else if (gameState.lastMatchType === "DEFENSE") {
      p.fill(100, 200, 255, alpha);
      p.textSize(20);
      p.text("🛡 DEFENSE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    } else if (gameState.lastMatchType === "HEAL") {
      p.fill(100, 255, 100, alpha);
      p.textSize(20);
      p.text("🧪 HEAL!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    }
  }
  
  p.pop();
}