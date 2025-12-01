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
  p.text("• Defeat 3 difficulty levels (Easy, Medium, Hard) to win!", descX, descY);
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
  p.text("Z: Cast spell (when meter full)  |  ESC: Pause  |  R: Reset", descX, descY);
  
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
  
  // Draw UI - now centered
  drawUI(p);
  
  // Draw grid - now centered
  drawGrid(p);
  
  // Draw cursor
  drawCursor(p);
  
  // Draw enemy - now centered
  drawEnemy(p);
  
  // Draw elemental meters - now centered below grid
  drawElementalMeters(p);
  
  // Draw animations
  if (gameState.animating) {
    drawMatchAnimation(p);
  }
  
  // Pause indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.push();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(16);
    p.fill(255, 200, 100);
    p.text("PAUSED", CANVAS_WIDTH / 2, 10);
    p.pop();
  }
}

export function drawStageTransition(p) {
  p.background(20, 15, 35);
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  const pulse = p.sin(gameState.transitionTimer * 0.1) * 0.2 + 0.8;
  p.fill(100, 255, 150, 255 * pulse);
  p.textSize(48);
  p.text("STAGE COMPLETE!", CANVAS_WIDTH / 2, 80);
  
  // Difficulty cleared
  const difficultyNames = ["Easy", "Medium", "Hard"];
  p.textSize(28);
  p.fill(255, 220, 100);
  p.text(`${difficultyNames[gameState.stage - 1]} Difficulty Cleared!`, CANVAS_WIDTH / 2, 130);
  
  // Stats box
  p.fill(40, 30, 60, 200);
  p.rect(100, 160, CANVAS_WIDTH - 200, 120, 10);
  
  p.textSize(14);
  p.fill(200, 200, 200);
  p.text(`Gold Earned: +${50 + gameState.stage * 20}`, CANVAS_WIDTH / 2, 190);
  p.text(`Experience: +${40 + gameState.stage * 10}`, CANVAS_WIDTH / 2, 215);
  p.text(`HP Restored: +20% Max HP`, CANVAS_WIDTH / 2, 240);
  
  // Next enemy info
  const nextStage = gameState.stage + 1;
  if (nextStage <= 3) {
    const nextEnemy = { 
      stage: nextStage, 
      type: (nextStage - 1) % 5,
      isBoss: (nextStage === 3)
    };
    
    p.textSize(16);
    p.fill(255, 150, 150);
    p.text("Next Challenge:", CANVAS_WIDTH / 2, 285);
    
    const typeNames = ["Fire", "Ice", "Nature", "Light", "Shadow"];
    const enemyName = (nextEnemy.isBoss ? "BOSS: " : "") + 
                      typeNames[nextEnemy.type] + 
                      (nextEnemy.isBoss ? " Lord" : " Elemental") +
                      ` (${difficultyNames[nextStage - 1]})`;
    
    p.textSize(18);
    p.fill(...RUNE_COLORS[nextEnemy.type]);
    p.text(enemyName, CANVAS_WIDTH / 2, 310);
  }
  
  // Continue prompt
  const promptPulse = p.sin(gameState.transitionTimer * 0.15) * 0.3 + 0.7;
  p.textSize(16);
  p.fill(255, 255, 255, 255 * promptPulse);
  p.text("Press ENTER to continue...", CANVAS_WIDTH / 2, 360);
  
  p.pop();
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
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  p.textSize(13);
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Centered stats with equal spacing
  const sectionW = CANVAS_WIDTH / 4;
  p.text(`Difficulty: ${["Easy", "Medium", "Hard"][gameState.stage - 1] || "N/A"}`, sectionW * 0.5, 17);
  p.text(`Level: ${gameState.level}`, sectionW * 1.5, 17);
  p.text(`Gold: ${gameState.gold}`, sectionW * 2.5, 17);
  p.text(`Score: ${gameState.score}`, sectionW * 3.5, 17);
  
  // Player HP bar - Centered at top of screen, below top bar
  const hpBarW = 250;
  const hpBarH = 22;
  const hpBarX = (CANVAS_WIDTH - hpBarW) / 2; // Perfectly centered
  const hpBarY = 45;
  
  p.fill(60, 30, 30);
  p.rect(hpBarX, hpBarY, hpBarW, hpBarH, 5);
  
  const hpPercent = gameState.playerHP / gameState.playerMaxHP;
  p.fill(...(hpPercent > 0.5 ? [100, 255, 100] : hpPercent > 0.25 ? [255, 200, 100] : [255, 100, 100]));
  p.rect(hpBarX, hpBarY, hpBarW * hpPercent, hpBarH, 5);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(13);
  p.text(`PLAYER HP: ${Math.ceil(gameState.playerHP)}/${gameState.playerMaxHP}`, hpBarX + hpBarW / 2, hpBarY + hpBarH / 2);
  
  p.pop();
}

