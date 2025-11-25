// input.js - Input handling

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED } from './globals.js';
import { PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { TOOL_HOE, TOOL_WATERING_CAN, TOOL_SCYTHE } from './globals.js';
import { getTileAtPosition, advanceDay } from './farm.js';
import { resetGame } from './game.js';
import { getAvailableCrops } from './globals.js';

const keys = {};

export function handleKeyPress(p) {
  keys[p.keyCode] = true;
  
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase controls
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: PHASE_PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
    }
  }
  
  if (p.keyCode === 82) { // R - Restart
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
        gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      resetGame();
      gameState.gamePhase = PHASE_START;
    }
  }
  
  // Game controls
  if (gameState.gamePhase === PHASE_PLAYING) {
    // Tool switching
    if (p.keyCode === 90) { // Z
      if (gameState.player) {
        gameState.player.switchTool();
      }
    }
    
    // Shop toggle
    if (p.keyCode === 16) { // Shift
      gameState.showShop = !gameState.showShop;
    }
  }
}

export function handleKeyRelease(p) {
  keys[p.keyCode] = false;
  
  // Log input
  p.logs.inputs.push({
    input_type: 'keyReleased',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

export function processGameplayInput(p) {
  if (gameState.gamePhase !== PHASE_PLAYING || !gameState.player) return;
  
  // Movement
  let dx = 0;
  let dy = 0;
  
  if (isKeyPressed(37)) dx -= 1; // Left
  if (isKeyPressed(39)) dx += 1; // Right
  if (isKeyPressed(38)) dy -= 1; // Up
  if (isKeyPressed(40)) dy += 1; // Down
  
  if (dx !== 0 || dy !== 0) {
    gameState.player.move(dx, dy);
  }
  
  // Tool use
  if (isKeyPressed(32) && gameState.player.toolCooldown === 0) { // Space
    useTool(p);
  }
}

function useTool(p) {
  if (!gameState.player.useTool()) return;
  
  const player = gameState.player;
  const tool = player.currentTool;
  
  // Get tile in front of player
  const checkX = player.x + (player.facing * 25);
  const checkY = player.y;
  const tile = getTileAtPosition(checkX, checkY);
  
  if (!tile) return;
  
  if (tool === TOOL_HOE) {
    // Till soil
    if (tile.till()) {
      // Success sound would go here
    }
  } else if (tool === TOOL_WATERING_CAN) {
    // Water tile
    if (tile.water()) {
      // Success sound would go here
    }
  } else if (tool === TOOL_SCYTHE) {
    // Harvest crop
    const value = tile.harvest();
    if (value !== null) {
      // Create particle effect
      createHarvestParticles(p, tile.x + 20, tile.y + 20);
    }
  }
}

function createHarvestParticles(p, x, y) {
  // Simple particle effect - could be expanded
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    // Particles could be added to a particle system
  }
}

// Shop interaction
export function handleShopInteraction(cropType) {
  const availableCrops = getAvailableCrops();
  const crop = availableCrops.find(c => c.type === cropType);
  
  if (!crop) return false;
  
  // Check if player can afford
  if (gameState.money >= crop.price) {
    gameState.money -= crop.price;
    
    // Find first tilled empty tile and plant
    const tile = gameState.farmTiles.find(t => t.tilled && !t.crop);
    if (tile) {
      tile.plantCrop(cropType);
      return true;
    }
  }
  
  return false;
}