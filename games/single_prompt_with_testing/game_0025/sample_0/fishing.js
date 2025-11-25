// fishing.js - Fishing mechanics

import { gameState, FISHING_STATES, FISH_TYPES, WATER_ZONES, ROD_UPGRADES } from './globals.js';

export function initFishing() {
  gameState.fishingState = FISHING_STATES.IDLE;
  gameState.currentFish = null;
  gameState.fishingTimer = 0;
  gameState.biteWindow = 0;
  gameState.fishingLine = null;
  gameState.currentZone = null;
  gameState.reactionTime = 0;
}

export function startCasting(p) {
  if (gameState.fishingState === FISHING_STATES.IDLE) {
    gameState.fishingState = FISHING_STATES.CASTING;
    gameState.fishingTimer = 30; // Animation frames
    
    // Determine which zone player is fishing in
    const playerCenterX = gameState.player.x + gameState.player.width / 2;
    gameState.currentZone = determineZone(playerCenterX);
    
    // Calculate bobber position
    const castDistance = 80 + gameState.rodLevel * 20;
    gameState.bobberPosition = {
      x: playerCenterX + castDistance * gameState.player.facing,
      y: gameState.currentZone ? 
         (gameState.currentZone.name === "Golden Spot" ? 200 : 
          gameState.currentZone.name === "Deep Water" ? 280 : 250) : 250
    };
  }
}

export function determineZone(x) {
  for (let zoneKey in WATER_ZONES) {
    const zone = WATER_ZONES[zoneKey];
    if (x >= zone.minX && x <= zone.maxX) {
      return { ...zone, key: zoneKey };
    }
  }
  return null;
}

export function updateFishing(p) {
  switch (gameState.fishingState) {
    case FISHING_STATES.CASTING:
      gameState.fishingTimer--;
      if (gameState.fishingTimer <= 0) {
        gameState.fishingState = FISHING_STATES.WAITING;
        // Random wait time before bite (2-6 seconds at 60fps)
        gameState.fishingTimer = p.floor(p.random(120, 360));
        selectRandomFish(p);
      }
      break;
      
    case FISHING_STATES.WAITING:
      gameState.fishingTimer--;
      if (gameState.fishingTimer <= 0) {
        if (gameState.currentFish) {
          gameState.fishingState = FISHING_STATES.BITING;
          // Short window to react (1-2 seconds)
          gameState.biteWindow = p.floor(p.random(60, 120));
          gameState.reactionTime = 0;
        } else {
          // No fish, return to idle
          gameState.fishingState = FISHING_STATES.IDLE;
        }
      }
      break;
      
    case FISHING_STATES.BITING:
      gameState.biteWindow--;
      gameState.reactionTime++;
      if (gameState.biteWindow <= 0) {
        // Missed the bite
        gameState.fishingState = FISHING_STATES.IDLE;
        gameState.currentFish = null;
      }
      break;
      
    case FISHING_STATES.REELING:
      gameState.fishingTimer--;
      if (gameState.fishingTimer <= 0) {
        gameState.fishingState = FISHING_STATES.CAUGHT;
        gameState.fishingTimer = 60; // Show caught fish for 1 second
      }
      break;
      
    case FISHING_STATES.CAUGHT:
      gameState.fishingTimer--;
      if (gameState.fishingTimer <= 0) {
        completeCatch();
        gameState.fishingState = FISHING_STATES.IDLE;
      }
      break;
  }
}

export function reelIn(p) {
  if (gameState.fishingState === FISHING_STATES.BITING) {
    // Attempt to catch
    const rod = ROD_UPGRADES[gameState.rodLevel];
    const catchSuccess = p.random() < rod.catchChance;
    
    if (catchSuccess) {
      gameState.fishingState = FISHING_STATES.REELING;
      gameState.fishingTimer = 30; // Reeling animation
    } else {
      // Fish got away
      gameState.fishingState = FISHING_STATES.IDLE;
      gameState.currentFish = null;
    }
  } else if (gameState.fishingState === FISHING_STATES.WAITING || 
             gameState.fishingState === FISHING_STATES.CASTING) {
    // Cancel fishing
    gameState.fishingState = FISHING_STATES.IDLE;
    gameState.currentFish = null;
  }
}

function selectRandomFish(p) {
  if (!gameState.currentZone) {
    gameState.currentFish = null;
    return;
  }
  
  const rod = ROD_UPGRADES[gameState.rodLevel];
  const availableFish = FISH_TYPES.filter(fish => 
    fish.requiredRod <= gameState.rodLevel &&
    fish.zone === gameState.currentZone.key
  );
  
  if (availableFish.length === 0) {
    gameState.currentFish = null;
    return;
  }
  
  // Weight by rarity (inverse)
  const weights = availableFish.map(fish => 1 / fish.rarity);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const random = p.random() * totalWeight;
  
  let cumulative = 0;
  for (let i = 0; i < availableFish.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      gameState.currentFish = { ...availableFish[i] };
      return;
    }
  }
  
  gameState.currentFish = { ...availableFish[0] };
}

function completeCatch() {
  if (gameState.currentFish) {
    gameState.money += gameState.currentFish.value;
    gameState.score += gameState.currentFish.value;
    gameState.totalFishCaught++;
    gameState.caughtFish.push({ ...gameState.currentFish, time: Date.now() });
    gameState.journal.add(gameState.currentFish.id);
    
    // Update mastery level
    gameState.masteryLevel = calculateMasteryLevel();
    
    gameState.currentFish = null;
  }
}

function calculateMasteryLevel() {
  const uniqueFish = gameState.journal.size;
  const totalFish = gameState.totalFishCaught;
  return Math.min(5, Math.floor(uniqueFish / 3) + Math.floor(totalFish / 20));
}

export function canUpgradeRod() {
  const nextRod = ROD_UPGRADES[gameState.rodLevel + 1];
  return nextRod && gameState.money >= nextRod.cost;
}

export function upgradeRod() {
  const nextRod = ROD_UPGRADES[gameState.rodLevel + 1];
  if (nextRod && gameState.money >= nextRod.cost) {
    gameState.money -= nextRod.cost;
    gameState.rodLevel++;
    return true;
  }
  return false;
}