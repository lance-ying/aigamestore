// rendering.js - Rendering functions

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  GRID_SIZE,
  GRID_START_X,
  GRID_START_Y,
  CELL_SIZE,
  RUNE_COLORS,
  RUNE_NAMES,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE
} from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 15, 35);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glow
  p.fill(150, 100, 255, 100);
  p.textSize(48);
  p.text("MAGICUS", CANVAS_WIDTH / 2 + 2, 60 + 2);
  
  // Title
  p.fill(220, 180, 255);
  p.text("MAGICUS", CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.textSize(16);
  p.fill(180, 160, 200);
  p.text("Match-3 RPG Battle", CANVAS_WIDTH / 2, 95);
  
  // Description box
  p.fill(40, 30, 60, 200);
  p.rect(50, 120, CANVAS_WIDTH - 100, 140, 10);
  
  p.textSize(14);
  p.fill(220, 220, 220);
  p.textAlign(p.LEFT, p.TOP);
  const descX = 70;
  let descY = 135;
  
  p.text("OBJECTIVE:", descX, descY);
  descY += 20;
  p.textSize(12);
  p.fill(200, 200, 200);
  p.text("• Match 3+ runes to attack enemies", descX, descY);
  descY += 18;
  p.text("• Fill elemental meters to cast powerful spells", descX, descY);
  descY += 18;
  p.text("• Defeat 5 stages of enemies to win!", descX, descY);
  descY += 18;
  p.text("• Don't let your HP reach zero!", descX, descY);
  
  descY += 30;
  p.textSize(14);
  p.fill(220, 220, 220);
  p.text("CONTROLS:", descX, descY);
  descY += 20;
  p.textSize(12);
  p.fill(200, 200, 200);
  p.text("Arrow Keys: Move cursor  |  Space: Swap runes", descX, descY);
  descY += 18;
  p.text("Z: Cast spell (when meter full)  |  ESC: Pause", descX, descY);
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 220, 100, 255 * pulse);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 340);
  
  p.pop();
}

export function drawGame(p) {
  p.background(20, 15, 35);
  
  // Draw background pattern
  drawBackground(p);
  
  // Draw UI
  drawUI(p);
  
  // Draw grid
  drawGrid(p);
  
  // Draw cursor
  drawCursor(p);
  
  // Draw enemy
  drawEnemy(p);
  
  // Draw elemental meters
  drawElementalMeters(p);
  
  // Draw animations
  if (gameState.animating) {
    drawMatchAnimation(p);
  }
  
  // Pause indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.push();
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.fill(255, 200, 100);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
    p.pop();
  }
}

function drawBackground(p) {
  p.push();
  p.noStroke();
  for (let i = 0; i < 20; i++) {
    const x = (p.frameCount * 0.5 + i * 30) % CANVAS_WIDTH;
    const y = (p.frameCount * 0.3 + i * 20) % CANVAS_HEIGHT;
    p.fill(60, 40, 80, 30);
    p.circle(x, y, 3);
  }
  p.pop();
}

