// rendering.js - All rendering functions

import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, CELL_SIZE, ABILITIES, gameState } from './globals.js';
import { getShipAtPosition } from './shipPlacement.js';

export function renderStartScreen(p) {
  p.background(10, 30, 60);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text('FLOTTENMANÖVER', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 220, 255);
  p.textSize(18);
  p.textStyle(p.NORMAL);
  p.text('Naval Combat Simulator', CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    'OBJECTIVE: Sink all 5 enemy ships before they sink yours',
    '',
    'CONTROLS:',
    '  Arrow Keys / WASD: Navigate targeting cursor',
    '  SPACE: Fire at selected target',
    '  Z: Cycle through commander abilities',
    '  SHIFT: Activate selected ability',
    '',
    'COMMANDER ABILITIES:',
    '  Salvo (2 resources): Fire 3 shots in a line',
    '  Sonar Ping (3 resources): Reveal 3x3 area',
    '  Emergency Repair (2 resources): Repair damaged ship',
    '',
    'Resources regenerate 1 per turn'
  ];
  
  let y = 160;
  for (let line of instructions) {
    p.text(line, 50, y);
    y += 18;
  }
  
  // Start prompt
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 0, 255 * pulse);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderGame(p) {
  p.background(20, 40, 80);
  
  // Calculate grid positions
  const playerGridX = 50;
  const aiGridX = 350;
  const gridY = 80;
  
  // Draw grids
  drawGrid(p, playerGridX, gridY, 'YOUR FLEET', true);
  drawGrid(p, aiGridX, gridY, 'ENEMY WATERS', false);
  
  // Draw ships on player grid
  drawShips(p, playerGridX, gridY, gameState.playerShips, true);
  
  // Draw ships on AI grid (only if sunk or revealed)
  drawShips(p, aiGridX, gridY, gameState.aiShips, false);
  
  // Draw hit/miss markers
  drawMarkers(p, playerGridX, gridY, gameState.playerGrid);
  drawMarkers(p, aiGridX, gridY, gameState.aiGrid);
  
  // Draw cursor on AI grid (player turn only)
  if (gameState.isPlayerTurn) {
    drawCursor(p, aiGridX, gridY);
  }
  
  // Draw effects
  for (let effect of gameState.effects) {
    effect.render(p, aiGridX, gridY);
  }
  
  // Draw UI
  drawUI(p);
}

function drawGrid(p, x, y, label, isPlayerGrid) {
  // Label
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text(label, x + GRID_SIZE * CELL_SIZE / 2, y - 20);
  
  // Grid lines
  p.stroke(100, 150, 200);
  p.strokeWeight(1);
  p.noFill();
  
  for (let i = 0; i <= GRID_SIZE; i++) {
    p.line(x + i * CELL_SIZE, y, x + i * CELL_SIZE, y + GRID_SIZE * CELL_SIZE);
    p.line(x, y + i * CELL_SIZE, x + GRID_SIZE * CELL_SIZE, y + i * CELL_SIZE);
  }
  
  // Coordinates
  p.fill(150, 180, 220);
  p.noStroke();
  p.textSize(10);
  
  for (let i = 0; i < GRID_SIZE; i++) {
    // Column labels (letters)
    p.text(String.fromCharCode(65 + i), x + i * CELL_SIZE + CELL_SIZE / 2, y - 8);
    // Row labels (numbers)
    p.text(i, x - 10, y + i * CELL_SIZE + CELL_SIZE / 2);
  }
}

function drawShips(p, offsetX, offsetY, ships, showAll) {
  for (let ship of ships) {
    for (let pos of ship.positions) {
      // Only show ships if: it's player grid (showAll), ship is sunk, or cell is revealed
      const shouldShow = showAll || ship.sunk || gameState.aiGrid.cells[pos.y][pos.x].revealed;
      
      if (shouldShow) {
        p.fill(ship.color[0], ship.color[1], ship.color[2], ship.sunk ? 100 : 200);
        p.noStroke();
        p.rect(offsetX + pos.x * CELL_SIZE + 2, 
               offsetY + pos.y * CELL_SIZE + 2, 
               CELL_SIZE - 4, CELL_SIZE - 4, 3);
      }
    }
  }
}

