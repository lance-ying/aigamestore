import { gameState, TILE_TYPES } from './globals.js';

function getTestWinAction(gameState) {
  // Optimal strategy to win: Focus on special enemies, manage health, use abilities
  
  // If path is active, try to extend or complete it
  if (gameState.currentPath.length > 0) {
    const lastTile = gameState.currentPath[gameState.currentPath.length - 1];
    
    // Look for adjacent valuable tiles
    const adjacent = [
      { x: lastTile.x - 1, y: lastTile.y, dx: -1, dy: 0 },
      { x: lastTile.x + 1, y: lastTile.y, dx: 1, dy: 0 },
      { x: lastTile.x, y: lastTile.y - 1, dx: 0, dy: -1 },
      { x: lastTile.x, y: lastTile.y + 1, dx: 0, dy: 1 }
    ];
    
    // Find best adjacent tile
    let bestScore = -999;
    let bestTile = null;
    
    for (const pos of adjacent) {
      if (pos.x < 0 || pos.x >= 8 || pos.y < 0 || pos.y >= 8) continue;
      
      const alreadyInPath = gameState.currentPath.some(t => t.x === pos.x && t.y === pos.y);
      if (alreadyInPath) continue;
      
      const tile = gameState.grid[pos.y][pos.x];
      let score = 0;
      
      if (tile.type === TILE_TYPES.WEAPON) score = 8;
      else if (tile.type === TILE_TYPES.MAGIC) score = 9;
      else if (tile.type === TILE_TYPES.SPECIAL_ENEMY) score = 20;
      else if (tile.type === TILE_TYPES.ENEMY) score = 10;
      else if (tile.type === TILE_TYPES.HEALTH && gameState.health < gameState.maxHealth * 0.7) score = 12;
      else if (tile.type === TILE_TYPES.GOLD) score = 6;
      else if (tile.type === TILE_TYPES.DEFENSE) score = 7;
      else if (tile.type === TILE_TYPES.ABILITY) score = 11;
      
      if (score > bestScore) {
        bestScore = score;
        bestTile = pos;
      }
    }
    
    if (bestTile && bestScore > 5) {
      // Move cursor to best tile
      if (bestTile.x < gameState.cursorX) return { keyCode: 37, key: "ArrowLeft" };
      if (bestTile.x > gameState.cursorX) return { keyCode: 39, key: "ArrowRight" };
      if (bestTile.y < gameState.cursorY) return { keyCode: 38, key: "ArrowUp" };
      if (bestTile.y > gameState.cursorY) return { keyCode: 40, key: "ArrowDown" };
    }
    
    // Complete path if we have 3+ tiles or can't extend
    if (gameState.currentPath.length >= 3 || !bestTile) {
      return { keyCode: 32, key: " " };
    }
    
    return { keyCode: 32, key: " " };
  }
  
  // Use ability if ready and needed
  if (gameState.currentAbility && gameState.abilityCooldown === 0) {
    if (gameState.health < gameState.maxHealth * 0.5 && gameState.currentAbility.effect === "heal") {
      return { keyCode: 90, key: "z" };
    }
    if (gameState.enemiesOnBoard.length > 5 && (gameState.currentAbility.effect === "damage" || gameState.currentAbility.effect === "aoe")) {
      return { keyCode: 90, key: "z" };
    }
  }
  
  // Find best starting tile
  let bestStart = null;
  let bestStartScore = -999;
  
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const tile = gameState.grid[y][x];
      let score = 0;
      
      if (tile.type === TILE_TYPES.SPECIAL_ENEMY) score = 25;
      else if (tile.type === TILE_TYPES.ENEMY) score = 15;
      else if (tile.type === TILE_TYPES.WEAPON) score = 10;
      else if (tile.type === TILE_TYPES.MAGIC) score = 11;
      else if (tile.type === TILE_TYPES.HEALTH && gameState.health < gameState.maxHealth * 0.7) score = 18;
      else if (tile.type === TILE_TYPES.GOLD) score = 8;
      else if (tile.type === TILE_TYPES.ABILITY) score = 14;
      
      if (score > bestStartScore) {
        bestStartScore = score;
        bestStart = { x, y };
      }
    }
  }
  
  if (bestStart) {
    // Move toward best start
    if (bestStart.x < gameState.cursorX) return { keyCode: 37, key: "ArrowLeft" };
    if (bestStart.x > gameState.cursorX) return { keyCode: 39, key: "ArrowRight" };
    if (bestStart.y < gameState.cursorY) return { keyCode: 38, key: "ArrowUp" };
    if (bestStart.y > gameState.cursorY) return { keyCode: 40, key: "ArrowDown" };
    
    // Start path
    return { keyCode: 32, key: " " };
  }
  
  return { keyCode: 32, key: " " };
}

