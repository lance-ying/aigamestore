// entities.js
import { 
  PLAYER_SIZE, ENEMY_SIZE, GROUND_Y, GRAVITY, JUMP_FORCE, 
  MOVE_SPEED, SKULL_TYPES, ITEM_SIZE, SKULL_DROP_SIZE,
  gameState, CANVAS_WIDTH, CANVAS_HEIGHT
} from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = PLAYER_SIZE;
    this.height = PLAYER_SIZE;
    this.onGround = false;
    this.health = 100;
    this.maxHealth = 100;
    this.attack = 10;
    this.speed = MOVE_SPEED;
    this.isDashing = false;
    this.dashTimer = 0;
    this.facingRight = true;
    
    // Skull system
    this.currentSkull = SKULL_TYPES.BASIC;
    this.collectedSkulls = [SKULL_TYPES.BASIC];
    this.currentSkullIndex = 0;
    
    // Stats
    this.critChance = 0;
    this.damageMultiplier = 1.0;
    this.collectedItems = [];
  }
  
  update(p) {
    // Apply gravity
    if (this.y < GROUND_Y - this.height / 2) {
      this.vy += GRAVITY;
      this.onGround = false;
    } else {
      this.y = GROUND_Y - this.height / 2;
      this.vy = 0;
      this.onGround = true;
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Dash timer
    if (this.isDashing) {
      this.dashTimer--;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.vx = 0;
      }
    }
    
    // Boundary check
    this.x = p.constrain(this.x, this.width / 2, CANVAS_WIDTH - this.width / 2);
    this.y = p.constrain(this.y, this.height / 2, GROUND_Y - this.height / 2);
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    if (!this.facingRight) p.scale(-1, 1);
    
    // Body (skull shape)
    p.fill(...this.currentSkull.color);
    p.noStroke();
    p.ellipse(0, -5, this.width, this.height);
    
    // Eye sockets
    p.fill(0);
    p.ellipse(-4, -7, 4, 6);
    p.ellipse(4, -7, 4, 6);
    
    // Teeth
    p.fill(255);
    for (let i = -6; i <= 6; i += 4) {
      p.rect(i, 2, 3, 4);
    }
    
    // Cape effect
    p.fill(50, 50, 100, 150);
    p.beginShape();
    p.vertex(-8, 0);
    p.vertex(-12, 15);
    p.vertex(-8, 20);
    p.vertex(-4, 15);
    p.endShape(p.CLOSE);
    
    p.pop();
    
    // Health bar
    p.fill(200, 0, 0);
    p.rect(this.x - 15, this.y - 20, 30, 4);
    p.fill(0, 255, 0);
    p.rect(this.x - 15, this.y - 20, 30 * (this.health / this.maxHealth), 4);
  }
  
  move(direction) {
    if (!this.isDashing) {
      this.vx = direction * this.speed;
      if (direction !== 0) {
        this.facingRight = direction > 0;
      }
    }
  }
  
  jump() {
    if (this.onGround && !this.isDashing) {
      this.vy = JUMP_FORCE;
      this.onGround = false;
    }
  }
  
  dash() {
    if (!this.isDashing) {
      this.isDashing = true;
      this.dashTimer = 10;
      this.vx = (this.facingRight ? 1 : -1) * 12;
    }
  }
  
  attack(p) {
    const projectile = new Projectile(
      this.x + (this.facingRight ? 15 : -15),
      this.y,
      this.facingRight ? 1 : -1,
      this.currentSkull,
      this.attack * this.damageMultiplier
    );
    gameState.projectiles.push(projectile);
    gameState.entities.push(projectile);
  }
  
  swapSkull() {
    if (this.collectedSkulls.length > 1) {
      this.currentSkullIndex = (this.currentSkullIndex + 1) % this.collectedSkulls.length;
      this.currentSkull = this.collectedSkulls[this.currentSkullIndex];
    }
  }
  
  addSkull(skullType) {
    if (!this.collectedSkulls.includes(skullType)) {
      this.collectedSkulls.push(skullType);
    }
  }
  
  collectItem(item) {
    this.collectedItems.push(item);
    if (item.stat === "attack") {
      this.attack += item.value;
    } else if (item.stat === "speed") {
      this.speed += item.value;
    } else if (item.stat === "maxHealth") {
      this.maxHealth += item.value;
      this.health += item.value;
    } else if (item.stat === "critChance") {
      this.critChance += item.value;
    } else if (item.stat === "damageMultiplier") {
      this.damageMultiplier += item.value;
    }
  }
  
  takeDamage(amount) {
    if (!this.isDashing) {
      this.health -= amount;
      if (this.health <= 0) {
        this.health = 0;
      }
    }
  }
}

