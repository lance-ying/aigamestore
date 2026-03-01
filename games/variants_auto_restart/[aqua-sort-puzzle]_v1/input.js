// input.js - Input handling

import { gameState, GAME_PHASES, LEVELS } from './globals.js';
import { saveState, undoLastMove } from './gameLogic.js';
import { loadLevel, advanceToNextLevel } from './levelManager.js';

// Modified handleKeyPressed to accept a game reset function
export function handleKeyPressed(p, resetGameFn) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game
  if (keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
    loadLevel(1, p);
    gameState.gamePhase = GAME_PHASES.PLAYING;
    gameState.totalScore = 0; // Ensure total score is reset on new game start
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // R - Restart to start screen (manual restart)
  if (keyCode === 82) {
    // Call the shared reset function, which also cancels any pending auto-restart
    resetGameFn();
    return;
  }
  
  // ESC - Pause/Unpause
  if (keyCode === 27) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // SPACE - Advance to next level (from LEVEL_COMPLETE phase)
  if (keyCode === 32 && gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
    if (gameState.currentLevel < LEVELS.length) {
      advanceToNextLevel(p);
    } else {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    }
    
    p.logs.game_info.push({
      data: { 
        phase: gameState.gamePhase,
        level: gameState.currentLevel
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Game controls only work during PLAYING phase
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  if (gameState.isAnimating) return;
  
  // Arrow Left - Navigate left
  if (keyCode === 37) {
    gameState.highlightedTubeIndex = (gameState.highlightedTubeIndex - 1 + gameState.tubes.length) % gameState.tubes.length;
    return;
  }
  
  // Arrow Right - Navigate right
  if (keyCode === 39) {
    gameState.highlightedTubeIndex = (gameState.highlightedTubeIndex + 1) % gameState.tubes.length;
    return;
  }
  
  // Space - Select/Pour
  if (keyCode === 32) {
    handleSpacePress(p);
    return;
  }
  
  // Z - Undo
  if (keyCode === 90 || key === 'z' || key === 'Z') {
    undoLastMove(p);
    return;
  }
}

function handleSpacePress(p) {
  if (gameState.selectedTubeIndex === -1) {
    // Select source tube
    const tube = gameState.tubes[gameState.highlightedTubeIndex];
    if (!tube.isEmpty()) {
      gameState.selectedTubeIndex = gameState.highlightedTubeIndex;
    }
  } else {
    // Attempt pour
    const sourceTube = gameState.tubes[gameState.selectedTubeIndex];
    const destTube = gameState.tubes[gameState.highlightedTubeIndex];
    
    if (gameState.selectedTubeIndex !== gameState.highlightedTubeIndex) {
      if (sourceTube.canPourInto(destTube)) {
        saveState();
        startPourAnimation(gameState.selectedTubeIndex, gameState.highlightedTubeIndex, p);
      }
    }
    
    gameState.selectedTubeIndex = -1;
  }
}

function startPourAnimation(sourceIndex, destIndex, p) {
  const sourceTube = gameState.tubes[sourceIndex];
  const layer = sourceTube.getTopContiguousLayer();
  
  gameState.isAnimating = true;
  gameState.animationProgress = 0;
  gameState.animationSourceIndex = sourceIndex;
  gameState.animationDestIndex = destIndex;
  gameState.animationWaterColor = layer.color;
  gameState.animationWaterAmount = layer.amount;
}

export { handleSpacePress, startPourAnimation };