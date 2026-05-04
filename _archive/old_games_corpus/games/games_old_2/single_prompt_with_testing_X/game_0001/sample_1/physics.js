import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState } from './globals.js';

export function setupPhysics(p) {
  // Collision detection
  Events.on(gameState.engine, 'collisionStart', (event) => {
    handleCollisions(event.pairs, p);
  });

  Events.on(gameState.engine, 'collisionEnd', (event) => {
    handleCollisionEnd(event.pairs);
  });
}

function handleCollisions(pairs, p) {
  pairs.forEach(pair => {
    const { bodyA, bodyB } = pair;
    
    // Check for ground contact
    if ((bodyA.label === 'player' && bodyB.label === 'platform') ||
        (bodyB.label === 'player' && bodyA.label === 'platform')) {
      gameState.groundContactCount++;
    }
    
    // Player vs Enemy collision
    if ((bodyA.label === 'player' && bodyB.label === 'enemy') ||
        (bodyB.label === 'player' && bodyA.label === 'enemy')) {
      
      const playerBody = bodyA.label === 'player' ? bodyA : bodyB;
      const enemyBody = bodyA.label === 'enemy' ? bodyA : bodyB;
      
      // Find the enemy entity
      const enemy = gameState.enemies.find(e => e.body === enemyBody);
      if (enemy && !enemy.defeated) {
        // Check if player is jumping on enemy (player is above enemy)
        if (playerBody.position.y < enemyBody.position.y - 5 && playerBody.velocity.y > 0) {
          // Player jumped on enemy
          enemy.defeat();
          p.logs.game_info.push({
            data: { action: "enemy_defeated", score: gameState.score },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        } else {
          // Enemy hit player from side
          if (gameState.player) {
            gameState.player.takeDamage();
            p.logs.game_info.push({
              data: { action: "player_damaged", health: gameState.playerHealth },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
          }
        }
      }
    }
    
    // Player vs Coin collision
    if ((bodyA.label === 'player' && bodyB.label === 'coin') ||
        (bodyB.label === 'player' && bodyA.label === 'coin')) {
      
      const coinBody = bodyA.label === 'coin' ? bodyA : bodyB;
      const coin = gameState.coins.find(c => c.body === coinBody);
      if (coin && !coin.collected) {
        coin.collect();
        p.logs.game_info.push({
          data: { action: "coin_collected", score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Player vs Cloverleaf collision
    if ((bodyA.label === 'player' && bodyB.label === 'cloverleaf') ||
        (bodyB.label === 'player' && bodyA.label === 'cloverleaf')) {
      
      const cloverBody = bodyA.label === 'cloverleaf' ? bodyA : bodyB;
      const clover = gameState.cloverleaves.find(c => c.body === cloverBody);
      if (clover && !clover.collected) {
        clover.collect();
        p.logs.game_info.push({
          data: { action: "clover_collected", health: gameState.playerHealth },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Player vs Flag collision
    if ((bodyA.label === 'player' && bodyB.label === 'flag') ||
        (bodyB.label === 'player' && bodyA.label === 'flag')) {
      
      if (gameState.flag && !gameState.flag.reached) {
        gameState.flag.reach();
      }
    }
  });
}

function handleCollisionEnd(pairs) {
  pairs.forEach(pair => {
    const { bodyA, bodyB } = pair;
    
    // Check for ground contact end
    if ((bodyA.label === 'player' && bodyB.label === 'platform') ||
        (bodyB.label === 'player' && bodyA.label === 'platform')) {
      gameState.groundContactCount = Math.max(0, gameState.groundContactCount - 1);
    }
  });
}