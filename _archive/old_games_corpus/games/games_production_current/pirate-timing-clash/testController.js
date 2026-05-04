// testController.js - Automated testing controller

import { gameState, GAME_PHASES } from './globals.js';

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

    const phase = gameState.gamePhase;

    // TEST_1: Basic gameplay testing
    if (this.mode === 'TEST_1') {
      if (phase === GAME_PHASES.START) {
        this.frameDelay = 60;
        return { key: 'Enter', keyCode: 13 };
      }
      
      if (phase === GAME_PHASES.PLAYING) {
        if (gameState.timingBar && gameState.timingBar.isActive && !gameState.timingBar.hasPressed) {
          // Wait a bit then press space
          if (p.frameCount % 45 === 0) {
            return { key: ' ', keyCode: 32 };
          }
        }
      }
      
      if (phase === GAME_PHASES.LEVEL_TRANSITION) {
        this.frameDelay = 90;
        return { key: ' ', keyCode: 32 };
      }
      
      if (phase === GAME_PHASES.GAME_OVER_LOSE || phase === GAME_PHASES.GAME_OVER_WIN) {
        this.frameDelay = 120;
        return { key: 'r', keyCode: 82 };
      }
    }

    // TEST_2: Win the game
    if (this.mode === 'TEST_2') {
      if (phase === GAME_PHASES.START) {
        this.frameDelay = 30;
        return { key: 'Enter', keyCode: 13 };
      }
      
      if (phase === GAME_PHASES.PLAYING) {
        // Use special when available
        if (gameState.player && gameState.player.specialGauge >= gameState.player.specialMaxGauge) {
          if (p.frameCount % 20 === 0) {
            return { key: 'Shift', keyCode: 16 };
          }
        }
        
        // Try to hit perfectly
        if (gameState.timingBar && gameState.timingBar.isActive && !gameState.timingBar.hasPressed) {
          const bar = gameState.timingBar;
          const distance = Math.abs(bar.targetX - bar.x);
          
          // Press when close to center
          if (distance < bar.perfectWidth * 0.8) {
            return { key: ' ', keyCode: 32 };
          }
        }
      }
      
      if (phase === GAME_PHASES.LEVEL_TRANSITION) {
        this.frameDelay = 60;
        return { key: ' ', keyCode: 32 };
      }
      
      if (phase === GAME_PHASES.GAME_OVER_WIN) {
        this.frameDelay = 180;
        return { key: 'r', keyCode: 82 };
      }
    }

    return null;
  }
}