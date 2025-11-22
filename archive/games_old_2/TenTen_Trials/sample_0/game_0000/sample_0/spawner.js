// spawner.js - Symbol spawning system
import { gameState } from './globals.js';
import { getCurrentLevelConfig } from './levelManager.js';
import { Symbol } from './symbol.js';

export function updateSpawner(p) {
  gameState.spawnTimer++;
  
  if (gameState.spawnTimer >= gameState.nextSpawnTime) {
    spawnSymbol(p);
    gameState.spawnTimer = 0;
    
    const config = getCurrentLevelConfig();
    const minFrames = config.spawnRateMin * 60;
    const maxFrames = config.spawnRateMax * 60;
    gameState.nextSpawnTime = p.random(minFrames, maxFrames);
  }
}

function spawnSymbol(p) {
  const config = getCurrentLevelConfig();
  const symbolType = p.random(config.symbols);
  const symbol = new Symbol(p, symbolType, -30, config.fallSpeed);
  gameState.entities.push(symbol);
}