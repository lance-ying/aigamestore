// entities.js - All game entity classes

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, COLORS,
         PLAYER_SPEED, PLAYER_JUMP_POWER, PLAYER_DOUBLE_JUMP_POWER,
         PLAYER_SHOVEL_DROP_POWER, PLAYER_BOUNCE_POWER } from './globals.js';
import { checkCollisionWithPlatforms, checkCollisionAABB } from './physics.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 32;
    
    // Physics
    this.vx = 0;
    this.vy = 0;
    this.speed = PLAYER_SPEED;
    this.jumpPower = PLAYER_JUMP_POWER;
    this.doubleJumpPower = PLAYER_DOUBLE_JUMP_POWER;
    this.onGround = false;
    this.canDoubleJump = false;
    this.hasDoubleJumped = false;
    
    // Combat
    this.health = 100;
    this.maxHealth = 100;
    this.isAttacking = false;
    this.attackFrame = 0;
    this.attackDuration = 15;
    this.attackHitbox = null;
    this.isShovelDropping = false;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.invulnerableDuration = 60;
    
    // Animation
    this.facing = 1; // 1 = right, -1 = left
    this.animFrame = 0;
    this.animSpeed = 0.15;
    this.walkCycle = 0;
    
    // State
    this.lastPosition = { x: x, y: y };
    
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    // Handle invulnerability
    if (this.invulnerable) {
      this.invulnerableTimer--;
      if (this.invulnerableTimer <= 0) {
        this.invulnerable = false;
      }
    }
    
    // Apply gravity
    if (!this.onGround) {
      this.vy += gameState.gravity;
    }
    
    // Terminal velocity
    this.vy = p.constrain(this.vy, -20, 20);
    
    // Apply air resistance
    if (!this.onGround) {
      this.vx *= gameState.airResistance;
    } else {
      this.vx *= gameState.friction;
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Check platform collisions
    const collision = checkCollisionWithPlatforms(this);
    if (collision) {
      this.onGround = collision.onGround;
      if (this.onGround) {
        this.canDoubleJump = true;
        this.hasDoubleJumped = false;
        this.isShovelDropping = false;
        // Small bounce on landing from shovel drop
        if (this.vy > 8) {
          this.vy = -this.vy * 0.3;
        } else {
          this.vy = 0;
        }
      }
    } else {
      this.onGround = false;
    }
    
    // Ground collision
    if (this.y + this.height / 2 >= GROUND_Y) {
      this.y = GROUND_Y - this.height / 2;
      this.vy = 0;
      this.onGround = true;
      this.canDoubleJump = true;
      this.hasDoubleJumped = false;
      this.isShovelDropping = false;
    }
    
    // Wall collision (world bounds)
    if (this.x - this.width / 2 < 0) {
      this.x = this.width / 2;
      this.vx = 0;
    }
    if (this.x + this.width / 2 > gameState.worldWidth) {
      this.x = gameState.worldWidth - this.width / 2;
      this.vx = 0;
    }
    
    // Update attack
    if (this.isAttacking) {
      this.attackFrame++;
      if (this.attackFrame >= this.attackDuration) {
        this.isAttacking = false;
        this.attackFrame = 0;
        this.attackHitbox = null;
      } else {
        // Create attack hitbox
        const hitboxWidth = 30;
        const hitboxHeight = 20;
        this.attackHitbox = {
          x: this.x + (this.facing * (this.width / 2 + hitboxWidth / 2)),
          y: this.y,
          width: hitboxWidth,
          height: hitboxHeight
        };
      }
    }
    
    // Update walk animation
    if (Math.abs(this.vx) > 0.5 && this.onGround) {
      this.walkCycle += this.animSpeed;
    } else {
      this.walkCycle = 0;
    }
    
    // Check for death
    if (this.health <= 0) {
      this.die();
    }
    
    // Log position changes
    if (Math.abs(this.x - this.lastPosition.x) > 1 || 
        Math.abs(this.y - this.lastPosition.y) > 1) {
      this.logPosition(p);
      this.lastPosition.x = this.x;
      this.lastPosition.y = this.y;
    }
  }
  
  moveLeft() {
    this.vx = -this.speed;
    this.facing = -1;
  }
  
  moveRight() {
    this.vx = this.speed;
    this.facing = 1;
  }
  
  jump() {
    if (this.onGround) {
      this.vy = this.jumpPower;
      this.onGround = false;
      this.canDoubleJump = true;
    } else if (this.canDoubleJump && !this.hasDoubleJumped) {
      this.vy = this.doubleJumpPower;
      this.hasDoubleJumped = true;
      this.canDoubleJump = false;
      // Create jump particles
      this.createJumpParticles();
    }
  }
  
  attack() {
    if (!this.isAttacking && gameState.frameCount - gameState.lastAttackFrame > gameState.attackCooldown) {
      this.isAttacking = true;
      this.attackFrame = 0;
      gameState.lastAttackFrame = gameState.frameCount;
    }
  }
  
  shovelDrop() {
    if (!this.onGround && !this.isShovelDropping) {
      this.isShovelDropping = true;
      this.vy = PLAYER_SHOVEL_DROP_POWER;
    }
  }
  
  bounceFromShovelDrop() {
    this.vy = PLAYER_BOUNCE_POWER;
    this.isShovelDropping = false;
    // Create bounce particles
    this.createBounceParticles();
  }
  
  takeDamage(amount) {
    if (!this.invulnerable) {
      this.health = Math.max(0, this.health - amount);
      this.invulnerable = true;
      this.invulnerableTimer = this.invulnerableDuration;
      // Knockback
      this.vy = -8;
      // Camera shake
      gameState.cameraShakeX = 5;
      gameState.cameraShakeY = 5;
    }
  }
  
  die() {
    gameState.gamePhase = "GAME_OVER_LOSE";
  }
  
  createJumpParticles() {
    for (let i = 0; i < 5; i++) {
      gameState.particles.push(new Particle(
        this.x + (Math.random() - 0.5) * this.width,
        this.y + this.height / 2,
        (Math.random() - 0.5) * 3,
        Math.random() * 2 + 1,
        [200, 200, 255],
        20
      ));
    }
  }
  
  createBounceParticles() {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      gameState.particles.push(new Particle(
        this.x,
        this.y,
        Math.cos(angle) * 4,
        Math.sin(angle) * 4,
        [255, 255, 150],
        25
      ));
    }
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: this.x - gameState.cameraX,
        screen_y: this.y,
        game_x: this.x,
        game_y: this.y,
        health: this.health,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Flip sprite if facing left
    if (this.facing < 0) {
      p.scale(-1, 1);
    }
    
    // Flicker when invulnerable
    if (this.invulnerable && Math.floor(this.invulnerableTimer / 5) % 2 === 0) {
      p.pop();
      return;
    }
    
    // Draw shovel drop effect
    if (this.isShovelDropping) {
      p.push();
      p.stroke(255, 255, 0);
      p.strokeWeight(2);
      p.noFill();
      for (let i = 0; i < 3; i++) {
        p.circle(0, this.height / 2 + i * 8, 20 - i * 5);
      }
      p.pop();
    }
    
    // Body (armor)
    p.fill(...COLORS.playerArmor);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(0, 2, 18, 24, 2);
    
    // Cape
    const capeWave = Math.sin(this.walkCycle) * 2;
    p.fill(...COLORS.player);
    p.beginShape();
    p.vertex(-9, -8);
    p.vertex(-9 + capeWave, 8);
    p.vertex(-6 + capeWave, 12);
    p.vertex(-3, 8);
    p.vertex(-3, -8);
    p.endShape(p.CLOSE);
    
    // Head (helmet)
    p.fill(...COLORS.player);
    p.circle(0, -8, 16);
    
    // Helmet horns
    p.fill(...COLORS.playerArmor);
    p.circle(-6, -12, 6);
    p.circle(6, -12, 6);
    
    // Visor
    p.fill(50, 50, 100);
    p.rect(0, -7, 10, 4);
    
    // Shovel
    const shovelAngle = this.isAttacking ? 
      Math.sin(this.attackFrame / this.attackDuration * Math.PI) * 0.5 : 0;
    p.push();
    p.translate(8, 0);
    p.rotate(shovelAngle);
    
    // Handle
    p.fill(120, 80, 40);
    p.rect(0, 0, 3, 16);
    
    // Blade
    p.fill(...COLORS.playerShovel);
    p.stroke(180, 180, 180);
    p.strokeWeight(1);
    p.beginShape();
    p.vertex(-4, -8);
    p.vertex(4, -8);
    p.vertex(2, -12);
    p.vertex(-2, -12);
    p.endShape(p.CLOSE);
    p.pop();
    
    // Legs (simple walk cycle)
    const legOffset = Math.sin(this.walkCycle * 2) * 3;
    p.fill(...COLORS.playerArmor);
    p.noStroke();
    p.rect(-4 + legOffset, 16, 5, 12);
    p.rect(4 - legOffset, 16, 5, 12);
    
    p.pop();
  }
}

