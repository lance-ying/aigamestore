// input.js - Input handling

import { gameState, GAME_PHASE } from './globals.js';
import { LEVELS } from './levels.js';
import { TapFeedback } from './entities.js';
import { loadLevel } from './levelManager.js';

export function handleKeyPress(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Game phase controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASE.START) {
      loadLevel(0);
      gameState.gamePhase = GAME_PHASE.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASE.PLAYING) {
      gameState.gamePhase = GAME_PHASE.PAUSED;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASE.PAUSED) {
      gameState.gamePhase = GAME_PHASE.PLAYING;
      gameState.levelStartTime = Date.now() - gameState.gameTime;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN ||
        gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE ||
        gameState.gamePhase === GAME_PHASE.LEVEL_COMPLETE) {
      gameState.gamePhase = GAME_PHASE.START;
      gameState.score = 0;
      gameState.currentLevel = 0;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASE.PLAYING) {
    if (keyCode === 32) { // SPACE
      handleTurn(p);
    }
  } else if (gameState.gamePhase === GAME_PHASE.LEVEL_COMPLETE) {
    if (keyCode === 32) { // SPACE - next level
      if (gameState.currentLevel < LEVELS.length - 1) {
        loadLevel(gameState.currentLevel + 1);
        gameState.gamePhase = GAME_PHASE.PLAYING;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
}

function handleTurn(p) {
  const level = LEVELS[gameState.currentLevel];
  
  if (gameState.nextTurnIndex >= gameState.turnPoints.length) {
    return; // No more turns
  }

  const nextTurn = gameState.turnPoints[gameState.nextTurnIndex];
  const timeDiff = Math.abs(gameState.gameTime - nextTurn.timing);
  
  // Check if tap is within acceptable window
  if (timeDiff < nextTurn.perfect * 2) {
    // Execute turn
    gameState.player.turn(nextTurn.direction);
    gameState.nextTurnIndex++;
    
    // Award points based on timing
    let points = 10;
    let feedback = "TAP";
    let color = [255, 255, 255];
    
    if (timeDiff < nextTurn.perfect) {
      // Perfect tap
      points = 100 + gameState.perfectStreak * 50;
      gameState.perfectStreak++;
      feedback = "PERFECT!";
      color = [255, 215, 0];
    } else {
      // Good tap
      points = 50;
      gameState.perfectStreak = 0;
      feedback = "GOOD";
      color = [200, 200, 255];
    }
    
    gameState.score += points;
    gameState.levelScore += points;
    
    // Add feedback
    gameState.tapFeedback.push(
      new TapFeedback(gameState.player.x, gameState.player.y, feedback, color)
    );
  } else {
    // Tap too far from turn point - just give minimal feedback
    gameState.tapFeedback.push(
      new TapFeedback(gameState.player.x, gameState.player.y, "...", [150, 150, 150])
    );
  }
  
  gameState.lastTapTime = gameState.gameTime;
}