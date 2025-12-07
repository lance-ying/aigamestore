// levelManager.js - Level progression and transitions

import { gameState, LEVEL_CONFIGS, GAME_PHASES, PLAYER_CONFIG } from './globals.js';
import { Player } from './player.js';

export function checkLevelCompletion(p, currentTime) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const config = LEVEL_CONFIGS[gameState.currentLevel];
  if (!config) return;
  
  // Check if kill target is met
  const killsMet = gameState.levelKills >= config.killTarget;
  
  // Level complete
  if (killsMet) {
    // Award completion bonus
    gameState.score += config.completionBonus;
    
    // Clear remaining enemies
    for (const enemy of gameState.enemies) {
      enemy.isDead = true;
    }
    
    // Check if this was the final level
    if (gameState.currentLevel === 6) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { phase: "GAME_OVER_WIN", finalScore: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else {
      // Transition to next level
      gameState.gamePhase = GAME_PHASES.LEVEL_TRANSITION;
      gameState.transitionStartTime = Date.now();
      gameState.transitionMessage = config.clearMessage;
      
      p.logs.game_info.push({
        data: { phase: "LEVEL_TRANSITION", level: gameState.currentLevel },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export function updateLevelTransition(p, currentTime) {
  const elapsed = currentTime - gameState.transitionStartTime;
  
  if (elapsed >= gameState.transitionDuration) {
    // Start next level
    gameState.currentLevel++;
    gameState.levelStartTime = Date.now();
    gameState.levelKills = 0;
    gameState.lastEnemySpawn = 0;
    gameState.bossSpawned = false;
    gameState.miniBossSpawned = false;
    gameState.bossDefeated = false;
    
    // Reset player upgrades (start fresh but keep level progression)
    gameState.player = new Player(PLAYER_CONFIG.startX, PLAYER_CONFIG.startY);
    gameState.entities = [gameState.player];
    gameState.projectiles = [];
    gameState.expGems = [];
    gameState.enemies = [];
    
    gameState.gamePhase = GAME_PHASES.PLAYING;
    
    p.logs.game_info.push({
      data: { phase: "PLAYING", level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}