// game_logic.js - Core game logic
import { gameState, GAME_PHASES } from './globals.js';
import { handleCollisions } from './collision.js';
import { generateWorld } from './world.js';

export function updateGame(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const player = gameState.player;
  if (!player) return;
  
  // Update frame counter
  gameState.framesSurvived++;
  
  // Update all entities
  for (let entity of gameState.entities) {
    if (entity && entity.update) {
      entity.update();
    }
  }
  
  // Update projectiles
  for (let projectile of gameState.projectiles) {
    if (projectile.active) {
      projectile.update();
    }
  }
  
  // Handle collisions
  handleCollisions(p);
  
  // World transition
  if (gameState.worldTransitionTimer > 0) {
    gameState.worldTransitionTimer--;
  }
  
  // Check for world progression
  checkWorldProgression(p);
  
  // Check win/lose conditions
  checkGameOverConditions(p);
  
  // Log player info periodically
  if (p.frameCount % 30 === 0) {
    p.logs.player_info.push({
      screen_x: player.x - gameState.cameraOffsetX,
      screen_y: player.y,
      game_x: player.x,
      game_y: player.y,
      framecount: p.frameCount
    });
  }
}

function checkWorldProgression(p) {
  const player = gameState.player;
  
  // Progress to next world when reaching the right edge
  if (gameState.currentWorld < 3 && player.x > gameState.worldWidth - 100) {
    if (gameState.worldTransitionTimer === 0) {
      gameState.currentWorld++;
      player.x = 50;
      player.y = 100;
      generateWorld(p, gameState.currentWorld);
      gameState.worldTransitionTimer = 120;
      
      p.logs.game_info.push({
        data: { world: gameState.currentWorld, message: `Entered world ${gameState.currentWorld}` },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

function checkGameOverConditions(p) {
  const player = gameState.player;
  
  // Lose condition - player health reaches 0
  if (player.health <= 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Player defeated", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Win condition - defeat Glorkon (boss)
  if (gameState.boss && !gameState.boss.active) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Glorkon defeated! Universe saved!", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}