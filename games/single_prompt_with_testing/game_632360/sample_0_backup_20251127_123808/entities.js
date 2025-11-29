/**
 * Game entity classes
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { 
  gameState, 
  PLAYER_SPEED, 
  PLAYER_JUMP_POWER, 
  PLAYER_SIZE, 
  PLAYER_MAX_HEALTH,
  PLAYER_ATTACK_COOLDOWN,
  PLAYER_SPECIAL_COOLDOWN,
  GROUND_Y,
  ENEMY_BASE_SPEED,
  ENEMY_BASE_HEALTH,
  ENEMY_BASE_DAMAGE,
  ARENA_SIZE,
  logPlayerInfo
} from './globals.js';

/**
 * Player class with movement, combat, and item effects
 */
export class Player {
  constructor(x, y, z) {
    // Create player mesh (character body)
    const bodyGeometry = new THREE.CapsuleGeometry(PLAYER_SIZE * 0.4, PLAYER_SIZE * 1.2, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x00ff00,
      roughness: 0.4,
      metalness: 0.3,
      emissive: 0x00ff00,
      emissiveIntensity: 0.2
    });
    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    // Create weapon attachment
    const weaponGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.8);
    const weaponMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 });
    this.weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    this.weapon.position.set(0.5, 0, 0);
    this.mesh.add(this.weapon);
    
    // Physics properties
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.onGround = false;
    this.canDoubleJump = true;
    
    // Combat properties
    this.health = PLAYER_MAX_HEALTH;
    this.maxHealth = PLAYER_MAX_HEALTH;
    this.damage = 10;
    this.attackCooldown = 0;
    this.specialCooldown = 0;
    this.invulnerableTime = 0;
    
    // Movement properties
    this.speed = PLAYER_SPEED;
    this.facing = new THREE.Vector3(0, 0, -1);
    
    // Item effects
    this.itemEffects = {
      maxHealth: 0,
      speed: 0,
      fireRate: 0,
      damage: 0,
      multishot: 0,
      shield: 0,
      critical: 0,
      explosive: 0
    };
    
    // Visual effects
    this.scale = 1;
    this.targetScale = 1;
    
    // Tracking
    this.lastLoggedPosition = new THREE.Vector3().copy(this.mesh.position);
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Update cooldowns
    if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
    if (this.specialCooldown > 0) this.specialCooldown -= deltaTime;
    if (this.invulnerableTime > 0) this.invulnerableTime -= deltaTime;
    
    // Apply gravity
    if (!this.onGround) {
      this.acceleration.add(gameState.gravity);
    }
    
    // Update velocity
    this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime * 60));
    
    // Apply friction
    if (this.onGround) {
      this.velocity.x *= 0.85;
      this.velocity.z *= 0.85;
    } else {
      this.velocity.x *= 0.98;
      this.velocity.z *= 0.98;
    }
    
    // Clamp velocity
    const maxSpeed = 2;
    const horizontalSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
    if (horizontalSpeed > maxSpeed) {
      const scale = maxSpeed / horizontalSpeed;
      this.velocity.x *= scale;
      this.velocity.z *= scale;
    }
    
    // Update position
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
    
    // Check ground collision
    this.checkGroundCollision();
    
    // Keep player in arena bounds
    this.constrainToArena();
    
    // Update facing direction
    if (this.velocity.x !== 0 || this.velocity.z !== 0) {
      this.facing.set(this.velocity.x, 0, this.velocity.z).normalize();
      const angle = Math.atan2(this.facing.x, this.facing.z);
      this.mesh.rotation.y = angle;
    }
    
    // Visual effects
    this.scale = THREE.MathUtils.lerp(this.scale, this.targetScale, 0.1);
    this.mesh.scale.setScalar(this.scale);
    this.targetScale = 1;
    
    // Invulnerability flash
    if (this.invulnerableTime > 0) {
      this.mesh.material.emissiveIntensity = Math.sin(gameState.frameCount * 0.5) * 0.5 + 0.5;
    } else {
      this.mesh.material.emissiveIntensity = 0.2;
    }
    
    // Reset acceleration
    this.acceleration.set(0, 0, 0);
    
    // Log position periodically
    if (this.mesh.position.distanceTo(this.lastLoggedPosition) > 2) {
      logPlayerInfo(this);
      this.lastLoggedPosition.copy(this.mesh.position);
    }
  }
  
  checkGroundCollision() {
    const playerBottom = this.mesh.position.y - PLAYER_SIZE;
    
    if (playerBottom <= GROUND_Y) {
      this.mesh.position.y = GROUND_Y + PLAYER_SIZE;
      this.velocity.y = Math.max(0, this.velocity.y);
      this.onGround = true;
      this.canDoubleJump = true;
    } else {
      this.onGround = false;
    }
  }
  
  constrainToArena() {
    const maxDist = ARENA_SIZE / 2 - 1;
    this.mesh.position.x = Math.max(-maxDist, Math.min(maxDist, this.mesh.position.x));
    this.mesh.position.z = Math.max(-maxDist, Math.min(maxDist, this.mesh.position.z));
  }
  
  move(direction) {
    const moveSpeed = this.speed * (1 + this.itemEffects.speed * 0.2);
    const force = direction.normalize().multiplyScalar(moveSpeed);
    this.acceleration.add(force);
  }
  
  jump() {
    if (this.onGround) {
      this.velocity.y = PLAYER_JUMP_POWER;
      this.onGround = false;
    } else if (this.canDoubleJump) {
      this.velocity.y = PLAYER_JUMP_POWER * 0.8;
      this.canDoubleJump = false;
    }
  }
  
  attack() {
    const fireRateBonus = 1 + this.itemEffects.fireRate * 0.3;
    const cooldown = PLAYER_ATTACK_COOLDOWN / fireRateBonus;
    
    if (this.attackCooldown <= 0) {
      this.attackCooldown = cooldown;
      
      const numShots = 1 + this.itemEffects.multishot;
      const spreadAngle = 0.3;
      
      for (let i = 0; i < numShots; i++) {
        const offset = (i - (numShots - 1) / 2) * spreadAngle;
        const direction = new THREE.Vector3()
          .copy(this.facing)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), offset);
        
        const startPos = this.mesh.position.clone().add(direction.clone().multiplyScalar(1));
        startPos.y += 0.5;
        
        this.createProjectile(startPos, direction);
      }
      
      // Visual feedback
      this.targetScale = 0.9;
    }
  }
  
  createProjectile(position, direction) {
    const projectile = new Projectile(
      position,
      direction,
      this.damage * (1 + this.itemEffects.damage * 0.5),
      this.itemEffects.critical > 0 ? 0.3 : 0,
      this.itemEffects.explosive > 0
    );
    gameState.projectiles.push(projectile);
  }
  
  useSpecial() {
    if (this.specialCooldown <= 0) {
      this.specialCooldown = PLAYER_SPECIAL_COOLDOWN;
      
      // Create shockwave effect
      const shockwaveRadius = 5;
      for (const enemy of gameState.enemies) {
        const distance = this.mesh.position.distanceTo(enemy.mesh.position);
        if (distance < shockwaveRadius) {
          const damage = 50 * (1 - distance / shockwaveRadius);
          enemy.takeDamage(damage, this.mesh.position);
          
          // Knockback
          const knockback = new THREE.Vector3()
            .subVectors(enemy.mesh.position, this.mesh.position)
            .normalize()
            .multiplyScalar(0.5);
          enemy.velocity.add(knockback);
        }
      }
      
      // Visual effect
      this.createShockwave();
    }
  }
  
  createShockwave() {
    const geometry = new THREE.RingGeometry(0.5, 1, 32);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff, 
      transparent: true, 
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(this.mesh.position);
    ring.position.y = 0.1;
    ring.rotation.x = -Math.PI / 2;
    gameState.scene.add(ring);
    
    // Animate ring
    let scale = 1;
    const animate = () => {
      scale += 0.5;
      ring.scale.setScalar(scale);
      material.opacity = Math.max(0, 1 - scale / 10);
      
      if (scale < 10) {
        requestAnimationFrame(animate);
      } else {
        gameState.scene.remove(ring);
        geometry.dispose();
        material.dispose();
      }
    };
    animate();
  }
  
  takeDamage(amount) {
    if (this.invulnerableTime > 0) return;
    
    // Shield absorbs damage
    if (this.itemEffects.shield > 0) {
      this.itemEffects.shield--;
      this.invulnerableTime = 0.5;
      return;
    }
    
    this.health -= amount;
    this.invulnerableTime = 1.0;
    this.targetScale = 1.2;
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }
  
  collectItem(item) {
    this.itemEffects[item.effect]++;
    
    // Apply item effects
    switch (item.effect) {
      case 'maxHealth':
        this.maxHealth += 20;
        this.health += 20;
        break;
      case 'shield':
        // Shield count is tracked in itemEffects
        break;
    }
    
    gameState.score += 100;
  }
  
  die() {
    gameState.gamePhase = 'GAME_OVER_LOSE';
  }
  
  destroy() {
    gameState.scene.remove(this.mesh);
  }
}

