// entities.js - Game entity classes

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  PLAYER_SIZE,
  PLAYER_SPEED,
  PLAYER_BOOST_SPEED,
  PLAYER_MAX_ENERGY,
  PLAYER_ENERGY_DRAIN,
  PLAYER_ENERGY_REGEN,
  PLAYER_SHIELD_COST,
  PLAYER_BOOST_COST,
  ASTEROID_MIN_SIZE,
  ASTEROID_MAX_SIZE,
  ASTEROID_SPEED,
  DRONE_SIZE,
  DRONE_SPEED,
  DRONE_FIRE_RATE,
  CRYSTAL_SIZE,
  PROJECTILE_SPEED,
  PROJECTILE_SIZE,
  PROJECTILE_LIFETIME
} from './globals.js';
import { 
  clamp, 
  distance, 
  angle, 
  randomRange,
  removeFromArray 
} from './utils.js';
import { 
  checkCircleCollision, 
  keepInBounds 
} from './physics.js';
import { 
  ExplosionEffect, 
  TrailEffect 
} from './particles.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = PLAYER_SIZE;
    this.radius = this.size / 2;
    
    this.vx = 0;
    this.vy = 0;
    this.speed = PLAYER_SPEED;
    this.boostSpeed = PLAYER_BOOST_SPEED;
    
    this.angle = 0;
    this.targetAngle = 0;
    
    this.energy = PLAYER_MAX_ENERGY;
    this.maxEnergy = PLAYER_MAX_ENERGY;
    this.health = 100;
    this.maxHealth = 100;
    
    this.shieldActive = false;
    this.boostActive = false;
    
    this.fireRate = 10;
    this.fireCooldown = 0;
    
    this.lastPosition = { x: x, y: y };
    this.invulnerable = false;
    this.invulnerableTime = 0;
    
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    // Handle invulnerability
    if (this.invulnerable) {
      this.invulnerableTime--;
      if (this.invulnerableTime <= 0) {
        this.invulnerable = false;
      }
    }
    
    // Update velocity based on speed
    const currentSpeed = this.boostActive ? this.boostSpeed : this.speed;
    const maxSpeed = currentSpeed;
    
    // Normalize velocity if moving
    const currentVelocity = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (currentVelocity > maxSpeed) {
      this.vx = (this.vx / currentVelocity) * maxSpeed;
      this.vy = (this.vy / currentVelocity) * maxSpeed;
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Apply friction
    this.vx *= 0.9;
    this.vy *= 0.9;
    
    // Keep in bounds
    keepInBounds(this, 0);
    
    // Update angle to face movement direction
    if (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
      this.targetAngle = Math.atan2(this.vy, this.vx);
    }
    
    // Smooth angle transition
    let angleDiff = this.targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.angle += angleDiff * 0.2;
    
    // Energy management
    if (this.shieldActive) {
      this.energy -= PLAYER_SHIELD_COST;
      if (this.energy <= 0) {
        this.energy = 0;
        this.shieldActive = false;
      }
    } else if (this.boostActive) {
      this.energy -= PLAYER_BOOST_COST;
      if (this.energy <= 0) {
        this.energy = 0;
        this.boostActive = false;
      }
    } else {
      this.energy = Math.min(this.maxEnergy, this.energy + PLAYER_ENERGY_REGEN);
    }
    
    // Energy drain over time
    this.energy = Math.max(0, this.energy - PLAYER_ENERGY_DRAIN);
    
    // Fire cooldown
    if (this.fireCooldown > 0) {
      this.fireCooldown--;
    }
    
    // Trail effect when moving
    if (Math.abs(this.vx) > 0.5 || Math.abs(this.vy) > 0.5) {
      if (gameState.frameCount % 3 === 0) {
        const trailX = this.x - Math.cos(this.angle) * this.radius;
        const trailY = this.y - Math.sin(this.angle) * this.radius;
        new TrailEffect(trailX, trailY, [100, 200, 255], 3);
      }
    }
    
    // Log position changes
    if (Math.abs(this.x - this.lastPosition.x) > 1 || 
        Math.abs(this.y - this.lastPosition.y) > 1) {
      this.logPosition(p);
      this.lastPosition.x = this.x;
      this.lastPosition.y = this.y;
    }
    
    // Check if energy depleted
    if (this.energy <= 0 && !this.invulnerable) {
      this.die();
    }
  }
  
  moveLeft() {
    this.vx -= 0.8;
  }
  
  moveRight() {
    this.vx += 0.8;
  }
  
  moveUp() {
    this.vy -= 0.8;
  }
  
  moveDown() {
    this.vy += 0.8;
  }
  
  activateShield() {
    if (this.energy > 10) {
      this.shieldActive = true;
    }
  }
  
  deactivateShield() {
    this.shieldActive = false;
  }
  
  activateBoost() {
    if (this.energy > 5) {
      this.boostActive = true;
    }
  }
  
  deactivateBoost() {
    this.boostActive = false;
  }
  
  fire() {
    if (this.fireCooldown <= 0 && this.energy > 5) {
      const projectileX = this.x + Math.cos(this.angle) * this.radius;
      const projectileY = this.y + Math.sin(this.angle) * this.radius;
      
      new Projectile(
        projectileX,
        projectileY,
        Math.cos(this.angle) * PROJECTILE_SPEED,
        Math.sin(this.angle) * PROJECTILE_SPEED,
        true
      );
      
      this.fireCooldown = this.fireRate;
      this.energy -= 2;
    }
  }
  
  takeDamage(amount) {
    if (this.invulnerable) return;
    
    if (this.shieldActive) {
      // Shield absorbs damage
      return;
    }
    
    this.health -= amount;
    this.invulnerable = true;
    this.invulnerableTime = 60;
    
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }
  
  die() {
    new ExplosionEffect(this.x, this.y, [100, 200, 255], 30);
    gameState.gamePhase = "GAME_OVER_LOSE";
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: this.x,
        screen_y: this.y,
        game_x: this.x,
        game_y: this.y,
        energy: this.energy,
        health: this.health,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    
    // Shield effect
    if (this.shieldActive) {
      p.noFill();
      p.stroke(100, 200, 255, 150);
      p.strokeWeight(3);
      p.circle(0, 0, this.size * 2);
    }
    
    // Invulnerability flicker
    if (this.invulnerable && gameState.frameCount % 6 < 3) {
      p.pop();
      return;
    }
    
    // Ship body (triangle pointing forward)
    p.fill(100, 200, 255);
    p.stroke(50, 150, 255);
    p.strokeWeight(2);
    p.triangle(
      this.radius, 0,
      -this.radius, -this.radius * 0.6,
      -this.radius, this.radius * 0.6
    );
    
    // Wing details
    p.fill(80, 180, 235);
    p.triangle(
      -this.radius * 0.5, -this.radius * 0.6,
      -this.radius, -this.radius * 0.6,
      -this.radius * 0.7, -this.radius * 0.3
    );
    p.triangle(
      -this.radius * 0.5, this.radius * 0.6,
      -this.radius, this.radius * 0.6,
      -this.radius * 0.7, this.radius * 0.3
    );
    
    // Cockpit
    p.fill(200, 230, 255);
    p.circle(0, 0, this.radius * 0.5);
    
    // Engine glow
    if (this.boostActive) {
      p.noStroke();
      p.fill(255, 150, 50, 200);
      p.circle(-this.radius * 0.8, 0, this.radius * 0.8);
    }
    
    p.pop();
  }
}

