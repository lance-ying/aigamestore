// physics.js - Matter.js physics and collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState, TRICK_TYPES, TRICK_SCORES } from './globals.js';

export function setupCollisionHandling(engine, p) {
  Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Check for skateboard collisions
      if (bodyA.label === 'skateboard' || bodyB.label === 'skateboard') {
        const skateboardBody = bodyA.label === 'skateboard' ? bodyA : bodyB;
        const otherBody = bodyA.label === 'skateboard' ? bodyB : bodyA;
        
        // Landing detection
        if (otherBody.label === 'ground' || otherBody.label === 'obstacle') {
          const velocity = Math.sqrt(
            Math.pow(skateboardBody.velocity.x, 2) +
            Math.pow(skateboardBody.velocity.y, 2)
          );
          
          // Hard landing - could fail trick
          if (velocity > 15 && gameState.player) {
            gameState.player.isManual = false;
          }
        }
        
        // Rail collision for grinding
        if (otherBody.label === 'rail') {
          if (gameState.player && !gameState.player.isGrounded) {
            gameState.player.isGrinding = true;
          }
        }
      }
    });
  });
  
  Events.on(engine, 'collisionEnd', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Check for skateboard leaving rail
      if ((bodyA.label === 'skateboard' && bodyB.label === 'rail') ||
          (bodyB.label === 'skateboard' && bodyA.label === 'rail')) {
        if (gameState.player) {
          gameState.player.isGrinding = false;
        }
      }
    });
  });
}

export function handleTrickScoring(trickType, p) {
  let points = TRICK_SCORES[trickType] || 0;
  
  // Apply combo multiplier
  points *= gameState.combo;
  
  gameState.score += points;
  gameState.comboTimer = 120; // 2 seconds at 60fps
  
  // Log trick
  p.logs.game_info.push({
    data: {
      trick: trickType,
      points: points,
      combo: gameState.combo,
      score: gameState.score
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateComboSystem(p) {
  if (gameState.comboTimer > 0) {
    gameState.comboTimer--;
    
    if (gameState.comboTimer === 0) {
      // Reset combo
      if (gameState.combo > 1) {
        p.logs.game_info.push({
          data: {
            event: 'combo_ended',
            finalCombo: gameState.combo,
            score: gameState.score
          },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      gameState.combo = 1;
    }
  }
  
  // Increase combo when landing tricks
  if (gameState.player && gameState.player.isGrounded && gameState.comboTimer > 0) {
    if (gameState.currentTrick) {
      gameState.combo++;
      gameState.comboTimer = 120;
      gameState.currentTrick = null;
    }
  }
}