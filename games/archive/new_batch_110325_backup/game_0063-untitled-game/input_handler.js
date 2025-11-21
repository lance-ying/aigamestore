// input_handler.js - Input handling
import { gameState, PHASE_PLAYING, CONTROL_HUMAN } from './globals.js';

export class InputHandler {
  constructor(p, player) {
    this.p = p;
    this.player = player;
  }
  
  handleInput() {
    if (gameState.controlMode !== CONTROL_HUMAN) return;
    if (gameState.gamePhase !== PHASE_PLAYING) return;
    
    const p = this.p;
    
    // Camera rotation
    if (p.keyIsDown(p.LEFT_ARROW)) {
      this.player.rotateView(-this.player.rotationSpeed);
    }
    if (p.keyIsDown(p.RIGHT_ARROW)) {
      this.player.rotateView(this.player.rotationSpeed);
    }
    if (p.keyIsDown(p.UP_ARROW)) {
      this.player.adjustPitch(this.player.pitchSpeed);
    }
    if (p.keyIsDown(p.DOWN_ARROW)) {
      this.player.adjustPitch(-this.player.pitchSpeed);
    }
  }
  
  handleAutomatedInput(action) {
    if (!action || gameState.gamePhase !== PHASE_PLAYING) return;
    
    const p = this.p;
    
    if (action.left) this.player.rotateView(-this.player.rotationSpeed);
    if (action.right) this.player.rotateView(this.player.rotationSpeed);
    if (action.up) this.player.adjustPitch(this.player.pitchSpeed);
    if (action.down) this.player.adjustPitch(-this.player.pitchSpeed);
    if (action.interact) this.handleInteraction();
    if (action.toggleOculus) this.toggleOculus();
  }
  
  handleInteraction() {
    if (gameState.targetElement && gameState.targetElement.isAccessible()) {
      const solved = gameState.targetElement.interact();
      if (solved) {
        gameState.score += 10;
      }
    }
  }
  
  toggleOculus() {
    if (gameState.oculusEnergy > 0) {
      gameState.oculusActive = !gameState.oculusActive;
    } else {
      gameState.oculusActive = false;
    }
  }
}