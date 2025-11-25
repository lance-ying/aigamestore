// entities.js - Entity classes for game objects
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, PLAYER_SPEED, PLAYER_SPRINT_SPEED, PLAYER_JUMP_POWER, CARD_TYPES, logPlayerInfo } from './globals.js';

// Player class
export class Player {
  constructor(x, y, z) {
    // Create player body (invisible in first-person, but needed for physics)
    const geometry = new THREE.BoxGeometry(0.6, 1.8, 0.6);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0 // Invisible in first-person
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = false; // Don't cast shadow for player body
    
    // Physics
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.onGround = false;
    
    // Movement
    this.speed = PLAYER_SPEED;
    this.sprintSpeed = PLAYER_SPRINT_SPEED;
    this.jumpPower = PLAYER_JUMP_POWER;
    this.isSprinting = false;
    
    // Camera control (yaw and pitch)
    this.yaw = 0; // Horizontal rotation
    this.pitch = 0; // Vertical rotation
    
    // Soul Cards
    this.soulCards = [null, null, null]; // Max 3 cards
    this.currentCardIndex = 0;
    this.hasDoubleJump = false;
    this.hasDashed = false;
    this.lastShotTime = 0;
    this.shootCooldown = 0.3; // Seconds between shots
    
    // Health (optional)
    this.health = 100;
    this.maxHealth = 100;
    
    // Add to scene
    gameState.scene.add(this.mesh);
    
    // Last position for logging
    this.lastLogPosition = new THREE.Vector3().copy(this.mesh.position);
    this.logInterval = 0.5; // Log every 0.5 seconds
    this.logTimer = 0;
  }
  
