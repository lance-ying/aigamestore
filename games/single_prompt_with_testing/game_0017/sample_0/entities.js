// entities.js - Game entities

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, SPELL_TYPES, ELEMENT_TYPES } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 12;
    this.height = 16;
    this.health = 100;
    this.maxHealth = 100;
    this.onGround = false;
    this.speed = 2.5;
    this.jumpPower = -8;
    this.gravity = 0.4;
    this.facingRight = true;
    this.castCooldown = 0;
    this.canCastSecondary = false;
    this.invulnerableFrames = 0;
  }
  
  update(p, keys) {
    // Apply gravity
    this.vy += this.gravity;
    
    // Terminal velocity
    if (this.vy > 10) this.vy = 10;
    
    // Horizontal movement
    this.vx = 0;
    if (keys.left) {
      this.vx = -this.speed;
      this.facingRight = false;
    }
    if (keys.right) {
      this.vx = this.speed;
      this.facingRight = true;
    }
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Collision with terrain
    this.handleTerrainCollision();
    
    // Keep in bounds
    if (this.x < 0) this.x = 0;
    if (this.x > CANVAS_WIDTH - this.width) this.x = CANVAS_WIDTH - this.width;
    
    // Cooldowns
    if (this.castCooldown > 0) this.castCooldown--;
    if (this.invulnerableFrames > 0) this.invulnerableFrames--;
    
    // Check room transition
    if (this.y > gameState.cameraY + CANVAS_HEIGHT) {
      gameState.currentRoom++;
      gameState.cameraY += gameState.roomHeight;
      this.y = gameState.cameraY + 10;
      gameState.depth++;
      
      if (gameState.currentRoom >= gameState.totalRooms) {
        gameState.gamePhase = "GAME_OVER_WIN";
      }
    }
  }
  
  handleTerrainCollision() {
    this.onGround = false;
    
    for (const terrain of gameState.terrain) {
      if (this.collidesWith(terrain)) {
        if (terrain.type === 'platform') {
          // Only collide from top
          if (this.vy > 0 && this.y + this.height - this.vy <= terrain.y) {
            this.y = terrain.y - this.height;
            this.vy = 0;
            this.onGround = true;
          }
        } else {
          // Solid block collision
          const overlapX = Math.min(this.x + this.width - terrain.x, terrain.x + terrain.width - this.x);
          const overlapY = Math.min(this.y + this.height - terrain.y, terrain.y + terrain.height - this.y);
          
          if (overlapX < overlapY) {
            // Horizontal collision
            if (this.x < terrain.x) {
              this.x = terrain.x - this.width;
            } else {
              this.x = terrain.x + terrain.width;
            }
            this.vx = 0;
          } else {
            // Vertical collision
            if (this.y < terrain.y) {
              this.y = terrain.y - this.height;
              this.vy = 0;
              this.onGround = true;
            } else {
              this.y = terrain.y + terrain.height;
              this.vy = 0;
            }
          }
        }
      }
    }
  }
  
  collidesWith(terrain) {
    return this.x < terrain.x + terrain.width &&
           this.x + this.width > terrain.x &&
           this.y < terrain.y + terrain.height &&
           this.y + this.height > terrain.y;
  }
  
  castSpell(p, spellType) {
    if (this.castCooldown > 0) return;
    
    this.castCooldown = 15;
    const dir = this.facingRight ? 1 : -1;
    const startX = this.x + this.width / 2 + dir * 10;
    const startY = this.y + this.height / 2;
    
    if (spellType === SPELL_TYPES.FIRE) {
      gameState.projectiles.push(new Projectile(startX, startY, dir * 5, 0, spellType, 60));
    } else if (spellType === SPELL_TYPES.ICE) {
      gameState.projectiles.push(new Projectile(startX, startY, dir * 4, 0, spellType, 50));
    } else if (spellType === SPELL_TYPES.EXPLOSION) {
      gameState.projectiles.push(new Projectile(startX, startY, dir * 3, -1, spellType, 40));
    } else if (spellType === SPELL_TYPES.WATER) {
      gameState.projectiles.push(new Projectile(startX, startY, dir * 4, 2, spellType, 45));
    }
  }
  
  takeDamage(amount) {
    if (this.invulnerableFrames > 0) return;
    
    this.health -= amount;
    this.invulnerableFrames = 30;
    
    if (this.health <= 0) {
      this.health = 0;
      gameState.gamePhase = "GAME_OVER_LOSE";
    }
  }
  
  draw(p) {
    p.push();
    p.translate(0, -gameState.cameraY);
    
    // Invulnerability flash
    if (this.invulnerableFrames > 0 && Math.floor(this.invulnerableFrames / 5) % 2 === 0) {
      p.tint(255, 100, 100);
    }
    
    // Body
    p.fill(120, 80, 140);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Hat
    p.fill(60, 40, 80);
    p.triangle(
      this.x, this.y,
      this.x + this.width, this.y,
      this.x + this.width / 2, this.y - 8
    );
    
    // Face
    p.fill(220, 180, 140);
    p.rect(this.x + 2, this.y + 4, this.width - 4, 6);
    
    // Eyes
    p.fill(0);
    const eyeX = this.facingRight ? this.x + 7 : this.x + 3;
    p.rect(eyeX, this.y + 6, 2, 2);
    
    // Staff
    p.stroke(101, 67, 33);
    p.strokeWeight(2);
    const staffX = this.facingRight ? this.x + this.width : this.x;
    p.line(staffX, this.y + 8, staffX + (this.facingRight ? 6 : -6), this.y + this.height);
    
    // Spell orb on staff
    const spellColor = this.getSpellColor(gameState.spellsCollected[gameState.currentSpellIndex]);
    p.fill(...spellColor);
    p.noStroke();
    p.circle(staffX + (this.facingRight ? 6 : -6), this.y + 8, 4);
    
    p.pop();
  }
  
  getSpellColor(spellType) {
    switch (spellType) {
      case SPELL_TYPES.FIRE: return [255, 100, 0];
      case SPELL_TYPES.ICE: return [100, 200, 255];
      case SPELL_TYPES.EXPLOSION: return [255, 255, 0];
      case SPELL_TYPES.WATER: return [0, 100, 255];
      default: return [255, 255, 255];
    }
  }
}

