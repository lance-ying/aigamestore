// ui.js - UI rendering

import { 
  gameState, 
  PLANT_TYPES,
  PLANT_KEYS,
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  GRID_ROWS,
  GRID_COLS,
  GRID_OFFSET_X,
  GRID_OFFSET_Y,
  CELL_WIDTH,
  CELL_HEIGHT,
  COLORS,
  getGridPosition
} from './globals.js';

export function renderBackground(p) {
  p.background(COLORS.BG);
  
  // Draw Lawn Grid
  for (let c = 0; c < GRID_COLS; c++) {
    for (let r = 0; r < GRID_ROWS; r++) {
      const x = GRID_OFFSET_X + c * CELL_WIDTH;
      const y = GRID_OFFSET_Y + r * CELL_HEIGHT;
      
      // Checkerboard pattern
      if ((c + r) % 2 === 0) {
        p.fill(COLORS.LAWN_LIGHT);
      } else {
        p.fill(COLORS.LAWN_DARK);
      }
      p.noStroke();
      p.rect(x, y, CELL_WIDTH, CELL_HEIGHT);
    }
  }
  
  // Lane lines (subtle)
  p.stroke(0, 30);
  p.strokeWeight(2);
  for (let r = 0; r <= GRID_ROWS; r++) {
    const y = GRID_OFFSET_Y + r * CELL_HEIGHT;
    p.line(GRID_OFFSET_X, y, GRID_OFFSET_X + GRID_COLS * CELL_WIDTH, y);
  }
  
  // Draw house on the left
  p.fill(150, 100, 80);
  p.stroke(100, 70, 50);
  p.strokeWeight(2);
  p.rect(10, 100, 70, 200, 5);
  
  // Windows
  p.fill(200, 200, 100);
  p.rect(25, 120, 20, 25);
  p.rect(55, 120, 20, 25);
  p.rect(25, 160, 20, 25);
  p.rect(55, 160, 20, 25);
  
  // Door
  p.fill(100, 50, 30);
  p.rect(35, 220, 25, 40);
}

export function renderHUD(p) {
  // Top Bar Background
  p.fill(COLORS.HUD_BG);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, GRID_OFFSET_Y - 10);
  
  // Sun Counter
  p.fill(COLORS.HUD_BORDER);
  p.rect(10, 5, 80, 40, 5);
  p.fill(COLORS.ACCENT);
  p.noStroke();
  p.circle(30, 25, 25); // Sun Icon
  p.fill(0);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.text(Math.floor(gameState.sun), 50, 25);
  
  // Plant Cards
  const cardWidth = 60;
  const cardHeight = 45;
  const startX = 110;
  
  PLANT_KEYS.forEach((key, index) => {
    const type = PLANT_TYPES[key];
    const x = startX + index * (cardWidth + 10);
    const y = 5;
    
    // Selection highlight
    if (index === gameState.selectedPlantIndex) {
      p.stroke(255, 255, 0); // Yellow border for selected
      p.strokeWeight(3);
    } else {
      p.stroke(0);
      p.strokeWeight(1);
    }
    
    // Card BG - Check affordability
    if (gameState.sun >= type.cost) {
      p.fill(200); 
    } else {
      p.fill(150, 100, 100); // Reddish tint if expensive
    }
    p.rect(x, y, cardWidth, cardHeight, 4);
    
    // Plant Icon (render actual plant preview)
    p.push();
    p.translate(x + cardWidth/2, y + cardHeight/2 - 5);
    p.scale(0.5);
    renderPlantIcon(p, key);
    p.pop();
    
    // Cost
    p.textSize(10);
    p.fill(0);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.text(type.cost, x + cardWidth/2, y + cardHeight - 8);
    
    // Cooldown Overlay
    const cd = gameState.plantCooldowns[key];
    if (cd > 0) {
      const maxCd = type.cooldown;
      const ratio = cd / maxCd;
      p.fill(0, 0, 0, 150);
      p.noStroke();
      p.rect(x, y + cardHeight * (1-ratio), cardWidth, cardHeight * ratio);
    }
  });
  
  // Wave Progress
  p.fill(255);
  p.noStroke();
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(14);
  p.text(`Wave: ${gameState.currentWave + 1}/${gameState.totalWaves}`, CANVAS_WIDTH - 20, 25);
}

