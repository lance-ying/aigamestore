// ui.js - User interface rendering
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, DAWN_TIME, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { getUpgradeDisplayInfo } from './upgrades.js';

export function renderUI(p) {
  const phase = gameState.gamePhase;
  
  if (phase === PHASE_START) {
    renderStartScreen(p);
  } else if (phase === PHASE_PLAYING) {
    renderPlayingUI(p);
    if (gameState.levelUpPending) {
      renderLevelUpScreen(p);
    }
  } else if (phase === PHASE_PAUSED) {
    renderPlayingUI(p);
    renderPauseScreen(p);
  } else if (phase === PHASE_GAME_OVER_WIN || phase === PHASE_GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.background(20, 10, 30);
  
  // Gothic background effects
  for (let i = 0; i < 50; i++) {
    const x = (p.noise(i * 0.1, p.frameCount * 0.01) * CANVAS_WIDTH);
    const y = (p.noise(i * 0.1 + 100, p.frameCount * 0.01) * CANVAS_HEIGHT);
    p.fill(100, 50, 100, 30);
    p.noStroke();
    p.ellipse(x, y, 20, 20);
  }
  
  // Title
  p.fill(200, 50, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('NIGHT SURVIVOR', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(150, 150, 150);
  p.textSize(16);
  p.text('Survive Until Dawn', CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.fill(200, 200, 200);
  p.textSize(14);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('You are trapped in a cursed wasteland.', CANVAS_WIDTH / 2, 170);
  p.text('Hordes of night creatures hunt you relentlessly.', CANVAS_WIDTH / 2, 190);
  p.text('Survive for 5 minutes until dawn breaks!', CANVAS_WIDTH / 2, 210);
  
  // Controls
  p.textSize(12);
  p.fill(180, 180, 180);
  p.text('Arrow Keys: Move', CANVAS_WIDTH / 2, 250);
  p.text('Space: Select Upgrades', CANVAS_WIDTH / 2, 270);
  p.text('ESC: Pause', CANVAS_WIDTH / 2, 290);
  
  // Start prompt
  p.fill(255, 215, 0);
  p.textSize(18);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 215, 0, 255 * pulse);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 340);
  
  // Persistent gold display
  if (gameState.persistentGold > 0) {
    p.fill(255, 215, 0);
    p.textSize(14);
    p.text(`Total Gold: ${gameState.persistentGold}`, CANVAS_WIDTH / 2, 370);
  }
}

function renderPlayingUI(p) {
  const player = gameState.player;
  if (!player) return;
  
  // Top bar background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Health bar
  p.fill(50);
  p.rect(10, 10, 150, 15);
  const healthPercent = player.health / (player.maxHealth + player.maxHealthBonus);
  p.fill(200, 50, 50);
  p.rect(10, 10, 150 * healthPercent, 15);
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`HP: ${Math.ceil(player.health)}/${player.maxHealth + player.maxHealthBonus}`, 15, 17.5);
  
  // XP bar
  p.fill(50);
  p.rect(10, 30, 150, 10);
  const xpPercent = player.xp / player.xpToNextLevel;
  p.fill(100, 255, 150);
  p.rect(10, 30, 150 * xpPercent, 10);
  p.fill(255);
  p.textSize(10);
  p.text(`Level ${player.level}`, 165, 35);
  
  // Time remaining
  const timeLeft = Math.max(0, DAWN_TIME - gameState.elapsedTime);
  const minutes = Math.floor(timeLeft / 3600);
  const seconds = Math.floor((timeLeft % 3600) / 60);
  p.fill(255, 215, 0);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`${minutes}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 20);
  
  // Enemies killed
  p.fill(200, 200, 200);
  p.textSize(12);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Kills: ${gameState.enemiesKilled}`, CANVAS_WIDTH - 10, 15);
  
  // Gold
  p.fill(255, 215, 0);
  p.text(`Gold: ${gameState.gold}`, CANVAS_WIDTH - 10, 35);
}

function renderLevelUpScreen(p) {
  // Dim background
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Level up title
  p.fill(255, 215, 0);
  p.textSize(32);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('LEVEL UP!', CANVAS_WIDTH / 2, 80);
  
  // Upgrade choices
  const choices = gameState.upgradeChoices;
  const boxWidth = 150;
  const boxHeight = 100;
  const spacing = 20;
  const startX = (CANVAS_WIDTH - (boxWidth * 3 + spacing * 2)) / 2;
  
  for (let i = 0; i < choices.length; i++) {
    const x = startX + i * (boxWidth + spacing);
    const y = 150;
    
    // Highlight on hover (keyboard selection)
    if (gameState.selectedUpgrade === i) {
      p.fill(100, 100, 200, 200);
    } else {
      p.fill(50, 50, 50, 200);
    }
    p.stroke(150, 150, 150);
    p.strokeWeight(2);
    p.rect(x, y, boxWidth, boxHeight, 10);
    
    // Upgrade info
    const info = getUpgradeDisplayInfo(choices[i]);
    p.fill(255);
    p.noStroke();
    p.textSize(14);
    p.textAlign(p.CENTER, p.TOP);
    p.text(info.name, x + boxWidth / 2, y + 15, boxWidth - 20, boxHeight);
    
    p.textSize(11);
    p.fill(200);
    p.text(info.description, x + boxWidth / 2, y + 50, boxWidth - 20, boxHeight);
    
    // Number indicator
    p.fill(255, 215, 0);
    p.textSize(10);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text(`Press ${i + 1}`, x + boxWidth / 2, y + boxHeight - 10);
  }
  
  // Instructions
  p.fill(200, 200, 200);
  p.textSize(12);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('Press 1, 2, or 3 to choose upgrade, or use Arrow Keys + Space', CANVAS_WIDTH / 2, 280);
}

function renderPauseScreen(p) {
  // Small pause indicator
  p.fill(255, 255, 0);
  p.textSize(14);
  p.textAlign(p.RIGHT, p.TOP);
  p.text('PAUSED', CANVAS_WIDTH - 10, 60);
}

function renderGameOverScreen(p) {
  p.background(20, 10, 30);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  if (isWin) {
    p.fill(255, 215, 0);
    p.textSize(48);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('DAWN BREAKS!', CANVAS_WIDTH / 2, 100);
    
    p.fill(200, 200, 200);
    p.textSize(18);
    p.text('You survived the night!', CANVAS_WIDTH / 2, 150);
  } else {
    p.fill(200, 50, 50);
    p.textSize(48);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('OVERWHELMED', CANVAS_WIDTH / 2, 100);
    
    p.fill(200, 200, 200);
    p.textSize(18);
    p.text('The creatures claimed another soul...', CANVAS_WIDTH / 2, 150);
  }
  
  // Stats
  p.fill(255);
  p.textSize(14);
  const timeMinutes = Math.floor(gameState.elapsedTime / 3600);
  const timeSeconds = Math.floor((gameState.elapsedTime % 3600) / 60);
  p.text(`Time Survived: ${timeMinutes}:${timeSeconds.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 200);
  p.text(`Enemies Killed: ${gameState.enemiesKilled}`, CANVAS_WIDTH / 2, 225);
  p.text(`Level Reached: ${gameState.player ? gameState.player.level : 1}`, CANVAS_WIDTH / 2, 250);
  p.text(`Gold Collected: ${gameState.gold}`, CANVAS_WIDTH / 2, 275);
  
  // Restart prompt
  p.fill(255, 215, 0);
  p.textSize(18);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 215, 0, 255 * pulse);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 340);
}