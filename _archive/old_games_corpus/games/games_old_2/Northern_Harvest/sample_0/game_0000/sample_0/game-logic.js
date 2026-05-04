// game-logic.js - Core game logic

import { gameState, GAME_PHASE, CROP_TYPES, ANIMAL_TYPES, BUILDING_TYPES, QUEST_TYPES, LEVEL_THRESHOLDS, TILE_SIZE, GRID_WIDTH, GRID_HEIGHT } from './globals.js';
import { FarmPlot, Animal, Building, Player } from './entities.js';

let p;

export function initGameLogic(p5Instance) {
  p = p5Instance;
}

export function setupGame() {
  // Initialize player
  gameState.player = new Player(300, 200);
  
  // Initialize farm plots
  gameState.farmPlots = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const plot = new FarmPlot(
        x * TILE_SIZE,
        y * TILE_SIZE,
        x,
        y
      );
      gameState.farmPlots.push(plot);
    }
  }
  
  // Load high score
  const savedHighScore = localStorage.getItem('northernHarvestHighScore');
  if (savedHighScore) {
    gameState.highScore = parseInt(savedHighScore);
  }
  
  // Initialize starting quests
  gameState.activeQuests = [
    { ...QUEST_TYPES.HARVEST_WHEAT, progress: 0 }
  ];
}

