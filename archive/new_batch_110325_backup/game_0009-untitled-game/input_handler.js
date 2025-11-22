import { 
  gameState, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  SPACE_TYPES
} from './globals.js';
import { 
  rollDice, 
  moveCurrentPlayer, 
  handleSpaceLanding, 
  endTurn, 
  getCurrentPlayer,
  handleAITurn
} from './game_logic.js';
import { setupGame } from './game.js';

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
      setupGame(p);
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    resetGame(p);
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.noLoop();
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.loop();
    }
    return;
  }
  
  // Gameplay controls (only if playing and human's turn)
  if (gameState.gamePhase === PHASE_PLAYING && !getCurrentPlayer().isAI) {
    handleGameplayInput(p, keyCode);
  }
}

function handleGameplayInput(p, keyCode) {
  const player = getCurrentPlayer();
  
  // Space - Roll dice
  if (keyCode === 32) {
    if (gameState.turnPhase === "ROLL" && !gameState.diceRolled) {
      rollDice(p);
    }
  }
  
  // Z - Buy property or build or end turn
  if (keyCode === 90) {
    if (gameState.pendingAction === "BUY_PROPERTY") {
      const space = gameState.selectedProperty;
      if (player.buyProperty(space)) {
        gameState.actionPrompt = "";
        gameState.pendingAction = null;
        gameState.turnPhase = "END";
      }
    } else if (gameState.turnPhase === "END") {
      // Try to build a house
      const buildable = player.properties.filter(prop => {
        return prop.type === SPACE_TYPES.PROPERTY && 
               player.hasMonopoly(prop.group) && 
               prop.houses < 5 &&
               player.cash >= 50;
      });
      
      if (buildable.length > 0 && player.cash >= 50) {
        const prop = buildable[0];
        player.buildHouse(prop);
        gameState.actionPrompt = `Built house on ${prop.name}`;
      } else {
        endTurn();
      }
    }
  }
  
  // Shift - Decline property
  if (keyCode === 16) {
    if (gameState.pendingAction === "BUY_PROPERTY") {
      gameState.actionPrompt = "";
      gameState.pendingAction = null;
      gameState.turnPhase = "END";
    }
  }
}

export function processAutomatedInput(p) {
  if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
    const action = window.get_automated_testing_action(gameState);
    if (action && action.keyCode) {
      handleKeyPressed(p, action.key, action.keyCode);
    }
  }
}

function resetGame(p) {
  gameState.gamePhase = PHASE_START;
  gameState.currentPlayerIndex = 0;
  gameState.players = [];
  gameState.turnPhase = "ROLL";
  gameState.diceRolled = false;
  gameState.score = 0;
  gameState.messageQueue = [];
  gameState.turnCount = 0;
  
  p.logs.game_info.push({
    data: { phase: PHASE_START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}