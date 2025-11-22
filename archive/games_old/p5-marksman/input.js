// input.js - Input handling for keyboard controls

import { gameState, GAME_PHASES } from './globals.js';

export class InputHandler {
  constructor(p) {
    this.p = p;
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      space: false,
      shift: false,
      w: false,
      s: false,
      z: false
    };
  }

  handleKeyPressed(keyCode, key) {
    // Log input
    this.p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: key, keyCode: keyCode },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });

    // Phase-specific controls
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        gameState.missionStarted = true;
        this.logGameInfo("Game started");
      }
    } else if (keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        this.logGameInfo("Game paused");
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        this.logGameInfo("Game resumed");
      }
    } else if (keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        this.resetGame();
      }
    }

    // Gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (keyCode === 37) this.keys.left = true;
      if (keyCode === 39) this.keys.right = true;
      if (keyCode === 38) this.keys.up = true;
      if (keyCode === 40) this.keys.down = true;
      if (keyCode === 32) this.keys.space = true;
      if (keyCode === 16) this.keys.shift = true;
      if (keyCode === 87) this.keys.w = true;
      if (keyCode === 83) this.keys.s = true;
      if (keyCode === 90) this.keys.z = true;
    }
  }

  handleKeyReleased(keyCode) {
    if (keyCode === 37) this.keys.left = false;
    if (keyCode === 39) this.keys.right = false;
    if (keyCode === 38) this.keys.up = false;
    if (keyCode === 40) this.keys.down = false;
    if (keyCode === 32) this.keys.space = false;
    if (keyCode === 16) this.keys.shift = false;
    if (keyCode === 87) this.keys.w = false;
    if (keyCode === 83) this.keys.s = false;
    if (keyCode === 90) this.keys.z = false;
  }

  resetGame() {
    gameState.gamePhase = GAME_PHASES.START;
    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.missionStarted = false;
    gameState.zoomLevel = 1;
    gameState.cameraX = 0;
    gameState.cameraY = 0;
    this.logGameInfo("Game reset");
  }

  logGameInfo(data) {
    this.p.logs.game_info.push({
      data: data,
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
}