export class Enemy {
  constructor(x, y, platformId, type = "BASIC") {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 24;
    this.platformId = platformId;
    this.type = type;
    
    // Physics
    if (type === "TOUGH") {
      this.vx = 1.0;
      this.speed = 1.0;
    } else {
      this.vx = 1.5;
      this.speed = 1.5;
    }
    this.vy = 0;
    this.onGround = false;
    
    // Combat
    if (type === "TOUGH") {
      this.health = 80;
      this.maxHealth = 80;
      this.damage = 20;
    } else {
      this.health = 40;
      this.maxHealth = 40;
      this.damage = 15;
    }
    this.attackRange = 35;
    this.detectionRange = 150;
    this.attackCooldown = 60;
    this.lastAttackFrame = 0;
    
    // AI
    this.patrolLeft = x - 80;
    this.patrolRight = x + 80;
    this.state = "PATROL"; // "PATROL", "CHASE", "ATTACK"
    
    // Animation
    this.animFrame = 0;
    this.facing = 1;
    
    gameState.enemies.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    if (!gameState.player) return;
    
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // AI state machine
    if (distance < this.attackRange) {
      this.state = "ATTACK";
    } else if (distance < this.detectionRange) {
      this.state = "CHASE";
    } else {
      this.state = "PATROL";
    }
    
    // Execute state behavior
    switch (this.state) {
      case "PATROL":
        this.patrol();
        break;
      case "CHASE":
        this.chase(dx);
        break;
      case "ATTACK":
        this.attackPlayer();
        break;
    }
    
    // Apply gravity
    this.vy += gameState.gravity;
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Platform collision
    const collision = checkCollisionWithPlatforms(this);
    if (collision) {
      this.onGround = collision.onGround;
      if (this.onGround) {
        this.vy = 0;
      }
    } else {
      this.onGround = false;
    }
    
    // Ground collision
    if (this.y + this.height / 2 >= GROUND_Y) {
      this.y = GROUND_Y - this.height / 2;
      this.vy = 0;
      this.onGround = true;
    }
    
    // Animation
    this.animFrame += 0.1;
    
    // Check collision with player's attack
    if (gameState.player.attackHitbox) {
      if (checkCollisionAABB(this, gameState.player.attackHitbox)) {
        this.takeDamage(25);
      }
    }
    
    // Check collision with player (shovel drop) - BOUNCE MECHANIC
    if (gameState.player.isShovelDropping) {
      if (checkCollisionAABB(this, gameState.player)) {
        this.takeDamage(30);
        gameState.player.bounceFromShovelDrop();
      }
    }
    
    // Check collision with player (damage to player)
    if (!gameState.player.invulnerable && checkCollisionAABB(this, gameState.player)) {
      gameState.player.takeDamage(this.damage);
    }
  }
  