/**
 * Enemy class with AI behavior
 */
export class Enemy {
  constructor(x, y, z, type = 'basic') {
    this.type = type;
    
    // Create enemy mesh based on type
    let geometry, material;
    if (type === 'basic') {
      geometry = new THREE.SphereGeometry(0.6, 16, 16);
      material = new THREE.MeshStandardMaterial({ 
        color: 0xff3333,
        roughness: 0.6,
        emissive: 0xff0000,
        emissiveIntensity: 0.3
      });
    } else if (type === 'fast') {
      geometry = new THREE.ConeGeometry(0.5, 1.2, 8);
      material = new THREE.MeshStandardMaterial({ 
        color: 0xff6600,
        roughness: 0.5,
        emissive: 0xff3300,
        emissiveIntensity: 0.4
      });
    } else if (type === 'tank') {
      geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      material = new THREE.MeshStandardMaterial({ 
        color: 0x990000,
        roughness: 0.8,
        metalness: 0.3,
        emissive: 0x660000,
        emissiveIntensity: 0.2
      });
    }
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    // Physics
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.onGround = false;
    
    // Combat properties based on type and difficulty
    const difficulty = gameState.difficultyMultiplier;
    if (type === 'basic') {
      this.health = ENEMY_BASE_HEALTH * difficulty;
      this.maxHealth = this.health;
      this.damage = ENEMY_BASE_DAMAGE * difficulty;
      this.speed = ENEMY_BASE_SPEED;
      this.detectionRange = 20;
    } else if (type === 'fast') {
      this.health = ENEMY_BASE_HEALTH * 0.6 * difficulty;
      this.maxHealth = this.health;
      this.damage = ENEMY_BASE_DAMAGE * 0.8 * difficulty;
      this.speed = ENEMY_BASE_SPEED * 1.8;
      this.detectionRange = 25;
    } else if (type === 'tank') {
      this.health = ENEMY_BASE_HEALTH * 2.5 * difficulty;
      this.maxHealth = this.health;
      this.damage = ENEMY_BASE_DAMAGE * 1.5 * difficulty;
      this.speed = ENEMY_BASE_SPEED * 0.6;
      this.detectionRange = 18;
    }
    
    // AI state
    this.target = null;
    this.attackCooldown = 0;
    this.stunTime = 0;
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    if (this.stunTime > 0) {
      this.stunTime -= deltaTime;
      this.mesh.rotation.y += 0.2;
      return;
    }
    
    // Update cooldowns
    if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
    
    // Apply gravity
    if (!this.onGround) {
      this.velocity.y += gameState.gravity.y * deltaTime * 60;
    }
    
    // AI behavior
    if (gameState.player) {
      const distance = this.mesh.position.distanceTo(gameState.player.mesh.position);
      
      if (distance < this.detectionRange) {
        // Move towards player
        const direction = new THREE.Vector3()
          .subVectors(gameState.player.mesh.position, this.mesh.position)
          .normalize();
        
        direction.y = 0;
        this.velocity.x += direction.x * this.speed * deltaTime * 60;
        this.velocity.z += direction.z * this.speed * deltaTime * 60;
        
        // Face player
        const angle = Math.atan2(direction.x, direction.z);
        this.mesh.rotation.y = angle;
        
        // Attack if close enough
        if (distance < 1.5 && this.attackCooldown <= 0) {
          this.attack();
        }
      }
    }
    
    // Apply friction
    this.velocity.x *= 0.9;
    this.velocity.z *= 0.9;
    
    // Update position
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
    
    // Ground collision
    const enemyBottom = this.mesh.position.y - 0.6;
    if (enemyBottom <= GROUND_Y) {
      this.mesh.position.y = GROUND_Y + 0.6;
      this.velocity.y = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
    
    // Keep in arena
    const maxDist = ARENA_SIZE / 2 - 1;
    this.mesh.position.x = Math.max(-maxDist, Math.min(maxDist, this.mesh.position.x));
    this.mesh.position.z = Math.max(-maxDist, Math.min(maxDist, this.mesh.position.z));
  }
  
  attack() {
    this.attackCooldown = 1.5;
    if (gameState.player) {
      gameState.player.takeDamage(this.damage);
    }
  }
  
  takeDamage(amount, sourcePos) {
    this.health -= amount;
    
    // Knockback
    if (sourcePos) {
      const knockback = new THREE.Vector3()
        .subVectors(this.mesh.position, sourcePos)
        .normalize()
        .multiplyScalar(0.3);
      this.velocity.add(knockback);
    }
    
    // Visual feedback
    this.mesh.material.emissiveIntensity = 1.0;
    setTimeout(() => {
      if (this.mesh && this.mesh.material) {
        this.mesh.material.emissiveIntensity = 0.3;
      }
    }, 100);
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    // Drop item chance
    const dropChance = 0.3 + gameState.player.itemEffects.critical * 0.1;
    if (Math.random() < dropChance) {
      this.dropItem();
    }
    
    // Create death particles
    this.createDeathEffect();
    
    // Update game state
    gameState.killCount++;
    gameState.score += Math.floor(10 * gameState.difficultyMultiplier);
    
    // Remove from game
    this.destroy();
  }
  
  dropItem() {
    const item = new Item(
      this.mesh.position.x,
      this.mesh.position.y + 1,
      this.mesh.position.z
    );
    gameState.items.push(item);
  }
  
  createDeathEffect() {
    for (let i = 0; i < 8; i++) {
      const particle = new Particle(
        this.mesh.position.clone(),
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          Math.random() * 0.3,
          (Math.random() - 0.5) * 0.3
        ),
        this.mesh.material.color.getHex(),
        0.5
      );
      gameState.particles.push(particle);
    }
  }
  
