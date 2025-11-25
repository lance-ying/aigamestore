// automated_testing_controller.js - Automated testing AI

import { gameState, TILL_ENERGY_COST, PLANT_ENERGY_COST, WATER_ENERGY_COST, HARVEST_ENERGY_COST } from './globals.js';

let lastAction = null;
let actionTimer = 0;
let currentStrategy = 'explore';
let targetTile = null;
let plantingPhase = 0; // 0: till, 1: plant, 2: water, 3: harvest

function getTestWinAction(gameState) {
  if (!gameState.player) return null;
  
  actionTimer--;
  if (actionTimer > 0 && lastAction) {
    return lastAction;
  }
  
  const player = gameState.player;
  const tilePos = player.getTilePosition();
  const currentTile = gameState.tiles[tilePos.y]?.[tilePos.x];
  
  // Strategy: Maximize farming efficiency
  // 1. If energy low, go to farmhouse
  if (gameState.energy < 20 && gameState.farmhouse) {
    const action = moveTowards(player, gameState.farmhouse.x + 30, gameState.farmhouse.y + 40);
    if (action) {
      lastAction = action;
      actionTimer = 5;
      return action;
    }
  }
  
  // 2. Find crops that need watering
  const unwatered = gameState.crops.filter(c => !c.watered && !c.mature);
  if (unwatered.length > 0 && gameState.energy >= WATER_ENERGY_COST) {
    const nearest = findNearest(player, unwatered);
    const action = moveToTileAndAct(player, nearest.gridX, nearest.gridY, 88); // X key
    if (action) {
      lastAction = action;
      actionTimer = action.keyCode === 88 ? 15 : 5;
      return action;
    }
  }
  
  // 3. Harvest mature crops
  const mature = gameState.crops.filter(c => c.mature);
  if (mature.length > 0 && gameState.energy >= HARVEST_ENERGY_COST) {
    const nearest = findNearest(player, mature);
    const action = moveToTileAndAct(player, nearest.gridX, nearest.gridY, 67); // C key
    if (action) {
      lastAction = action;
      actionTimer = action.keyCode === 67 ? 15 : 5;
      return action;
    }
  }
  
  // 4. Plant seeds on tilled soil
  const emptyTilled = [];
  for (let y = 5; y < 15; y++) {
    for (let x = 5; x < 25; x++) {
      const tile = gameState.tiles[y]?.[x];
      if (tile && tile.tilled && !tile.hasCrop) {
        emptyTilled.push({ gridX: x, gridY: y });
      }
    }
  }
  
  if (emptyTilled.length > 0 && gameState.energy >= PLANT_ENERGY_COST && gameState.gold >= 10) {
    const nearest = findNearest(player, emptyTilled);
    const action = moveToTileAndAct(player, nearest.gridX, nearest.gridY, 90); // Z key
    if (action) {
      lastAction = action;
      actionTimer = action.keyCode === 90 ? 15 : 5;
      return action;
    }
  }
  
  // 5. Till soil in organized rows
  const untilledInRange = [];
  for (let y = 5; y < 15; y++) {
    for (let x = 5; x < 25; x++) {
      const tile = gameState.tiles[y]?.[x];
      if (tile && !tile.tilled) {
        untilledInRange.push({ gridX: x, gridY: y });
      }
    }
  }
  
  if (untilledInRange.length > 0 && gameState.energy >= TILL_ENERGY_COST) {
    const nearest = findNearest(player, untilledInRange);
    const action = moveToTileAndAct(player, nearest.gridX, nearest.gridY, 32); // Space key
    if (action) {
      lastAction = action;
      actionTimer = action.keyCode === 32 ? 15 : 5;
      return action;
    }
  }
  
  // 6. Wait/explore
  return getRandomMovement();
}

