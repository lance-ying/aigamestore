// ai.js - AI opponent logic
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Body } = Matter;

import { gameState, BALL_COLORS, TABLE_X, TABLE_Y, TABLE_WIDTH, TABLE_HEIGHT } from './globals.js';

export function aiTakeShot(p) {
  // AI decision making based on level
  const skill = gameState.levelParams.aiSkill;
  
  // Find AI's target balls
  const aiBalls = getAITargetBalls();
  
  if (aiBalls.length === 0) return;
  
  // Pick a random target ball (simplified AI)
  const targetBall = aiBalls[Math.floor(p.random() * aiBalls.length)];
  
  // Calculate angle to hit the target ball
  const cueBallPos = gameState.cueBall.body.position;
  const targetPos = targetBall.body.position;
  
  const dx = targetPos.x - cueBallPos.x;
  const dy = targetPos.y - cueBallPos.y;
  let angle = Math.atan2(dy, dx);
  
  // Add error based on skill level (lower skill = more error)
  const errorRange = (1 - skill) * 0.5;
  angle += (p.random() - 0.5) * errorRange;
  
  gameState.aimAngle = angle;
  
  // Set power based on skill
  const basePower = 30 + p.random() * 40;
  gameState.shotPower = Math.min(basePower * (0.5 + skill), gameState.maxShotPower);
  
  // Simple spin (rare for lower skill)
  if (p.random() < skill * 0.3) {
    gameState.spinEffect = {
      x: (p.random() - 0.5) * 0.2,
      y: (p.random() - 0.5) * 0.2
    };
  } else {
    gameState.spinEffect = { x: 0, y: 0 };
  }
}

function getAITargetBalls() {
  const targetBalls = [];
  
  gameState.ballsOnTable.forEach(ball => {
    if (ball.pocketed || ball.number === 0) return;
    
    const ballType = BALL_COLORS[ball.number].type;
    
    if (gameState.aiBallsType === "open") {
      // Can hit any ball except 8-ball
      if (ball.number !== 8) {
        targetBalls.push(ball);
      }
    } else if (gameState.aiBallsType === "solids" && ballType === "solid") {
      targetBalls.push(ball);
    } else if (gameState.aiBallsType === "stripes" && ballType === "stripe") {
      targetBalls.push(ball);
    }
  });
  
  // If all assigned balls pocketed, target 8-ball
  if (targetBalls.length === 0 && gameState.aiBallsType !== "open") {
    const eightBall = gameState.ballsOnTable.find(b => b.number === 8 && !b.pocketed);
    if (eightBall) {
      targetBalls.push(eightBall);
    }
  }
  
  return targetBalls;
}