import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, COLORS, PLAYER_SPEED, PLAYER_JUMP_POWER, PLAYER_DASH_POWER, PROJECTILE_SPEED, logPlayerInfo } from './globals.js';

// Player class
export class Player {
  constructor(x, y, z) {
    // Create player body (invisible in first-person, but needed for physics)
    const geometry = new THREE.BoxGeometry(0.8, 1.6, 0.8);
    const material = new THREE.MeshStandardMaterial({ 
      color: COLORS.player,
      emissive: COLORS.player,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.0 // Invisible in first-person
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    
    // Create weapon visual (visible in first-person)
    const weaponGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.6);
    const weaponMaterial = new THREE.MeshStandardMaterial({ 
      color: COLORS.player,
      emissive: COLORS.player,
      emissiveIntensity: 0.5
    });
    this.weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    this.weapon.position.set(0.3, -0.3, -0.5);
    
    // Physics properties
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.speed = PLAYER_SPEED;
    this.jumpPower = PLAYER_JUMP_POWER;
    this.onGround = false;
    this.mass = 1.0;
    
    // Game properties
    this.health = 100;
    this.maxHealth = 100;
    this.cards = 0;
    this.maxCards = 20;
    
    // Ability states
    this.canDash = true;
    this.dashCooldown = 0;
    this.dashCooldownMax = 0.5; // seconds
    
    // Movement state
    this.moveForwardPressed = false;
    this.moveBackwardPressed = false;
    this.strafeLeftPressed = false;
    this.strafeRightPressed = false;
    
    // Last position for logging
    this.lastLogPosition = new THREE.Vector3().copy(this.mesh.position);
    this.logTimer = 0;
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Update cooldowns
    if (this.dashCooldown > 0) {
      this.dashCooldown -= deltaTime;
      if (this.dashCooldown < 0) {
        this.dashCooldown = 0;
        this.canDash = true;
      }
    }
    
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
      // Air resistance - increased from 0.98 to 0.92 for better air control
      this.velocity.x *= 0.92;
      this.velocity.z *= 0.92;
    }
    
    // Update position
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
    
    // Check ground collision
    this.checkGroundCollision();
    
    // Check boundaries
    this.checkBoundaries();
    
    // Reset acceleration
    this.acceleration.set(0, 0, 0);
    
    // Log position periodically
    this.logTimer += deltaTime;
    if (this.logTimer > 0.1) { // Log every 0.1 seconds
      if (this.mesh.position.distanceTo(this.lastLogPosition) > 0.1) {
        logPlayerInfo(this);
        this.lastLogPosition.copy(this.mesh.position);
      }
      this.logTimer = 0;
    }
  }
  
  checkGroundCollision() {
    const groundY = 0;
    const playerBottom = this.mesh.position.y - 0.8;
    
    if (playerBottom <= groundY) {
      this.mesh.position.y = groundY + 0.8;
      this.velocity.y = 0;
      this.onGround = true;
      gameState.hasJumped = false;
    } else {
      this.onGround = false;
    }
    
    // Check platform collisions
    for (const platform of gameState.platforms) {
      if (this.checkPlatformCollision(platform)) {
        this.onGround = true;
        gameState.hasJumped = false;
        break;
      }
    }
  }
  
  checkPlatformCollision(platform) {
    const playerBottom = this.mesh.position.y - 0.8;
    const platformTop = platform.mesh.position.y + platform.height / 2;
    const platformBottom = platform.mesh.position.y - platform.height / 2;
    
    // Check if player is falling and is above platform
    if (this.velocity.y <= 0 && 
        playerBottom <= platformTop && 
        playerBottom > platformBottom) {
      
      // Check horizontal bounds
      const dx = Math.abs(this.mesh.position.x - platform.mesh.position.x);
      const dz = Math.abs(this.mesh.position.z - platform.mesh.position.z);
      
      if (dx < platform.width / 2 + 0.4 && dz < platform.depth / 2 + 0.4) {
        this.mesh.position.y = platformTop + 0.8;
        this.velocity.y = 0;
        return true;
      }
    }
    
    return false;
  }
  
