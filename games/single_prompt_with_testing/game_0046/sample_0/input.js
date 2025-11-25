// input.js
import { gameState, GAME_PHASES } from './globals.js';

export class InputHandler {
  constructor(p) {
    this.p = p;
    this.keys = {
      left: false,
      right: false,
      up: false,
      attack: false,
      special: false,
      switch: false
    };
    this.keysPressedThisFrame = {
      attack: false,
      special: false,
      switch: false
    };
  }
  
  updateFromAutomated(action) {
    // Reset
    this.keys.left = false;
    this.keys.right = false;
    this.keys.up = false;
    this.keysPressedThisFrame.attack = false;
    this.keysPressedThisFrame.special = false;
    this.keysPressedThisFrame.switch = false;
    
    // Apply action
    if (action) {
      if (action.left) this.keys.left = true;
      if (action.right) this.keys.right = true;
      if (action.up) this.keys.up = true;
      if (action.attack) {
        this.keys.attack = true;
        this.keysPressedThisFrame.attack = true;
      }
      if (action.special) {
        this.keys.special = true;
        this.keysPressedThisFrame.special = true;
      }
      if (action.switch) {
        this.keys.switch = true;
        this.keysPressedThisFrame.switch = true;
      }
    }
  }
  
  updateFromHuman(p) {
    this.keys.left = p.keyIsDown(37);
    this.keys.right = p.keyIsDown(39);
    this.keys.up = p.keyIsDown(38);
    this.keys.attack = p.keyIsDown(90);
    this.keys.special = p.keyIsDown(16);
    this.keys.switch = p.keyIsDown(32);
  }
  
  handleKeyPressed(p, key, keyCode) {
    if (gameState.controlMode === 'HUMAN') {
      if (keyCode === 90) { // Z
        this.keysPressedThisFrame.attack = true;
      }
      if (keyCode === 16) { // Shift
        this.keysPressedThisFrame.special = true;
      }
      if (keyCode === 32) { // Space
        this.keysPressedThisFrame.switch = true;
      }
    }
    
    // Log input
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  handleKeyReleased(p, key, keyCode) {
    // Log input
    p.logs.inputs.push({
      input_type: 'keyReleased',
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}