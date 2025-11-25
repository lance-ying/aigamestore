// spawning.js - Entity spawning logic
import { WORLD_WIDTH, WORLD_HEIGHT, PAL_TYPES, gameState } from './globals.js';
import { Pal, Poacher } from './entities.js';

export function spawnInitialPals() {
  const types = Object.keys(PAL_TYPES);
  
  for (let i = 0; i < 8; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const x = 100 + Math.random() * (WORLD_WIDTH - 200);
    const y = 100 + Math.random() * (WORLD_HEIGHT - 200);
    const pal = new Pal(x, y, type);
    gameState.wildPals.push(pal);
    gameState.pals.push(pal);
    gameState.entities.push(pal);
  }
}

export function spawnWildPal() {
  if (gameState.wildPals.length >= 15) return;
  
  const types = Object.keys(PAL_TYPES);
  const type = types[Math.floor(Math.random() * types.length)];
  
  // Spawn away from player
  const player = gameState.player;
  let x, y;
  let attempts = 0;
  do {
    x = 100 + Math.random() * (WORLD_WIDTH - 200);
    y = 100 + Math.random() * (WORLD_HEIGHT - 200);
    attempts++;
    if (attempts > 20) break;
    if (player) {
      const dx = x - player.x;
      const dy = y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 250) break;
    }
  } while (attempts < 20);
  
  const pal = new Pal(x, y, type);
  gameState.wildPals.push(pal);
  gameState.pals.push(pal);
  gameState.entities.push(pal);
}

export function spawnPoachers(count) {
  for (let i = 0; i < count; i++) {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(side) {
      case 0: x = Math.random() * WORLD_WIDTH; y = 0; break;
      case 1: x = WORLD_WIDTH; y = Math.random() * WORLD_HEIGHT; break;
      case 2: x = Math.random() * WORLD_WIDTH; y = WORLD_HEIGHT; break;
      case 3: x = 0; y = Math.random() * WORLD_HEIGHT; break;
    }
    
    const poacher = new Poacher(x, y);
    gameState.poachers.push(poacher);
    gameState.entities.push(poacher);
  }
}