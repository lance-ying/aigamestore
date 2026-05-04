// wave_manager.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Beast } from './beast.js';

export function updateWaves(p) {
  if (gameState.currentWave >= gameState.maxWaves) return;

  if (!gameState.waveActive) {
    gameState.waveTimer += gameState.timeScale;
    
    if (gameState.waveTimer >= gameState.waveDuration) {
      startWave(p);
    }
  } else {
    // Check if wave is complete
    const aliveBeasts = gameState.beasts.filter(b => b.isAlive).length;
    if (aliveBeasts === 0) {
      endWave();
    }
  }
}

function startWave(p) {
  gameState.currentWave++;
  gameState.waveActive = true;
  gameState.waveTimer = 0;

  const beastCount = 3 + gameState.currentWave * 2;
  
  // Spawn beasts from edges
  for (let i = 0; i < beastCount; i++) {
    const side = Math.floor(p.random(4));
    let x, y;
    
    switch(side) {
      case 0: // Top
        x = p.random(20, CANVAS_WIDTH - 20);
        y = 10;
        break;
      case 1: // Right
        x = CANVAS_WIDTH - 10;
        y = p.random(20, CANVAS_HEIGHT - 20);
        break;
      case 2: // Bottom
        x = p.random(20, CANVAS_WIDTH - 20);
        y = CANVAS_HEIGHT - 10;
        break;
      case 3: // Left
        x = 10;
        y = p.random(20, CANVAS_HEIGHT - 20);
        break;
    }
    
    const beast = new Beast(x, y, gameState.currentWave);
    gameState.beasts.push(beast);
    gameState.entities.push(beast);
  }

  // Log wave start
  p.logs.game_info.push({
    data: `Wave ${gameState.currentWave} started with ${beastCount} beasts`,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function endWave() {
  gameState.waveActive = false;
  gameState.waveTimer = 0;

  // Bonus resources for surviving
  gameState.food += 20 + gameState.currentWave * 5;
  gameState.wood += 15 + gameState.currentWave * 3;
  gameState.coal += 10 + gameState.currentWave * 2;

  if (gameState.currentWave >= gameState.maxWaves) {
    gameState.gamePhase = "GAME_OVER_WIN";
  }
}