function drawGrid(p) {
  p.push();
  
  // Center the grid horizontally
  const gridWidth = GRID_SIZE * CELL_SIZE;
  const gridStartX = (CANVAS_WIDTH - gridWidth) / 2 - 60; // Slightly left of center to balance with enemy
  const gridStartY = 80;
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const screenX = gridStartX + x * CELL_SIZE;
      const screenY = gridStartY + y * CELL_SIZE;
      
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
  
  // Store grid position for other functions
  gameState._renderGridX = gridStartX;
  gameState._renderGridY = gridStartY;
  
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
  const gridX = gameState._renderGridX || GRID_START_X;
  const gridY = gameState._renderGridY || GRID_START_Y;
  const x = gridX + gameState.cursor.x * CELL_SIZE;
  const y = gridY + gameState.cursor.y * CELL_SIZE;
  
  p.noFill();
  p.stroke(255, 255, 100);
  p.strokeWeight(3);
  p.rect(x, y, CELL_SIZE - 2, CELL_SIZE - 2, 4);
  
  // Selected cell indicator
  if (gameState.selectedCell) {
    const sx = gridX + gameState.selectedCell.x * CELL_SIZE;
    const sy = gridY + gameState.selectedCell.y * CELL_SIZE;
    p.stroke(100, 255, 255);
    p.strokeWeight(2);
    p.rect(sx + 2, sy + 2, CELL_SIZE - 6, CELL_SIZE - 6, 4);
  }
  
  p.pop();
}

function drawEnemy(p) {
  if (!gameState.currentEnemy) return;
  
  p.push();
  
  // Position enemy to the right of grid, centered vertically with grid
  const enemyX = CANVAS_WIDTH - 120;
  const enemyY = 200;
  
  // Enemy shadow
  p.fill(0, 0, 0, 100);
  p.noStroke();
  p.ellipse(enemyX, enemyY + 60, 80, 20);
  
  // Enemy body (larger for bosses)
  const bounce = p.sin(p.frameCount * 0.05) * 5;
  const enemyColor = RUNE_COLORS[gameState.currentEnemy.type];
  const isBoss = gameState.currentEnemy.isBoss;
  const baseSize = isBoss ? 70 : 50;
  
  // Boss aura
  if (isBoss) {
    const auraPulse = p.sin(p.frameCount * 0.08) * 10 + baseSize + 20;
    p.fill(...enemyColor, 30);
    p.circle(enemyX, enemyY + bounce, auraPulse);
  }
  
  // Glow
  p.fill(...enemyColor, 50);
  p.circle(enemyX, enemyY + bounce, baseSize + 20);
  
  // Main body
  p.fill(...enemyColor);
  p.stroke(255, 255, 255, isBoss ? 200 : 100);
  p.strokeWeight(isBoss ? 3 : 2);
  p.circle(enemyX, enemyY + bounce, baseSize);
  
  // Eyes (more intimidating for bosses)
  p.fill(255);
  p.noStroke();
  const eyeSize = isBoss ? 14 : 10;
  const eyeSpacing = isBoss ? 15 : 12;
  p.circle(enemyX - eyeSpacing, enemyY - 5 + bounce, eyeSize);
  p.circle(enemyX + eyeSpacing, enemyY - 5 + bounce, eyeSize);
  
  p.fill(isBoss ? [255, 0, 0] : [0, 0, 0]);
  const pupilSize = isBoss ? 7 : 5;
  p.circle(enemyX - eyeSpacing + 2, enemyY - 5 + bounce, pupilSize);
  p.circle(enemyX + eyeSpacing + 2, enemyY - 5 + bounce, pupilSize);
  
  // HP bar
  const hpBarW = isBoss ? 140 : 110;
  const hpBarH = isBoss ? 16 : 14;
  const hpBarX = enemyX - hpBarW / 2;
  const hpBarY = enemyY - (isBoss ? 75 : 65);
  
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
  p.textSize(isBoss ? 14 : 12);
  p.fill(isBoss ? [255, 100, 100] : [220, 200, 255]);
  if (isBoss) {
    p.stroke(255, 200, 100);
    p.strokeWeight(1);
  }
  const nameLines = gameState.currentEnemy.getName().split(' ');
  if (nameLines.length > 3) {
    p.textSize(10);
    p.text(nameLines.slice(0, 3).join(' '), enemyX, hpBarY - 20);
    p.text(nameLines.slice(3).join(' '), enemyX, hpBarY - 35);
  } else {
    p.text(gameState.currentEnemy.getName(), enemyX, hpBarY - 20);
  }
  
  // Boss indicator
  if (isBoss) {
    p.noStroke();
    p.textSize(11);
    p.fill(255, 220, 100);
    p.text("⚔ BOSS ⚔", enemyX, hpBarY - 50);
  }
  
  p.pop();
}

