// testController.js - Automated testing controller
import { gameState, PHASE_PLAYING, PHASE_START } from './globals.js';

export class TestController {
  constructor(mode) {
    this.mode = mode;
    this.actionQueue = [];
    this.frameDelay = 0;
  }

  getAction(p) {
    if (this.frameDelay > 0) {
      this.frameDelay--;
      return null;
    }

    if (gameState.gamePhase === PHASE_START) {
      return { key: 'Enter', keyCode: 13 };
    }

    if (gameState.gamePhase !== PHASE_PLAYING) {
      return null;
    }

    if (!gameState.fallingCard) {
      return null;
    }

    if (this.mode === 'TEST_1') {
      return this.basicTest(p);
    } else if (this.mode === 'TEST_2') {
      return this.winTest(p);
    }

    return null;
  }

  basicTest(p) {
    // Simple strategy: alternate between left and right, then drop
    if (p.frameCount % 40 === 0) {
      return { key: 'ArrowLeft', keyCode: 37 };
    } else if (p.frameCount % 40 === 10) {
      return { key: 'ArrowRight', keyCode: 39 };
    } else if (p.frameCount % 40 === 20) {
      return { key: ' ', keyCode: 32 };
    }
    return null;
  }

  winTest(p) {
    // Strategy to win: try to create combos
    const fc = gameState.fallingCard;
    if (!fc || !fc.card) return null;

    // Try to place cards in columns that might form combos
    const targetCol = (p.frameCount % 7);
    
    if (fc.col < targetCol) {
      return { key: 'ArrowRight', keyCode: 39 };
    } else if (fc.col > targetCol) {
      return { key: 'ArrowLeft', keyCode: 37 };
    } else {
      // Drop when in correct column
      return { key: ' ', keyCode: 32 };
    }
  }
}