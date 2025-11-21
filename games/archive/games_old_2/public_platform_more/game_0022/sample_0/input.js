// input.js - Input handling

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, UI_STATE_SELECT_ACTION, UI_STATE_SELECT_LOCATION, UI_STATE_SELECT_CARD, ACTION_PLACE_WORKER, ACTION_PLAY_CARD, ACTION_PREPARE_SEASON } from './globals.js';
import { initializeGame, getAvailableActions, placeWorker, playCard, prepareForNextSeason } from './gameLogic.js';
import { canAffordCard } from './cards.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      initializeGame(p);
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING, message: "Game started" },
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
        data: { phase: PHASE_PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
      gameState.gamePhase = PHASE_START;
      p.logs.game_info.push({
        data: { phase: PHASE_START, message: "Restarted" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  if (gameState.uiState === UI_STATE_SELECT_ACTION) {
    handleActionSelection(keyCode);
  } else if (gameState.uiState === UI_STATE_SELECT_LOCATION) {
    handleLocationSelection(keyCode);
  } else if (gameState.uiState === UI_STATE_SELECT_CARD) {
    handleCardSelection(keyCode);
  }
}

function handleActionSelection(keyCode) {
  const actions = getAvailableActions();
  
  if (keyCode === 38) { // UP
    gameState.selectedActionIndex = (gameState.selectedActionIndex - 1 + actions.length) % actions.length;
  } else if (keyCode === 40) { // DOWN
    gameState.selectedActionIndex = (gameState.selectedActionIndex + 1) % actions.length;
  } else if (keyCode === 32) { // SPACE
    const selectedAction = actions[gameState.selectedActionIndex];
    
    if (selectedAction === ACTION_PLACE_WORKER) {
      gameState.uiState = UI_STATE_SELECT_LOCATION;
      gameState.selectedLocationIndex = 0;
    } else if (selectedAction === ACTION_PLAY_CARD) {
      gameState.uiState = UI_STATE_SELECT_CARD;
      gameState.selectedCardIndex = 0;
    } else if (selectedAction === ACTION_PREPARE_SEASON) {
      prepareForNextSeason();
    }
  }
}

function handleLocationSelection(keyCode) {
  const availableLocations = gameState.locations.filter(loc => loc.canPlaceWorker());
  
  if (keyCode === 38) { // UP
    gameState.selectedLocationIndex = (gameState.selectedLocationIndex - 1 + availableLocations.length) % availableLocations.length;
  } else if (keyCode === 40) { // DOWN
    gameState.selectedLocationIndex = (gameState.selectedLocationIndex + 1) % availableLocations.length;
  } else if (keyCode === 32) { // SPACE
    const actualIndex = gameState.locations.findIndex((loc, i) => {
      if (!loc.canPlaceWorker()) return false;
      const localIndex = gameState.locations.slice(0, i + 1).filter(l => l.canPlaceWorker()).length - 1;
      return localIndex === gameState.selectedLocationIndex;
    });
    
    if (actualIndex !== -1) {
      placeWorker(actualIndex);
    }
  } else if (keyCode === 90) { // Z - Cancel
    gameState.uiState = UI_STATE_SELECT_ACTION;
  }
}

function handleCardSelection(keyCode) {
  const affordableCards = gameState.hand.filter(card => canAffordCard(card, gameState.resources));
  
  if (keyCode === 38) { // UP
    gameState.selectedCardIndex = (gameState.selectedCardIndex - 1 + affordableCards.length) % affordableCards.length;
  } else if (keyCode === 40) { // DOWN
    gameState.selectedCardIndex = (gameState.selectedCardIndex + 1) % affordableCards.length;
  } else if (keyCode === 32) { // SPACE
    const actualIndex = gameState.hand.findIndex((card, i) => {
      if (!canAffordCard(card, gameState.resources)) return false;
      const localIndex = gameState.hand.slice(0, i + 1).filter(c => canAffordCard(c, gameState.resources)).length - 1;
      return localIndex === gameState.selectedCardIndex;
    });
    
    if (actualIndex !== -1) {
      playCard(actualIndex);
    }
  } else if (keyCode === 90) { // Z - Cancel
    gameState.uiState = UI_STATE_SELECT_ACTION;
  }
}

export function getAutomatedAction() {
  if (typeof window.get_automated_testing_action === 'function') {
    return window.get_automated_testing_action(gameState);
  }
  return null;
}

export function executeAutomatedAction(action) {
  if (!action || !action.keyCode) return;
  
  // Simulate keypress
  const p = window.gameInstance;
  if (!p) return;
  
  p.keyCode = action.keyCode;
  p.key = action.key || String.fromCharCode(action.keyCode);
  
  handleKeyPressed(p);
}