// physics.js - Physics handling and collision detection
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState, POCKET_RADIUS, getPockets } from './globals.js';

export function setupPhysics(p) {
  // Collision detection for ball contacts
  Events.on(gameState.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Track first ball contact
      if (gameState.playingPhase === "WAITING" && !gameState.firstContactBall) {
        if (bodyA.label === "ball_0" && bodyB.label && bodyB.label.startsWith("ball_")) {
          gameState.firstContactBall = bodyB.number;
        } else if (bodyB.label === "ball_0" && bodyA.label && bodyA.label.startsWith("ball_")) {
          gameState.firstContactBall = bodyA.number;
        }
      }
      
      // Track cushion hits
      if (gameState.playingPhase === "WAITING") {
        if ((bodyA.label === "cushion" && bodyB.label && bodyB.label.startsWith("ball_")) ||
            (bodyB.label === "cushion" && bodyA.label && bodyA.label.startsWith("ball_"))) {
          gameState.cushionHits++;
        }
      }
    });
  });
}

export function checkPockets(p) {
  const pockets = getPockets();
  const pocketRadius = POCKET_RADIUS * gameState.levelParams.pocketSizeMultiplier;
  const ballsToPocket = [];
  
  gameState.ballsOnTable.forEach(ball => {
    if (ball.pocketed) return;
    
    const ballPos = ball.body.position;
    
    pockets.forEach(pocket => {
      const dx = ballPos.x - pocket.x;
      const dy = ballPos.y - pocket.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < pocketRadius) {
        ballsToPocket.push(ball);
      }
    });
  });
  
  // Pocket the balls
  ballsToPocket.forEach(ball => {
    ball.pocketed = true;
    Matter.World.remove(gameState.world, ball.body);
    
    gameState.lastPocketedBalls.push(ball.number);
    gameState.pocketedBalls.push(ball.number);
    
    // Log pocketing
    p.logs.game_info.push({
      data: { event: "ball_pocketed", ball: ball.number },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  });
}

export function checkAllBallsStopped() {
  return gameState.ballsOnTable.every(ball => ball.pocketed || ball.isStopped());
}