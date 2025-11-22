import { gameState, GAME_PHASES, LEVELS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { createScene } from './scene.js';

let currentSceneBuffer = null;

export function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentLevelIndex = 0;
  gameState.totalScore = 0;
  
  initLevel(p, 0);
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", level: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function initLevel(p, levelIndex) {
  const level = LEVELS[levelIndex];
  
  gameState.currentLevelIndex = levelIndex;
  gameState.levelTimer = level.timeLimit;
  gameState.remainingHints = level.hints;
  gameState.currentZoomLevel = 1.0;
  gameState.panOffsetX = 0;
  gameState.panOffsetY = 0;
  gameState.levelScore = 0;
  
  gameState.objectsToFind = level.objects.map(obj => obj.name);
  gameState.foundObjects = [];
  
  gameState.incorrectClickFeedback = null;
  gameState.hintFeedback = null;
  
  // Create scene
  currentSceneBuffer = createScene(p, levelIndex);
  
  // Reset test state
  gameState.testTimer = 0;
  gameState.testObjectIndex = 0;
  gameState.testPhase = "IDLE";
}

export function updateGame(p) {
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Update timer
    gameState.levelTimer -= 1 / 60;
    
    if (gameState.levelTimer <= 0) {
      gameOver(p, false);
    }
    
    // Check if all objects found
    if (gameState.foundObjects.length === gameState.objectsToFind.length) {
      levelComplete(p);
    }
  }
}

export function checkObjectClick(p, screenX, screenY) {
  // Convert screen coordinates to game world coordinates
  const worldX = (screenX - gameState.panOffsetX) / gameState.currentZoomLevel;
  const worldY = (screenY - gameState.panOffsetY) / gameState.currentZoomLevel;
  
  const level = LEVELS[gameState.currentLevelIndex];
  
  // Check if clicked on any unfound object
  for (const obj of level.objects) {
    if (gameState.foundObjects.includes(obj.name)) continue;
    
    const dist = Math.sqrt((worldX - obj.x) ** 2 + (worldY - obj.y) ** 2);
    
    if (dist <= obj.radius) {
      // Found object!
      gameState.foundObjects.push(obj.name);
      gameState.levelScore += 100;
      gameState.totalScore += 100;
      
      return true;
    }
  }
  
  // Incorrect click - penalty
  const penalty = level.incorrectPenalty;
  gameState.levelTimer -= penalty;
  
  gameState.incorrectClickFeedback = {
    x: worldX,
    y: worldY,
    frameCount: p.frameCount
  };
  
  return false;
}

function levelComplete(p) {
  // Time bonus
  const timeBonus = Math.floor(gameState.levelTimer) * 10;
  gameState.levelScore += timeBonus;
  gameState.totalScore += timeBonus;
  
  // Level completion bonus
  gameState.levelScore += 500;
  gameState.totalScore += 500;
  
  // Update high score
  if (gameState.totalScore > gameState.highScore) {
    gameState.highScore = gameState.totalScore;
    // Store in localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hiddenObjectsHighScore', gameState.highScore.toString());
    }
  }
  
  gameState.gamePhase = GAME_PHASES.LEVEL_COMPLETE;
  
  p.logs.game_info.push({
    data: { phase: "LEVEL_COMPLETE", level: gameState.currentLevelIndex + 1, score: gameState.levelScore },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Check if this was the last level
  if (gameState.currentLevelIndex >= LEVELS.length - 1) {
    // Wait for next level input but will actually go to win screen
  }
}

export function nextLevel(p) {
  if (gameState.currentLevelIndex < LEVELS.length - 1) {
    gameState.currentLevelIndex++;
    gameState.gamePhase = GAME_PHASES.PLAYING;
    gameState.levelScore = 0;
    initLevel(p, gameState.currentLevelIndex);
    
    p.logs.game_info.push({
      data: { phase: "PLAYING", level: gameState.currentLevelIndex + 1 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    // Win the game
    gameOver(p, true);
  }
}

function gameOver(p, isWin) {
  if (isWin) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    
    // Update high score
    if (gameState.totalScore > gameState.highScore) {
      gameState.highScore = gameState.totalScore;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('hiddenObjectsHighScore', gameState.highScore.toString());
      }
    }
    
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", totalScore: gameState.totalScore },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", totalScore: gameState.totalScore },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.totalScore = 0;
  gameState.levelScore = 0;
  gameState.currentLevelIndex = 0;
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function pauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PAUSED;
  
  p.logs.game_info.push({
    data: { phase: "PAUSED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function unpauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function getCurrentSceneBuffer() {
  return currentSceneBuffer;
}