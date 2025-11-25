// game_logic.js - Core game logic and updates

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TARGET_DISPLAY_FPS,
  CRITICAL_FPS,
  MAX_CABLE_TWIST,
  CRITICAL_CABLE_TWIST,
  CRITICAL_TEMPERATURE,
  MAX_ENERGY,
  ENERGY_REGEN_RATE,
  BOOST_ENERGY_COST,
  BOOST_HEAT_RATE,
  NORMAL_HEAT_RATE,
  COOLING_RATE,
  CHALLENGES_TO_WIN,
  CHALLENGE_INTERVAL,
  PHASE_PLAYING,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  gameState
} from './globals.js';

import { createChallenge } from './challenges.js';
import { spawnPerformanceZones } from './performance_zones.js';

export function updateGameLogic(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  gameState.frameCount++;
  
  // Update player
  if (gameState.player) {
    gameState.player.update(p);
  }
  
  // Update performance metrics
  updatePerformanceMetrics(p);
  
  // Update energy
  updateEnergy();
  
  // Update temperature
  updateTemperature();
  
  // Update cooldowns
  if (gameState.optimizeCooldown > 0) {
    gameState.optimizeCooldown--;
  }
  
  // Update performance zones
  spawnPerformanceZones(p);
  gameState.performanceZones = gameState.performanceZones.filter(zone => zone.update(p));
  
  // Update challenge system
  updateChallenges(p);
  
  // Check win/lose conditions
  checkGameOverConditions();
  
  // Update position history for testing
  if (gameState.player) {
    gameState.positionHistory.push({
      x: gameState.player.x,
      y: gameState.player.y,
      frame: gameState.frameCount
    });
    
    // Keep only last 300 frames
    if (gameState.positionHistory.length > 300) {
      gameState.positionHistory.shift();
    }
  }
}

function updatePerformanceMetrics(p) {
  // Natural FPS degradation
  if (!gameState.boostActive) {
    gameState.currentFPS = Math.max(gameState.currentFPS - 0.05, 30);
  } else {
    gameState.currentFPS = Math.min(gameState.currentFPS + 0.3, 90);
  }
  
  // CPU/GPU usage fluctuation
  const baseVariation = p.random(-0.5, 0.5);
  gameState.cpuUsage = Math.max(20, Math.min(95, gameState.cpuUsage + baseVariation));
  gameState.gpuUsage = Math.max(20, Math.min(95, gameState.gpuUsage + baseVariation));
  
  // Boost increases usage
  if (gameState.boostActive) {
    gameState.cpuUsage = Math.min(gameState.cpuUsage + 0.3, 95);
    gameState.gpuUsage = Math.min(gameState.gpuUsage + 0.3, 95);
  }
  
  // Update average FPS
  gameState.averageFPS = gameState.averageFPS * 0.98 + gameState.currentFPS * 0.02;
}

function updateEnergy() {
  // Energy consumption
  if (gameState.boostActive) {
    gameState.energy = Math.max(0, gameState.energy - BOOST_ENERGY_COST);
    if (gameState.energy === 0) {
      gameState.boostActive = false;
    }
  } else {
    // Energy regeneration
    gameState.energy = Math.min(MAX_ENERGY, gameState.energy + ENERGY_REGEN_RATE);
  }
}

function updateTemperature() {
  // Heat generation
  const heatRate = gameState.boostActive ? BOOST_HEAT_RATE : NORMAL_HEAT_RATE;
  
  gameState.gpuTemp = Math.min(85, gameState.gpuTemp + heatRate);
  gameState.cpuTemp = Math.min(85, gameState.cpuTemp + heatRate * 0.8);
  
  // Cooling
  if (!gameState.boostActive) {
    gameState.gpuTemp = Math.max(45, gameState.gpuTemp - COOLING_RATE);
    gameState.cpuTemp = Math.max(45, gameState.cpuTemp - COOLING_RATE);
  }
}

function updateChallenges(p) {
  gameState.timeSinceLastChallenge++;
  
  // Spawn new challenge
  if (!gameState.currentChallenge && gameState.timeSinceLastChallenge > CHALLENGE_INTERVAL) {
    const difficulty = Math.min(gameState.challengesCompleted, 4);
    gameState.currentChallenge = createChallenge(difficulty);
    gameState.timeSinceLastChallenge = 0;
  }
  
  // Update current challenge
  if (gameState.currentChallenge) {
    const result = gameState.currentChallenge.update(p);
    
    if (result === true) {
      // Challenge completed
      gameState.challengesCompleted++;
      gameState.score += 200 + (gameState.challengesCompleted * 50);
      gameState.currentChallenge = null;
    } else if (result === false) {
      // Challenge failed (time ran out)
      gameState.currentChallenge = null;
    }
  }
}

function checkGameOverConditions() {
  // Win condition
  if (gameState.challengesCompleted >= CHALLENGES_TO_WIN) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    return;
  }
  
  // Lose conditions
  if (gameState.currentFPS < CRITICAL_FPS) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    return;
  }
  
  if (Math.abs(gameState.cableTwist) >= MAX_CABLE_TWIST) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    return;
  }
  
  if (gameState.gpuTemp >= 85 || gameState.cpuTemp >= 85) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    return;
  }
}

export function resetGame() {
  gameState.score = 0;
  gameState.currentFPS = TARGET_DISPLAY_FPS;
  gameState.averageFPS = TARGET_DISPLAY_FPS;
  gameState.cpuUsage = 30;
  gameState.gpuUsage = 40;
  gameState.gpuTemp = 55;
  gameState.cpuTemp = 50;
  gameState.cableTwist = 0;
  gameState.energy = MAX_ENERGY;
  gameState.challengesCompleted = 0;
  gameState.currentChallenge = null;
  gameState.challengeTimer = 0;
  gameState.timeSinceLastChallenge = 0;
  gameState.boostActive = false;
  gameState.optimizeCooldown = 0;
  gameState.sessionStartTime = Date.now();
  gameState.frameCount = 0;
  gameState.performanceZones = [];
  gameState.entities = [];
  gameState.positionHistory = [];
  gameState.lastActionFrame = 0;
}