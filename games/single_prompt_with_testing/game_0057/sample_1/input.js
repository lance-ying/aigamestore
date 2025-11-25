// input.js - Input handling

import { gameState, TILL_ENERGY_COST, PLANT_ENERGY_COST, WATER_ENERGY_COST, HARVEST_ENERGY_COST, CROP_TYPES } from './globals.js';
import { Crop, Particle } from './entities.js';

const keys = {};

export function setupInput(p) {
  p.keyPressed = function() {
    keys[p.keyCode] = true;
    
    // Log input
    if (p.logs && p.logs.inputs) {
      p.logs.inputs.push({
        input_type: 'keyPressed',
        data: { key: p.key, keyCode: p.keyCode },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
    
    handleKeyPress(p);
  };
  
  p.keyReleased = function() {
    keys[p.keyCode] = false;
    
    // Log input
    if (p.logs && p.logs.inputs) {
      p.logs.inputs.push({
        input_type: 'keyReleased',
        data: { key: p.key, keyCode: p.keyCode },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  };
}

function handleKeyPress(p) {
  // Phase controls
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      startGame();
    }
  }
  
  if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
    }
  }
  
  if (p.keyCode === 82) { // R - Restart
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "PAUSED") {
      resetGame();
    }
  }
  
  // Gameplay controls (only during PLAYING phase)
  if (gameState.gamePhase === "PLAYING") {
    // Shop toggle (Shift)
    if (p.keyCode === 16) {
      gameState.shopOpen = !gameState.shopOpen;
    }
    
    // Action keys
    if (p.keyCode === 32) { // Space - Till
      tillSoil();
    }
    
    if (p.keyCode === 90) { // Z - Plant
      plantSeed();
    }
    
    if (p.keyCode === 88) { // X - Water
      waterCrop();
    }
    
    if (p.keyCode === 67) { // C - Harvest
      harvestCrop();
    }
  }
}

export function handleInput(p) {
  if (gameState.gamePhase !== "PLAYING" || !gameState.player) return;
  
  // Movement
  if (isKeyPressed(37)) { // Left arrow
    gameState.player.moveLeft();
  }
  if (isKeyPressed(39)) { // Right arrow
    gameState.player.moveRight();
  }
  if (isKeyPressed(38)) { // Up arrow
    gameState.player.moveUp();
  }
  if (isKeyPressed(40)) { // Down arrow
    gameState.player.moveDown();
  }
}

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

function startGame() {
  gameState.gamePhase = "PLAYING";
  if (window.gameInstance && window.gameInstance.logs) {
    window.gameInstance.logs.game_info.push({
      data: { gamePhase: "PLAYING" },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

function resetGame() {
  // Clear arrays
  gameState.entities = [];
  gameState.crops = [];
  gameState.particles = [];
  
  // Reset stats
  gameState.gold = 50;
  gameState.energy = 100;
  gameState.health = 100;
  gameState.farmingLevel = 0;
  gameState.farmingXP = 0;
  gameState.xpToNextLevel = 100;
  gameState.dayCount = 1;
  gameState.timeOfDay = 0;
  gameState.totalCropsHarvested = 0;
  gameState.totalGoldEarned = 0;
  gameState.score = 0;
  gameState.shopOpen = false;
  gameState.message = '';
  gameState.messageTimer = 0;
  
  // Reset tiles
  initializeFarm();
  
  // Reset player
  gameState.player = null;
  
  // Return to start screen
  gameState.gamePhase = "START";
}

function initializeFarm() {
  // This will be called from game.js
}

function tillSoil() {
  if (!gameState.player || gameState.energy < TILL_ENERGY_COST) {
    if (gameState.player) {
      gameState.player.setMessage('Not enough energy!');
    }
    return;
  }
  
  const tilePos = gameState.player.getTilePosition();
  const tile = gameState.tiles[tilePos.y]?.[tilePos.x];
  
  if (tile && tile.till()) {
    gameState.player.useEnergy(TILL_ENERGY_COST);
    gameState.player.setMessage('Soil tilled!');
    
    // Create particles
    for (let i = 0; i < 5; i++) {
      gameState.particles.push(new Particle(
        tile.x + 10,
        tile.y + 10,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3 - 2,
        [120, 80, 50],
        20
      ));
    }
  }
}

function plantSeed() {
  if (!gameState.player || gameState.energy < PLANT_ENERGY_COST) {
    if (gameState.player) {
      gameState.player.setMessage('Not enough energy!');
    }
    return;
  }
  
  const cropData = CROP_TYPES[gameState.selectedCropType];
  
  // Check if crop is unlocked
  if (gameState.farmingLevel < cropData.unlockLevel) {
    gameState.player.setMessage(`Unlock at Level ${cropData.unlockLevel}!`);
    return;
  }
  
  // Check if player has enough gold
  if (gameState.gold < cropData.seedCost) {
    gameState.player.setMessage('Not enough gold!');
    return;
  }
  
  const tilePos = gameState.player.getTilePosition();
  const tile = gameState.tiles[tilePos.y]?.[tilePos.x];
  
  if (tile && tile.tilled && !tile.hasCrop) {
    gameState.gold -= cropData.seedCost;
    gameState.player.useEnergy(PLANT_ENERGY_COST);
    new Crop(tilePos.x, tilePos.y, gameState.selectedCropType);
    gameState.player.setMessage(`Planted ${cropData.name}!`);
    
    // Create particles
    for (let i = 0; i < 3; i++) {
      gameState.particles.push(new Particle(
        tile.x + 10,
        tile.y + 10,
        (Math.random() - 0.5) * 2,
        -Math.random() * 2,
        [100, 200, 100],
        20
      ));
    }
  }
}

function waterCrop() {
  if (!gameState.player || gameState.energy < WATER_ENERGY_COST) {
    if (gameState.player) {
      gameState.player.setMessage('Not enough energy!');
    }
    return;
  }
  
  const tilePos = gameState.player.getTilePosition();
  const tile = gameState.tiles[tilePos.y]?.[tilePos.x];
  
  // Find crop at this location
  const crop = gameState.crops.find(c => c.gridX === tilePos.x && c.gridY === tilePos.y);
  
  if (crop && crop.water()) {
    gameState.player.useEnergy(WATER_ENERGY_COST);
    gameState.player.setMessage('Crop watered!');
    
    // Create water particles
    for (let i = 0; i < 8; i++) {
      gameState.particles.push(new Particle(
        tile.x + 10,
        tile.y + 10,
        (Math.random() - 0.5) * 3,
        -Math.random() * 3,
        [100, 150, 255],
        30
      ));
    }
  } else if (tile && tile.water()) {
    gameState.player.useEnergy(WATER_ENERGY_COST);
    gameState.player.setMessage('Soil watered!');
    
    // Create water particles
    for (let i = 0; i < 5; i++) {
      gameState.particles.push(new Particle(
        tile.x + 10,
        tile.y + 10,
        (Math.random() - 0.5) * 2,
        -Math.random() * 2,
        [100, 150, 255],
        20
      ));
    }
  }
}

function harvestCrop() {
  if (!gameState.player || gameState.energy < HARVEST_ENERGY_COST) {
    if (gameState.player) {
      gameState.player.setMessage('Not enough energy!');
    }
    return;
  }
  
  const tilePos = gameState.player.getTilePosition();
  const crop = gameState.crops.find(c => c.gridX === tilePos.x && c.gridY === tilePos.y);
  
  if (crop && crop.harvest()) {
    gameState.player.useEnergy(HARVEST_ENERGY_COST);
  } else if (crop) {
    gameState.player.setMessage('Crop not ready yet!');
  }
}

export { resetGame };