  patrol() {
    // Move back and forth
    if (this.x <= this.patrolLeft) {
      this.vx = this.speed;
      this.facing = 1;
    } else if (this.x >= this.patrolRight) {
      this.vx = -this.speed;
      this.facing = -1;
    }
  }
  
  chase(dx) {
    if (dx > 0) {
      this.vx = this.speed;
      this.facing = 1;
    } else {
      this.vx = -this.speed;
      this.facing = -1;
    }
  }
  
  attackPlayer() {
    this.vx = 0;
    if (gameState.frameCount - this.lastAttackFrame > this.attackCooldown) {
      // Attack logic handled in update collision check
      this.lastAttackFrame = gameState.frameCount;
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    // Knockback
    this.vy = -5;
    this.vx = this.facing * -3;
    
    // Create damage particles
    const particleColor = this.type === "TOUGH" ? [200, 100, 200] : [255, 100, 100];
    for (let i = 0; i < 5; i++) {
      gameState.particles.push(new Particle(
        this.x,
        this.y,
        (Math.random() - 0.5) * 4,
        -Math.random() * 3,
        particleColor,
        20
      ));
    }
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    // Add score
    gameState.score += this.type === "TOUGH" ? 100 : 50;
    gameState.enemiesDefeated++;
    
    // Create death particles
    const particleColor = this.type === "TOUGH" ? [200, 80, 200] : [255, 80, 80];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      gameState.particles.push(new Particle(
        this.x,
        this.y,
        Math.cos(angle) * 5,
        Math.sin(angle) * 5,
        particleColor,
        30
      ));
    }
    
    // Remove from arrays
    const index = gameState.enemies.indexOf(this);
    if (index > -1) {
      gameState.enemies.splice(index, 1);
    }
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    if (this.facing < 0) {
      p.scale(-1, 1);
    }
    
    // Body color depends on type
    const bodyColor = this.type === "TOUGH" ? COLORS.enemyTough : COLORS.enemy;
    const detailColor = this.type === "TOUGH" ? COLORS.enemyToughDetail : COLORS.enemyDetail;
    
    // Body
    p.fill(...bodyColor);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(0, 0, 20, 20, 2);
    
    // Armor details
    p.fill(...detailColor);
    p.rect(0, -4, 18, 4);
    p.rect(0, 4, 18, 4);
    
    // Spikes on top (more for tough enemies)
    p.fill(...detailColor);
    if (this.type === "TOUGH") {
      p.triangle(-10, -10, -6, -16, -2, -10);
      p.triangle(-2, -10, 2, -16, 6, -10);
      p.triangle(6, -10, 10, -16, 14, -10);
    } else {
      p.triangle(-8, -10, -4, -14, 0, -10);
      p.triangle(0, -10, 4, -14, 8, -10);
    }
    
    // Eyes (glow)
    const eyeGlow = Math.sin(this.animFrame * 2) * 20 + 200;
    const eyeColor = this.type === "TOUGH" ? [eyeGlow, 0, eyeGlow] : [eyeGlow, 0, 0];
    p.fill(...eyeColor);
    p.circle(-5, -2, 6);
    p.circle(5, -2, 6);
    
    // Legs
    const legWave = Math.sin(this.animFrame * 3) * 2;
    p.fill(...bodyColor);
    p.rect(-5 + legWave, 12, 4, 8);
    p.rect(5 - legWave, 12, 4, 8);
    
    // Health bar
    if (this.health < this.maxHealth) {
      p.push();
      p.translate(0, -22);
      const barWidth = 24;
      const barHeight = 3;
      const healthRatio = this.health / this.maxHealth;
      
      p.fill(...COLORS.healthBg);
      p.rect(0, 0, barWidth, barHeight);
      
      p.fill(...COLORS.health);
      p.rect(-barWidth / 2 + (barWidth * healthRatio) / 2, 0, barWidth * healthRatio, barHeight);
      p.pop();
    }
    
    p.pop();
  }
}

