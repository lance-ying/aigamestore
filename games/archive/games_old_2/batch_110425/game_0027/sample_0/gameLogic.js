// gameLogic.js - Core game logic

import { gameState, FACILITY_TYPES, GRID_SIZE } from './globals.js';
import { Facility, Guest } from './entities.js';

export function updateGame(p) {
  gameState.frameCount++;

  // Spawn guests
  gameState.guestSpawnTimer++;
  if (gameState.guestSpawnTimer > 180 && gameState.facilities.length > 0) {
    spawnGuest(p);
    gameState.guestSpawnTimer = 0;
  }

  // Update guests
  gameState.guests = gameState.guests.filter(guest => {
    guest.update(p, gameState.facilities);
    return guest.state !== 'leaving';
  });

  // Update facilities
  gameState.facilities.forEach(facility => {
    facility.update(gameState.frameCount);
  });

  // Calculate park rating
  updateParkRating();

  // Check unlock conditions
  checkUnlocks();

  // Check win/lose conditions
  checkGameOver(p);

  // Log player info periodically
  if (gameState.frameCount % 60 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.selectedTile.x * GRID_SIZE,
      screen_y: gameState.selectedTile.y * GRID_SIZE,
      game_x: gameState.selectedTile.x,
      game_y: gameState.selectedTile.y,
      framecount: p.frameCount
    });
  }
}

export function spawnGuest(p) {
  const guest = new Guest(p);
  gameState.guests.push(guest);
  gameState.entities.push(guest);
}

export function placeFacility(p) {
  const facilityKey = gameState.unlockedFacilities[gameState.menuIndex];
  const facilityType = FACILITY_TYPES[facilityKey];
  
  const gridX = gameState.selectedTile.x;
  const gridY = gameState.selectedTile.y;

  if (gameState.gridOccupied[gridY][gridX] !== null) {
    return; // Already occupied
  }

  if (gameState.money < facilityType.cost) {
    return; // Not enough money
  }

  gameState.money -= facilityType.cost;
  const facility = new Facility(facilityType, gridX, gridY);
  gameState.facilities.push(facility);
  gameState.entities.push(facility);
  gameState.gridOccupied[gridY][gridX] = facility;
  gameState.selectedFacility = null;
  gameState.menuOpen = false;
}

function updateParkRating() {
  const facilityCount = gameState.facilities.length;
  const friendCount = gameState.snsFriends;
  const varietyBonus = new Set(gameState.facilities.map(f => f.type.name)).size;
  
  gameState.parkRating = 1.0 + (facilityCount * 0.1) + (friendCount * 0.05) + (varietyBonus * 0.15);
  gameState.parkRating = Math.min(5.0, gameState.parkRating);
}

function checkUnlocks() {
  if (gameState.snsFriends >= 5 && !gameState.unlockedFacilities.includes('SLIDE')) {
    gameState.unlockedFacilities.push('SLIDE');
  }
  if (gameState.snsFriends >= 8 && !gameState.unlockedFacilities.includes('GIFT_SHOP')) {
    gameState.unlockedFacilities.push('GIFT_SHOP');
  }
  if (gameState.snsFriends >= 12 && !gameState.unlockedFacilities.includes('WAVE_POOL')) {
    gameState.unlockedFacilities.push('WAVE_POOL');
  }
  if (gameState.snsFriends >= 15 && !gameState.unlockedFacilities.includes('LAZY_RIVER')) {
    gameState.unlockedFacilities.push('LAZY_RIVER');
  }
  if (gameState.snsFriends >= 18 && !gameState.unlockedFacilities.includes('OUTDOOR_POOL')) {
    gameState.unlockedFacilities.push('OUTDOOR_POOL');
  }
}

function checkGameOver(p) {
  // Win condition: High rating and friends
  if (gameState.parkRating >= 4.0 && gameState.snsFriends >= 20) {
    gameState.gamePhase = 'GAME_OVER_WIN';
    p.logs.game_info.push({
      data: { phase: 'GAME_OVER_WIN', finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Lose condition: Running out of money with no facilities
  if (gameState.money < 50 && gameState.facilities.length === 0 && gameState.frameCount > 600) {
    gameState.gamePhase = 'GAME_OVER_LOSE';
    p.logs.game_info.push({
      data: { phase: 'GAME_OVER_LOSE', finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}