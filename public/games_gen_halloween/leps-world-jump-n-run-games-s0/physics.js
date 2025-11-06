// physics.js - Matter.js collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events, Body } = Matter;

import { gameState } from './globals.js';

export function setupCollisionHandlers(engine, p) {
  Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;

    pairs.forEach(pair => {
      const { bodyA, bodyB } = pair;
      
      // Player-Coin collision
      if ((bodyA.label === 'player' && bodyB.label === 'coin') ||
          (bodyA.label === 'coin' && bodyB.label === 'player')) {
        const coin = gameState.coins.find(c => c.body === bodyA || c.body === bodyB);
        if (coin) {
          coin.collect();
        }
      }

      // Player-Cloverleaf collision
      if ((bodyA.label === 'player' && bodyB.label === 'cloverleaf') ||
          (bodyA.label === 'cloverleaf' && bodyB.label === 'player')) {
        const clover = gameState.cloverleaves.find(c => c.body === bodyA || c.body === bodyB);
        if (clover) {
          clover.collect();
        }
      }

      // Player-Enemy collision
      if ((bodyA.label === 'player' && bodyB.label === 'enemy') ||
          (bodyA.label === 'enemy' && bodyB.label === 'player')) {
        const playerBody = bodyA.label === 'player' ? bodyA : bodyB;
        const enemyBody = bodyA.label === 'enemy' ? bodyA : bodyB;
        
        const enemy = gameState.enemies.find(e => e.body === enemyBody);
        
        if (enemy && !enemy.defeated && gameState.player) {
          // Check if player is above enemy (stomping)
          const playerBottom = playerBody.position.y + 16;
          const enemyTop = enemyBody.position.y - 12;
          
          if (playerBottom < enemyTop + 10 && playerBody.velocity.y > 0) {
            // Player stomped enemy
            enemy.defeat();
            // Bounce player up slightly
            Body.setVelocity(playerBody, { 
              x: playerBody.velocity.x, 
              y: -6 
            });
          } else {
            // Enemy hit player from side
            gameState.player.takeDamage(1);
          }
        }
      }

      // Player-Flag collision
      if ((bodyA.label === 'player' && bodyB.label === 'flag') ||
          (bodyA.label === 'flag' && bodyB.label === 'player')) {
        if (gameState.flag) {
          gameState.flag.reach();
        }
      }
    });
  });
}