export class Asteroid {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.size = randomRange(ASTEROID_MIN_SIZE, ASTEROID_MAX_SIZE);
    this.radius = this.size / 2;
    
    this.vx = vx || randomRange(-ASTEROID_SPEED, ASTEROID_SPEED);
    this.vy = vy || randomRange(-ASTEROID_SPEED, ASTEROID_SPEED);
    
    this.rotation = randomRange(0, Math.PI * 2);
    this.rotationSpeed = randomRange(-0.02, 0.02);
    
    this.health = Math.floor(this.size / 10) + 1;
    this.mass = this.size / 10;
    
    // Create irregular shape
    this.vertices = [];
    const vertexCount = 8;
    for (let i = 0; i < vertexCount; i++) {
      const angle = (Math.PI * 2 * i) / vertexCount;
      const radiusVariation = randomRange(0.7, 1.0);
      this.vertices.push({
        angle: angle,
        radius: this.radius * radiusVariation
      });
    }
    
    gameState.asteroids.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    
    // Wrap around screen
    if (this.x < -this.size) this.x = CANVAS_WIDTH + this.size;
    if (this.x > CANVAS_WIDTH + this.size) this.x = -this.size;
    if (this.y < -this.size) this.y = CANVAS_HEIGHT + this.size;
    if (this.y > CANVAS_HEIGHT + this.size) this.y = -this.size;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.destroy();
    }
  }
  
  destroy() {
    new ExplosionEffect(this.x, this.y, [150, 150, 150], 15);
    
    gameState.score += Math.floor(this.size);
    gameState.asteroidsDestroyed++;
    
    // Spawn smaller asteroids
    if (this.size > ASTEROID_MIN_SIZE + 10) {
      const newSize = this.size * 0.6;
      for (let i = 0; i < 2; i++) {
        const angle = randomRange(0, Math.PI * 2);
        const speed = ASTEROID_SPEED * 1.5;
        const newAsteroid = new Asteroid(
          this.x,
          this.y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        );
        newAsteroid.size = newSize;
        newAsteroid.radius = newSize / 2;
      }
    }
    
    removeFromArray(gameState.asteroids, this);
    removeFromArray(gameState.entities, this);
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    
    p.fill(120, 120, 130);
    p.stroke(80, 80, 90);
    p.strokeWeight(2);
    
    p.beginShape();
    this.vertices.forEach(v => {
      const x = Math.cos(v.angle) * v.radius;
      const y = Math.sin(v.angle) * v.radius;
      p.vertex(x, y);
    });
    p.endShape(p.CLOSE);
    
    // Craters
    p.fill(100, 100, 110);
    p.noStroke();
    p.circle(this.radius * 0.3, this.radius * 0.2, this.radius * 0.3);
    p.circle(-this.radius * 0.4, -this.radius * 0.3, this.radius * 0.2);
    
    p.pop();
  }
}