export class Enemy {
  constructor(x, y, type = 'basic') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 14;
    this.height = 14;
    this.health = type === 'basic' ? 30 : 50;
    this.maxHealth = this.health;
    this.vx = 0;
    this.vy = 0;
    this.speed = type === 'basic' ? 1.2 : 0.8;
    this.gravity = 0.4;
    this.onGround = false;
    this.attackCooldown = 0;
    this.moveTimer = Math.floor(Math.random() * 60) + 30;
    this.moveDir = Math.random() < 0.5 ? -1 : 1;
    this.alive = true;
  }
  
  update(p) {
    if (!this.alive) return;
    
    // Apply gravity
    this.vy += this.gravity;
    if (this.vy > 10) this.vy = 10;
    
    // AI movement
    this.moveTimer--;
    if (this.moveTimer <= 0) {
      this.moveTimer = Math.floor(Math.random() * 60) + 30;
      this.moveDir *= -1;
    }
    
    // Move toward player
    if (gameState.player) {
      const dx = gameState.player.x - this.x;
      const distance = Math.abs(dx);
      
      if (distance < 150) {
        this.vx = dx > 0 ? this.speed : -this.speed;
      } else {
        this.vx = this.moveDir * this.speed;
      }
    } else {
      this.vx = this.moveDir * this.speed;
    }
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Collision with terrain
    this.handleTerrainCollision();
    
    // Keep in bounds
    if (this.x < 0) {
      this.x = 0;
      this.moveDir = 1;
    }
    if (this.x > CANVAS_WIDTH - this.width) {
      this.x = CANVAS_WIDTH - this.width;
      this.moveDir = -1;
    }
    
    // Attack player
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    } else if (gameState.player && this.collidesWith(gameState.player)) {
      gameState.player.takeDamage(10);
      this.attackCooldown = 60;
    }
  }
  
  handleTerrainCollision() {
    this.onGround = false;
    
    for (const terrain of gameState.terrain) {
      if (this.collidesWith(terrain)) {
        if (terrain.type === 'platform') {
          if (this.vy > 0 && this.y + this.height - this.vy <= terrain.y) {
            this.y = terrain.y - this.height;
            this.vy = 0;
            this.onGround = true;
          }
        } else {
          const overlapX = Math.min(this.x + this.width - terrain.x, terrain.x + terrain.width - this.x);
          const overlapY = Math.min(this.y + this.height - terrain.y, terrain.y + terrain.height - this.y);
          
          if (overlapX < overlapY) {
            if (this.x < terrain.x) {
              this.x = terrain.x - this.width;
            } else {
              this.x = terrain.x + terrain.width;
            }
            this.vx = 0;
            this.moveDir *= -1;
          } else {
            if (this.y < terrain.y) {
              this.y = terrain.y - this.height;
              this.vy = 0;
              this.onGround = true;
            } else {
              this.y = terrain.y + terrain.height;
              this.vy = 0;
            }
          }
        }
      }
    }
  }
  
  collidesWith(other) {
    return this.x < other.x + other.width &&
           this.x + this.width > other.x &&
           this.y < other.y + other.height &&
           this.y + this.height > other.y;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.alive = false;
      gameState.score += this.type === 'basic' ? 100 : 200;
      gameState.enemiesDefeated++;
      
      // Drop pickup
      if (Math.random() < 0.3) {
        gameState.pickups.push(new Pickup(this.x + this.width / 2, this.y + this.height / 2));
      }
    }
  }
  
  draw(p) {
    if (!this.alive) return;
    
    p.push();
    p.translate(0, -gameState.cameraY);
    
    // Body
    const bodyColor = this.type === 'basic' ? [180, 50, 50] : [50, 180, 50];
    p.fill(...bodyColor);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Eyes
    p.fill(255, 0, 0);
    p.circle(this.x + 4, this.y + 4, 3);
    p.circle(this.x + 10, this.y + 4, 3);
    
    // Health bar
    if (this.health < this.maxHealth) {
      p.fill(255, 0, 0);
      p.rect(this.x, this.y - 5, this.width, 2);
      p.fill(0, 255, 0);
      p.rect(this.x, this.y - 5, this.width * (this.health / this.maxHealth), 2);
    }
    
    p.pop();
  }
}

