// render.js - Rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_OFFSET_X, GRID_OFFSET_Y, GRID_CELL_SIZE, GRID_COLS, GRID_ROWS } from './globals.js';
import { drawProjectiles } from './projectiles.js';
import { drawParticles } from './particles.js';
import { drawRoulette } from './roulette.js';

export function drawStartScreen(p) {
  p.background(20, 30, 40);
  
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text('LUCKY MERGE DEFENSE', CANVAS_WIDTH / 2, 80);
  
  p.fill(200);
  p.textSize(14);
  p.text('Defend your base from waves of enemies!', CANVAS_WIDTH / 2, 140);
  p.text('Summon random units and merge them for upgrades.', CANVAS_WIDTH / 2, 160);
  p.text('Embrace the chaos and adapt your strategy!', CANVAS_WIDTH / 2, 180);
  
  p.fill(255, 255, 100);
  p.textSize(16);
  p.text('CONTROLS:', CANVAS_WIDTH / 2, 220);
  
  p.fill(200);
  p.textSize(12);
  const controls = [
    'Arrow Keys: Move cursor',
    'Space: Summon unit',
    'Shift: Place/Select/Merge',
    'Z: Spin roulette',
    'Esc: Pause'
  ];
  
  for (let i = 0; i < controls.length; i++) {
    p.text(controls[i], CANVAS_WIDTH / 2, 245 + i * 20);
  }
  
  p.fill(100, 255, 100);
  p.textSize(20);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 370);
}

export function drawPlayingScreen(p) {
  p.background(40, 50, 40);
  
  // Apply screen shake
  if (gameState.shakeAmount > 0) {
    p.translate(p.random(-gameState.shakeAmount, gameState.shakeAmount), p.random(-gameState.shakeAmount, gameState.shakeAmount));
    gameState.shakeAmount *= 0.9;
    if (gameState.shakeAmount < 0.1) gameState.shakeAmount = 0;
  }
  
  // Draw path
  drawPath(p);
  
  // Draw grid
  drawGrid(p);
  
  // Draw base
  drawBase(p);
  
  // Draw units
  for (const unit of gameState.units) {
    unit.draw(p);
  }
  
  // Draw enemies
  for (const enemy of gameState.enemies) {
    enemy.draw(p);
  }
  
  // Draw projectiles
  drawProjectiles(p);
  
  // Draw particles
  drawParticles(p);
  
  // Draw cursor
  drawCursor(p);
  
  // Draw pending unit
  if (gameState.placementMode && gameState.pendingUnit) {
    drawPendingUnit(p);
  }
  
  // Draw selected unit indicator
  if (gameState.selectedUnit) {
    drawSelectedIndicator(p);
  }
  
  // Draw UI
  drawUI(p);
  
  // Draw roulette
  drawRoulette(p);
  
  // Draw wave messages
  drawWaveMessages(p);
}

function drawPath(p) {
  if (gameState.path.length === 0) return;
  
  p.stroke(100, 80, 60);
  p.strokeWeight(30);
  p.noFill();
  
  p.beginShape();
  for (const point of gameState.path) {
    p.vertex(point.x, point.y);
  }
  p.endShape();
}

function drawGrid(p) {
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const cellX = GRID_OFFSET_X + x * GRID_CELL_SIZE;
      const cellY = GRID_OFFSET_Y + y * GRID_CELL_SIZE;
      
      const cellData = gameState.grid[y] && gameState.grid[y][x];
      const occupied = cellData && !cellData.isEmpty;
      const hovered = (x === gameState.cursorX && y === gameState.cursorY);
      
      if (hovered) {
        p.fill(...(occupied ? [255, 100, 100, 50] : [100, 255, 100, 50]));
      } else {
        p.fill(60, 70, 60, 30);
      }
      
      p.stroke(80, 90, 80);
      p.strokeWeight(1);
      p.rect(cellX, cellY, GRID_CELL_SIZE, GRID_CELL_SIZE);
    }
  }
}

function drawBase(p) {
  if (gameState.path.length === 0) return;
  
  const baseX = gameState.path[gameState.path.length - 1].x;
  const baseY = gameState.path[gameState.path.length - 1].y;
  
  const flashIntensity = gameState.shakeAmount > 0 ? 100 : 0;
  
  p.fill(100 + flashIntensity, 150, 255);
  p.stroke(0);
  p.strokeWeight(3);
  p.rect(baseX - 20, baseY - 20, 40, 40);
  
  // Health bar
  const healthPercent = gameState.baseHealth / gameState.maxBaseHealth;
  p.noStroke();
  p.fill(255, 0, 0);
  p.rect(baseX - 20, baseY - 30, 40, 5);
  p.fill(0, 255, 0);
  p.rect(baseX - 20, baseY - 30, 40 * healthPercent, 5);
}

