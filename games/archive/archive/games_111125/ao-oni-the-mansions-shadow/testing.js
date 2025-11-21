// testing.js - Automated testing controllers
import { gameState, GAME_PHASES } from './globals.js';

export class TestController {
  constructor(mode) {
    this.mode = mode;
    this.actionIndex = 0;
    this.frameCounter = 0;
    this.actions = [];
    this.startDelay = 60; // Wait 1 second before auto-starting
    this.hasStarted = false;
    this.setupActions();
  }

  setupActions() {
    if (this.mode === "TEST_1") {
      // Basic movement test - demonstrate all controls
      this.actions = [
        { frames: 60, keys: [39] },      // Right
        { frames: 60, keys: [40] },      // Down
        { frames: 60, keys: [37] },      // Left
        { frames: 60, keys: [38] },      // Up
        { frames: 30, keys: [39, 16] },  // Right + Sprint
        { frames: 30, keys: [32] },      // Space (interact)
        { frames: 30, keys: [90] },      // Z (flashlight toggle)
        { frames: 60, keys: [39] }       // Continue right
      ];
    } else if (this.mode === "TEST_2") {
      // Win test - navigate to objectives
      this.actions = [
        { frames: 90, keys: [39] },      // Move right to key
        { frames: 30, keys: [32] },      // Pick up key
        { frames: 30, keys: [] },        // Wait
        { frames: 60, keys: [37] },      // Move left
        { frames: 60, keys: [40] },      // Move down
        { frames: 30, keys: [32] },      // Unlock door
        { frames: 30, keys: [] },        // Wait
        { frames: 120, keys: [38] },     // Move up to exit
        { frames: 90, keys: [39] },      // Move right to exit
        { frames: 60, keys: [] }         // Wait at exit
      ];
    }
  }

  getAction() {
    // Auto-start game if on start screen
    if (gameState.gamePhase === GAME_PHASES.START && !this.hasStarted) {
      this.startDelay--;
      if (this.startDelay <= 0) {
        this.hasStarted = true;
        return [13]; // Enter key
      }
      return [];
    }

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