/**
 * Entity classes for player, monster, and other game objects
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, GAME_CONFIG, GAME_PHASE, logPlayerInfo, logGameEvent } from './globals.js';
import { isPositionValid } from './physics.js';

/**
 * Player class - the hunter
 */
export class Player {
  constructor(x, y, z) {
    // Create player mesh - humanoid hunter
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2d5f3f,
      roughness: 0.6,
      metalness: 0.2
    });
    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    // Create weapon (sword) - HORIZONTAL (PARALLEL TO FLOOR)
    const weaponGeometry = new THREE.BoxGeometry(0.2, 2.5, 0.3);
    const weaponMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.3
    });
    this.weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    // Rotate 90 degrees around Z axis to make it horizontal (parallel to floor)
    this.weapon.rotation.z = Math.PI / 2;
    // Position it to the side as if being held
    this.weapon.position.set(0.8, 0.3, 0);
    this.weapon.castShadow = true;
    this.mesh.add(this.weapon);
    
    // Physics properties
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.speed = GAME_CONFIG.PLAYER_SPEED;
    this.maxSpeed = GAME_CONFIG.PLAYER_MAX_SPEED;
    this.accelerationRate = GAME_CONFIG.PLAYER_ACCELERATION;
    this.isMoving = false;
    this.onGround = true;
    
    // Combat properties
    this.health = GAME_CONFIG.PLAYER_MAX_HEALTH;
    this.maxHealth = GAME_CONFIG.PLAYER_MAX_HEALTH;
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.attackAnimationTime = 0;
    this.isDodging = false;
    this.dodgeCooldown = 0;
    this.dodgeTime = 0;
    this.healCooldown = 0;
    
    // State
    this.rotation = 0;
    this.lastLogTime = 0;
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Update cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }
    if (this.dodgeCooldown > 0) {
      this.dodgeCooldown -= deltaTime;
    }
    if (this.healCooldown > 0) {
      this.healCooldown -= deltaTime;
    }
    if (this.dodgeTime > 0) {
      this.dodgeTime -= deltaTime;
      if (this.dodgeTime <= 0) {
        this.isDodging = false;
      }
    }
    
    // Update attack animation timer
    if (this.isAttacking) {
      this.attackAnimationTime += deltaTime;
      if (this.attackAnimationTime > 0.3) {
        this.isAttacking = false;
        this.attackAnimationTime = 0;
      }
    }
    
    // Apply acceleration to velocity
    this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
    
    // Cap velocity to max speed
    const currentSpeed = this.velocity.length();
    if (currentSpeed > this.maxSpeed) {
      this.velocity.normalize().multiplyScalar(this.maxSpeed);
    }
    
    // Apply velocity to position
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
    
    // Apply friction/deceleration
    this.velocity.multiplyScalar(0.88);
    
    // Reset acceleration for next frame
    this.acceleration.set(0, 0, 0);
    
    // Keep player on ground
    if (this.mesh.position.y < 1) {
      this.mesh.position.y = 1;
      this.velocity.y = 0;
      this.onGround = true;
    }
    
    // Constrain to world bounds
    const halfWorld = GAME_CONFIG.WORLD_SIZE / 2;
    this.mesh.position.x = Math.max(-halfWorld, Math.min(halfWorld, this.mesh.position.x));
    this.mesh.position.z = Math.max(-halfWorld, Math.min(halfWorld, this.mesh.position.z));
    
    // Update rotation to face movement direction
    if (this.velocity.length() > 0.01) {
      this.rotation = Math.atan2(this.velocity.x, this.velocity.z);
      this.mesh.rotation.y = this.rotation;
    }
    
    // Animate weapon during attack - DRAMATIC SWIPE ANIMATION (horizontal arc)
    if (this.isAttacking) {
      // Normalize attack animation time (0 to 1)
      const animProgress = this.attackAnimationTime / 0.3;
      
      // Create horizontal swipe arc motion
      const swipeAngle = Math.PI * 1.2 * (animProgress - 0.5); // Arc from right to left
      const swipeExtension = Math.sin(animProgress * Math.PI) * 1.0; // Extension during swipe
      
      // Keep rotation at 90 degrees (horizontal) and add swipe rotation
      this.weapon.rotation.z = Math.PI / 2;
      this.weapon.rotation.y = swipeAngle;
      
      // Move weapon during swipe
      this.weapon.position.set(
        0.8 + Math.sin(swipeAngle) * 0.8,
        0.3,
        -swipeExtension
      );
    } else {
      // Reset to default horizontal position
      this.weapon.rotation.z = Math.PI / 2;
      this.weapon.rotation.y = 0;
      this.weapon.position.set(0.8, 0.3, 0);
    }
    
    // Log player info periodically
    if (gameState.frameCount % 30 === 0) {
      logPlayerInfo(this);
    }
  }
  
  moveForward() {
    // Move forward relative to camera direction only
    const direction = new THREE.Vector3(
      Math.sin(gameState.cameraRotationOffset),
      0,
      Math.cos(gameState.cameraRotationOffset)
    );
    this.acceleration.add(direction.multiplyScalar(this.accelerationRate));
    this.isMoving = true;
  }
  
  moveBackward() {
    // Move backward relative to camera direction only
    const direction = new THREE.Vector3(
      -Math.sin(gameState.cameraRotationOffset),
      0,
      -Math.cos(gameState.cameraRotationOffset)
    );
    this.acceleration.add(direction.multiplyScalar(this.accelerationRate));
    this.isMoving = true;
  }
  
  strafeLeft() {
    // Strafe left relative to camera direction only
    const direction = new THREE.Vector3(
      -Math.cos(gameState.cameraRotationOffset),
      0,
      Math.sin(gameState.cameraRotationOffset)
    );
    this.acceleration.add(direction.multiplyScalar(this.accelerationRate));
    this.isMoving = true;
  }
  
  strafeRight() {
    // Strafe right relative to camera direction only
    const direction = new THREE.Vector3(
      Math.cos(gameState.cameraRotationOffset),
      0,
      -Math.sin(gameState.cameraRotationOffset)
    );
    this.acceleration.add(direction.multiplyScalar(this.accelerationRate));
    this.isMoving = true;
  }
  
  attack() {
    if (this.attackCooldown <= 0 && !this.isDodging) {
      this.isAttacking = true;
      this.attackAnimationTime = 0;
      this.attackCooldown = GAME_CONFIG.PLAYER_ATTACK_COOLDOWN;
      
      // Check if monster is in range - LARGER ATTACK HITBOX
      if (gameState.monster && gameState.monsterRevealed) {
        const distance = this.mesh.position.distanceTo(gameState.monster.mesh.position);
        if (distance < 5.0) {
          gameState.monster.takeDamage(GAME_CONFIG.PLAYER_ATTACK_DAMAGE);
        }
      }
    }
  }
  
  dodge() {
    if (this.dodgeCooldown <= 0) {
      this.isDodging = true;
      this.dodgeTime = GAME_CONFIG.PLAYER_DODGE_DURATION;
      this.dodgeCooldown = GAME_CONFIG.PLAYER_DODGE_COOLDOWN;
      
      // Dodge in the direction of current movement - LONGER DISTANCE
      if (this.velocity.length() > 0.01) {
        // Use velocity direction
        const direction = this.velocity.clone().normalize();
        this.velocity.add(direction.multiplyScalar(this.speed * GAME_CONFIG.PLAYER_DODGE_SPEED_MULTIPLIER));
      } else {
        // If not moving, dodge forward relative to facing
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);
        this.velocity.add(direction.multiplyScalar(this.speed * GAME_CONFIG.PLAYER_DODGE_SPEED_MULTIPLIER));
      }
    }
  }
  
  heal() {
    if (this.healCooldown <= 0 && this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + GAME_CONFIG.PLAYER_HEAL_AMOUNT);
      this.healCooldown = GAME_CONFIG.PLAYER_HEAL_COOLDOWN;
      
      // Visual feedback - make player glow briefly
      this.mesh.material.emissive = new THREE.Color(0x00ff00);
      this.mesh.material.emissiveIntensity = 0.5;
      setTimeout(() => {
        this.mesh.material.emissive = new THREE.Color(0x000000);
        this.mesh.material.emissiveIntensity = 0;
      }, 500);
    }
  }
  
  takeDamage(amount) {
    if (this.isDodging) return; // Invincible during dodge
    
    this.health = Math.max(0, this.health - amount);
    
    // Visual feedback - flash red
    this.mesh.material.emissive = new THREE.Color(0xff0000);
    this.mesh.material.emissiveIntensity = 0.7;
    setTimeout(() => {
      this.mesh.material.emissive = new THREE.Color(0x000000);
      this.mesh.material.emissiveIntensity = 0;
    }, 200);
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    gameState.gamePhase = GAME_PHASE.GAME_OVER_LOSE;
  }
}

