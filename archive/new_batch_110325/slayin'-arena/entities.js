// entities.js - Game entities (Player, Enemy, Merchant, Particle)

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(heroClass, x, y) {
    this.heroClass = heroClass;
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 40;
    this.maxHealth = heroClass.baseHealth;
    this.health = this.maxHealth;
    this.damage = heroClass.baseDamage;
    this.speed = heroClass.baseSpeed;
    this.armor = heroClass.baseArmor;
    this.color = heroClass.color;
    this.direction = 1; // 1 = right, -1 = left
    this.attackCooldown = 0;
    this.attackCooldownMax = 3; // Reduced from 30 to 3 frames for rapid auto-attacking
    this.attackRange = 60;
    this.weaponSwing = 0;
    this.level = 1;
    this.experience = 0;
    this.experienceToNextLevel = 100;
    this.invulnerableFrames = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.gravity = 0.5;
    this.jumpPower = -10;
    this.isGrounded = false;
    this.groundY = CANVAS_HEIGHT - 60;
  }

  update(p) {
    // Apply gravity and ground collision
    this.velocityY += this.gravity;
    this.y += this.velocityY;
    
    if (this.y >= this.groundY) {
      this.y = this.groundY;
      this.velocityY = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Horizontal movement
    this.x += this.velocityX;
    this.x = p.constrain(this.x, this.width / 2, CANVAS_WIDTH - this.width / 2);

    // Apply reduced friction to maintain momentum
    this.velocityX *= 0.95;

    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }

    // Update weapon swing animation
    if (this.weaponSwing > 0) {
      this.weaponSwing--;
    }

    // Update invulnerability
    if (this.invulnerableFrames > 0) {
      this.invulnerableFrames--;
    }

    // Check for enemy collisions and auto-attack
    this.checkEnemyCollisions(p);
  }

  checkEnemyCollisions(p) {
    gameState.enemies.forEach(enemy => {
      const distance = p.dist(this.x, this.y, enemy.x, enemy.y);
      
      // Attack if in range and cooldown ready
      if (distance < this.attackRange && this.attackCooldown === 0) {
        this.attack(enemy, p);
      }

      // Take damage if enemy touches player
      if (distance < (this.width / 2 + enemy.width / 2) && this.invulnerableFrames === 0) {
        this.takeDamage(enemy.damage, p);
      }
    });
  }

  attack(enemy, p) {
    this.attackCooldown = this.attackCooldownMax;
    this.weaponSwing = 15;
    
    const actualDamage = Math.max(1, this.damage - enemy.armor);
    enemy.takeDamage(actualDamage, p);
    
    // Create hit particle
    this.createHitParticle(enemy.x, enemy.y, p);
  }

  createHitParticle(x, y, p) {
    for (let i = 0; i < 5; i++) {
      gameState.particles.push(new Particle(x, y, p.random(-2, 2), p.random(-3, -1), [255, 200, 100], 20, p));
    }
  }

  takeDamage(damage, p) {
    const actualDamage = Math.max(1, damage - this.armor);
    this.health -= actualDamage;
    this.invulnerableFrames = 30;
    
    // Create damage particles
    for (let i = 0; i < 8; i++) {
      gameState.particles.push(new Particle(this.x, this.y, p.random(-3, 3), p.random(-4, -1), [255, 50, 50], 25, p));
    }

    if (this.health <= 0) {
      this.health = 0;
    }
  }

  moveLeft() {
    this.velocityX = -this.speed;
    this.direction = -1;
  }

  moveRight() {
    this.velocityX = this.speed;
    this.direction = 1;
  }

  gainExperience(amount, p) {
    this.experience += amount;
    
    while (this.experience >= this.experienceToNextLevel) {
      this.levelUp(p);
    }
  }

  levelUp(p) {
    this.level++;
    this.experience -= this.experienceToNextLevel;
    this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
    
    // Stat increases
    this.maxHealth += 10;
    this.health = Math.min(this.health + 20, this.maxHealth); // Heal on level up
    this.damage += 20; // Increased from 2 to keep one-shotting enemies
    this.armor += 1;
    
    // Level up particles
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      gameState.particles.push(new Particle(
        this.x, this.y,
        Math.cos(angle) * 3, Math.sin(angle) * 3,
        [255, 255, 100], 40, p
      ));
    }
  }

  draw(p) {
    p.push();
    
    // Flicker when invulnerable
    if (this.invulnerableFrames > 0 && Math.floor(this.invulnerableFrames / 5) % 2 === 0) {
      p.translate(this.x, this.y);
      p.pop();
      return;
    }

    p.translate(this.x, this.y);
    
    // Draw weapon swing effect (always show hitbox area)
    p.push();
    p.noFill();
    p.stroke(255, 255, 200, this.weaponSwing > 0 ? 255 : 50);
    p.strokeWeight(this.weaponSwing > 0 ? 3 : 1);
    p.arc(0, 0, this.attackRange * 2, this.attackRange * 2, 
          -Math.PI / 3, Math.PI / 3);
    p.pop();

    // Draw hero body
    p.fill(...this.color);
    p.noStroke();
    p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 5);
    
    // Draw hero head
    p.fill(...this.color.map(c => c * 1.2));
    p.ellipse(0, -this.height / 2 - 8, 20, 20);
    
    // Draw weapon
    p.fill(150, 150, 150);
    p.push();
    p.translate(this.direction * 15, 0);
    p.rotate(this.direction * (this.weaponSwing > 0 ? -0.5 : 0.2));
    p.rect(-3, 0, 6, 25, 2);
    p.pop();
    
    // Draw health bar
    p.fill(50);
    p.rect(-this.width / 2, -this.height / 2 - 15, this.width, 5);
    p.fill(0, 255, 0);
    const healthPercent = this.health / this.maxHealth;
    p.rect(-this.width / 2, -this.height / 2 - 15, this.width * healthPercent, 5);
    
    p.pop();
  }
}

