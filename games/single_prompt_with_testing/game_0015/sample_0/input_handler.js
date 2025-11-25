// input_handler.js - Input handling

import { 
  gameState, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED, 
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  TURN_STATE_CHOOSE_ACTION,
  TURN_STATE_CHOOSE_TARGET,
  TURN_STATE_USE_ITEM,
  TURN_STATE_ANIMATING
} from './globals.js';
import { initializeGame, shoot, checkRoundEnd, switchTurn, startAnimation } from './game_logic.js';
import { useItem, removeItem } from './items.js';
import { executeDealerTurn } from './dealer_ai.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      gameState.gamePhase = PHASE_PLAYING;
      initializeGame(p);
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      gameState.gamePhase = PHASE_START;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Playing controls
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  if (gameState.currentTurn !== "PLAYER") return;
  if (gameState.turnState === TURN_STATE_ANIMATING) return;
  
  if (gameState.turnState === TURN_STATE_CHOOSE_ACTION) {
    // Navigate menu
    if (keyCode === 38) { // UP
      gameState.menuSelection = Math.max(0, gameState.menuSelection - 1);
    } else if (keyCode === 40) { // DOWN
      const maxSelection = gameState.playerItems.length > 0 ? gameState.playerItems.length : 0;
      gameState.menuSelection = Math.min(maxSelection, gameState.menuSelection + 1);
    } else if (keyCode === 32) { // SPACE
      if (gameState.menuSelection === 0) {
        // Shoot
        gameState.turnState = TURN_STATE_CHOOSE_TARGET;
        gameState.targetSelection = 1; // Default to dealer
      } else {
        // Use item
        gameState.selectedItemIndex = gameState.menuSelection - 1;
        gameState.turnState = TURN_STATE_USE_ITEM;
        executeItemUse(p);
      }
    } else if (keyCode === 90) { // Z - quick shoot self
      executeShot(p, gameState.player);
    } else if (keyCode === 16) { // SHIFT - quick shoot dealer
      executeShot(p, gameState.dealer);
    }
  } else if (gameState.turnState === TURN_STATE_CHOOSE_TARGET) {
    if (keyCode === 37 || keyCode === 39) { // LEFT/RIGHT
      gameState.targetSelection = 1 - gameState.targetSelection;
    } else if (keyCode === 32) { // SPACE
      const target = gameState.targetSelection === 0 ? gameState.player : gameState.dealer;
      executeShot(p, target);
    }
  }
}

function executeShot(p, target) {
  const result = shoot(gameState.player, target);
  startAnimation(result.message, 60);
  
  setTimeout(() => {
    if (checkRoundEnd(p)) {
      return;
    }
    
    // If shot self with blank, get another turn
    if (result.targetWasSelf && !result.wasLive) {
      gameState.currentTurn = "PLAYER";
      gameState.turnState = TURN_STATE_CHOOSE_ACTION;
      gameState.menuSelection = 0;
    } else {
      switchTurn();
      // Trigger dealer turn
      setTimeout(() => {
        if (gameState.currentTurn === "DEALER") {
          executeDealerTurn(p);
        }
      }, 500);
    }
  }, 1000);
}

function executeItemUse(p) {
  const itemType = gameState.playerItems[gameState.selectedItemIndex];
  const message = useItem(itemType, gameState.player, gameState.player);
  removeItem(gameState.playerItems, gameState.selectedItemIndex);
  
  startAnimation(message, 45);
  
  setTimeout(() => {
    gameState.turnState = TURN_STATE_CHOOSE_ACTION;
    gameState.menuSelection = 0;
    gameState.selectedItemIndex = -1;
  }, 750);
}