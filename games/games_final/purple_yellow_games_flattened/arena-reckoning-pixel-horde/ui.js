// ui.js - UI rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, LEVEL_CONFIGS } from './globals.js';

export function renderUI(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderGameUI(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderGameUI(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.UPGRADE_SELECTION) {
    renderGameUI(p);
    renderUpgradeSelection(p);
  } else if (gameState.gamePhase === GAME_PHASES.LEVEL_TRANSITION) {
    renderLevelTransition(p);
  } else if (gameState.gamePhase.includes("GAME_OVER")) {
    renderGameOver(p);
  }
}

function renderStartScreen(p) {
  p.push();
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(36);
  p.text("ARENA RECKONING", CANVAS_WIDTH / 2, 80);
  
  p.textSize(20);
  p.text("PIXEL HORDE", CANVAS_WIDTH / 2, 115);
  
  // Description
  p.textSize(12);
  p.fill(200);
  p.text("Survive 6 levels of increasing monster hordes!", CANVAS_WIDTH / 2, 160);
  p.text("Collect EXP gems to level up and choose upgrades.", CANVAS_WIDTH / 2, 180);
  p.text("Kill enemies to progress. Upgrades reset each level!", CANVAS_WIDTH / 2, 200);
  
  // Instructions
  p.textSize(14);
  p.fill(255, 220, 100);
  p.text("CONTROLS", CANVAS_WIDTH / 2, 240);
  
  p.textSize(11);
  p.fill(200);
  p.text("Arrow Keys / WASD: Move", CANVAS_WIDTH / 2, 265);
  p.text("Space: Confirm Upgrade", CANVAS_WIDTH / 2, 285);
  p.text("Shift/ESC: Pause", CANVAS_WIDTH / 2, 305);
  p.text("R: Restart", CANVAS_WIDTH / 2, 325);
  
  // Start prompt
  p.textSize(16);
  p.fill(100, 255, 100);
  const alpha = (Math.sin(p.frameCount * 0.1) + 1) * 127 + 50;
  p.fill(100, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  
  p.pop();
}

function renderGameUI(p) {
  const player = gameState.player;
  if (!player) return;
  
  p.push();
  
  // HP Bar
  p.fill(50);
  p.rect(10, 10, 150, 20);
  const healthPercent = player.health / player.maxHealth;
  p.fill(255, 50, 50);
  p.rect(10, 10, 150 * healthPercent, 20);
  p.noFill();
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(10, 10, 150, 20);
  
  p.fill(255);
  p.noStroke();
  p.textSize(10);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`HP: ${Math.ceil(player.health)}/${player.maxHealth}`, 15, 13);
  
  // EXP Bar
  const expPercent = player.currentExp / player.expToNextLevel;
  p.fill(30);
  p.rect(CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT - 30, 200, 15);
  p.fill(100, 150, 255);
  p.rect(CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT - 30, 200 * expPercent, 15);
  p.noFill();
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT - 30, 200, 15);
  
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.text(`EXP: ${Math.floor(player.currentExp)}/${player.expToNextLevel}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 28);
  
  // Level
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text(`LEVEL: ${player.level}`, CANVAS_WIDTH / 2, 10);
  
  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Kill Progress
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    const config = LEVEL_CONFIGS[gameState.currentLevel];
    const kills = gameState.levelKills;
    const target = config ? config.killTarget : 999;
    
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(12);
    p.text(`KILLS: ${kills} / ${target}`, CANVAS_WIDTH / 2, 30);
    p.text(`Stage ${gameState.currentLevel}/6`, CANVAS_WIDTH / 2, 50);
  }
  
  p.pop();
}

function renderPauseOverlay(p) {
  p.push();
  
  // Small indicator
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 40);
  
  p.pop();
}

function renderUpgradeSelection(p) {
  p.push();
  
  // Overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(24);
  p.text("LEVEL UP!", CANVAS_WIDTH / 2, 40);
  
  p.textSize(14);
  p.fill(200);
  p.text("Choose an upgrade:", CANVAS_WIDTH / 2, 75);
  
  // Upgrade options
  const boxWidth = 160;
  const boxHeight = 120;
  const spacing = 20;
  const startX = (CANVAS_WIDTH - (boxWidth * 3 + spacing * 2)) / 2;
  const startY = 120;
  
  for (let i = 0; i < gameState.availableUpgrades.length; i++) {
    const upgrade = gameState.availableUpgrades[i];
    const x = startX + i * (boxWidth + spacing);
    const y = startY;
    
    // Box
    if (i === gameState.selectedUpgradeIndex) {
      p.fill(80, 80, 120);
      p.stroke(255, 220, 100);
      p.strokeWeight(3);
    } else {
      p.fill(40, 40, 60);
      p.stroke(100);
      p.strokeWeight(2);
    }
    p.rect(x, y, boxWidth, boxHeight);
    
    // Text
    p.noStroke();
    p.fill(255);
    p.textSize(12);
    p.textAlign(p.CENTER, p.TOP);
    p.text(upgrade.name, x + boxWidth / 2, y + 10);
    
    p.textSize(10);
    p.fill(200);
    
    // Wrap description
    const words = upgrade.description.split(' ');
    let line = '';
    let yOffset = 40;
    for (const word of words) {
      const testLine = line + word + ' ';
      if (p.textWidth(testLine) > boxWidth - 20) {
        p.text(line, x + boxWidth / 2, y + yOffset);
        line = word + ' ';
        yOffset += 15;
      } else {
        line = testLine;
      }
    }
    p.text(line, x + boxWidth / 2, y + yOffset);
    
    // Type indicator
    p.textSize(9);
    p.fill(150, 150, 200);
    p.text(`[${upgrade.type}]`, x + boxWidth / 2, y + boxHeight - 20);
  }
  
  // Instructions
  p.fill(255, 220, 100);
  p.textSize(12);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Use Arrow Keys to select, Space to confirm", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

function renderLevelTransition(p) {
  p.push();
  
  // Overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Message
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text(gameState.transitionMessage, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(16);
  p.fill(200);
  p.text("Get ready...", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  p.pop();
}

function renderGameOver(p) {
  p.push();
  
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.textSize(36);
    p.fill(100, 255, 100);
    p.text("VICTORY!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    p.textSize(16);
    p.fill(255);
    p.text("You survived all 6 levels!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  } else {
    p.textSize(36);
    p.fill(255, 100, 100);
    p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    p.textSize(16);
    p.fill(255);
    p.text("You were overwhelmed...", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  }
  
  p.textSize(20);
  p.fill(255, 220, 100);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  p.textSize(14);
  p.fill(200);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  
  p.pop();
}