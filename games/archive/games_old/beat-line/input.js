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
  
  // Check if there's a turn point ahead to turn at
  if (gameState.nextTurnIndex >= gameState.turnPoints.length) {
    // No more turns - give minimal feedback
    gameState.score += 5;
    gameState.levelScore += 5;
    gameState.tapFeedback.push(
      new TapFeedback(gameState.player.x, gameState.player.y, "NO TURN", [100, 100, 100])
    );
    return;
  }
  
  const nextTurn = gameState.turnPoints[gameState.nextTurnIndex];
  const playerDistance = gameState.player.getTraveledDistance();
  const distanceDiff = nextTurn.distance - playerDistance;
  
  // Check if player is in valid range to execute this turn
  if (distanceDiff < -100) {
    // Missed the turn - too late
    gameState.score += 5;
    gameState.levelScore += 5;
    gameState.perfectStreak = 0;
    gameState.tapFeedback.push(
      new TapFeedback(gameState.player.x, gameState.player.y, "MISSED", [255, 100, 100])
    );
    return;
  }
  
  if (distanceDiff > 200) {
    // Too early - way before the turn point
    gameState.score += 5;
    gameState.levelScore += 5;
    gameState.perfectStreak = 0;
    gameState.tapFeedback.push(
      new TapFeedback(gameState.player.x, gameState.player.y, "TOO EARLY", [200, 150, 150])
    );
    return;
  }
  
  // Valid turn range - execute the turn in the correct direction
  gameState.player.turn(nextTurn.direction);
  gameState.nextTurnIndex++;
  
  // Calculate timing score
  const timeDiff = Math.abs(gameState.gameTime - nextTurn.timing);
  let points = 10;
  let feedback = "TURN";
  let color = [255, 255, 255];
  
  // Perfect timing AND distance
  if (Math.abs(distanceDiff) < 30 && timeDiff < nextTurn.perfect) {
    points = 100 + gameState.perfectStreak * 50;
    gameState.perfectStreak++;
    feedback = "PERFECT!";
    color = [255, 215, 0];
  }
  // Good timing
  else if (Math.abs(distanceDiff) < 60 && timeDiff < nextTurn.perfect * 2) {
    points = 50;
    gameState.perfectStreak = Math.floor(gameState.perfectStreak / 2);
    feedback = "GOOD";
    color = [200, 200, 255];
  }
  // OK timing
  else if (Math.abs(distanceDiff) < 100) {
    points = 25;
    gameState.perfectStreak = 0;
    feedback = distanceDiff < 0 ? "LATE" : "EARLY";
    color = [150, 200, 150];
  }
  // Barely made it
  else {
    points = 10;
    gameState.perfectStreak = 0;
    feedback = "BARELY";
    color = [200, 200, 200];
  }
  
  gameState.score += points;
  gameState.levelScore += points;
  
  // Add feedback
  gameState.tapFeedback.push(
    new TapFeedback(gameState.player.x, gameState.player.y, feedback, color)
  );
  
  gameState.lastTapTime = gameState.gameTime;
}