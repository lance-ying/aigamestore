// inputHandler.js - Input handling
import { gameState } from './globals.js';

export class InputHandler {
  constructor(p) {
    this.p = p;
    this.keys = {
      left: false,
      right: false,
      up: false,
      space: false,
      z: false
    };
  }

  update() {
    const p = this.p;
    
    if (gameState.controlMode === "HUMAN") {
      this.keys.left = p.keyIsDown(37);
      this.keys.right = p.keyIsDown(39);
      this.keys.up = p.keyIsDown(38);
      this.keys.space = p.keyIsDown(32);
      this.keys.z = p.keyIsDown(90);
    } else {
      // Automated testing mode
      const action = window.get_automated_testing_action?.(gameState);
      if (action) {
        this.keys.left = action.left || false;
        this.keys.right = action.right || false;
        this.keys.up = action.up || false;
        this.keys.space = action.space || false;
        this.keys.z = action.z || false;
      }
    }
    
    return this.keys;
  }

  keyPressed(key, keyCode) {
    const p = this.p;
    
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  keyReleased(key, keyCode) {
    const p = this.p;
    
    // Log input
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}