  update(deltaTime) {
    // Apply gravity
    if (!this.onGround) {
      this.acceleration.add(gameState.gravity);
    }
    
    // Update velocity
    this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime * 60));
    
    // Apply friction when on ground
    if (this.onGround) {
      this.velocity.x *= 0.85;
      this.velocity.z *= 0.85;
    } else {
      // Air resistance
      this.velocity.x *= 0.98;
      this.velocity.z *= 0.98;
    }
    
    // Update position
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
    
    // Check ground collision
    this.checkGroundCollision();
    
    // Reset acceleration
    this.acceleration.set(0, 0, 0);
    
    // Reset double jump when on ground
    if (this.onGround) {
      this.hasDoubleJump = false;
      this.hasDashed = false;
    }
    
    // Update camera position to follow player head
    if (gameState.camera) {
      gameState.camera.position.copy(this.mesh.position);
      gameState.camera.position.y += 0.7; // Eye height
      
      // Apply camera rotation
      gameState.camera.rotation.order = 'YXZ';
      gameState.camera.rotation.y = this.yaw;
      gameState.camera.rotation.x = this.pitch;
    }
    
    // Log position periodically
    this.logTimer += deltaTime;
    if (this.logTimer >= this.logInterval) {
      logPlayerInfo(this.mesh.position);
      this.logTimer = 0;
    }
  }
  
  checkGroundCollision() {
    // Check collision with all platforms
    this.onGround = false;
    
    for (const platform of gameState.platforms) {
      if (platform.checkCollision(this)) {
        this.onGround = true;
        break;
      }
    }
    
    // Basic ground plane
    const playerBottom = this.mesh.position.y - 0.9;
    if (playerBottom <= 0) {
      this.mesh.position.y = 0.9;
      this.velocity.y = Math.max(0, this.velocity.y);
      this.onGround = true;
    }
  }
  
  moveForward() {
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyEuler(new THREE.Euler(0, this.yaw, 0, 'YXZ'));
    const speed = this.isSprinting ? this.sprintSpeed : this.speed;
    this.acceleration.add(direction.multiplyScalar(speed));
  }
  
  moveBackward() {
    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyEuler(new THREE.Euler(0, this.yaw, 0, 'YXZ'));
    const speed = this.isSprinting ? this.sprintSpeed : this.speed;
    this.acceleration.add(direction.multiplyScalar(speed));
  }
  
  strafeLeft() {
    const direction = new THREE.Vector3(-1, 0, 0);
    direction.applyEuler(new THREE.Euler(0, this.yaw, 0, 'YXZ'));
    const speed = this.isSprinting ? this.sprintSpeed : this.speed;
    this.acceleration.add(direction.multiplyScalar(speed));
  }
  
  strafeRight() {
    const direction = new THREE.Vector3(1, 0, 0);
    direction.applyEuler(new THREE.Euler(0, this.yaw, 0, 'YXZ'));
    const speed = this.isSprinting ? this.sprintSpeed : this.speed;
    this.acceleration.add(direction.multiplyScalar(speed));
  }
  
  jump() {
    if (this.onGround) {
      this.velocity.y = this.jumpPower;
      this.onGround = false;
    }
  }
  
  // Use current Soul Card ability (discard for parkour move)
  useCardAbility() {
    const card = this.soulCards[this.currentCardIndex];
    if (!card) return;
    
    const cardType = CARD_TYPES[card];
    if (!cardType) return;
    
    // Apply ability based on card type
    switch (cardType.ability) {
      case 'double_jump':
        if (!this.onGround && !this.hasDoubleJump) {
          this.velocity.y = this.jumpPower;
          this.hasDoubleJump = true;
          this.removeCurrentCard();
        }
        break;
        
      case 'dash':
        if (!this.hasDashed) {
          const direction = new THREE.Vector3(0, 0, -1);
          direction.applyEuler(new THREE.Euler(0, this.yaw, 0, 'YXZ'));
          this.velocity.add(direction.multiplyScalar(0.8));
          this.hasDashed = true;
          this.removeCurrentCard();
        }
        break;
        
      case 'grapple':
        // Simple upward boost as grapple
        this.velocity.y = this.jumpPower * 1.5;
        this.removeCurrentCard();
        break;
    }
  }
  
  // Shoot current Soul Card
  shoot() {
    const currentTime = performance.now() / 1000;
    if (currentTime - this.lastShotTime < this.shootCooldown) {
      return; // Still on cooldown
    }
    
    const card = this.soulCards[this.currentCardIndex];
    if (!card) return;
    
    const cardType = CARD_TYPES[card];
    if (!cardType) return;
    
    // Create projectile
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    
    const startPos = this.mesh.position.clone();
    startPos.y += 0.7; // Eye height
    
    const projectile = new Projectile(startPos, direction, 1.2, cardType.damage, cardType.color);
    gameState.projectiles.push(projectile);
    
    this.lastShotTime = currentTime;
    
    // Remove card after shooting
    this.removeCurrentCard();
  }
  
  // Add Soul Card to inventory
  addCard(cardType) {
    // Find empty slot
    for (let i = 0; i < this.soulCards.length; i++) {
      if (!this.soulCards[i]) {
        this.soulCards[i] = cardType;
        return true;
      }
    }
    return false; // Inventory full
  }
  
  // Remove current card
  removeCurrentCard() {
    this.soulCards[this.currentCardIndex] = null;
    // Switch to next available card
    this.switchToNextCard();
  }
  
  // Switch to next card with a card
  switchToNextCard() {
    for (let i = 0; i < this.soulCards.length; i++) {
      if (this.soulCards[i]) {
        this.currentCardIndex = i;
        return;
      }
    }
    this.currentCardIndex = 0;
  }
  
  // Switch to specific card slot
  switchCard(index) {
    if (index >= 0 && index < this.soulCards.length) {
      this.currentCardIndex = index;
    }
  }
  
  // Look around (mouse movement)
  look(deltaX, deltaY) {
    this.yaw -= deltaX * gameState.mouseSensitivity;
    this.pitch -= deltaY * gameState.mouseSensitivity;
    
    // Clamp pitch to prevent over-rotation
    this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
  }
}