export class Enemy {
  constructor(type, x, y, p) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = type.size;
    this.height = type.size;
    this.maxHealth = type.health;
    this.health = this.maxHealth;
    this.damage = type.damage;
    this.speed = type.speed;
    this.armor = type.armor;
    this.color = type.color;
    this.experienceValue = type.experienceValue;
    this.coinValue = type.coinValue;
    this.velocityX = 0;
    this.velocityY = 0;
    this.gravity = 0.5;
    this.groundY = CANVAS_HEIGHT - 60;
    this.isGrounded = false;
    this.aiState = 'chase';
    this.aiTimer = 0;
    this.alive = true;
  }

  update(p) {
    if (!this.alive) return;

    // Apply gravity
    this.velocityY += this.gravity;
    this.y += this.velocityY;
    
    if (this.y >= this.groundY) {
      this.y = this.groundY;
      this.velocityY = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // AI behavior
    this.updateAI(p);

    // Apply movement
    this.x += this.velocityX;
    this.x = p.constrain(this.x, this.width / 2, CANVAS_WIDTH - this.width / 2);

    this.velocityX *= 0.9; // friction
  }

  updateAI(p) {
    if (!gameState.player) return;

    const dx = gameState.player.x - this.x;
    const distance = Math.abs(dx);

    if (this.aiState === 'chase') {
      if (distance > 10) {
        this.velocityX = (dx > 0 ? 1 : -1) * this.speed;
      } else {
        this.velocityX = 0;
      }
    }
  }

  takeDamage(damage, p) {
    this.health -= damage;
    
    if (this.health <= 0) {
      this.die(p);
    }
  }

  die(p) {
    this.alive = false;
    
    // Award experience and coins
    if (gameState.player) {
      gameState.player.gainExperience(this.experienceValue, p);
      gameState.coins += this.coinValue;
    }
    
    gameState.score += this.experienceValue * 10;
    gameState.enemiesKilled++;
    
    // Death particles
    for (let i = 0; i < 10; i++) {
      gameState.particles.push(new Particle(
        this.x, this.y,
        p.random(-4, 4), p.random(-5, -1),
        this.color, 30, p
      ));
    }
  }

  draw(p) {
    if (!this.alive) return;

    p.push();
    p.translate(this.x, this.y);
    
    // Draw enemy body
    p.fill(...this.color);
    p.noStroke();
    p.ellipse(0, 0, this.width, this.height);
    
    // Draw eyes
    p.fill(255, 50, 50);
    p.ellipse(-this.width / 4, -this.height / 6, 5, 5);
    p.ellipse(this.width / 4, -this.height / 6, 5, 5);
    
    // Draw health bar
    p.fill(50);
    p.rect(-this.width / 2, -this.height / 2 - 10, this.width, 4);
    p.fill(255, 0, 0);
    const healthPercent = this.health / this.maxHealth;
    p.rect(-this.width / 2, -this.height / 2 - 10, this.width * healthPercent, 4);
    
    p.pop();
  }
}

