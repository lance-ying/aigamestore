// gameLogic.js - Core game logic

import { gameState, GAME_PHASES } from './globals.js';
import { checkLevelComplete, calculateLevelScore } from './levelManager.js';

export function saveState() {
  // Deep copy current state
  const stateCopy = {
    tubes: gameState.tubes.map(tube => ({
      capacity: tube.capacity,
      colors: [...tube.colors]
    })),
    moves: gameState.levelMovesMade,
    tubesCompleted: new Set(gameState.tubesCompleted),
    levelScore: gameState.levelScore
  };
  
  gameState.previousStates.push(stateCopy);
}

export function undoLastMove(p) {
  if (gameState.previousStates.length === 0) return;
  
  const prevState = gameState.previousStates.pop();
  
  // Restore tube states
  for (let i = 0; i < gameState.tubes.length; i++) {
    gameState.tubes[i].colors = [...prevState.tubes[i].colors];
  }
  
  gameState.levelMovesMade = prevState.moves;
  gameState.tubesCompleted = new Set(prevState.tubesCompleted);
  gameState.levelScore = prevState.levelScore;
  gameState.levelUndoCount++;
  
  p.logs.game_info.push({
    data: { action: 'undo', moves: gameState.levelMovesMade },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function checkForNewlyCompletedTubes(p) {
  let scoreAdded = 0;
  
  for (let i = 0; i < gameState.tubes.length; i++) {
    if (!gameState.tubesCompleted.has(i) && gameState.tubes[i].isSorted()) {
      gameState.tubesCompleted.add(i);
      
      // Award partial score for completing a tube
      const tubeScore = 25; // Base score for completing one tube
      gameState.levelScore += tubeScore;
      gameState.totalScore += tubeScore;
      scoreAdded += tubeScore;
      
      p.logs.game_info.push({
        data: { 
          action: 'tube_completed', 
          tubeIndex: i,
          partialScore: tubeScore,
          totalScore: gameState.totalScore
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  return scoreAdded;
}

export function updateAnimation(p) {
  if (!gameState.isAnimating) return;
  
  gameState.animationProgress++;
  
  if (gameState.animationProgress >= gameState.animationDuration) {
    // Complete the pour
    const sourceTube = gameState.tubes[gameState.animationSourceIndex];
    const destTube = gameState.tubes[gameState.animationDestIndex];
    
    // Remove from source
    for (let i = 0; i < gameState.animationWaterAmount; i++) {
      sourceTube.colors.pop();
    }
    
    // Add to destination
    for (let i = 0; i < gameState.animationWaterAmount; i++) {
      destTube.colors.push(gameState.animationWaterColor);
    }
    
    gameState.levelMovesMade++;
    gameState.isAnimating = false;
    
    // Check for newly completed tubes and award partial scores
    checkForNewlyCompletedTubes(p);
    
    // Check win/lose conditions
    if (checkLevelComplete()) {
      const levelScore = calculateLevelScore();
      gameState.totalScore += levelScore;
      gameState.gamePhase = GAME_PHASES.LEVEL_COMPLETE;
      
      p.logs.game_info.push({
        data: { 
          phase: gameState.gamePhase, 
          level: gameState.currentLevel,
          score: levelScore,
          totalScore: gameState.totalScore
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.levelMovesMade >= gameState.levelMaxMoves) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      
      p.logs.game_info.push({
        data: { 
          phase: gameState.gamePhase,
          level: gameState.currentLevel
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}