function drawCursor(p) {
  const cellX = GRID_OFFSET_X + gameState.cursorX * GRID_CELL_SIZE;
  const cellY = GRID_OFFSET_Y + gameState.cursorY * GRID_CELL_SIZE;
  
  p.noFill();
  p.stroke(255, 255, 0);
  p.strokeWeight(3);
  
  const pulse = p.sin(p.frameCount * 0.1) * 3;
  p.rect(cellX - pulse, cellY - pulse, GRID_CELL_SIZE + pulse * 2, GRID_CELL_SIZE + pulse * 2);
}

function drawPendingUnit(p) {
  const cellX = GRID_OFFSET_X + gameState.cursorX * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
  const cellY = GRID_OFFSET_Y + gameState.cursorY * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
  
  p.push();
  p.translate(cellX, cellY);
  
  // Semi-transparent preview
  p.fill(255, 255, 255, 150);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text(gameState.pendingUnit.type, 0, -15);
  p.text(gameState.pendingUnit.rarity, 0, 15);
  
  p.pop();
}

function drawSelectedIndicator(p) {
  const cellX = GRID_OFFSET_X + gameState.selectedUnit.gridX * GRID_CELL_SIZE;
  const cellY = GRID_OFFSET_Y + gameState.selectedUnit.gridY * GRID_CELL_SIZE;
  
  p.noFill();
  p.stroke(0, 255, 255);
  p.strokeWeight(3);
  p.rect(cellX, cellY, GRID_CELL_SIZE, GRID_CELL_SIZE);
}

function drawUI(p) {
  p.push();
  p.resetMatrix();
  
  // Score
  p.fill(255);
  p.noStroke();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Currency
  p.textAlign(p.LEFT, p.BOTTOM);
  p.fill(255, 215, 0);
  p.text(`$ ${gameState.currency}`, 10, CANVAS_HEIGHT - 10);
  
  // Base HP
  p.textAlign(p.RIGHT, p.BOTTOM);
  p.fill(255, 100, 100);
  p.text(`HP: ${gameState.baseHealth}`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
  
  // Level and wave
  p.textAlign(p.LEFT, p.TOP);
  p.fill(200);
  p.textSize(14);
  p.text(`LEVEL ${gameState.level}`, 10, 10);
  p.text(`WAVE ${gameState.currentWave}/${gameState.totalWaves}`, 10, 30);
  
  // Summon cost
  const config = gameState.levelConfigs[gameState.level - 1];
  p.textAlign(p.CENTER, p.BOTTOM);
  p.fill(200);
  p.textSize(12);
  p.text(`SPACE: Summon ($${config.summonCost})`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
  
  // Buff indicator
  if (gameState.buffTimer > 0) {
    p.textAlign(p.CENTER, p.TOP);
    p.fill(255, 100, 255);
    p.textSize(14);
    p.text(`ATK BUFF: ${Math.ceil(gameState.buffTimer / 60)}s`, CANVAS_WIDTH / 2, 10);
  }
  
  p.pop();
}

function drawWaveMessages(p) {
  p.push();
  p.resetMatrix();
  
  if (gameState.waveState === 'COUNTDOWN') {
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text(`WAVE ${gameState.currentWave + 1} INCOMING!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.textSize(16);
    p.text(`${Math.ceil(gameState.waveTimer / 60)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  } else if (gameState.waveState === 'COMPLETE') {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text(`WAVE ${gameState.currentWave} CLEARED!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
  
  p.pop();
}

export function drawPausedScreen(p) {
  drawPlayingScreen(p);
  
  p.push();
  p.resetMatrix();
  
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(16);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  // Small indicator in top right
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.fill(255, 255, 100);
  p.text('PAUSED', CANVAS_WIDTH - 10, 10);
  
  p.pop();
}

export function drawGameOverScreen(p) {
  p.background(20, 20, 30);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  
  if (gameState.gameOverReason === 'WIN') {
    p.fill(100, 255, 100);
    p.text('VICTORY!', CANVAS_WIDTH / 2, 100);
    p.fill(255);
    p.textSize(20);
    p.text('You defended your base!', CANVAS_WIDTH / 2, 150);
  } else {
    p.fill(255, 100, 100);
    p.text('GAME OVER', CANVAS_WIDTH / 2, 100);
    p.fill(255);
    p.textSize(20);
    p.text('Your base was destroyed...', CANVAS_WIDTH / 2, 150);
  }
  
  p.fill(255, 215, 0);
  p.textSize(28);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  p.fill(200);
  p.textSize(16);
  p.text(`Level Reached: ${gameState.level}`, CANVAS_WIDTH / 2, 270);
  p.text(`Waves Cleared: ${gameState.currentWave}`, CANVAS_WIDTH / 2, 295);
  
  p.fill(100, 200, 255);
  p.textSize(20);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 360);
}