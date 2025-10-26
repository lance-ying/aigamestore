// testing.js - Automated testing controllers

import { gameState } from './globals.js';

export class TestController {
  constructor(mode) {
    this.mode = mode;
    this.actionQueue = [];
    this.frameCounter = 0;
  }

  getAction() {
    this.frameCounter++;
    
    if (this.mode === 'TEST_1') {
      return this.basicTest();
    } else if (this.mode === 'TEST_2') {
      return this.winTest();
    }
    
    return null;
  }

  basicTest() {
    // Basic movement and shooting test
    const frame = this.frameCounter;
    
    if (frame === 1) return { key: 13, type: 'keyPressed' }; // Start
    if (frame > 60 && frame < 120 && frame % 2 === 0) return { key: 37, type: 'keyPressed' }; // Rotate left
    if (frame === 130) return { key: 32, type: 'keyPressed' }; // Fire
    if (frame > 140 && frame < 200 && frame % 2 === 0) return { key: 39, type: 'keyPressed' }; // Rotate right
    if (frame === 210) return { key: 32, type: 'keyPressed' }; // Fire
    if (frame === 250) return { key: 27, type: 'keyPressed' }; // Pause
    if (frame === 280) return { key: 27, type: 'keyPressed' }; // Unpause
    
    return null;
  }

  winTest() {
    // Aggressive shooting to try to win
    const frame = this.frameCounter;
    const state = gameState;
    
    if (frame === 1) return { key: 13, type: 'keyPressed' };
    
    if (state.gamePhase === 'PLAYING') {
      // Aim at different angles and shoot rapidly
      const cycle = Math.floor(frame / 30) % 4;
      
      if (frame % 30 === 0) return { key: 32, type: 'keyPressed' }; // Fire
      
      if (cycle === 0 && frame % 5 === 0) return { key: 37, type: 'keyPressed' };
      if (cycle === 1 && frame % 5 === 0) return { key: 39, type: 'keyPressed' };
      if (cycle === 2 && frame % 3 === 0) return { key: 37, type: 'keyPressed' };
      if (cycle === 3 && frame % 3 === 0) return { key: 39, type: 'keyPressed' };
      
      // Use power-ups when available
      if (state.bombPowerups > 0 && frame % 150 === 0) {
        return { key: 90, type: 'keyPressed' }; // Use bomb
      }
      if (state.beamPowerups > 0 && frame % 200 === 0) {
        return { key: 16, type: 'keyPressed' }; // Use beam
      }
    }
    
    return null;
  }
}