/**
 * Monster class - the target to hunt
 */
export class Monster {
  constructor(x, y, z) {
    // Create monster body - large threatening creature
    const bodyGeometry = new THREE.SphereGeometry(1.2, 16, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8b0000,
      roughness: 0.7,
      metalness: 0.1
    });
    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    // Create spikes
    this.spikes = [];
    for (let i = 0; i < 8; i++) {
      const spikeGeometry = new THREE.ConeGeometry(0.2, 0.8, 6);
      const spikeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4a0000,
        roughness: 0.8
      });
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      const angle = (i / 8) * Math.PI * 2;
      spike.position.set(Math.cos(angle) * 1.2, Math.sin(angle) * 0.5, 0);
      spike.rotation.z = angle + Math.PI / 2;
      spike.castShadow = true;
      this.mesh.add(spike);
      this.spikes.push(spike);
    }
    
    // Create eyes
    const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.8
    });
    this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.leftEye.position.set(0.4, 0.3, 1.0);
    this.mesh.add(this.leftEye);
    
    this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.rightEye.position.set(-0.4, 0.3, 1.0);
    this.mesh.add(this.rightEye);
    
    // Combat properties
    this.health = GAME_CONFIG.MONSTER_MAX_HEALTH;
    this.maxHealth = GAME_CONFIG.MONSTER_MAX_HEALTH;
    this.speed = GAME_CONFIG.MONSTER_SPEED;
    this.attackCooldown = 0;
    this.isAttacking = false;
    this.isTelegraphing = false;
    this.telegraphTime = 0;
    
    // AI state
    this.state = "IDLE"; // IDLE, PATROL, CHASE, TELEGRAPH, ATTACK
    this.patrolTarget = null;
    this.patrolWaitTime = 0;
    this.detectionRange = GAME_CONFIG.MONSTER_DETECTION_RANGE;
    this.attackRange = GAME_CONFIG.MONSTER_ATTACK_RANGE;
    
    // Animation
    this.animationTime = 0;
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    this.animationTime += deltaTime;
    
    // Update cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }
    
    // Update telegraph timer
    if (this.isTelegraphing) {
      this.telegraphTime -= deltaTime;
      
      // Visual telegraph - pulse and glow
      const pulseIntensity = 1.2 + Math.sin(this.telegraphTime * 20) * 0.3;
      this.mesh.scale.set(pulseIntensity, pulseIntensity, pulseIntensity);
      
      // Eyes glow bright red during telegraph
      this.leftEye.material.emissive = new THREE.Color(0xff0000);
      this.leftEye.material.emissiveIntensity = 2.0;
      this.rightEye.material.emissive = new THREE.Color(0xff0000);
      this.rightEye.material.emissiveIntensity = 2.0;
      
      // Body glows
      this.mesh.material.emissive = new THREE.Color(0xff0000);
      this.mesh.material.emissiveIntensity = 0.5 + Math.sin(this.telegraphTime * 20) * 0.3;
      
      if (this.telegraphTime <= 0) {
        this.isTelegraphing = false;
        this.executeAttack();
      }
    } else {
      // Animate spikes
      this.spikes.forEach((spike, index) => {
        const offset = (index / this.spikes.length) * Math.PI * 2;
        spike.position.y = Math.sin(this.animationTime * 3 + offset) * 0.3;
      });
      
      // Idle breathing animation
      const breathScale = 1 + Math.sin(this.animationTime * 2) * 0.05;
      this.mesh.scale.set(breathScale, breathScale, breathScale);
      
      // Normal eye color
      this.leftEye.material.emissive = new THREE.Color(0xffff00);
      this.leftEye.material.emissiveIntensity = 0.8;
      this.rightEye.material.emissive = new THREE.Color(0xffff00);
      this.rightEye.material.emissiveIntensity = 0.8;
      
      // No body glow normally
      this.mesh.material.emissive = new THREE.Color(0x000000);
      this.mesh.material.emissiveIntensity = 0;
    }
    
    // AI behavior - ALWAYS AGGRESSIVE WHEN REVEALED
    if (gameState.player && gameState.monsterRevealed) {
      const distanceToPlayer = this.mesh.position.distanceTo(gameState.player.mesh.position);
      
      // State transitions - no detection range check when revealed
      if (this.isTelegraphing) {
        this.state = "TELEGRAPH";
      } else if (distanceToPlayer < this.attackRange && this.attackCooldown <= 0) {
        this.startAttackTelegraph();
      } else if (distanceToPlayer > this.attackRange) {
        // Only chase if NOT in attack range
        this.state = "CHASE";
      } else {
        // In attack range but attack on cooldown - stay still and face player
        this.state = "IDLE";
        if (gameState.player) {
          this.mesh.lookAt(gameState.player.mesh.position);
        }
      }
      
      // Execute state behavior
      switch (this.state) {
        case "CHASE":
          this.chasePlayer(deltaTime);
          break;
        case "TELEGRAPH":
          // Stay in place, face player during telegraph
          if (gameState.player) {
            this.mesh.lookAt(gameState.player.mesh.position);
          }
          break;
        case "IDLE":
          // Stay still, just face player
          if (gameState.player) {
            this.mesh.lookAt(gameState.player.mesh.position);
          }
          break;
        case "ATTACK":
          // Attack is instant after telegraph
          break;
      }
    } else {
      // Patrol when monster not revealed
      this.patrol(deltaTime);
    }
    
    // Constrain to world bounds
    const halfWorld = GAME_CONFIG.WORLD_SIZE / 2;
    this.mesh.position.x = Math.max(-halfWorld, Math.min(halfWorld, this.mesh.position.x));
    this.mesh.position.z = Math.max(-halfWorld, Math.min(halfWorld, this.mesh.position.z));
  }
  
  chasePlayer(deltaTime) {
    if (!gameState.player) return;
    
    const distanceToPlayer = this.mesh.position.distanceTo(gameState.player.mesh.position);
    
    // Stop moving when in attack range
    if (distanceToPlayer <= this.attackRange) {
      // Face player but don't move
      this.mesh.lookAt(gameState.player.mesh.position);
      return;
    }
    
    const direction = new THREE.Vector3()
      .subVectors(gameState.player.mesh.position, this.mesh.position)
      .normalize();
    
    this.mesh.position.add(direction.multiplyScalar(this.speed * deltaTime * 60));
    
    // Face player
    this.mesh.lookAt(gameState.player.mesh.position);
  }
  
  startAttackTelegraph() {
    this.isTelegraphing = true;
    this.telegraphTime = GAME_CONFIG.MONSTER_ATTACK_TELEGRAPH_TIME;
    this.state = "TELEGRAPH";
  }
  
  executeAttack() {
    if (!gameState.player) return;
    
    this.isAttacking = true;
    this.attackCooldown = GAME_CONFIG.MONSTER_ATTACK_COOLDOWN;
    this.state = "ATTACK";
    
    // Check if player is still in range
    const distanceToPlayer = this.mesh.position.distanceTo(gameState.player.mesh.position);
    if (distanceToPlayer < this.attackRange) {
      // Deal damage
      gameState.player.takeDamage(GAME_CONFIG.MONSTER_ATTACK_DAMAGE);
    }
    
    // Attack animation - lunge forward
    const direction = new THREE.Vector3()
      .subVectors(gameState.player.mesh.position, this.mesh.position)
      .normalize();
    this.mesh.position.add(direction.multiplyScalar(1.5));
    
    setTimeout(() => {
      this.isAttacking = false;
      this.state = "CHASE";
    }, 300);
  }
  
  patrol(deltaTime) {
    // Simple patrol behavior
    if (!this.patrolTarget || this.patrolWaitTime > 0) {
      this.patrolWaitTime -= deltaTime;
      if (this.patrolWaitTime <= 0) {
        // Pick new patrol point
        this.patrolTarget = new THREE.Vector3(
          (Math.random() - 0.5) * GAME_CONFIG.WORLD_SIZE * 0.6,
          1.5,
          (Math.random() - 0.5) * GAME_CONFIG.WORLD_SIZE * 0.6
        );
      }
      return;
    }
    
    const direction = new THREE.Vector3()
      .subVectors(this.patrolTarget, this.mesh.position)
      .normalize();
    
    this.mesh.position.add(direction.multiplyScalar(this.speed * 0.5 * deltaTime * 60));
    
    // Check if reached patrol point
    if (this.mesh.position.distanceTo(this.patrolTarget) < 2) {
      this.patrolTarget = null;
      this.patrolWaitTime = 2 + Math.random() * 3;
    }
  }
  
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    
    // Visual feedback - flash bright red
    this.mesh.material.emissive = new THREE.Color(0xff0000);
    this.mesh.material.emissiveIntensity = 1.0;
    setTimeout(() => {
      this.mesh.material.emissive = new THREE.Color(0x000000);
      this.mesh.material.emissiveIntensity = 0;
    }, 150);
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    gameState.gamePhase = GAME_PHASE.GAME_OVER_WIN;
    gameState.huntDuration = (Date.now() - gameState.huntStartTime) / 1000;
    
    // Death animation - fade out
    let opacity = 1.0;
    const fadeInterval = setInterval(() => {
      opacity -= 0.05;
      this.mesh.material.opacity = opacity;
      this.mesh.material.transparent = true;
      if (opacity <= 0) {
        clearInterval(fadeInterval);
      }
    }, 50);
  }
}

