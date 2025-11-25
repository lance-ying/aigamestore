// rendering.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CELL_SIZE, 
         GRID_COLS, GRID_ROWS, HOUSE_COLORS,
         PHASE_START, PHASE_PLAYING, PHASE_PAUSED, 
         PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';

export function drawStartScreen(p) {
  p.background(30, 35, 45);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("Mini Motorways", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200, 210, 220);
  p.textSize(14);
  p.text("Connect colorful houses to their matching destinations!", CANVAS_WIDTH / 2, 140);
  p.text("Build roads efficiently and manage traffic to keep the city moving.", CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.fill(255, 255, 255);
  p.text("CONTROLS:", 150, 200);
  p.fill(180, 190, 200);
  p.text("Arrow Keys: Move cursor", 150, 220);
  p.text("Space: Place/Remove road", 150, 240);
  p.text("Shift: Place highway (when available)", 150, 260);
  p.text("Z: Toggle connection view", 150, 280);
  p.text("ESC: Pause  |  R: Restart", 150, 300);
  
  // Start prompt
  p.fill(100, 255, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
  }
}

export function drawPlayingScreen(p) {
  // Background
  p.background(45, 55, 65);
  
  // Draw grid
  drawGrid(p);
  
  // Draw roads
  drawRoads(p);
  
  // Draw buildings
  drawBuildings(p);
  
  // Draw cars
  drawCars(p);
  
  // Draw cursor
  drawCursor(p);
  
  // Draw UI
  drawUI(p);
  
  // Connection view overlay
  if (gameState.showConnectionView) {
    drawConnectionView(p);
  }
}

function drawGrid(p) {
  p.stroke(60, 70, 80);
  p.strokeWeight(0.5);
  for (let x = 0; x <= GRID_COLS; x++) {
    p.line(x * CELL_SIZE, 0, x * CELL_SIZE, CANVAS_HEIGHT);
  }
  for (let y = 0; y <= GRID_ROWS; y++) {
    p.line(0, y * CELL_SIZE, CANVAS_WIDTH, y * CELL_SIZE);
  }
}

function drawRoads(p) {
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const cell = gameState.grid[y][x];
      if (cell.type === "ROAD" || cell.type === "HIGHWAY") {
        const isHighway = cell.type === "HIGHWAY";
        
        p.push();
        p.translate(x * CELL_SIZE, y * CELL_SIZE);
        
        // Road base
        p.noStroke();
        p.fill(...(isHighway ? [255, 180, 60] : [80, 80, 80]));
        p.rect(CELL_SIZE * 0.2, CELL_SIZE * 0.2, CELL_SIZE * 0.6, CELL_SIZE * 0.6);
        
        // Road lines
        if (isHighway) {
          p.stroke(255, 220, 120);
          p.strokeWeight(2);
          p.line(CELL_SIZE * 0.3, CELL_SIZE * 0.5, CELL_SIZE * 0.7, CELL_SIZE * 0.5);
        }
        
        p.pop();
      }
    }
  }
}

function drawBuildings(p) {
  for (const building of gameState.buildings) {
    const x = building.x * CELL_SIZE;
    const y = building.y * CELL_SIZE;
    const color = building.getColor();
    
    p.push();
    p.translate(x, y);
    
    // Building body
    p.fill(...color);
    p.noStroke();
    
    if (building.type === "HOUSE") {
      // House - small square with roof
      p.rect(CELL_SIZE * 0.15, CELL_SIZE * 0.35, CELL_SIZE * 0.7, CELL_SIZE * 0.5);
      p.triangle(
        CELL_SIZE * 0.15, CELL_SIZE * 0.35,
        CELL_SIZE * 0.85, CELL_SIZE * 0.35,
        CELL_SIZE * 0.5, CELL_SIZE * 0.1
      );
      
      // Queue indicator
      if (building.capacity > 0) {
        const queueHeight = Math.min(building.capacity / building.maxCapacity, 1);
        const barHeight = CELL_SIZE * 0.6 * queueHeight;
        
        p.fill(building.isOverloaded ? 255 : 100, 50, 50);
        p.rect(CELL_SIZE * 0.88, CELL_SIZE * 0.9 - barHeight, CELL_SIZE * 0.08, barHeight);
      }
    } else {
      // Destination - pin shape
      p.ellipse(CELL_SIZE * 0.5, CELL_SIZE * 0.4, CELL_SIZE * 0.5, CELL_SIZE * 0.5);
      p.triangle(
        CELL_SIZE * 0.4, CELL_SIZE * 0.6,
        CELL_SIZE * 0.6, CELL_SIZE * 0.6,
        CELL_SIZE * 0.5, CELL_SIZE * 0.9
      );
      
      // Inner circle
      p.fill(255);
      p.ellipse(CELL_SIZE * 0.5, CELL_SIZE * 0.4, CELL_SIZE * 0.25, CELL_SIZE * 0.25);
    }
    
    p.pop();
  }
}