export class Merchant {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 50;
    this.active = true;
    this.duration = 10000; // 10 seconds
    this.spawnTime = Date.now();
    this.bobOffset = 0;
  }

  update(p) {
    if (Date.now() - this.spawnTime > this.duration) {
      this.active = false;
    }
    
    this.bobOffset = Math.sin(p.frameCount * 0.1) * 5;
  }

  isPlayerNearby() {
    if (!gameState.player) return false;
    const distance = Math.abs(gameState.player.x - this.x);
    return distance < 50;
  }

  draw(p) {
    p.push();
    p.translate(this.x, this.y + this.bobOffset);
    
    // Draw merchant body
    p.fill(150, 100, 200);
    p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 5);
    
    // Draw merchant head
    p.fill(220, 180, 150);
    p.ellipse(0, -this.height / 2 - 10, 25, 25);
    
    // Draw hat
    p.fill(100, 50, 150);
    p.triangle(-15, -this.height / 2 - 15, 15, -this.height / 2 - 15, 0, -this.height / 2 - 30);
    
    // Draw interaction prompt
    if (this.isPlayerNearby()) {
      p.fill(255, 255, 100);
      p.textAlign(p.CENTER);
      p.textSize(12);
      p.text("SHOP", 0, -this.height / 2 - 40);
    }
    
    p.pop();
  }
}

export class Particle {
  constructor(x, y, vx, vy, color, life, p) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.gravity = 0.2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.life--;
  }

  draw(p) {
    const alpha = (this.life / this.maxLife) * 255;
    p.fill(...this.color, alpha);
    p.noStroke();
    p.ellipse(this.x, this.y, 5, 5);
  }

  isDead() {
    return this.life <= 0;
  }
}

// Enemy types (reduced health for one-shot kills)
export const ENEMY_TYPES = [
  { 
    name: "Slime", 
    size: 25, 
    health: 10, 
    damage: 5, 
    speed: 1.5, 
    armor: 0,
    color: [100, 200, 100], 
    experienceValue: 10,
    coinValue: 5
  },
  { 
    name: "Goblin", 
    size: 30, 
    health: 15, 
    damage: 8, 
    speed: 2.0, 
    armor: 0,
    color: [150, 100, 80], 
    experienceValue: 20,
    coinValue: 10
  },
  { 
    name: "Orc", 
    size: 35, 
    health: 25, 
    damage: 12, 
    speed: 1.8, 
    armor: 0,
    color: [100, 150, 100], 
    experienceValue: 30,
    coinValue: 15
  },
  { 
    name: "Demon", 
    size: 40, 
    health: 40, 
    damage: 18, 
    speed: 2.2, 
    armor: 0,
    color: [200, 50, 50], 
    experienceValue: 50,
    coinValue: 25
  },
  { 
    name: "Dragon", 
    size: 50, 
    health: 60, 
    damage: 25, 
    speed: 1.5, 
    armor: 0,
    color: [180, 100, 200], 
    experienceValue: 100,
    coinValue: 50
  }
];

export const SHOP_ITEMS = [
  { name: "Health Potion", cost: 30, description: "Restore 50 HP", type: "consumable" },
  { name: "Sword +1", cost: 50, description: "+5 Damage", type: "damage" },
  { name: "Armor +1", cost: 50, description: "+3 Armor", type: "armor" },
  { name: "Speed Boots", cost: 40, description: "+0.5 Speed", type: "speed" },
  { name: "Max Health +1", cost: 60, description: "+20 Max HP", type: "health" }
];