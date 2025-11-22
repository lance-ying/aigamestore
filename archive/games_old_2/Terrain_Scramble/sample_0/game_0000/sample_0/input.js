// input.js - Input handling

import { gameState } from './globals.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase-specific controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      startGame();
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.logs.game_info.push({
        data: { gamePhase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase !== "START") {
      resetToStart(p);
    }
  }
}

export function handleKeyReleased(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function startGame() {
  gameState.gamePhase = "PLAYING";
  gameState.score = 0;
  gameState.fuel = 100;
  gameState.distance = 0;
  gameState.currentLevel = 1;
  gameState.framesSinceStart = 0;
  gameState.rotationAtLastCheck = 0;
  gameState.totalRotation = 0;
  gameState.lastFuelSpawnDistance = 0;
}

function resetToStart(p) {
  gameState.gamePhase = "START";
  
  // Clean up
  if (gameState.player && gameState.player.vehicle) {
    gameState.player.vehicle.destroy();
  }
  
  gameState.player = null;
  gameState.terrainSegments = [];
  gameState.fuelCanisters = [];
  gameState.particleEffects = [];
  
  p.logs.game_info.push({
    data: { gamePhase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function getPlayerInput(p) {
  if (gameState.controlMode === "HUMAN") {
    return {
      accelerate: p.keyIsDown(39), // Right arrow
      brake: p.keyIsDown(37) // Left arrow
    };
  } else if (gameState.controlMode === "TEST_1") {
    // Basic test: just accelerate
    return {
      accelerate: gameState.gamePhase === "PLAYING",
      brake: false
    };
  } else if (gameState.controlMode === "TEST_2") {
    // Win test: smart acceleration and braking
    const vehicle = gameState.player?.vehicle;
    if (!vehicle) return { accelerate: false, brake: false };
    
    const rotation = vehicle.getRotation() % (Math.PI * 2);
    const isUpsideDown = Math.abs(rotation) > Math.PI / 2 && Math.abs(rotation) < Math.PI * 1.5;
    
    return {
      accelerate: !isUpsideDown && gameState.gamePhase === "PLAYING",
      brake: isUpsideDown
    };
  }
  
  return { accelerate: false, brake: false };
}