function renderPlantIcon(p, plantType) {
  switch (plantType) {
    case 'SUNFLOWER':
      // Sunflower icon
      p.fill(255, 220, 0);
      p.stroke(200, 180, 0);
      p.strokeWeight(2);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * p.TWO_PI;
        const px = p.cos(angle) * 12;
        const py = p.sin(angle) * 12;
        p.circle(px, py, 8);
      }
      p.fill(255, 180, 0);
      p.circle(0, 0, 15);
      break;
    case 'PEASHOOTER':
      // Peashooter icon
      p.fill(100, 200, 100);
      p.stroke(70, 170, 70);
      p.strokeWeight(2);
      p.circle(0, 0, 25);
      p.fill(50, 100, 50);
      p.noStroke();
      p.circle(10, 0, 10);
      break;
    case 'WALLNUT':
      // Wallnut icon
      p.fill(139, 90, 43);
      p.stroke(101, 67, 33);
      p.strokeWeight(2);
      p.circle(0, 0, 28);
      break;
    case 'CHERRY_BOMB':
      // Cherry Bomb icon
      p.fill(200, 0, 0);
      p.stroke(150, 0, 0);
      p.strokeWeight(2);
      p.circle(-6, 0, 15);
      p.circle(6, 0, 15);
      break;
  }
}

export function renderCursor(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  const { cursorRow, cursorCol } = gameState;
  const x = GRID_OFFSET_X + cursorCol * CELL_WIDTH;
  const y = GRID_OFFSET_Y + cursorRow * CELL_HEIGHT;
  
  // Pulsing alpha
  const alpha = 100 + p.sin(p.frameCount * 0.1) * 50;
  
  p.noFill();
  p.stroke(255, alpha);
  p.strokeWeight(4);
  p.rect(x, y, CELL_WIDTH, CELL_HEIGHT);
  
  // Crosshair markers
  p.line(x + CELL_WIDTH/2 - 5, y + CELL_HEIGHT/2, x + CELL_WIDTH/2 + 5, y + CELL_HEIGHT/2);
  p.line(x + CELL_WIDTH/2, y + CELL_HEIGHT/2 - 5, x + CELL_WIDTH/2, y + CELL_HEIGHT/2 + 5);
  
  // Show plant preview if plant is selected
  if (gameState.selectedPlantIndex >= 0) {
    const plantKey = PLANT_KEYS[gameState.selectedPlantIndex];
    const pos = getGridPosition(cursorRow, cursorCol);
    p.push();
    p.translate(pos.x, pos.y);
    p.scale(0.6);
    renderPlantIcon(p, plantKey);
    p.pop();
  }
}

export function renderStartScreen(p) {
  p.background(0, 0, 0, 200);
  p.fill(COLORS.LAWN_LIGHT);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("GARDEN DEFENDERS", CANVAS_WIDTH/2, 100);
  p.textSize(24);
  p.fill(255);
  p.text("Pixel Patch", CANVAS_WIDTH/2, 140);
  
  p.textSize(18);
  p.text("Press ENTER to Start", CANVAS_WIDTH/2, 250);
  
  p.textSize(14);
  p.fill(200);
  p.text("ARROWS to Move | SPACE to Plant/Collect", CANVAS_WIDTH/2, 300);
  p.text("Z to Switch Plants | SHIFT+SPACE to Dig", CANVAS_WIDTH/2, 320);
}

export function renderGameOver(p) {
  p.background(0, 0, 0, 220);
  p.textAlign(p.CENTER, p.CENTER);
  
  const win = gameState.gamePhase === "GAME_OVER_WIN";
  
  if (win) {
    p.fill(COLORS.ACCENT);
    p.textSize(48);
    p.text("VICTORY!", CANVAS_WIDTH/2, 150);
    p.textSize(24);
    p.fill(255);
    p.text("The lawn is safe... for now.", CANVAS_WIDTH/2, 200);
  } else {
    p.fill(COLORS.DANGER);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH/2, 150);
    p.textSize(24);
    p.fill(255);
    p.text("The zombies ate your brains!", CANVAS_WIDTH/2, 200);
  }
  
  p.textSize(18);
  p.fill(200);
  p.text("Press R to Restart", CANVAS_WIDTH/2, 300);
}

export function renderPauseScreen(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
  p.textSize(16);
  p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}

export function renderGame(p) {
  // Render background first
  renderBackground(p);
  
  // Render all entities
  gameState.entities.forEach(entity => {
    if (entity.active) {
      entity.render(p);
    }
  });
  
  // Render cursor
  renderCursor(p);
  
  // Render HUD on top
  renderHUD(p);
}