  checkBoundaries() {
    const halfSize = gameState.arenaSize / 2;
    
    if (this.mesh.position.x < -halfSize) {
      this.mesh.position.x = -halfSize;
      this.velocity.x = 0;
    } else if (this.mesh.position.x > halfSize) {
      this.mesh.position.x = halfSize;
      this.velocity.x = 0;
    }
    
    if (this.mesh.position.z < -halfSize) {
      this.mesh.position.z = -halfSize;
      this.velocity.z = 0;
    } else if (this.mesh.position.z > halfSize) {
      this.mesh.position.z = halfSize;
      this.velocity.z = 0;
    }
    
    // Prevent falling below ground
    if (this.mesh.position.y < 0) {
      this.mesh.position.y = 0.8;
      this.velocity.y = 0;
      this.onGround = true;
    }
  }
  
  moveForward() {
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(gameState.camera.quaternion);
    direction.y = 0; // Keep movement horizontal
    direction.normalize();
    
    // Reduce air control - only 50% acceleration when not on ground
    const airControlFactor = this.onGround ? 1.0 : 0.5;
    this.acceleration.add(direction.multiplyScalar(this.speed * airControlFactor));
  }
  
  moveBackward() {
    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyQuaternion(gameState.camera.quaternion);
    direction.y = 0;
    direction.normalize();
    
    // Reduce air control - only 50% acceleration when not on ground
    const airControlFactor = this.onGround ? 1.0 : 0.5;
    this.acceleration.add(direction.multiplyScalar(this.speed * airControlFactor));
  }
  
  strafeLeft() {
    const direction = new THREE.Vector3(-1, 0, 0);
    direction.applyQuaternion(gameState.camera.quaternion);
    direction.y = 0;
    direction.normalize();
    
    // Reduce air control - only 50% acceleration when not on ground
    const airControlFactor = this.onGround ? 1.0 : 0.5;
    this.acceleration.add(direction.multiplyScalar(this.speed * airControlFactor));
  }
  
  strafeRight() {
    const direction = new THREE.Vector3(1, 0, 0);
    direction.applyQuaternion(gameState.camera.quaternion);
    direction.y = 0;
    direction.normalize();
    
    // Reduce air control - only 50% acceleration when not on ground
    const airControlFactor = this.onGround ? 1.0 : 0.5;
    this.acceleration.add(direction.multiplyScalar(this.speed * airControlFactor));
  }
  
  jump() {
    if (this.onGround) {
      this.velocity.y = this.jumpPower;
      this.onGround = false;
      gameState.hasJumped = true;
      gameState.lastJumpTime = Date.now();
    }
  }
  
  dash() {
    if (this.canDash && this.cards > 0) {
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(gameState.camera.quaternion);
      direction.y = 0;
      direction.normalize();
      
      this.velocity.add(direction.multiplyScalar(PLAYER_DASH_POWER));
      this.velocity.y += 0.2; // Slight upward boost
      
      this.cards--;
      this.canDash = false;
      this.dashCooldown = this.dashCooldownMax;
      
      // Create dash particle effect
      this.createDashEffect();
    }
  }
  
  superJump() {
    if (this.cards > 0 && gameState.hasJumped) {
      const timeSinceJump = Date.now() - gameState.lastJumpTime;
      if (timeSinceJump < 300) { // Within 300ms of first jump
        this.velocity.y = this.jumpPower * 1.8;
        this.cards--;
        gameState.hasJumped = false;
        
        // Create jump particle effect
        this.createJumpEffect();
      }
    }
  }
  
  shoot() {
    if (this.cards > 0) {
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(gameState.camera.quaternion);
      direction.normalize();
      
      const startPos = this.mesh.position.clone();
      startPos.y += 0.5; // Shoot from eye level
      startPos.add(direction.clone().multiplyScalar(0.5));
      
      const projectile = new Projectile(startPos, direction);
      gameState.projectiles.push(projectile);
      
      this.cards--;
      
      // Weapon recoil animation
      this.weaponRecoil();
    }
  }
  
