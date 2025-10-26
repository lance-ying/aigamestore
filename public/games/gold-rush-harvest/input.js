// input.js - Input handling

import { gameState, GAME_PHASES, CROP_DATA, ANIMAL_DATA, BUILDING_DATA } from './globals.js';
import { addBuilding } from './buildings.js';
import { addAnimal } from './livestock.js';
import { startExpedition, endExpedition } from './expedition.js';
import { checkObjectives, advanceLevel, addXP, addScore } from './progression.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase-specific handling
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (keyCode === 13) { // ENTER
      gameState.gamePhase = GAME_PHASES.PLAYING;
      gameState.lastUpdateTime = Date.now();
      
      p.logs.game_info.push({
        data: { phase: 'PLAYING', message: 'Game started' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (gameState.inExpedition) {
      handleExpeditionInput(p, keyCode);
    } else {
      handleGameplayInput(p, key, keyCode);
    }
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    if (keyCode === 27) { // ESC
      gameState.gamePhase = GAME_PHASES.PLAYING;
      gameState.lastUpdateTime = Date.now();
    }
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    if (keyCode === 82) { // R
      resetGame(p);
    }
  }
}

function handleGameplayInput(p, key, keyCode) {
  // ESC - Pause
  if (keyCode === 27) {
    gameState.gamePhase = GAME_PHASES.PAUSED;
    return;
  }
  
  // Z - Cancel/Open menu
  if (keyCode === 90) {
    if (gameState.showingMenu) {
      gameState.showingMenu = null;
    } else {
      // Open expedition menu
      gameState.showingMenu = 'expedition';
    }
    return;
  }
  
  // Arrow keys - Navigate
  if (keyCode === 37) { // LEFT
    if (gameState.player) {
      gameState.player.gridX = Math.max(0, gameState.player.gridX - 1);
      updatePlayerPosition();
    }
  } else if (keyCode === 39) { // RIGHT
    if (gameState.player) {
      gameState.player.gridX = Math.min(2, gameState.player.gridX + 1);
      updatePlayerPosition();
    }
  } else if (keyCode === 38) { // UP
    if (gameState.player) {
      gameState.player.gridY = Math.max(0, gameState.player.gridY - 1);
      updatePlayerPosition();
    }
  } else if (keyCode === 40) { // DOWN
    if (gameState.player) {
      gameState.player.gridY = Math.min(2, gameState.player.gridY + 1);
      updatePlayerPosition();
    }
  }
  
  // SPACE - Interact
  if (keyCode === 32) {
    handleInteraction(p);
  }
  
  // Number keys for menus
  if (gameState.showingMenu) {
    handleMenuInput(p, keyCode);
  }
}

function updatePlayerPosition() {
  const plotIndex = gameState.player.gridY * 3 + gameState.player.gridX;
  if (plotIndex < gameState.farmPlots.length) {
    const plot = gameState.farmPlots[plotIndex];
    gameState.player.x = plot.x;
    gameState.player.y = plot.y;
  }
}

function handleInteraction(p) {
  const gridX = gameState.player.gridX;
  const gridY = gameState.player.gridY;
  const plotIndex = gridY * 3 + gridX;
  
  if (plotIndex < gameState.farmPlots.length) {
    const plot = gameState.farmPlots[plotIndex];
    
    if (plot.cropType === null) {
      // Empty plot - open seed menu
      gameState.showingMenu = 'seed';
      gameState.selectedPlotIndex = plotIndex;
    } else if (plot.isReady) {
      // Harvest
      const result = plot.harvest();
      if (result) {
        gameState.resources[result.crop] += result.amount;
        addScore(gameState, 5 * result.amount);
        addXP(gameState, 5);
        
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.gridX,
          game_y: gameState.player.gridY,
          action: 'harvest',
          resource: result.crop,
          amount: result.amount,
          framecount: p.frameCount
        });
      }
    }
  }
  
  // Check animals
  for (let i = 0; i < gameState.livestock.length; i++) {
    const animal = gameState.livestock[i];
    if (animal.isReady) {
      const result = animal.collect();
      if (result) {
        gameState.resources[result.product] += result.amount;
        addScore(gameState, 10 * result.amount);
        addXP(gameState, 8);
        break;
      }
    }
  }
  
  // Check buildings
  for (let i = 0; i < gameState.buildings.length; i++) {
    const building = gameState.buildings[i];
    if (building.status === 'ready') {
      const product = building.collect();
      if (product) {
        gameState.resources[product] = (gameState.resources[product] || 0) + 1;
        addScore(gameState, 15);
        addXP(gameState, 10);
        break;
      }
    } else if (building.status === 'idle') {
      // Open production menu
      gameState.selectedBuildingIndex = i;
      startBuildingProduction(building);
      break;
    }
  }
  
  // Check objectives
  if (checkObjectives(gameState)) {
    const result = advanceLevel(gameState);
    if (result === 'WIN') {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    }
  }
}

