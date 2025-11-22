// renderer.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, GRID_COLS, GRID_ROWS, BUILDING_COLORS } from './globals.js';

export function renderGame(p) {
  // Clear background once
  p.background(40, 45, 50);
  
  if (gameState.gamePhase === 'START') {
    renderStartScreen(p);
  } else if (gameState.gamePhase === 'PLAYING' || gameState.gamePhase === 'PAUSED') {
    renderPlayingScreen(p);
    if (gameState.gamePhase === 'PAUSED') {
      renderPauseOverlay(p);
    }
  } else if (gameState.gamePhase.startsWith('GAME_OVER')) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.push();
  
  // Title
  p.fill(100, 200, 255);
  p.textSize(36);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('MINDUSTRY LITE', CANVAS_WIDTH / 2, 60);
  
  // Description
  p.fill(200);
  p.textSize(14);
  p.text('Build a factory to extract and process resources.', CANVAS_WIDTH / 2, 120);
  p.text('Defend your core from 10 increasingly difficult waves!', CANVAS_WIDTH / 2, 140);
  
  // Instructions
  p.fill(220, 220, 150);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    'CONTROLS:',
    'Arrow Keys - Move camera',
    'SHIFT - Cycle building type',
    'SPACE - Place selected building',
    'Z - Delete building',
    '',
    'BUILDINGS:',
    'Drill - Extract resources (10 Copper)',
    'Conveyor - Transport resources (2 Copper)',
    'Factory - Produce Steel (30 Cu, 20 Fe)',
    'Turret - Defend (40 Cu, 30 Fe)',
    'Unit Factory - Build units (50 Cu, 40 Fe, 20 Ti)'
  ];
  
  let y = 180;
  for (const line of instructions) {
    p.text(line, 100, y);
    y += 16;
  }
  
  // Start prompt
  p.fill(150, 255, 150);
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 360);
  
  p.pop();
}

function renderPlayingScreen(p) {
  const camera = gameState.camera;
  
  // Draw grid and resources
  p.push();
  p.stroke(60, 65, 70);
  p.strokeWeight(1);
  
  for (let x = 0; x < GRID_COLS; x++) {
    for (let y = 0; y < GRID_ROWS; y++) {
      const screenX = x * GRID_SIZE - camera.x;
      const screenY = y * GRID_SIZE - camera.y;
      
      // Only draw visible tiles
      if (screenX > -GRID_SIZE && screenX < CANVAS_WIDTH &&
          screenY > -GRID_SIZE && screenY < CANVAS_HEIGHT) {
        
        // Check for resource
        const mapKey = `${x},${y}`;
        if (gameState.resourceMap && gameState.resourceMap[mapKey]) {
          const resource = gameState.resourceMap[mapKey];
          if (resource === 'COPPER') p.fill(180, 120, 60);
          else if (resource === 'IRON') p.fill(140, 140, 140);
          else if (resource === 'TITANIUM') p.fill(180, 180, 220);
          p.noStroke();
          p.rect(screenX + 2, screenY + 2, GRID_SIZE - 4, GRID_SIZE - 4);
          p.stroke(60, 65, 70);
        }
        
        p.noFill();
        p.rect(screenX, screenY, GRID_SIZE, GRID_SIZE);
      }
    }
  }
  p.pop();
  
  // Draw buildings
  for (const building of gameState.buildings) {
    building.render(p, camera);
  }
  
  // Draw enemies
  for (const enemy of gameState.enemies) {
    enemy.render(p, camera);
  }
  
  // Draw projectiles
  for (const projectile of gameState.projectiles) {
    projectile.render(p, camera);
  }
  
  // Draw units
  for (const unit of gameState.units) {
    unit.render(p, camera);
  }
  
  // Draw cursor
  const cursorScreenX = gameState.cursor.gridX * GRID_SIZE - camera.x;
  const cursorScreenY = gameState.cursor.gridY * GRID_SIZE - camera.y;
  p.push();
  p.noFill();
  p.stroke(150, 255, 150);
  p.strokeWeight(2);
  p.rect(cursorScreenX, cursorScreenY, GRID_SIZE, GRID_SIZE);
  p.pop();
  
  // Draw UI
  renderUI(p);
}

