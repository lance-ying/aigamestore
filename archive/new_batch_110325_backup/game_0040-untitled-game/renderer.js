// renderer.js - Rendering functions

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GRID_SIZE, 
  GRID_COLS, 
  GRID_ROWS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  TRAP_DEFINITIONS
} from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("DUNGEON WARFARE", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 200, 200);
  p.textSize(14);
  p.text("Tower Defense", CANVAS_WIDTH / 2, 115);
  
  // Instructions
  p.fill(180, 180, 180);
  p.textSize(12);
  p.textAlign(p.CENTER, p.CENTER);
  
  const instructions = [
    "OBJECTIVE:",
    "Defend your dungeon by placing traps on the path.",
    "Eliminate enemies before 20 escape!",
    "",
    "CONTROLS:",
    "Arrow Keys: Move cursor",
    "Space: Open trap menu / Place trap",
    "Z: Upgrade trap (hover over trap)",
    "Shift: Sell trap (hover over trap)",
    "ESC: Pause",
    "",
    "STRATEGY:",
    "Earn gold from kills to buy and upgrade traps.",
    "Gain XP to unlock skill points for passive bonuses.",
    "Survive 5 waves to win!"
  ];
  
  let y = 160;
  for (const line of instructions) {
    if (line === "") {
      y += 10;
    } else if (line.endsWith(":")) {
      p.fill(255, 200, 100);
      p.textSize(12);
      p.text(line, CANVAS_WIDTH / 2, y);
      y += 18;
    } else {
      p.fill(180, 180, 180);
      p.textSize(11);
      p.text(line, CANVAS_WIDTH / 2, y);
      y += 16;
    }
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textSize(16);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

export function drawGame(p) {
  p.background(40, 35, 30);
  
  // Draw grid
  p.stroke(60, 55, 50);
  p.strokeWeight(1);
  for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Draw path
  p.noStroke();
  p.fill(80, 70, 60);
  for (const cell of gameState.path) {
    p.rect(cell.x * GRID_SIZE, cell.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
  }
  
  // Highlight path edges
  p.stroke(100, 90, 80);
  p.strokeWeight(2);
  p.noFill();
  const startCell = gameState.path[0];
  p.rect(startCell.x * GRID_SIZE, startCell.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
  p.fill(100, 255, 100, 100);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text("START", startCell.x * GRID_SIZE + GRID_SIZE / 2, startCell.y * GRID_SIZE + GRID_SIZE / 2);
  
  const endCell = gameState.path[gameState.path.length - 1];
  p.stroke(255, 100, 100);
  p.strokeWeight(2);
  p.noFill();
  p.rect(endCell.x * GRID_SIZE, endCell.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
  p.fill(255, 100, 100, 100);
  p.noStroke();
  p.text("EXIT", endCell.x * GRID_SIZE + GRID_SIZE / 2, endCell.y * GRID_SIZE + GRID_SIZE / 2);
  
  // Draw traps
  for (const trap of gameState.traps) {
    trap.draw(p);
  }
  
  // Draw enemies
  for (const enemy of gameState.enemies) {
    enemy.draw(p);
  }
  
  // Draw cursor
  if (!gameState.showTrapMenu) {
    const cursorX = gameState.cursor.x * GRID_SIZE;
    const cursorY = gameState.cursor.y * GRID_SIZE;
    p.noFill();
    p.stroke(255, 255, 100);
    p.strokeWeight(2);
    p.rect(cursorX, cursorY, GRID_SIZE, GRID_SIZE);
  }
  
  // Draw UI
  drawUI(p);
  
  // Draw trap menu
  if (gameState.showTrapMenu) {
    drawTrapMenu(p);
  }
  
  // Draw pause indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

export function drawUI(p) {
  const uiY = 5;
  const uiX = 10;
  
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 25);
  
  p.fill(255, 220, 100);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`Gold: ${gameState.gold}`, uiX, uiY);
  p.text(`Wave: ${gameState.wave}/${gameState.maxWaves}`, uiX + 100, uiY);
  p.text(`Escaped: ${gameState.enemiesEscaped}/${gameState.maxEscaped}`, uiX + 220, uiY);
  p.text(`Kills: ${gameState.enemiesKilled}`, uiX + 380, uiY);
  p.text(`Level: ${gameState.level}`, uiX + 480, uiY);
  
  // Wave timer
  if (!gameState.waveInProgress && gameState.wave < gameState.maxWaves) {
    const timeLeft = Math.ceil((gameState.waveDelay - gameState.waveTimer) / 60);
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(14);
    p.text(`Next wave in: ${timeLeft}s`, CANVAS_WIDTH / 2, 35);
  }
  
  // Skill points notification
  if (gameState.skillPoints > 0) {
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(10);
    p.text(`Skill Points: ${gameState.skillPoints} (auto-spent)`, CANVAS_WIDTH / 2, 55);
  }
}

export function drawTrapMenu(p) {
  const menuWidth = 250;
  const menuHeight = 280;
  const menuX = (CANVAS_WIDTH - menuWidth) / 2;
  const menuY = (CANVAS_HEIGHT - menuHeight) / 2;
  
  // Background
  p.fill(20, 20, 30, 240);
  p.stroke(255, 220, 100);
  p.strokeWeight(2);
  p.rect(menuX, menuY, menuWidth, menuHeight, 5);
  
  // Title
  p.fill(255, 220, 100);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text("SELECT TRAP", CANVAS_WIDTH / 2, menuY + 10);
  
  // Trap options
  const trapTypes = Object.keys(TRAP_DEFINITIONS);
  let yOffset = 45;
  
  for (let i = 0; i < trapTypes.length; i++) {
    const trapType = trapTypes[i];
    const def = TRAP_DEFINITIONS[trapType];
    const boxY = menuY + yOffset + i * 55;
    
    const canAfford = gameState.gold >= def.cost;
    
    // Trap box
    p.fill(...(canAfford ? [60, 60, 70] : [40, 40, 40]));
    p.stroke(...(canAfford ? [200, 200, 200] : [100, 100, 100]));
    p.strokeWeight(1);
    p.rect(menuX + 10, boxY, menuWidth - 20, 50, 3);
    
    // Trap color sample
    p.fill(...def.color);
    p.noStroke();
    p.rect(menuX + 20, boxY + 10, 30, 30, 2);
    
    // Trap info
    p.fill(...(canAfford ? [255, 255, 255] : [120, 120, 120]));
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text(def.name, menuX + 60, boxY + 5);
    
    p.textSize(10);
    p.text(`Cost: ${def.cost}g`, menuX + 60, boxY + 20);
    p.text(`Dmg: ${def.damage} Rng: ${def.range}`, menuX + 60, boxY + 33);
    
    // Number key
    p.fill(255, 220, 100);
    p.textAlign(p.RIGHT, p.CENTER);
    p.textSize(14);
    p.text(`[${i + 1}]`, menuX + menuWidth - 15, boxY + 25);
  }
  
  // Close instruction
  p.fill(180, 180, 180);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(11);
  p.text("Press 1-4 to select or Space to close", CANVAS_WIDTH / 2, menuY + menuHeight - 10);
}

export function drawGameOver(p) {
  p.background(20, 20, 30);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(isWin ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.fill(255, 255, 255);
  p.textSize(16);
  p.text(`Waves Completed: ${gameState.wave - (isWin ? 0 : 1)}/${gameState.maxWaves}`, CANVAS_WIDTH / 2, 160);
  p.text(`Enemies Killed: ${gameState.enemiesKilled}`, CANVAS_WIDTH / 2, 190);
  p.text(`Final Level: ${gameState.level}`, CANVAS_WIDTH / 2, 220);
  p.text(`Gold Earned: ${gameState.gold}`, CANVAS_WIDTH / 2, 250);
  
  // Message
  p.fill(200, 200, 200);
  p.textSize(14);
  if (isWin) {
    p.text("You successfully defended the dungeon!", CANVAS_WIDTH / 2, 290);
  } else {
    p.text("Too many enemies escaped...", CANVAS_WIDTH / 2, 290);
  }
  
  // Restart prompt
  p.fill(255, 220, 100);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}