function startBuildingProduction(building) {
  const buildingData = BUILDING_DATA[building.type];
  if (buildingData && buildingData.produces.length > 0) {
    // Try to produce the first available recipe
    const recipe = buildingData.produces[0];
    building.startProduction(recipe, gameState.gameTime);
  }
}

function handleMenuInput(p, keyCode) {
  if (gameState.showingMenu === 'seed') {
    const cropNames = Object.keys(CROP_DATA);
    const index = keyCode - 49; // 49 is '1' key
    
    if (index >= 0 && index < cropNames.length) {
      const cropName = cropNames[index];
      const cropData = CROP_DATA[cropName];
      
      if (gameState.playerGold >= cropData.seedCost) {
        const plot = gameState.farmPlots[gameState.selectedPlotIndex];
        if (plot.plant(cropName, gameState.gameTime)) {
          gameState.playerGold -= cropData.seedCost;
          gameState.showingMenu = null;
        }
      }
    }
  } else if (gameState.showingMenu === 'building') {
    const buildingNames = Object.keys(BUILDING_DATA);
    const index = keyCode - 49;
    
    if (index >= 0 && index < buildingNames.length) {
      const buildingName = buildingNames[index];
      if (addBuilding(gameState, buildingName)) {
        gameState.showingMenu = null;
      }
    }
  } else if (gameState.showingMenu === 'animal') {
    const animalNames = Object.keys(ANIMAL_DATA);
    const index = keyCode - 49;
    
    if (index >= 0 && index < animalNames.length) {
      const animalName = animalNames[index];
      if (addAnimal(gameState, animalName)) {
        gameState.showingMenu = null;
      }
    }
  } else if (gameState.showingMenu === 'expedition') {
    const expeditions = ['forest', 'mining', 'panning', 'mountain'];
    const index = keyCode - 49;
    
    if (index >= 0 && index < expeditions.length) {
      const expeditionType = expeditions[index];
      const unlocked = gameState.currentLevel > index;
      
      if (unlocked) {
        startExpedition(gameState, expeditionType);
        gameState.showingMenu = null;
      }
    }
  }
}

function handleExpeditionInput(p, keyCode) {
  if (keyCode === 32) { // SPACE
    const expedition = gameState.currentExpedition;
    if (expedition && (expedition.completed || expedition.failed)) {
      const result = endExpedition(gameState);
      if (result === 'LOSE') {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      }
    }
  }
}

export function handleMouseClicked(p) {
  if (gameState.inExpedition && gameState.currentExpedition) {
    const clicked = gameState.currentExpedition.clickTarget(p.mouseX, p.mouseY);
    if (clicked) {
      addScore(gameState, 2);
    }
  }
}

function resetGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.playerGold = 500;
  gameState.playerXP = 0;
  gameState.playerLevel = 1;
  gameState.score = 0;
  gameState.currentLevel = 1;
  gameState.farmPlots = [];
  gameState.livestock = [];
  gameState.buildings = [];
  gameState.levelObjectives = [];
  gameState.completedObjectives = [];
  gameState.inExpedition = false;
  gameState.currentExpedition = null;
  gameState.showingMenu = null;
  
  // Reset resources
  for (const key in gameState.resources) {
    gameState.resources[key] = 0;
  }
  
  p.logs.game_info.push({
    data: { phase: 'START', message: 'Game reset' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}