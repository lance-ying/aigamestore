// automated-testing.js - Automated testing controllers

import { gameState, GAME_PHASES } from './globals.js';
import { tillPlot, plantCrop, harvestPlot, placeBuilding, collectAnimal, upgradeFarmhouse } from './game-logic.js';

export function getAutomatedAction() {
  if (gameState.controlMode === "HUMAN") {
    return null;
  }
  
  if (gameState.controlMode === "TEST_1") {
    return getBasicTestAction();
  } else if (gameState.controlMode === "TEST_2") {
    return getWinTestAction();
  }
  
  return null;
}

function getBasicTestAction() {
  // Basic testing: till, plant, harvest cycle
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { type: "START_GAME" };
  }
  
  // Find empty plot to till
  for (let plot of gameState.farmPlots) {
    if (plot.state === "empty" && gameState.frameCounter % 30 === 0) {
      tillPlot(plot.gridX, plot.gridY);
      return { type: "TILL", gridX: plot.gridX, gridY: plot.gridY };
    }
  }
  
  // Find tilled plot to plant
  for (let plot of gameState.farmPlots) {
    if (plot.state === "tilled" && gameState.frameCounter % 30 === 5) {
      gameState.selectedCrop = "WHEAT";
      plantCrop("WHEAT");
      return { type: "PLANT", gridX: plot.gridX, gridY: plot.gridY };
    }
  }
  
  // Harvest ready crops
  for (let plot of gameState.farmPlots) {
    if (plot.state === "ready" && gameState.frameCounter % 30 === 10) {
      harvestPlot(plot.gridX, plot.gridY);
      return { type: "HARVEST", gridX: plot.gridX, gridY: plot.gridY };
    }
  }
  
  return { type: "WAIT" };
}

function getWinTestAction() {
  // Win test: accelerated progression to win condition
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { type: "START_GAME" };
  }
  
  // Cheat to speed up testing
  if (gameState.frameCounter === 60) {
    gameState.coins = 10000;
    gameState.wood = 1000;
    gameState.stone = 1000;
    gameState.xp = 3000;
  }
  
  // Build required buildings
  const buildingsNeeded = ["BARN", "MILL", "BAKERY", "SAWMILL"];
  for (let i = 0; i < buildingsNeeded.length; i++) {
    const buildingType = buildingsNeeded[i];
    const hasBuilding = gameState.buildings.some(b => b.type === buildingType);
    
    if (!hasBuilding && gameState.frameCounter % 120 === i * 30) {
      placeBuilding(buildingType, 6 + i, 6);
      return { type: "BUILD", buildingType };
    }
  }
  
  // Upgrade house when possible
  if (gameState.level >= 21 && gameState.farmHouseLevel === 0 && gameState.frameCounter % 120 === 90) {
    upgradeFarmhouse();
    return { type: "UPGRADE_HOUSE" };
  }
  
  // Keep planting and harvesting to generate XP
  for (let plot of gameState.farmPlots) {
    if (plot.state === "empty" && gameState.frameCounter % 20 === 0) {
      tillPlot(plot.gridX, plot.gridY);
    }
    if (plot.state === "tilled" && gameState.frameCounter % 20 === 5) {
      gameState.selectedCrop = "WHEAT";
      plantCrop("WHEAT");
    }
    if (plot.state === "ready" && gameState.frameCounter % 20 === 10) {
      harvestPlot(plot.gridX, plot.gridY);
    }
  }
  
  return { type: "WAIT" };
}

export function executeAutomatedAction(action) {
  if (!action || action.type === "WAIT") return;
  
  // Actions are already executed in the test functions
  // This is just for logging
}