function drawMarkers(p, offsetX, offsetY, grid) {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = grid.cells[y][x];
      
      if (cell.hit) {
        // Red X for hits
        p.stroke(255, 0, 0);
        p.strokeWeight(3);
        const cx = offsetX + x * CELL_SIZE + CELL_SIZE / 2;
        const cy = offsetY + y * CELL_SIZE + CELL_SIZE / 2;
        const size = 8;
        p.line(cx - size, cy - size, cx + size, cy + size);
        p.line(cx - size, cy + size, cx + size, cy - size);
      } else if (cell.miss) {
        // Blue dot for misses
        p.fill(100, 150, 255);
        p.noStroke();
        p.circle(offsetX + x * CELL_SIZE + CELL_SIZE / 2, 
                offsetY + y * CELL_SIZE + CELL_SIZE / 2, 8);
      }
      
      if (cell.revealed && !cell.hit) {
        // Green tint for revealed cells
        p.fill(0, 255, 0, 30);
        p.noStroke();
        p.rect(offsetX + x * CELL_SIZE, offsetY + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }
}

function drawCursor(p, offsetX, offsetY) {
  const x = gameState.cursorX;
  const y = gameState.cursorY;
  
  p.stroke(255, 255, 0);
  p.strokeWeight(3);
  p.noFill();
  p.rect(offsetX + x * CELL_SIZE, offsetY + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

function drawUI(p) {
  // Top bar
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 60);
  
  // Score
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, 10, 10);
  p.text(`Turn: ${gameState.turnNumber}`, 10, 32);
  
  // Resources
  p.text(`Resources: ${gameState.playerResources}`, 150, 10);
  
  // Turn indicator
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  if (gameState.isPlayerTurn) {
    p.fill(0, 255, 0);
    p.text('YOUR TURN', CANVAS_WIDTH / 2, 15);
  } else {
    p.fill(255, 100, 100);
    p.text('ENEMY TURN', CANVAS_WIDTH / 2, 15);
  }
  
  // Abilities
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  let abilityY = 10;
  let abilityIndex = 0;
  
  for (let key in ABILITIES) {
    const ability = ABILITIES[key];
    const canUse = gameState.playerResources >= ability.cost && 
                   gameState.abilityCooldowns[key] === 0;
    
    const isSelected = gameState.selectedAbility === key;
    
    p.fill(isSelected ? [255, 255, 0] : (canUse ? [0, 255, 0] : [150, 150, 150]));
    p.text(`[Z${abilityIndex + 1}] ${ability.name} (${ability.cost})`, 300, abilityY);
    
    if (gameState.abilityCooldowns[key] > 0) {
      p.fill(255, 100, 100);
      p.text(`CD: ${gameState.abilityCooldowns[key]}`, 460, abilityY);
    }
    
    abilityY += 15;
    abilityIndex++;
  }
  
  // Ship status
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(10);
  p.fill(200);
  
  let playerShipsAlive = gameState.playerShips.filter(s => !s.sunk).length;
  let aiShipsAlive = gameState.aiShips.filter(s => !s.sunk).length;
  
  p.text(`Your Ships: ${playerShipsAlive}/5`, 50, 360);
  p.text(`Enemy Ships: ${aiShipsAlive}/5`, 350, 360);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.fill(255);
  p.textSize(18);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

export function renderGameOver(p) {
  p.background(10, 20, 40);
  
  const won = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(won ? [0, 255, 0] : [255, 50, 50]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(60);
  p.textStyle(p.BOLD);
  p.text(won ? 'VICTORY!' : 'DEFEAT', CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.fill(255);
  p.textSize(24);
  p.textStyle(p.NORMAL);
  
  if (won) {
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
    p.text(`Turns Taken: ${gameState.turnNumber}`, CANVAS_WIDTH / 2, 220);
    
    const playerShipsLost = gameState.playerShips.filter(s => s.sunk).length;
    p.text(`Ships Lost: ${playerShipsLost}/5`, CANVAS_WIDTH / 2, 260);
  } else {
    p.text('All your ships have been sunk', CANVAS_WIDTH / 2, 180);
    p.text(`Turns Survived: ${gameState.turnNumber}`, CANVAS_WIDTH / 2, 220);
  }
  
  // Restart prompt
  p.fill(255, 255, 0);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 0, 255 * pulse);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
}