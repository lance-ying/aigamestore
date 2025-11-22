import { gameState, GAME_PHASES, GRID_SIZE, TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, TILE_TYPES } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 15, 30);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("던전 추적자", p.width / 2, 80);
  
  p.textSize(24);
  p.fill(200, 180, 255);
  p.text("Dungeon Tracer", p.width / 2, 120);
  
  // Instructions
  p.textSize(14);
  p.fill(200, 200, 220);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "OBJECTIVE:",
    "Connect adjacent tiles to form powerful combat chains!",
    "Defeat 25 special monsters to win.",
    "",
    "HOW TO PLAY:",
    "• Use ARROW KEYS to move cursor",
    "• Press SPACE to start/end path connection",
    "• Connect tiles: Weapons, Magic, Defense, Gold, Health",
    "• Each turn, enemies attack after your action",
    "• Level up to increase your stats",
    "• Press Z to use special abilities",
    "",
    "TILES:",
    "⚔ Weapon (Red) - Physical damage",
    "✦ Magic (Purple) - Magical damage", 
    "⛨ Defense (Blue) - Block damage this turn",
    "◈ Gold (Yellow) - Collect currency",
    "♥ Health (Green) - Restore HP",
    "☠ Enemy (Orange) - Must defeat!",
    "★ Special (Pink) - Defeat 25 to win!"
  ];
  
  let y = 160;
  for (const line of instructions) {
    if (line.startsWith("OBJECTIVE") || line.startsWith("HOW TO PLAY") || line.startsWith("TILES")) {
      p.fill(255, 215, 0);
    } else {
      p.fill(200, 200, 220);
    }
    p.text(line, 50, y);
    y += 16;
  }
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.fill(100, 255, 100);
  p.text("PRESS ENTER TO START", p.width / 2, p.height - 30);
}

export function drawPlayingScreen(p) {
  p.background(30, 25, 40);
  
  // Draw grid
  drawGrid(p);
  
  // Draw UI
  drawUI(p);
  
  // Draw pause indicator if paused
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", p.width - 10, 10);
  }
}

function drawGrid(p) {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const tile = gameState.grid[y][x];
      const screenX = GRID_OFFSET_X + x * TILE_SIZE;
      const screenY = GRID_OFFSET_Y + y * TILE_SIZE;
      
      // Draw tile background
      const isInPath = gameState.currentPath.some(t => t.x === x && t.y === y);
      const isCursor = gameState.cursorX === x && gameState.cursorY === y;
      
      if (isInPath) {
        p.fill(100, 255, 100, 100);
      } else if (isCursor) {
        p.fill(255, 255, 100, 150);
      } else {
        p.fill(50, 45, 60);
      }
      
      p.stroke(80, 75, 90);
      p.strokeWeight(1);
      p.rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      
      // Draw tile content
      drawTile(p, tile, screenX, screenY);
    }
  }
  
  // Draw path connections
  if (gameState.currentPath.length > 1) {
    p.stroke(100, 255, 100);
    p.strokeWeight(3);
    p.noFill();
    
    for (let i = 0; i < gameState.currentPath.length - 1; i++) {
      const t1 = gameState.currentPath[i];
      const t2 = gameState.currentPath[i + 1];
      
      const x1 = GRID_OFFSET_X + t1.x * TILE_SIZE + TILE_SIZE / 2;
      const y1 = GRID_OFFSET_Y + t1.y * TILE_SIZE + TILE_SIZE / 2;
      const x2 = GRID_OFFSET_X + t2.x * TILE_SIZE + TILE_SIZE / 2;
      const y2 = GRID_OFFSET_Y + t2.y * TILE_SIZE + TILE_SIZE / 2;
      
      p.line(x1, y1, x2, y2);
    }
  }
}

