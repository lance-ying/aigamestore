// rendering.js - Rendering functions

import { gameState, PHASE, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, OFFSET_X, OFFSET_Y, GRID_COLS, GRID_ROWS, ENTITY_TYPE } from './globals.js';

export function renderGame(p) {
  p.background(20, 25, 35);

  if (gameState.gamePhase === PHASE.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === PHASE.PLAYING || gameState.gamePhase === PHASE.PAUSED) {
    renderGameplay(p);
    if (gameState.gamePhase === PHASE.PAUSED) {
      renderPausedIndicator(p);
    }
  } else if (gameState.gamePhase === PHASE.GAME_OVER_WIN || gameState.gamePhase === PHASE.GAME_OVER_LOSE) {
    renderGameplay(p);
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  // Title
  p.fill(255, 200, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(42);
  p.text("DEUS EX GO", CANVAS_WIDTH / 2, 80);
  
  // Subtitle with augmentation style
  p.fill(200, 180, 100);
  p.textSize(16);
  p.text("STEALTH TACTICS GRID", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(180, 180, 200);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  const desc = [
    "Navigate Adam Jensen through enemy territory",
    "to reach the exit. Every move triggers",
    "enemy movement. Use stealth and tactics!"
  ];
  desc.forEach((line, i) => {
    p.text(line, CANVAS_WIDTH / 2, 160 + i * 20);
  });

  // Instructions
  p.fill(200, 200, 220);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "ARROW KEYS - Move one grid space",
    "SPACE - Invisibility augmentation (1 turn)",
    "Z - Hack adjacent terminal",
    "SHIFT - Wait (skip turn)",
    "",
    "Avoid enemy line-of-sight!",
    "Hack terminals to disable turrets."
  ];
  instructions.forEach((line, i) => {
    p.text(line, 100, 240 + i * 16);
  });

  // Start prompt
  p.fill(255, 200, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const pulse = 200 + Math.sin(p.frameCount * 0.1) * 55;
  p.fill(pulse, pulse * 0.8, 0);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

function renderGameplay(p) {
  // Render grid background
  renderGrid(p);
  
  // Render entities (order matters for layering)
  renderEntities(p);
  
  // Render invisibility effect on player
  if (gameState.isInvisible && gameState.player) {
    renderInvisibilityEffect(p);
  }
  
  // Render UI
  renderUI(p);
}

function renderGrid(p) {
  // Draw grid cells
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const screenX = OFFSET_X + x * GRID_SIZE;
      const screenY = OFFSET_Y + y * GRID_SIZE;
      
      if (gameState.grid[y][x] === 1) {
        // Wall
        p.fill(40, 50, 70);
        p.stroke(30, 40, 60);
        p.strokeWeight(1);
        p.rect(screenX, screenY, GRID_SIZE, GRID_SIZE);
      } else {
        // Floor
        const shade = ((x + y) % 2) === 0 ? 30 : 25;
        p.fill(shade, shade + 5, shade + 10);
        p.noStroke();
        p.rect(screenX, screenY, GRID_SIZE, GRID_SIZE);
        
        // Grid lines
        p.stroke(40, 45, 55, 100);
        p.strokeWeight(1);
        p.noFill();
        p.rect(screenX, screenY, GRID_SIZE, GRID_SIZE);
      }
    }
  }
}

function renderEntities(p) {
  // Sort entities by type for proper rendering order
  const sorted = [...gameState.entities].sort((a, b) => {
    const order = {
      [ENTITY_TYPE.EXIT]: 0,
      [ENTITY_TYPE.TERMINAL]: 1,
      [ENTITY_TYPE.TURRET]: 2,
      [ENTITY_TYPE.DRONE]: 3,
      [ENTITY_TYPE.GUARD]: 4,
      [ENTITY_TYPE.PLAYER]: 5
    };
    return (order[a.type] || 0) - (order[b.type] || 0);
  });

  sorted.forEach(entity => {
    if (!entity.removed) {
      // Update entity if it has update method
      if (entity.update) {
        entity.update(p.frameCount);
      }
      entity.render(p);
    }
  });
}

function renderInvisibilityEffect(p) {
  const x = gameState.player.getScreenX();
  const y = gameState.player.getScreenY();
  
  p.push();
  p.noFill();
  p.stroke(100, 200, 255, 150);
  p.strokeWeight(2);
  const size = GRID_SIZE * (0.8 + Math.sin(p.frameCount * 0.2) * 0.2);
  p.circle(x, y, size);
  p.pop();
}

function renderUI(p) {
  // Dark overlay for UI
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 25);
  p.rect(0, CANVAS_HEIGHT - 25, CANVAS_WIDTH, 25);
  
  // Top UI
  p.fill(255, 200, 0);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`LEVEL ${gameState.level}`, 10, 12);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`TURN: ${gameState.turnCount}`, CANVAS_WIDTH / 2, 12);
  
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 12);
  
  // Bottom UI - Augmentations
  p.fill(180, 180, 200);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  p.text(`INVISIBILITY: ${gameState.invisibilityCharges}`, 10, CANVAS_HEIGHT - 12);
  
  if (gameState.isInvisible) {
    p.fill(100, 200, 255);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`[INVISIBLE: ${gameState.invisibilityTurnsLeft} TURN]`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 12);
  }
}

function renderPausedIndicator(p) {
  p.fill(255, 200, 0);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 30);
}

function renderGameOverScreen(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Result message
  const isWin = gameState.gamePhase === PHASE.GAME_OVER_WIN;
  p.fill(isWin ? 100 : 255, isWin ? 255 : 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "MISSION COMPLETE" : "DETECTED", CANVAS_WIDTH / 2, 120);
  
  // Details
  p.fill(200, 200, 220);
  p.textSize(20);
  if (isWin) {
    p.text(`Completed in ${gameState.turnCount} turns`, CANVAS_WIDTH / 2, 180);
  } else {
    p.text("Mission Failed", CANVAS_WIDTH / 2, 180);
  }
  
  p.textSize(24);
  p.fill(255, 200, 0);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  // Restart prompt
  p.fill(180, 180, 200);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 280);
}