function getBasicTestAction(gameState) {
  // Basic testing: random moves and connections
  const actions = [
    { keyCode: 37, key: "ArrowLeft" },
    { keyCode: 39, key: "ArrowRight" },
    { keyCode: 38, key: "ArrowUp" },
    { keyCode: 40, key: "ArrowDown" },
    { keyCode: 32, key: " " }
  ];
  
  const rand = Math.random();
  
  if (gameState.currentPath.length > 0 && rand < 0.3) {
    return { keyCode: 32, key: " " }; // Complete path
  }
  
  if (gameState.currentPath.length > 4) {
    return { keyCode: 32, key: " " }; // Complete long path
  }
  
  return actions[Math.floor(Math.random() * actions.length)];
}

function getSuboptimalTestAction(gameState) {
  // Suboptimal play: mostly random with occasional good moves
  const rand = Math.random();
  
  if (gameState.currentPath.length > 5) {
    return { keyCode: 32, key: " " };
  }
  
  if (rand < 0.7) {
    const moves = [
      { keyCode: 37, key: "ArrowLeft" },
      { keyCode: 39, key: "ArrowRight" },
      { keyCode: 38, key: "ArrowUp" },
      { keyCode: 40, key: "ArrowDown" }
    ];
    return moves[Math.floor(Math.random() * moves.length)];
  }
  
  return { keyCode: 32, key: " " };
}

function getGoldTestAction(gameState) {
  // Focus on collecting gold
  if (gameState.currentPath.length > 0) {
    const lastTile = gameState.currentPath[gameState.currentPath.length - 1];
    
    const adjacent = [
      { x: lastTile.x - 1, y: lastTile.y, dx: -1, dy: 0 },
      { x: lastTile.x + 1, y: lastTile.y, dx: 1, dy: 0 },
      { x: lastTile.x, y: lastTile.y - 1, dx: 0, dy: -1 },
      { x: lastTile.x, y: lastTile.y + 1, dx: 0, dy: 1 }
    ];
    
    for (const pos of adjacent) {
      if (pos.x < 0 || pos.x >= 8 || pos.y < 0 || pos.y >= 8) continue;
      
      const tile = gameState.grid[pos.y][pos.x];
      if (tile.type === TILE_TYPES.GOLD) {
        if (pos.x < gameState.cursorX) return { keyCode: 37, key: "ArrowLeft" };
        if (pos.x > gameState.cursorX) return { keyCode: 39, key: "ArrowRight" };
        if (pos.y < gameState.cursorY) return { keyCode: 38, key: "ArrowUp" };
        if (pos.y > gameState.cursorY) return { keyCode: 40, key: "ArrowDown" };
      }
    }
    
    if (gameState.currentPath.length >= 3) {
      return { keyCode: 32, key: " " };
    }
  }
  
  // Find gold tile
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const tile = gameState.grid[y][x];
      if (tile.type === TILE_TYPES.GOLD) {
        if (x < gameState.cursorX) return { keyCode: 37, key: "ArrowLeft" };
        if (x > gameState.cursorX) return { keyCode: 39, key: "ArrowRight" };
        if (y < gameState.cursorY) return { keyCode: 38, key: "ArrowUp" };
        if (y > gameState.cursorY) return { keyCode: 40, key: "ArrowDown" };
        return { keyCode: 32, key: " " };
      }
    }
  }
  
  return { keyCode: 32, key: " " };
}

function getAbilityTestAction(gameState) {
  // Test ability usage
  if (gameState.unlockedAbilities.length > 0 && gameState.abilityCooldown === 0) {
    return { keyCode: 90, key: "z" };
  }
  
  // Find ability tiles
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const tile = gameState.grid[y][x];
      if (tile.type === TILE_TYPES.ABILITY) {
        if (x < gameState.cursorX) return { keyCode: 37, key: "ArrowLeft" };
        if (x > gameState.cursorX) return { keyCode: 39, key: "ArrowRight" };
        if (y < gameState.cursorY) return { keyCode: 38, key: "ArrowUp" };
        if (y > gameState.cursorY) return { keyCode: 40, key: "ArrowDown" };
        return { keyCode: 32, key: " " };
      }
    }
  }
  
  return getTestWinAction(gameState);
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getSuboptimalTestAction(gameState);
    case "TEST_4":
      return getGoldTestAction(gameState);
    case "TEST_5":
      return getAbilityTestAction(gameState);
    default:
      return getBasicTestAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;