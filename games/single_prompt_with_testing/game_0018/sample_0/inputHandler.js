// inputHandler.js - Input handling for human and automated control
import { gameState, GAME_PHASES, CONTROL_MODES } from './globals.js';

export class InputHandler {
  constructor() {
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      space: false,
      shift: false,
      z: false
    };
  }

  updateKeys(p) {
    if (gameState.controlMode === CONTROL_MODES.HUMAN) {
      this.keys.left = p.keyIsDown(37);
      this.keys.right = p.keyIsDown(39);
      this.keys.up = p.keyIsDown(38);
      this.keys.down = p.keyIsDown(40);
      this.keys.space = p.keyIsDown(32);
      this.keys.shift = p.keyIsDown(16);
      this.keys.z = p.keyIsDown(90);
    } else {
      // Automated testing mode
      if (typeof window.get_automated_testing_action === 'function') {
        const action = window.get_automated_testing_action(gameState);
        this.keys.left = action.left || false;
        this.keys.right = action.right || false;
        this.keys.up = action.up || false;
        this.keys.down = action.down || false;
        this.keys.space = action.space || false;
        this.keys.shift = action.shift || false;
        this.keys.z = action.z || false;
      }
    }
    
    return this.keys;
  }

  handleKeyPress(p, key, keyCode) {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Game phase transitions
    if (keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
      // ENTER - Start game
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, event: "game_started" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (keyCode === 27 && (gameState.gamePhase === GAME_PHASES.PLAYING || gameState.gamePhase === GAME_PHASES.PAUSED)) {
      // ESC - Pause/Unpause
      gameState.gamePhase = gameState.gamePhase === GAME_PHASES.PLAYING ? GAME_PHASES.PAUSED : GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, event: "pause_toggle" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (keyCode === 82 && (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE)) {
      // R - Restart
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, event: "restart" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  handleKeyRelease(p, key, keyCode) {
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}