export class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = ENEMY_SIZE;
    this.height = ENEMY_SIZE;
    this.health = 30 + type * 10;
    this.maxHealth = this.health;
    this.type = type; // 0: basic, 1: fast, 2: tank
    this.speed = 2 - type * 0.3;
    this.damage = 5 + type * 3;
    this.onGround = false;
    this.attackCooldown = 0;
    this.moveTimer = 0;
    this.moveDirection = 1;
    this.aggroRange = 200;
    this.dead = false;
  }
  
  update(p) {
    if (this.dead) return;
    
    // Apply gravity
    if (this.y < GROUND_Y - this.height / 2) {
      this.vy += GRAVITY;
      this.onGround = false;
    } else {
      this.y = GROUND_Y - this.height / 2;
      this.vy = 0;
      this.onGround = true;
    }
    
    // AI movement
    if (gameState.player) {
      const dx = gameState.player.x - this.x;
      const distance = Math.abs(dx);
      
      if (distance < this.aggroRange) {
        this.moveDirection = dx > 0 ? 1 : -1;
        this.vx = this.moveDirection * this.speed;
      } else {
        // Random patrol
        this.moveTimer--;
        if (this.moveTimer <= 0) {
          this.moveDirection *= -1;
          this.moveTimer = p.random(60, 120);
        }
        this.vx = this.moveDirection * (this.speed * 0.5);
      }
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Boundary check
    this.x = p.constrain(this.x, this.width / 2, CANVAS_WIDTH - this.width / 2);
    
    // Attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
  }
  
  draw(p) {
    if (this.dead) return;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Different colors for different types
    const colors = [
      [200, 50, 50],   // Type 0: Red
      [50, 200, 50],   // Type 1: Green
      [50, 50, 200]    // Type 2: Blue
    ];
    
    // Body
    p.fill(...colors[this.type]);
    p.noStroke();
    p.beginShape();
    p.vertex(0, -this.height / 2);
    p.vertex(this.width / 2, 0);
    p.vertex(this.width / 3, this.height / 2);
    p.vertex(-this.width / 3, this.height / 2);
    p.vertex(-this.width / 2, 0);
    p.endShape(p.CLOSE);
    
    // Eyes
    p.fill(255, 0, 0);
    p.ellipse(-3, -3, 4, 4);
    p.ellipse(3, -3, 4, 4);
    
    p.pop();
    
    // Health bar
    p.fill(100, 0, 0);
    p.rect(this.x - 10, this.y - 15, 20, 3);
    p.fill(255, 0, 0);
    p.rect(this.x - 10, this.y - 15, 20 * (this.health / this.maxHealth), 3);
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
      this.dropLoot();
    }
  }
  
  dropLoot() {
    const p = window.gameInstance;
    
    // Always drop Dark Quartz
    gameState.darkQuartz += 5 + this.type * 3;
    
    // Chance to drop item
    if (p.random() < 0.3) {
      const itemTypes = Object.values(require('./globals.js').ITEM_TYPES);
      const randomItem = itemTypes[Math.floor(p.random() * itemTypes.length)];
      const item = new ItemDrop(this.x, this.y - 20, randomItem);
      gameState.items.push(item);
      gameState.entities.push(item);
    }
    
    // Chance to drop skull
    if (p.random() < 0.15) {
      const skullTypes = Object.values(SKULL_TYPES);
      const randomSkull = skullTypes[Math.floor(p.random() * skullTypes.length)];
      const skull = new SkullDrop(this.x, this.y - 20, randomSkull);
      gameState.skulls.push(skull);
      gameState.entities.push(skull);
    }
    
    // Create particles
    for (let i = 0; i < 8; i++) {
      const particle = new Particle(this.x, this.y, p.random(-3, 3), p.random(-5, -2), [200, 50, 50]);
      gameState.particles.push(particle);
    }
  }
  
  checkPlayerCollision() {
    if (gameState.player && !this.dead) {
      const p = window.gameInstance;
      if (p.collideRectRect(
        this.x - this.width / 2, this.y - this.height / 2, this.width, this.height,
        gameState.player.x - gameState.player.width / 2, 
        gameState.player.y - gameState.player.height / 2,
        gameState.player.width, gameState.player.height
      )) {
        if (this.attackCooldown <= 0) {
          gameState.player.takeDamage(this.damage);
          this.attackCooldown = 60;
        }
      }
    }
  }
}

export class Projectile {
  constructor(x, y, direction, skullType, damage) {
    this.x = x;
    this.y = y;
    this.vx = direction * skullType.projectileSpeed;
    this.vy = 0;
    this.size = skullType.projectileSize;
    this.color = skullType.color;
    this.damage = damage;
    this.dead = false;
    this.lifetime = 120;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.lifetime--;
    
    if (this.lifetime <= 0 || this.x < 0 || this.x > CANVAS_WIDTH) {
      this.dead = true;
    }
  }
  
  draw(p) {
    if (this.dead) return;
    
    p.push();
    p.fill(...this.color);
    p.noStroke();
    p.ellipse(this.x, this.y, this.size, this.size);
    
    // Trail effect
    p.fill(...this.color, 100);
    p.ellipse(this.x - this.vx, this.y, this.size * 0.7, this.size * 0.7);
    
    p.pop();
  }
  
