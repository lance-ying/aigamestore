// rendering.js - All rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, LANE_WIDTH, LANE_START_X, HIT_ZONE_Y, HIT_ZONE_HEIGHT, LANE_COLORS, NUM_LANES } from './globals.js';
import { LEVEL_DEFINITIONS } from './levels.js';

export function renderGame(p) {
  // Clear background
  p.background(20, 15, 30);
  
  if (gameState.gamePhase === 'START') {
    renderStartScreen(p);
  } else if (gameState.gamePhase === 'PLAYING') {
    renderPlayingScreen(p);
  } else if (gameState.gamePhase === 'PAUSED') {
    renderPlayingScreen(p);
    renderPausedOverlay(p);
  } else if (gameState.gamePhase === 'GAME_OVER') {
    renderGameOverScreen(p);
  } else if (gameState.gamePhase === 'LEVEL_COMPLETE') {
    renderLevelCompleteScreen(p);
  }
}

function renderStartScreen(p) {
  // Animated background
  renderAnimatedBackground(p);
  
  // Title
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 220, 100);
  p.textSize(48);
  p.text('RHYTHM FLOW', CANVAS_WIDTH / 2, 80);
  p.textSize(36);
  p.fill(150, 200, 255);
  p.text('ARCADE', CANVAS_WIDTH / 2, 125);
  p.pop();
  
  // Description
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.fill(200, 200, 220);
  const desc1 = 'Hit the notes as they reach the hit zone!';
  const desc2 = 'Build combos for higher scores.';
  const desc3 = 'Keep your life bar above zero to survive.';
  p.text(desc1, CANVAS_WIDTH / 2, 170);
  p.text(desc2, CANVAS_WIDTH / 2, 190);
  p.text(desc3, CANVAS_WIDTH / 2, 210);
  p.pop();
  
  // Controls
  p.push();
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(13);
  p.fill(180, 230, 255);
  const startY = 240;
  p.text('CONTROLS:', 120, startY);
  p.fill(255, 255, 255);
  p.text('A - Lane 1 (Red)', 120, startY + 25);
  p.text('S - Lane 2 (Blue)', 120, startY + 45);
  p.text('D - Lane 3 (Green)', 320, startY + 25);
  p.text('W - Lane 4 (Yellow)', 320, startY + 45);
  p.text('ESC - Pause', 220, startY + 70);
  p.pop();
  
  // Press ENTER prompt
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const pulse = 0.5 + 0.5 * Math.sin(p.frameCount * 0.1);
  p.fill(100, 255, 100, 150 + pulse * 100);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 360);
  p.pop();
}

function renderPlayingScreen(p) {
  // Background
  renderAnimatedBackground(p);
  
  // Lanes
  renderLanes(p);
  
  // Hit zone
  renderHitZone(p);
  
  // Notes
  const levelDef = LEVEL_DEFINITIONS[gameState.currentLevel - 1];
  for (const note of gameState.activeNotes) {
    note.draw(p, levelDef.scrollSpeed);
  }
  
  // Particles
  for (const particle of gameState.particleEffects) {
    particle.draw(p);
  }
  
  // Hit feedback
  for (const feedback of gameState.recentHitFeedback) {
    feedback.draw(p);
  }
  
  // UI
  renderUI(p);
}

function renderLanes(p) {
  p.push();
  p.strokeWeight(1);
  p.stroke(80, 80, 120, 100);
  
  for (let i = 0; i < NUM_LANES; i++) {
    const x = LANE_START_X + i * LANE_WIDTH;
    p.line(x, 0, x, CANVAS_HEIGHT);
    p.line(x + LANE_WIDTH, 0, x + LANE_WIDTH, CANVAS_HEIGHT);
  }
  p.pop();
}

function renderHitZone(p) {
  p.push();
  p.noFill();
  p.strokeWeight(3);
  
  for (let i = 0; i < NUM_LANES; i++) {
    const x = LANE_START_X + i * LANE_WIDTH;
    const color = LANE_COLORS[i];
    p.stroke(...color, 150);
    p.rect(x + 10, HIT_ZONE_Y - HIT_ZONE_HEIGHT / 2, LANE_WIDTH - 20, HIT_ZONE_HEIGHT, 5);
  }
  p.pop();
}

