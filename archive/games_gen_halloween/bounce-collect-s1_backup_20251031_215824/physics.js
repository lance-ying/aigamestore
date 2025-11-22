// physics.js - Physics and collision handling
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events, World, Bodies, Body } = Matter;

import { gameState } from './globals.js';
import { Ball } from './entities.js';

export function setupPhysics(p) {
  Events.on(gameState.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Ball hitting peg
      if ((bodyA.label === 'ball' && bodyB.label === 'peg') ||
          (bodyA.label === 'peg' && bodyB.label === 'ball')) {
        const peg = gameState.pegs.find(p => 
          p.body === bodyA || p.body === bodyB
        );
        if (peg) {
          peg.hit();
        }
      }
      
      // Ball passing through multiplier gate
      if ((bodyA.label === 'ball' && bodyB.label === 'multiplier') ||
          (bodyA.label === 'multiplier' && bodyB.label === 'ball')) {
        handleMultiplierCollision(p, bodyA, bodyB);
      }
    });
  });
}

function handleMultiplierCollision(p, bodyA, bodyB) {
  const ballBody = bodyA.label === 'ball' ? bodyA : bodyB;
  const multiplierBody = bodyA.label === 'multiplier' ? bodyA : bodyB;
  
  const ball = gameState.balls.find(b => b.body === ballBody);
  const gate = gameState.multiplierGates.find(g => g.body === multiplierBody);
  
  if (ball && gate && !ball.multiplied && !ball.landed) {
    ball.multiplied = true;
    gate.activate();
    
    // Create additional balls (multiplier value - 1, since original ball continues)
    for (let i = 0; i < gate.value - 1; i++) {
      const newBall = new Ball(
        p,
        ball.body.position.x + (Math.random() - 0.5) * 10,
        ball.body.position.y + 5
      );
      
      // Give new balls slight random velocity
      const angle = (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 2;
      Body.setVelocity(newBall.body, {
        x: Math.sin(angle) * speed,
        y: Math.cos(angle) * speed
      });
      
      gameState.balls.push(newBall);
      gameState.entities.push(newBall);
      gameState.ballsInPlay++;
    }
  }
}

export function createWalls() {
  const wallThickness = 20;
  
  const leftWall = Bodies.rectangle(
    -wallThickness / 2,
    200,
    wallThickness,
    400,
    { label: 'wall', isStatic: true, restitution: 0.5 }
  );
  
  const rightWall = Bodies.rectangle(
    600 + wallThickness / 2,
    200,
    wallThickness,
    400,
    { label: 'wall', isStatic: true, restitution: 0.5 }
  );
  
  World.add(gameState.world, [leftWall, rightWall]);
}