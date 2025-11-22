// input.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';
import { handleDrawCard, claimRoute, canClaimRoute } from './game_logic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      restartGame(p);
    }
    return;
  }
  
  // Gameplay inputs
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handleGameplayInput(p, keyCode);
  }
}

function startGame(p) {
  const { initializeGame } = require('./game_logic.js');
  initializeGame(p);
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", action: "game_started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  
  p.logs.game_info.push({
    data: { phase: "START", action: "game_restarted" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function handleGameplayInput(p, keyCode) {
  // Mode switching
  if (keyCode === 16) { // SHIFT
    if (gameState.uiMode === "DRAW_CARDS") {
      gameState.uiMode = "CLAIM_ROUTE";
      gameState.selectedRouteIndex = 0;
    } else if (gameState.uiMode === "CLAIM_ROUTE") {
      gameState.uiMode = "DRAW_CARDS";
      gameState.selectedCardIndex = 0;
    } else if (gameState.uiMode === "VIEW_TICKETS") {
      gameState.uiMode = "DRAW_CARDS";
    }
    return;
  }
  
  // View tickets
  if (keyCode === 90) { // Z
    if (gameState.uiMode === "VIEW_TICKETS") {
      gameState.uiMode = "DRAW_CARDS";
    } else {
      gameState.uiMode = "VIEW_TICKETS";
    }
    return;
  }
  
  // Mode-specific controls
  if (gameState.uiMode === "DRAW_CARDS") {
    handleDrawCardsInput(p, keyCode);
  } else if (gameState.uiMode === "CLAIM_ROUTE") {
    handleClaimRouteInput(p, keyCode);
  }
}

function handleDrawCardsInput(p, keyCode) {
  // Arrow keys to select card
  if (keyCode === 37) { // LEFT
    gameState.selectedCardIndex = Math.max(0, gameState.selectedCardIndex - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.selectedCardIndex = Math.min(5, gameState.selectedCardIndex + 1);
  }
  
  // Space to draw card
  if (keyCode === 32) { // SPACE
    if (gameState.cardsDrawnThisTurn < 2) {
      const success = handleDrawCard(gameState.selectedCardIndex);
      if (success) {
        p.logs.game_info.push({
          data: { action: "card_drawn", cardsDrawn: gameState.cardsDrawnThisTurn },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
}

function handleClaimRouteInput(p, keyCode) {
  // Arrow keys to select route
  if (keyCode === 38) { // UP
    gameState.selectedRouteIndex = Math.max(0, gameState.selectedRouteIndex - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.selectedRouteIndex = Math.min(gameState.routes.length - 1, gameState.selectedRouteIndex + 1);
  }
  
  // Space to claim route
  if (keyCode === 32) { // SPACE
    if (canClaimRoute(gameState.selectedRouteIndex)) {
      const success = claimRoute(gameState.selectedRouteIndex);
      if (success) {
        p.logs.game_info.push({
          data: { 
            action: "route_claimed", 
            routeIndex: gameState.selectedRouteIndex,
            score: gameState.score,
            trainCars: gameState.trainCars
          },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        
        // Switch back to drawing cards
        gameState.uiMode = "DRAW_CARDS";
        gameState.selectedCardIndex = 0;
      }
    }
  }
}

export function processAutomatedAction(p, action) {
  if (!action) return;
  
  if (action.keyCode) {
    handleKeyPressed(p, action.key, action.keyCode);
  }
}