function drawUI(p) {
  p.push();
  
  // Top bar background
  p.fill(30, 20, 50, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 30);
  
  p.textSize(14);
  p.fill(255, 220, 100);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Stage: ${gameState.stage}`, 10, 15);
  p.text(`Gold: ${gameState.gold}`, 120, 15);
  p.text(`Score: ${gameState.score}`, 230, 15);
  p.text(`Level: ${gameState.level}`, 360, 15);
  
  // Player HP bar
  const hpBarX = 10;
  const hpBarY = 40;
  const hpBarW = 200;
  const hpBarH = 20;
  
  p.fill(60, 30, 30);
  p.rect(hpBarX, hpBarY, hpBarW, hpBarH, 5);
  
  const hpPercent = gameState.playerHP / gameState.playerMaxHP;
  p.fill(...(hpPercent > 0.5 ? [100, 255, 100] : hpPercent > 0.25 ? [255, 200, 100] : [255, 100, 100]));
  p.rect(hpBarX, hpBarY, hpBarW * hpPercent, hpBarH, 5);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(`HP: ${Math.ceil(gameState.playerHP)}/${gameState.playerMaxHP}`, hpBarX + hpBarW / 2, hpBarY + hpBarH / 2);
  
  p.pop();
}

function drawGrid(p) {
  p.push();
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const screenX = GRID_START_X + x * CELL_SIZE;
      const screenY = GRID_START_Y + y * CELL_SIZE;
      
      // Cell background
      p.fill(40, 35, 55);
      p.stroke(60, 55, 75);
      p.strokeWeight(1);
      p.rect(screenX, screenY, CELL_SIZE - 2, CELL_SIZE - 2, 4);
      
      // Rune
      const runeColor = gameState.grid[y][x];
      if (runeColor >= 0) {
        drawRune(p, screenX + CELL_SIZE / 2, screenY + CELL_SIZE / 2, runeColor, CELL_SIZE * 0.6);
      }
    }
  }
  
  p.pop();
}

function drawRune(p, x, y, colorIndex, size) {
  p.push();
  
  const color = RUNE_COLORS[colorIndex];
  const pulse = p.sin(p.frameCount * 0.05 + colorIndex) * 0.1 + 0.9;
  
  // Glow
  p.noStroke();
  p.fill(...color, 50);
  p.circle(x, y, size * 1.3);
  
  // Main rune
  p.fill(...color.map(c => c * pulse));
  p.stroke(255, 255, 255, 150);
  p.strokeWeight(2);
  
  // Different shapes for different colors
  switch (colorIndex) {
    case 0: // Fire - triangle
      p.triangle(x, y - size / 2, x - size / 2, y + size / 2, x + size / 2, y + size / 2);
      break;
    case 1: // Ice - diamond
      p.push();
      p.translate(x, y);
      p.rotate(p.PI / 4);
      p.rect(-size / 3, -size / 3, size * 0.66, size * 0.66);
      p.pop();
      break;
    case 2: // Nature - hexagon
      drawHexagon(p, x, y, size / 2);
      break;
    case 3: // Light - star
      drawStar(p, x, y, size / 3, size / 6, 5);
      break;
    case 4: // Shadow - pentagon
      drawPolygon(p, x, y, size / 2, 5);
      break;
  }
  
  p.pop();
}

function drawHexagon(p, x, y, radius) {
  p.beginShape();
  for (let i = 0; i < 6; i++) {
    const angle = p.TWO_PI / 6 * i;
    const vx = x + radius * p.cos(angle);
    const vy = y + radius * p.sin(angle);
    p.vertex(vx, vy);
  }
  p.endShape(p.CLOSE);
}

function drawStar(p, x, y, radius1, radius2, npoints) {
  const angle = p.TWO_PI / npoints;
  const halfAngle = angle / 2;
  p.beginShape();
  for (let a = -p.PI / 2; a < p.TWO_PI - p.PI / 2; a += angle) {
    let sx = x + p.cos(a) * radius1;
    let sy = y + p.sin(a) * radius1;
    p.vertex(sx, sy);
    sx = x + p.cos(a + halfAngle) * radius2;
    sy = y + p.sin(a + halfAngle) * radius2;
    p.vertex(sx, sy);
  }
  p.endShape(p.CLOSE);
}

function drawPolygon(p, x, y, radius, npoints) {
  const angle = p.TWO_PI / npoints;
  p.beginShape();
  for (let a = 0; a < p.TWO_PI; a += angle) {
    const sx = x + p.cos(a) * radius;
    const sy = y + p.sin(a) * radius;
    p.vertex(sx, sy);
  }
  p.endShape(p.CLOSE);
}

function drawCursor(p) {
  if (gameState.animating) return;
  
  p.push();
  const x = GRID_START_X + gameState.cursor.x * CELL_SIZE;
  const y = GRID_START_Y + gameState.cursor.y * CELL_SIZE;
  
  p.noFill();
  p.stroke(255, 255, 100);
  p.strokeWeight(3);
  p.rect(x, y, CELL_SIZE - 2, CELL_SIZE - 2, 4);
  
  // Selected cell indicator
  if (gameState.selectedCell) {
    const sx = GRID_START_X + gameState.selectedCell.x * CELL_SIZE;
    const sy = GRID_START_Y + gameState.selectedCell.y * CELL_SIZE;
    p.stroke(100, 255, 255);
    p.strokeWeight(2);
    p.rect(sx + 2, sy + 2, CELL_SIZE - 6, CELL_SIZE - 6, 4);
  }
  
  p.pop();
}

function drawEnemy(p) {
  if (!gameState.currentEnemy) return;
  
  p.push();
  
  const enemyX = 400;
  const enemyY = 180;
  
  // Enemy shadow
  p.fill(0, 0, 0, 100);
  p.noStroke();
  p.ellipse(enemyX, enemyY + 60, 80, 20);
  
  // Enemy body
  const bounce = p.sin(p.frameCount * 0.05) * 5;
  const enemyColor = RUNE_COLORS[gameState.currentEnemy.type];
  
  // Glow
  p.fill(...enemyColor, 50);
  p.circle(enemyX, enemyY + bounce, 70);
  
  // Main body
  p.fill(...enemyColor);
  p.stroke(255, 255, 255, 100);
  p.strokeWeight(2);
  p.circle(enemyX, enemyY + bounce, 50);
  
  // Eyes
  p.fill(255);
  p.noStroke();
  p.circle(enemyX - 12, enemyY - 5 + bounce, 10);
  p.circle(enemyX + 12, enemyY - 5 + bounce, 10);
  
  p.fill(0);
  p.circle(enemyX - 10, enemyY - 5 + bounce, 5);
  p.circle(enemyX + 14, enemyY - 5 + bounce, 5);
  
  // HP bar
  const hpBarW = 100;
  const hpBarH = 12;
  const hpBarX = enemyX - hpBarW / 2;
  const hpBarY = enemyY - 60;
  
  p.fill(60, 30, 30);
  p.noStroke();
  p.rect(hpBarX, hpBarY, hpBarW, hpBarH, 3);
  
  const hpPercent = gameState.enemyHP / gameState.enemyMaxHP;
  p.fill(255, 100, 100);
  p.rect(hpBarX, hpBarY, hpBarW * hpPercent, hpBarH, 3);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text(`${Math.ceil(gameState.enemyHP)}/${gameState.enemyMaxHP}`, enemyX, hpBarY + hpBarH / 2);
  
  // Enemy name
  p.textSize(14);
  p.fill(220, 200, 255);
  p.text(`${RUNE_NAMES[gameState.currentEnemy.type]} Elemental`, enemyX, hpBarY - 15);
  
  p.pop();
}

function drawElementalMeters(p) {
  p.push();
  
  const meterStartX = 400;
  const meterStartY = 280;
  const meterWidth = 30;
  const meterHeight = 80;
  const meterSpacing = 35;
  
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(10);
  
  for (let i = 0; i < 5; i++) {
    const x = meterStartX + i * meterSpacing;
    const y = meterStartY;
    
    // Background
    p.fill(30, 25, 45);
    p.stroke(60, 55, 75);
    p.strokeWeight(1);
    p.rect(x, y, meterWidth, meterHeight, 3);
    
    // Fill
    const fillPercent = gameState.elementalMeters[i] / gameState.meterMax;
    const fillHeight = meterHeight * fillPercent;
    
    p.fill(...RUNE_COLORS[i]);
    p.noStroke();
    p.rect(x, y + meterHeight - fillHeight, meterWidth, fillHeight, 3);
    
    // Full indicator
    if (fillPercent >= 1) {
      p.stroke(255, 255, 100);
      p.strokeWeight(2);
      p.noFill();
      p.rect(x - 2, y - 2, meterWidth + 4, meterHeight + 4, 5);
      
      p.fill(255, 255, 100);
      p.textSize(8);
      p.text("READY", x + meterWidth / 2, y + meterHeight + 5);
    }
    
    // Initial letter
    p.fill(255);
    p.textSize(12);
    p.text(RUNE_NAMES[i][0], x + meterWidth / 2, y - 15);
  }
  
  // Instruction
  p.fill(200, 200, 200);
  p.textSize(10);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Press Z to cast spell", meterStartX + 2 * meterSpacing, meterStartY + meterHeight + 20);
  
  p.pop();
}

function drawMatchAnimation(p) {
  if (gameState.matchedCells.length === 0) return;
  
  p.push();
  
  const alpha = 255 - gameState.animationTimer * 8;
  
  for (const cell of gameState.matchedCells) {
    const x = GRID_START_X + cell.x * CELL_SIZE + CELL_SIZE / 2;
    const y = GRID_START_Y + cell.y * CELL_SIZE + CELL_SIZE / 2;
    
    const size = CELL_SIZE * (1 + gameState.animationTimer * 0.05);
    
    p.fill(...RUNE_COLORS[cell.color], alpha);
    p.noStroke();
    p.circle(x, y, size);
  }
  
  // Damage number
  if (gameState.damageDealt > 0) {
    p.fill(255, 200, 100, alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text(`-${gameState.damageDealt}`, 450, 150 - gameState.animationTimer * 2);
  }
  
  p.pop();
}

export function drawGameOver(p) {
  p.background(20, 15, 35);
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    // Victory screen
    p.fill(100, 255, 150);
    p.textSize(48);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
    
    p.fill(200, 255, 200);
    p.textSize(24);
    p.text("You have defeated all enemies!", CANVAS_WIDTH / 2, 160);
    
    p.fill(255, 220, 100);
    p.textSize(20);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 210);
    p.text(`Gold Earned: ${gameState.gold}`, CANVAS_WIDTH / 2, 240);
    p.text(`Final Level: ${gameState.level}`, CANVAS_WIDTH / 2, 270);
  } else {
    // Defeat screen
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("DEFEATED", CANVAS_WIDTH / 2, 100);
    
    p.fill(255, 180, 180);
    p.textSize(24);
    p.text("Your HP reached zero...", CANVAS_WIDTH / 2, 160);
    
    p.fill(255, 220, 100);
    p.textSize(20);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
    p.text(`Stages Cleared: ${gameState.stage - 1}`, CANVAS_WIDTH / 2, 250);
  }
  
  // Restart prompt
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 255, 255 * pulse);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
  
  p.pop();
}