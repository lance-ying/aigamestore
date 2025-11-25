// automated_testing_controller.js - Automated testing AI

import { gameState } from './globals.js';
import { getTileAtPosition, getTileAt } from './farm.js';
import { getAvailableCrops } from './globals.js';

// Helper to find nearest object
function findNearest(targets, x, y) {
  if (!targets || targets.length === 0) return null;
  
  let nearest = targets[0];
  let minDist = Infinity;
  
  for (const target of targets) {
    const dx = target.x - x;
    const dy = target.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < minDist) {
      minDist = dist;
      nearest = target;
    }
  }
  
  return nearest;
}

// Get action to move towards target
function getMoveAction(targetX, targetY, player) {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    return { keyCode: dx > 0 ? 39 : 37 }; // Right or Left
  } else {
    return { keyCode: dy > 0 ? 40 : 38 }; // Down or Up
  }
}

// TEST_1: Basic farming test
function getTest1Action(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  // Priority: Till soil -> Water crops -> Harvest mature crops -> Move to empty tiles
  
  // Check for mature crops to harvest
  const matureCrops = gameState.crops.filter(c => c.stage === 3);
  if (matureCrops.length > 0) {
    const nearest = findNearest(matureCrops.map(c => ({
      x: c.gridX * 40 + 20,
      y: c.gridY * 40 + 20
    })), player.x, player.y);
    
    const dist = Math.hypot(nearest.x - player.x, nearest.y - player.y);
    if (dist < 40) {
      player.currentTool = 'scythe';
      return { keyCode: 32 }; // Space to harvest
    }
    return getMoveAction(nearest.x, nearest.y, player);
  }
  
  // Check for crops needing water
  const unwateredTiles = gameState.farmTiles.filter(t => 
    t.crop && !t.watered && t.crop.stage < 3
  );
  if (unwateredTiles.length > 0) {
    const nearest = findNearest(unwateredTiles.map(t => ({
      x: t.x + 20,
      y: t.y + 20
    })), player.x, player.y);
    
    const dist = Math.hypot(nearest.x - player.x, nearest.y - player.y);
    if (dist < 40) {
      player.currentTool = 'wateringCan';
      return { keyCode: 32 }; // Space to water
    }
    return getMoveAction(nearest.x, nearest.y, player);
  }
  
  // Find untilled soil
  const untilledTiles = gameState.farmTiles.filter(t => !t.tilled);
  if (untilledTiles.length > 0) {
    const nearest = findNearest(untilledTiles.map(t => ({
      x: t.x + 20,
      y: t.y + 20
    })), player.x, player.y);
    
    const dist = Math.hypot(nearest.x - player.x, nearest.y - player.y);
    if (dist < 40) {
      player.currentTool = 'hoe';
      return { keyCode: 32 }; // Space to till
    }
    return getMoveAction(nearest.x, nearest.y, player);
  }
  
  // Open shop to buy seeds if we have money and tilled empty tiles
  const emptyTilledTiles = gameState.farmTiles.filter(t => t.tilled && !t.crop);
  if (emptyTilledTiles.length > 0 && gameState.money >= 10 && !gameState.showShop) {
    return { keyCode: 16 }; // Shift to open shop
  }
  
  // Random movement
  return { keyCode: [37, 38, 39, 40][Math.floor(Math.random() * 4)] };
}

// TEST_2: Optimized win strategy
function getTest2Action(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  // Aggressive farming strategy to reach level 10 quickly
  
  // First, harvest all mature crops for money and XP
  const matureCrops = gameState.crops.filter(c => c.stage === 3);
  if (matureCrops.length > 0) {
    const nearest = findNearest(matureCrops.map(c => ({
      x: c.gridX * 40 + 20,
      y: c.gridY * 40 + 20
    })), player.x, player.y);
    
    const dist = Math.hypot(nearest.x - player.x, nearest.y - player.y);
    if (dist < 40) {
      player.currentTool = 'scythe';
      return { keyCode: 32 };
    }
    return getMoveAction(nearest.x, nearest.y, player);
  }
  
  // Water all crops efficiently
  const unwateredCrops = gameState.farmTiles.filter(t => 
    t.crop && !t.watered && t.crop.stage < 3
  );
  if (unwateredCrops.length > 0) {
    const nearest = findNearest(unwateredCrops.map(t => ({
      x: t.x + 20,
      y: t.y + 20
    })), player.x, player.y);
    
    const dist = Math.hypot(nearest.x - player.x, nearest.y - player.y);
    if (dist < 40) {
      player.currentTool = 'wateringCan';
      return { keyCode: 32 };
    }
    return getMoveAction(nearest.x, nearest.y, player);
  }
  
  // Buy best available seeds
  const availableCrops = getAvailableCrops();
  const bestCrop = availableCrops[availableCrops.length - 1]; // Highest level crop
  const emptyTilledTiles = gameState.farmTiles.filter(t => t.tilled && !t.crop);
  
  if (emptyTilledTiles.length > 0 && gameState.money >= bestCrop.price) {
    if (!gameState.showShop) {
      return { keyCode: 16 }; // Open shop
    }
  }
  
  // Till more soil
  const untilledTiles = gameState.farmTiles.filter(t => !t.tilled);
  if (untilledTiles.length > 0 && gameState.energy > 20) {
    const nearest = findNearest(untilledTiles.map(t => ({
      x: t.x + 20,
      y: t.y + 20
    })), player.x, player.y);
    
    const dist = Math.hypot(nearest.x - player.x, nearest.y - player.y);
    if (dist < 40) {
      player.currentTool = 'hoe';
      return { keyCode: 32 };
    }
    return getMoveAction(nearest.x, nearest.y, player);
  }
  
  // If low energy, just wait/move slowly
  if (gameState.energy < 10) {
    return { keyCode: 39 }; // Just move right
  }
  
  return { keyCode: 32 }; // Default: use tool
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTest1Action(gameState);
    case "TEST_2":
      return getTest2Action(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;