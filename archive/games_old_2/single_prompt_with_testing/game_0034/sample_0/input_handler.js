// input_handler.js - Input handling

import { 
  gameState, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED, 
  PHASE_GAME_OVER_WIN, 
  PHASE_GAME_OVER_LOSE,
  KEY_ENTER,
  KEY_ESC,
  KEY_SPACE,
  KEY_R,
  DUEL_BANG,
  DUEL_WAIT,
  DUEL_STEADY,
  DUEL_READY
} from './globals.js';
import { startNewGame, handlePlayerDraw, handleAIFoul } from './game_logic.js';

let p5Instance = null;

export function initInputHandler(p) {
  p5Instance = p;
}

export function handleKeyPressed(keyCode) {
  if (!p5Instance) return;
  
  // Log input
  p5Instance.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p5Instance.key, keyCode: keyCode },
    framecount: p5Instance.frameCount,
    timestamp: Date.now()
  });
  
  // Phase-specific controls
  switch (gameState.gamePhase) {
    case PHASE_START:
      if (keyCode === KEY_ENTER) {
        startNewGame();
        p5Instance.logs.game_info.push({
          data: "Game started",
          framecount: p5Instance.frameCount,
          timestamp: Date.now()
        });
      }
      break;
      
    case PHASE_PLAYING:
      if (keyCode === KEY_ESC) {
        gameState.gamePhase = PHASE_PAUSED;
        p5Instance.logs.game_info.push({
          data: "Game paused",
          framecount: p5Instance.frameCount,
          timestamp: Date.now()
        });
      } else if (keyCode === KEY_SPACE) {
        handlePlayerDraw();
      }
      break;
      
    case PHASE_PAUSED:
      if (keyCode === KEY_ESC) {
        gameState.gamePhase = PHASE_PLAYING;
        p5Instance.logs.game_info.push({
          data: "Game resumed",
          framecount: p5Instance.frameCount,
          timestamp: Date.now()
        });
      }
      break;
      
    case PHASE_GAME_OVER_WIN:
    case PHASE_GAME_OVER_LOSE:
      if (keyCode === KEY_R) {
        resetToStart();
      }
      break;
  }
}

export function resetToStart() {
  gameState.gamePhase = PHASE_START;
  gameState.currentRound = 0;
  gameState.roundsWon = 0;
  gameState.score = 0;
  gameState.entities = [];
  gameState.player = null;
  
  if (p5Instance) {
    p5Instance.logs.game_info.push({
      data: "Game reset to start screen",
      framecount: p5Instance.frameCount,
      timestamp: Date.now()
    });
  }
}

export function processAutomatedInput(action) {
  if (action && action.keyCode) {
    handleKeyPressed(action.keyCode);
  }
}