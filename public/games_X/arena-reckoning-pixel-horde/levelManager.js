// levelManager.js - Level progression and transitions

import { gameState, LEVEL_CONFIGS, GAME_PHASES } from './globals.js';

export function checkLevelCompletion(p, currentTime) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const levelTime = currentTime - gameState.levelStartTime;
  const config = LEVEL_CONFIGS[gameState.currentLevel];
  
  if (!config) return;
  
  // Check if level time has expired
  const timeExpired = levelTime >= config.duration;
  
  // Check if required bosses are defeated
  let bossRequirementMet = true;
  
  if (gameState.currentLevel === 6 || gameState.currentLevel === 8) {
    // Levels with miniboss
    bossRequirementMet = !gameState.miniBossSpawned || gameState.bossDefeated;
  } else if (gameState.currentLevel === 9) {
    // Final level with boss
    bossRequirementMet = !gameState.bossSpawned || gameState.bossDefeated;
  }
  
  // Level complete
  if (timeExpired && bossRequirementMet) {
    // Award completion bonus
    gameState.score += config.completionBonus;
    
    // Clear remaining enemies
    for (const enemy of gameState.enemies) {
      enemy.isDead = true;
    }
    
    // Check if this was the final level
    if (gameState.currentLevel === 9) {
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
    gameState.levelDuration = LEVEL_CONFIGS[gameState.currentLevel].duration;
    gameState.lastEnemySpawn = 0;
    gameState.bossSpawned = false;
    gameState.miniBossSpawned = false;
    gameState.bossDefeated = false;
    
    gameState.gamePhase = GAME_PHASES.PLAYING;
    
    p.logs.game_info.push({
      data: { phase: "PLAYING", level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}