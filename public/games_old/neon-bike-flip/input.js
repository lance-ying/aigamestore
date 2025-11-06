// input.js - Input handling for player and testing
import { gameState, GAME_PHASES } from './globals.js';

export class InputHandler {
  constructor(p) {
    this.p = p;
    this.testingActions = [];
    this.testingFrameIndex = 0;
  }
  
  handleKeyPressed(key, keyCode) {
    // Log input
    this.p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key, keyCode },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
    
    // Game phase controls
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        return { action: 'START_GAME' };
      }
    } else if (keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        return { action: 'PAUSE' };
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        return { action: 'UNPAUSE' };
      }
    } else if (keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        return { action: 'RESTART' };
      }
    }
    
    return null;
  }
  
  getPlayerActions() {
    if (gameState.controlMode === 'HUMAN') {
      return this.getHumanActions();
    } else {
      return this.getTestingActions();
    }
  }
  
  getHumanActions() {
    const actions = {
      rotateLeft: this.p.keyIsDown(37), // Arrow Left
      rotateRight: this.p.keyIsDown(39) // Arrow Right
    };
    return actions;
  }
  
  getTestingActions() {
    // Simple AI for testing
    if (!gameState.player) return { rotateLeft: false, rotateRight: false };
    
    const bike = gameState.player;
    const angle = this.normalizeAngle(bike.mainBody.angle);
    
    if (gameState.controlMode === 'TEST_1') {
      // Basic testing - maintain upright position
      if (gameState.isAirborne) {
        if (angle > 0.1) {
          return { rotateLeft: true, rotateRight: false };
        } else if (angle < -0.1) {
          return { rotateLeft: false, rotateRight: true };
        }
      }
      return { rotateLeft: false, rotateRight: false };
    } else if (gameState.controlMode === 'TEST_2') {
      // Win test - attempt flips and safe landings
      if (gameState.isAirborne) {
        // Try to do flips
        const speed = Math.abs(bike.mainBody.angularVelocity);
        if (speed < 0.15) {
          return { rotateLeft: false, rotateRight: true };
        }
      } else {
        // On ground, stay upright
        if (angle > 0.15) {
          return { rotateLeft: true, rotateRight: false };
        } else if (angle < -0.15) {
          return { rotateLeft: false, rotateRight: true };
        }
      }
      return { rotateLeft: false, rotateRight: false };
    }
    
    return { rotateLeft: false, rotateRight: false };
  }
  
  normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }
}