function getBasicTestAction(gameState) {
  if (!gameState.player) return null;
  
  actionTimer--;
  if (actionTimer > 0 && lastAction) {
    return lastAction;
  }
  
  const player = gameState.player;
  const tilePos = player.getTilePosition();
  
  // Basic test: till, plant, water, harvest cycle
  switch (plantingPhase) {
    case 0: // Till soil
      if (gameState.energy >= TILL_ENERGY_COST) {
        const untilled = findNearbyUntilledTile(player);
        if (untilled) {
          const action = moveToTileAndAct(player, untilled.gridX, untilled.gridY, 32);
          if (action) {
            if (action.keyCode === 32) plantingPhase = 1;
            lastAction = action;
            actionTimer = action.keyCode === 32 ? 15 : 5;
            return action;
          }
        }
        plantingPhase = 1;
      }
      break;
      
    case 1: // Plant seeds
      if (gameState.energy >= PLANT_ENERGY_COST && gameState.gold >= 10) {
        const emptyTilled = findNearbyEmptyTilledTile(player);
        if (emptyTilled) {
          const action = moveToTileAndAct(player, emptyTilled.gridX, emptyTilled.gridY, 90);
          if (action) {
            if (action.keyCode === 90) plantingPhase = 2;
            lastAction = action;
            actionTimer = action.keyCode === 90 ? 15 : 5;
            return action;
          }
        }
        plantingPhase = 2;
      }
      break;
      
    case 2: // Water crops
      if (gameState.energy >= WATER_ENERGY_COST) {
        const unwatered = gameState.crops.find(c => !c.watered);
        if (unwatered) {
          const action = moveToTileAndAct(player, unwatered.gridX, unwatered.gridY, 88);
          if (action) {
            lastAction = action;
            actionTimer = action.keyCode === 88 ? 15 : 5;
            return action;
          }
        } else {
          plantingPhase = 3;
        }
      }
      break;
      
    case 3: // Harvest
      const mature = gameState.crops.find(c => c.mature);
      if (mature && gameState.energy >= HARVEST_ENERGY_COST) {
        const action = moveToTileAndAct(player, mature.gridX, mature.gridY, 67);
        if (action) {
          if (action.keyCode === 67) plantingPhase = 0;
          lastAction = action;
          actionTimer = action.keyCode === 67 ? 15 : 5;
          return action;
        }
      } else {
        // Wait for crops to mature or reset
        if (gameState.crops.length === 0) {
          plantingPhase = 0;
        }
      }
      break;
  }
  
  // Return to farmhouse if energy low
  if (gameState.energy < 15 && gameState.farmhouse) {
    return moveTowards(player, gameState.farmhouse.x + 30, gameState.farmhouse.y + 40);
  }
  
  return getRandomMovement();
}

function moveTowards(player, targetX, targetY) {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance < 10) return null;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    return { keyCode: dx > 0 ? 39 : 37 }; // Right or Left
  } else {
    return { keyCode: dy > 0 ? 40 : 38 }; // Down or Up
  }
}

function moveToTileAndAct(player, tileX, tileY, actionKey) {
  const targetX = tileX * 20 + 10;
  const targetY = tileY * 20 + 10;
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance < 15) {
    return { keyCode: actionKey };
  }
  
  if (Math.abs(dx) > Math.abs(dy)) {
    return { keyCode: dx > 0 ? 39 : 37 };
  } else {
    return { keyCode: dy > 0 ? 40 : 38 };
  }
}

function findNearest(player, targets) {
  let nearest = targets[0];
  let minDist = Infinity;
  
  targets.forEach(target => {
    const targetX = target.x || (target.gridX * 20 + 10);
    const targetY = target.y || (target.gridY * 20 + 10);
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const dist = dx * dx + dy * dy;
    
    if (dist < minDist) {
      minDist = dist;
      nearest = target;
    }
  });
  
  return nearest;
}

function findNearbyUntilledTile(player) {
  const tilePos = player.getTilePosition();
  
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const x = tilePos.x + dx;
      const y = tilePos.y + dy;
      const tile = gameState.tiles[y]?.[x];
      if (tile && !tile.tilled && x > 3 && x < 27 && y > 3 && y < 17) {
        return { gridX: x, gridY: y };
      }
    }
  }
  return null;
}

function findNearbyEmptyTilledTile(player) {
  const tilePos = player.getTilePosition();
  
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const x = tilePos.x + dx;
      const y = tilePos.y + dy;
      const tile = gameState.tiles[y]?.[x];
      if (tile && tile.tilled && !tile.hasCrop) {
        return { gridX: x, gridY: y };
      }
    }
  }
  return null;
}

function getRandomMovement() {
  const movements = [37, 38, 39, 40]; // Arrow keys
  return { keyCode: movements[Math.floor(Math.random() * movements.length)] };
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;