  destroy() {
    gameState.scene.remove(this.mesh);
    const index = gameState.enemies.indexOf(this);
    if (index > -1) {
      gameState.enemies.splice(index, 1);
    }
  }
}

/**
 * Projectile class
 */
export class Projectile {
  constructor(position, direction, damage, critChance = 0, explosive = false) {
    const geometry = new THREE.SphereGeometry(0.15, 8, 8);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 1.0
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    
    this.velocity = direction.normalize().multiplyScalar(0.8);
    this.damage = damage;
    this.critChance = critChance;
    this.explosive = explosive;
    this.lifetime = 3.0;
    this.age = 0;
    
    // Trail effect
    this.trailPositions = [];
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Update position
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
    
    // Update age
    this.age += deltaTime;
    
    // Trail
    this.trailPositions.push(this.mesh.position.clone());
    if (this.trailPositions.length > 5) {
      this.trailPositions.shift();
    }
    
    // Check lifetime
    if (this.age >= this.lifetime) {
      this.destroy();
      return;
    }
    
    // Check collision with enemies
    for (const enemy of gameState.enemies) {
      const distance = this.mesh.position.distanceTo(enemy.mesh.position);
      if (distance < 0.8) {
        this.hitEnemy(enemy);
        return;
      }
    }
    
    // Check arena bounds
    if (Math.abs(this.mesh.position.x) > ARENA_SIZE / 2 ||
        Math.abs(this.mesh.position.z) > ARENA_SIZE / 2) {
      this.destroy();
    }
  }
  