export class Drone {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = DRONE_SIZE;
    this.radius = this.size / 2;
    
    this.vx = 0;
    this.vy = 0;
    this.speed = DRONE_SPEED;
    
    this.angle = 0;
    this.health = 30;
    this.damage = 15;
    
    this.fireRate = DRONE_FIRE_RATE;
    this.fireCooldown = randomRange(0, this.fireRate);
    
    this.detectionRange = 250;
    this.attackRange = 200;
    
    this.state = 'patrol'; // patrol, chase, attack
    this.patrolAngle = randomRange(0, Math.PI * 2);
    this.patrolChangeTimer = 0;
    
    gameState.drones.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    if (!gameState.player) return;
    
    const dist = distance(this.x, this.y, gameState.player.x, gameState.player.y);
    
    // State machine
    if (dist < this.attackRange) {
      this.state = 'attack';
    } else if (dist < this.detectionRange) {
      this.state = 'chase';
    } else {
      this.state = 'patrol';
    }
    
    // Behavior based on state
    switch (this.state) {
      case 'patrol':
        this.patrol();
        break;
      case 'chase':
        this.chase();
        break;
      case 'attack':
        this.attack();
        break;
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Apply friction
    this.vx *= 0.95;
    this.vy *= 0.95;
    
    // Keep in bounds
    keepInBounds(this, 20);
    
    // Update angle
    if (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
      this.angle = Math.atan2(this.vy, this.vx);
    }
    
    // Fire cooldown
    if (this.fireCooldown > 0) {
      this.fireCooldown--;
    }
  }
  
