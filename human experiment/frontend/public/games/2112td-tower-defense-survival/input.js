import { gameState, TOWER_TYPES, GRID_SIZE, MAPS } from './globals.js';
import { Tower } from './entities.js';
import { startWave, canStartWave } from './waveManager.js';
import { generatePath, generateValidTowerPositions } from './pathGeneration.js';

export function handleKeyPressed(p, key, keyCode) {
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === "START") {
    if (keyCode === 13) {
      startMap(p, "EASY");
    }
  } else if (gameState.gamePhase === "PLAYING") {
    if (keyCode === 27) {
      pauseGame(p);
    } else if (keyCode === 32) {
      handleSpaceKey(p);
    } else if (keyCode === 90) {
      handleZKey();
    } else if (keyCode === 37 || keyCode === 39) {
      handleArrowKeys(keyCode);
    } else if (keyCode === 87) {
      // W key to start wave
      handleWaveStart(p);
    }
  } else if (gameState.gamePhase === "PAUSED") {
    if (keyCode === 27) {
      unpauseGame(p);
    }
  } else if (gameState.gamePhase === "MAP_COMPLETE") {
    if (keyCode === 13) {
      progressToNextMap(p);
    } else if (keyCode === 82) {
      restartGame(p);
    }
  } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
    if (keyCode === 82) {
      restartGame(p);
    }
  }
}

function progressToNextMap(p) {
  if (gameState.currentMap === "EASY") {
    startMap(p, "MEDIUM");
  } else if (gameState.currentMap === "MEDIUM") {
    startMap(p, "HARD");
  } else if (gameState.currentMap === "HARD") {
    gameState.gamePhase = "GAME_OVER_WIN";
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function startMap(p, mapKey) {
  const mapData = MAPS[mapKey];
  
  gameState.currentMap = mapKey;
  gameState.path = generatePath(mapKey);
  gameState.validTowerPositions = generateValidTowerPositions(gameState.path);
  
  gameState.gamePhase = "PLAYING";
  gameState.towers = [];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.entities = [];
  gameState.money = mapData.startMoney;
  gameState.wave = 0;
  gameState.waveActive = false;
  gameState.commandCenterHealth = 100;
  gameState.selectedTowerType = null;
  gameState.placementMode = false;
  gameState.selectedTower = null;
  gameState.enemiesReachedGoal = 0;
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", map: gameState.currentMap },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function handleWaveStart(p) {
  if (canStartWave()) {
    startWave();
    p.logs.game_info.push({
      data: { action: "START_WAVE", wave: gameState.wave },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function pauseGame(p) {
  gameState.gamePhase = "PAUSED";
  p.logs.game_info.push({
    data: { phase: "PAUSED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function unpauseGame(p) {
  gameState.gamePhase = "PLAYING";
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = "START";
  gameState.score = 0;
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function handleSpaceKey(p) {
  if (gameState.placementMode) {
    attemptTowerPlacement(p);
  } else if (gameState.selectedTower) {
    attemptTowerUpgrade(p);
  } else {
    enterPlacementMode();
  }
}

function handleZKey() {
  gameState.placementMode = false;
  gameState.selectedTower = null;
  gameState.selectedTowerType = null;
}

function handleArrowKeys(keyCode) {
  if (!gameState.placementMode) {
    const types = Object.keys(TOWER_TYPES);
    if (keyCode === 37) {
      gameState.selectedTowerIndex = (gameState.selectedTowerIndex - 1 + types.length) % types.length;
    } else if (keyCode === 39) {
      gameState.selectedTowerIndex = (gameState.selectedTowerIndex + 1) % types.length;
    }
  }
}

function enterPlacementMode() {
  const types = Object.keys(TOWER_TYPES);
  gameState.selectedTowerType = types[gameState.selectedTowerIndex];
  gameState.placementMode = true;
  gameState.previewX = 300;
  gameState.previewY = 200;
}

function attemptTowerPlacement(p) {
  const towerData = TOWER_TYPES[gameState.selectedTowerType];
  
  if (gameState.money < towerData.cost) {
    return;
  }
  
  let closestPos = null;
  let minDist = Infinity;
  
  for (const pos of gameState.validTowerPositions) {
    const dist = Math.sqrt((pos.x - gameState.previewX) ** 2 + (pos.y - gameState.previewY) ** 2);
    if (dist < minDist) {
      minDist = dist;
      closestPos = pos;
    }
  }
  
  if (closestPos && minDist < 25) {
    let canPlace = true;
    for (const tower of gameState.towers) {
      const dist = Math.sqrt((tower.x - closestPos.x) ** 2 + (tower.y - closestPos.y) ** 2);
      if (dist < 30) {
        canPlace = false;
        break;
      }
    }
    
    if (canPlace) {
      const newTower = new Tower(gameState.selectedTowerType, closestPos.x, closestPos.y, towerData);
      gameState.towers.push(newTower);
      gameState.entities.push(newTower);
      gameState.money -= towerData.cost;
      gameState.placementMode = false;
      gameState.selectedTowerType = null;
    }
  }
}

function attemptTowerUpgrade(p) {
  const tower = gameState.selectedTower;
  const upgradeCost = tower.getUpgradeCost();
  
  if (upgradeCost && gameState.money >= upgradeCost) {
    tower.upgrade();
    gameState.money -= upgradeCost;
  }
}

export function updatePlacementPreview(p) {
  if (!gameState.placementMode) return;
  
  if (p.keyIsDown(37)) {
    gameState.previewX = Math.max(GRID_SIZE, gameState.previewX - 2);
  }
  if (p.keyIsDown(39)) {
    gameState.previewX = Math.min(p.width - GRID_SIZE, gameState.previewX + 2);
  }
  if (p.keyIsDown(38)) {
    gameState.previewY = Math.max(GRID_SIZE, gameState.previewY - 2);
  }
  if (p.keyIsDown(40)) {
    gameState.previewY = Math.min(p.height - GRID_SIZE, gameState.previewY + 2);
  }
}