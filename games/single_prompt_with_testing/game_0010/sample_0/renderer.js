// renderer.js - Rendering functions

import { gameState, GAME_PHASES, GRID_COLS, GRID_ROWS, CELL_SIZE, TILE_TYPES } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("RGB EXPRESS", p.width / 2, 80);
  
  // Description
  p.fill(200, 220, 255);
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text("Plan paths for color-coded delivery trucks", p.width / 2, 150);
  p.text("Pick up packages and deliver to matching houses", p.width / 2, 175);
  p.text("Avoid collisions with other trucks!", p.width / 2, 200);
  
  // Instructions
  p.fill(255, 255, 150);
  p.textSize(14);
  p.text("Arrow Keys: Move cursor", p.width / 2, 250);
  p.text("SPACE: Add path waypoint", p.width / 2, 275);
  p.text("Z: Select next truck", p.width / 2, 300);
  p.text("X: Clear current truck's path", p.width / 2, 325);
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textSize(24);
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100 * pulse, 255 * pulse, 100 * pulse);
  p.text("PRESS ENTER TO START", p.width / 2, p.height - 50);
}

export function renderGame(p) {
  p.background(40, 45, 50);
  
  // Draw grid
  renderGrid(p);
  
  // Draw level elements
  renderBridges(p);
  renderButtons(p);
  renderBarriers(p);
  renderSwapZones(p);
  
  // Draw houses (behind trucks)
  gameState.houses.forEach(house => house.render(p));
  
  // Draw packages
  gameState.packages.forEach(pkg => pkg.render(p));
  
  // Draw paths (if not simulating)
  if (!gameState.isSimulating) {
    gameState.trucks.forEach(truck => truck.renderPath(p));
  }
  
  // Draw trucks
  gameState.trucks.forEach(truck => truck.render(p));
  
  // Draw cursor (if not simulating)
  if (!gameState.isSimulating) {
    renderCursor(p);
  }
  
  // Draw UI
  renderUI(p);
}

function renderGrid(p) {
  p.stroke(60, 70, 80);
  p.strokeWeight(1);
  
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const tile = gameState.grid[y][x];
      const screenX = x * CELL_SIZE;
      const screenY = y * CELL_SIZE;
      
      if (tile.type === TILE_TYPES.WALL) {
        p.fill(80, 80, 90);
        p.rect(screenX, screenY, CELL_SIZE, CELL_SIZE);
      } else {
        p.fill(50, 55, 60);
        p.rect(screenX, screenY, CELL_SIZE, CELL_SIZE);
      }
    }
  }
}

function renderBridges(p) {
  gameState.bridges.forEach(bridge => {
    const screenX = bridge.x * CELL_SIZE;
    const screenY = bridge.y * CELL_SIZE;
    
    p.fill(100, 100, 120, 150);
    p.stroke(70, 70, 90);
    p.strokeWeight(2);
    
    if (bridge.horizontal) {
      p.rect(screenX + 5, screenY + 15, CELL_SIZE - 10, 20);
    } else {
      p.rect(screenX + 15, screenY + 5, 20, CELL_SIZE - 10);
    }
  });
}

function renderButtons(p) {
  gameState.buttons.forEach(button => {
    const screenX = button.x * CELL_SIZE + CELL_SIZE / 2;
    const screenY = button.y * CELL_SIZE + CELL_SIZE / 2;
    
    p.fill(button.pressed ? [255, 200, 50] : [150, 150, 150]);
    p.stroke(100, 100, 100);
    p.strokeWeight(2);
    p.circle(screenX, screenY, 20);
  });
}

function renderBarriers(p) {
  gameState.barriers.forEach(barrier => {
    if (!barrier.active) return;
    
    const screenX = barrier.x * CELL_SIZE;
    const screenY = barrier.y * CELL_SIZE;
    
    p.fill(200, 50, 50, 150);
    p.stroke(150, 0, 0);
    p.strokeWeight(3);
    p.rect(screenX + 5, screenY + 5, CELL_SIZE - 10, CELL_SIZE - 10);
    
    // X pattern
    p.line(screenX + 10, screenY + 10, screenX + CELL_SIZE - 10, screenY + CELL_SIZE - 10);
    p.line(screenX + 10, screenY + CELL_SIZE - 10, screenX + CELL_SIZE - 10, screenY + 10);
  });
}

