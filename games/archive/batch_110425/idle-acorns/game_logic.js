// game_logic.js - Core game logic and win conditions

import { gameState, GAME_PHASES, AREAS } from './globals.js';
import { GardenPlot } from './garden.js';

export function initializeGame() {
  // Reset game state
  gameState.acorns = 0;
  gameState.fish = 0;
  gameState.crops = 0;
  gameState.craftedItems = 0;
  gameState.currentArea = AREAS.SHOP;
  gameState.unlockedAreas = [AREAS.SHOP];
  gameState.scavengers = 0;
  gameState.autoCollectEnabled = false;
  gameState.score = 0;
  gameState.totalAcornsCollected = 0;
  
  // Reset upgrades
  gameState.upgrades = {
    clickPower: 1,
    scavengerEfficiency: 1,
    unlockPond: false,
    unlockGarden: false,
    unlockCampfire: false,
    fishingSkill: 1,
    gardenSize: 1,
    cookingSkill: 1
  };
  
  // Reset fishing
  gameState.fishingState = {
    casting: false,
    castProgress: 0,
    catchWindow: 0,
    catchWindowActive: false
  };
  
  // Reset garden
  gameState.gardenPlots = [];
  gameState.maxPlots = 3;
  for (let i = 0; i < 3; i++) {
    gameState.gardenPlots.push(new GardenPlot(0, 0));
  }
  
  // Reset timing
  gameState.lastUpdate = Date.now();
  gameState.totalPlayTime = 0;
  
  // Win conditions
  gameState.targetCraftedItems = 24;
  gameState.maxScavengers = 10;
  gameState.allAreasUnlocked = false;
  gameState.allUpgradesMaxed = false;
}

export function updatePassiveIncome(deltaTime) {
  if (!gameState.autoCollectEnabled || gameState.scavengers === 0) return;
  
  const acornsPerSecond = gameState.scavengers * gameState.scavengerRate;
  const acornsGained = acornsPerSecond * (deltaTime / 1000);
  
  gameState.acorns += acornsGained;
  gameState.totalAcornsCollected += acornsGained;
}

export function collectAcorn() {
  const amount = gameState.upgrades.clickPower;
  gameState.acorns += amount;
  gameState.totalAcornsCollected += amount;
  gameState.score += amount;
}

export function checkWinCondition() {
  // Win condition: Craft 24 items AND max out all upgrades
  const itemsComplete = gameState.craftedItems >= gameState.targetCraftedItems;
  const scavengersMaxed = gameState.scavengers >= gameState.maxScavengers;
  const allAreasUnlocked = gameState.unlockedAreas.length === 4;
  
  // Check if all purchasable upgrades are maxed
  const clickMaxed = gameState.upgrades.clickPower >= 11; // 1 base + 10 upgrades
  const fishingMaxed = gameState.upgrades.fishingSkill >= 6; // 1 base + 5 upgrades
  const gardenMaxed = gameState.upgrades.gardenSize >= 5; // 1 base + 4 upgrades
  const cookingMaxed = gameState.upgrades.cookingSkill >= 6; // 1 base + 5 upgrades
  
  const allUpgradesMaxed = clickMaxed && fishingMaxed && gardenMaxed && cookingMaxed;
  
  if (itemsComplete && scavengersMaxed && allAreasUnlocked && allUpgradesMaxed) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    return true;
  }
  
  return false;
}

export function navigateArea(direction) {
  const currentIndex = gameState.unlockedAreas.indexOf(gameState.currentArea);
  let newIndex;
  
  if (direction === 'left') {
    newIndex = currentIndex - 1;
    if (newIndex < 0) newIndex = gameState.unlockedAreas.length - 1;
  } else {
    newIndex = currentIndex + 1;
    if (newIndex >= gameState.unlockedAreas.length) newIndex = 0;
  }
  
  gameState.currentArea = gameState.unlockedAreas[newIndex];
}