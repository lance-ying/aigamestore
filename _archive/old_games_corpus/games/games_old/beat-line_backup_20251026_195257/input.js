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
  
  // Always execute the turn - turn 90 degrees clockwise
  gameState.player.turn90Clockwise();
  
  // Check if this turn was near a turn point for scoring/feedback
  if (gameState.nextTurnIndex < gameState.turnPoints.length) {
    const nextTurn = gameState.turnPoints[gameState.nextTurnIndex];
    const playerDistance = gameState.player.getTraveledDistance();
    const distanceDiff = Math.abs(playerDistance - nextTurn.distance);
    
    // If close to a turn point, give feedback and advance
    if (distanceDiff < 150) {
      gameState.nextTurnIndex++;
      
      // Award points based on both distance and timing
      const timeDiff = Math.abs(gameState.gameTime - nextTurn.timing);
      let points = 10;
      let feedback = "TURN";
      let color = [255, 255, 255];
      
      // Perfect timing AND distance (within 50 pixels and perfect timing window)
      if (distanceDiff < 50 && timeDiff < nextTurn.perfect) {
        points = 100 + gameState.perfectStreak * 50;
        gameState.perfectStreak++;
        feedback = "PERFECT!";
        color = [255, 215, 0];
      }
      // Good timing (within timing window but not perfect distance)
      else if (timeDiff < nextTurn.perfect * 2) {
        points = 50;
        gameState.perfectStreak = Math.floor(gameState.perfectStreak / 2);
        feedback = "GOOD";
        color = [200, 200, 255];
      }
      // Early or late timing (still valid distance, but timing is off)
      else if (distanceDiff < 80) {
        points = 25;
        gameState.perfectStreak = 0;
        feedback = "OK";
        color = [150, 200, 150];
      }
      // Far from ideal spot but still valid
      else {
        points = 10;
        gameState.perfectStreak = 0;
        feedback = "TURN";
        color = [200, 200, 200];
      }
      
      gameState.score += points;
      gameState.levelScore += points;
      
      // Add feedback
      gameState.tapFeedback.push(
        new TapFeedback(gameState.player.x, gameState.player.y, feedback, color)
      );
    } else if (distanceDiff < 300) {
      // Close but not quite there yet - still turned but less points
      let feedback = "TURN";
      let color = [150, 150, 150];
      
      if (playerDistance < nextTurn.distance) {
        feedback = "EARLY";
        color = [200, 150, 150];
      } else {
        feedback = "LATE";
        color = [200, 150, 150];
      }
      
      gameState.score += 5;
      gameState.levelScore += 5;
      gameState.perfectStreak = 0;
      
      gameState.tapFeedback.push(
        new TapFeedback(gameState.player.x, gameState.player.y, feedback, color)
      );
    } else {
      // Way too far from turn point - still turned but minimal points
      gameState.score += 5;
      gameState.levelScore += 5;
      gameState.perfectStreak = 0;
      
      gameState.tapFeedback.push(
        new TapFeedback(gameState.player.x, gameState.player.y, "TURN", [150, 150, 150])
      );
    }
  } else {
    // No more turn points - still turn but give minimal feedback
    gameState.score += 5;
    gameState.levelScore += 5;
    
    gameState.tapFeedback.push(
      new TapFeedback(gameState.player.x, gameState.player.y, "TURN", [150, 150, 150])
    );
  }
  
  gameState.lastTapTime = gameState.gameTime;
}