function renderUI(p) {
  // Score
  p.push();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(20);
  p.fill(255, 255, 255);
  p.text(`SCORE: ${gameState.score.toLocaleString()}`, 10, 10);
  p.pop();
  
  // Combo
  if (gameState.combo > 0) {
    p.push();
    p.textAlign(p.CENTER, p.BOTTOM);
    const comboSize = 30 + Math.min(gameState.combo / 10, 5) * 2;
    p.textSize(comboSize);
    p.fill(255, 200, 50);
    p.strokeWeight(2);
    p.stroke(100, 50, 0);
    p.text(`COMBO: ${gameState.combo}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
    p.pop();
  }
  
  // Life bar
  p.push();
  const barWidth = 300;
  const barHeight = 20;
  const barX = (CANVAS_WIDTH - barWidth) / 2;
  const barY = 10;
  
  p.fill(50, 50, 60);
  p.noStroke();
  p.rect(barX, barY, barWidth, barHeight, 5);
  
  const lifeWidth = (gameState.lifeBar / 100) * barWidth;
  const lifeColor = gameState.lifeBar > 50 ? [80, 255, 120] : gameState.lifeBar > 25 ? [255, 220, 80] : [255, 80, 80];
  p.fill(...lifeColor);
  p.rect(barX, barY, lifeWidth, barHeight, 5);
  
  p.stroke(255);
  p.strokeWeight(2);
  p.noFill();
  p.rect(barX, barY, barWidth, barHeight, 5);
  p.pop();
  
  // Level indicator
  p.push();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.fill(200, 200, 220);
  p.text(`Level ${gameState.currentLevel} / ${gameState.totalLevels}`, CANVAS_WIDTH - 10, 10);
  const levelDef = LEVEL_DEFINITIONS[gameState.currentLevel - 1];
  p.textSize(12);
  p.fill(150, 150, 170);
  p.text(levelDef.name, CANVAS_WIDTH - 10, 30);
  p.pop();
}

function renderPausedOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.fill(255, 255, 255);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
  
  p.textSize(18);
  p.fill(200, 200, 220);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text('Press R to Return to Menu', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  p.pop();
  
  // Small indicator in corner
  p.push();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.fill(255, 200, 100);
  p.text('PAUSED', CANVAS_WIDTH - 10, 50);
  p.pop();
}

function renderGameOverScreen(p) {
  renderAnimatedBackground(p);
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.fill(255, 80, 80);
  p.text('GAME OVER', CANVAS_WIDTH / 2, 100);
  
  p.textSize(24);
  p.fill(255, 255, 255);
  p.text(`Final Score: ${gameState.score.toLocaleString()}`, CANVAS_WIDTH / 2, 160);
  p.text(`Max Combo: ${gameState.maxCombo}`, CANVAS_WIDTH / 2, 190);
  
  p.textSize(18);
  p.fill(200, 200, 220);
  p.text('Accuracy Breakdown:', CANVAS_WIDTH / 2, 230);
  
  p.textSize(16);
  p.fill(255, 215, 0);
  p.text(`Perfect: ${gameState.accuracyCount.perfect}`, CANVAS_WIDTH / 2 - 80, 260);
  p.fill(100, 255, 100);
  p.text(`Great: ${gameState.accuracyCount.great}`, CANVAS_WIDTH / 2 + 80, 260);
  p.fill(150, 200, 255);
  p.text(`Good: ${gameState.accuracyCount.good}`, CANVAS_WIDTH / 2 - 80, 290);
  p.fill(255, 80, 80);
  p.text(`Miss: ${gameState.accuracyCount.miss}`, CANVAS_WIDTH / 2 + 80, 290);
  
  p.textSize(20);
  p.fill(150, 255, 150);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, 350);
  p.pop();
}

function renderLevelCompleteScreen(p) {
  renderAnimatedBackground(p);
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.fill(100, 255, 100);
  p.text('LEVEL COMPLETE!', CANVAS_WIDTH / 2, 80);
  
  const levelDef = LEVEL_DEFINITIONS[gameState.currentLevel - 1];
  p.textSize(20);
  p.fill(200, 220, 255);
  p.text(levelDef.name, CANVAS_WIDTH / 2, 120);
  
  p.textSize(24);
  p.fill(255, 255, 255);
  p.text(`Score: ${gameState.score.toLocaleString()}`, CANVAS_WIDTH / 2, 160);
  p.text(`Max Combo: ${gameState.maxCombo}`, CANVAS_WIDTH / 2, 190);
  
  p.textSize(18);
  p.fill(200, 200, 220);
  p.text('Accuracy:', CANVAS_WIDTH / 2, 230);
  
  p.textSize(16);
  p.fill(255, 215, 0);
  p.text(`Perfect: ${gameState.accuracyCount.perfect}`, CANVAS_WIDTH / 2 - 80, 260);
  p.fill(100, 255, 100);
  p.text(`Great: ${gameState.accuracyCount.great}`, CANVAS_WIDTH / 2 + 80, 260);
  p.fill(150, 200, 255);
  p.text(`Good: ${gameState.accuracyCount.good}`, CANVAS_WIDTH / 2 - 80, 290);
  p.fill(255, 80, 80);
  p.text(`Miss: ${gameState.accuracyCount.miss}`, CANVAS_WIDTH / 2 + 80, 290);
  
  p.textSize(20);
  if (gameState.currentLevel < gameState.totalLevels) {
    p.fill(255, 220, 100);
    p.text('Press SPACE for Next Level', CANVAS_WIDTH / 2, 340);
  } else {
    p.fill(255, 220, 100);
    p.text('All Levels Complete!', CANVAS_WIDTH / 2, 340);
  }
  p.fill(150, 255, 150);
  p.text('Press R to Return to Menu', CANVAS_WIDTH / 2, 370);
  p.pop();
}

function renderAnimatedBackground(p) {
  // Subtle animated background
  p.push();
  p.noStroke();
  for (let i = 0; i < 5; i++) {
    const t = p.frameCount * 0.005 + i * 1.5;
    const x = CANVAS_WIDTH / 2 + Math.cos(t) * 200;
    const y = CANVAS_HEIGHT / 2 + Math.sin(t * 1.3) * 150;
    const size = 150 + Math.sin(t * 2) * 50;
    const alpha = 20 + Math.sin(t * 3) * 10;
    p.fill(100 + i * 30, 80 + i * 20, 150 + i * 20, alpha);
    p.circle(x, y, size);
  }
  p.pop();
}