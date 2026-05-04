// inputHandler.js - Handle keyboard input

import { gameState, GAME_PHASES, CANVAS_WIDTH } from './globals.js';

export class InputHandler {
  constructor(p, gameManager) {
    this.p = p;
    this.gameManager = gameManager;
  }

  keyPressed() {
    const key = this.p.key;
    const keyCode = this.p.keyCode;

    // Log input
    this.p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key, keyCode },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });

    // ENTER - Start/Continue
    if (keyCode === 13) {
      if (gameState.gamePhase === GAME_PHASES.START) {
        this.gameManager.startGame();
      }
    }

    // ESC - Pause/Unpause
    if (keyCode === 27) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        this.p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        this.p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    // R - Restart
    if (keyCode === 82) {
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
          gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.START;
        this.p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    // SPACE - Jump
    if (keyCode === 32 && gameState.gamePhase === GAME_PHASES.PLAYING) {
      this.gameManager.handleJump();
    }

    // LEFT ARROW - Steer left (single tap, discrete movement)
    if (keyCode === 37 && gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.currentAnimal && !gameState.isJumping) {
        gameState.currentAnimal.x = Math.max(
          gameState.currentAnimal.width / 2 + 20,
          gameState.currentAnimal.x - 25
        );
      }
    }

    // RIGHT ARROW - Steer right (single tap, discrete movement)
    if (keyCode === 39 && gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.currentAnimal && !gameState.isJumping) {
        gameState.currentAnimal.x = Math.min(
          CANVAS_WIDTH - gameState.currentAnimal.width / 2 - 20,
          gameState.currentAnimal.x + 25
        );
      }
    }
  }
}