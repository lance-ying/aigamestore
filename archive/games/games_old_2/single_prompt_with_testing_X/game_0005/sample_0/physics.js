// physics.js - Matter.js collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState } from './globals.js';
import { Particle } from './entities.js';

export function setupCollisionHandling(p) {
  Events.on(gameState.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const { bodyA, bodyB } = pair;
      
      // Ball hitting peg
      if ((bodyA.label === 'ball' && bodyB.label === 'peg') ||
          (bodyA.label === 'peg' && bodyB.label === 'ball')) {
        const peg = bodyA.label === 'peg' ? 
          gameState.pegs.find(p => p.body === bodyA) :
          gameState.pegs.find(p => p.body === bodyB);
        
        if (peg) {
          peg.hit();
          
          // Particle effect
          for (let i = 0; i < 3; i++) {
            const angle = p.random(0, p.TWO_PI);
            const speed = p.random(1, 3);
            gameState.particles.push(new Particle(
              p,
              peg.x, peg.y,
              Math.cos(angle) * speed,
              Math.sin(angle) * speed,
              [255, 255, 200]
            ));
          }
        }
      }
      
      // Ball hitting multiplier
      if ((bodyA.label === 'ball' && bodyB.label === 'multiplier') ||
          (bodyA.label === 'multiplier' && bodyB.label === 'ball')) {
        const ballBody = bodyA.label === 'ball' ? bodyA : bodyB;
        const multBody = bodyA.label === 'multiplier' ? bodyA : bodyB;
        
        const ball = gameState.balls.find(b => b.body === ballBody);
        const multiplier = gameState.multipliers.find(m => m.body === multBody);
        
        if (ball && multiplier && ball.active) {
          // Check if this ball has already hit this multiplier
          const multKey = `${multiplier.x}_${multiplier.y}`;
          if (!ball.multiplierHit.has(multKey)) {
            ball.multiplierHit.add(multKey);
            handleMultiplierHit(p, ball, multiplier);
          }
        }
      }
    });
  });
}

function handleMultiplierHit(p, ball, multiplier) {
  multiplier.activate();
  
  if (multiplier.type.includes('x')) {
    // Score multiplier
    const points = 10 * multiplier.value;
    gameState.score += points;
    
    // Particle burst
    for (let i = 0; i < 15; i++) {
      const angle = p.random(0, p.TWO_PI);
      const speed = p.random(2, 6);
      gameState.particles.push(new Particle(
        p,
        multiplier.x, multiplier.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        multiplier.getColor()
      ));
    }
    
    // Log score update
    p.logs.game_info.push({
      data: { 
        event: 'multiplier_hit',
        type: multiplier.type,
        points: points,
        newScore: gameState.score
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    // +balls multiplier
    const points = multiplier.value;
    gameState.score += points;
    
    // Particle burst
    for (let i = 0; i < 20; i++) {
      const angle = p.random(0, p.TWO_PI);
      const speed = p.random(3, 8);
      gameState.particles.push(new Particle(
        p,
        multiplier.x, multiplier.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        [100, 255, 100]
      ));
    }
    
    // Log score update
    p.logs.game_info.push({
      data: { 
        event: 'bonus_hit',
        type: multiplier.type,
        points: points,
        newScore: gameState.score
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function createWalls(p) {
  const Matter = window.Matter;
  const { Bodies, World } = Matter;
  
  const walls = [];
  const thickness = 10;
  
  // Left wall
  walls.push(Bodies.rectangle(
    45,
    CANVAS_HEIGHT / 2,
    thickness,
    CANVAS_HEIGHT,
    { label: 'wall', isStatic: true, restitution: 0.5 }
  ));
  
  // Right wall
  walls.push(Bodies.rectangle(
    555,
    CANVAS_HEIGHT / 2,
    thickness,
    CANVAS_HEIGHT,
    { label: 'wall', isStatic: true, restitution: 0.5 }
  ));
  
  // Bottom wall
  walls.push(Bodies.rectangle(
    300,
    395,
    CANVAS_WIDTH,
    thickness,
    { label: 'wall', isStatic: true, restitution: 0.2 }
  ));
  
  // Top boundary (invisible, just prevents balls from going up)
  walls.push(Bodies.rectangle(
    300,
    75,
    CANVAS_WIDTH,
    thickness,
    { label: 'wall', isStatic: true, restitution: 0.3 }
  ));
  
  walls.forEach(wall => World.add(gameState.world, wall));
  gameState.walls = walls;
}