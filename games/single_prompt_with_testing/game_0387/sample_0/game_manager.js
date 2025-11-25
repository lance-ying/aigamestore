// game_manager.js - Game state management and progression

import { gameState, GAME_PHASES, ARENA_TIERS } from './globals.js';
import { createPlayer } from './player.js';
import { spawnEnemy } from './enemy.js';
import { getArenaTier } from './arena.js';

export function initializeGame(p) {
  // Reset game state
  gameState.player = null;
  gameState.entities = [];
  gameState.enemies = [];
  gameState.particles = [];
  gameState.score = 0;
  gameState.gold = 0;
  gameState.currentTier = 0;
  gameState.defeatedEnemies = 0;
  gameState.framesSinceLastAction = 0;
  gameState.positionHistory = [];

  // Create player
  const player = createPlayer(150, 300);
  
  // Setup first arena
  setupArena(p);

  // Log game initialization
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { action: "game_initialized", tier: gameState.currentTier },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function setupArena(p) {
  // Clear existing enemies
  gameState.enemies = [];
  gameState.entities = gameState.entities.filter(e => e === gameState.player);
  gameState.defeatedEnemies = 0;

  // Get current tier info
  const tier = getArenaTier(gameState.currentTier);
  gameState.arenaName = tier.name;
  gameState.totalEnemiesInTier = tier.enemies;

  // Spawn enemies
  if (tier.isFinal) {
    // Spawn champion in center
    spawnEnemy(400, 300, true);
  } else {
    // Spawn regular enemies
    for (let i = 0; i < tier.enemies; i++) {
      const x = 350 + i * 60;
      spawnEnemy(x, 300, false);
    }
  }

  // Log arena setup
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { action: "arena_setup", tier: gameState.currentTier, arenaName: tier.name, enemyCount: tier.enemies },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function checkGameProgress(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;

  // Check win condition - all enemies defeated
  if (gameState.defeatedEnemies >= gameState.totalEnemiesInTier) {
    // Check if this was the final arena
    if (gameState.currentTier === 3) {
      // Victory!
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      
      if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase, action: "victory", finalScore: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else {
      // Advance to next tier
      gameState.currentTier++;
      setupArena(p);
      
      // Heal player partially
      if (gameState.player) {
        gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + 30);
      }
    }
  }

  // Check lose condition - player health <= 0
  if (gameState.player && gameState.player.health <= 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    
    if (p.logs && p.logs.game_info) {
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, action: "defeat", finalScore: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export function logPlayerInfo(p) {
  if (!gameState.player || gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Log player info every 10 frames
  if (p.frameCount % 10 === 0 && p.logs && p.logs.player_info) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}