// renderer.js - Rendering functions

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  GRID_SIZE,
  GRID_COLS,
  GRID_ROWS,
  TRAP_DATA,
  PATH_WAYPOINTS,
  MAX_ESCAPED,
  TOTAL_WAVES
} from './globals.js';

const TRAP_TYPES = ['DART', 'SPRING', 'LAVA', 'SUMMON'];

export function renderGame(p) {
  p.background(20, 15, 25);
  
  switch (gameState.gamePhase) {
    case PHASE_START:
      renderStartScreen(p);
      break;
    case PHASE_PLAYING:
      renderPlayingScreen(p);
      break;
    case PHASE_PAUSED:
      renderPlayingScreen(p);
      renderPauseOverlay(p);
      break;
    case PHASE_GAME_OVER_WIN:
    case PHASE_GAME_OVER_LOSE:
      renderGameOverScreen(p);
      break;
  }
}

function renderStartScreen(p) {
  p.fill(200, 150, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("DUNGEON WARFARE", CANVAS_WIDTH / 2, 80);
  
  p.textSize(14);
  p.fill(180, 180, 200);
  p.text("Defend your dungeon core from invading adventurers!", CANVAS_WIDTH / 2, 130);
  p.text("Place traps to stop 20 waves of enemies from reaching the core.", CANVAS_WIDTH / 2, 150);
  
  p.textSize(12);
  p.fill(150, 150, 170);
  p.text("Controls:", CANVAS_WIDTH / 2, 190);
  p.text("Arrow Keys: Navigate | Space: Confirm | Z: Upgrade/Cancel", CANVAS_WIDTH / 2, 210);
  p.text("Shift: Speed up spawning (hold)", CANVAS_WIDTH / 2, 230);
  
  p.textSize(16);
  p.fill(255, 255, 100);
  const pulse = Math.sin(p.frameCount * 0.1) * 20 + 235;
  p.fill(pulse, pulse, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 280);
  
  // Preview trap icons
  p.textSize(10);
  p.fill(150, 150, 170);
  p.text("Trap Types:", CANVAS_WIDTH / 2, 320);
  
  for (let i = 0; i < TRAP_TYPES.length; i++) {
    const x = CANVAS_WIDTH / 2 - 80 + i * 50;
    const y = 350;
    
    p.fill(60, 40, 20);
    p.rect(x - 15, y - 15, 30, 30);
    
    p.fill(200, 200, 220);
    p.textSize(8);
    p.text(TRAP_DATA[TRAP_TYPES[i]].name, x, y + 25);
  }
}

function renderPlayingScreen(p) {
  // Draw grid and path
  renderGrid(p);
  renderPath(p);
  
  // Draw traps
  gameState.traps.forEach(trap => trap.draw(p));
  
  // Draw enemies
  gameState.enemies.forEach(enemy => enemy.draw(p));
  
  // Draw projectiles
  gameState.projectiles.forEach(proj => proj.draw(p));
  
  // Draw minions
  gameState.minions.forEach(minion => minion.draw(p));
  
  // Draw core
  renderCore(p);
  
  // Draw UI
  renderUI(p);
  
  // Draw trap selection
  if (gameState.selectedTrapType) {
    renderTrapPlacement(p);
  }
  
  // Draw upgrade mode
  if (gameState.upgradingTrap) {
    renderUpgradeMode(p);
  }
}

function renderGrid(p) {
  p.stroke(40, 35, 45);
  p.strokeWeight(1);
  
  for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  
  for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  p.noStroke();
}

function renderPath(p) {
  p.fill(60, 50, 40);
  
  for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
    const start = PATH_WAYPOINTS[i];
    const end = PATH_WAYPOINTS[i + 1];
    
    const x1 = start.x * GRID_SIZE;
    const y1 = start.y * GRID_SIZE;
    const x2 = end.x * GRID_SIZE + GRID_SIZE;
    const y2 = end.y * GRID_SIZE + GRID_SIZE;
    
    p.rect(
      Math.min(x1, x2),
      Math.min(y1, y2),
      Math.abs(x2 - x1) || GRID_SIZE,
      Math.abs(y2 - y1) || GRID_SIZE
    );
  }
}

function renderCore(p) {
  const coreX = PATH_WAYPOINTS[PATH_WAYPOINTS.length - 1].x * GRID_SIZE + GRID_SIZE / 2;
  const coreY = PATH_WAYPOINTS[PATH_WAYPOINTS.length - 1].y * GRID_SIZE + GRID_SIZE / 2;
  
  p.push();
  p.translate(coreX, coreY);
  
  // Glow effect
  for (let i = 4; i > 0; i--) {
    p.fill(100, 50, 200, 30);
    p.circle(0, 0, 30 + i * 6);
  }
  
  // Core
  p.fill(150, 100, 255);
  p.circle(0, 0, 30);
  p.fill(200, 150, 255);
  p.circle(0, 0, 20);
  
  p.pop();
}