export class Projectile {
  constructor(x, y, vx, vy, spellType, lifetime) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.spellType = spellType;
    this.lifetime = lifetime;
    this.radius = 4;
    this.alive = true;
  }
  
  update(p) {
    this.x += this.vx;
    this.y += this.vy;
    
    // Gravity for some spells
    if (this.spellType === SPELL_TYPES.EXPLOSION) {
      this.vy += 0.2;
    }
    
    this.lifetime--;
    if (this.lifetime <= 0) {
      this.explode();
      this.alive = false;
    }
    
    // Check wall collision
    if (this.x < 0 || this.x > CANVAS_WIDTH || this.y < gameState.cameraY || this.y > gameState.cameraY + CANVAS_HEIGHT) {
      this.explode();
      this.alive = false;
    }
    
    // Check terrain collision
    for (const terrain of gameState.terrain) {
      if (terrain.type !== 'platform' && this.collidesWithRect(terrain)) {
        this.explode();
        this.alive = false;
        
        // Destroy destructible terrain
        if (terrain.destructible && (this.spellType === SPELL_TYPES.FIRE || this.spellType === SPELL_TYPES.EXPLOSION)) {
          terrain.health -= 20;
          if (terrain.health <= 0) {
            const idx = gameState.terrain.indexOf(terrain);
            if (idx !== -1) gameState.terrain.splice(idx, 1);
          }
        }
        break;
      }
    }
    
    // Check enemy collision
    for (const enemy of gameState.entities) {
      if (enemy instanceof Enemy && enemy.alive && this.collidesWithRect(enemy)) {
        const damage = this.spellType === SPELL_TYPES.EXPLOSION ? 30 : 15;
        enemy.takeDamage(damage);
        this.explode();
        this.alive = false;
        break;
      }
    }
  }
  
  collidesWithRect(rect) {
    return this.x > rect.x && this.x < rect.x + rect.width &&
           this.y > rect.y && this.y < rect.y + rect.height;
  }
  
  explode() {
    // Create particles
    const numParticles = 8;
    for (let i = 0; i < numParticles; i++) {
      const angle = (i / numParticles) * Math.PI * 2;
      const speed = 2 + Math.random() * 2;
      gameState.particles.push(new Particle(
        this.x, this.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        this.spellType
      ));
    }
    
    // Add to cellular automata
    if (gameState.cellularGrid) {
      const elementType = this.getElementType();
      const radius = this.spellType === SPELL_TYPES.EXPLOSION ? 8 : 4;
      gameState.cellularGrid.addCircle(Math.floor(this.x), Math.floor(this.y - gameState.cameraY), radius, elementType);
    }
  }
  
  getElementType() {
    switch (this.spellType) {
      case SPELL_TYPES.FIRE: return ELEMENT_TYPES.FIRE;
      case SPELL_TYPES.ICE: return ELEMENT_TYPES.ICE;
      case SPELL_TYPES.WATER: return ELEMENT_TYPES.WATER;
      case SPELL_TYPES.EXPLOSION: return ELEMENT_TYPES.FIRE;
      default: return ELEMENT_TYPES.EMPTY;
    }
  }
  
  draw(p) {
    p.push();
    p.translate(0, -gameState.cameraY);
    
    const color = this.getColor();
    p.fill(...color);
    p.noStroke();
    p.circle(this.x, this.y, this.radius * 2);
    
    // Trail effect
    p.fill(...color, 100);
    p.circle(this.x - this.vx, this.y - this.vy, this.radius);
    
    p.pop();
  }
  
  getColor() {
    switch (this.spellType) {
      case SPELL_TYPES.FIRE: return [255, 150, 0];
      case SPELL_TYPES.ICE: return [150, 220, 255];
      case SPELL_TYPES.EXPLOSION: return [255, 255, 100];
      case SPELL_TYPES.WATER: return [50, 150, 255];
      default: return [255, 255, 255];
    }
  }
}

