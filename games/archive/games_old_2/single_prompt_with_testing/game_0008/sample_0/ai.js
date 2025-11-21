// ai.js - Automated testing AI controllers

import { gameState } from './globals.js';

export class AIController {
  constructor() {
    this.startTime = Date.now();
    this.lastJumpTime = 0;
    this.movePhase = 0;
    this.phaseStartTime = Date.now();
  }
  
  getInputs() {
    return {
      left: false,
      right: false,
      jump: false
    };
  }
}

export class TEST_1_Controller extends AIController {
  // Basic testing: move right, jump, move left, jump
  getInputs() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const inputs = { left: false, right: false, jump: false };
    
    if (elapsed < 2) {
      // Move right for 2 seconds
      inputs.right = true;
    } else if (elapsed < 3) {
      // Jump
      if (Date.now() - this.lastJumpTime > 500) {
        inputs.jump = true;
        this.lastJumpTime = Date.now();
      }
    } else if (elapsed < 5) {
      // Move left for 2 seconds
      inputs.left = true;
    } else if (elapsed < 6) {
      // Jump again
      if (Date.now() - this.lastJumpTime > 500) {
        inputs.jump = true;
        this.lastJumpTime = Date.now();
      }
    }
    
    return inputs;
  }
}

export class TEST_2_Controller extends AIController {
  // Win test: continuously move right with periodic jumps
  getInputs() {
    const inputs = { left: false, right: false, jump: false };
    
    // Always move right
    inputs.right = true;
    
    // Jump every 1.5 seconds
    if (Date.now() - this.lastJumpTime > 1500) {
      inputs.jump = true;
      this.lastJumpTime = Date.now();
    }
    
    return inputs;
  }
}

export function createAIController(mode) {
  switch (mode) {
    case 'TEST_1':
      return new TEST_1_Controller();
    case 'TEST_2':
      return new TEST_2_Controller();
    default:
      return null;
  }
}