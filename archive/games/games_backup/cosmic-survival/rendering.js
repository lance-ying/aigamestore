// rendering.js - Rendering functions
import { gameState, playerStats } from './globals.js';
import {
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  CANVAS_WIDTH, CANVAS_HEIGHT, WIN_TIME_SECONDS
} from './globals.js';

export function drawGame(p) {
  p.background(20, 15, 30);

  switch (gameState.gamePhase) {
    case PHASE_START:
      drawStartScreen(p);
      break;
    case PHASE_PLAYING:
      drawPlaying(p);
      if (gameState.showingUpgradeScreen) {
        drawUpgradeScreen(p);
      }
      break;
    case PHASE_PAUSED:
      drawPlaying(p);
      drawPausedOverlay(p);
      break;
    case PHASE_GAME_OVER_WIN:
    case PHASE_GAME_OVER_LOSE:
      drawPlaying(p);
      drawGameOverScreen(p);
      break;
  }
}

function drawStartScreen(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(48);
  p.fill(100, 200, 255);
  p.text("COSMIC SURVIVAL", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.textSize(16);
  p.fill(150, 150, 255);
  p.text("20 Minutes Till Dawn", CANVAS_WIDTH / 2, 120);

  // Description
  p.textSize(14);
  p.fill(200);
  p.text("Survive waves of Cthulhu monsters!", CANVAS_WIDTH / 2, 160);
  p.text("Collect XP to level up and gain powerful upgrades.", CANVAS_WIDTH / 2, 180);
  p.text("Survive for 5 minutes to achieve victory!", CANVAS_WIDTH / 2, 200);

  // Controls
  p.textSize(12);
  p.fill(180);
  p.textAlign(p.LEFT, p.CENTER);
  const controlX = 180;
  p.text("ARROW KEYS: Move", controlX, 240);
  p.text("SPACE: Fire weapon", controlX, 260);
  p.text("Z: Special ability (when unlocked)", controlX, 280);
  p.text("ESC: Pause game", controlX, 300);

  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.fill(255, 220, 100);
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
  }
}

function drawPlaying(p) {
  // Draw background grid
  drawGrid(p);

  // Draw particles (behind everything)
  for (let particle of gameState.particles) {
    particle.draw(p);
  }

  // Draw XP orbs
  for (let orb of gameState.xpOrbs) {
    orb.draw(p);
  }

  // Draw bullets
  for (let bullet of gameState.bullets) {
    bullet.draw(p);
  }

  // Draw enemies
  for (let enemy of gameState.enemies) {
    enemy.draw(p);
  }

  // Draw player
  if (gameState.player) {
    gameState.player.draw(p);
  }

  // Draw UI
  drawUI(p);
}

function drawGrid(p) {
  p.stroke(40, 35, 50);
  p.strokeWeight(1);
  const gridSize = 40;
  
  for (let x = 0; x < CANVAS_WIDTH; x += gridSize) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
}

