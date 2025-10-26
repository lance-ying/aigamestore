// controller.js - Input and AI controller

import { gameState, GAME_PHASE, CANVAS_WIDTH, CONTAINER } from './globals.js';

export class InputController {
  constructor(p) {
    this.p = p;
    this.keys = {};
    this.testController = new TestController(p);
  }

  handleKeyPressed(keyCode, key) {
    this.keys[keyCode] = true;

    // Log input
    this.p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key, keyCode },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });

    return { keyCode, key };
  }

  handleKeyReleased(keyCode) {
    this.keys[keyCode] = false;
  }

  update() {
    if (gameState.controlMode === "HUMAN") {
      return this.handleHumanInput();
    } else {
      return this.testController.update(gameState.controlMode);
    }
  }

  handleHumanInput() {
    const actions = {
      moveLeft: false,
      moveRight: false,
      drop: false
    };

    if (gameState.gamePhase === GAME_PHASE.PLAYING) {
      // Movement
      if (this.p.keyIsDown(37) || this.p.keyIsDown(65)) { // Left arrow or A
        actions.moveLeft = true;
      }
      if (this.p.keyIsDown(39) || this.p.keyIsDown(68)) { // Right arrow or D
        actions.moveRight = true;
      }
    }

    return actions;
  }
}

class TestController {
  constructor(p) {
    this.p = p;
    this.lastActionTime = 0;
    this.actionDelay = 500;
    this.targetX = CANVAS_WIDTH / 2;
    this.mode = null;
    this.dropTimer = 0;
  }

  update(mode) {
    this.mode = mode;
    const now = Date.now();
    
    const actions = {
      moveLeft: false,
      moveRight: false,
      drop: false
    };

    if (gameState.gamePhase !== GAME_PHASE.PLAYING) {
      return actions;
    }

    // Basic test - just drop in center periodically
    if (mode === "TEST_1") {
      this.dropTimer++;
      if (this.dropTimer > 60) {
        actions.drop = true;
        this.dropTimer = 0;
      }
      
      // Move towards center
      if (gameState.dropX < CANVAS_WIDTH / 2 - 5) {
        actions.moveRight = true;
      } else if (gameState.dropX > CANVAS_WIDTH / 2 + 5) {
        actions.moveLeft = true;
      }
    }

    // Win test - strategic placement
    if (mode === "TEST_2") {
      this.dropTimer++;
      
      if (this.dropTimer > 45) {
        actions.drop = true;
        this.dropTimer = 0;
        
        // Vary drop position for better fusion opportunities
        this.targetX = CONTAINER.x + CONTAINER.wallThickness + 50 + 
                      (this.p.frameCount % 3) * 100;
      }
      
      // Move towards target
      if (gameState.dropX < this.targetX - 5) {
        actions.moveRight = true;
      } else if (gameState.dropX > this.targetX + 5) {
        actions.moveLeft = true;
      }
    }

    return actions;
  }
}