  patrol() {
    this.patrolChangeTimer++;
    if (this.patrolChangeTimer > 120) {
      this.patrolAngle = randomRange(0, Math.PI * 2);
      this.patrolChangeTimer = 0;
    }
    
    this.vx += Math.cos(this.patrolAngle) * 0.1;
    this.vy += Math.sin(this.patrolAngle) * 0.1;
  }
  
  chase() {
    const angleToPlayer = angle(this.x, this.y, gameState.player.x, gameState.player.y);
    this.vx += Math.cos(angleToPlayer) * 0.3;
    this.vy += Math.sin(angleToPlayer) * 0.3;
  }
  
  attack() {
    // Circle around player
    const angleToPlayer = angle(this.x, this.y, gameState.player.x, gameState.player.y);
    const perpendicularAngle = angleToPlayer + Math.PI / 2;
    
    this.vx += Math.cos(perpendicularAngle) * 0.2;
    this.vy += Math.sin(perpendicularAngle) * 0.2;
    
    // Fire at player
    if (this.fireCooldown <= 0) {
      this.fire();
      this.fireCooldown = this.fireRate;
    }
  }
  
  fire() {
    if (!gameState.player) return;
    
    const angleToPlayer = angle(this.x, this.y, gameState.player.x, gameState.player.y);
    const projectileX = this.x + Math.cos(angleToPlayer) * this.radius;
    const projectileY = this.y + Math.sin(angleToPlayer) * this.radius;
    
    new Projectile(
      projectileX,
      projectileY,
      Math.cos(angleToPlayer) * (PROJECTILE_SPEED * 0.7),
      Math.sin(angleToPlayer) * (PROJECTILE_SPEED * 0.7),
      false
    );
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.destroy();
    }
  }
  
  destroy() {
    new ExplosionEffect(this.x, this.y, [255, 100, 100], 20);
    
    gameState.score += 50;
    gameState.enemiesDestroyed++;
    
    removeFromArray(gameState.drones, this);
    removeFromArray(gameState.entities, this);
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    
    // Main body
    p.fill(200, 50, 50);
    p.stroke(150, 30, 30);
    p.strokeWeight(2);
    p.circle(0, 0, this.size);
    
    // Wings
    p.fill(150, 40, 40);
    p.triangle(
      0, 0,
      -this.radius * 1.2, -this.radius * 0.8,
      -this.radius * 0.5, 0
    );
    p.triangle(
      0, 0,
      -this.radius * 1.2, this.radius * 0.8,
      -this.radius * 0.5, 0
    );
    
    // Eye/sensor
    p.fill(255, 200, 100);
    p.noStroke();
    p.circle(this.radius * 0.3, 0, this.radius * 0.5);
    
    // Warning light
    if (this.state === 'attack' && gameState.frameCount % 20 < 10) {
      p.fill(255, 0, 0);
      p.circle(0, -this.radius * 0.5, this.radius * 0.3);
    }
    
    p.pop();
  }
}

