// game_loop.js - Main game loop logic
import { gameState, PHASE_PLAYING } from './globals.js';
import { updateSnake } from './player.js';
import { updateDifficulty, spawnEntities } from './spawner.js';
import { checkCollisions } from './collision.js';

export function updateGame(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Update player
  if (gameState.player) {
    updateSnake(p);
  }
  
  // Update scroll
  gameState.scrollOffset += gameState.scrollSpeed;
  gameState.distance += gameState.scrollSpeed / 10;
  gameState.score += 0.1;
  gameState.framesSurvived++;
  
  // Update difficulty
  updateDifficulty();
  
  // Spawn entities
  spawnEntities(p);
  
  // Update all entities
  for (let entity of gameState.entities) {
    if (entity.active !== false && entity.update) {
      entity.update(p);
    }
  }
  
  // Clean up inactive entities
  gameState.blocks = gameState.blocks.filter(b => b.active);
  gameState.orbs = gameState.orbs.filter(o => o.active);
  gameState.entities = gameState.entities.filter(e => e.active !== false);
  
  // Check collisions
  checkCollisions();
  
  // Log player position periodically
  if (p.frameCount % 10 === 0 && gameState.player && gameState.snakeSegments.length > 0) {
    const head = gameState.snakeSegments[0];
    p.logs.player_info.push({
      screen_x: head.x,
      screen_y: head.y,
      game_x: head.x,
      game_y: gameState.scrollOffset,
      framecount: p.frameCount
    });
  }
}

export function resetGame() {
  // Reset game state
  gameState.score = 0;
  gameState.distance = 0;
  gameState.snakeLength = 20;
  gameState.snakeSegments = [];
  gameState.scrollSpeed = 2;
  gameState.scrollOffset = 0;
  gameState.blocks = [];
  gameState.orbs = [];
  gameState.entities = [];
  gameState.lastSpawnY = -100;
  gameState.spawnInterval = 150;
  gameState.minBlockValue = 5;
  gameState.maxBlockValue = 15;
  gameState.framesSurvived = 0;
  gameState.orbsCollected = 0;
  gameState.blocksHit = 0;
  gameState.player = null;
}