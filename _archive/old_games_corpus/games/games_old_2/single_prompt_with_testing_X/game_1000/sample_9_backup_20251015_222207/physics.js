// physics.js - Physics and collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState, GAME_PHASES } from './globals.js';

export function setupCollisionHandling(engine, p) {
  Events.on(engine, 'collisionStart', (event) => {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;

    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Player collision with police
      if ((bodyA.label === 'player' && bodyB.label === 'police') ||
          (bodyA.label === 'police' && bodyB.label === 'player')) {
        
        // Calculate collision severity
        const velocity = Math.sqrt(
          Math.pow(bodyA.velocity.x - bodyB.velocity.x, 2) +
          Math.pow(bodyA.velocity.y - bodyB.velocity.y, 2)
        );
        
        if (velocity > 3) {
          handleGameOver(p, 'CAUGHT BY POLICE!');
        }
      }
      
      // Player collision with obstacle
      if ((bodyA.label === 'player' && bodyB.label === 'obstacle') ||
          (bodyA.label === 'obstacle' && bodyB.label === 'player')) {
        
        const velocity = Math.sqrt(
          Math.pow(bodyA.velocity.x - bodyB.velocity.x, 2) +
          Math.pow(bodyA.velocity.y - bodyB.velocity.y, 2)
        );
        
        if (velocity > 4) {
          handleGameOver(p, 'CRASHED INTO OBSTACLE!');
        }
      }
    });
  });
}

function handleGameOver(p, reason) {
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    gameState.gameOverReason = reason;
    
    p.logs.game_info.push({
      data: { 
        gamePhase: GAME_PHASES.GAME_OVER_LOSE,
        reason: reason,
        score: gameState.score
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function checkPlayerCrashed(p) {
  if (gameState.player && gameState.player.isCrashed) {
    handleGameOver(p, 'FELL OFF THE ROAD!');
  }
}