export class Gem {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.initialY = y;
    this.radius = 8;
    this.value = 10;
    
    // Animation
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = 0.08;
    this.bobOffset = 0;
    this.bobSpeed = 0.08;
    this.pulsePhase = Math.random() * Math.PI * 2;
    
    gameState.gems.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    // Rotate
    this.rotation += this.rotationSpeed;
    
    // Bob up and down
    this.bobOffset = Math.sin(p.frameCount * this.bobSpeed + this.pulsePhase) * 4;
    this.y = this.initialY + this.bobOffset;
    
    // Check collision with player
    if (gameState.player) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.radius + gameState.player.width / 2) {
        this.collect();
      }
    }
  }
  
  collect() {
    // Add score
    gameState.score += this.value;
    gameState.gemsCollected++;
    
    // Create collection particles
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      gameState.particles.push(new Particle(
        this.x,
        this.y,
        Math.cos(angle) * 3,
        Math.sin(angle) * 3,
        [255, 220, 0],
        25
      ));
    }
    
    // Check win condition
    if (gameState.gemsCollected >= gameState.totalGems) {
      gameState.gamePhase = "LEVEL_COMPLETE";
    }
    
    // Remove from arrays
    const index = gameState.gems.indexOf(this);
    if (index > -1) {
      gameState.gems.splice(index, 1);
    }
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    
    // Outer glow
    const glowSize = 20 + Math.sin(p.frameCount * 0.1 + this.pulsePhase) * 4;
    p.noStroke();
    p.fill(255, 220, 0, 50);
    p.star(0, 0, glowSize / 2, glowSize / 4, 8);
    
    // Main gem
    p.fill(...COLORS.gem);
    p.stroke(...COLORS.gemShine);
    p.strokeWeight(1);
    p.star(0, 0, this.radius, this.radius * 0.5, 5);
    
    // Shine effect
    p.noStroke();
    p.fill(...COLORS.gemShine);
    p.circle(-2, -2, 3);
    
    p.pop();
  }
}

