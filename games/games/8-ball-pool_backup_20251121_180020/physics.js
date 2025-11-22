// physics.js - Physics handling and collision detection
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events, Body } = Matter;

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
    
    // HARD BOUNDARY ENFORCEMENT - prevent balls from ever going outside table bounds
    const hardMargin = 50; // Absolute boundary
    const safeMargin = 20; // Safe zone for teleporting back
    
    // Check if ball has escaped outside hard boundaries
    if (ballPos.x < tableX - hardMargin || ballPos.x > tableX + tableWidth + hardMargin ||
        ballPos.y < tableY - hardMargin || ballPos.y > tableY + tableHeight + hardMargin) {
      // Ball has completely escaped - pocket it immediately
      ballsToPocket.push(ball);
      return;
    }
    
    // Check if ball is beyond safe zone but not in a pocket - teleport back
    if ((ballPos.x < tableX - safeMargin || ballPos.x > tableX + tableWidth + safeMargin ||
         ballPos.y < tableY - safeMargin || ballPos.y > tableY + tableHeight + safeMargin) &&
        !isNearAnyPocket(ballPos, pockets, pocketRadius * 2)) {
      // Teleport ball back to safe zone and stop it
      const clampedX = Math.max(tableX + BALL_RADIUS * 2, Math.min(tableX + tableWidth - BALL_RADIUS * 2, ballPos.x));
      const clampedY = Math.max(tableY + BALL_RADIUS * 2, Math.min(tableY + tableHeight - BALL_RADIUS * 2, ballPos.y));
      Body.setPosition(ball.body, { x: clampedX, y: clampedY });
      Body.setVelocity(ball.body, { x: 0, y: 0 });
      Body.setAngularVelocity(ball.body, 0);
      return;
    }
    
    // Check each pocket with aggressive capture
    pockets.forEach(pocket => {
      const dx = ballPos.x - pocket.x;
      const dy = ballPos.y - pocket.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Progressive capture threshold based on speed
      // Faster balls need to be captured earlier to prevent escape
      const baseThreshold = pocketRadius + BALL_RADIUS * 1.2;
      const speedFactor = Math.min(speed / 10, 1.0); // Scale with speed up to 10 units/frame
      const captureThreshold = baseThreshold * (1 + speedFactor * 0.5);
      
      if (dist < captureThreshold) {
        // Additional check: if moving toward pocket, capture immediately
        if (speed > 0.5) {
          const dotProduct = (ballVel.x * dx + ballVel.y * dy);
          // If moving toward pocket (negative dot product), capture more aggressively
          if (dotProduct < 0 && dist < captureThreshold * 1.3) {
            ballsToPocket.push(ball);
            return;
          }
        }
        
        // Standard capture for slow-moving or close balls
        if (dist < baseThreshold) {
          ballsToPocket.push(ball);
          return;
        }
      }
      
      // Heuristic: if ball is in the "pocket zone" (gap area), capture it
      // This prevents balls from escaping through the cushion gaps
      const isInPocketZone = isInPocketGapArea(ballPos, pocket, tableX, tableY, tableWidth, tableHeight);
      if (isInPocketZone && dist < pocketRadius * 2.5) {
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

// Helper function to check if ball is near any pocket
function isNearAnyPocket(ballPos, pockets, radius) {
  return pockets.some(pocket => {
    const dx = ballPos.x - pocket.x;
    const dy = ballPos.y - pocket.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < radius;
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