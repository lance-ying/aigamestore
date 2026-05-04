// game_logic.js - Game initialization and update logic

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player, Enemy, QiOrb } from './entities.js';

export function initGame(p) {
  // Reset game state
  gameState.player = new Player(p, 1000, 1000);
  gameState.entities = [];
  gameState.qiOrbs = [];
  gameState.enemies = [];
  gameState.particles = [];
  gameState.score = 0;
  gameState.qi = 0;
  gameState.cultivationStage = 0;
  gameState.frameCounter = 0;
  gameState.worldOffsetX = gameState.player.worldX;
  gameState.worldOffsetY = gameState.player.worldY;
  gameState.combatLog = [];
  gameState.lastBreakthroughTime = 0;

  // Add player to entities
  gameState.entities.push(gameState.player);

  // Spawn initial Qi orbs
  spawnQiOrbs(p, 30);

  // Spawn initial enemies
  spawnEnemies(p, 5);

  // Log game start
  p.logs.game_info.push({
    data: { phase: "PLAYING", message: "Game started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function spawnQiOrbs(p, count) {
  for (let i = 0; i < count; i++) {
    const x = p.random(100, 1900);
    const y = p.random(100, 1900);
    const orb = new QiOrb(p, x, y);
    gameState.qiOrbs.push(orb);
  }
}

export function spawnEnemies(p, count) {
  for (let i = 0; i < count; i++) {
    // Spawn away from player
    let x, y;
    do {
      x = p.random(100, 1900);
      y = p.random(100, 1900);
      const dx = x - gameState.player.worldX;
      const dy = y - gameState.player.worldY;
      const dist = p.sqrt(dx * dx + dy * dy);
      if (dist > 200) break;
    } while (true);

    const type = p.floor(p.random(3));
    const enemy = new Enemy(p, x, y, type);
    gameState.enemies.push(enemy);
  }
}

export function updateGame(p) {
  gameState.frameCounter++;

  // Update player
  gameState.player.update();

  // Update world offset (camera follows player)
  gameState.worldOffsetX = gameState.player.worldX;
  gameState.worldOffsetY = gameState.player.worldY;

  // Update Qi orbs
  for (const orb of gameState.qiOrbs) {
    orb.update(gameState.player);
  }

  // Remove collected orbs
  gameState.qiOrbs = gameState.qiOrbs.filter(orb => orb.active);

  // Spawn more orbs if needed
  if (gameState.qiOrbs.length < 20) {
    spawnQiOrbs(p, 5);
  }

  // Update enemies
  for (const enemy of gameState.enemies) {
    enemy.update(gameState.player);
  }

  // Remove dead enemies
  const aliveEnemies = gameState.enemies.filter(e => e.active);
  if (aliveEnemies.length < gameState.enemies.length) {
    gameState.enemies = aliveEnemies;
  }

  // Spawn more enemies based on cultivation stage
  const maxEnemies = 5 + gameState.cultivationStage * 2;
  if (gameState.enemies.length < maxEnemies && gameState.frameCounter % 300 === 0) {
    spawnEnemies(p, 2);
  }

  // Update particles
  for (const particle of gameState.particles) {
    particle.update();
  }

  // Remove dead particles
  gameState.particles = gameState.particles.filter(p => !p.isDead());

  // Log player info periodically
  if (gameState.frameCounter % 30 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.worldX,
      game_y: gameState.player.worldY,
      framecount: p.frameCount
    });
  }
}