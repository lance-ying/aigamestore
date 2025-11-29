import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, PLAYER_SPEED, PLAYER_DASH_SPEED, PLAYER_JUMP_POWER, ARENA_SIZE, PROJECTILE_SPEED, ENEMY_SPEED, BLOOD_PARTICLE_LIFETIME, logPlayerInfo } from './globals.js';

// Player class
export class Player {
  constructor(x, y, z) {
    // Create player mesh (robotic cube design)
    const geometry = new THREE.BoxGeometry(0.8, 1.6, 0.8);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x00ccff,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x0088cc,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0 // Hide player mesh in first person
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    // Add a "head" to indicate facing direction
    const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.6);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x00ffff,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x00ccff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0 // Hide in first person
    });
    this.headMesh = new THREE.Mesh(headGeometry, headMaterial);
    this.headMesh.position.set(0, 0.5, 0.2);
    this.headMesh.castShadow = true;
    this.mesh.add(this.headMesh);
    
    // Physics properties
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.speed = PLAYER_SPEED;
    this.jumpPower = PLAYER_JUMP_POWER;
    this.dashPower = PLAYER_DASH_SPEED;
    this.onGround = false;
    
    // Combat properties
    this.health = 100;
    this.maxHealth = 100;
    this.shootCooldown = 0;
    this.shootCooldownMax = 0.15; // Fast fire rate
    this.dashCooldown = 0;
    this.dashCooldownMax = 0.8;
    this.isDashing = false;
    this.dashDuration = 0;
    this.dashDurationMax = 0.15;
    
    // Rotation
    this.rotation = 0;
    
    // State tracking
    this.lastLogPosition = new THREE.Vector3().copy(this.mesh.position);
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Update cooldowns
    if (this.shootCooldown > 0) this.shootCooldown -= deltaTime;
    if (this.dashCooldown > 0) this.dashCooldown -= deltaTime;
    
    // Handle dash
    if (this.isDashing) {
      this.dashDuration -= deltaTime;
      if (this.dashDuration <= 0) {
        this.isDashing = false;
      }
    }
    
    // Apply gravity with reduced effect for floating
    if (!this.onGround && !this.isDashing) {
      this.acceleration.add(gameState.gravity);
    }
    
    // Update velocity
    this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
    
    // Apply friction - frame-rate independent and only to horizontal movement
    if (this.onGround) {
      // Ground friction - make frame-rate independent
      const groundFriction = Math.pow(0.85, deltaTime * 60);
      this.velocity.x *= groundFriction;
      this.velocity.z *= groundFriction;
    } else {
      // Air resistance - only affects horizontal movement, not falling
      const airResistance = Math.pow(0.98, deltaTime * 60);
      this.velocity.x *= airResistance;
      this.velocity.z *= airResistance;
    }
    
    // Clamp velocity
    const maxVelocity = this.isDashing ? 2.0 : 0.5;
    if (this.velocity.length() > maxVelocity) {
      this.velocity.normalize().multiplyScalar(maxVelocity);
    }
    
    // Update position
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
    
    // Constrain to arena
    const halfArena = ARENA_SIZE / 2 - 1;
    this.mesh.position.x = Math.max(-halfArena, Math.min(halfArena, this.mesh.position.x));
    this.mesh.position.z = Math.max(-halfArena, Math.min(halfArena, this.mesh.position.z));
    
    // Check ground collision
    this.checkGroundCollision();
    
    // Update rotation to face camera direction
    this.mesh.rotation.y = gameState.cameraAngleX;
    
    // Reset acceleration
    this.acceleration.set(0, 0, 0);
    
    // Log position if moved significantly
    if (this.mesh.position.distanceTo(this.lastLogPosition) > 0.5) {
      logPlayerInfo();
      this.lastLogPosition.copy(this.mesh.position);
    }
  }
  
  checkGroundCollision() {
    const groundY = 0.8; // Half height of player
    if (this.mesh.position.y <= groundY) {
      this.mesh.position.y = groundY;
      this.velocity.y = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
  }
  
  move(direction) {
    if (this.isDashing) return;
    
    // Convert direction to world space based on camera rotation
    // Negate the angle to match camera rotation direction
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);
    
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), -gameState.cameraAngleX);
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), -gameState.cameraAngleX);
    
    const movement = new THREE.Vector3();
    if (direction.z !== 0) movement.add(forward.clone().multiplyScalar(direction.z));
    if (direction.x !== 0) movement.add(right.clone().multiplyScalar(direction.x));
    
    movement.normalize().multiplyScalar(this.speed);
    this.acceleration.add(movement);
  }
  
  jump() {
    if (this.onGround) {
      this.velocity.y = this.jumpPower;
      this.onGround = false;
    }
  }
  
  dash() {
    if (this.dashCooldown > 0) return;
    
    // Dash in current movement direction
    const dashDirection = new THREE.Vector3();
    
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);
    
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), -gameState.cameraAngleX);
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), -gameState.cameraAngleX);
    
    // Use current acceleration direction or forward by default
    if (this.acceleration.length() > 0) {
      dashDirection.copy(this.acceleration).normalize();
    } else {
      dashDirection.copy(forward);
    }
    
    this.velocity.add(dashDirection.multiplyScalar(this.dashPower));
    this.isDashing = true;
    this.dashDuration = this.dashDurationMax;
    this.dashCooldown = this.dashCooldownMax;
  }
  
  shoot() {
    if (this.shootCooldown > 0) return;
    
    // Create projectile in camera facing direction
    const direction = new THREE.Vector3(
      Math.sin(gameState.cameraAngleX) * Math.cos(gameState.cameraAngleY),
      Math.sin(gameState.cameraAngleY),
      -Math.cos(gameState.cameraAngleX) * Math.cos(gameState.cameraAngleY)
    );
    direction.normalize();
    
    const spawnPos = this.mesh.position.clone();
    spawnPos.y += 0.5; // Shoot from center mass
    spawnPos.add(direction.clone().multiplyScalar(1)); // Offset forward
    
    const projectile = new Projectile(spawnPos, direction);
    gameState.projectiles.push(projectile);
    
    this.shootCooldown = this.shootCooldownMax;
  }
  
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    
    // Flash effect
    this.mesh.material.emissiveIntensity = 1.0;
    setTimeout(() => {
      if (this.mesh.material) {
        this.mesh.material.emissiveIntensity = 0.3;
      }
    }, 100);
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }
  
  die() {
    gameState.gamePhase = "GAME_OVER_LOSE";
  }
}

