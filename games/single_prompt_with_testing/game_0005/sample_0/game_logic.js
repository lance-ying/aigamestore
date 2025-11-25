// game_logic.js - Main game logic
import { GAME_PHASES, gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { spawnWildPal, spawnPoachers } from './spawning.js';
import { Projectile } from './entities.js';

export function updateCamera() {
  const player = gameState.player;
  if (!player) return;
  
  gameState.camera.x = player.x;
  gameState.camera.y = player.y;
}

export function updateGameLogic(p) {
  gameState.frameCount++;
  
  // Clean up inactive entities
  gameState.entities = gameState.entities.filter(e => e.active);
  gameState.projectiles = gameState.projectiles.filter(e => e.active);
  gameState.particles = gameState.particles.filter(e => e.active);
  gameState.wildPals = gameState.wildPals.filter(e => e.active);
  gameState.capturedPals = gameState.capturedPals.filter(e => e.active);
  gameState.poachers = gameState.poachers.filter(e => e.active);
  
  // Update all entities
  for (const entity of gameState.entities) {
    if (entity.active) {
      entity.update();
    }
  }
  
  // Spawn wild pals periodically
  if (gameState.frameCount % 300 === 0) {
    spawnWildPal();
  }
  
  // Spawn poacher waves
  const timeSinceLastWave = Date.now() - gameState.lastWaveTime;
  if (timeSinceLastWave > 20000 + gameState.waveNumber * 5000) {
    gameState.waveNumber++;
    gameState.lastWaveTime = Date.now();
    const count = 2 + Math.floor(gameState.waveNumber / 2);
    spawnPoachers(count);
  }
  
  // Poachers shoot at player
  const player = gameState.player;
  if (player) {
    for (const poacher of gameState.poachers) {
      if (!poacher.active) continue;
      
      const dx = player.x - poacher.x;
      const dy = player.y - poacher.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 200 && dist > 50 && poacher.canAttack()) {
        const speed = 5;
        const proj = new Projectile(
          poacher.x,
          poacher.y,
          (dx / dist) * speed,
          (dy / dist) * speed,
          8,
          'poacher'
        );
        gameState.projectiles.push(proj);
        gameState.entities.push(proj);
        poacher.attack();
      }
    }
  }
  
  // Update hunger
  if (gameState.frameCount % 60 === 0) {
    gameState.hunger -= 0.5;
    if (gameState.hunger < 0) gameState.hunger = 0;
    
    if (gameState.hunger === 0 && player) {
      player.takeDamage(2);
    }
  }
  
  // Consume food automatically
  if (gameState.hunger < 70 && gameState.resources.food > 0) {
    const foodToEat = Math.min(30, gameState.resources.food);
    gameState.resources.food -= foodToEat;
    gameState.hunger += foodToEat;
    if (gameState.hunger > 100) gameState.hunger = 100;
  }
  
  // Check win condition
  if (gameState.resources.prosperity >= 1000) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, reason: "prosperity_reached" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Check lose condition
  if (player && player.health <= 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, reason: "player_died" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Log player info periodically
  if (player && gameState.frameCount % 30 === 0) {
    p.logs.player_info.push({
      screen_x: player.x - gameState.camera.x + CANVAS_WIDTH / 2,
      screen_y: player.y - gameState.camera.y + CANVAS_HEIGHT / 2,
      game_x: player.x,
      game_y: player.y,
      framecount: p.frameCount
    });
  }
}