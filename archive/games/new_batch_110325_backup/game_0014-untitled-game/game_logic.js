// game_logic.js - Core game logic

import { gameState, GAME_PHASES } from './globals.js';
import { LEVEL_DATA, checkPuzzleSolution } from './levels.js';
import { Hotspot } from './entities.js';

export function initializeLevel(levelIndex) {
  const levelData = LEVEL_DATA[levelIndex];
  if (!levelData) return;
  
  gameState.currentLevel = levelIndex;
  gameState.currentHotspots = [];
  gameState.selectedHotspotIndex = 0;
  
  // Create hotspots for this level
  levelData.hotspots.forEach(hotspotData => {
    const hotspot = new Hotspot(hotspotData);
    gameState.currentHotspots.push(hotspot);
  });
  
  // Reset puzzle progress for this level
  gameState.puzzleProgress[levelIndex] = [];
}

export function updateGameLogic(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Check if current level is solved
  checkLevelCompletion(p);
  
  // Update player position log
  if (gameState.player && p.frameCount % 60 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}

function checkLevelCompletion(p) {
  const levelData = LEVEL_DATA[gameState.currentLevel];
  if (!levelData) return;
  
  const interactions = gameState.puzzleProgress[gameState.currentLevel] || [];
  
  if (checkPuzzleSolution(levelData, interactions)) {
    completeLevel(p);
  }
}

function completeLevel(p) {
  gameState.completedLevels++;
  gameState.score += 100;
  gameState.familyTreeUnlocked.push(LEVEL_DATA[gameState.currentLevel].character);
  
  p.logs.game_info.push({
    data: { 
      event: 'level_complete', 
      level: gameState.currentLevel,
      character: LEVEL_DATA[gameState.currentLevel].character
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Check if game is won
  if (gameState.completedLevels >= gameState.totalLevels) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: 'GAME_OVER_WIN', finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    // Move to next level
    initializeLevel(gameState.currentLevel + 1);
  }
}

export function checkSecrets(p) {
  const levelData = LEVEL_DATA[gameState.currentLevel];
  if (!levelData || !levelData.secrets) return;
  
  levelData.secrets.forEach(secret => {
    if (!secret.found && gameState.player) {
      const dist = p.dist(gameState.player.x, gameState.player.y, secret.x, secret.y);
      if (dist < 30) {
        secret.found = true;
        gameState.secretsFound++;
        gameState.score += 50;
        
        p.logs.game_info.push({
          data: { event: 'secret_found', secretId: secret.id },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  });
}