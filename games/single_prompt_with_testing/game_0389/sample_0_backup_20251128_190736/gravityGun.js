// gravityGun.js - Gravity gun mechanics
import { gameState, GRAVITY_GUN_RANGE, THROW_FORCE } from './globals.js';

export class GravityGun {
  constructor(p) {
    this.p = p;
    this.range = GRAVITY_GUN_RANGE;
    this.grabDistance = 60;
    this.pullSpeed = 0.3;
    this.pushSpeed = 0.5;
  }

  findTarget() {
    const p = this.p;
    const player = gameState.player;
    if (!player) return null;

    let closest = null;
    let closestDist = this.range;

    // Check movable objects
    for (let obj of gameState.movableObjects) {
      const dist = p.dist(player.x, player.y, obj.x, obj.y);
      if (dist < closestDist) {
        closest = obj;
        closestDist = dist;
      }
    }

    // Check enemies
    for (let enemy of gameState.enemies) {
      if (!enemy.active) continue;
      const dist = p.dist(player.x, player.y, enemy.x, enemy.y);
      if (dist < closestDist) {
        closest = enemy;
        closestDist = dist;
      }
    }

    return closest;
  }

  grab(target) {
    gameState.grabbedObject = target;
    gameState.gravityGunActive = true;
  }

  release(throwDirection = null) {
    const p = this.p;
    const player = gameState.player;
    
    if (gameState.grabbedObject && throwDirection) {
      const obj = gameState.grabbedObject;
      
      // Calculate throw direction
      const angle = p.atan2(throwDirection.y - player.y, throwDirection.x - player.x);
      
      if (obj.constructor.name === 'MovableObject') {
        obj.vx = p.cos(angle) * THROW_FORCE;
        obj.vy = p.sin(angle) * THROW_FORCE;
        obj.rotationSpeed = obj.vx * 0.2;
      } else if (obj.constructor.name === 'Enemy' && obj.active) {
        // Throwing an enemy
        obj.vx = p.cos(angle) * THROW_FORCE;
        obj.vy = p.sin(angle) * THROW_FORCE;
        obj.active = false;
        gameState.score += 50;
      }
    }
    
    gameState.grabbedObject = null;
    gameState.gravityGunActive = false;
  }

  updateGrabbedObject() {
    const p = this.p;
    const player = gameState.player;
    
    if (!gameState.grabbedObject || !player) return;

    const obj = gameState.grabbedObject;
    const targetDist = gameState.pullMode ? this.grabDistance : this.grabDistance * 1.5;
    
    // Calculate direction from player to object
    const angle = player.facingRight ? 0 : p.PI;
    const targetX = player.x + p.cos(angle) * targetDist;
    const targetY = player.y;

    // Move object towards target position
    const dx = targetX - obj.x;
    const dy = targetY - obj.y;
    
    if (obj.constructor.name === 'MovableObject') {
      obj.x += dx * 0.2;
      obj.y += dy * 0.2;
      obj.vx = dx * 0.15;
      obj.vy = dy * 0.15;
    } else if (obj.constructor.name === 'Enemy') {
      obj.x += dx * 0.2;
      obj.y += dy * 0.2;
      obj.vx = 0;
      obj.vy = 0;
    }
  }

  draw(cameraX) {
    const p = this.p;
    const player = gameState.player;
    if (!player) return;

    const screenX = player.x - cameraX;

    if (gameState.gravityGunActive && gameState.grabbedObject) {
      // Draw beam to grabbed object
      const obj = gameState.grabbedObject;
      const objScreenX = obj.x - cameraX;
      
      p.push();
      p.stroke(100, 200, 255, 150);
      p.strokeWeight(3);
      p.line(screenX, player.y, objScreenX, obj.y);
      
      // Draw particles along beam
      for (let i = 0; i < 1; i += 0.1) {
        const px = p.lerp(screenX, objScreenX, i);
        const py = p.lerp(player.y, obj.y, i);
        p.noStroke();
        p.fill(100, 200, 255, 100);
        p.circle(px, py, 3);
      }
      
      p.pop();
    } else {
      // Draw targeting reticle
      const target = this.findTarget();
      if (target) {
        const targetScreenX = target.x - cameraX;
        p.push();
        p.noFill();
        p.stroke(100, 200, 255, 150);
        p.strokeWeight(2);
        
        if (target.constructor.name === 'MovableObject') {
          p.circle(targetScreenX, target.y, target.radius * 2 + 10);
        } else if (target.constructor.name === 'Enemy') {
          p.rect(targetScreenX - target.width / 2 - 5, target.y - target.height / 2 - 5,
                 target.width + 10, target.height + 10);
        }
        
        p.pop();
      }
    }

    // Draw gun on player
    p.push();
    p.translate(screenX, player.y);
    const gunAngle = player.facingRight ? 0 : p.PI;
    p.rotate(gunAngle);
    
    p.stroke(80, 160, 220);
    p.strokeWeight(3);
    p.line(0, 0, 15, 0);
    
    // Gun tip
    p.fill(100, 200, 255);
    p.noStroke();
    p.circle(15, 0, 6);
    
    p.pop();
  }
}