// input.js - Input handling
import { PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, STATE_CLIENT_SELECT, STATE_DATE_SELECT, STATE_DATE_VENUE, STATE_MINIGAME, STATE_DATE_RESULT } from './globals.js';
import { initializeGame, selectClient, selectDate, selectVenue, submitMiniGameAnswer, returnToClientSelect, updateClientSelection, updateDateSelection, updateVenueSelection } from './states.js';

export function handleKeyPressed(p, gameState, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game
  if (keyCode === 13) {
    if (gameState.gamePhase === PHASE_START) {
      gameState.gamePhase = PHASE_PLAYING;
      initializeGame(p, gameState);
    }
    return;
  }
  
  // R - Restart
  if (keyCode === 82) {
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      gameState.gamePhase = PHASE_START;
      gameState.playState = STATE_CLIENT_SELECT;
    }
    return;
  }
  
  // ESC - Pause
  if (keyCode === 27) {
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING) {
    handleGameplayInput(p, gameState, keyCode);
  }
}

function handleGameplayInput(p, gameState, keyCode) {
  if (gameState.playState === STATE_CLIENT_SELECT) {
    if (keyCode === 38) { // Up arrow
      gameState.menuSelection = Math.max(0, gameState.menuSelection - 1);
    } else if (keyCode === 40) { // Down arrow
      gameState.menuSelection = Math.min(gameState.clients.length - 1, gameState.menuSelection + 1);
    } else if (keyCode === 32) { // Space
      selectClient(p, gameState, gameState.menuSelection);
    }
  } else if (gameState.playState === STATE_DATE_SELECT) {
    if (keyCode === 38) { // Up arrow
      gameState.menuSelection = Math.max(0, gameState.menuSelection - 1);
    } else if (keyCode === 40) { // Down arrow
      gameState.menuSelection = Math.min(Math.min(gameState.dates.length, 4) - 1, gameState.menuSelection + 1);
    } else if (keyCode === 32) { // Space
      selectDate(p, gameState, gameState.menuSelection);
    }
  } else if (gameState.playState === STATE_DATE_VENUE) {
    const unlockedVenues = gameState.venues.filter(v => v.unlocked);
    if (keyCode === 38) { // Up arrow
      gameState.menuSelection = Math.max(0, gameState.menuSelection - 1);
    } else if (keyCode === 40) { // Down arrow
      gameState.menuSelection = Math.min(unlockedVenues.length - 1, gameState.menuSelection + 1);
    } else if (keyCode === 32) { // Space
      selectVenue(p, gameState, gameState.menuSelection);
    }
  } else if (gameState.playState === STATE_MINIGAME) {
    const choices = gameState.currentMiniGame.options.choices;
    if (keyCode === 38) { // Up arrow
      gameState.menuSelection = Math.max(0, gameState.menuSelection - 1);
    } else if (keyCode === 40) { // Down arrow
      gameState.menuSelection = Math.min(choices.length - 1, gameState.menuSelection + 1);
    } else if (keyCode === 32) { // Space
      submitMiniGameAnswer(p, gameState, gameState.menuSelection);
    }
  } else if (gameState.playState === STATE_DATE_RESULT) {
    if (keyCode === 32) { // Space
      returnToClientSelect(p, gameState);
    }
  }
}

export function processAutomatedAction(p, gameState, action) {
  if (!action) return;
  
  if (action.keyCode) {
    handleKeyPressed(p, gameState, action.key, action.keyCode);
  }
}