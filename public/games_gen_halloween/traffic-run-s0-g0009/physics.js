// physics.js - Matter.js collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState, PHASE_GAME_OVER_LOSE } from './globals.js';

export function setupCollisionHandling(p) {
  Events.on(gameState.engine, 'collisionStart', (event) => {
    if (gameState.gamePhase !== 'PLAYING') return;
    
    const pairs = event.pairs;
    
    for (let pair of pairs) {
      const { bodyA, bodyB } = pair;
      
      // Check for player-traffic collision
      if ((bodyA.label === 'player' && bodyB.label === 'traffic') ||
          (bodyA.label === 'traffic' && bodyB.label === 'player')) {
        
        // Game over on collision
        gameState.gamePhase = PHASE_GAME_OVER_LOSE;
        
        p.logs.game_info.push({
          data: { 
            gamePhase: PHASE_GAME_OVER_LOSE,
            reason: 'collision',
            level: gameState.level,
            score: gameState.score
          },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        
        console.log('Collision detected! Game Over.');
      }
    }
  });
}