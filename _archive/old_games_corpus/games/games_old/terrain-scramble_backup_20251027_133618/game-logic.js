// game-logic.js - Core game logic

import { gameState, LEVELS } from './globals.js';
import { isVehicleOnGround } from './terrain.js';
import { addParticleEffect } from './particles.js';

export function updateGameLogic(p, vehicle, terrainSegments) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  gameState.framesSinceStart++;
  
  // Update distance
  const newDistance = Math.max(0, Math.floor(vehicle.getPosition().x / 10));
  if (newDistance > gameState.distance) {
    const distanceGained = newDistance - gameState.distance;
    gameState.distance = newDistance;
    gameState.score += distanceGained;
  }
  
  // Deplete fuel
  gameState.fuel -= 0.08;
  gameState.fuel = Math.max(0, gameState.fuel);
  
  // Check for fuel collection
  for (let canister of gameState.fuelCanisters) {
    if (canister.checkCollision(vehicle)) {
      gameState.fuel = Math.min(gameState.maxFuel, gameState.fuel + 30);
      gameState.score += 50;
      addParticleEffect(canister.body.position.x, canister.body.position.y, 'collection');
    }
  }
  
  // Check if on ground for air time
  const onGround = isVehicleOnGround(vehicle, terrainSegments, p);
  
  if (!onGround) {
    gameState.airTimeFrames++;
    gameState.isInAir = true;
    
    // Award air time points every 6 frames (0.1 seconds at 60 fps)
    if (gameState.airTimeFrames % 6 === 0) {
      gameState.score += 1;
    }
  } else {
    gameState.airTimeFrames = 0;
    gameState.isInAir = false;
  }
  
  // Check for flips
  checkForFlips(vehicle);
  
  // Check lose conditions
  checkLoseConditions(p, vehicle);
  
  // Check level completion
  checkLevelCompletion(p);
  
  // Log player info periodically
  if (p.frameCount % 30 === 0) {
    const pos = vehicle.getPosition();
    p.logs.player_info.push({
      screen_x: pos.x - gameState.camera.x,
      screen_y: pos.y,
      game_x: pos.x,
      game_y: pos.y,
      framecount: p.frameCount
    });
  }
}

function checkForFlips(vehicle) {
  const currentRotation = vehicle.getRotation();
  const rotationDelta = currentRotation - gameState.rotationAtLastCheck;
  
  // Normalize rotation delta
  let normalizedDelta = rotationDelta;
  if (normalizedDelta > Math.PI) normalizedDelta -= Math.PI * 2;
  if (normalizedDelta < -Math.PI) normalizedDelta += Math.PI * 2;
  
  gameState.totalRotation += normalizedDelta;
  gameState.rotationAtLastCheck = currentRotation;
  
  // Check for complete flips
  if (Math.abs(gameState.totalRotation) >= Math.PI * 2) {
    const flips = Math.floor(Math.abs(gameState.totalRotation) / (Math.PI * 2));
    gameState.score += flips * 100;
    gameState.totalRotation = gameState.totalRotation % (Math.PI * 2);
  }
}

function checkLoseConditions(p, vehicle) {
  const pos = vehicle.getPosition();
  const rotation = vehicle.getRotation() % (Math.PI * 2);
  const velocity = Math.abs(vehicle.chassis.velocity.x) + Math.abs(vehicle.chassis.velocity.y);
  
  // Fuel depletion
  if (gameState.fuel <= 0) {
    gameLose(p, "Out of Fuel!");
    return;
  }
  
  // Off screen
  if (pos.y > 600) {
    gameLose(p, "Fell Off!");
    return;
  }
  
  // Upside down
  const isUpsideDown = Math.abs(rotation) > Math.PI / 2 && Math.abs(rotation) < Math.PI * 1.5;
  if (isUpsideDown) {
    gameState.vehicleUpsideDownFrames++;
    if (gameState.vehicleUpsideDownFrames > 120) { // 2 seconds
      gameLose(p, "Flipped Over!");
      return;
    }
  } else {
    gameState.vehicleUpsideDownFrames = 0;
  }
  
  // Stuck
  if (velocity < 0.5 && !gameState.isInAir) {
    gameState.vehicleStuckFrames++;
    if (gameState.vehicleStuckFrames > 180) { // 3 seconds
      gameLose(p, "Vehicle Stuck!");
      return;
    }
  } else {
    gameState.vehicleStuckFrames = 0;
  }
}

function gameLose(p, reason) {
  gameState.gamePhase = "GAME_OVER_LOSE";
  gameState.loseReason = reason;
  
  // Explosion effect
  const pos = gameState.player.vehicle.getPosition();
  addParticleEffect(pos.x, pos.y, 'explosion');
  
  // Update high score
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('terrainScrambleHighScore', gameState.highScore.toString());
    }
  }
  
  p.logs.game_info.push({
    data: { gamePhase: "GAME_OVER_LOSE", reason: reason, score: gameState.score },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function checkLevelCompletion(p) {
  const level = LEVELS[gameState.currentLevel - 1];
  
  if (gameState.distance >= level.track_length_meters) {
    gameState.gamePhase = "LEVEL_COMPLETE";
    gameState.levelCompleteFrames = 0;
    gameState.score += 500; // Level completion bonus
    
    p.logs.game_info.push({
      data: { gamePhase: "LEVEL_COMPLETE", level: gameState.currentLevel, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function handleLevelComplete(p) {
  gameState.levelCompleteFrames++;
  
  if (gameState.levelCompleteFrames > 180) { // 3 seconds
    if (gameState.currentLevel < LEVELS.length) {
      // Advance to next level
      gameState.currentLevel++;
      gameState.distance = 0;
      gameState.lastFuelSpawnDistance = 0;
      gameState.gamePhase = "PLAYING";
      
      // Reset vehicle position
      if (gameState.player && gameState.player.vehicle) {
        gameState.player.vehicle.destroy();
      }
      
      // Will be recreated in next update
      gameState.player = null;
      
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING", level: gameState.currentLevel },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else {
      // Game won!
      gameState.gamePhase = "GAME_OVER_WIN";
      
      // Update high score
      if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('terrainScrambleHighScore', gameState.highScore.toString());
        }
      }
      
      p.logs.game_info.push({
        data: { gamePhase: "GAME_OVER_WIN", score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}