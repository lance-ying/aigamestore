// input_handler.js
import { gameState, GAME_PHASES, ACTIONS, HABITATS } from './globals.js';
import { selectAction, selectCard, playBird } from './game_logic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    // Already handled in game.js for ENTER
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (gameState.controlMode === "HUMAN") {
      handlePlayingInput(p, keyCode);
    }
  }
}

export function handlePlayingInput(p, keyCode) {
  if (gameState.animating) return;
  
  const actionPhase = gameState.actionPhase;
  
  if (actionPhase === "SELECT_ACTION") {
    // Arrow keys to select action
    if (keyCode === 38) { // UP
      gameState.selectedAction = ACTIONS.PLAY_BIRD;
    } else if (keyCode === 40) { // DOWN
      gameState.selectedAction = ACTIONS.LAY_EGGS;
    } else if (keyCode === 37) { // LEFT
      gameState.selectedAction = ACTIONS.GAIN_FOOD;
    } else if (keyCode === 39) { // RIGHT
      gameState.selectedAction = ACTIONS.DRAW_CARDS;
    } else if (keyCode === 32 && gameState.selectedAction) { // SPACE
      selectAction(gameState.selectedAction);
    }
  } else if (actionPhase === "SELECT_CARD") {
    if (keyCode === 37) { // LEFT
      gameState.selectedCardIndex = Math.max(0, gameState.selectedCardIndex - 1);
    } else if (keyCode === 39) { // RIGHT
      gameState.selectedCardIndex = Math.min(gameState.handCards.length - 1, gameState.selectedCardIndex + 1);
    } else if (keyCode === 32) { // SPACE
      selectCard(gameState.selectedCardIndex);
    } else if (keyCode === 90) { // Z - Cancel
      gameState.selectedAction = null;
      gameState.actionPhase = "SELECT_ACTION";
      gameState.selectedCardIndex = -1;
    }
  } else if (actionPhase === "SELECT_SLOT") {
    const habitat = gameState.selectedHabitat;
    const maxSlots = gameState.board[habitat].length;
    
    if (keyCode === 37) { // LEFT
      gameState.selectedBirdSlot = Math.max(0, gameState.selectedBirdSlot - 1);
    } else if (keyCode === 39) { // RIGHT
      gameState.selectedBirdSlot = Math.min(maxSlots, gameState.selectedBirdSlot + 1);
    } else if (keyCode === 32) { // SPACE
      playBird();
    } else if (keyCode === 90) { // Z - Cancel
      gameState.actionPhase = "SELECT_CARD";
      gameState.selectedBirdSlot = -1;
    }
  }
}

export function processAutomatedInput(p, action) {
  if (!action || gameState.animating) return;
  
  // Simulate key press
  if (action.keyCode) {
    handlePlayingInput(p, action.keyCode);
  }
}