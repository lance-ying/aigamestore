// physics.js - Physics handling and collision detection
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState, POCKET_RADIUS, BALL_RADIUS, getPockets } from './globals.js';

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
  const { tableX, tableY, tableWidth, tableHeight } = gameState.levelParams;
  const ballsToPocket = [];
  
  gameState.ballsOnTable.forEach(ball => {
    if (ball.pocketed) return;
    
    const ballPos = ball.body.position;
    const ballVel = ball.body.velocity;
    const speed = Math.sqrt(ballVel.x * ballVel.x + ballVel.y * ballVel.y);
    
    // Safety check: if ball is outside the extended table bounds, pocket it immediately
    const margin = 20; // Tighter margin to catch escaping balls
    if (ballPos.x < tableX - margin || ballPos.x > tableX + tableWidth + margin ||
        ballPos.y < tableY - margin || ballPos.y > tableY + tableHeight + margin) {
      ballsToPocket.push(ball);
      return;
    }
    
    // Check each pocket with aggressive capture
    pockets.forEach(pocket => {
      const dx = ballPos.x - pocket.x;
      const dy = ballPos.y - pocket.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // More generous base threshold to ensure slow balls are captured
      const baseThreshold = pocketRadius + BALL_RADIUS * 1.5;
      
      // For very slow balls (< 0.5), use an even more generous threshold
      if (speed < 0.5) {
        const slowBallThreshold = pocketRadius + BALL_RADIUS * 2.0;
        if (dist < slowBallThreshold) {
          ballsToPocket.push(ball);
          return;
        }
      }
      
      // Progressive capture threshold based on speed for faster balls
      if (speed >= 0.5) {
        const speedFactor = Math.min(speed / 10, 1.0);
        const captureThreshold = baseThreshold * (1 + speedFactor * 0.5);
        
        if (dist < captureThreshold) {
          // Additional check: if moving toward pocket, capture immediately
          const dotProduct = (ballVel.x * dx + ballVel.y * dy);
          // If moving toward pocket (negative dot product), capture more aggressively
          if (dotProduct < 0 && dist < captureThreshold * 1.3) {
            ballsToPocket.push(ball);
            return;
          }
        }
        
        // Standard capture for close balls
        if (dist < baseThreshold) {
          ballsToPocket.push(ball);
          return;
        }
      }
      
      // Heuristic: if ball is in the "pocket zone" (gap area), capture it
      // This prevents balls from escaping through the cushion gaps
      const isInPocketZone = isInPocketGapArea(ballPos, pocket, tableX, tableY, tableWidth, tableHeight);
      if (isInPocketZone && dist < pocketRadius * 3.0) {
        ballsToPocket.push(ball);
        return;
      }
    });
  });
  
  // Pocket the balls (remove duplicates)
  const uniqueBallsToPocket = [...new Set(ballsToPocket)];
  uniqueBallsToPocket.forEach(ball => {
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

// Helper function to check if a ball is in a pocket gap area
function isInPocketGapArea(ballPos, pocket, tableX, tableY, tableWidth, tableHeight) {
  const gapSize = 40; // Size of the gap area around each pocket
  
  // Check if near corner pockets
  if ((Math.abs(pocket.x - tableX) < 5 || Math.abs(pocket.x - (tableX + tableWidth)) < 5) &&
      (Math.abs(pocket.y - tableY) < 5 || Math.abs(pocket.y - (tableY + tableHeight)) < 5)) {
    // Corner pocket - check if in corner gap zone
    if (Math.abs(ballPos.x - pocket.x) < gapSize && Math.abs(ballPos.y - pocket.y) < gapSize) {
      return true;
    }
  }
  
  // Check if near middle pockets
  if (Math.abs(pocket.x - (tableX + tableWidth / 2)) < 5) {
    // Top or bottom middle pocket
    if (Math.abs(ballPos.x - pocket.x) < gapSize && Math.abs(ballPos.y - pocket.y) < gapSize) {
      return true;
    }
  }
  
  return false;
}

export function checkAllBallsStopped() {
  return gameState.ballsOnTable.every(ball => ball.pocketed || ball.isStopped());
}