  weaponRecoil() {
    // Simple recoil effect (would be animated in full version)
    if (this.weapon) {
      this.weapon.position.z = -0.6;
      setTimeout(() => {
        if (this.weapon) this.weapon.position.z = -0.5;
      }, 50);
    }
  }
  
  createDashEffect() {
    for (let i = 0; i < 10; i++) {
      const particle = new Particle(
        this.mesh.position.clone(),
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        ),
        COLORS.player,
        0.5
      );
      gameState.particles.push(particle);
    }
  }
  
  createJumpEffect() {
    for (let i = 0; i < 8; i++) {
      const particle = new Particle(
        this.mesh.position.clone(),
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          Math.random() * -0.2,
          (Math.random() - 0.5) * 0.2
        ),
        COLORS.player,
        0.4
      );
      gameState.particles.push(particle);
    }
  }
  
  collectCard() {
    if (this.cards < this.maxCards) {
      this.cards++;
      gameState.cardsCollected++;
    }
  }
}

// Demon class
export class Demon {
  constructor(x, y, z) {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshStandardMaterial({ 
      color: COLORS.demon,
      emissive: COLORS.demon,
      emissiveIntensity: 0.5
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    
    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.demon,
      transparent: true,
      opacity: 0.3
    });
    this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mesh.add(this.glow);
    
    this.health = 1;
    this.radius = 0.5;
    
    // Floating animation
    this.initialY = y;
    this.floatSpeed = 0.002;
    this.floatAmount = 0.3;
    this.rotationSpeed = 0.02;
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Float up and down
    this.mesh.position.y = this.initialY + 
      Math.sin(gameState.frameCount * this.floatSpeed) * this.floatAmount;
    
    // Rotate
    this.mesh.rotation.y += this.rotationSpeed;
    
    // Pulse glow
    if (this.glow) {
      const pulseValue = 0.2 + Math.sin(gameState.frameCount * 0.05) * 0.1;
      this.glow.material.opacity = pulseValue;
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    // Create explosion effect
    this.createExplosion();
    
    gameState.scene.remove(this.mesh);
    const index = gameState.demons.indexOf(this);
    if (index > -1) {
      gameState.demons.splice(index, 1);
      gameState.demonsEliminated++;
      gameState.score += 100;
    }
  }
  
  createExplosion() {
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const speed = 0.15 + Math.random() * 0.1;
      const particle = new Particle(
        this.mesh.position.clone(),
        new THREE.Vector3(
          Math.cos(angle) * speed,
          (Math.random() - 0.5) * speed,
          Math.sin(angle) * speed
        ),
        COLORS.demon,
        1.0
      );
      gameState.particles.push(particle);
    }
  }
}

// Soul Card class
export class SoulCard {
  constructor(x, y, z) {
    const geometry = new THREE.BoxGeometry(0.3, 0.5, 0.05);
    const material = new THREE.MeshStandardMaterial({ 
      color: COLORS.card,
      emissive: COLORS.card,
      emissiveIntensity: 0.6
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    
    this.radius = 0.5;
    this.initialY = y;
    this.rotationSpeed = 0.03;
    this.bobSpeed = 0.003;
    this.bobAmount = 0.2;
    
    // Add glow effect
    const glowGeometry = new THREE.BoxGeometry(0.35, 0.55, 0.1);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.card,
      transparent: true,
      opacity: 0.3
    });
    this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mesh.add(this.glow);
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Rotate
    this.mesh.rotation.y += this.rotationSpeed;
    
    // Bob up and down
    this.mesh.position.y = this.initialY + 
      Math.sin(gameState.frameCount * this.bobSpeed) * this.bobAmount;
    
    // Check collision with player
    if (gameState.player) {
      const distance = this.mesh.position.distanceTo(
        gameState.player.mesh.position
      );
      
      if (distance < this.radius + 0.8) {
        this.collect();
      }
    }
  }
  
