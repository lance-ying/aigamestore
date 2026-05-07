// input_handler.js - Input handling for both human and automated testing
import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED } from './globals.js';
// Removed: import get_automated_testing_action from './automated_testing_controller.js';

export class InputHandler {
  constructor(p, gameLogic) {
    this.p = p;
    this.gameLogic = gameLogic;
    this.actionQueue = [];
  }

  handleKeyPressed() {
    const p = this.p;

    // Log the input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Game phase transitions (always human controlled)
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === PHASE_START) {
        this.gameLogic.startGame();
      }
      return;
    }

    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === PHASE_PLAYING) {
        this.gameLogic.pauseGame();
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        this.gameLogic.unpauseGame();
      }
      return;
    }

    if (p.keyCode === 82) { // R
      this.gameLogic.restartGame();
      return;
    }

    // Gameplay inputs
    // The check for gameState.controlMode === "HUMAN" is kept for robustness,
    // though with test modes removed, it will always be "HUMAN".
    if (gameState.gamePhase === PHASE_PLAYING && gameState.controlMode === "HUMAN") {
      this.processGameplayInput(p.keyCode);
    }
  }

  handleKeyReleased() {
    const p = this.p;

    // Log the input
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Release hold notes on SPACE release (Standard hold key)
    // Z key (Special) does not control holds
    // The check for gameState.controlMode === "HUMAN" is kept for robustness.
    if (gameState.gamePhase === PHASE_PLAYING && gameState.controlMode === "HUMAN") {
      if (p.keyCode === 32) { // SPACE
        this.gameLogic.releaseHoldKey();
      }
    }
  }

  processGameplayInput(keyCode) {
    const player = gameState.player;

    if (keyCode === 37) { // LEFT
      player.moveLeft();
    } else if (keyCode === 39) { // RIGHT
      player.moveRight();
    } else if (keyCode === 32 || keyCode === 16) { // SPACE or SHIFT
      // Standard hit (Red/Green notes)
      this.gameLogic.hitNote('STANDARD');
    } else if (keyCode === 90) { // Z
      // Special hit (Yellow/Swipe notes)
      this.gameLogic.hitNote('SPECIAL');
    }
  }

  // Removed: updateAutomatedTesting() method as automated testing is removed.
  // Removed: executeAction(action) method as it was only called by updateAutomatedTesting().

  logPlayerInfo() {
    if (gameState.gamePhase !== PHASE_PLAYING || !gameState.player) return;

    const pos = gameState.player.getScreenPosition();
    const gamePos = gameState.player.getGamePosition();

    this.p.logs.player_info.push({
      screen_x: pos.x,
      screen_y: pos.y,
      game_x: gamePos.x,
      game_y: gamePos.y,
      framecount: this.p.frameCount
    });
  }
}