/**
 * Track class - evidence for tracking monster
 */
export class Track {
  constructor(x, z) {
    const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513,
      emissive: 0xffaa00,
      emissiveIntensity: 0.3
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, 0.05, z);
    this.mesh.rotation.x = Math.PI / 2;
    this.mesh.receiveShadow = true;
    
    // Add glow ring
    const glowGeometry = new THREE.RingGeometry(0.4, 0.6, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffaa00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.glow.position.copy(this.mesh.position);
    this.glow.rotation.x = -Math.PI / 2;
    
    this.collected = false;
    this.animationTime = 0;
    
    gameState.scene.add(this.mesh);
    gameState.scene.add(this.glow);
  }
  
  update(deltaTime) {
    if (this.collected) return;
    
    this.animationTime += deltaTime;
    
    // Pulse animation
    const pulse = 1 + Math.sin(this.animationTime * 3) * 0.2;
    this.glow.scale.set(pulse, pulse, 1);
    
    // Check collection
    if (gameState.player) {
      const distance = new THREE.Vector2(
        this.mesh.position.x - gameState.player.mesh.position.x,
        this.mesh.position.z - gameState.player.mesh.position.z
      ).length();
      
      if (distance < GAME_CONFIG.TRACK_COLLECTION_RANGE) {
        this.collect();
      }
    }
  }
  
