// physics.js - Matter.js physics and collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState, PHASE_PLAYING, PHASE_GAME_OVER_LOSE } from './globals.js';

export function setupCollisionHandling(p) {
  Events.on(gameState.engine, 'collisionStart', (event) => {
    if (gameState.gamePhase !== PHASE_PLAYING) return;
    
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Check for player-traffic collision
      if ((bodyA.label === 'player' && bodyB.label === 'traffic') ||
          (bodyB.label === 'player' && bodyA.label === 'traffic')) {
        handleGameOver(p);
      }
    });
  });
}

function handleGameOver(p) {
  gameState.gamePhase = PHASE_GAME_OVER_LOSE;
  
  p.logs.game_info.push({
    data: { 
      gamePhase: PHASE_GAME_OVER_LOSE, 
      finalScore: gameState.score,
      crossings: gameState.crossingsCompleted
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updatePhysics() {
  // Matter.js engine is updated in main draw loop
  // This function can be used for additional physics logic
}