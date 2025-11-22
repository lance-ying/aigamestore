// render.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CELL_WIDTH, CELL_HEIGHT, GRID_ROWS, GRID_COLS, GAME_PHASES, PLANT_TYPES, PLANT_COSTS, LEVEL_CONFIG } from './globals.js';

export function renderGame(p) {
  // Clear background
  p.background(120, 170, 80);
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderPlayingScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderPlayingScreen(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.background(40, 80, 40);
  
  // Title
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("GRID GARDEN", CANVAS_WIDTH / 2, 80);
  p.text("DEFENDERS", CANVAS_WIDTH / 2, 130);
  
  // Description
  p.fill(255);
  p.textSize(14);
  p.text("Defend your garden from waves of zombies!", CANVAS_WIDTH / 2, 180);
  p.text("Plant Sunflowers for resources, Peashooters to attack,", CANVAS_WIDTH / 2, 200);
  p.text("and Wall-nuts for defense.", CANVAS_WIDTH / 2, 220);
  
  // Instructions
  p.fill(200, 255, 200);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const startY = 250;
  p.text("CONTROLS:", 50, startY);
  p.text("1, 2, 3: Select plant (Sunflower, Peashooter, Wall-nut)", 50, startY + 20);
  p.text("Arrow Keys: Move cursor", 50, startY + 40);
  p.text("SPACE: Place selected plant", 50, startY + 60);
  p.text("Z: Use Plant Food (boosts plant)", 50, startY + 80);
  p.text("ESC: Pause    R: Restart", 50, startY + 100);
  
  // High score
  if (gameState.highScore > 0) {
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 370);
  }
  
  // Start prompt
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const alpha = p.map(p.sin(p.frameCount * 0.1), -1, 1, 150, 255);
  p.fill(255, 255, 255, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

function renderPlayingScreen(p) {
  // Draw grid
  renderGrid(p);
  
  // Draw entities
  for (let sunDrop of gameState.sunDrops) {
    if (sunDrop.active) sunDrop.render(p);
  }
  
  for (let plant of gameState.plants) {
    if (plant.active) plant.render(p);
  }
  
  for (let projectile of gameState.projectiles) {
    if (projectile.active) projectile.render(p);
  }
  
  for (let zombie of gameState.zombies) {
    if (zombie.active) zombie.render(p);
  }
  
  // Draw cursor
  renderCursor(p);
  
  // Draw UI
  renderUI(p);
}

function renderGrid(p) {
  p.stroke(80, 140, 60);
  p.strokeWeight(2);
  
  // Horizontal lines
  for (let i = 0; i <= GRID_ROWS; i++) {
    p.line(0, i * CELL_HEIGHT, CANVAS_WIDTH, i * CELL_HEIGHT);
  }
  
  // Vertical lines
  for (let i = 0; i <= GRID_COLS; i++) {
    p.line(i * CELL_WIDTH, 0, i * CELL_WIDTH, CANVAS_HEIGHT);
  }
  
  // Danger zone (leftmost column)
  p.fill(200, 100, 100, 30);
  p.noStroke();
  p.rect(0, 0, CELL_WIDTH, CANVAS_HEIGHT);
}

function renderCursor(p) {
  if (!gameState.selectedPlantType) return;
  
  const x = gameState.cursorCol * CELL_WIDTH + CELL_WIDTH / 2;
  const y = gameState.cursorRow * CELL_HEIGHT + CELL_HEIGHT / 2;
  
  // Cursor highlight
  p.fill(255, 255, 255, 100);
  p.noStroke();
  p.rect(gameState.cursorCol * CELL_WIDTH, gameState.cursorRow * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
  
  // Ghost plant preview
  const cost = PLANT_COSTS[gameState.selectedPlantType];
  const cooldown = gameState.plantCooldowns[gameState.selectedPlantType] || 0;
  const canPlace = gameState.sun >= cost && cooldown <= 0;
  
  p.push();
  p.translate(x, y);
  p.scale(0.7);
  
  if (canPlace) {
    p.tint(255, 255, 255, 150);
  } else {
    p.tint(255, 100, 100, 150);
  }
  
  // Draw plant preview
  if (gameState.selectedPlantType === PLANT_TYPES.SUNFLOWER) {
    p.fill(255, 220, 0, 150);
    p.noStroke();
    p.circle(0, 0, 50);
  } else if (gameState.selectedPlantType === PLANT_TYPES.PEASHOOTER) {
    p.fill(100, 200, 100, 150);
    p.noStroke();
    p.circle(0, 0, 50);
  } else if (gameState.selectedPlantType === PLANT_TYPES.WALLNUT) {
    p.fill(139, 90, 43, 150);
    p.noStroke();
    p.rect(-30, -30, 60, 60, 5);
  }
  
  p.pop();
}

function renderUI(p) {
  // Top bar background
  p.fill(40, 60, 30, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Sun counter
  p.fill(255, 220, 0);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(20);
  p.text(`☀ ${gameState.sun}`, 10, 25);
  
  // Plant Food
  p.fill(255, 150, 255);
  p.textSize(16);
  p.text(`PF: ${gameState.plantFood}`, 120, 25);
  
  // Score
  p.fill(255);
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 15);
  
  // Level and Wave
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(14);
  p.text(`Level ${gameState.currentLevel} - Wave ${gameState.currentWave + 1}`, CANVAS_WIDTH - 10, 35);
  
  // Plant selection cards
  const levelConfig = LEVEL_CONFIG[gameState.currentLevel - 1];
  const availablePlants = levelConfig.availablePlants;
  
  let cardX = 200;
  for (let i = 0; i < availablePlants.length; i++) {
    const plantType = availablePlants[i];
    const cost = PLANT_COSTS[plantType];
    const cooldown = gameState.plantCooldowns[plantType] || 0;
    const selected = gameState.selectedPlantType === plantType;
    
    // Card background
    if (selected) {
      p.fill(100, 200, 100, 200);
    } else if (gameState.sun >= cost && cooldown <= 0) {
      p.fill(60, 100, 60, 200);
    } else {
      p.fill(60, 60, 60, 200);
    }
    p.stroke(selected ? 200 : 100);
    p.strokeWeight(2);
    p.rect(cardX, 5, 50, 40, 3);
    
    // Plant icon
    p.push();
    p.translate(cardX + 25, 20);
    p.scale(0.4);
    p.noStroke();
    
    if (plantType === PLANT_TYPES.SUNFLOWER) {
      p.fill(255, 220, 0);
      p.circle(0, 0, 40);
    } else if (plantType === PLANT_TYPES.PEASHOOTER) {
      p.fill(100, 200, 100);
      p.circle(0, 0, 40);
    } else if (plantType === PLANT_TYPES.WALLNUT) {
      p.fill(139, 90, 43);
      p.rect(-20, -20, 40, 40, 3);
    }
    p.pop();
    
    // Cost
    p.fill(255, 220, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(cost, cardX + 25, 38);
    
    // Cooldown overlay
    if (cooldown > 0) {
      p.fill(0, 0, 0, 150);
      p.noStroke();
      const cooldownHeight = 40 * (cooldown / PLANT_COOLDOWNS[plantType]);
      p.rect(cardX, 5 + (40 - cooldownHeight), 50, cooldownHeight, 0, 0, 3, 3);
    }
    
    // Number key indicator
    p.fill(255);
    p.textSize(10);
    p.text(i + 1, cardX + 5, 12);
    
    cardX += 60;
  }
  
  // Wave message
  if (gameState.waveDelay > 0 && gameState.waveDelay < 8) {
    p.fill(255, 100, 100, p.map(gameState.waveDelay, 8, 0, 0, 255));
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text(`WAVE ${gameState.currentWave + 1}!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
  
  // Level complete message
  if (gameState.levelComplete) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    p.textSize(20);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    if (gameState.currentLevel < 5) {
      const alpha = p.map(p.sin(p.frameCount * 0.1), -1, 1, 150, 255);
      p.fill(255, 255, 255, alpha);
      p.text("Next level starting...", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    }
  }
}

function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.textSize(20);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

function renderGameOverScreen(p) {
  p.background(40, 40, 60);
  
  p.fill(gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ? 100 : 255, 
         gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ? 255 : 100, 
         100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.text("YOU WIN!", CANVAS_WIDTH / 2, 120);
    p.fill(255);
    p.textSize(24);
    p.text("All levels completed!", CANVAS_WIDTH / 2, 180);
  } else {
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
    p.fill(255);
    p.textSize(24);
    p.text("Zombies reached your house!", CANVAS_WIDTH / 2, 180);
  }
  
  // Final score
  p.fill(255, 255, 100);
  p.textSize(32);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 240);
  
  // High score
  if (gameState.score > gameState.highScore) {
    p.fill(255, 200, 100);
    p.textSize(20);
    p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 280);
  } else if (gameState.highScore > 0) {
    p.fill(200);
    p.textSize(18);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 280);
  }
  
  // Restart prompt
  p.fill(255);
  p.textSize(20);
  const alpha = p.map(p.sin(p.frameCount * 0.1), -1, 1, 150, 255);
  p.fill(255, 255, 255, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}