// game_logic.js
import { gameState, GAME_PHASES, FACILITY_TYPES, SHOP_ITEMS } from './globals.js';
import { Facility, Camper } from './entities.js';

export function initGame(p) {
  gameState.facilities = [];
  gameState.campers = [];
  gameState.score = 0;
  gameState.currency = 200;
  gameState.satisfaction = 0;
  gameState.maxCampers = 0;
  gameState.rating = 0;
  gameState.time = 0;
  gameState.dayNightCycle = 0;
  gameState.selectedFacilityType = null;
  gameState.shopMode = false;
  gameState.unlockedFacilities = ['tent', 'fishing', 'campfire'];
  gameState.campsiteWidth = 12;
  gameState.campsiteHeight = 8;
  gameState.cameraX = 0;
  gameState.cameraY = 0;
  gameState.camperSpawnTimer = 0;
  gameState.wishFulfillmentCount = 0;
  
  // Reset shop inventory
  SHOP_ITEMS.forEach(item => {
    gameState.shopInventory[item.id] = 0;
  });
}

export function updateGame(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  gameState.time++;
  gameState.dayNightCycle = (gameState.dayNightCycle + 0.005) % 1;
  
  // Spawn campers
  gameState.camperSpawnTimer++;
  const spawnRate = Math.max(20, 120 - Math.floor(gameState.rating * 10));
  
  if (gameState.camperSpawnTimer > spawnRate && gameState.campers.length < 100) {
    const tentCount = gameState.facilities.filter(f => f.type === 'tent').length;
    if (gameState.campers.length < tentCount * 2 + 5) {
      spawnCamper(p);
      gameState.camperSpawnTimer = 0;
    }
  }
  
  // Update campers
  gameState.campers.forEach(camper => {
    camper.update(gameState.facilities, gameState.gridSize);
  });
  
  // Calculate satisfaction and rating
  let totalSatisfaction = 0;
  gameState.campers.forEach(camper => {
    totalSatisfaction += camper.getSatisfaction();
  });
  gameState.satisfaction = gameState.campers.length > 0 ? totalSatisfaction / gameState.campers.length : 0;
  gameState.rating = Math.min(5, Math.floor((gameState.satisfaction / 10) * 5 * 10) / 10);
  
  // Update max campers
  if (gameState.campers.length > gameState.maxCampers) {
    gameState.maxCampers = gameState.campers.length;
  }
  
  // Currency from shop sales
  if (p.frameCount % 60 === 0) {
    let sales = 0;
    Object.keys(gameState.shopInventory).forEach(itemId => {
      const count = gameState.shopInventory[itemId];
      if (count > 0) {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        const sold = Math.min(count, Math.ceil(p.random(0.5, 2)));
        sales += sold * item.price;
        gameState.shopInventory[itemId] = Math.max(0, count - sold);
      }
    });
    gameState.currency += sales;
    if (sales > 0) {
      gameState.score += sales;
    }
  }
  
  // Currency from wish fulfillment
  gameState.score = gameState.wishFulfillmentCount * 10;
  
  // Unlock new facilities based on currency
  if (gameState.currency >= 300 && !gameState.unlockedFacilities.includes('bug')) {
    gameState.unlockedFacilities.push('bug');
  }
  if (gameState.currency >= 500 && !gameState.unlockedFacilities.includes('picnic')) {
    gameState.unlockedFacilities.push('picnic');
  }
  if (gameState.currency >= 800 && !gameState.unlockedFacilities.includes('playground')) {
    gameState.unlockedFacilities.push('playground');
  }
  
  // Check win condition
  if (gameState.rating >= 5.0 && gameState.maxCampers >= 100) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, rating: gameState.rating, maxCampers: gameState.maxCampers },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function spawnCamper(p) {
  const x = p.random(50, gameState.campsiteWidth * gameState.gridSize - 50);
  const y = p.random(50, gameState.campsiteHeight * gameState.gridSize - 50);
  const camper = new Camper(x, y, p);
  gameState.campers.push(camper);
}

export function placeFacility(gridX, gridY, type, p) {
  // Check if position is valid
  if (gridX < 0 || gridX >= gameState.campsiteWidth || gridY < 0 || gridY >= gameState.campsiteHeight) {
    return false;
  }
  
  // Check if spot is occupied
  const occupied = gameState.facilities.some(f => f.gridX === gridX && f.gridY === gridY);
  if (occupied) {
    return false;
  }
  
  // Check if type is unlocked
  if (!gameState.unlockedFacilities.includes(type)) {
    return false;
  }
  
  // Check cost
  const facilityData = FACILITY_TYPES[type.toUpperCase()];
  if (gameState.currency < facilityData.cost) {
    return false;
  }
  
  // Place facility
  gameState.currency -= facilityData.cost;
  const facility = new Facility(gridX, gridY, type, p);
  gameState.facilities.push(facility);
  return true;
}

export function removeFacility(gridX, gridY) {
  const index = gameState.facilities.findIndex(f => f.gridX === gridX && f.gridY === gridY);
  if (index !== -1) {
    const facility = gameState.facilities[index];
    const refund = Math.floor(FACILITY_TYPES[facility.type.toUpperCase()].cost * 0.5);
    gameState.currency += refund;
    gameState.facilities.splice(index, 1);
    return true;
  }
  return false;
}

export function purchaseShopItem(itemId, p) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return false;
  
  if (gameState.currency >= item.cost) {
    gameState.currency -= item.cost;
    gameState.shopInventory[itemId] = (gameState.shopInventory[itemId] || 0) + 1;
    return true;
  }
  return false;
}