function renderUI(p) {
  p.push();
  
  // Resource panel
  p.fill(30, 35, 40, 220);
  p.noStroke();
  p.rect(10, 10, 180, 90);
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Copper: ${Math.floor(gameState.resources.COPPER)}`, 20, 20);
  p.text(`Iron: ${Math.floor(gameState.resources.IRON)}`, 20, 36);
  p.text(`Titanium: ${Math.floor(gameState.resources.TITANIUM)}`, 20, 52);
  p.text(`Steel: ${Math.floor(gameState.resources.STEEL || 0)}`, 20, 68);
  
  // Wave info
  p.fill(30, 35, 40, 220);
  p.rect(200, 10, 180, 60);
  p.fill(255);
  p.text(`Wave: ${gameState.wave}/10`, 210, 20);
  p.text(`Next: ${Math.floor((gameState.nextWaveTime - gameState.waveTimer) / 60)}s`, 210, 36);
  p.text(`Enemies: ${gameState.enemies.length}`, 210, 52);
  
  // Core health
  p.fill(30, 35, 40, 220);
  p.rect(390, 10, 200, 40);
  p.fill(255);
  p.text(`Core Health: ${Math.floor(gameState.core ? gameState.core.health : 0)}/${gameState.core ? gameState.core.maxHealth : 0}`, 400, 20);
  
  // Score
  p.text(`Score: ${gameState.score}`, 400, 36);
  
  // Selected building
  p.fill(30, 35, 40, 220);
  p.rect(10, 340, 580, 50);
  p.fill(255);
  p.textSize(14);
  p.text(`Selected: ${gameState.selectedBuilding}`, 20, 350);
  p.textSize(11);
  p.text('SHIFT to cycle | SPACE to place | Z to delete', 20, 370);
  
  // Building preview
  const color = BUILDING_COLORS[gameState.selectedBuilding] || [100, 100, 100];
  p.fill(...color);
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(520, 350, 30, 30);
  
  p.pop();
}

function renderPauseOverlay(p) {
  p.push();
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.RIGHT, p.TOP);
  p.text('PAUSED', CANVAS_WIDTH - 10, 10);
  p.pop();
}

function renderGameOverScreen(p) {
  p.push();
  
  const isWin = gameState.gamePhase === 'GAME_OVER_WIN';
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(isWin ? 'VICTORY!' : 'DEFEAT', CANVAS_WIDTH / 2, 120);
  
  // Stats
  p.fill(255);
  p.textSize(18);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`Waves Survived: ${gameState.wave}`, CANVAS_WIDTH / 2, 210);
  p.text(`Buildings Placed: ${gameState.buildings.length}`, CANVAS_WIDTH / 2, 240);
  
  // Message
  p.textSize(16);
  if (isWin) {
    p.fill(150, 255, 150);
    p.text('You successfully defended your core!', CANVAS_WIDTH / 2, 280);
  } else {
    p.fill(255, 150, 150);
    p.text('Your core was destroyed...', CANVAS_WIDTH / 2, 280);
  }
  
  // Restart prompt
  p.fill(255, 255, 150);
  p.textSize(20);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 340);
  
  p.pop();
}

export function logPlayerInfo(p) {
  if (gameState.gamePhase === 'PLAYING' && p.frameCount % 30 === 0) {
    p.logs.player_info.push({
      screen_x: CANVAS_WIDTH / 2,
      screen_y: CANVAS_HEIGHT / 2,
      game_x: gameState.camera.x + CANVAS_WIDTH / 2,
      game_y: gameState.camera.y + CANVAS_HEIGHT / 2,
      framecount: p.frameCount
    });
  }
}