// Enemy class
export class Enemy {
  constructor(x, y, z) {
    // Create enemy mesh (demonic angular design)
    const geometry = new THREE.ConeGeometry(0.6, 1.5, 4);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      metalness: 0.3,
      roughness: 0.7,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.rotation.x = Math.PI; // Point down
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    // Add glowing "eyes"
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    this.eye1 = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.eye1.position.set(-0.2, 0.3, 0.3);
    this.mesh.add(this.eye1);
    
    this.eye2 = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.eye2.position.set(0.2, 0.3, 0.3);
    this.mesh.add(this.eye2);
    
    // Physics
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.speed = ENEMY_SPEED;
    
    // Combat
    this.health = 50;
    this.maxHealth = 50;
    this.damage = 15;
    this.attackRange = 2.0;
    this.attackCooldown = 0;
    this.attackCooldownMax = 1.5;
    
    // Behavior
    this.state = 'chase'; // chase, attack
    this.aggroRange = 50; // Always aggro
    
    // Animation
    this.floatOffset = Math.random() * Math.PI * 2;
    this.floatSpeed = 0.05;
    this.baseY = y;
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    if (!gameState.player) return;
    
    // Update attack cooldown
    if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
    
    // Floating animation
    this.floatOffset += this.floatSpeed;
    this.mesh.position.y = this.baseY + Math.sin(this.floatOffset) * 0.3;
    
    // Rotate to face player
    const direction = new THREE.Vector3()
      .subVectors(gameState.player.mesh.position, this.mesh.position);
    const angle = Math.atan2(direction.x, direction.z);
    this.mesh.rotation.y = angle;
    
    const distanceToPlayer = this.mesh.position.distanceTo(gameState.player.mesh.position);
    
    // AI behavior
    if (distanceToPlayer < this.attackRange) {
      this.state = 'attack';
      this.attack();
    } else {
      this.state = 'chase';
      this.chase();
    }
    
    // Update position
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
    
    // Apply friction
    this.velocity.multiplyScalar(0.9);
  }
  
