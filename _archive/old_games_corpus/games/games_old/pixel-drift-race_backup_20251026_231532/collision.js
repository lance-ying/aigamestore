// collision.js - Collision detection and handling

import { gameState } from './globals.js';
import { 
  OBSTACLE_DAMAGE, RIVAL_DAMAGE, BOSS_DAMAGE, 
  POINTS_BOSS_DEFEAT 
} from './globals.js';
import { Particle } from './entities.js';

export function checkCollisions(p) {
  if (!gameState.player) return;

  const player = gameState.player;
  
  // Check collisions with rivals
  gameState.rivals.forEach(rival => {
    if (checkRectCollision(player, rival)) {
      player.takeDamage(RIVAL_DAMAGE);
      createCollisionEffect(p, player.x, player.y);
      // Remove rival on collision
      const index = gameState.rivals.indexOf(rival);
      if (index > -1) {
        gameState.rivals.splice(index, 1);
      }
    }
  });

  // Check collisions with obstacles
  gameState.obstacles.forEach(obstacle => {
    if (checkRectCollision(player, obstacle)) {
      player.takeDamage(OBSTACLE_DAMAGE);
      createCollisionEffect(p, player.x, player.y);
      // Remove obstacle on collision
      const index = gameState.obstacles.indexOf(obstacle);
      if (index > -1) {
        gameState.obstacles.splice(index, 1);
      }
    }
  });

  // Check collisions with boss
  if (gameState.boss) {
    if (checkRectCollision(player, gameState.boss)) {
      player.takeDamage(BOSS_DAMAGE);
      createCollisionEffect(p, player.x, player.y);
      
      // Damage boss if vulnerable
      if (gameState.boss.vulnerable) {
        gameState.boss.takeDamage(20);
        createCollisionEffect(p, gameState.boss.x, gameState.boss.y);
        
        if (gameState.boss.health <= 0) {
          gameState.score += POINTS_BOSS_DEFEAT;
          gameState.boss = null;
        }
      }
    }
  }

  // Check collisions with boss projectiles
  gameState.projectiles.forEach(projectile => {
    if (checkCircleRectCollision(projectile, player)) {
      player.takeDamage(15);
      createCollisionEffect(p, player.x, player.y);
      const index = gameState.projectiles.indexOf(projectile);
      if (index > -1) {
        gameState.projectiles.splice(index, 1);
      }
    }
  });
}

function checkRectCollision(obj1, obj2) {
  return obj1.x - obj1.width / 2 < obj2.x + obj2.width / 2 &&
         obj1.x + obj1.width / 2 > obj2.x - obj2.width / 2 &&
         obj1.y - obj1.height / 2 < obj2.y + obj2.height / 2 &&
         obj1.y + obj1.height / 2 > obj2.y - obj2.height / 2;
}

function checkCircleRectCollision(circle, rect) {
  const distX = Math.abs(circle.x - rect.x);
  const distY = Math.abs(circle.y - rect.y);

  if (distX > (rect.width / 2 + circle.width / 2)) return false;
  if (distY > (rect.height / 2 + circle.height / 2)) return false;

  if (distX <= (rect.width / 2)) return true;
  if (distY <= (rect.height / 2)) return true;

  const dx = distX - rect.width / 2;
  const dy = distY - rect.height / 2;
  return (dx * dx + dy * dy <= (circle.width / 2 * circle.width / 2));
}

function createCollisionEffect(p, x, y) {
  for (let i = 0; i < 10; i++) {
    gameState.particles.push(new Particle(p, x, y, 'spark'));
  }
}