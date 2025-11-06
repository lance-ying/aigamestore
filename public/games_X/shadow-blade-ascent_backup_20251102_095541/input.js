// input.js
import { gameState, GAME_PHASE } from './globals.js';

export class InputHandler {
  constructor() {
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      attack: false,
      dodge: false,
      skill1: false,
      skill2: false
    };
  }
  
  handleKeyPressed(p, keyCode, key) {
    // Log input
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Phase control keys
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASE.START) {
        return 'start';
      }
    } else if (keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASE.PLAYING) {
        return 'pause';
      } else if (gameState.gamePhase === GAME_PHASE.PAUSED) {
        return 'resume';
      }
    } else if (keyCode === 82) { // R
      return 'restart';
    }
    
    // Gameplay keys
    if (gameState.gamePhase === GAME_PHASE.PLAYING) {
      switch(keyCode) {
        case 37: this.keys.left = true; break;  // Left
        case 39: this.keys.right = true; break; // Right
        case 38: this.keys.up = true; break;    // Up
        case 40: this.keys.down = true; break;  // Down
        case 90: this.keys.attack = true; break; // Z
        case 16: this.keys.dodge = true; break;  // Shift
        case 32: this.keys.skill1 = true; break; // Space
        case 87: this.keys.skill2 = true; break; // W
      }
    }
    
    return null;
  }
  
  handleKeyReleased(p, keyCode, key) {
    // Log input
    p.logs.inputs.push({
      input_type: 'keyReleased',
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    switch(keyCode) {
      case 37: this.keys.left = false; break;
      case 39: this.keys.right = false; break;
      case 38: this.keys.up = false; break;
      case 40: this.keys.down = false; break;
      case 90: this.keys.attack = false; break;
      case 16: this.keys.dodge = false; break;
      case 32: this.keys.skill1 = false; break;
      case 87: this.keys.skill2 = false; break;
    }
  }
  
  reset() {
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      attack: false,
      dodge: false,
      skill1: false,
      skill2: false
    };
  }
}