  chase() {
    const direction = new THREE.Vector3()
      .subVectors(gameState.player.mesh.position, this.mesh.position)
      .normalize();
    
    this.velocity.add(direction.multiplyScalar(this.speed * 0.1));
  }
  
  attack() {
    if (this.attackCooldown > 0) return;
    
    if (gameState.player) {
      gameState.player.takeDamage(this.damage);
      this.attackCooldown = this.attackCooldownMax;
      
      // Visual feedback
      this.mesh.material.emissiveIntensity = 1.0;
      setTimeout(() => {
        if (this.mesh.material) {
          this.mesh.material.emissiveIntensity = 0.5;
        }
      }, 100);
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    
    // Flash white
    this.mesh.material.emissive.setHex(0xffffff);
    this.mesh.material.emissiveIntensity = 1.0;
    setTimeout(() => {
      if (this.mesh.material) {
        this.mesh.material.emissive.setHex(0xff0000);
        this.mesh.material.emissiveIntensity = 0.5;
      }
    }, 50);
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    // Spawn blood particles
    this.spawnBlood();
    
    // Remove from scene
    gameState.scene.remove(this.mesh);
    
    // Remove from enemies array
    const index = gameState.enemies.indexOf(this);
    if (index > -1) {
      gameState.enemies.splice(index, 1);
    }
    
    // Update game state
    gameState.enemiesKilledThisWave++;
    gameState.totalEnemiesKilled++;
    gameState.testEnemiesKilled++;
    
    // Update style system
    updateStyleSystem();
  }
  
  spawnBlood() {
    // Spawn multiple blood particles
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
      const particle = new BloodParticle(
        this.mesh.position.x + (Math.random() - 0.5) * 2,
        this.mesh.position.y + (Math.random() - 0.5) * 2,
        this.mesh.position.z + (Math.random() - 0.5) * 2
      );
      gameState.bloodParticles.push(particle);
    }
  }
}

// Update style system
function updateStyleSystem() {
  const currentTime = performance.now() / 1000;
  
  // Check if combo should reset
  if (currentTime - gameState.lastKillTime > 3.0) {
    gameState.styleCombo = 0;
  }
  
  // Increment combo
  gameState.styleCombo++;
  gameState.lastKillTime = currentTime;
  
  // Calculate style points (combo multiplier)
  const comboMultiplier = Math.min(gameState.styleCombo, 10);
  const basePoints = 100;
  const pointsEarned = basePoints * comboMultiplier;
  
  gameState.stylePoints += pointsEarned;
  gameState.score += pointsEarned;
  
  // Update style rank
  updateStyleRank();
}

// Update style rank based on points
function updateStyleRank() {
  const points = gameState.stylePoints;
  let rank = 'D';
  
  for (let i = 7; i >= 0; i--) {
    if (points >= gameState.styleThresholds[i]) {
      rank = gameState.styleRanks[i];
      break;
    }
  }
  
  gameState.currentStyleRank = rank;
}