  hitEnemy(enemy) {
    let finalDamage = this.damage;
    
    // Critical hit
    if (Math.random() < this.critChance) {
      finalDamage *= 2;
      this.createCritEffect();
    }
    
    enemy.takeDamage(finalDamage, this.mesh.position);
    
    // Explosive effect
    if (this.explosive) {
      this.createExplosion();
    }
    
    this.destroy();
  }
  
  createCritEffect() {
    for (let i = 0; i < 4; i++) {
      const particle = new Particle(
        this.mesh.position.clone(),
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          Math.random() * 0.2,
          (Math.random() - 0.5) * 0.2
        ),
        0xffff00,
        0.3
      );
      gameState.particles.push(particle);
    }
  }
  
  createExplosion() {
    const explosionRadius = 3;
    for (const enemy of gameState.enemies) {
      const distance = this.mesh.position.distanceTo(enemy.mesh.position);
      if (distance < explosionRadius) {
        const explosionDamage = this.damage * 0.5 * (1 - distance / explosionRadius);
        enemy.takeDamage(explosionDamage, this.mesh.position);
      }
    }
    
    // Visual effect
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const particle = new Particle(
        this.mesh.position.clone(),
        new THREE.Vector3(
          Math.cos(angle) * 0.3,
          Math.random() * 0.2,
          Math.sin(angle) * 0.3
        ),
        0xff6600,
        0.4
      );
      gameState.particles.push(particle);
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

/**
 * Item class
 */
export class Item {
  constructor(x, y, z, itemType = null) {
    // Random item type if not specified
    if (!itemType) {
      const ITEM_TYPES = [
        { name: 'Health Boost', color: 0x00ff00, effect: 'maxHealth' },
        { name: 'Speed Boost', color: 0x00ffff, effect: 'speed' },
        { name: 'Fire Rate', color: 0xff6600, effect: 'fireRate' },
        { name: 'Damage Up', color: 0xff0000, effect: 'damage' },
        { name: 'Multi-Shot', color: 0xff00ff, effect: 'multishot' },
        { name: 'Shield', color: 0x0066ff, effect: 'shield' },
        { name: 'Critical', color: 0xffff00, effect: 'critical' },
        { name: 'Explosion', color: 0xff9900, effect: 'explosive' }
      ];
      itemType = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
    }
    
    this.name = itemType.name;
    this.effect = itemType.effect;
    this.color = itemType.color;
    
    // Create item mesh
    const geometry = new THREE.OctahedronGeometry(0.4, 0);
    const material = new THREE.MeshStandardMaterial({ 
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.8
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    
    // Physics
    this.velocity = new THREE.Vector3(0, 0.2, 0);
    this.rotationSpeed = 0.03;
    this.bobSpeed = 0.05;
    this.bobAmount = 0.3;
    this.initialY = y;
    this.age = 0;
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    this.age += deltaTime;
    
    // Apply gravity
    this.velocity.y += gameState.gravity.y * deltaTime * 60;
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
    
    // Ground collision
    if (this.mesh.position.y < GROUND_Y + 0.5) {
      this.mesh.position.y = GROUND_Y + 0.5;
      this.velocity.y = 0;
      this.initialY = this.mesh.position.y;
    }
    
    // Rotate
    this.mesh.rotation.y += this.rotationSpeed;
    
    // Bob up and down
    this.mesh.position.y = this.initialY + Math.sin(this.age * this.bobSpeed * 10) * this.bobAmount;
    
    // Pulse emissive
    this.mesh.material.emissiveIntensity = 0.5 + Math.sin(this.age * 5) * 0.3;
    
    // Check collision with player
    if (gameState.player) {
      const distance = this.mesh.position.distanceTo(gameState.player.mesh.position);
      if (distance < 1.2) {
        this.collect();
      }
    }
  }
  
  collect() {
    if (gameState.player) {
      gameState.player.collectItem(this);
    }
    
    // Visual effect
    for (let i = 0; i < 6; i++) {
      const particle = new Particle(
        this.mesh.position.clone(),
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          Math.random() * 0.3,
          (Math.random() - 0.5) * 0.2
        ),
        this.color,
        0.5
      );
      gameState.particles.push(particle);
    }
    
    this.destroy();
  }
  
  destroy() {
    gameState.scene.remove(this.mesh);
    const index = gameState.items.indexOf(this);
    if (index > -1) {
      gameState.items.splice(index, 1);
    }
  }
}

/**
 * Particle effect class
 */
export class Particle {
  constructor(position, velocity, color, lifetime) {
    const geometry = new THREE.SphereGeometry(0.1, 4, 4);
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
    this.age += deltaTime;
    
    // Update position
    this.velocity.y += gameState.gravity.y * deltaTime * 60 * 0.5;
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
    
    // Fade out
    const lifeRatio = this.age / this.lifetime;
    this.mesh.material.opacity = this.initialOpacity * (1 - lifeRatio);
    this.mesh.scale.setScalar(1 - lifeRatio * 0.5);
    
    // Remove when expired
    if (this.age >= this.lifetime) {
      this.destroy();
    }
  }
  
  destroy() {
    gameState.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    const index = gameState.particles.indexOf(this);
    if (index > -1) {
      gameState.particles.splice(index, 1);
    }
  }
}

/**
 * Teleporter class
 */
export class Teleporter {
  constructor(x, y, z) {
    // Create teleporter base
    const baseGeometry = new THREE.CylinderGeometry(2, 2.5, 0.5, 8);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x666666,
      metalness: 0.8,
      roughness: 0.3
    });
    this.base = new THREE.Mesh(baseGeometry, baseMaterial);
    this.base.position.set(x, y, z);
    this.base.receiveShadow = true;
    
    // Create teleporter portal
    const portalGeometry = new THREE.CylinderGeometry(1.5, 1.5, 3, 16, 1, true);
    const portalMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    this.portal = new THREE.Mesh(portalGeometry, portalMaterial);
    this.portal.position.set(x, y + 2, z);
    
    // Create inner glow
    const glowGeometry = new THREE.CylinderGeometry(1.2, 1.2, 2.8, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.3
    });
    this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.glow.position.set(x, y + 2, z);
    
    this.mesh = new THREE.Group();
    this.mesh.add(this.base);
    this.mesh.add(this.portal);
    this.mesh.add(this.glow);
    this.mesh.position.set(x, y, z);
    
    this.age = 0;
    this.activated = false;
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    this.age += deltaTime;
    
    // Rotate portal
    this.portal.rotation.y += 0.02;
    this.glow.rotation.y -= 0.03;
    
    // Pulse effect
    const pulse = Math.sin(this.age * 3) * 0.2 + 0.8;
    this.portal.material.opacity = 0.6 * pulse;
    this.glow.material.opacity = 0.3 * pulse;
    
    // Check if player is near
    if (gameState.player && !this.activated) {
      const distance = this.mesh.position.distanceTo(gameState.player.mesh.position);
      if (distance < 2.5) {
        this.activate();
      }
    }
  }
  
  activate() {
    this.activated = true;
    gameState.gamePhase = 'GAME_OVER_WIN';
  }
  
  destroy() {
    gameState.scene.remove(this.mesh);
  }
}