export class Particle {
  constructor(x, y, vx, vy, type) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type;
    this.lifetime = 20 + Math.floor(Math.random() * 20);
    this.maxLifetime = this.lifetime;
    this.size = 2 + Math.random() * 2;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1;
    this.vx *= 0.98;
    this.lifetime--;
  }
  
  draw(p) {
    const alpha = (this.lifetime / this.maxLifetime) * 255;
    const color = this.getColor();
    
    p.push();
    p.translate(0, -gameState.cameraY);
    p.fill(...color, alpha);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
    p.pop();
  }
  
  getColor() {
    switch (this.type) {
      case SPELL_TYPES.FIRE: return [255, 100, 0];
      case SPELL_TYPES.ICE: return [100, 200, 255];
      case SPELL_TYPES.EXPLOSION: return [255, 200, 0];
      case SPELL_TYPES.WATER: return [0, 150, 255];
      default: return [255, 255, 255];
    }
  }
}

export class Pickup {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 10;
    this.vy = 0;
    this.gravity = 0.3;
    this.onGround = false;
    this.alive = true;
    this.bobOffset = Math.random() * Math.PI * 2;
    
    // Determine pickup type
    const rand = Math.random();
    if (rand < 0.3) {
      this.pickupType = 'health';
    } else if (rand < 0.6 && !gameState.spellsCollected.includes(SPELL_TYPES.ICE)) {
      this.pickupType = 'spell_ice';
    } else if (rand < 0.75 && !gameState.spellsCollected.includes(SPELL_TYPES.WATER)) {
      this.pickupType = 'spell_water';
    } else if (rand < 0.85 && !gameState.spellsCollected.includes(SPELL_TYPES.EXPLOSION)) {
      this.pickupType = 'spell_explosion';
    } else {
      this.pickupType = 'health';
    }
  }
  
  update(p) {
    if (!this.onGround) {
      this.vy += this.gravity;
      this.y += this.vy;
      
      // Terrain collision
      for (const terrain of gameState.terrain) {
        if (this.collidesWith(terrain)) {
          this.y = terrain.y - this.height;
          this.vy = 0;
          this.onGround = true;
        }
      }
    }
    
    // Check player collision
    if (gameState.player && this.collidesWith(gameState.player)) {
      this.collect();
    }
  }
  
  collidesWith(other) {
    return this.x < other.x + other.width &&
           this.x + this.width > other.x &&
           this.y < other.y + other.height &&
           this.y + this.height > other.y;
  }
  
  collect() {
    if (this.pickupType === 'health') {
      gameState.player.health = Math.min(gameState.player.health + 30, gameState.player.maxHealth);
      gameState.score += 50;
    } else if (this.pickupType.startsWith('spell_')) {
      const spellType = this.pickupType.split('_')[1].toUpperCase();
      if (!gameState.spellsCollected.includes(spellType)) {
        gameState.spellsCollected.push(spellType);
        gameState.score += 200;
        if (gameState.spellsCollected.length > 1) {
          gameState.player.canCastSecondary = true;
        }
      }
    }
    this.alive = false;
  }
  
  draw(p, frameCount) {
    p.push();
    p.translate(0, -gameState.cameraY);
    
    const bobAmount = Math.sin(frameCount * 0.1 + this.bobOffset) * 3;
    
    if (this.pickupType === 'health') {
      p.fill(255, 100, 100);
      p.rect(this.x, this.y + bobAmount, this.width, this.height);
      p.fill(255);
      p.rect(this.x + 3, this.y + bobAmount + 4, 4, 2);
      p.rect(this.x + 4, this.y + bobAmount + 3, 2, 4);
    } else {
      const color = this.getSpellColor();
      p.fill(...color);
      p.circle(this.x + this.width / 2, this.y + this.height / 2 + bobAmount, this.width);
      p.fill(255, 255, 255, 150);
      p.circle(this.x + this.width / 2, this.y + this.height / 2 + bobAmount, this.width / 2);
    }
    
    p.pop();
  }
  
  getSpellColor() {
    if (this.pickupType === 'spell_ice') return [100, 200, 255];
    if (this.pickupType === 'spell_water') return [0, 150, 255];
    if (this.pickupType === 'spell_explosion') return [255, 200, 0];
    return [255, 255, 255];
  }
}