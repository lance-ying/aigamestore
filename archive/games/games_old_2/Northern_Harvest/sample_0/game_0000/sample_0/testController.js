// testController.js - Automated testing controller

import { gameState, GAME_PHASES, VIEW_MODES, CROP_TYPES } from './globals.js';
import { getFarmPlotAt } from './farmPlot.js';

export class TestController {
  constructor(mode) {
    this.mode = mode;
    this.actionQueue = [];
    this.currentStep = 0;
    this.stepTimer = 0;
    this.stepDelay = 0.5; // seconds between actions
  }
  
  update(deltaTime) {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
      return null;
    }
    
    this.stepTimer += deltaTime;
    
    if (this.stepTimer >= this.stepDelay) {
      this.stepTimer = 0;
      return this.getNextAction();
    }
    
    return null;
  }
  
  getNextAction() {
    if (this.mode === "TEST_1") {
      return this.basicTestSequence();
    } else if (this.mode === "TEST_2") {
      return this.winTestSequence();
    }
    return null;
  }
  
  basicTestSequence() {
    const actions = [
      { type: "WAIT", frames: 30 },
      { type: "TILL", x: 2, y: 2 },
      { type: "PLANT", x: 2, y: 2, crop: "WHEAT" },
      { type: "WAIT", frames: 300 },
      { type: "HARVEST", x: 2, y: 2 },
      { type: "TILL", x: 3, y: 2 },
      { type: "PLANT", x: 3, y: 2, crop: "WHEAT" },
      { type: "WAIT", frames: 300 },
      { type: "HARVEST", x: 3, y: 2 },
      { type: "TILL", x: 4, y: 2 },
      { type: "PLANT", x: 4, y: 2, crop: "WHEAT" },
      { type: "WAIT", frames: 300 },
      { type: "HARVEST", x: 4, y: 2 }
    ];
    
    if (this.currentStep < actions.length) {
      const action = actions[this.currentStep];
      this.currentStep++;
      return action;
    }
    
    return null;
  }
  
  winTestSequence() {
    // Fast-track to win condition
    const step = this.currentStep++;
    
    if (step === 0) {
      // Give resources
      gameState.coins = 5000;
      gameState.wood = 1000;
      gameState.stone = 1000;
      gameState.playerXP = 2000;
      gameState.playerLevel = 5;
      return { type: "CHEAT_RESOURCES" };
    }
    
    if (step < 20) {
      const x = (step % 5) + 2;
      const y = Math.floor(step / 5) + 2;
      return { type: "TILL", x, y };
    }
    
    if (step < 40) {
      const x = ((step - 20) % 5) + 2;
      const y = Math.floor((step - 20) / 5) + 2;
      return { type: "PLANT", x, y, crop: "WHEAT" };
    }
    
    if (step === 40) {
      return { type: "WAIT", frames: 600 };
    }
    
    if (step < 60) {
      const x = ((step - 41) % 5) + 2;
      const y = Math.floor((step - 41) / 5) + 2;
      return { type: "HARVEST", x, y };
    }
    
    return null;
  }
}

export function createTestController(mode) {
  return new TestController(mode);
}