export function startGame() {
  gameState.gamePhase = GAME_PHASE.PLAYING;
  gameState.score = 0;
  gameState.level = 1;
  gameState.xp = 0;
  gameState.coins = 100;
  gameState.wood = 50;
  gameState.stone = 30;
  gameState.gameTime = 0;
  gameState.frameCounter = 0;
  gameState.farmHouseLevel = 0;
  gameState.animals = [];
  gameState.buildings = [];
  gameState.completedQuests = [];
  gameState.selectedCrop = null;
  gameState.selectedBuilding = null;
  
  // Reset inventory
  gameState.inventory = {
    wheat: 0,
    corn: 0,
    eggs: 0,
    milk: 0,
    flour: 0,
    bread: 0
  };
  
  // Reset farm plots
  for (let plot of gameState.farmPlots) {
    plot.state = "empty";
    plot.cropType = null;
    plot.plantTime = 0;
    plot.growthStage = 0;
  }
  
  // Reset active quests
  gameState.activeQuests = [
    { ...QUEST_TYPES.HARVEST_WHEAT, progress: 0 }
  ];
  
  // Add starting animals
  addAnimal("CHICKEN", 2, 2);
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", event: "game_started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function restartGame() {
  gameState.gamePhase = GAME_PHASE.START;
  
  p.logs.game_info.push({
    data: { phase: "START", event: "game_restarted" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function togglePause() {
  if (gameState.gamePhase === GAME_PHASE.PLAYING) {
    gameState.gamePhase = GAME_PHASE.PAUSED;
    p.logs.game_info.push({
      data: { phase: "PAUSED", event: "game_paused" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.gamePhase === GAME_PHASE.PAUSED) {
    gameState.gamePhase = GAME_PHASE.PLAYING;
    p.logs.game_info.push({
      data: { phase: "PLAYING", event: "game_resumed" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function updateGame() {
  if (gameState.gamePhase !== GAME_PHASE.PLAYING) return;
  
  gameState.frameCounter++;
  gameState.gameTime = gameState.frameCounter / 60; // Convert to seconds
  
  // Update farm plots
  for (let plot of gameState.farmPlots) {
    plot.update(gameState.gameTime);
  }
  
  // Update animals
  for (let animal of gameState.animals) {
    animal.update(gameState.gameTime);
  }
  
  // Update buildings
  for (let building of gameState.buildings) {
    building.update(gameState.gameTime);
  }
  
  // Update camera with arrow keys
  const moveSpeed = 5;
  if (p.keyIsDown(37)) gameState.camera.x -= moveSpeed; // LEFT
  if (p.keyIsDown(39)) gameState.camera.x += moveSpeed; // RIGHT
  if (p.keyIsDown(38)) gameState.camera.y -= moveSpeed; // UP
  if (p.keyIsDown(40)) gameState.camera.y += moveSpeed; // DOWN
  
  // Clamp camera
  gameState.camera.x = p.constrain(gameState.camera.x, -100, 100);
  gameState.camera.y = p.constrain(gameState.camera.y, -100, 100);
  
  // Check level up
  checkLevelUp();
  
  // Check win/lose conditions
  checkWinLose();
  
  // Log player info periodically
  if (gameState.frameCounter % 60 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}

export function tillPlot(gridX, gridY) {
  const plot = gameState.farmPlots.find(p => p.gridX === gridX && p.gridY === gridY);
  if (plot && plot.till()) {
    return true;
  }
  return false;
}

export function plantCrop(cropType) {
  const crop = CROP_TYPES[cropType];
  if (!crop) return;
  
  if (gameState.coins < crop.cost) return;
  
  // Plant on selected plots or clicked plot
  let planted = false;
  for (let plot of gameState.farmPlots) {
    if (plot.state === "tilled") {
      if (gameState.coins >= crop.cost) {
        plot.plant(cropType, gameState.gameTime);
        gameState.coins -= crop.cost;
        planted = true;
        break;
      }
    }
  }
  
  if (planted) {
    gameState.selectedCrop = null;
  }
}

export function harvestPlot(gridX, gridY) {
  const plot = gameState.farmPlots.find(p => p.gridX === gridX && p.gridY === gridY);
  if (plot) {
    const crop = plot.harvest();
    if (crop) {
      gameState.coins += crop.sellPrice;
      gameState.score += 5;
      addXP(crop.xp);
      
      // Update inventory
      const cropName = crop.name.toLowerCase();
      if (gameState.inventory[cropName] !== undefined) {
        gameState.inventory[cropName]++;
      }
      
      // Update quests
      updateQuestProgress("HARVEST_WHEAT", 1);
      
      return true;
    }
  }
  return false;
}

export function harvestAll() {
  let harvested = 0;
  for (let plot of gameState.farmPlots) {
    if (plot.state === "ready") {
      const crop = plot.harvest();
      if (crop) {
        gameState.coins += crop.sellPrice;
        gameState.score += 5;
        addXP(crop.xp);
        
        const cropName = crop.name.toLowerCase();
        if (gameState.inventory[cropName] !== undefined) {
          gameState.inventory[cropName]++;
        }
        
        updateQuestProgress("HARVEST_WHEAT", 1);
        harvested++;
      }
    }
  }
  
  // Bonus for quick harvest
  if (harvested >= 3) {
    gameState.score += 100;
  }
}

export function collectAnimal(animal) {
  const product = animal.collect(gameState.gameTime);
  if (product) {
    gameState.coins += product.productValue;
    gameState.score += 10;
    addXP(product.xp);
    
    const productName = product.productName.toLowerCase();
    if (productName === "egg") {
      gameState.inventory.eggs++;
    } else if (productName === "milk") {
      gameState.inventory.milk++;
    }
    
    return true;
  }
  return false;
}

export function addAnimal(type, gridX, gridY) {
  const animalData = ANIMAL_TYPES[type];
  if (!animalData) return false;
  
  if (gameState.coins < animalData.cost) return false;
  
  const animal = new Animal(type, gridX * TILE_SIZE, gridY * TILE_SIZE);
  animal.lastProductionTime = gameState.gameTime;
  gameState.animals.push(animal);
  gameState.coins -= animalData.cost;
  
  return true;
}

export function placeBuilding(type, gridX, gridY) {
  const buildingData = BUILDING_TYPES[type];
  if (!buildingData) return false;
  
  if (gameState.coins < buildingData.cost || 
      gameState.wood < buildingData.woodCost || 
      gameState.stone < buildingData.stoneCost) {
    return false;
  }
  
  // Check if space is available
  for (let building of gameState.buildings) {
    if (building.gridX === gridX && building.gridY === gridY) {
      return false;
    }
  }
  
  const building = new Building(type, gridX, gridY);
  building.startConstruction(gameState.gameTime);
  gameState.buildings.push(building);
  
  gameState.coins -= buildingData.cost;
  gameState.wood -= buildingData.woodCost;
  gameState.stone -= buildingData.stoneCost;
  
  gameState.score += 50;
  
  // Complete building quest
  updateQuestProgress(type, 1);
  
  return true;
}

export function addXP(amount) {
  gameState.xp += amount;
}

export function checkLevelUp() {
  const nextLevelXP = LEVEL_THRESHOLDS[gameState.level];
  
  if (gameState.xp >= nextLevelXP && gameState.level < LEVEL_THRESHOLDS.length - 1) {
    gameState.level++;
    gameState.score += 200;
    
    // Unlock new quests based on level
    if (gameState.level === 6) {
      gameState.activeQuests.push({ ...QUEST_TYPES.BUILD_MILL, progress: 0 });
      addAnimal("COW", 4, 2);
    } else if (gameState.level === 11) {
      gameState.activeQuests.push({ ...QUEST_TYPES.BUILD_BAKERY, progress: 0 });
    } else if (gameState.level === 16) {
      gameState.activeQuests.push({ ...QUEST_TYPES.BUILD_SAWMILL, progress: 0 });
    } else if (gameState.level === 21) {
      gameState.activeQuests.push({ ...QUEST_TYPES.UPGRADE_HOUSE, progress: 0 });
    }
    
    p.logs.game_info.push({
      data: { event: "level_up", level: gameState.level },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function updateQuestProgress(questId, amount) {
  for (let quest of gameState.activeQuests) {
    if (quest.id === questId || quest.id === `BUILD_${questId}`) {
      if (quest.progress !== undefined) {
        quest.progress += amount;
        if (quest.target && quest.progress >= quest.target) {
          completeQuest(quest);
        }
      } else {
        // Building completion quest
        completeQuest(quest);
      }
    }
  }
}

export function completeQuest(quest) {
  gameState.coins += quest.reward;
  gameState.score += 100;
  addXP(quest.xpReward);
  
  gameState.completedQuests.push(quest.id);
  gameState.activeQuests = gameState.activeQuests.filter(q => q.id !== quest.id);
  
  p.logs.game_info.push({
    data: { event: "quest_completed", questId: quest.id },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function upgradeFarmhouse() {
  const cost = 500;
  const woodCost = 100;
  const stoneCost = 100;
  
  if (gameState.coins >= cost && gameState.wood >= woodCost && gameState.stone >= stoneCost) {
    gameState.coins -= cost;
    gameState.wood -= woodCost;
    gameState.stone -= stoneCost;
    gameState.farmHouseLevel++;
    gameState.score += 500;
    
    updateQuestProgress("UPGRADE_HOUSE", 1);
    
    return true;
  }
  return false;
}

export function checkWinLose() {
  // Win condition: Level 5, all quests completed, farmhouse upgraded
  if (gameState.level >= 21 && 
      gameState.farmHouseLevel >= 1 && 
      gameState.completedQuests.includes("UPGRADE_HOUSE")) {
    gameState.gamePhase = GAME_PHASE.GAME_OVER_WIN;
    
    // Update high score
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      localStorage.setItem('northernHarvestHighScore', gameState.highScore.toString());
    }
    
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", event: "player_won", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Lose condition: Negative coins for extended period
  if (gameState.coins < -50) {
    gameState.gamePhase = GAME_PHASE.GAME_OVER_LOSE;
    
    // Update high score
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      localStorage.setItem('northernHarvestHighScore', gameState.highScore.toString());
    }
    
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", event: "player_lost", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}