function drawTile(p, tile, x, y) {
  const centerX = x + TILE_SIZE / 2;
  const centerY = y + TILE_SIZE / 2;
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  
  switch (tile.type) {
    case TILE_TYPES.WEAPON:
      p.fill(255, 80, 80);
      p.noStroke();
      p.triangle(centerX, centerY - 12, centerX - 8, centerY + 8, centerX + 8, centerY + 8);
      p.fill(255);
      p.textSize(10);
      p.text(tile.value, centerX, centerY + 12);
      break;
      
    case TILE_TYPES.MAGIC:
      p.fill(200, 100, 255);
      p.noStroke();
      for (let i = 0; i < 4; i++) {
        const angle = i * p.PI / 2;
        const px = centerX + p.cos(angle) * 10;
        const py = centerY + p.sin(angle) * 10;
        p.ellipse(px, py, 6, 6);
      }
      p.fill(255);
      p.textSize(10);
      p.text(tile.value, centerX, centerY);
      break;
      
    case TILE_TYPES.DEFENSE:
      p.fill(100, 150, 255);
      p.noStroke();
      p.beginShape();
      p.vertex(centerX, centerY - 12);
      p.vertex(centerX + 10, centerY);
      p.vertex(centerX, centerY + 12);
      p.vertex(centerX - 10, centerY);
      p.endShape(p.CLOSE);
      p.fill(255);
      p.textSize(10);
      p.text(tile.value, centerX, centerY);
      break;
      
    case TILE_TYPES.GOLD:
      p.fill(255, 215, 0);
      p.noStroke();
      p.ellipse(centerX, centerY, 20, 20);
      p.fill(0);
      p.textSize(10);
      p.text(tile.value, centerX, centerY);
      break;
      
    case TILE_TYPES.HEALTH:
      p.fill(100, 255, 100);
      p.noStroke();
      p.ellipse(centerX - 5, centerY - 3, 12, 12);
      p.ellipse(centerX + 5, centerY - 3, 12, 12);
      p.triangle(centerX - 10, centerY, centerX + 10, centerY, centerX, centerY + 10);
      p.fill(255);
      p.textSize(10);
      p.text(tile.value, centerX, centerY + 12);
      break;
      
    case TILE_TYPES.ENEMY:
      p.fill(255, 120, 60);
      p.noStroke();
      p.ellipse(centerX, centerY - 5, 18, 18);
      p.rect(centerX - 8, centerY + 2, 16, 10);
      
      // Health bar
      const healthPercent = tile.health / tile.maxHealth;
      p.fill(50);
      p.rect(x + 3, y + 3, TILE_SIZE - 6, 4);
      p.fill(255, 0, 0);
      p.rect(x + 3, y + 3, (TILE_SIZE - 6) * healthPercent, 4);
      break;
      
    case TILE_TYPES.SPECIAL_ENEMY:
      p.fill(255, 100, 200);
      p.noStroke();
      p.ellipse(centerX, centerY - 5, 20, 20);
      p.rect(centerX - 10, centerY + 2, 20, 12);
      
      // Health bar
      const healthPct = tile.health / tile.maxHealth;
      p.fill(50);
      p.rect(x + 3, y + 3, TILE_SIZE - 6, 4);
      p.fill(255, 0, 100);
      p.rect(x + 3, y + 3, (TILE_SIZE - 6) * healthPct, 4);
      
      // Star
      p.fill(255, 255, 0);
      p.textSize(14);
      p.text("★", centerX, centerY - 5);
      break;
      
    case TILE_TYPES.ABILITY:
      p.fill(150, 255, 255);
      p.noStroke();
      p.ellipse(centerX, centerY, 18, 18);
      p.fill(0);
      p.textSize(16);
      p.text("?", centerX, centerY);
      break;
      
    case TILE_TYPES.EMPTY:
      // Just background
      break;
  }
}

