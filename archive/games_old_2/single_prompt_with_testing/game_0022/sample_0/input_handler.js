// input_handler.js
import { gameState } from './globals.js';

export class InputHandler {
  constructor(p) {
    this.p = p;
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      space: false,
      shift: false,
      z: false
    };
    
    this.zPressed = false;
  }
  
  updateFromKeyboard() {
    const p = this.p;
    
    this.keys.up = p.keyIsDown(38);
    this.keys.down = p.keyIsDown(40);
    this.keys.left = p.keyIsDown(37);
    this.keys.right = p.keyIsDown(39);
    this.keys.space = p.keyIsDown(32);
    this.keys.shift = p.keyIsDown(16);
    
    // Handle Z key with toggle logic
    const zDown = p.keyIsDown(90);
    if (zDown && !this.zPressed) {
      this.keys.z = true;
      this.zPressed = true;
    } else if (!zDown) {
      this.keys.z = false;
      this.zPressed = false;
    } else {
      this.keys.z = false;
    }
  }
  
  updateFromAutomatedTesting(action) {
    // Reset all keys
    this.keys.up = false;
    this.keys.down = false;
    this.keys.left = false;
    this.keys.right = false;
    this.keys.space = false;
    this.keys.shift = false;
    this.keys.z = false;
    
    if (!action) return;
    
    // Set keys based on action
    if (action.up) this.keys.up = true;
    if (action.down) this.keys.down = true;
    if (action.left) this.keys.left = true;
    if (action.right) this.keys.right = true;
    if (action.space) this.keys.space = true;
    if (action.shift) this.keys.shift = true;
    if (action.z) this.keys.z = true;
  }
  
  getInputs() {
    return { ...this.keys };
  }
}