export class Crystal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = CRYSTAL_SIZE;
    this.radius = this.size / 2;
    
    this.rotation = 0;
    this.rotationSpeed = 0.02;
    this.bobOffset = 0;
    this.bobSpeed = 0.05;
    this.initialY = y;
    
    this.color = [255, 200, 100];
    this.glowIntensity = 0;
    
    gameState.crystals.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    this.rotation += this.rotationSpeed;
    this.bobOffset = Math.sin(p.frameCount * this.bobSpeed) * 5;
    this.y = this.initialY + this.bobOffset;
    
    this.glowIntensity = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
    
    // Check collision with player
    if (gameState.player && checkCircleCollision(this, gameState.player)) {
      this.collect();
    }
  }
  
  collect() {
    new ExplosionEffect(this.x, this.y, [255, 255, 100], 20);
    
    gameState.score += 100;
    gameState.crystalsCollected++;
    
    // Restore player energy
    if (gameState.player) {
      gameState.player.energy = Math.min(
        gameState.player.maxEnergy,
        gameState.player.energy + 20
      );
    }
    
    // Check win condition
    if (gameState.crystalsCollected >= gameState.totalCrystals) {
      gameState.gamePhase = "GAME_OVER_WIN";
    }
    
    removeFromArray(gameState.crystals, this);
    removeFromArray(gameState.entities, this);
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    
    // Glow effect
    p.noStroke();
    p.fill(255, 255, 100, this.glowIntensity * 100);
    p.circle(0, 0, this.size * 2);
    
    // Crystal shape
    p.fill(255, 220, 100);
    p.stroke(255, 200, 50);
    p.strokeWeight(2);
    
    // Draw crystal as hexagon
    p.beginShape();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const x = Math.cos(angle) * this.radius;
      const y = Math.sin(angle) * this.radius;
      p.vertex(x, y);
    }
    p.endShape(p.CLOSE);
    
    // Inner detail
    p.fill(255, 240, 150);
    p.noStroke();
    p.circle(0, 0, this.radius * 0.5);
    
    p.pop();
  }
}

export class Projectile {
  constructor(x, y, vx, vy, isPlayerProjectile) {
    this.x = x;
    this.y = y;
    this.size = PROJECTILE_SIZE;
    this.radius = this.size / 2;
    
    this.vx = vx;
    this.vy = vy;
    
    this.lifetime = PROJECTILE_LIFETIME;
    this.age = 0;
    
    this.damage = 10;
    this.isPlayerProjectile = isPlayerProjectile;
    
    if (isPlayerProjectile) {
      gameState.projectiles.push(this);
    } else {
      gameState.enemyProjectiles.push(this);
    }
    gameState.entities.push(this);
  }
  
  update(p) {
    this.x += this.vx;
    this.y += this.vy;
    this.age++;
    
    // Trail effect
    if (gameState.frameCount % 2 === 0) {
      const color = this.isPlayerProjectile ? [100, 200, 255] : [255, 100, 100];
      new TrailEffect(this.x, this.y, color, 2);
    }
    
    // Remove if expired or out of bounds
    if (this.age >= this.lifetime || 
        this.x < 0 || this.x > CANVAS_WIDTH ||
        this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.destroy();
      return;
    }
    
    // Check collisions
    if (this.isPlayerProjectile) {
      // Check collision with asteroids
      for (const asteroid of gameState.asteroids) {
        if (checkCircleCollision(this, asteroid)) {
          asteroid.takeDamage(this.damage);
          this.destroy();
          return;
        }
      }
      
      // Check collision with drones
      for (const drone of gameState.drones) {
        if (checkCircleCollision(this, drone)) {
          drone.takeDamage(this.damage);
          this.destroy();
          return;
        }
      }
    } else {
      // Enemy projectile - check collision with player
      if (gameState.player && checkCircleCollision(this, gameState.player)) {
        gameState.player.takeDamage(this.damage);
        this.destroy();
        return;
      }
    }
  }
  
  destroy() {
    if (this.isPlayerProjectile) {
      removeFromArray(gameState.projectiles, this);
    } else {
      removeFromArray(gameState.enemyProjectiles, this);
    }
    removeFromArray(gameState.entities, this);
  }
  
  render(p) {
    const color = this.isPlayerProjectile ? [100, 200, 255] : [255, 100, 100];
    
    p.push();
    p.noStroke();
    
    // Outer glow
    p.fill(color[0], color[1], color[2], 100);
    p.circle(this.x, this.y, this.size * 2);
    
    // Core
    p.fill(color[0], color[1], color[2]);
    p.circle(this.x, this.y, this.size);
    
    p.pop();
  }
}