function drawUI(p) {
  // Stats panel
  p.fill(40, 35, 50);
  p.noStroke();
  p.rect(415, 10, 175, 380);
  
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.fill(255, 215, 0);
  p.text("STATS", 425, 20);
  
  p.textSize(11);
  p.fill(200, 200, 220);
  let uiY = 45;
  
  p.text(`Level: ${gameState.level}`, 425, uiY);
  uiY += 18;
  
  p.text(`HP: ${Math.max(0, Math.floor(gameState.health))}/${gameState.maxHealth}`, 425, uiY);
  uiY += 15;
  
  // Health bar
  const hpPercent = gameState.health / gameState.maxHealth;
  p.fill(100, 50, 50);
  p.rect(425, uiY, 150, 10);
  p.fill(255, 50, 50);
  p.rect(425, uiY, 150 * Math.max(0, hpPercent), 10);
  uiY += 18;
  
  p.fill(200, 200, 220);
  p.text(`XP: ${Math.floor(gameState.experience)}/${gameState.experienceToLevel}`, 425, uiY);
  uiY += 15;
  
  // XP bar
  const xpPercent = gameState.experience / gameState.experienceToLevel;
  p.fill(50, 50, 100);
  p.rect(425, uiY, 150, 8);
  p.fill(100, 150, 255);
  p.rect(425, uiY, 150 * xpPercent, 8);
  uiY += 15;
  
  p.fill(200, 200, 220);
  p.text(`Gold: ${Math.floor(gameState.gold)}`, 425, uiY);
  uiY += 18;
  p.text(`Score: ${Math.floor(gameState.score)}`, 425, uiY);
  uiY += 18;
  
  p.fill(255, 215, 0);
  p.text("Combat Stats:", 425, uiY);
  uiY += 18;
  
  p.fill(200, 200, 220);
  p.text(`Attack: ${gameState.attack}`, 425, uiY);
  uiY += 15;
  p.text(`Defense: ${gameState.defense}`, 425, uiY);
  uiY += 15;
  p.text(`Magic: ${gameState.magicPower}`, 425, uiY);
  uiY += 20;
  
  p.fill(255, 215, 0);
  p.text("Progress:", 425, uiY);
  uiY += 18;
  
  p.fill(200, 200, 220);
  p.text(`Special Defeated:`, 425, uiY);
  uiY += 15;
  p.text(`${gameState.specialMonstersDefeated}/25`, 425, uiY);
  uiY += 15;
  p.text(`Turn: ${gameState.turnCount}`, 425, uiY);
  uiY += 20;
  
  // Abilities
  if (gameState.unlockedAbilities.length > 0) {
    p.fill(255, 215, 0);
    p.text("Ability (Z):", 425, uiY);
    uiY += 18;
    
    p.fill(150, 255, 255);
    p.text(gameState.currentAbility ? gameState.currentAbility.name : "None", 425, uiY);
    uiY += 15;
    
    if (gameState.abilityCooldown > 0) {
      p.fill(255, 100, 100);
      p.text(`Cooldown: ${gameState.abilityCooldown}`, 425, uiY);
    } else {
      p.fill(100, 255, 100);
      p.text("Ready!", 425, uiY);
    }
  }
}

export function drawGameOverScreen(p) {
  p.background(20, 15, 30);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.text(isWin ? "VICTORY!" : "DEFEATED", p.width / 2, 100);
  
  p.textSize(24);
  p.fill(200, 200, 220);
  p.text(isWin ? "You defeated all special monsters!" : "The dungeon has claimed you...", p.width / 2, 160);
  
  p.textSize(18);
  p.fill(255, 215, 0);
  p.text(`Final Score: ${Math.floor(gameState.score)}`, p.width / 2, 220);
  
  p.textSize(16);
  p.fill(200, 200, 220);
  p.text(`Level Reached: ${gameState.level}`, p.width / 2, 250);
  p.text(`Special Monsters Defeated: ${gameState.specialMonstersDefeated}/25`, p.width / 2, 275);
  p.text(`Turns Survived: ${gameState.turnCount}`, p.width / 2, 300);
  p.text(`Gold Collected: ${Math.floor(gameState.gold)}`, p.width / 2, 325);
  
  p.textSize(20);
  p.fill(100, 255, 255);
  p.text("PRESS R TO RESTART", p.width / 2, p.height - 40);
}