// wave.js - Wave management and enemy spawning

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Enemy } from './entities.js';

export function updateWaveSystem(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  // Check if wave is complete
  if (gameState.enemies.length === 0 && gameState.enemiesSpawned >= gameState.enemiesInWave) {
    gameState.waveTimer--;
    
    if (gameState.waveTimer <= 0) {
      startNextWave(p);
    }
  } else {
    // Spawn enemies for current wave
    if (gameState.enemiesSpawned < gameState.enemiesInWave) {
      // Spawn one enemy every 60 frames
      if (gameState.frameCount % 60 === 0) {
        spawnEnemy(p);
        gameState.enemiesSpawned++;
      }
    }
  }
}

function startNextWave(p) {
  gameState.wave++;
  gameState.enemiesInWave = Math.floor(2 + gameState.wave * 1.5);
  gameState.enemiesSpawned = 0;
  gameState.waveTimer = gameState.waveDelay;
  
  p.logs.game_info.push({
    data: { event: 'wave_start', wave: gameState.wave, enemies: gameState.enemiesInWave },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

function spawnEnemy(p) {
  // Spawn at random position on arena edge
  const side = Math.floor(Math.random() * 4);
  let x, y;
  
  switch (side) {
    case 0: // Top
      x = gameState.arenaLeft + Math.random() * (gameState.arenaRight - gameState.arenaLeft);
      y = gameState.arenaTop + 30;
      break;
    case 1: // Right
      x = gameState.arenaRight - 30;
      y = gameState.arenaTop + Math.random() * (gameState.arenaBottom - gameState.arenaTop);
      break;
    case 2: // Bottom
      x = gameState.arenaLeft + Math.random() * (gameState.arenaRight - gameState.arenaLeft);
      y = gameState.arenaBottom - 30;
      break;
    case 3: // Left
      x = gameState.arenaLeft + 30;
      y = gameState.arenaTop + Math.random() * (gameState.arenaBottom - gameState.arenaTop);
      break;
  }
  
  new Enemy(x, y);
}