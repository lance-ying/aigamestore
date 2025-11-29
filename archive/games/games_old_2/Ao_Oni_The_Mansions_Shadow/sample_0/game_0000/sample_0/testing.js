// testing.js - Automated testing controllers
import { gameState, GAME_PHASES } from './globals.js';

export class TestController {
  constructor(mode) {
    this.mode = mode;
    this.actionIndex = 0;
    this.frameCounter = 0;
    this.actions = [];
    this.setupActions();
  }

  setupActions() {
    if (this.mode === "TEST_1") {
      // Basic movement test
      this.actions = [
        { frames: 60, keys: [39] },  // Right
        { frames: 60, keys: [40] },  // Down
        { frames: 60, keys: [37] },  // Left
        { frames: 60, keys: [38] },  // Up
        { frames: 30, keys: [32] }   // Space
      ];
    } else if (this.mode === "TEST_2") {
      // Win test - navigate to objectives
      this.actions = [
        { frames: 120, keys: [39] },  // Move right
        { frames: 30, keys: [32] },   // Interact
        { frames: 60, keys: [37] },   // Move left
        { frames: 60, keys: [38] },   // Move up
        { frames: 120, keys: [39] },  // Move right
        { frames: 30, keys: [32] },   // Interact
        { frames: 300, keys: [39] }   // Continue right
      ];
    }
  }

  getAction() {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
      return [];
    }

    if (this.actionIndex >= this.actions.length) {
      return [];
    }

    const currentAction = this.actions[this.actionIndex];
    this.frameCounter++;

    if (this.frameCounter >= currentAction.frames) {
      this.frameCounter = 0;
      this.actionIndex++;
    }

    return currentAction.keys || [];
  }
}

let testController = null;

export function initTestController(mode) {
  if (mode === "HUMAN") {
    testController = null;
  } else {
    testController = new TestController(mode);
  }
}

export function getTestAction() {
  if (!testController) return [];
  return testController.getAction();
}