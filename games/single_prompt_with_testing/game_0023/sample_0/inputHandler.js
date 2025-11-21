import {
  gameState,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  KEY_ENTER,
  KEY_ESC,
  KEY_R
} from './globals.js';

export class InputHandler {
  constructor(p, gameManager) {
    this.p = p;
    this.gameManager = gameManager;
  }

  handleKeyPressed(keyCode) {
    const p = this.p;
    
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Phase transition keys
    if (keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
      this.gameManager.startGame();
      return;
    }
    
    if (keyCode === KEY_ESC) {
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
        p.logs.game_info.push({
          data: { phase: PHASE_PAUSED, action: "game_paused" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
        p.logs.game_info.push({
          data: { phase: PHASE_PLAYING, action: "game_resumed" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    if (keyCode === KEY_R) {
      if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
          gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
        gameState.gamePhase = PHASE_START;
        this.gameManager.init();
        p.logs.game_info.push({
          data: { phase: PHASE_START, action: "game_restarted" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    // Gameplay keys
    if (gameState.gamePhase === PHASE_PLAYING) {
      this.gameManager.handleInput(keyCode);
    }
  }
}