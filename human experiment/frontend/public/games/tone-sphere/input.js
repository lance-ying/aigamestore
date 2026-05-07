// input.js - Input handling

import { gameState } from './globals.js';

export class InputHandler {
  constructor(p) {
    this.p = p;
    this.keysPressed = new Set();
    this.keysJustPressed = new Set();
    this.keysJustReleased = new Set();
  }

  handleKeyPress(keyCode) {
    if (!this.keysPressed.has(keyCode)) {
      this.keysJustPressed.add(keyCode);
      this.keysPressed.add(keyCode);
      
      // Log input
      this.p.logs.inputs.push({
        input_type: "keyPressed",
        data: { key: this.p.key, keyCode: keyCode },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  handleKeyRelease(keyCode) {
    if (this.keysPressed.has(keyCode)) {
      this.keysJustReleased.add(keyCode);
      this.keysPressed.delete(keyCode);
      
      // Log input
      this.p.logs.inputs.push({
        input_type: "keyReleased",
        data: { key: this.p.key, keyCode: keyCode },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  isKeyPressed(keyCode) {
    return this.keysPressed.has(keyCode);
  }

  isKeyJustPressed(keyCode) {
    return this.keysJustPressed.has(keyCode);
  }

  isKeyJustReleased(keyCode) {
    return this.keysJustReleased.has(keyCode);
  }

  clearFrameInputs() {
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
  }

  getActiveKeys() {
    return Array.from(this.keysPressed);
  }
}