  collect() {
    this.collected = true;
    gameState.tracksCollected++;
    
    // SPAWN MONSTER on first track collection
    if (!gameState.monsterSpawned) {
      gameState.monsterSpawned = true;
      
      // Spawn monster at this track location
      gameState.monster = new Monster(this.mesh.position.x, 1.5, this.mesh.position.z);
      
      logGameEvent('monster_spawned', {
        position: { x: this.mesh.position.x, z: this.mesh.position.z }
      });
    }
    
    // Remove visual
    gameState.scene.remove(this.mesh);
    gameState.scene.remove(this.glow);
    
    // Check if monster should be revealed
    if (gameState.tracksCollected >= GAME_CONFIG.TRACKS_TO_REVEAL && !gameState.monsterRevealed) {
      gameState.monsterRevealed = true;
    }
  }
}

/**
 * Scoutfly class - guides player to tracks/monster
 */
export class Scoutfly {
  constructor(startPos) {
    const geometry = new THREE.SphereGeometry(0.08, 8, 8);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff,
      transparent: true,
      opacity: 0.8
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(startPos);
    
    // Create glow
    const glowGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3
    });
    this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mesh.add(this.glow);
    
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1
    );
    this.target = null;
    this.orbitOffset = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() * 0.5,
      Math.random() - 0.5
    ).normalize().multiplyScalar(1.5);
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    if (!gameState.player) return;
    
    // Find nearest uncollected track or monster
    if (gameState.monsterRevealed && gameState.monster) {
      this.target = gameState.monster.mesh.position.clone();
    } else {
      let nearestTrack = null;
      let nearestDist = Infinity;
      
      for (const track of gameState.tracks) {
        if (!track.collected) {
          const dist = track.mesh.position.distanceTo(gameState.player.mesh.position);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestTrack = track;
          }
        }
      }
      
      if (nearestTrack) {
        this.target = nearestTrack.mesh.position.clone();
      }
    }
    
    // Move toward target with orbital motion
    if (this.target) {
      const orbitPos = this.target.clone().add(this.orbitOffset);
      const direction = orbitPos.clone().sub(this.mesh.position).normalize();
      this.velocity.lerp(direction.multiplyScalar(0.15), 0.1);
      
      // Rotate orbit
      const rotationSpeed = 0.02;
      const axis = new THREE.Vector3(0, 1, 0);
      this.orbitOffset.applyAxisAngle(axis, rotationSpeed);
    }
    
    // Apply velocity
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
    
    // Keep near player
    const distToPlayer = this.mesh.position.distanceTo(gameState.player.mesh.position);
    if (distToPlayer > 15) {
      const pullBack = gameState.player.mesh.position.clone()
        .sub(this.mesh.position)
        .normalize()
        .multiplyScalar(0.2);
      this.velocity.add(pullBack);
    }
    
    // Pulse glow
    this.glow.scale.set(
      1 + Math.sin(Date.now() * 0.01) * 0.3,
      1 + Math.sin(Date.now() * 0.01) * 0.3,
      1 + Math.sin(Date.now() * 0.01) * 0.3
    );
  }
}