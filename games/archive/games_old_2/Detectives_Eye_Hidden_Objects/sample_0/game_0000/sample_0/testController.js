import { gameState, GAME_PHASES, LEVELS } from './globals.js';
import { startGame, nextLevel, checkObjectClick } from './gameLogic.js';

export function updateTestController(p) {
  if (gameState.controlMode === "HUMAN") {
    return;
  }
  
  if (gameState.controlMode === "TEST_1") {
    runBasicTest(p);
  } else if (gameState.controlMode === "TEST_2") {
    runWinTest(p);
  }
}

function runBasicTest(p) {
  // Basic test: Start game, find a few objects, then idle
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (p.frameCount > 60) {
      startGame(p);
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    gameState.testTimer++;
    
    if (gameState.testTimer > 30 && gameState.foundObjects.length < 3) {
      // Find first 3 objects
      const level = LEVELS[gameState.currentLevelIndex];
      const objToFind = level.objects[gameState.foundObjects.length];
      
      if (objToFind && !gameState.foundObjects.includes(objToFind.name)) {
        checkObjectClick(p, objToFind.x, objToFind.y);
        gameState.testTimer = 0;
      }
    }
  }
}

function runWinTest(p) {
  // Win test: Complete all levels by finding all objects quickly
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (p.frameCount > 60) {
      startGame(p);
      gameState.testPhase = "FINDING_OBJECTS";
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (gameState.testPhase === "FINDING_OBJECTS") {
      gameState.testTimer++;
      
      if (gameState.testTimer > 15) { // Find object every 0.25 seconds
        const level = LEVELS[gameState.currentLevelIndex];
        
        // Find next unfound object
        for (const obj of level.objects) {
          if (!gameState.foundObjects.includes(obj.name)) {
            checkObjectClick(p, obj.x, obj.y);
            gameState.testTimer = 0;
            break;
          }
        }
      }
    }
  } else if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
    gameState.testTimer++;
    
    if (gameState.testTimer > 90) { // Wait 1.5 seconds
      if (gameState.currentLevelIndex < LEVELS.length - 1) {
        nextLevel(p);
        gameState.testPhase = "FINDING_OBJECTS";
        gameState.testTimer = 0;
      } else {
        // Trigger win
        nextLevel(p);
      }
    }
  }
}