function drawUI(p) {
  // Time remaining
  const timeRemaining = Math.max(0, WIN_TIME_SECONDS - gameState.elapsedTime);
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(20);
  p.fill(255, 220, 100);
  p.text(`${minutes}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 10);

  // Level and XP bar
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.fill(255);
  p.text(`Level ${gameState.level}`, 10, 10);
  
  const xpBarX = 10;
  const xpBarY = 30;
  const xpBarWidth = 150;
  const xpBarHeight = 10;
  
  p.fill(60, 60, 80);
  p.noStroke();
  p.rect(xpBarX, xpBarY, xpBarWidth, xpBarHeight);
  
  const xpPercent = gameState.experience / gameState.experienceToNextLevel;
  p.fill(100, 255, 200);
  p.rect(xpBarX, xpBarY, xpBarWidth * xpPercent, xpBarHeight);

  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.fill(255);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  p.text(`Kills: ${gameState.kills}`, CANVAS_WIDTH - 10, 30);

  // Stats display
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(10);
  p.fill(180);
  let statY = 55;
  if (playerStats.multishot > 1) {
    p.text(`Multishot: ${playerStats.multishot}`, 10, statY);
    statY += 12;
  }
  if (playerStats.pierce > 0) {
    p.text(`Pierce: ${playerStats.pierce}`, 10, statY);
    statY += 12;
  }
  if (playerStats.areaDamage > 0) {
    p.text(`Area DMG: ${playerStats.areaDamage}`, 10, statY);
    statY += 12;
  }
  if (playerStats.hasLightning) {
    p.text(`⚡ Lightning`, 10, statY);
    statY += 12;
  }
  if (playerStats.hasShield && playerStats.shieldHealth > 0) {
    p.text(`🛡 Shield: ${Math.floor(playerStats.shieldHealth)}`, 10, statY);
    statY += 12;
  }
}

function drawUpgradeScreen(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.fill(255, 220, 100);
  p.text("LEVEL UP!", CANVAS_WIDTH / 2, 60);

  // Upgrade choices
  const choiceWidth = 160;
  const choiceHeight = 120;
  const spacing = 20;
  const startX = (CANVAS_WIDTH - (choiceWidth * 3 + spacing * 2)) / 2;
  const startY = 120;

  for (let i = 0; i < gameState.upgradeChoices.length; i++) {
    const upgrade = gameState.upgradeChoices[i];
    const x = startX + i * (choiceWidth + spacing);
    const y = startY;

    // Box
    p.fill(40, 40, 60);
    p.stroke(100, 150, 255);
    p.strokeWeight(2);
    p.rect(x, y, choiceWidth, choiceHeight, 5);

    // Number key indicator
    p.fill(255, 220, 100);
    p.noStroke();
    p.textSize(16);
    p.textAlign(p.CENTER, p.TOP);
    p.text(`[${i + 1}]`, x + choiceWidth / 2, y + 10);

    // Name
    p.fill(255);
    p.textSize(14);
    p.text(upgrade.name, x + choiceWidth / 2, y + 35);

    // Description
    p.fill(200);
    p.textSize(11);
    const words = upgrade.description.split(' ');
    let line = '';
    let lineY = y + 60;
    for (let word of words) {
      const testLine = line + word + ' ';
      if (p.textWidth(testLine) > choiceWidth - 10) {
        p.text(line, x + choiceWidth / 2, lineY);
        line = word + ' ';
        lineY += 14;
      } else {
        line = testLine;
      }
    }
    p.text(line, x + choiceWidth / 2, lineY);
  }

  // Instructions
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.fill(180);
  p.text("Press 1, 2, or 3 to choose an upgrade", CANVAS_WIDTH / 2, 300);
}

function drawPausedOverlay(p) {
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.fill(255, 220, 100);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function drawGameOverScreen(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  p.textAlign(p.CENTER, p.CENTER);

  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    p.textSize(48);
    p.fill(100, 255, 150);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 120);
    
    p.textSize(18);
    p.fill(200);
    p.text("You survived the cosmic horrors!", CANVAS_WIDTH / 2, 170);
  } else {
    p.textSize(48);
    p.fill(255, 100, 100);
    p.text("DEFEATED", CANVAS_WIDTH / 2, 120);
    
    p.textSize(18);
    p.fill(200);
    p.text("The darkness consumed you...", CANVAS_WIDTH / 2, 170);
  }

  // Stats
  p.textSize(16);
  p.fill(255);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.text(`Kills: ${gameState.kills}`, CANVAS_WIDTH / 2, 245);
  p.text(`Level Reached: ${gameState.level}`, CANVAS_WIDTH / 2, 270);
  p.text(`Time Survived: ${Math.floor(gameState.elapsedTime)}s`, CANVAS_WIDTH / 2, 295);

  // Restart prompt
  p.textSize(20);
  p.fill(255, 220, 100);
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
  }
}