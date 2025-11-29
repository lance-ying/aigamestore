// physics.js - Physics and collision handling
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events, Body, World } = Matter;

import { gameState, CONFIG } from './globals.js';
import { createExplosion } from './entities.js';

export function setupPhysics(p) {
  // Collision detection between player/force pod and enemies
  Events.on(gameState.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const { bodyA, bodyB } = pair;
      
      // Player collision with enemy
      if ((bodyA.label === 'player' && bodyB.label === 'enemy') ||
          (bodyB.label === 'player' && bodyA.label === 'enemy')) {
        const player = gameState.player;
        if (player) {
          player.takeDamage(20);
        }
      }

      // Force pod collision with enemy
      if ((bodyA.label === 'forcePod' && bodyB.label === 'enemy') ||
          (bodyB.label === 'forcePod' && bodyA.label === 'enemy')) {
        const enemyBody = bodyA.label === 'enemy' ? bodyA : bodyB;
        const enemy = gameState.enemies.find(e => e.body === enemyBody);
        if (enemy) {
          enemy.takeDamage(15);
        }
      }
    });
  });
}

export function updatePhysics(p) {
  // Update player bullets vs enemies
  gameState.bullets.forEach(bullet => {
    gameState.enemies.forEach(enemy => {
      if (!bullet.dead && !enemy.dead && bullet.checkCollision(enemy)) {
        enemy.takeDamage(bullet.damage);
        bullet.dead = true;
      }
    });
  });

  // Update enemy bullets vs player
  if (gameState.player) {
    gameState.enemyBullets.forEach(bullet => {
      if (!bullet.dead && bullet.checkCollision(gameState.player.body, 15)) {
        gameState.player.takeDamage(bullet.damage);
        bullet.dead = true;
        createExplosion(p, bullet.x, bullet.y, 10);
      }
    });

    // Force pod vs enemy bullets
    if (gameState.forcePod && gameState.forcePod.attached) {
      gameState.enemyBullets.forEach(bullet => {
        if (!bullet.dead && bullet.checkCollision(gameState.forcePod.body, 12)) {
          bullet.dead = true;
          createExplosion(p, bullet.x, bullet.y, 8);
        }
      });
    }
  }

  // Power-up collection
  if (gameState.player) {
    gameState.powerups.forEach(powerup => {
      if (!powerup.dead && powerup.checkCollision(gameState.player.body, 15)) {
        powerup.collect();
        createExplosion(p, powerup.x, powerup.y, 15);
      }
    });
  }

  // Clean up dead entities
  gameState.bullets = gameState.bullets.filter(b => !b.dead);
  gameState.enemyBullets = gameState.enemyBullets.filter(b => !b.dead);
  gameState.powerups = gameState.powerups.filter(p => !p.dead);
  gameState.particles = gameState.particles.filter(p => !p.dead);

  // Clean up dead enemies
  gameState.enemies.forEach(enemy => {
    if (enemy.dead) {
      World.remove(gameState.world, enemy.body);
    }
  });
  gameState.enemies = gameState.enemies.filter(e => !e.dead);
}