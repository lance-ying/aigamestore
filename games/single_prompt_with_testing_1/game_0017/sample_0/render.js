// render.js - Rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, TILE_COLORS } from './globals.js';
import { cursorRow, cursorCol } from './input.js';

export function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text('ダンジョントレーサー', CANVAS_WIDTH / 2, 80);
  
  p.textSize(20);
  p.fill(200, 200, 220);
  p.text('DUNGEON TRACER', CANVAS_WIDTH / 2, 115);
  
  // Instructions
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.fill(180, 180, 200);
  
  const instructions = [
    'Match 3+ adjacent tiles to activate effects:',
    '  RED - Attack enemies',
    '  BLUE - Gain defense for next turn',
    '  GREEN - Heal HP',
    '  YELLOW - Restore mana',
    '',
    'Defeat enemies to level up and collect gold.',
    'Survive as long as possible!',
  ];
  
  let yPos = 160;
  for (const line of instructions) {
    p.text(line, 80, yPos);
    yPos += 20;
  }
  
  // Controls
  p.fill(220, 220, 255);
  p.text('CONTROLS:', 80, yPos + 10);
  p.fill(180, 180, 200);
  p.text('Arrow Keys - Navigate grid', 80, yPos + 30);
  p.text('Space - Select/Confirm tile', 80, yPos + 50);
  p.text('Shift - Cancel selection', 80, yPos + 70);
  p.text('Z - Open shop (between floors)', 80, yPos + 90);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderGameScreen(p) {
  p.background(30, 30, 50);
  
  // Render UI
  renderUI(p);
  
  // Render grid
  renderGrid(p);
  
  // Render enemies
  renderEnemies(p);
  
  // Render shop if open
  if (gameState.shopOpen) {
    renderShop(p);
  }
}

export function renderUI(p) {
  const player = gameState.player;
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  
  // Player stats
  p.text(`Floor: ${gameState.currentFloor}`, 10, 10);
  p.text(`Level: ${player.level}`, 10, 25);
  p.text(`HP: ${player.hp}/${player.maxHP}`, 10, 40);
  p.text(`Gold: ${player.gold}`, 10, 55);
  
  // HP Bar
  p.noFill();
  p.stroke(255);
  p.rect(70, 40, 100, 10);
  p.noStroke();
  p.fill(200, 50, 50);
  const hpPercent = player.hp / player.maxHP;
  p.rect(71, 41, 98 * hpPercent, 8);
  
  // Score
  p.fill(255, 220, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Defense indicator
  if (player.defensePercent > 0) {
    p.fill(100, 150, 255);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`DEF: ${Math.floor(player.defensePercent * 100)}%`, 180, 40);
  }
}

export function renderGrid(p) {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const tile = gameState.grid[row][col];
      if (!tile) continue;
      
      const x = GRID_OFFSET_X + col * TILE_SIZE;
      const y = GRID_OFFSET_Y + row * TILE_SIZE;
      
      // Tile background
      const color = TILE_COLORS[tile.type];
      p.fill(...color);
      p.stroke(0);
      p.strokeWeight(2);
      p.rect(x, y, TILE_SIZE - 4, TILE_SIZE - 4, 5);
      
      // Highlight if selected
      const isSelected = gameState.selectedTiles.some(
        t => t.row === row && t.col === col
      );
      if (isSelected) {
        p.noFill();
        p.stroke(255, 255, 100);
        p.strokeWeight(4);
        p.rect(x, y, TILE_SIZE - 4, TILE_SIZE - 4, 5);
      }
      
      // Cursor highlight
      if (row === cursorRow && col === cursorCol) {
        p.noFill();
        p.stroke(255);
        p.strokeWeight(3);
        p.rect(x - 2, y - 2, TILE_SIZE, TILE_SIZE, 5);
      }
    }
  }
}

export function renderEnemies(p) {
  const enemyWidth = 80;
  const enemyHeight = 60;
  const startX = 380;
  const startY = 100;
  
  for (let i = 0; i < gameState.enemies.length; i++) {
    const enemy = gameState.enemies[i];
    const x = startX;
    const y = startY + i * (enemyHeight + 20);
    
    // Enemy box
    p.fill(...enemy.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(x, y, enemyWidth, enemyHeight, 5);
    
    // Name
    p.fill(255);
    p.noStroke();
    p.textSize(10);
    p.textAlign(p.CENTER, p.TOP);
    p.text(enemy.name, x + enemyWidth / 2, y + 5);
    
    // HP bar
    p.fill(100);
    p.rect(x + 5, y + 20, enemyWidth - 10, 8);
    p.fill(200, 50, 50);
    const hpPercent = enemy.hp / enemy.maxHP;
    p.rect(x + 5, y + 20, (enemyWidth - 10) * hpPercent, 8);
    
    // HP text
    p.fill(255);
    p.textSize(9);
    p.text(`${enemy.hp}/${enemy.maxHP}`, x + enemyWidth / 2, y + 32);
    
    // Attack
    p.textSize(9);
    p.text(`ATK: ${enemy.attack}`, x + enemyWidth / 2, y + 45);
  }
}

export function renderShop(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Shop panel
  p.fill(40, 40, 60);
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(100, 80, 400, 280, 10);
  
  // Title
  p.fill(255, 220, 100);
  p.noStroke();
  p.textSize(20);
  p.textAlign(p.CENTER, p.TOP);
  p.text('SHOP', CANVAS_WIDTH / 2, 95);
  
  // Gold
  p.fill(200, 200, 220);
  p.textSize(14);
  p.text(`Gold: ${gameState.player.gold}`, CANVAS_WIDTH / 2, 120);
  
  // Items
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  let yPos = 150;
  
  for (let i = 0; i < gameState.shopItems.length; i++) {
    const item = gameState.shopItems[i];
    const canAfford = gameState.player.gold >= item.cost;
    
    p.fill(canAfford ? 200 : 100);
    p.text(`${item.name} - ${item.cost}g`, 120, yPos);
    p.text(`+${item.getBonus()} ${item.type === 'weapon' ? 'ATK' : 'DEF'}`, 300, yPos);
    
    yPos += 25;
  }
  
  // Instructions
  p.fill(180, 180, 200);
  p.textSize(11);
  p.textAlign(p.CENTER, p.TOP);
  p.text('Press Z to close shop', CANVAS_WIDTH / 2, 320);
  p.text('(Shop purchases not implemented in this control scheme)', CANVAS_WIDTH / 2, 335);
}

export function renderPausedScreen(p) {
  renderGameScreen(p);
  
  // Paused indicator
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text('PAUSED', CANVAS_WIDTH - 10, 10);
}

export function renderGameOverScreen(p) {
  p.background(20, 20, 30);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text(isWin ? 'VICTORY!' : 'GAME OVER', CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.fill(200, 200, 220);
  p.textSize(18);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 160);
  p.text(`Floor Reached: ${gameState.currentFloor}`, CANVAS_WIDTH / 2, 190);
  p.text(`Enemies Defeated: ${gameState.enemiesDefeated}`, CANVAS_WIDTH / 2, 220);
  p.text(`Gold Collected: ${gameState.totalGold}`, CANVAS_WIDTH / 2, 250);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 320);
}