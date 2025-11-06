// input_handler.js - Handles player input

import { gameState, GAME_PHASES } from './globals.js';

export class InputHandler {
  constructor(p) {
    this.p = p;
    this.keys = {};
  }
  
  handleKeyPressed(key, keyCode) {
    this.keys[keyCode] = true;
    
    // Log input
    this.p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key, keyCode },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
    
    // Game phase controls
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        this.startGame();
      }
    } else if (keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        this.pauseGame();
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        this.unpauseGame();
      }
    } else if (keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        this.restartGame();
      }
    }
    
    // Gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (keyCode === 32 && gameState.player) { // SPACE - Dash
        gameState.player.dash();
      } else if (keyCode === 16 && gameState.player) { // SHIFT - Shield
        gameState.player.activateShield();
      } else if (keyCode === 90) { // Z - Toggle auto-fire
        gameState.autoFireEnabled = !gameState.autoFireEnabled;
      }
    }
  }
  
  handleKeyReleased(key, keyCode) {
    this.keys[keyCode] = false;
    
    // Log input
    this.p.logs.inputs.push({
      input_type: 'keyReleased',
      data: { key, keyCode },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
  
  getMovement() {
    let dx = 0;
    let dy = 0;
    
    if (this.keys[37] || this.keys[65]) dx -= 1; // Left / A
    if (this.keys[39] || this.keys[68]) dx += 1; // Right / D
    if (this.keys[38] || this.keys[87]) dy -= 1; // Up / W
    if (this.keys[40] || this.keys[83]) dy += 1; // Down / S
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
    }
    
    return { dx, dy };
  }
  
  startGame() {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    this.p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
  
  pauseGame() {
    gameState.gamePhase = GAME_PHASES.PAUSED;
    this.p.noLoop();
    this.p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
  
  unpauseGame() {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    this.p.loop();
    this.p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
  
  restartGame() {
    gameState.gamePhase = GAME_PHASES.START;
    this.p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
}