export class Platform {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    gameState.platforms.push(this);
  }
  
  render(p) {
    p.push();
    
    // Platform top (lighter)
    p.fill(...COLORS.platform);
    p.noStroke();
    p.rect(this.x, this.y, this.width, 4);
    
    // Platform body
    p.fill(...COLORS.platformEdge);
    p.rect(this.x, this.y + 4, this.width, this.height - 4);
    
    // Brick pattern
    p.stroke(80, 60, 40);
    p.strokeWeight(1);
    const brickWidth = 20;
    for (let i = 0; i < this.width; i += brickWidth) {
      p.line(this.x + i, this.y + 4, this.x + i, this.y + this.height);
    }
    for (let j = 8; j < this.height; j += 8) {
      p.line(this.x, this.y + j, this.x + this.width, this.y + j);
    }
    
    // Edge highlight
    p.stroke(140, 120, 100);
    p.strokeWeight(2);
    p.line(this.x, this.y, this.x + this.width, this.y);
    
    p.pop();
  }
}

export class Particle {
  constructor(x, y, vx, vy, color, lifetime) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.age = 0;
    this.size = Math.random() * 4 + 2;
    this.gravity = 0.2;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.age++;
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    const alpha = 1 - (this.age / this.lifetime);
    p.noStroke();
    p.fill(this.color[0], this.color[1], this.color[2], alpha * 255);
    p.circle(this.x, this.y, this.size);
  }
}

// Helper function to draw a star
p5.prototype.star = function(x, y, radius1, radius2, npoints) {
  const angle = (Math.PI * 2) / npoints;
  const halfAngle = angle / 2.0;
  this.beginShape();
  for (let a = -Math.PI / 2; a < Math.PI * 2 - Math.PI / 2; a += angle) {
    let sx = x + Math.cos(a) * radius1;
    let sy = y + Math.sin(a) * radius1;
    this.vertex(sx, sy);
    sx = x + Math.cos(a + halfAngle) * radius2;
    sy = y + Math.sin(a + halfAngle) * radius2;
    this.vertex(sx, sy);
  }
  this.endShape(this.CLOSE);
};