function renderUI(p) {
  // Top bar background
  p.fill(30, 25, 35, 200);
  p.rect(0, 0, CANVAS_WIDTH, 30);
  
  // Gold
  p.fill(255, 215, 0);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`Gold: ${gameState.gold}`, 10, 15);
  
  // Wave
  p.fill(200, 200, 220);
  p.text(`Wave: ${gameState.currentWave}/${TOTAL_WAVES}`, 120, 15);
  
  // Escaped
  const escapedColor = gameState.enemiesEscaped > MAX_ESCAPED * 0.7 ? [255, 100, 100] : [200, 200, 220];
  p.fill(...escapedColor);
  p.text(`Escaped: ${gameState.enemiesEscaped}/${MAX_ESCAPED}`, 250, 15);
  
  // Score
  p.fill(150, 255, 150);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 15);
  
  // Trap menu
  renderTrapMenu(p);
}

function renderTrapMenu(p) {
  const menuX = 10;
  const menuY = CANVAS_HEIGHT - 80;
  const buttonWidth = 60;
  const buttonHeight = 60;
  const spacing = 5;
  
  p.fill(30, 25, 35, 200);
  p.rect(menuX - 5, menuY - 5, (buttonWidth + spacing) * TRAP_TYPES.length + 5, buttonHeight + 10);
  
  for (let i = 0; i < TRAP_TYPES.length; i++) {
    const x = menuX + i * (buttonWidth + spacing);
    const trapType = TRAP_TYPES[i];
    const data = TRAP_DATA[trapType];
    
    // Button background
    const isSelected = i === gameState.menuIndex && !gameState.selectedTrapType;
    p.fill(isSelected ? 80 : 50, isSelected ? 60 : 40, isSelected ? 40 : 30);
    p.rect(x, menuY, buttonWidth, buttonHeight);
    
    // Draw mini trap icon
    p.push();
    p.translate(x + buttonWidth / 2, menuY + 20);
    p.scale(0.7);
    
    // Simplified trap rendering
    if (trapType === 'DART') {
      p.fill(120, 120, 140);
      p.triangle(-8, 0, 8, -6, 8, 6);
    } else if (trapType === 'SPRING') {
      p.stroke(180, 180, 180);
      p.strokeWeight(2);
      p.noFill();
      for (let j = 0; j < 3; j++) {
        const y1 = -6 + (j / 3) * 12;
        const y2 = -6 + ((j + 0.5) / 3) * 12;
        p.line(-4, y1, 4, y2);
      }
      p.noStroke();
    } else if (trapType === 'LAVA') {
      p.fill(255, 100, 0);
      p.circle(0, 0, 12);
    } else if (trapType === 'SUMMON') {
      p.fill(150, 100, 200);
      p.circle(0, 0, 12);
    }
    
    p.pop();
    
    // Cost
    p.fill(255, 215, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(`${data.baseCost}g`, x + buttonWidth / 2, menuY + 50);
  }
}

function renderTrapPlacement(p) {
  const x = gameState.cursorPos.x * GRID_SIZE + GRID_SIZE / 2;
  const y = gameState.cursorPos.y * GRID_SIZE + GRID_SIZE / 2;
  
  const canPlace = gameState.grid[gameState.cursorPos.y][gameState.cursorPos.x] === null &&
                   !gameState.pathCells.has(`${gameState.cursorPos.x},${gameState.cursorPos.y}`);
  
  // Highlight cell
  p.fill(canPlace ? 0 : 255, canPlace ? 255 : 0, 0, 50);
  p.rect(
    gameState.cursorPos.x * GRID_SIZE,
    gameState.cursorPos.y * GRID_SIZE,
    GRID_SIZE,
    GRID_SIZE
  );
  
  // Preview trap
  if (canPlace) {
    p.push();
    p.translate(x, y);
    p.scale(0.8);
    p.fill(60, 40, 20, 150);
    p.rect(-15, -15, 30, 30);
    p.pop();
  }
  
  // Instructions
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text("Arrows: Move | Space: Place | Z: Cancel", CANVAS_WIDTH / 2, 40);
}

function renderUpgradeMode(p) {
  const trap = gameState.upgradingTrap;
  const x = trap.x;
  const y = trap.y;
  
  // Highlight trap
  p.fill(255, 215, 0, 100);
  p.circle(x, y, GRID_SIZE * 1.5);
  
  // Show upgrade info
  p.fill(30, 25, 35, 220);
  p.rect(x - 60, y - 60, 120, 50);
  
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text(`Upgrade to Tier ${trap.tier + 1}`, x, y - 45);
  
  const cost = trap.getUpgradeCost();
  p.fill(255, 215, 0);
  p.text(`Cost: ${cost}g`, x, y - 30);
  
  p.fill(150, 150, 170);
  p.textSize(8);
  p.text("Space: Confirm | Z: Cancel", x, y - 15);
}

function renderPauseOverlay(p) {
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 35);
}

function renderGameOverScreen(p) {
  p.fill(20, 15, 25, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
    
    p.fill(150, 255, 150);
    p.textSize(18);
    p.text("You successfully defended the dungeon!", CANVAS_WIDTH / 2, 160);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("DEFEAT", CANVAS_WIDTH / 2, 100);
    
    p.fill(255, 150, 150);
    p.textSize(18);
    p.text("Too many adventurers reached the core.", CANVAS_WIDTH / 2, 160);
  }
  
  // Stats
  p.fill(200, 200, 220);
  p.textSize(14);
  p.text(`Waves Completed: ${gameState.currentWave}/${TOTAL_WAVES}`, CANVAS_WIDTH / 2, 210);
  p.text(`Enemies Killed: ${gameState.enemiesKilled}`, CANVAS_WIDTH / 2, 230);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 250);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}