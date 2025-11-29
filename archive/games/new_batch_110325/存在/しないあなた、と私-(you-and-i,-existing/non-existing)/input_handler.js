// input_handler.js - Handles keyboard input

import { gameState, GAME_PHASES, resetGameState } from './globals.js';
import { advanceDialogue, selectChoice } from './narrative_engine.js';
import { getNodeData } from './story_data.js';

export function handleKeyPressed(p) {
  // Log the input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase control keys
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (p.keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGameState();
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.START, action: "restart" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handleGameplayInput(p);
  }
}

function handleGameplayInput(p) {
  const currentNodeData = getNodeData(gameState.currentNode);
  
  if (!currentNodeData) return;
  
  // SPACE - advance dialogue or confirm choice
  if (p.keyCode === 32) { // SPACE
    if (currentNodeData.choices && gameState.textFullyDisplayed) {
      selectChoice(gameState.choiceIndex, p);
    } else {
      advanceDialogue(p);
    }
    return;
  }
  
  // Arrow keys - navigate choices
  if (currentNodeData.choices && gameState.textFullyDisplayed) {
    if (p.keyCode === 38) { // UP
      gameState.choiceIndex = Math.max(0, gameState.choiceIndex - 1);
    } else if (p.keyCode === 40) { // DOWN
      gameState.choiceIndex = Math.min(
        currentNodeData.choices.length - 1, 
        gameState.choiceIndex + 1
      );
    }
  }
}

export default handleKeyPressed;