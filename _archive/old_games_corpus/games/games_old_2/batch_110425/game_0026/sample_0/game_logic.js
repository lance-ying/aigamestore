// game_logic.js - Core game logic

import { 
  gameState, 
  ATTRACTIONS, 
  RESEARCH_TREE, 
  MASCOTS,
  MODE_BUILD,
  MODE_RESEARCH,
  MODE_EXPAND,
  GRID_COLS,
  GRID_ROWS,
  PHASE_PLAYING,
  PHASE_GAME_OVER_WIN
} from './globals.js';
import { Attraction, Guest, Mascot } from './entities.js';

export function canPlaceAttraction(type, gridX, gridY) {
  const config = ATTRACTIONS[type];
  if (!config.unlocked) return false;
  if (gameState.money < config.cost) return false;
  
  // Check if all cells are unlocked and unoccupied
  for (let dy = 0; dy < config.size; dy++) {
    for (let dx = 0; dx < config.size; dx++) {
      const checkX = gridX + dx;
      const checkY = gridY + dy;
      
      if (checkX >= GRID_COLS || checkY >= GRID_ROWS) return false;
      if (!gameState.grid[checkY][checkX].unlocked) return false;
      if (gameState.grid[checkY][checkX].occupied) return false;
    }
  }
  
  return true;
}

export function placeAttraction(p, type, gridX, gridY) {
  if (!canPlaceAttraction(type, gridX, gridY)) return false;
  
  const config = ATTRACTIONS[type];
  const attraction = new Attraction(type, gridX, gridY);
  
  // Mark grid cells as occupied
  for (let dy = 0; dy < config.size; dy++) {
    for (let dx = 0; dx < config.size; dx++) {
      gameState.grid[gridY + dy][gridX + dx].occupied = true;
      gameState.grid[gridY + dy][gridX + dx].attraction = attraction;
    }
  }
  
  gameState.attractions.push(attraction);
  gameState.money -= config.cost;
  
  return true;
}

export function canResearch(researchKey) {
  const research = RESEARCH_TREE[researchKey];
  if (!research) return false;
  if (gameState.researchedItems.includes(researchKey)) return false;
  if (gameState.money < research.cost) return false;
  
  // Check prerequisite
  if (research.prerequisite && !gameState.researchedItems.includes(research.prerequisite)) {
    return false;
  }
  
  return true;
}

export function performResearch(researchKey) {
  if (!canResearch(researchKey)) return false;
  
  const research = RESEARCH_TREE[researchKey];
  gameState.money -= research.cost;
  gameState.researchedItems.push(researchKey);
  
  // Unlock attraction or upgrade
  if (research.unlocks.startsWith("EFFICIENCY")) {
    gameState.efficiencyLevel++;
  } else if (research.unlocks.startsWith("CAPACITY")) {
    gameState.capacityLevel++;
    gameState.maxGuests += 5;
  } else if (ATTRACTIONS[research.unlocks]) {
    ATTRACTIONS[research.unlocks].unlocked = true;
  }
  
  return true;
}

export function canExpandLand() {
  const expansionCost = (gameState.gridWidth + gameState.gridHeight - 8) * 150;
  return gameState.money >= expansionCost;
}

export function expandLand() {
  if (!canExpandLand()) return false;
  
  const expansionCost = (gameState.gridWidth + gameState.gridHeight - 8) * 150;
  gameState.money -= expansionCost;
  
  // Expand in the direction with less space
  if (gameState.gridWidth <= gameState.gridHeight && gameState.gridWidth < GRID_COLS) {
    gameState.gridWidth++;
    // Unlock new column
    for (let y = 0; y < GRID_ROWS; y++) {
      if (gameState.grid[y][gameState.gridWidth - 1]) {
        gameState.grid[y][gameState.gridWidth - 1].unlocked = true;
      }
    }
  } else if (gameState.gridHeight < GRID_ROWS) {
    gameState.gridHeight++;
    // Unlock new row
    for (let x = 0; x < GRID_COLS; x++) {
      if (gameState.grid[gameState.gridHeight - 1][x]) {
        gameState.grid[gameState.gridHeight - 1][x].unlocked = true;
      }
    }
  }
  
  return true;
}

export function canScoutMascot(mascotIndex) {
  if (!gameState.canScoutMascot) return false;
  if (mascotIndex >= MASCOTS.length) return false;
  
  const mascot = MASCOTS[mascotIndex];
  return gameState.money >= mascot.cost;
}

export function scoutMascot(p, mascotIndex) {
  if (!canScoutMascot(mascotIndex)) return false;
  
  const mascotConfig = MASCOTS[mascotIndex];
  gameState.money -= mascotConfig.cost;
  
  const mascot = new Mascot(
    mascotConfig,
    p.random(100, 500),
    p.random(150, 300)
  );
  
  gameState.mascots.push(mascot);
  gameState.popularity += mascotConfig.popularityBoost;
  gameState.canScoutMascot = false;
  
  return true;
}

export function updateGuests(p) {
  // Update existing guests
  for (let i = gameState.guests.length - 1; i >= 0; i--) {
    const guest = gameState.guests[i];
    guest.update(p, gameState.attractions, gameState);
    
    if (guest.shouldRemove()) {
      gameState.satisfaction += Math.floor(guest.happiness / 10);
      gameState.guests.splice(i, 1);
    }
  }
  
  // Spawn new guests
  gameState.guestSpawnTimer++;
  if (gameState.guestSpawnTimer >= gameState.guestSpawnInterval) {
    if (gameState.guests.length < gameState.maxGuests && gameState.attractions.length > 0) {
      gameState.guests.push(new Guest(p));
      gameState.guestSpawnTimer = 0;
    }
  }
}

export function updateRankings() {
  // Calculate rank based on satisfaction and popularity
  const totalScore = gameState.satisfaction + gameState.popularity;
  
  if (totalScore >= 1000) gameState.rank = 1;
  else if (totalScore >= 800) gameState.rank = 2;
  else if (totalScore >= 600) gameState.rank = 3;
  else if (totalScore >= 400) gameState.rank = 4;
  else if (totalScore >= 300) gameState.rank = 5;
  else if (totalScore >= 200) gameState.rank = 6;
  else if (totalScore >= 120) gameState.rank = 7;
  else if (totalScore >= 60) gameState.rank = 8;
  else if (totalScore >= 30) gameState.rank = 9;
  else gameState.rank = 10;
  
  // Check win condition
  if (gameState.rank === 1 && gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
  }
}

export function updateYearProgress(p) {
  gameState.dayCounter++;
  
  // One year = 1800 frames (30 seconds at 60 fps)
  if (gameState.dayCounter >= 1800) {
    gameState.year++;
    gameState.dayCounter = 0;
    gameState.canScoutMascot = true;
    
    // Log year change
    p.logs.game_info.push({
      data: { event: "year_change", year: gameState.year },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}