// Projectile class
export class Projectile {
  constructor(position, direction) {
    // Create projectile mesh (glowing bullet)
    const geometry = new THREE.SphereGeometry(0.15, 8, 8);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
      transparent: true,
      opacity: 0.9
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    
    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
      transparent: true,
      opacity: 0.3
    });
    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mesh.add(this.glowMesh);
    
    this.velocity = direction.normalize().multiplyScalar(PROJECTILE_SPEED);
    this.damage = 25;
    this.lifetime = 3.0;
    this.age = 0;
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Update position
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
    
    // Update age
    this.age += deltaTime;
    
    // Fade out as lifetime expires
    const fadeStart = this.lifetime * 0.7;
    if (this.age > fadeStart) {
      const fadeProgress = (this.age - fadeStart) / (this.lifetime - fadeStart);
      this.mesh.material.opacity = 0.9 * (1 - fadeProgress);
      this.glowMesh.material.opacity = 0.3 * (1 - fadeProgress);
    }
    
    // Remove if expired
    if (this.age >= this.lifetime) {
      this.destroy();
      return;
    }
    
    // Check collision with enemies
    for (const enemy of gameState.enemies) {
      const distance = this.mesh.position.distanceTo(enemy.mesh.position);
      if (distance < 0.8) {
        enemy.takeDamage(this.damage);
        this.destroy();
        return;
      }
    }
  }
  
  destroy() {
    gameState.scene.remove(this.mesh);
    const index = gameState.projectiles.indexOf(this);
    if (index > -1) {
      gameState.projectiles.splice(index, 1);
    }
  }
}

// Blood Particle class
export class BloodParticle {
  constructor(x, y, z) {
    const geometry = new THREE.SphereGeometry(0.1, 6, 6);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xff0000,
      transparent: true,
      opacity: 0.9
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    
    // Physics
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      Math.random() * 0.2,
      (Math.random() - 0.5) * 0.3
    );
    
    this.lifetime = BLOOD_PARTICLE_LIFETIME;
    this.age = 0;
    this.collected = false;
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    if (this.collected) return;
    
    // Apply gravity
    this.velocity.add(gameState.gravity.clone().multiplyScalar(deltaTime * 60));
    
    // Update position
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
    
    // Ground collision
    if (this.mesh.position.y < 0.1) {
      this.mesh.position.y = 0.1;
      this.velocity.y = 0;
      this.velocity.x *= 0.8;
      this.velocity.z *= 0.8;
    }
    
    // Update age
    this.age += deltaTime;
    
    // Fade out
    const fadeStart = this.lifetime * 0.5;
    if (this.age > fadeStart) {
      const fadeProgress = (this.age - fadeStart) / (this.lifetime - fadeStart);
      this.mesh.material.opacity = 0.9 * (1 - fadeProgress);
    }
    
    // Check collection by player
    if (gameState.player) {
      const distance = this.mesh.position.distanceTo(gameState.player.mesh.position);
      if (distance < 1.5) {
        this.collect();
      }
    }
    
    // Remove if expired
    if (this.age >= this.lifetime) {
      this.destroy();
    }
  }
  
  collect() {
    if (this.collected) return;
    this.collected = true;
    
    // Heal player
    if (gameState.player) {
      gameState.player.heal(5);
    }
    
    this.destroy();
  }
  
  destroy() {
    gameState.scene.remove(this.mesh);
    const index = gameState.bloodParticles.indexOf(this);
    if (index > -1) {
      gameState.bloodParticles.splice(index, 1);
    }
  }
}

// Platform/Arena floor
export class Platform {
  constructor(x, y, z, width, height, depth) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    
    // Create checkered pattern texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    const tileSize = 32;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        ctx.fillStyle = (i + j) % 2 === 0 ? '#333333' : '#444444';
        ctx.fillRect(i * tileSize, j * tileSize, tileSize, tileSize);
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(width / 2, depth / 2);
    
    const material = new THREE.MeshStandardMaterial({ 
      map: texture,
      roughness: 0.8,
      metalness: 0.2
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.receiveShadow = true;
    
    gameState.scene.add(this.mesh);
  }
}