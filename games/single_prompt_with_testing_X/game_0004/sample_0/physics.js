// physics.js - Matter.js collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState, GAME_PHASES } from './globals.js';

export function setupCollisionHandling() {
  Events.on(gameState.engine, 'collisionStart', (event) => {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    
    const pairs = event.pairs;
    
    for (let pair of pairs) {
      const { bodyA, bodyB } = pair;
      
      // Player hit obstacle
      if ((bodyA.label === 'player' && bodyB.label === 'obstacle') ||
          (bodyB.label === 'player' && bodyA.label === 'obstacle')) {
        // Game over
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
        gameState.consecutivePasses = 0;
        gameState.jellyFeverActive = false;
      }
    }
  });
}