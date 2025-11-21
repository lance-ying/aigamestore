import { gameState } from './globals.js';

export class TimeRewind {
  constructor() {
    this.maxFrames = 180; // 3 seconds
    this.rewindCost = 30; // Energy cost per use
  }

  canRewind() {
    return gameState.timeEnergy >= this.rewindCost && gameState.rewindData.length > 60;
  }

  activateRewind() {
    if (!this.canRewind()) return false;
    
    gameState.timeEnergy -= this.rewindCost;
    gameState.rewindActive = true;
    return true;
  }

  update() {
    if (gameState.rewindActive) {
      // Rewind game state
      if (gameState.rewindData.length > 0) {
        const state = gameState.rewindData.pop();
        this.restoreState(state);
      } else {
        gameState.rewindActive = false;
      }
    } else {
      // Record game state
      this.recordState();
    }
    
    // Regenerate time energy slowly
    if (gameState.timeEnergy < gameState.maxTimeEnergy) {
      gameState.timeEnergy += 0.05;
    }
  }

  recordState() {
    if (gameState.rewindData.length >= this.maxFrames) {
      gameState.rewindData.shift();
    }
    
    const state = {
      playerState: gameState.player ? gameState.player.getState() : null,
      cosmicEndState: gameState.cosmicEnd ? gameState.cosmicEnd.getState() : null,
      scrollOffset: gameState.scrollOffset,
      score: gameState.score,
      distanceTraveled: gameState.distanceTraveled,
      gemsCollected: gameState.gems.map(g => g.collected)
    };
    
    gameState.rewindData.push(state);
  }

  restoreState(state) {
    if (state.playerState && gameState.player) {
      gameState.player.setState(state.playerState);
    }
    if (state.cosmicEndState && gameState.cosmicEnd) {
      gameState.cosmicEnd.setState(state.cosmicEndState);
    }
    gameState.scrollOffset = state.scrollOffset;
    gameState.score = state.score;
    gameState.distanceTraveled = state.distanceTraveled;
    
    // Restore gem collection state
    for (let i = 0; i < state.gemsCollected.length && i < gameState.gems.length; i++) {
      gameState.gems[i].collected = state.gemsCollected[i];
    }
  }

  drawRewindEffect(p) {
    if (!gameState.rewindActive) return;
    
    p.push();
    // Overlay effect
    p.fill(150, 100, 255, 30);
    p.noStroke();
    p.rect(0, 0, p.width, p.height);
    
    // Rewind text
    p.fill(200, 150, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text('⟲ REWINDING', p.width / 2, 50);
    p.pop();
  }
}