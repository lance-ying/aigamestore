// input.js - Input handling
import { GAME_PHASES, gameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

export class InputHandler {
  constructor() {
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      space: false,
      shift: false,
      z: false
    };
  }

  update(p) {
    if (gameState.controlMode === "HUMAN") {
      this.keys.up = p.keyIsDown(38);
      this.keys.down = p.keyIsDown(40);
      this.keys.left = p.keyIsDown(37);
      this.keys.right = p.keyIsDown(39);
      this.keys.space = p.keyIsDown(32);
      this.keys.shift = p.keyIsDown(16);
      this.keys.z = p.keyIsDown(90);
    } else {
      // Automated testing mode
      const action = get_automated_testing_action(gameState);
      this.keys.up = action.up || false;
      this.keys.down = action.down || false;
      this.keys.left = action.left || false;
      this.keys.right = action.right || false;
      this.keys.space = action.space || false;
      this.keys.shift = action.shift || false;
      this.keys.z = action.z || false;
    }
  }

  logInput(p, type, key, keyCode) {
    p.logs.inputs.push({
      input_type: type,
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}