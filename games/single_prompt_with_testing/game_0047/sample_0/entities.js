// entities.js - Game entity classes

import {
  PLAYER_HEIGHT, PLAYER_RADIUS, PLAYER_MOVE_SPEED, PLAYER_SPRINT_SPEED,
  PLAYER_TURN_SPEED, PLAYER_INTERACT_RANGE, DECK_MIN_X, DECK_MAX_X,
  DECK_MIN_Z, DECK_MAX_Z, SPIRIT_RADIUS, SPIRIT_MOVE_SPEED,
  SPIRIT_CHASE_SPEED, SPIRIT_VISION_RANGE, SPIRIT_VISION_ANGLE,
  SPIRIT_CATCH_DISTANCE, PHASE_PLAYING
} from './globals.js';

export class Player {
  constructor(x, z) {
    this.x = x;
    this.z = z;
    this.y = PLAYER_HEIGHT;
    this.angle = 0; // facing direction in radians
    this.radius = PLAYER_RADIUS;
    this.isSprinting = false;
  }

  move(forward, strafe, turn, dt) {
    // Turn
    this.angle += turn * PLAYER_TURN_SPEED * dt;

    // Calculate movement
    const speed = this.isSprinting ? PLAYER_SPRINT_SPEED : PLAYER_MOVE_SPEED;
    const dx = Math.sin(this.angle) * forward * speed * dt + Math.cos(this.angle) * strafe * speed * dt;
    const dz = Math.cos(this.angle) * forward * speed * dt - Math.sin(this.angle) * strafe * speed * dt;

    // Apply movement with collision
    const newX = this.x + dx;
    const newZ = this.z + dz;

    // Keep player on deck
    this.x = Math.max(DECK_MIN_X + this.radius, Math.min(DECK_MAX_X - this.radius, newX));
    this.z = Math.max(DECK_MIN_Z + this.radius, Math.min(DECK_MAX_Z - this.radius, newZ));
  }

  canInteractWith(entity) {
    const dist = Math.sqrt((this.x - entity.x) ** 2 + (this.z - entity.z) ** 2);
    return dist <= PLAYER_INTERACT_RANGE;
  }
}

export class Clue {
  constructor(x, z, id, description) {
    this.x = x;
    this.z = z;
    this.y = 0.5; // floating above deck
    this.id = id;
    this.description = description;
    this.discovered = false;
    this.radius = 0.3;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.pulsePhase += dt * 2;
  }
}

export class Spirit {
  constructor(x, z, patrolPoints) {
    this.x = x;
    this.z = z;
    this.y = 1.8; // floating height
    this.radius = SPIRIT_RADIUS;
    this.patrolPoints = patrolPoints;
    this.currentPatrolIndex = 0;
    this.isChasing = false;
    this.targetX = null;
    this.targetZ = null;
    this.angle = 0;
    this.detectionCooldown = 0;
  }

  update(dt, playerX, playerZ, gamePhase) {
    if (gamePhase !== PHASE_PLAYING) return;

    // Update cooldown
    if (this.detectionCooldown > 0) {
      this.detectionCooldown -= dt;
    }

    // Check if can see player
    const canSeePlayer = this.canSeeTarget(playerX, playerZ);
    
    if (canSeePlayer && this.detectionCooldown <= 0) {
      this.isChasing = true;
      this.targetX = playerX;
      this.targetZ = playerZ;
    } else if (this.isChasing) {
      // Check if still has line of sight
      if (!canSeePlayer) {
        // Lost sight, resume patrol after delay
        this.detectionCooldown = 2.0;
        this.isChasing = false;
      } else {
        this.targetX = playerX;
        this.targetZ = playerZ;
      }
    }

    // Move based on state
    if (this.isChasing && this.targetX !== null) {
      this.moveTowards(this.targetX, this.targetZ, SPIRIT_CHASE_SPEED * dt);
    } else {
      // Patrol
      const patrolTarget = this.patrolPoints[this.currentPatrolIndex];
      this.moveTowards(patrolTarget.x, patrolTarget.z, SPIRIT_MOVE_SPEED * dt);
      
      // Check if reached patrol point
      const dist = Math.sqrt((this.x - patrolTarget.x) ** 2 + (this.z - patrolTarget.z) ** 2);
      if (dist < 0.5) {
        this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
      }
    }
  }

  moveTowards(targetX, targetZ, distance) {
    const dx = targetX - this.x;
    const dz = targetZ - this.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist > 0.1) {
      this.x += (dx / dist) * Math.min(distance, dist);
      this.z += (dz / dist) * Math.min(distance, dist);
      this.angle = Math.atan2(dx, dz);
    }
  }

  canSeeTarget(targetX, targetZ) {
    // Check distance
    const dx = targetX - this.x;
    const dz = targetZ - this.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist > SPIRIT_VISION_RANGE) return false;

    // Check angle
    const angleToTarget = Math.atan2(dx, dz);
    let angleDiff = angleToTarget - this.angle;
    
    // Normalize angle difference
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    
    return Math.abs(angleDiff) < SPIRIT_VISION_ANGLE / 2;
  }

  hasReachedPlayer(playerX, playerZ) {
    const dist = Math.sqrt((this.x - playerX) ** 2 + (this.z - playerZ) ** 2);
    return dist < SPIRIT_CATCH_DISTANCE;
  }
}

export class ExitPortal {
  constructor(x, z) {
    this.x = x;
    this.z = z;
    this.y = 0;
    this.radius = 1.5;
    this.active = false;
    this.rotationPhase = 0;
  }

  activate() {
    this.active = true;
  }

  update(dt) {
    if (this.active) {
      this.rotationPhase += dt * 2;
    }
  }
}