// Enemy class (Demon)
export class Enemy {
  constructor(x, y, z, patrolPath = null) {
    const geometry = new THREE.ConeGeometry(0.4, 1.2, 8);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.3
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    
    // Physics
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.onGround = false;
    
    // AI
    this.patrolPath = patrolPath || [new THREE.Vector3(x, y, z)];
    this.currentPatrolIndex = 0;
    this.patrolSpeed = 0.05;
    
    // Stats
    this.health = 100;
    this.maxHealth = 100;
    this.isAlive = true;
    
    // Animation
    this.rotationSpeed = 0.02;
    this.bobSpeed = 0.003;
    this.bobAmount = 0.1;
    this.initialY = y;
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    if (!this.isAlive) return;
    
    // Bob animation
    this.mesh.position.y = this.initialY + Math.sin(gameState.frameCount * this.bobSpeed) * this.bobAmount;
    
    // Rotate
    this.mesh.rotation.y += this.rotationSpeed;
    
    // Simple patrol AI
    if (this.patrolPath.length > 1) {
      const target = this.patrolPath[this.currentPatrolIndex];
      const direction = new THREE.Vector3().subVectors(target, this.mesh.position);
      direction.y = 0; // Only move horizontally
      
      if (direction.length() < 0.5) {
        // Reached waypoint, move to next
        this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPath.length;
      } else {
        // Move toward waypoint
        direction.normalize().multiplyScalar(this.patrolSpeed);
        this.mesh.position.add(direction);
      }
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    this.isAlive = false;
    gameState.scene.remove(this.mesh);
    gameState.enemiesKilled++;
    gameState.score += 100;
    
    const index = gameState.enemies.indexOf(this);
    if (index > -1) {
      gameState.enemies.splice(index, 1);
    }
  }
}

// Soul Card Collectible
export class SoulCardPickup {
  constructor(x, y, z, cardType) {
    this.cardType = cardType;
    const cardData = CARD_TYPES[cardType];
    
    const geometry = new THREE.BoxGeometry(0.3, 0.5, 0.05);
    const material = new THREE.MeshStandardMaterial({ 
      color: cardData.color,
      emissive: cardData.color,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    
    this.rotationSpeed = 0.03;
    this.bobSpeed = 0.004;
    this.bobAmount = 0.15;
    this.initialY = y;
    this.collected = false;
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    if (this.collected) return;
    
    // Rotate
    this.mesh.rotation.y += this.rotationSpeed;
    
    // Bob up and down
    this.mesh.position.y = this.initialY + Math.sin(gameState.frameCount * this.bobSpeed) * this.bobAmount;
    
    // Check collision with player
    if (gameState.player) {
      const distance = this.mesh.position.distanceTo(gameState.player.mesh.position);
      if (distance < 1.0) {
        this.collect();
      }
    }
  }
  
  collect() {
    if (gameState.player && gameState.player.addCard(this.cardType)) {
      this.collected = true;
      gameState.scene.remove(this.mesh);
      
      const index = gameState.collectibles.indexOf(this);
      if (index > -1) {
        gameState.collectibles.splice(index, 1);
      }
    }
  }
}

// Projectile class
export class Projectile {
  constructor(position, direction, speed, damage, color) {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({ 
      color: color,
      transparent: true,
      opacity: 0.8
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    
    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color: color,
      transparent: true,
      opacity: 0.3
    });
    this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mesh.add(this.glow);
    
    this.velocity = direction.normalize().multiplyScalar(speed);
    this.lifetime = 3.0;
    this.age = 0;
    this.damage = damage;
    this.isAlive = true;
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    if (!this.isAlive) return;
    
    // Update position
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
    
    // Update age
    this.age += deltaTime;
    
    // Remove if expired
    if (this.age >= this.lifetime) {
      this.destroy();
      return;
    }
    
    // Check collision with enemies
    for (const enemy of gameState.enemies) {
      const distance = this.mesh.position.distanceTo(enemy.mesh.position);
      if (distance < 0.6) {
        enemy.takeDamage(this.damage);
        this.destroy();
        return;
      }
    }
    
    // Check collision with walls
    for (const platform of gameState.platforms) {
      if (platform.checkPointCollision(this.mesh.position)) {
        this.destroy();
        return;
      }
    }
  }
  
  destroy() {
    this.isAlive = false;
    gameState.scene.remove(this.mesh);
    
    const index = gameState.projectiles.indexOf(this);
    if (index > -1) {
      gameState.projectiles.splice(index, 1);
    }
  }
}

// Platform class
export class Platform {
  constructor(x, y, z, width, height, depth, color = 0x666666) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: 0.8,
      metalness: 0.2
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    
    this.width = width;
    this.height = height;
    this.depth = depth;
    
    // Collision bounds
    this.bounds = {
      min: new THREE.Vector3(
        x - width / 2,
        y - height / 2,
        z - depth / 2
      ),
      max: new THREE.Vector3(
        x + width / 2,
        y + height / 2,
        z + depth / 2
      )
    };
    
    gameState.scene.add(this.mesh);
  }
  
  checkCollision(entity) {
    const pos = entity.mesh.position;
    const entityBottom = pos.y - 0.9;
    const entityTop = pos.y + 0.9;
    
    // Check if entity is on top of platform
    if (entityBottom <= this.bounds.max.y && entityBottom >= this.bounds.max.y - 0.3 &&
        pos.x >= this.bounds.min.x && pos.x <= this.bounds.max.x &&
        pos.z >= this.bounds.min.z && pos.z <= this.bounds.max.z) {
      entity.mesh.position.y = this.bounds.max.y + 0.9;
      entity.velocity.y = Math.max(0, entity.velocity.y);
      return true;
    }
    
    return false;
  }
  
  checkPointCollision(point) {
    return (
      point.x >= this.bounds.min.x && point.x <= this.bounds.max.x &&
      point.y >= this.bounds.min.y && point.y <= this.bounds.max.y &&
      point.z >= this.bounds.min.z && point.z <= this.bounds.max.z
    );
  }
}

// Goal Portal
export class GoalPortal {
  constructor(x, y, z) {
    // Create portal ring
    const geometry = new THREE.TorusGeometry(1.5, 0.2, 16, 32);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.8,
      metalness: 0.5,
      roughness: 0.2
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.rotation.y = Math.PI / 2;
    
    // Create portal center
    const centerGeometry = new THREE.CircleGeometry(1.4, 32);
    const centerMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    this.center = new THREE.Mesh(centerGeometry, centerMaterial);
    this.center.position.copy(this.mesh.position);
    this.center.rotation.y = Math.PI / 2;
    
    this.rotationSpeed = 0.01;
    this.pulseSpeed = 0.05;
    
    gameState.scene.add(this.mesh);
    gameState.scene.add(this.center);
  }
  
  update(deltaTime) {
    // Rotate
    this.mesh.rotation.z += this.rotationSpeed;
    
    // Pulse
    const scale = 1 + Math.sin(gameState.frameCount * this.pulseSpeed) * 0.1;
    this.mesh.scale.set(scale, scale, scale);
    this.center.scale.set(scale, scale, scale);
    
    // Check if player reached goal
    if (gameState.player) {
      const distance = this.mesh.position.distanceTo(gameState.player.mesh.position);
      if (distance < 2.0 && !gameState.goalReached) {
        gameState.goalReached = true;
        gameState.levelCompleteTime = (performance.now() - gameState.levelStartTime) / 1000;
        if (gameState.levelCompleteTime < gameState.bestTime) {
          gameState.bestTime = gameState.levelCompleteTime;
        }
        gameState.gamePhase = "GAME_OVER_WIN";
      }
    }
  }
}