  checkEnemyCollision() {
    if (this.dead) return;
    
    const p = window.gameInstance;
    for (let enemy of gameState.enemies) {
      if (!enemy.dead && p.collideCircleCircle(
        this.x, this.y, this.size,
        enemy.x, enemy.y, enemy.width
      )) {
        enemy.takeDamage(this.damage);
        this.dead = true;
        
        // Create hit particles
        for (let i = 0; i < 5; i++) {
          const particle = new Particle(this.x, this.y, p.random(-2, 2), p.random(-2, 2), this.color);
          gameState.particles.push(particle);
        }
        break;
      }
    }
  }
}

export class ItemDrop {
  constructor(x, y, itemType) {
    this.x = x;
    this.y = y;
    this.vy = -2;
    this.size = ITEM_SIZE;
    this.itemType = itemType;
    this.collected = false;
    this.bobTimer = 0;
  }
  
  update() {
    if (this.collected) return;
    
    // Fall down
    if (this.y < GROUND_Y - this.size / 2) {
      this.vy += GRAVITY * 0.5;
      this.y += this.vy;
    } else {
      this.y = GROUND_Y - this.size / 2;
      this.vy = 0;
    }
    
    // Bob animation
    this.bobTimer += 0.1;
  }
  
  draw(p) {
    if (this.collected) return;
    
    p.push();
    const bobOffset = Math.sin(this.bobTimer) * 3;
    p.translate(this.x, this.y + bobOffset);
    
    // Item box
    p.fill(...this.itemType.color);
    p.stroke(255);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.size, this.size);
    
    // Inner glow
    p.noStroke();
    p.fill(...this.itemType.color, 100);
    p.rect(0, 0, this.size * 0.6, this.size * 0.6);
    
    p.pop();
  }
  
  checkCollection() {
    if (this.collected) return;
    
    const p = window.gameInstance;
    if (gameState.player && p.collideCircleCircle(
      this.x, this.y, this.size,
      gameState.player.x, gameState.player.y, gameState.player.width
    )) {
      this.collected = true;
      gameState.player.collectItem(this.itemType);
      gameState.score += 10;
      
      // Create collection particles
      for (let i = 0; i < 8; i++) {
        const particle = new Particle(this.x, this.y, p.random(-2, 2), p.random(-3, -1), this.itemType.color);
        gameState.particles.push(particle);
      }
    }
  }
}

export class SkullDrop {
  constructor(x, y, skullType) {
    this.x = x;
    this.y = y;
    this.vy = -2;
    this.size = SKULL_DROP_SIZE;
    this.skullType = skullType;
    this.collected = false;
    this.bobTimer = 0;
    this.rotation = 0;
  }
  
  update() {
    if (this.collected) return;
    
    // Fall down
    if (this.y < GROUND_Y - this.size / 2) {
      this.vy += GRAVITY * 0.5;
      this.y += this.vy;
    } else {
      this.y = GROUND_Y - this.size / 2;
      this.vy = 0;
    }
    
    // Bob and rotate animation
    this.bobTimer += 0.1;
    this.rotation += 0.05;
  }
  
  draw(p) {
    if (this.collected) return;
    
    p.push();
    const bobOffset = Math.sin(this.bobTimer) * 4;
    p.translate(this.x, this.y + bobOffset);
    p.rotate(this.rotation);
    
    // Skull shape
    p.fill(...this.skullType.color);
    p.stroke(255);
    p.strokeWeight(2);
    p.ellipse(0, 0, this.size, this.size);
    
    // Eye sockets
    p.fill(0);
    p.noStroke();
    p.ellipse(-3, -2, 3, 4);
    p.ellipse(3, -2, 3, 4);
    
    // Glow effect
    p.noFill();
    p.stroke(...this.skullType.color, 150);
    p.strokeWeight(1);
    p.ellipse(0, 0, this.size * 1.3, this.size * 1.3);
    
    p.pop();
  }
  
  checkCollection() {
    if (this.collected) return;
    
    const p = window.gameInstance;
    if (gameState.player && p.collideCircleCircle(
      this.x, this.y, this.size,
      gameState.player.x, gameState.player.y, gameState.player.width
    )) {
      this.collected = true;
      gameState.player.addSkull(this.skullType);
      gameState.score += 50;
      
      // Create collection particles
      for (let i = 0; i < 12; i++) {
        const particle = new Particle(this.x, this.y, p.random(-3, 3), p.random(-4, -1), this.skullType.color);
        gameState.particles.push(particle);
      }
    }
  }
}

export class Particle {
  constructor(x, y, vx, vy, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = 30;
    this.size = 4;
    this.dead = false;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2;
    this.lifetime--;
    
    if (this.lifetime <= 0) {
      this.dead = true;
    }
  }
  
  draw(p) {
    if (this.dead) return;
    
    p.push();
    p.fill(...this.color, (this.lifetime / 30) * 255);
    p.noStroke();
    p.ellipse(this.x, this.y, this.size, this.size);
    p.pop();
  }
}