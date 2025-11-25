// spirit.js - Spirit enemy entity

import { gameState, SPIRIT_SIZE, SPIRIT_SPEED, SPIRIT_CHASE_SPEED,
         SPIRIT_DETECTION_RANGE, SPIRIT_FLASHLIGHT_STUN_TIME,
         FLASHLIGHT_RANGE, FLASHLIGHT_ANGLE } from './globals.js';
import { checkWallCollision } from './physics.js';

export class Spirit {
  constructor(x, y, patrolPoints) {
    this.x = x;
    this.y = y;
    this.size = SPIRIT_SIZE;
    this.patrolPoints = patrolPoints || [];
    this.currentPatrolIndex = 0;
    this.state = "PATROL"; // PATROL, CHASE, STUNNED
    this.speed = SPIRIT_SPEED;
    this.stunTimer = 0;
    this.opacity = 0;
    this.targetOpacity = 120;
    this.floatOffset = Math.random() * Math.PI * 2;
  }

  update(p) {
    // Update opacity (fade in/out effect)
    if (this.state === "STUNNED") {
      this.targetOpacity = 50;
    } else {
      this.targetOpacity = 120;
    }
    this.opacity += (this.targetOpacity - this.opacity) * 0.1;

    // Handle stun
    if (this.stunTimer > 0) {
      this.stunTimer--;
      if (this.stunTimer === 0) {
        this.state = "PATROL";
      }
      return;
    }

    // Check if player is in flashlight beam
    if (gameState.player && gameState.player.flashlightOn) {
      if (this.isInFlashlight(gameState.player)) {
        this.state = "STUNNED";
        this.stunTimer = SPIRIT_FLASHLIGHT_STUN_TIME;
        return;
      }
    }

    // Check detection range
    if (gameState.player) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < SPIRIT_DETECTION_RANGE) {
        this.state = "CHASE";
      } else if (this.state === "CHASE" && dist > SPIRIT_DETECTION_RANGE * 1.5) {
        this.state = "PATROL";
      }
    }

    // Move based on state
    if (this.state === "CHASE") {
      this.chasePlayer(p);
    } else if (this.state === "PATROL") {
      this.patrol(p);
    }
  }

  isInFlashlight(player) {
    const flashlight = player.getFlashlightInfo();
    if (!flashlight.active) return false;

    const dx = this.x - flashlight.x;
    const dy = this.y - flashlight.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > flashlight.range) return false;

    const angleToSpirit = Math.atan2(dy, dx);
    let angleDiff = angleToSpirit - flashlight.angle;
    
    // Normalize angle difference
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    return Math.abs(angleDiff) < flashlight.arcAngle / 2;
  }

  chasePlayer(p) {
    if (!gameState.player) return;

    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const vx = (dx / dist) * SPIRIT_CHASE_SPEED;
      const vy = (dy / dist) * SPIRIT_CHASE_SPEED;

      const newX = this.x + vx;
      const newY = this.y + vy;

      if (!checkWallCollision(newX, this.y, this.size)) {
        this.x = newX;
      }
      if (!checkWallCollision(this.x, newY, this.size)) {
        this.y = newY;
      }
    }
  }

  patrol(p) {
    if (this.patrolPoints.length === 0) return;

    const target = this.patrolPoints[this.currentPatrolIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
    } else {
      const vx = (dx / dist) * SPIRIT_SPEED;
      const vy = (dy / dist) * SPIRIT_SPEED;

      const newX = this.x + vx;
      const newY = this.y + vy;

      if (!checkWallCollision(newX, this.y, this.size)) {
        this.x = newX;
      }
      if (!checkWallCollision(this.x, newY, this.size)) {
        this.y = newY;
      }
    }
  }

  render(p, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    // Floating animation
    const floatY = Math.sin(p.frameCount * 0.05 + this.floatOffset) * 3;

    p.push();
    p.translate(screenX, screenY + floatY);

    // Ghostly aura
    for (let i = 3; i > 0; i--) {
      const alpha = this.opacity * (0.3 / i);
      p.fill(...(this.state === "STUNNED" ? [100, 100, 255, alpha] : [200, 50, 50, alpha]));
      p.noStroke();
      p.ellipse(0, 0, this.size * (1 + i * 0.3), this.size * (1 + i * 0.3));
    }

    // Main body
    p.fill(...(this.state === "STUNNED" ? [150, 150, 255, this.opacity] : [255, 100, 100, this.opacity]));
    p.noStroke();
    p.ellipse(0, 0, this.size, this.size);

    // Eyes
    if (this.state !== "STUNNED") {
      p.fill(255, 255, 200, this.opacity * 1.5);
      p.ellipse(-this.size * 0.2, -this.size * 0.1, 4, 6);
      p.ellipse(this.size * 0.2, -this.size * 0.1, 4, 6);
    }

    // Wispy trails
    const trailCount = 3;
    for (let i = 0; i < trailCount; i++) {
      const trailAngle = (p.frameCount * 0.03 + i * Math.PI * 2 / trailCount) + this.floatOffset;
      const trailDist = this.size * 0.6;
      const tx = Math.cos(trailAngle) * trailDist;
      const ty = Math.sin(trailAngle) * trailDist;
      
      p.fill(...(this.state === "STUNNED" ? [100, 100, 255, this.opacity * 0.4] : [200, 80, 80, this.opacity * 0.4]));
      p.ellipse(tx, ty, this.size * 0.3, this.size * 0.3);
    }

    p.pop();
  }

  checkCollisionWithPlayer(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (this.size + player.size) / 2;
  }
}