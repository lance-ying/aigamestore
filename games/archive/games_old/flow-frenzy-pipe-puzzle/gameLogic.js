// gameLogic.js - Core game logic

import { gameState, GAME_PHASES, PIPE_TYPES } from './globals.js';
import { initializeLevel } from './levels.js';
import { validatePath } from './pathfinding.js';

export function startGame(p) {
  gameState.score = 0;
  gameState.currentLevel = 1;
  loadLevel(1, p);
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  p.logs.game_info.push({
    data: { phase: GAME_PHASES.PLAYING, level: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function loadLevel(levelNum, p) {
  const levelData = initializeLevel(levelNum);
  if (!levelData) return false;
  
  gameState.grid = levelData.grid;
  gameState.gridWidth = levelData.gridWidth;
  gameState.gridHeight = levelData.gridHeight;
  gameState.timeRemaining = levelData.timeLimit;
  gameState.startPos = levelData.startPos;
  gameState.endPos = levelData.endPos;
  gameState.cursorX = Math.floor(levelData.gridWidth / 2);
  gameState.cursorY = Math.floor(levelData.gridHeight / 2);
  gameState.waterPath = [];
  gameState.waterAnimProgress = 0;
  gameState.levelStartTime = Date.now();
  
  return true;
}

export function updateGame(p) {
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Update timer
    const elapsed = (Date.now() - gameState.levelStartTime) / 1000;
    const levelData = initializeLevel(gameState.currentLevel);
    gameState.timeRemaining = Math.max(0, levelData.timeLimit - elapsed);
    
    // Check time out
    if (gameState.timeRemaining <= 0) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.GAME_OVER_LOSE, reason: 'timeout' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  if (gameState.gamePhase === GAME_PHASES.WATER_FLOW) {
    gameState.waterAnimProgress += 0.02;
    
    if (gameState.waterAnimProgress >= 1.5) {
      // Water animation complete
      if (gameState.waterPath.length > 0) {
        const lastPos = gameState.waterPath[gameState.waterPath.length - 1];
        if (lastPos.x === gameState.endPos.x && lastPos.y === gameState.endPos.y) {
          // Success!
          const timeBonus = Math.floor(gameState.timeRemaining * 10);
          gameState.score += 500 + timeBonus;
          gameState.gamePhase = GAME_PHASES.LEVEL_COMPLETE;
          
          p.logs.game_info.push({
            data: { phase: GAME_PHASES.LEVEL_COMPLETE, score: gameState.score },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        } else {
          // Path didn't reach end
          gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
          p.logs.game_info.push({
            data: { phase: GAME_PHASES.GAME_OVER_LOSE, reason: 'incomplete_path' },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      } else {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
        p.logs.game_info.push({
          data: { phase: GAME_PHASES.GAME_OVER_LOSE, reason: 'no_path' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
}

export function executeAction(action, p) {
  if (!action) return;
  
  switch (action.action) {
    case 'START_GAME':
      startGame(p);
      break;
      
    case 'PAUSE':
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      break;
      
    case 'UNPAUSE':
      gameState.gamePhase = GAME_PHASES.PLAYING;
      gameState.levelStartTime = Date.now() - (initializeLevel(gameState.currentLevel).timeLimit - gameState.timeRemaining) * 1000;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      break;
      
    case 'RESTART':
      gameState.gamePhase = GAME_PHASES.START;
      gameState.score = 0;
      gameState.currentLevel = 1;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.START },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      break;
      
    case 'MOVE_LEFT':
      if (gameState.cursorX > 0) {
        gameState.cursorX--;
        logPlayerInfo(p);
      }
      break;
      
    case 'MOVE_RIGHT':
      if (gameState.cursorX < gameState.gridWidth - 1) {
        gameState.cursorX++;
        logPlayerInfo(p);
      }
      break;
      
    case 'MOVE_UP':
      if (gameState.cursorY > 0) {
        gameState.cursorY--;
        logPlayerInfo(p);
      }
      break;
      
    case 'MOVE_DOWN':
      if (gameState.cursorY < gameState.gridHeight - 1) {
        gameState.cursorY++;
        logPlayerInfo(p);
      }
      break;
      
    case 'ROTATE_CW':
      rotatePipe(true, p);
      break;
      
    case 'ROTATE_CCW':
      rotatePipe(false, p);
      break;
      
    case 'START_WATER':
      startWaterFlow(p);
      break;
      
    case 'NEXT_LEVEL':
      nextLevel(p);
      break;
  }
}

function rotatePipe(clockwise, p) {
  const pipe = gameState.grid[gameState.cursorY][gameState.cursorX];
  if (pipe && pipe.type !== PIPE_TYPES.EMPTY && 
      pipe.type !== PIPE_TYPES.BLOCKED &&
      pipe.type !== PIPE_TYPES.START && 
      pipe.type !== PIPE_TYPES.END) {
    pipe.rotate(clockwise);
    logPlayerInfo(p);
  }
}

function startWaterFlow(p) {
  const result = validatePath();
  gameState.waterPath = result.path;
  gameState.waterAnimProgress = 0;
  gameState.gamePhase = GAME_PHASES.WATER_FLOW;
  
  p.logs.game_info.push({
    data: { phase: GAME_PHASES.WATER_FLOW, pathValid: result.success },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function nextLevel(p) {
  if (gameState.currentLevel < gameState.maxLevel) {
    gameState.currentLevel++;
    loadLevel(gameState.currentLevel, p);
    gameState.gamePhase = GAME_PHASES.PLAYING;
    
    p.logs.game_info.push({
      data: { phase: GAME_PHASES.PLAYING, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: GAME_PHASES.GAME_OVER_WIN, finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function logPlayerInfo(p) {
  p.logs.player_info.push({
    screen_x: gameState.cursorX,
    screen_y: gameState.cursorY,
    game_x: gameState.cursorX,
    game_y: gameState.cursorY,
    framecount: p.frameCount
  });
}