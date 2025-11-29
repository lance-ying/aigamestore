// wave_manager.js - Wave progression and spawning
import { gameState, ZOMBIRD_TYPES } from './globals.js';
import { Zombird } from './entities.js';

export function startWave(p) {
  gameState.wave++;
  
  // Calculate wave difficulty
  const baseCount = 3;
  const waveMultiplier = Math.floor((gameState.wave - 1) / 5) + 1;
  gameState.waveZombirdCount = baseCount + (gameState.wave - 1) * 2 * waveMultiplier;
  gameState.waveZombirdSpawned = 0;
  gameState.nextSpawnFrame = p.frameCount + 60;
  
  // Log wave start
  p.logs.game_info.push({
    data: { event: 'wave_start', wave: gameState.wave, zombirdCount: gameState.waveZombirdCount },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateWaveSpawning(p) {
  if (gameState.waveZombirdSpawned < gameState.waveZombirdCount) {
    if (p.frameCount >= gameState.nextSpawnFrame) {
      spawnZombird(p);
      gameState.waveZombirdSpawned++;
      
      // Schedule next spawn
      const spawnDelay = Math.max(20, 80 - gameState.wave * 2);
      gameState.nextSpawnFrame = p.frameCount + spawnDelay;
    }
  }
}

function spawnZombird(p) {
  // Determine type based on wave
  let type;
  const rand = p.random(100);
  
  if (gameState.wave < 5) {
    type = ZOMBIRD_TYPES.BASIC;
  } else if (gameState.wave < 10) {
    if (rand < 70) {
      type = ZOMBIRD_TYPES.BASIC;
    } else {
      type = ZOMBIRD_TYPES.FAST;
    }
  } else if (gameState.wave < 15) {
    if (rand < 40) {
      type = ZOMBIRD_TYPES.BASIC;
    } else if (rand < 70) {
      type = ZOMBIRD_TYPES.FAST;
    } else {
      type = ZOMBIRD_TYPES.TANK;
    }
  } else {
    if (rand < 30) {
      type = ZOMBIRD_TYPES.BASIC;
    } else if (rand < 55) {
      type = ZOMBIRD_TYPES.FAST;
    } else if (rand < 80) {
      type = ZOMBIRD_TYPES.TANK;
    } else {
      type = ZOMBIRD_TYPES.ELITE;
    }
  }
  
  // Spawn at random x position at top
  const x = p.random(30, 570);
  const y = -30;
  
  const zombird = new Zombird(x, y, type, p);
  gameState.zombirds.push(zombird);
  gameState.entities.push(zombird);
}

export function checkWaveComplete(p) {
  // Wave complete when all spawned and none alive
  if (gameState.waveZombirdSpawned >= gameState.waveZombirdCount && 
      gameState.zombirds.length === 0) {
    gameState.gamePhase = "WAVE_COMPLETE";
    
    p.logs.game_info.push({
      data: { event: 'wave_complete', wave: gameState.wave },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}