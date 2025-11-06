// rendering.js - Rendering functions

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_SIZE,
  GRID_OFFSET_X,
  GRID_OFFSET_Y,
  GRID_COLS,
  GRID_ROWS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  MODE_BUILD,
  MODE_RESEARCH,
  MODE_EXPAND,
  ATTRACTIONS,
  RESEARCH_TREE,
  MASCOTS
} from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("ゆうえんち夢物語", CANVAS_WIDTH / 2, 80);
  
  p.textSize(20);
  p.fill(200, 200, 255);
  p.text("Amusement Park Story", CANVAS_WIDTH / 2, 110);
  
  // Instructions
  p.textSize(14);
  p.fill(220);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "BUILD your dream amusement park!",
    "",
    "OBJECTIVE: Reach Rank 1 in national rankings",
    "",
    "HOW TO PLAY:",
    "• Arrow Keys: Navigate menus and grid",
    "• SPACE: Confirm action (place/research/expand)",
    "• SHIFT: Switch modes (Build/Research/Expand)",
    "• Z: Cancel/Go back",
    "",
    "TIPS:",
    "• Place attractions to attract guests",
    "• Guests generate income and satisfaction",
    "• Research new rides and upgrades",
    "• Expand land to fit bigger attractions",
    "• Scout mascots yearly for popularity boost"
  ];
  
  let y = 140;
  for (const line of instructions) {
    p.text(line, 80, y);
    y += 18;
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const alpha = Math.sin(p.frameCount * 0.1) * 100 + 155;
  p.fill(255, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderPlayingScreen(p) {
  p.background(40, 120, 60);
  
  // Title bar
  p.fill(30, 30, 60);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 60);
  
  // Game info
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Money: $${Math.floor(gameState.money)}`, 10, 10);
  p.text(`Satisfaction: ${Math.floor(gameState.satisfaction)}`, 10, 25);
  p.text(`Popularity: ${Math.floor(gameState.popularity)}`, 10, 40);
  
  p.text(`Rank: ${gameState.rank}/10`, 150, 10);
  p.text(`Year: ${gameState.year}`, 150, 25);
  p.text(`Guests: ${gameState.guests.length}/${gameState.maxGuests}`, 150, 40);
  
  // Mode indicator
  p.textAlign(p.RIGHT, p.TOP);
  const modeColors = {
    [MODE_BUILD]: [100, 200, 255],
    [MODE_RESEARCH]: [255, 200, 100],
    [MODE_EXPAND]: [200, 100, 255]
  };
  p.fill(...modeColors[gameState.currentMode]);
  p.textSize(14);
  p.text(`Mode: ${gameState.currentMode}`, CANVAS_WIDTH - 10, 10);
  p.textSize(10);
  p.fill(200);
  p.text("(SHIFT to switch)", CANVAS_WIDTH - 10, 28);
  
  // Render grid
  renderGrid(p);
  
  // Render attractions
  for (const attraction of gameState.attractions) {
    attraction.render(p);
  }
  
  // Render guests
  for (const guest of gameState.guests) {
    guest.render(p);
  }
  
  // Render mascots
  for (const mascot of gameState.mascots) {
    mascot.render(p);
  }
  
  // Render UI based on mode
  if (gameState.currentMode === MODE_BUILD) {
    renderBuildMenu(p);
  } else if (gameState.currentMode === MODE_RESEARCH) {
    renderResearchMenu(p);
  } else if (gameState.currentMode === MODE_EXPAND) {
    renderExpandMenu(p);
  }
}

export function renderGrid(p) {
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const cell = gameState.grid[y][x];
      const screenX = GRID_OFFSET_X + x * GRID_SIZE;
      const screenY = GRID_OFFSET_Y + y * GRID_SIZE;
      
      if (!cell.unlocked) {
        p.fill(60, 60, 60);
      } else if (cell.occupied) {
        p.fill(80, 140, 90);
      } else {
        p.fill(100, 180, 120);
      }
      
      p.stroke(40, 100, 60);
      p.strokeWeight(1);
      p.rect(screenX, screenY, GRID_SIZE, GRID_SIZE);
    }
  }
  
  // Highlight cursor in build mode
  if (gameState.currentMode === MODE_BUILD) {
    const type = gameState.selectedAttractionType;
    const config = ATTRACTIONS[type];
    
    p.noFill();
    p.stroke(255, 255, 100);
    p.strokeWeight(2);
    
    const screenX = GRID_OFFSET_X + gameState.cursorX * GRID_SIZE;
    const screenY = GRID_OFFSET_Y + gameState.cursorY * GRID_SIZE;
    const size = config.size * GRID_SIZE;
    
    p.rect(screenX, screenY, size, size);
  }
}

export function renderBuildMenu(p) {
  const menuX = GRID_OFFSET_X + GRID_COLS * GRID_SIZE + 20;
  const menuY = GRID_OFFSET_Y;
  const menuWidth = CANVAS_WIDTH - menuX - 10;
  
  p.fill(30, 30, 60, 230);
  p.noStroke();
  p.rect(menuX, menuY, menuWidth, 300, 5);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("BUILD MENU", menuX + 10, menuY + 10);
  
  let y = menuY + 30;
  let index = 0;
  
  for (const [key, config] of Object.entries(ATTRACTIONS)) {
    if (index < gameState.menuScroll) {
      index++;
      continue;
    }
    
    if (y > menuY + 280) break;
    
    const isSelected = key === gameState.selectedAttractionType;
    
    if (isSelected) {
      p.fill(100, 150, 255, 100);
      p.rect(menuX + 5, y - 2, menuWidth - 10, 40, 3);
    }
    
    // Color indicator
    p.fill(...config.color);
    p.rect(menuX + 10, y, 8, 8);
    
    // Name
    p.fill(config.unlocked ? 255 : 120);
    p.textSize(11);
    p.text(config.name, menuX + 25, y);
    
    // Cost and stats
    p.textSize(9);
    p.fill(config.unlocked ? 200 : 100);
    p.text(`$${config.cost} | ${config.size}x${config.size}`, menuX + 25, y + 14);
    p.text(`Income: ${config.income} | Sat: ${config.satisfaction}`, menuX + 25, y + 26);
    
    y += 42;
    index++;
  }
  
  // Instructions
  p.fill(200);
  p.textSize(9);
  p.text("Arrows: Select | Space: Place", menuX + 10, menuY + 285);
}

export function renderResearchMenu(p) {
  const menuX = GRID_OFFSET_X + GRID_COLS * GRID_SIZE + 20;
  const menuY = GRID_OFFSET_Y;
  const menuWidth = CANVAS_WIDTH - menuX - 10;
  
  p.fill(30, 30, 60, 230);
  p.noStroke();
  p.rect(menuX, menuY, menuWidth, 300, 5);
  
  p.fill(255, 200, 100);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("RESEARCH", menuX + 10, menuY + 10);
  
  let y = menuY + 30;
  let index = 0;
  const researchKeys = Object.keys(RESEARCH_TREE);
  
  for (const key of researchKeys) {
    if (index < gameState.menuScroll) {
      index++;
      continue;
    }
    
    if (y > menuY + 280) break;
    
    const research = RESEARCH_TREE[key];
    const isResearched = gameState.researchedItems.includes(key);
    const isSelected = gameState.selectedResearch === key;
    
    if (isSelected) {
      p.fill(100, 150, 255, 100);
      p.rect(menuX + 5, y - 2, menuWidth - 10, 35, 3);
    }
    
    // Status indicator
    p.fill(isResearched ? [100, 255, 100] : [255, 100, 100]);
    p.rect(menuX + 10, y, 8, 8);
    
    // Name
    p.fill(isResearched ? 150 : 255);
    p.textSize(10);
    p.text(key, menuX + 25, y);
    
    // Cost and prerequisite
    p.textSize(9);
    p.fill(isResearched ? 100 : 200);
    p.text(`Cost: $${research.cost}`, menuX + 25, y + 14);
    if (research.prerequisite) {
      p.text(`Needs: ${research.prerequisite}`, menuX + 25, y + 24);
    }
    
    y += 38;
    index++;
  }
  
  // Instructions
  p.fill(200);
  p.textSize(9);
  p.text("Arrows: Select | Space: Research", menuX + 10, menuY + 285);
}

export function renderExpandMenu(p) {
  const menuX = GRID_OFFSET_X + GRID_COLS * GRID_SIZE + 20;
  const menuY = GRID_OFFSET_Y;
  const menuWidth = CANVAS_WIDTH - menuX - 10;
  
  p.fill(30, 30, 60, 230);
  p.noStroke();
  p.rect(menuX, menuY, menuWidth, 200, 5);
  
  p.fill(200, 100, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("EXPAND LAND", menuX + 10, menuY + 10);
  
  p.fill(255);
  p.textSize(10);
  p.text(`Current size: ${gameState.gridWidth}x${gameState.gridHeight}`, menuX + 10, menuY + 35);
  p.text(`Max size: ${GRID_COLS}x${GRID_ROWS}`, menuX + 10, menuY + 50);
  
  const expansionCost = (gameState.gridWidth + gameState.gridHeight - 8) * 150;
  p.text(`Expansion cost: $${expansionCost}`, menuX + 10, menuY + 70);
  
  if (gameState.gridWidth >= GRID_COLS && gameState.gridHeight >= GRID_ROWS) {
    p.fill(255, 100, 100);
    p.text("Maximum size reached!", menuX + 10, menuY + 90);
  }
  
  // Mascot scouting
  p.fill(200, 100, 255);
  p.textSize(12);
  p.text("SCOUT MASCOTS", menuX + 10, menuY + 120);
  
  if (gameState.canScoutMascot) {
    p.fill(100, 255, 100);
    p.textSize(10);
    p.text("Available this year!", menuX + 10, menuY + 140);
    
    if (gameState.mascots.length < MASCOTS.length) {
      const nextMascot = MASCOTS[gameState.mascots.length];
      p.fill(255);
      p.text(`Next: ${nextMascot.name}`, menuX + 10, menuY + 155);
      p.text(`Cost: $${nextMascot.cost}`, menuX + 10, menuY + 168);
      p.text(`Boost: +${nextMascot.popularityBoost} pop`, menuX + 10, menuY + 181);
    }
  } else {
    p.fill(255, 100, 100);
    p.textSize(10);
    p.text("Wait until next year", menuX + 10, menuY + 140);
  }
  
  // Instructions
  p.fill(200);
  p.textSize(9);
  p.text("Space: Expand/Scout", menuX + 10, menuY + 285);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function renderGameOverScreen(p) {
  p.background(20, 20, 40);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text(isWin ? "CONGRATULATIONS!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.fill(255);
  p.textSize(16);
  if (isWin) {
    p.text("You reached Rank 1!", CANVAS_WIDTH / 2, 150);
  }
  
  p.textSize(14);
  p.text(`Final Rank: ${gameState.rank}`, CANVAS_WIDTH / 2, 190);
  p.text(`Money: $${Math.floor(gameState.money)}`, CANVAS_WIDTH / 2, 215);
  p.text(`Satisfaction: ${Math.floor(gameState.satisfaction)}`, CANVAS_WIDTH / 2, 240);
  p.text(`Popularity: ${Math.floor(gameState.popularity)}`, CANVAS_WIDTH / 2, 265);
  p.text(`Year: ${gameState.year}`, CANVAS_WIDTH / 2, 290);
  p.text(`Attractions Built: ${gameState.attractions.length}`, CANVAS_WIDTH / 2, 315);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  const alpha = Math.sin(p.frameCount * 0.1) * 100 + 155;
  p.fill(255, 255, 100, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
}