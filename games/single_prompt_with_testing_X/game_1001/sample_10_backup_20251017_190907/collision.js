import { gameState } from './globals.js';
import { Projectile, Particle } from './entities.js';

export function checkCollisions(p) {
  const player = gameState.player;
  if (!player || !player.active) return;

  // Player sword hits enemies
  const swordHitbox = player.getSwordHitbox();
  if (swordHitbox) {
    for (const entity of gameState.entities) {
      if (entity.constructor.name === 'Enemy' || entity.constructor.name === 'Boss') {
        if (entity.active && p.collideRectRect(
          swordHitbox.x - swordHitbox.w / 2, swordHitbox.y - swordHitbox.h / 2, swordHitbox.w, swordHitbox.h,
          entity.x, entity.y, entity.w, entity.h
        )) {
          entity.takeDamage(player.spinAttacking ? 2 : 1);
          createHitParticles(p, entity.x + entity.w / 2, entity.y + entity.h / 2);
        }
      }
    }
  }

  // Projectile collisions
  for (const proj of gameState.projectiles) {
    if (!proj.active) continue;

    if (proj.friendly) {
      // Player projectiles hit enemies
      for (const entity of gameState.entities) {
        if ((entity.constructor.name === 'Enemy' || entity.constructor.name === 'Boss') && entity.active) {
          if (p.collideCircleCircle(proj.x, proj.y, proj.w, entity.x + entity.w / 2, entity.y + entity.h / 2, entity.w)) {
            entity.takeDamage(1);
            proj.active = false;
            createHitParticles(p, proj.x, proj.y);
          }
        }
      }
    } else {
      // Enemy projectiles hit player
      if (p.collideCircleCircle(proj.x, proj.y, proj.w, player.x + player.w / 2, player.y + player.h / 2, player.w)) {
        player.takeDamage(1);
        proj.active = false;
        createHitParticles(p, proj.x, proj.y);
      }
    }

    // Projectiles hit walls
    for (const entity of gameState.entities) {
      if (entity.constructor.name === 'Obstacle' && (entity.type === 'WALL' || entity.type === 'BLOCK')) {
        if (p.collideCircleCircle(proj.x, proj.y, proj.w, entity.x + entity.w / 2, entity.y + entity.h / 2, entity.w)) {
          proj.active = false;
          createHitParticles(p, proj.x, proj.y);
        }
      }
    }
  }

  // Enemy collision with player
  for (const entity of gameState.entities) {
    if ((entity.constructor.name === 'Enemy' || entity.constructor.name === 'Boss') && entity.active) {
      if (p.collideRectRect(player.x, player.y, player.w, player.h, entity.x, entity.y, entity.w, entity.h)) {
        player.takeDamage(entity.damage);
        // Push player back
        const dx = player.x - entity.x;
        const dy = player.y - entity.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          player.x += (dx / dist) * 10;
          player.y += (dy / dist) * 10;
        }
      }
    }
  }

  // Item pickup
  for (const entity of gameState.entities) {
    if (entity.constructor.name === 'ItemPickup' && entity.active) {
      if (p.collideRectRect(player.x, player.y, player.w, player.h, entity.x, entity.y, entity.w, entity.h)) {
        collectItem(p, entity.itemType);
        entity.active = false;
        createCollectParticles(p, entity.x + entity.w / 2, entity.y + entity.h / 2);
      }
    }
  }

  // Player collision with obstacles
  for (const entity of gameState.entities) {
    if (entity.constructor.name === 'Obstacle') {
      if (entity.type === 'WALL' || entity.type === 'BLOCK') {
        if (p.collideRectRect(player.x, player.y, player.w, player.h, entity.x, entity.y, entity.w, entity.h)) {
          // Push player out
          const dx = player.x + player.w / 2 - (entity.x + entity.w / 2);
          const dy = player.y + player.h / 2 - (entity.y + entity.h / 2);
          
          if (Math.abs(dx) > Math.abs(dy)) {
            player.x += dx > 0 ? 2 : -2;
          } else {
            player.y += dy > 0 ? 2 : -2;
          }
        }
      } else if (entity.type === 'BREAKABLE' && !entity.broken) {
        if (player.isDashing && p.collideRectRect(player.x, player.y, player.w, player.h, entity.x, entity.y, entity.w, entity.h)) {
          entity.broken = true;
          entity.active = false;
          createBreakParticles(p, entity.x + entity.w / 2, entity.y + entity.h / 2);
        }
      }
    }
  }

  // Check if room is cleared
  const roomKey = `${gameState.currentRoom.x},${gameState.currentRoom.y}`;
  const room = gameState.roomData[roomKey];
  if (room && !room.cleared) {
    const enemiesAlive = gameState.entities.filter(e => 
      (e.constructor.name === 'Enemy' || e.constructor.name === 'Boss') && e.active
    ).length;
    
    if (enemiesAlive === 0 && room.enemies.length > 0) {
      room.cleared = true;
      gameState.score += 50;
    }
  }
}

function collectItem(p, itemType) {
  switch(itemType) {
    case 'SMALL_KEY':
      gameState.smallKeys++;
      break;
    case 'BIG_KEY':
      gameState.hasBigKey = true;
      gameState.dungeonTreasures++;
      break;
    default:
      if (!gameState.inventory.includes(itemType)) {
        gameState.inventory.push(itemType);
        if (!gameState.equippedItem) {
          gameState.equippedItem = itemType;
        }
      }
  }
  gameState.score += 20;
}

function createHitParticles(p, x, y) {
  for (let i = 0; i < 5; i++) {
    const angle = p.random(0, p.TWO_PI);
    const speed = p.random(1, 3);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const particle = new Particle(p, x, y, vx, vy, [255, 200, 0], 20);
    gameState.particles.push(particle);
  }
}

function createCollectParticles(p, x, y) {
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * p.TWO_PI;
    const vx = Math.cos(angle) * 2;
    const vy = Math.sin(angle) * 2;
    const particle = new Particle(p, x, y, vx, vy, [100, 255, 100], 30);
    gameState.particles.push(particle);
  }
}

function createBreakParticles(p, x, y) {
  for (let i = 0; i < 10; i++) {
    const angle = p.random(0, p.TWO_PI);
    const speed = p.random(2, 5);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const particle = new Particle(p, x, y, vx, vy, [160, 140, 100], 25);
    gameState.particles.push(particle);
  }
}