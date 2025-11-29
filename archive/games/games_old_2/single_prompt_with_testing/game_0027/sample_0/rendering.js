// rendering.js - Rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, 
         PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, GAME_DURATION } from './globals.js';
import { renderUpgradeScreen } from './upgrades.js';

export function renderGame(p) {
  p.background(20, 20, 30);
  
  switch(gameState.gamePhase) {
    case PHASE_START:
      renderStartScreen(p);
      break;
    case PHASE_PLAYING:
      renderPlaying(p);
      if (gameState.showUpgradeScreen) {
        renderUpgradeScreen(p, gameState.availableUpgrades, gameState);
      }
      break;
    case PHASE_PAUSED:
      renderPlaying(p);
      renderPauseOverlay(p);
      break;
    case PHASE_GAME_OVER_WIN:
    case PHASE_GAME_OVER_LOSE:
      renderPlaying(p);
      renderGameOver(p);
      break;
  }
}

function renderStartScreen(p) {
  // Background gradient effect
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const alpha = p.map(i, 0, CANVAS_HEIGHT, 50, 20);
    p.stroke(alpha, alpha, alpha + 10);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Title
  p.fill(255, 200, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("20 MINUTES TILL DAWN", CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.fill(200, 150, 255);
  p.textSize(14);
  p.text("Survive the endless horde", CANVAS_WIDTH / 2, 95);
  
  // Instructions box
  p.fill(40, 40, 60, 200);
  p.stroke(100, 150, 255);
  p.strokeWeight(2);
  p.rect(100, 130, 400, 180, 5);
  
  // Instructions
  p.fill(255);
  p.noStroke();
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  
  const instructions = [
    "OBJECTIVE:",
    "• Survive for 20 minutes against monster waves",
    "• Collect XP gems to level up",
    "• Choose powerful upgrades at each level",
    "",
    "CONTROLS:",
    "• Arrow Keys: Move your character",
    "• Space: Dash (with cooldown)",
    "• Your weapon fires automatically!"
  ];
  
  let yPos = 145;
  for (const line of instructions) {
    if (line.startsWith("OBJECTIVE:") || line.startsWith("CONTROLS:")) {
      p.fill(255, 200, 100);
    } else {
      p.fill(220);
    }
    p.text(line, 120, yPos);
    yPos += 18;
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100 + pulse * 155, 255, 100 + pulse * 155);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

function renderPlaying(p) {
  // Background
  p.background(30, 30, 40);
  
  // Grid pattern
  p.stroke(40, 40, 50);
  p.strokeWeight(1);
  for (let i = 0; i < CANVAS_WIDTH; i += 40) {
    p.line(i, 0, i, CANVAS_HEIGHT);
  }
  for (let i = 0; i < CANVAS_HEIGHT; i += 40) {
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Render entities
  for (const gem of gameState.xpGems) {
    gem.render(p);
  }
  
  for (const enemy of gameState.enemies) {
    enemy.render(p);
  }
  
  for (const bullet of gameState.bullets) {
    bullet.render(p);
  }
  
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // UI
  renderUI(p);
}

function renderUI(p) {
  // Top bar background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Timer
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  const minutes = Math.floor(gameState.gameTime / 60);
  const seconds = Math.floor(gameState.gameTime % 60);
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const targetTime = `${Math.floor(GAME_DURATION / 60)}:00`;
  p.text(`TIME: ${timeString} / ${targetTime}`, CANVAS_WIDTH / 2, 15);
  
  // Level and XP bar
  p.fill(200, 200, 255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`Level ${gameState.level}`, 10, 15);
  
  const barWidth = 150;
  const barHeight = 8;
  const barX = 10;
  const barY = 30;
  
  p.fill(50, 50, 70);
  p.noStroke();
  p.rect(barX, barY, barWidth, barHeight);
  
  const xpPercent = gameState.xp / gameState.xpToNextLevel;
  p.fill(100, 200, 255);
  p.rect(barX, barY, barWidth * xpPercent, barHeight);
  
  // Score
  p.fill(255, 200, 100);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 15);
  p.text(`Kills: ${gameState.enemiesKilled}`, CANVAS_WIDTH - 10, 35);
  
  // Dash cooldown indicator
  if (gameState.player && gameState.player.dashCooldown > 0) {
    const cooldownPercent = gameState.player.dashCooldown / 120;
    p.fill(255, 100, 100);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(12);
    p.text(`Dash: ${Math.ceil(cooldownPercent * 2)}s`, 10, CANVAS_HEIGHT - 10);
  } else {
    p.fill(100, 255, 100);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(12);
    p.text("Dash: READY", 10, CANVAS_HEIGHT - 10);
  }
}

function renderPauseOverlay(p) {
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function renderGameOver(p) {
  // Overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Result
  p.textAlign(p.CENTER, p.CENTER);
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.textSize(36);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 120);
    p.fill(200, 255, 200);
    p.textSize(18);
    p.text("You survived till dawn!", CANVAS_WIDTH / 2, 160);
  } else {
    p.fill(255, 100, 100);
    p.textSize(36);
    p.text("DEFEAT", CANVAS_WIDTH / 2, 120);
    p.fill(255, 200, 200);
    p.textSize(18);
    p.text("The darkness consumed you", CANVAS_WIDTH / 2, 160);
  }
  
  // Stats
  p.fill(255);
  p.textSize(16);
  const minutes = Math.floor(gameState.gameTime / 60);
  const seconds = Math.floor(gameState.gameTime % 60);
  p.text(`Time Survived: ${minutes}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 210);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 235);
  p.text(`Enemies Defeated: ${gameState.enemiesKilled}`, CANVAS_WIDTH / 2, 260);
  p.text(`Level Reached: ${gameState.level}`, CANVAS_WIDTH / 2, 285);
  
  // Restart prompt
  p.fill(200, 200, 255);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}