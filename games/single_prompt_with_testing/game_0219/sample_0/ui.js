// ui.js - UI rendering

import { gameState, GAME_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { canStartNextWave } from './waves.js';

// Render start screen
export function renderStartScreen(p) {
  p.background(15, 10, 30);
  
  // Animated background
  for (let i = 0; i < 50; i++) {
    const x = (i * 50 + gameState.frameCount * 0.5) % (CANVAS_WIDTH + 100);
    const y = (i * 30) % CANVAS_HEIGHT;
    p.fill(100, 50, 150, 30);
    p.noStroke();
    p.circle(x, y, 20);
  }
  
  // Title
  p.fill(255, 200, 50);
  p.stroke(150, 100, 0);
  p.strokeWeight(3);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('GEM DEFENSE', CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.fill(200, 150, 255);
  p.noStroke();
  p.textSize(18);
  p.text('Tower Defense', CANVAS_WIDTH / 2, 100);
  
  // Instructions
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    'Build towers and place magical gems to defend against monsters!',
    '',
    'Controls:',
    '  1/2/3 - Select gem type (Ruby/Sapphire/Emerald)',
    '  SPACE - Build tower / Place gem',
    '  SHIFT - Upgrade selected tower',
    '  Z - Sell selected tower',
    '  ENTER - Start next wave',
    '',
    'Gem Types:',
    '  Ruby (Red) - High damage',
    '  Sapphire (Blue) - Slows enemies',
    '  Emerald (Green) - Splash damage',
    '',
    'Combine gems of the same type to level them up!'
  ];
  
  let yPos = 140;
  for (const line of instructions) {
    p.text(line, 50, yPos);
    yPos += 20;
  }
  
  // Start prompt
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  const alpha = (Math.sin(gameState.frameCount * 0.1) + 1) * 127 + 128;
  p.fill(255, 255, 0, alpha);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

// Render game HUD
export function renderHUD(p) {
  // Top bar background
  p.fill(20, 15, 35, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Mana
  p.fill(100, 200, 255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(18);
  p.text(`💎 Mana: ${gameState.mana}`, 10, 15);
  
  // Lives
  p.fill(255, 100, 100);
  p.text(`❤ Lives: ${gameState.lives}`, 10, 35);
  
  // Score
  p.fill(255, 255, 100);
  p.text(`⭐ Score: ${gameState.score}`, 200, 15);
  
  // Wave info
  p.fill(200, 150, 255);
  p.text(`Wave: ${gameState.currentWave}/${gameState.totalWaves}`, 200, 35);
  
  // Monsters remaining
  if (gameState.waveActive) {
    p.fill(255, 150, 150);
    const remaining = gameState.monstersToSpawn - gameState.monstersSpawned + gameState.monsters.length;
    p.text(`Monsters: ${remaining}`, 380, 25);
  } else if (canStartNextWave()) {
    const alpha = (Math.sin(gameState.frameCount * 0.15) + 1) * 127 + 128;
    p.fill(100, 255, 100, alpha);
    p.textSize(16);
    p.text('PRESS ENTER FOR NEXT WAVE', 350, 25);
  }
  
  // Selected gem type indicator
  if (gameState.buildMode) {
    p.fill(255);
    p.textSize(14);
    p.text(`Building: ${gameState.selectedGemType}`, 450, 15);
    
    const gemColor = GAME_CONFIG.GEM_TYPES[gameState.selectedGemType].color;
    p.fill(gemColor[0], gemColor[1], gemColor[2]);
    p.circle(560, 15, 12);
  }
  
  // Build costs
  p.fill(180);
  p.textSize(11);
  p.text(`Tower: ${GAME_CONFIG.TOWER_COST}`, 450, 35);
  p.text(`Gem: ${GAME_CONFIG.GEM_BASE_COST}`, 520, 35);
}

// Render selected tower info
export function renderTowerInfo(p) {
  if (!gameState.selectedTower) return;
  
  const tower = gameState.selectedTower;
  const x = 10;
  const y = CANVAS_HEIGHT - 120;
  const w = 180;
  const h = 110;
  
  // Background
  p.fill(30, 25, 45, 230);
  p.stroke(100, 80, 150);
  p.strokeWeight(2);
  p.rect(x, y, w, h, 5);
  
  // Tower info
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text('Selected Tower', x + 10, y + 10);
  
  p.textSize(12);
  p.fill(200);
  p.text(`Level: ${tower.level}`, x + 10, y + 30);
  
  if (tower.gem) {
    p.fill(tower.gem.color[0], tower.gem.color[1], tower.gem.color[2]);
    p.text(`Gem: ${tower.gem.type} T${tower.gem.tier}`, x + 10, y + 48);
    
    p.fill(200);
    p.text(`Damage: ${Math.floor(tower.damage)}`, x + 10, y + 66);
    p.text(`Range: ${Math.floor(tower.range)}`, x + 10, y + 82);
  } else {
    p.fill(150);
    p.text('No gem placed', x + 10, y + 48);
  }
  
  // Sell value
  p.fill(255, 200, 0);
  p.text(`Sell: ${tower.getSellValue()} mana`, x + 10, y + h - 22);
}

// Render paused overlay
export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(20);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

// Render game over screen
export function renderGameOver(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(isWin ? 100 : 255, isWin ? 255 : 100, 50);
  p.stroke(isWin ? 50 : 150, isWin ? 150 : 50, 0);
  p.strokeWeight(3);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.text(isWin ? 'VICTORY!' : 'DEFEATED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  
  // Message
  p.fill(255);
  p.noStroke();
  p.textSize(20);
  if (isWin) {
    p.text('You have defended the realm!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  } else {
    p.text('The monsters have breached your defenses...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  }
  
  // Stats
  p.textSize(18);
  p.fill(255, 255, 100);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text(`Waves Completed: ${gameState.currentWave}/${gameState.totalWaves}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
  
  // Restart prompt
  p.fill(255, 255, 255);
  p.textSize(24);
  const alpha = (Math.sin(gameState.frameCount * 0.1) + 1) * 127 + 128;
  p.fill(255, 255, 255, alpha);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
}

// Render path
export function renderPath(p) {
  // Path background
  p.noFill();
  p.stroke(80, 60, 100);
  p.strokeWeight(45);
  
  p.beginShape();
  for (const point of gameState.pathPoints) {
    p.vertex(point.x, point.y);
  }
  p.endShape();
  
  // Path center line
  p.stroke(60, 40, 80);
  p.strokeWeight(35);
  
  p.beginShape();
  for (const point of gameState.pathPoints) {
    p.vertex(point.x, point.y);
  }
  p.endShape();
  
  // Path markers
  p.stroke(100, 80, 120, 100);
  p.strokeWeight(2);
  
  for (let i = 0; i < gameState.pathPoints.length; i += 10) {
    const point = gameState.pathPoints[i];
    p.line(point.x, point.y - 15, point.x, point.y + 15);
  }
}

// Render build grid
export function renderBuildGrid(p) {
  if (!gameState.buildMode) return;
  
  p.stroke(100, 100, 150, 50);
  p.strokeWeight(1);
  p.noFill();
  
  for (let i = 0; i < gameState.towerGrid.length; i++) {
    for (let j = 0; j < gameState.towerGrid[0].length; j++) {
      const x = i * gameState.gridSize;
      const y = j * gameState.gridSize;
      
      // Check if valid build location
      const centerX = x + gameState.gridSize / 2;
      const centerY = y + gameState.gridSize / 2;
      const onPath = isOnPath(centerX, centerY);
      const occupied = gameState.towerGrid[i][j] !== null;
      
      if (onPath) {
        p.fill(255, 0, 0, 30);
      } else if (occupied) {
        p.fill(255, 255, 0, 30);
      } else {
        p.fill(0, 255, 0, 30);
      }
      
      p.rect(x, y, gameState.gridSize, gameState.gridSize);
    }
  }
}

// Helper to check if on path
function isOnPath(x, y) {
  const pathWidth = 40;
  
  for (const point of gameState.pathPoints) {
    const dist = Math.sqrt(
      Math.pow(x - point.x, 2) + 
      Math.pow(y - point.y, 2)
    );
    
    if (dist < pathWidth) {
      return true;
    }
  }
  
  return false;
}