function drawElementalMeters(p) {
  p.push();
  
  // Center elemental meters below the grid
  const meterWidth = 28;
  const meterHeight = 70;
  const meterSpacing = 33;
  const totalMetersWidth = 5 * meterWidth + 4 * meterSpacing;
  const meterStartX = (CANVAS_WIDTH - totalMetersWidth) / 2;
  const meterStartY = 310;
  
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(10);
  
  for (let i = 0; i < 5; i++) {
    const x = meterStartX + i * (meterWidth + meterSpacing);
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
      p.text("READY", x + meterWidth / 2, y + meterHeight + 3);
    }
    
    // Initial letter
    p.fill(255);
    p.textSize(11);
    p.text(RUNE_NAMES[i][0], x + meterWidth / 2, y - 13);
  }
  
  // Instruction - centered
  p.fill(200, 200, 200);
  p.textSize(10);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Press Z to cast spell when READY", CANVAS_WIDTH / 2, meterStartY + meterHeight + 18);
  
  p.pop();
}

function drawMatchAnimation(p) {
  if (gameState.matchedCells.length === 0) return;
  
  p.push();
  
  const alpha = 255 - gameState.animationTimer * 8;
  const gridX = gameState._renderGridX || GRID_START_X;
  const gridY = gameState._renderGridY || GRID_START_Y;
  
  for (const cell of gameState.matchedCells) {
    const x = gridX + cell.x * CELL_SIZE + CELL_SIZE / 2;
    const y = gridY + cell.y * CELL_SIZE + CELL_SIZE / 2;
    
    const size = CELL_SIZE * (1 + gameState.animationTimer * 0.05);
    
    p.fill(...RUNE_COLORS[cell.color], alpha);
    p.noStroke();
    p.circle(x, y, size);
  }
  
  // Damage number - positioned above enemy
  if (gameState.damageDealt > 0) {
    const enemyX = CANVAS_WIDTH - 120;
    const enemyY = 200;
    p.fill(255, 200, 100, alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text(`-${gameState.damageDealt}`, enemyX, enemyY - 50 - gameState.animationTimer * 2);
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
    p.text("VICTORY!", CANVAS_WIDTH / 2, 80);
    
    p.fill(200, 255, 200);
    p.textSize(24);
    p.text("You have conquered all difficulties!", CANVAS_WIDTH / 2, 140);
    
    p.fill(255, 220, 100);
    p.textSize(20);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
    p.text(`Gold Earned: ${gameState.gold}`, CANVAS_WIDTH / 2, 230);
    p.text(`Final Level: ${gameState.level}`, CANVAS_WIDTH / 2, 260);
  } else {
    // Defeat screen
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("DEFEATED", CANVAS_WIDTH / 2, 80);
    
    p.fill(255, 180, 180);
    p.textSize(24);
    p.text("Your HP reached zero...", CANVAS_WIDTH / 2, 140);
    
    p.fill(255, 220, 100);
    p.textSize(20);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
    const difficultyNames = ["Easy", "Medium", "Hard"];
    p.text(`Difficulty Reached: ${difficultyNames[gameState.stage - 1] || "None"}`, CANVAS_WIDTH / 2, 230);
  }
  
  // Restart prompt
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 255, 255 * pulse);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
  
  p.pop();
}