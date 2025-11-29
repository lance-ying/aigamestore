// ai.js - AI controller for automated testing

import { gameState, GAME_PHASES, WEAPON_TYPES } from './globals.js';
import { Projectile } from './entities.js';

export class AIController {
  constructor(mode) {
    this.mode = mode;
    this.actionCooldown = 0;
    this.moveCooldown = 0;
    this.turnCooldown = 0;
    this.shootCooldown = 0;
  }

  executeActions(p, player) {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING || !player) {
      return;
    }

    // Decrement cooldowns
    this.moveCooldown = Math.max(0, this.moveCooldown - 1);
    this.turnCooldown = Math.max(0, this.turnCooldown - 1);
    this.shootCooldown = Math.max(0, this.shootCooldown - 1);

    if (this.mode === "TEST_1") {
      this.basicTestMode(p, player);
    } else if (this.mode === "TEST_2") {
      this.winTestMode(p, player);
    }
  }

  // Aim assist helper function for AI
  getAimAssistAngle(p, playerX, playerY, playerAngle, baseAngle) {
    const AIM_ASSIST_RANGE = 200;
    const AIM_ASSIST_CONE = 0.44;
    const AIM_ASSIST_STRENGTH = 0.3;
    
    let closestEnemy = null;
    let closestDist = Infinity;
    
    for (const enemy of gameState.enemies) {
      const dx = enemy.x - playerX;
      const dy = enemy.y - playerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < AIM_ASSIST_RANGE && dist < closestDist) {
        const angleToEnemy = p.atan2(dy, dx);
        let angleDiff = angleToEnemy - baseAngle;
        
        while (angleDiff > p.PI) angleDiff -= p.TWO_PI;
        while (angleDiff < -p.PI) angleDiff += p.TWO_PI;
        
        if (Math.abs(angleDiff) < AIM_ASSIST_CONE) {
          closestEnemy = enemy;
          closestDist = dist;
        }
      }
    }
    
    if (closestEnemy) {
      const dx = closestEnemy.x - playerX;
      const dy = closestEnemy.y - playerY;
      const targetAngle = p.atan2(dy, dx);
      
      let angleDiff = targetAngle - baseAngle;
      while (angleDiff > p.PI) angleDiff -= p.TWO_PI;
      while (angleDiff < -p.PI) angleDiff += p.TWO_PI;
      
      return baseAngle + angleDiff * AIM_ASSIST_STRENGTH;
    }
    
    return baseAngle;
  }

  basicTestMode(p, player) {
    // Basic testing: move around and shoot randomly
    
    // Move forward periodically
    if (this.moveCooldown === 0 && p.frameCount % 60 < 30) {
      player.moveForward(20);
      this.moveCooldown = 8;
    }

    // Turn periodically
    if (this.turnCooldown === 0) {
      if (p.frameCount % 80 < 40) {
        player.turnLeft(0.3);
      } else {
        player.turnRight(0.3);
      }
      this.turnCooldown = 12;
    }

    // Shoot periodically
    if (this.shootCooldown === 0 && p.frameCount % 30 === 0) {
      if (player.shoot()) {
        const weapon = WEAPON_TYPES[player.currentWeapon];
        for (let i = 0; i < weapon.projectileCount; i++) {
          const spread = weapon.spread * (p.random() - 0.5);
          const baseAngle = player.angle + spread;
          const assistedAngle = this.getAimAssistAngle(p, player.x, player.y, player.angle, baseAngle);
          
          const proj = new Projectile(
            p,
            player.x + p.cos(player.angle) * 15,
            player.y + p.sin(player.angle) * 15,
            assistedAngle,
            true,
            weapon.color
          );
          gameState.projectiles.push(proj);
        }
        this.shootCooldown = 15;
      }
    }

    // Reload if low on ammo
    if (player.ammo < 5) {
      player.reload();
    }
  }

  winTestMode(p, player) {
    // Aggressive mode: target nearest enemy
    const nearestEnemy = this.findNearestEnemy(player);
    
    if (nearestEnemy) {
      const dx = nearestEnemy.x - player.x;
      const dy = nearestEnemy.y - player.y;
      const targetAngle = p.atan2(dy, dx);
      let angleDiff = targetAngle - player.angle;
      
      while (angleDiff > p.PI) angleDiff -= p.TWO_PI;
      while (angleDiff < -p.PI) angleDiff += p.TWO_PI;

      // Turn towards enemy
      if (this.turnCooldown === 0 && Math.abs(angleDiff) > 0.1) {
        if (angleDiff < 0) {
          player.turnLeft(0.3);
        } else {
          player.turnRight(0.3);
        }
        this.turnCooldown = 6;
      }

      const dist = p.dist(player.x, player.y, nearestEnemy.x, nearestEnemy.y);
      
      // Shoot if aimed correctly
      if (this.shootCooldown === 0 && dist < 200 && Math.abs(angleDiff) < 0.3) {
        if (player.shoot()) {
          const weapon = WEAPON_TYPES[player.currentWeapon];
          for (let i = 0; i < weapon.projectileCount; i++) {
            const spread = weapon.spread * (p.random() - 0.5);
            const baseAngle = player.angle + spread;
            const assistedAngle = this.getAimAssistAngle(p, player.x, player.y, player.angle, baseAngle);
            
            const proj = new Projectile(
              p,
              player.x + p.cos(player.angle) * 15,
              player.y + p.sin(player.angle) * 15,
              assistedAngle,
              true,
              weapon.color
            );
            gameState.projectiles.push(proj);
          }
          this.shootCooldown = 15;
        }
      } else if (this.moveCooldown === 0 && dist > 150) {
        // Move forward if not too close
        player.moveForward(25);
        this.moveCooldown = 8;
      }
    }

    // Collect pickups if no enemy nearby or very close
    const nearestPickup = this.findNearestPickup(player);
    if (nearestPickup && (!nearestEnemy || p.dist(player.x, player.y, nearestPickup.x, nearestPickup.y) < 100)) {
      const dx = nearestPickup.x - player.x;
      const dy = nearestPickup.y - player.y;
      const targetAngle = p.atan2(dy, dx);
      let angleDiff = targetAngle - player.angle;
      
      while (angleDiff > p.PI) angleDiff -= p.TWO_PI;
      while (angleDiff < -p.PI) angleDiff += p.TWO_PI;

      if (this.turnCooldown === 0 && Math.abs(angleDiff) > 0.1) {
        if (angleDiff < 0) {
          player.turnLeft(0.3);
        } else {
          player.turnRight(0.3);
        }
        this.turnCooldown = 6;
      }
      
      if (this.moveCooldown === 0) {
        player.moveForward(25);
        this.moveCooldown = 8;
      }
    }

    // Reload if low on ammo
    if (player.ammo < 5) {
      player.reload();
    }
  }

  findNearestEnemy(player) {
    let nearest = null;
    let minDist = Infinity;
    
    for (const enemy of gameState.enemies) {
      const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    }
    
    return nearest;
  }

  findNearestPickup(player) {
    let nearest = null;
    let minDist = Infinity;
    
    for (const pickup of gameState.pickups) {
      const dist = Math.hypot(pickup.x - player.x, pickup.y - player.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = pickup;
      }
    }
    
    return nearest;
  }
}