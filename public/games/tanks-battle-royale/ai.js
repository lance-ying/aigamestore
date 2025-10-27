// ai.js - AI controller for automated testing

import { gameState, GAME_PHASES } from './globals.js';

export class AIController {
  constructor(mode) {
    this.mode = mode;
    this.actionCooldown = 0;
  }

  getActions(p) {
    this.actionCooldown = Math.max(0, this.actionCooldown - 1);

    if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
      return {
        up: false,
        down: false,
        left: false,
        right: false,
        shoot: false,
        sprint: false,
        reload: false
      };
    }

    const player = gameState.player;
    if (!player) {
      return this.getDefaultActions();
    }

    if (this.mode === "TEST_1") {
      return this.basicTestMode(p, player);
    } else if (this.mode === "TEST_2") {
      return this.winTestMode(p, player);
    }

    return this.getDefaultActions();
  }

  basicTestMode(p, player) {
    // Basic testing: move around and shoot randomly
    const actions = {
      up: p.frameCount % 120 < 60,
      down: false,
      left: p.frameCount % 80 < 40,
      right: p.frameCount % 80 >= 40,
      shoot: p.frameCount % 30 === 0,
      sprint: false,
      reload: player.ammo < 5
    };
    return actions;
  }

  winTestMode(p, player) {
    // Aggressive mode: target nearest enemy
    const nearestEnemy = this.findNearestEnemy(player);
    
    const actions = {
      up: true,
      down: false,
      left: false,
      right: false,
      shoot: false,
      sprint: true,
      reload: player.ammo < 5
    };

    if (nearestEnemy) {
      const dx = nearestEnemy.x - player.x;
      const dy = nearestEnemy.y - player.y;
      const targetAngle = p.atan2(dy, dx);
      let angleDiff = targetAngle - player.angle;
      
      while (angleDiff > p.PI) angleDiff -= p.TWO_PI;
      while (angleDiff < -p.PI) angleDiff += p.TWO_PI;

      if (Math.abs(angleDiff) > 0.1) {
        actions.left = angleDiff < 0;
        actions.right = angleDiff > 0;
      }

      const dist = p.dist(player.x, player.y, nearestEnemy.x, nearestEnemy.y);
      if (dist < 200 && Math.abs(angleDiff) < 0.3) {
        actions.shoot = true;
        actions.up = false;
      }
    }

    // Collect pickups
    const nearestPickup = this.findNearestPickup(player);
    if (nearestPickup && (!nearestEnemy || p.dist(player.x, player.y, nearestPickup.x, nearestPickup.y) < 100)) {
      const dx = nearestPickup.x - player.x;
      const dy = nearestPickup.y - player.y;
      const targetAngle = p.atan2(dy, dx);
      let angleDiff = targetAngle - player.angle;
      
      while (angleDiff > p.PI) angleDiff -= p.TWO_PI;
      while (angleDiff < -p.PI) angleDiff += p.TWO_PI;

      if (Math.abs(angleDiff) > 0.1) {
        actions.left = angleDiff < 0;
        actions.right = angleDiff > 0;
      }
      actions.up = true;
    }

    return actions;
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

  getDefaultActions() {
    return {
      up: false,
      down: false,
      left: false,
      right: false,
      shoot: false,
      sprint: false,
      reload: false
    };
  }
}