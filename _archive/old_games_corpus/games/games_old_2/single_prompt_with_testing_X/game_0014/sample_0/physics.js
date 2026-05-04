// physics.js
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;
import { gameState, PHASE_PLAYING } from './globals.js';

export function setupCollisionHandling() {
  Events.on(gameState.engine, 'collisionStart', (event) => {
    if (gameState.gamePhase !== PHASE_PLAYING) return;
    
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const { bodyA, bodyB } = pair;
      
      // Check if monster ball touched good ball
      if ((bodyA.label === 'monsterBall' && bodyB.label === 'goodBall') ||
          (bodyA.label === 'goodBall' && bodyB.label === 'monsterBall')) {
        
        const goodBallBody = bodyA.label === 'goodBall' ? bodyA : bodyB;
        
        // Find the good ball entity
        const goodBall = gameState.goodBalls.find(b => b.body === goodBallBody);
        if (goodBall && goodBall.isAlive) {
          goodBall.isAlive = false;
          gameState.gameOverReason = "A monster ball caught a good ball!";
          gameState.gamePhase = "GAME_OVER_LOSE";
        }
      }
    });
  });
}