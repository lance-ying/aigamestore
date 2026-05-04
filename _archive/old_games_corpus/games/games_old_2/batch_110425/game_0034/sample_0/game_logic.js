// game_logic.js - Core game logic

import { gameState, GAME_PHASES, SPACE_TYPES } from './globals.js';
import { triggerSpaceEvent } from './events.js';

export function updateGameLogic(p, wheel) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Update wheel
  if (gameState.wheelSpinning) {
    const result = wheel.update();
    if (result > 0) {
      gameState.spinResult = result;
      gameState.spinning = false;
      gameState.wheelSpinning = false;
      gameState.moving = true;
      gameState.targetPosition = Math.min(
        gameState.currentPosition + result,
        gameState.boardPath.length - 1
      );
      gameState.turn++;
    }
  }
  
  // Update player movement
  if (gameState.moving && gameState.player) {
    movePlayerToTarget(p);
  }
  
  // Update player
  if (gameState.player) {
    gameState.player.update();
    
    // Log player position periodically
    if (p.frameCount % 30 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.currentPosition,
        game_y: 0,
        framecount: p.frameCount
      });
    }
  }
}

function movePlayerToTarget(p) {
  if (gameState.currentPosition < gameState.targetPosition) {
    // Move one space at a time
    gameState.currentPosition++;
    
    const targetSpace = gameState.boardPath[gameState.currentPosition];
    if (gameState.player && targetSpace) {
      gameState.player.moveTo(targetSpace.x, targetSpace.y);
    }
    
    // Check if reached target
    if (gameState.currentPosition >= gameState.targetPosition) {
      gameState.moving = false;
      handleSpaceLanding(p);
    }
  }
}

function handleSpaceLanding(p) {
  const currentSpace = gameState.boardPath[gameState.currentPosition];
  
  if (currentSpace.type === SPACE_TYPES.RETIREMENT) {
    // Game over - win
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, action: "retirement", finalScore: gameState.knowledge + gameState.wealth + gameState.happiness },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Trigger event
  const event = triggerSpaceEvent(currentSpace, p);
  if (event) {
    gameState.currentEvent = event;
    gameState.showingEvent = true;
    gameState.selectedChoice = 0;
  }
}