  collect() {
    if (gameState.player) {
      gameState.player.collectCard();
      
      // Create collection effect
      for (let i = 0; i < 8; i++) {
        const particle = new Particle(
          this.mesh.position.clone(),
          new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            Math.random() * 0.2,
            (Math.random() - 0.5) * 0.1
          ),
          COLORS.card,
          0.5
        );
        gameState.particles.push(particle);
      }
    }
    
    gameState.scene.remove(this.mesh);
    const index = gameState.cards.indexOf(this);
    if (index > -1) {
      gameState.cards.splice(index, 1);
    }
  }
}

// Projectile class
export class Projectile {
  constructor(position, direction, speed = PROJECTILE_SPEED) {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({ 
      color: COLORS.projectile,
      emissive: COLORS.projectile,
      emissiveIntensity: 1.0
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    
    // Add trail effect
    const trailGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const trailMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.projectile,
      transparent: true,
      opacity: 0.3
    });
    this.trail = new THREE.Mesh(trailGeometry, trailMaterial);
    this.mesh.add(this.trail);
    
    this.velocity = direction.normalize().multiplyScalar(speed);
    this.lifetime = 3.0;
    this.age = 0;
    this.damage = 1;
    this.radius = 0.15;
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Update position
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
    
    // Update age
    this.age += deltaTime;
    
    // Fade out over lifetime
    if (this.trail) {
      this.trail.material.opacity = 0.3 * (1 - this.age / this.lifetime);
    }
    
    // Remove if expired
    if (this.age >= this.lifetime) {
      this.destroy();
      return;
    }
    
    // Check collision with demons
    for (const demon of gameState.demons) {
      const distance = this.mesh.position.distanceTo(demon.mesh.position);
      if (distance < this.radius + demon.radius) {
        demon.takeDamage(this.damage);
        this.destroy();
        return;
      }
    }
    
    // Check if out of bounds
    const halfSize = gameState.arenaSize / 2;
    if (Math.abs(this.mesh.position.x) > halfSize ||
        Math.abs(this.mesh.position.z) > halfSize ||
        this.mesh.position.y < 0 || this.mesh.position.y > 50) {
      this.destroy();
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

// Platform class
export class Platform {
  constructor(x, y, z, width, height, depth, color = COLORS.platform) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: 0.8
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    
    this.width = width;
    this.height = height;
    this.depth = depth;
    
    // Add edge glow
    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ 
      color: COLORS.ui,
      linewidth: 2
    });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    this.mesh.add(edges);
    
    gameState.scene.add(this.mesh);
  }
}

// Particle class for visual effects
export class Particle {
  constructor(position, velocity, color, lifetime) {
    const geometry = new THREE.SphereGeometry(0.05, 4, 4);
    const material = new THREE.MeshBasicMaterial({ 
      color: color,
      transparent: true,
      opacity: 1.0
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    
    this.velocity = velocity;
    this.lifetime = lifetime;
    this.age = 0;
    this.initialOpacity = 1.0;
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Update position
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
    
    // Apply gravity
    this.velocity.add(gameState.gravity.clone().multiplyScalar(deltaTime * 60));
    
    // Update age
    this.age += deltaTime;
    
    // Fade out
    const progress = this.age / this.lifetime;
    this.mesh.material.opacity = this.initialOpacity * (1 - progress);
    
    // Scale down
    const scale = 1 - progress * 0.5;
    this.mesh.scale.set(scale, scale, scale);
    
    // Remove if expired
    if (this.age >= this.lifetime) {
      this.destroy();
    }
  }
  
  destroy() {
    gameState.scene.remove(this.mesh);
    const index = gameState.particles.indexOf(this);
    if (index > -1) {
      gameState.particles.splice(index, 1);
    }
  }
}