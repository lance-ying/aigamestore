// controls.js - Control handling for different modes

import { gameState, CROP_TYPES } from './globals.js';
import { getTileAtPosition, addFarmingXP } from './utils.js';

export function handleHumanControls(p) {
  if (!gameState.player) return;
  
  let dx = 0;
  let dy = 0;
  let sprint = false;
  
  // Movement
  if (p.keyIsDown(37) || p.keyIsDown(65)) dx -= 1; // Left
  if (p.keyIsDown(39) || p.keyIsDown(68)) dx += 1; // Right
  if (p.keyIsDown(38) || p.keyIsDown(87)) dy -= 1; // Up
  if (p.keyIsDown(40) || p.keyIsDown(83)) dy += 1; // Down
  
  // Sprint
  if (p.keyIsDown(16)) sprint = true; // Shift
  
  if (dx !== 0 || dy !== 0) {
    gameState.player.move(dx, dy, sprint);
  }
}

export function handleInteraction(p) {
  if (!gameState.player || gameState.energy < 1) return;
  
  const playerPos = gameState.player.getGridPosition();
  const tile = gameState.farmGrid[playerPos.row]?.[playerPos.col];
  
  if (!tile) return;
  
  // Determine action based on tile state
  if (!tile.tilled) {
    // Till the soil
    if (tile.till()) {
      gameState.energy = Math.max(0, gameState.energy - 2);
      addFarmingXP(1);
    }
  } else if (!tile.planted) {
    // Plant seed
    if (tile.plant(gameState.selectedSeed)) {
      gameState.energy = Math.max(0, gameState.energy - 3);
      addFarmingXP(2);
    }
  } else if (tile.needsWater && !tile.watered) {
    // Water crop
    if (tile.water()) {
      gameState.energy = Math.max(0, gameState.energy - 1);
      addFarmingXP(1);
    }
  } else if (tile.isReadyToHarvest()) {
    // Harvest crop
    const crop = tile.harvest();
    if (crop) {
      gameState.score += crop.value;
      gameState.harvests++;
      gameState.energy = Math.max(0, gameState.energy - 2);
      addFarmingXP(5);
      
      p.logs.game_info.push({
        data: { event: "harvest", crop: crop.name, value: crop.value, totalHarvests: gameState.harvests },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      // Check win condition
      if (gameState.harvests >= gameState.targetHarvests) {
        gameState.gamePhase = "GAME_OVER_WIN";
      }
    }
  }
}

export function switchSeed(p) {
  const available = [];
  for (let key in CROP_TYPES) {
    available.push(key);
  }
  
  const currentIndex = available.indexOf(gameState.selectedSeed);
  const nextIndex = (currentIndex + 1) % available.length;
  gameState.selectedSeed = available[nextIndex];
  
  p.logs.game_info.push({
    data: { event: "seed_change", seed: gameState.selectedSeed },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function handleTestControls_1(p) {
  // Basic testing - move around and perform actions
  if (!gameState.player) return;
  
  const frame = p.frameCount;
  
  // Move in a pattern
  if (frame % 120 < 30) {
    gameState.player.move(1, 0, false);
  } else if (frame % 120 < 60) {
    gameState.player.move(0, 1, false);
  } else if (frame % 120 < 90) {
    gameState.player.move(-1, 0, false);
  } else {
    gameState.player.move(0, -1, false);
  }
  
  // Interact occasionally
  if (frame % 60 === 0 && gameState.energy > 10) {
    handleInteraction(p);
  }
}

export function handleTestControls_2(p) {
  // Win test - efficient farming
  if (!gameState.player) return;
  
  const frame = p.frameCount;
  
  // Quick planting and harvesting pattern
  const action = Math.floor(frame / 30) % 4;
  
  if (action === 0) {
    gameState.player.move(1, 0, true);
  } else if (action === 1) {
    handleInteraction(p);
  } else if (action === 2) {
    gameState.player.move(0, 1, false);
  } else {
    handleInteraction(p);
  }
  
  // Force harvest completion
  if (frame % 300 === 0) {
    gameState.harvests += 3;
    gameState.score += 50;
  }
}