function drawCars(p) {
  for (const car of gameState.cars) {
    const x = car.x * CELL_SIZE + CELL_SIZE * 0.5;
    const y = car.y * CELL_SIZE + CELL_SIZE * 0.5;
    const color = car.getColor();
    
    p.push();
    p.fill(...color);
    p.noStroke();
    
    // Glow effect
    p.fill(...color, 100);
    p.ellipse(x, y, CELL_SIZE * 0.4, CELL_SIZE * 0.4);
    
    // Car body
    p.fill(...color);
    p.ellipse(x, y, CELL_SIZE * 0.25, CELL_SIZE * 0.25);
    
    p.pop();
  }
}

function drawCursor(p) {
  const x = gameState.cursorX * CELL_SIZE;
  const y = gameState.cursorY * CELL_SIZE;
  
  p.push();
  p.noFill();
  p.stroke(255, 255, 255, 200);
  p.strokeWeight(3);
  p.rect(x, y, CELL_SIZE, CELL_SIZE);
  
  // Show what will be placed
  const cell = gameState.grid[gameState.cursorY][gameState.cursorX];
  if (cell.type === null) {
    if (gameState.upgradeMode && gameState.highwayTilesAvailable > 0) {
      p.fill(255, 180, 60, 100);
      p.noStroke();
      p.rect(x + CELL_SIZE * 0.2, y + CELL_SIZE * 0.2, CELL_SIZE * 0.6, CELL_SIZE * 0.6);
    } else if (gameState.roadTilesAvailable > 0) {
      p.fill(80, 80, 80, 100);
      p.noStroke();
      p.rect(x + CELL_SIZE * 0.2, y + CELL_SIZE * 0.2, CELL_SIZE * 0.6, CELL_SIZE * 0.6);
    }
  }
  
  p.pop();
}

function drawUI(p) {
  // Background panel
  p.fill(20, 25, 35, 230);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  // Score
  p.fill(255, 220, 100);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, 10, 17);
  
  // Road tiles
  p.fill(180, 180, 180);
  p.text(`Roads: ${gameState.roadTilesAvailable}`, 150, 17);
  
  // Highway tiles
  if (gameState.highwayTilesAvailable > 0) {
    p.fill(255, 180, 60);
    p.text(`Highways: ${gameState.highwayTilesAvailable}`, 260, 17);
  }
  
  // Mode indicator
  if (gameState.upgradeMode) {
    p.fill(255, 180, 60);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text("HIGHWAY MODE", CANVAS_WIDTH - 10, 17);
  }
  
  // Paused indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.fill(255, 100, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 40);
  }
}

function drawConnectionView(p) {
  p.fill(30, 35, 45, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Draw connections
  p.strokeWeight(2);
  for (const building of gameState.buildings) {
    if (building.type === "HOUSE") {
      const destinations = gameState.buildings.filter(
        b => b.type === "DESTINATION" && b.colorIndex === building.colorIndex
      );
      
      for (const dest of destinations) {
        const color = building.getColor();
        p.stroke(...color, 150);
        p.line(
          building.x * CELL_SIZE + CELL_SIZE * 0.5,
          building.y * CELL_SIZE + CELL_SIZE * 0.5,
          dest.x * CELL_SIZE + CELL_SIZE * 0.5,
          dest.y * CELL_SIZE + CELL_SIZE * 0.5
        );
      }
    }
  }
  
  // Draw buildings on top
  drawBuildings(p);
  
  // Info text
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text("CONNECTION VIEW - Release Z to return", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
}

export function drawPausedScreen(p) {
  drawPlayingScreen(p);
  
  // Overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(16);
  p.fill(200);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
}

export function drawGameOverScreen(p) {
  drawPlayingScreen(p);
  
  // Overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  p.fill(isWin ? 100 : 255, isWin ? 255 : 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "SUCCESS!" : "GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  
  p.textSize(16);
  p.fill(200);
  if (!isWin) {
    p.text("A building got too backed up!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
  } else {
    p.text("You've mastered traffic management!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
  }
  
  p.fill(100, 255, 150);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
}