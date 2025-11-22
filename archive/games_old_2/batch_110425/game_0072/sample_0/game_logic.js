// game_logic.js - Core game logic
import { gameState, GAME_PHASES } from './globals.js';
import { Staff, Citizen, Tower, Platform, ExitPortal } from './entities.js';
import { getLevel } from './levels.js';

export function initializeLevel(p, levelIndex) {
  const level = getLevel(levelIndex);
  
  // Clear existing entities
  gameState.citizens = [];
  gameState.entities = [];
  gameState.bridges = [];
  gameState.platforms = [];
  gameState.tower = null;
  gameState.selectedCitizen = null;
  gameState.citizensReachedExit = 0;

  // Create platforms
  for (let platformData of level.platforms) {
    const platform = new Platform(
      p,
      platformData.x,
      platformData.y,
      platformData.width,
      platformData.height
    );
    gameState.platforms.push(platform);
  }

  // Create staff
  gameState.player = new Staff(p, level.staffStart.x, level.staffStart.y);
  
  // Create citizens
  let citizenId = 0;
  for (let pos of level.citizenStartPositions) {
    const citizen = new Citizen(p, pos.x, pos.y, citizenId++);
    gameState.citizens.push(citizen);
    gameState.entities.push(citizen);
  }

  gameState.totalCitizens = gameState.citizens.length;

  // Create exit portal
  gameState.exitPortal = new ExitPortal(p, level.exitPortal.x, level.exitPortal.y);

  // Store level data
  gameState.currentLevelData = level;
}

export function updateGame(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;

  // Update staff
  if (gameState.player) {
    gameState.player.update(gameState.keys);
  }

  // Update tower
  if (gameState.tower) {
    const bridge = gameState.tower.update();
    if (bridge) {
      gameState.bridges.push(bridge);
      gameState.tower = null;
    }
  }

  // Update citizens
  for (let citizen of gameState.citizens) {
    if (citizen.state !== "tower") {
      citizen.update(gameState.player, gameState.platforms, gameState);
    } else if (gameState.tower) {
      // Update tower citizen positions
      citizen.x = gameState.tower.x;
      citizen.y = gameState.tower.baseY - (citizen.towerIndex * citizen.radius * 2.5);
    }
  }

  // Update exit portal
  if (gameState.exitPortal) {
    gameState.exitPortal.update();
  }

  // Check win/lose conditions
  checkGameOver();

  gameState.frameCount++;
}

export function checkGameOver() {
  const aliveCitizens = gameState.citizens.filter(c => c.state !== "dead").length;
  const minRequired = gameState.currentLevelData.minCitizensToWin;
  
  // Win condition
  if (gameState.citizensReachedExit >= minRequired) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    gameState.score += 1000 + (gameState.citizensReachedExit - minRequired) * 500;
    return;
  }

  // Lose condition - not enough citizens alive to win
  if (aliveCitizens < minRequired) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    return;
  }
}

export function handleCitizenSelection(p) {
  if (!gameState.keys.z) return;

  // Find closest following citizen to staff
  let closestCitizen = null;
  let closestDist = Infinity;

  for (let citizen of gameState.citizens) {
    if (citizen.state === "following") {
      const dist = p.dist(citizen.x, citizen.y, gameState.player.x, gameState.player.y);
      if (dist < closestDist && dist < 50) {
        closestDist = dist;
        closestCitizen = citizen;
      }
    }
  }

  if (closestCitizen && !gameState.selectedCitizen) {
    gameState.selectedCitizen = closestCitizen;
    closestCitizen.state = "selected";
  } else if (gameState.selectedCitizen && closestCitizen && closestCitizen !== gameState.selectedCitizen) {
    // Add to tower
    addToTower(p, closestCitizen);
  }
}

export function addToTower(p, citizen) {
  if (!gameState.tower && gameState.selectedCitizen) {
    // Create new tower with selected citizen
    const baseCitizen = gameState.selectedCitizen;
    gameState.tower = new Tower(
      p,
      baseCitizen.x,
      baseCitizen.y + baseCitizen.radius,
      [baseCitizen]
    );
    baseCitizen.state = "tower";
    baseCitizen.towerIndex = 0;
    gameState.selectedCitizen = null;
  }

  if (gameState.tower && gameState.tower.citizens.length < 5) {
    const towerIndex = gameState.tower.citizens.length;
    citizen.state = "tower";
    citizen.towerIndex = towerIndex;
    gameState.tower.citizens.push(citizen);
  }
}

export function handleTowerTopple() {
  if (!gameState.tower) return;

  if (gameState.keys.left) {
    gameState.tower.startTopple(-1);
  } else if (gameState.keys.right) {
    gameState.tower.startTopple(1);
  }
}

export function releaseCitizen() {
  if (gameState.selectedCitizen) {
    gameState.selectedCitizen.state = "following";
    gameState.selectedCitizen = null;
  }
}