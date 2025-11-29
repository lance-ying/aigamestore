// physics.js - Physics and collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState } from './globals.js';

export function setupCollisionHandling(engine, p) {
  Events.on(engine, 'collisionStart', (event) => {
    if (gameState.gamePhase !== 'PLAYING' || gameState.servingPhase) return;
    
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Check player cup collision with collectible
      if ((bodyA.label === 'cup' && bodyB.label === 'collectible') ||
          (bodyB.label === 'cup' && bodyA.label === 'collectible')) {
        
        const collectible = gameState.entities.find(e => 
          e.body === (bodyA.label === 'collectible' ? bodyA : bodyB) && 
          e.constructor.name === 'Collectible' && 
          !e.collected
        );
        
        if (collectible && gameState.player) {
          collectible.collect();
          gameState.player.addCup();
        }
      }
      
      // Check player cup collision with obstacle
      if ((bodyA.label === 'cup' && bodyB.label === 'obstacle') ||
          (bodyB.label === 'cup' && bodyA.label === 'obstacle')) {
        
        const obstacle = gameState.entities.find(e => 
          e.body === (bodyA.label === 'obstacle' ? bodyA : bodyB) && 
          e.constructor.name === 'Obstacle' && 
          !e.hit
        );
        
        if (obstacle && gameState.player && !gameState.player.isEmpty()) {
          obstacle.onHit();
          gameState.player.removeCup();
          gameState.obstaclesHit++;
        }
      }
      
      // Check player cup collision with gate
      if ((bodyA.label.startsWith('gate_') && bodyB.label === 'cup') ||
          (bodyB.label.startsWith('gate_') && bodyA.label === 'cup')) {
        
        const gateBody = bodyA.label.startsWith('gate_') ? bodyA : bodyB;
        const gateType = gateBody.label.split('_')[1];
        
        const gate = gameState.entities.find(e => 
          e.body === gateBody && 
          e.constructor.name === 'Gate' && 
          !e.activated
        );
        
        if (gate && gameState.player) {
          gate.activate();
          gameState.player.applyGate(gateType);
        }
      }
    });
  });
}