function renderSwapZones(p) {
  gameState.swapZones.forEach(zone => {
    const screenX = zone.x * CELL_SIZE;
    const screenY = zone.y * CELL_SIZE;
    
    p.fill(150, 100, 200, 80);
    p.stroke(120, 70, 170);
    p.strokeWeight(2);
    p.rect(screenX + 5, screenY + 5, CELL_SIZE - 10, CELL_SIZE - 10);
  });
}

function renderCursor(p) {
  const screenX = gameState.cursorX * CELL_SIZE;
  const screenY = gameState.cursorY * CELL_SIZE;
  
  // Selected truck color
  const selectedTruck = gameState.trucks[gameState.selectedTruckIndex];
  if (selectedTruck) {
    const [r, g, b] = selectedTruck.getColorRGB();
    p.stroke(r, g, b);
    p.strokeWeight(4);
    p.noFill();
    p.rect(screenX + 2, screenY + 2, CELL_SIZE - 4, CELL_SIZE - 4);
  }
}

function renderUI(p) {
  // Top bar
  p.fill(30, 35, 40, 220);
  p.noStroke();
  p.rect(0, 0, p.width, 30);
  
  // Level info
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Level ${gameState.currentLevel}`, 10, 8);
  
  // Deliveries counter
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Delivered: ${gameState.deliveredPackages}/${gameState.totalPackages}`, p.width - 10, 8);
  
  // Selected truck indicator
  if (!gameState.isSimulating && gameState.trucks.length > 0) {
    const selectedTruck = gameState.trucks[gameState.selectedTruckIndex];
    if (selectedTruck) {
      const [r, g, b] = selectedTruck.getColorRGB();
      p.fill(r, g, b);
      p.textAlign(p.CENTER, p.TOP);
      p.text(`Planning: ${selectedTruck.color} Truck`, p.width / 2, 8);
    }
  }
  
  // Instructions during gameplay
  if (!gameState.isSimulating) {
    p.fill(200, 200, 200, 200);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(12);
    p.text("ENTER to execute paths | Z to switch truck | X to clear path", p.width / 2, p.height - 5);
  } else {
    p.fill(255, 200, 100);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(14);
    p.text("SIMULATING...", p.width / 2, p.height - 5);
  }
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, p.width, p.height);
  
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", p.width / 2, p.height / 2 - 30);
  
  p.fill(200);
  p.textSize(20);
  p.text("Press ESC to resume", p.width / 2, p.height / 2 + 20);
}

export function renderGameOver(p) {
  p.background(20, 25, 30);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  if (isWin) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(56);
    p.text("LEVEL COMPLETE!", p.width / 2, 100);
    
    p.fill(200, 220, 255);
    p.textSize(20);
    p.text("All packages delivered successfully!", p.width / 2, 160);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(56);
    p.text("COLLISION!", p.width / 2, 100);
    
    p.fill(255, 200, 150);
    p.textSize(20);
    p.text("Trucks crashed! Plan better paths.", p.width / 2, 160);
  }
  
  // Stats
  p.fill(255);
  p.textSize(18);
  p.text(`Level: ${gameState.currentLevel}`, p.width / 2, 220);
  p.text(`Deliveries: ${gameState.deliveredPackages}/${gameState.totalPackages}`, p.width / 2, 250);
  
  // Restart prompt
  p.fill(255, 255, 150);
  p.textSize(24);
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255 * pulse, 255 * pulse, 150 * pulse);
  p.text("PRESS R TO RESTART", p.width / 2, p.height - 60);
  
  if (isWin) {
    p.fill(100, 255, 100);
    p.textSize(20);
    p.text("PRESS ENTER FOR NEXT LEVEL", p.width / 2, p.height - 100);
  }
}