// entities.js - Entity classes for player, enemies, items, etc.

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAY_AREA_LEFT,
  PLAY_AREA_RIGHT,
  PLAY_AREA_TOP,
  PLAY_AREA_BOTTOM,
  ITEM_COLLECTION_LINE,
  BENTLER_RED,
  BENTLER_BLUE,
  BENTLER_GREEN,
  UFO_RED,
  UFO_BLUE,
  UFO_GREEN,
  UFO_RAINBOW,
  randomRange,
  randomInt,
  randomChoice,
  clamp,
  distance
} from './globals.js';

import { createExplosion, createParticles } from './particles.js';

// Player class
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 6;
    this.height = 6;
    this.hitboxRadius = 2; // Small hitbox for precise dodging
    this.speed = 4;
    this.slowSpeed = 1.8;
    this.isFocused = false; // Slow movement mode
    this.shooting = false;
    this.shootCooldown = 0;
    this.shootInterval = 4; // Frames between shots
    this.invincible = false;
    this.invincibleTimer = 0;
    this.invincibleDuration = 120; // 2 seconds
    
    // Options (support orbs)
    this.options = [];
    this.optionCount = 1; // Start with 1 option
    this.maxOptions = 4;
    
    // Visual
    this.angle = 0;
    this.animFrame = 0;
    
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    // Update invincibility
    if (this.invincible) {
      this.invincibleTimer--;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }
    
    // Update shoot cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }
    
    // Animation
    this.animFrame++;
    this.angle += 0.1;
    
    // Update options
    this.updateOptions(p);
    
    // Item attraction when focused
    if (this.isFocused) {
      this.attractItems();
    }
    
    // Auto-collect items at top of screen
    if (this.y < ITEM_COLLECTION_LINE) {
      gameState.itemAutoCollect = true;
      this.collectAllItems();
    } else {
      gameState.itemAutoCollect = false;
    }
  }
  
  updateOptions(p) {
    // Calculate option count based on power
    const targetOptionCount = Math.min(this.maxOptions, Math.floor(gameState.power));
    
    // Add options if needed
    while (this.options.length < targetOptionCount) {
      this.options.push({
        angle: (this.options.length * Math.PI * 2 / targetOptionCount),
        distance: 30
      });
    }
    
    // Remove options if needed
    while (this.options.length > targetOptionCount) {
      this.options.pop();
    }
    
    // Update option positions
    this.options.forEach((option, index) => {
      option.angle += 0.05;
      const totalOptions = this.options.length;
      const baseAngle = (index * Math.PI * 2 / totalOptions);
      option.angle = baseAngle + this.animFrame * 0.02;
    });
  }
  
  attractItems() {
    const attractRadius = 80; // Larger radius when focused
    
    gameState.collectibles.forEach(item => {
      if (item.isAttractable && distance(this.x, this.y, item.x, item.y) < attractRadius) {
        const dx = this.x - item.x;
        const dy = this.y - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          item.vx += (dx / dist) * 0.5;
          item.vy += (dy / dist) * 0.5;
        }
      }
    });
    
    gameState.bentlerItems.forEach(item => {
      if (distance(this.x, this.y, item.x, item.y) < attractRadius) {
        const dx = this.x - item.x;
        const dy = this.y - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          item.vx += (dx / dist) * 0.5;
          item.vy += (dy / dist) * 0.5;
        }
      }
    });
  }
  
  collectAllItems() {
    // Collect all collectibles
    gameState.collectibles.forEach(item => {
      if (item.isAttractable) {
        const dx = this.x - item.x;
        const dy = this.y - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          item.vx = (dx / dist) * 15;
          item.vy = (dy / dist) * 15;
        }
      }
    });
    
    // Collect all bentler items
    gameState.bentlerItems.forEach(item => {
      const dx = this.x - item.x;
      const dy = this.y - item.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        item.vx = (dx / dist) * 15;
        item.vy = (dy / dist) * 15;
      }
    });
  }
  
  move(dx, dy) {
    const speed = this.isFocused ? this.slowSpeed : this.speed;
    this.x += dx * speed;
    this.y += dy * speed;
    
    // Keep in bounds
    this.x = clamp(this.x, PLAY_AREA_LEFT + 10, PLAY_AREA_RIGHT - 10);
    this.y = clamp(this.y, PLAY_AREA_TOP + 10, PLAY_AREA_BOTTOM - 10);
  }
  
  shoot(p) {
    if (this.shootCooldown > 0) return;
    
    this.shooting = true;
    this.shootCooldown = this.shootInterval;
    
    // Player main shot
    const bullet = new PlayerBullet(this.x, this.y - 10, 0, -12);
    gameState.playerBullets.push(bullet);
    
    // Option shots
    this.options.forEach(option => {
      const ox = this.x + Math.cos(option.angle) * option.distance;
      const oy = this.y + Math.sin(option.angle) * option.distance;
      const bullet = new PlayerBullet(ox, oy, 0, -12);
      gameState.playerBullets.push(bullet);
    });
  }
  
  useSpellCard(p) {
    if (gameState.spellCards <= 0) return;
    
    gameState.spellCards--;
    
    // Clear all bullets
    gameState.bullets.forEach(bullet => {
      createExplosion(p, bullet.x, bullet.y, [100, 200, 255], 5);
    });
    gameState.bullets = [];
    
    // Damage all enemies
    gameState.enemies.forEach(enemy => {
      enemy.takeDamage(50);
    });
    
    // Damage boss if present
    if (gameState.boss) {
      gameState.boss.takeDamage(100);
    }
    
    // Make invincible
    this.invincible = true;
    this.invincibleTimer = 60;
    
    // Visual effect
    createParticles(p, this.x, this.y, 30, [255, 255, 255]);
  }
  
  takeDamage(p) {
    if (this.invincible) return;
    
    gameState.lives--;
    
    if (gameState.lives <= 0) {
      this.die(p);
      return;
    }
    
    // Reset position
    this.x = PLAY_AREA_LEFT + PLAY_AREA_WIDTH / 2;
    this.y = PLAY_AREA_BOTTOM - 50;
    
    // Lose an option
    if (this.options.length > 0) {
      this.options.pop();
    }
    
    // Reduce power slightly
    gameState.power = Math.max(1.0, gameState.power - 0.5);
    
    // Grant spell cards if low
    if (gameState.spellCards < 2) {
      gameState.spellCards = 2;
    }
    
    // Make invincible
    this.invincible = true;
    this.invincibleTimer = this.invincibleDuration;
    
    // Clear bullets near player
    gameState.bullets = gameState.bullets.filter(bullet => {
      const dist = distance(this.x, this.y, bullet.x, bullet.y);
      if (dist < 100) {
        createExplosion(p, bullet.x, bullet.y, [255, 100, 100], 3);
        return false;
      }
      return true;
    });
    
    // Visual effect
    createExplosion(p, this.x, this.y, [255, 0, 0], 15);
  }
  
  die(p) {
    createExplosion(p, this.x, this.y, [255, 0, 0], 30);
    gameState.gamePhase = "GAME_OVER_LOSE";
  }
  
  render(p) {
    p.push();
    
    // Render options first (behind player)
    this.options.forEach(option => {
      const ox = this.x + Math.cos(option.angle) * option.distance;
      const oy = this.y + Math.sin(option.angle) * option.distance;
      
      p.fill(100, 200, 255, 200);
      p.noStroke();
      p.circle(ox, oy, 12);
      
      p.fill(255);
      p.circle(ox, oy, 6);
    });
    
    // Flash when invincible
    if (this.invincible && Math.floor(this.invincibleTimer / 5) % 2 === 0) {
      p.fill(255, 255, 255, 150);
    } else {
      p.fill(255, 100, 100);
    }
    
    // Player body
    p.stroke(255, 200, 200);
    p.strokeWeight(2);
    p.circle(this.x, this.y, 16);
    
    // Draw bow/ribbon
    p.noStroke();
    p.fill(255, 50, 50);
    p.circle(this.x - 6, this.y - 8, 6);
    p.circle(this.x + 6, this.y - 8, 6);
    
    // Hitbox indicator when focused
    if (this.isFocused) {
      p.noFill();
      p.stroke(255, 0, 0);
      p.strokeWeight(1);
      p.circle(this.x, this.y, this.hitboxRadius * 2);
    }
    
    p.pop();
  }
}

// Enemy class
export class Enemy {
  constructor(x, y, type = 'basic') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 20;
    this.height = 20;
    this.radius = 10;
    this.health = 20;
    this.maxHealth = 20;
    this.damage = 1;
    this.vx = 0;
    this.vy = 0;
    this.speed = 1;
    this.shootTimer = 0;
    this.shootInterval = 60;
    this.animFrame = 0;
    this.color = [255, 100, 100];
    
    // Movement pattern
    this.movementType = randomChoice(['sine', 'straight', 'zigzag']);
    this.moveTimer = 0;
    
    gameState.enemies.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    this.animFrame++;
    this.moveTimer++;
    this.shootTimer++;
    
    // Movement patterns
    switch (this.movementType) {
      case 'sine':
        this.vx = Math.sin(this.moveTimer * 0.05) * 2;
        this.vy = 1;
        break;
      case 'straight':
        this.vy = 1.5;
        break;
      case 'zigzag':
        if (this.moveTimer % 40 === 0) {
          this.vx = randomRange(-2, 2);
        }
        this.vy = 1;
        break;
    }
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Bounce off walls
    if (this.x < PLAY_AREA_LEFT + this.radius) {
      this.x = PLAY_AREA_LEFT + this.radius;
      this.vx = Math.abs(this.vx);
    }
    if (this.x > PLAY_AREA_RIGHT - this.radius) {
      this.x = PLAY_AREA_RIGHT - this.radius;
      this.vx = -Math.abs(this.vx);
    }
    
    // Shoot at player
    if (this.shootTimer >= this.shootInterval && gameState.player) {
      this.shoot(p);
      this.shootTimer = 0;
    }
    
    // Remove if off screen
    if (this.y > PLAY_AREA_BOTTOM + 50) {
      this.destroy();
    }
  }
  
  shoot(p) {
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      const speed = 3;
      const bullet = new EnemyBullet(
        this.x,
        this.y,
        (dx / dist) * speed,
        (dy / dist) * speed
      );
      gameState.bullets.push(bullet);
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    // Increment kill counter
    gameState.enemiesKilled++;
    
    // Create explosion
    if (window.gameInstance) {
      const p = window.gameInstance;
      createExplosion(p, this.x, this.y, this.color, 10);
    }
    
    // Drop items
    this.dropItems();
    
    // Remove from arrays
    this.destroy();
  }
  
  dropItems() {
    // Drop power items
    if (Math.random() < 0.3) {
      const item = new PowerItem(this.x, this.y);
      gameState.collectibles.push(item);
    }
    
    // Drop point items
    if (Math.random() < 0.5) {
      const item = new PointItem(this.x, this.y);
      gameState.collectibles.push(item);
    }
    
    // Drop Bentler items
    if (Math.random() < 0.4) {
      const color = randomChoice([BENTLER_RED, BENTLER_BLUE, BENTLER_GREEN]);
      const item = new BentlerItem(this.x, this.y, color);
      gameState.bentlerItems.push(item);
    }
  }
  
  destroy() {
    const enemyIndex = gameState.enemies.indexOf(this);
    if (enemyIndex > -1) {
      gameState.enemies.splice(enemyIndex, 1);
    }
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.animFrame * 0.05);
    
    // Body
    p.fill(...this.color);
    p.stroke(255, 150, 150);
    p.strokeWeight(2);
    p.circle(0, 0, this.radius * 2);
    
    // Eyes
    p.fill(0);
    p.noStroke();
    p.circle(-5, -2, 4);
    p.circle(5, -2, 4);
    
    // Health bar
    p.pop();
    p.push();
    const healthRatio = this.health / this.maxHealth;
    p.fill(255, 0, 0);
    p.rect(this.x - 10, this.y - 20, 20 * healthRatio, 3);
    p.noFill();
    p.stroke(255);
    p.strokeWeight(1);
    p.rect(this.x - 10, this.y - 20, 20, 3);
    
    p.pop();
  }
}

// Boss class
export class Boss {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 60;
    this.radius = 30;
    this.health = 500;
    this.maxHealth = 500;
    this.phase = 1;
    this.shootTimer = 0;
    this.animFrame = 0;
    this.moveTimer = 0;
    this.targetX = x;
    this.targetY = y;
    
    gameState.boss = this;
    gameState.bossActive = true;
    gameState.entities.push(this);
  }
  
  update(p) {
    this.animFrame++;
    this.moveTimer++;
    this.shootTimer++;
    
    // Move to target position
    if (this.moveTimer % 180 === 0) {
      this.targetX = randomRange(PLAY_AREA_LEFT + 50, PLAY_AREA_RIGHT - 50);
      this.targetY = randomRange(PLAY_AREA_TOP + 50, PLAY_AREA_TOP + 150);
    }
    
    this.x += (this.targetX - this.x) * 0.02;
    this.y += (this.targetY - this.y) * 0.02;
    
    // Shooting patterns based on phase
    if (this.shootTimer >= 30) {
      this.shoot(p);
      this.shootTimer = 0;
    }
    
    // Phase transitions
    if (this.health < this.maxHealth * 0.5 && this.phase === 1) {
      this.phase = 2;
    }
  }
  
  shoot(p) {
    if (!gameState.player) return;
    
    if (this.phase === 1) {
      // Spread pattern
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i + this.animFrame * 0.05;
        const speed = 2;
        const bullet = new EnemyBullet(
          this.x,
          this.y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        );
        gameState.bullets.push(bullet);
      }
    } else {
      // Aimed + spread pattern
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const baseAngle = Math.atan2(dy, dx);
      
      for (let i = -2; i <= 2; i++) {
        const angle = baseAngle + i * 0.3;
        const speed = 3;
        const bullet = new EnemyBullet(
          this.x,
          this.y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        );
        gameState.bullets.push(bullet);
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
    // Victory!
    createExplosion(window.gameInstance, this.x, this.y, [255, 200, 0], 40);
    
    // Drop lots of items
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 / 20) * i;
      const dist = 30;
      const x = this.x + Math.cos(angle) * dist;
      const y = this.y + Math.sin(angle) * dist;
      
      const item = new PointItem(x, y);
      gameState.collectibles.push(item);
    }
    
    gameState.boss = null;
    gameState.bossActive = false;
    gameState.gamePhase = "GAME_OVER_WIN";
    
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Aura
    p.noFill();
    p.stroke(255, 200, 0, 100);
    p.strokeWeight(3);
    p.circle(0, 0, this.radius * 2 + Math.sin(this.animFrame * 0.1) * 10);
    
    // Body
    p.fill(200, 100, 255);
    p.stroke(255, 200, 255);
    p.strokeWeight(3);
    p.circle(0, 0, this.radius * 2);
    
    // Eyes
    p.fill(255, 0, 0);
    p.noStroke();
    p.circle(-10, -5, 8);
    p.circle(10, -5, 8);
    
    p.pop();
    
    // Health bar (full width)
    const healthRatio = this.health / this.maxHealth;
    const barWidth = PLAY_AREA_WIDTH;
    const barHeight = 15;
    const barX = PLAY_AREA_LEFT;
    const barY = PLAY_AREA_TOP - 20;
    
    p.push();
    p.fill(100, 0, 0);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);
    
    p.fill(255, 100, 100);
    p.rect(barX, barY, barWidth * healthRatio, barHeight);
    
    p.noFill();
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(barX, barY, barWidth, barHeight);
    
    // Boss name
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text('Mysterious Ship Guardian', barX + barWidth / 2, barY + barHeight / 2);
    p.pop();
  }
}

// Player Bullet class
export class PlayerBullet {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 4;
    this.damage = 5;
  }
  
  update(p) {
    this.x += this.vx;
    this.y += this.vy;
    
    // Check collision with enemies
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
      const enemy = gameState.enemies[i];
      if (distance(this.x, this.y, enemy.x, enemy.y) < this.radius + enemy.radius) {
        enemy.takeDamage(this.damage);
        this.destroy();
        return;
      }
    }
    
    // Check collision with boss
    if (gameState.boss) {
      if (distance(this.x, this.y, gameState.boss.x, gameState.boss.y) < this.radius + gameState.boss.radius) {
        gameState.boss.takeDamage(this.damage);
        this.destroy();
        return;
      }
    }
    
    // Remove if off screen
    if (this.y < PLAY_AREA_TOP - 20 || this.x < PLAY_AREA_LEFT - 20 || 
        this.x > PLAY_AREA_RIGHT + 20) {
      this.destroy();
    }
  }
  
  destroy() {
    const index = gameState.playerBullets.indexOf(this);
    if (index > -1) {
      gameState.playerBullets.splice(index, 1);
    }
  }
  
  render(p) {
    p.push();
    p.fill(255, 255, 100);
    p.noStroke();
    p.circle(this.x, this.y, this.radius * 2);
    
    // Trail
    p.fill(255, 255, 100, 100);
    p.circle(this.x, this.y + 5, this.radius);
    p.pop();
  }
}

// Enemy Bullet class
export class EnemyBullet {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 5;
    this.animFrame = 0;
  }
  
  update(p) {
    this.animFrame++;
    this.x += this.vx;
    this.y += this.vy;
    
    // Check collision with player
    if (gameState.player && !gameState.player.invincible) {
      const dist = distance(this.x, this.y, gameState.player.x, gameState.player.y);
      if (dist < this.radius + gameState.player.hitboxRadius) {
        gameState.player.takeDamage(p);
        this.destroy();
        return;
      }
    }
    
    // Remove if off screen
    if (this.x < PLAY_AREA_LEFT - 20 || this.x > PLAY_AREA_RIGHT + 20 ||
        this.y < PLAY_AREA_TOP - 20 || this.y > PLAY_AREA_BOTTOM + 20) {
      this.destroy();
    }
  }
  
  destroy() {
    const index = gameState.bullets.indexOf(this);
    if (index > -1) {
      gameState.bullets.splice(index, 1);
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.animFrame * 0.2);
    
    p.fill(255, 100, 100);
    p.noStroke();
    p.circle(0, 0, this.radius * 2);
    
    // Cross pattern
    p.stroke(255, 200, 200);
    p.strokeWeight(2);
    p.line(-this.radius, 0, this.radius, 0);
    p.line(0, -this.radius, 0, this.radius);
    
    p.pop();
  }
}

// Power Item class
export class PowerItem {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = randomRange(-1, 1);
    this.vy = randomRange(-2, -1);
    this.radius = 6;
    this.value = 0.01;
    this.isAttractable = true;
    this.animFrame = 0;
  }
  
  update(p) {
    this.animFrame++;
    this.vy += 0.1; // Gravity
    this.x += this.vx;
    this.y += this.vy;
    
    // Bounce off walls
    if (this.x < PLAY_AREA_LEFT || this.x > PLAY_AREA_RIGHT) {
      this.vx *= -0.8;
      this.x = clamp(this.x, PLAY_AREA_LEFT, PLAY_AREA_RIGHT);
    }
    if (this.y > PLAY_AREA_BOTTOM) {
      this.vy *= -0.8;
      this.y = PLAY_AREA_BOTTOM;
    }
    
    // Slow down
    this.vx *= 0.98;
    this.vy *= 0.98;
    
    // Check collision with player
    if (gameState.player) {
      const dist = distance(this.x, this.y, gameState.player.x, gameState.player.y);
      if (dist < this.radius + 8) {
        this.collect();
      }
    }
  }
  
  collect() {
    gameState.power = Math.min(gameState.maxPower, gameState.power + this.value);
    
    // Bonus points if at max power
    if (gameState.power >= gameState.maxPower) {
      gameState.score += 1000;
    }
    
    this.destroy();
  }
  
  destroy() {
    const index = gameState.collectibles.indexOf(this);
    if (index > -1) {
      gameState.collectibles.splice(index, 1);
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.animFrame * 0.1);
    
    p.fill(255, 0, 0);
    p.noStroke();
    p.circle(0, 0, this.radius * 2);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text('P', 0, 0);
    
    p.pop();
  }
}

// Point Item class
export class PointItem {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = randomRange(-1, 1);
    this.vy = randomRange(-2, -1);
    this.radius = 6;
    this.baseValue = 1000;
    this.isAttractable = true;
    this.animFrame = 0;
  }
  
  update(p) {
    this.animFrame++;
    this.vy += 0.1; // Gravity
    this.x += this.vx;
    this.y += this.vy;
    
    // Bounce off walls
    if (this.x < PLAY_AREA_LEFT || this.x > PLAY_AREA_RIGHT) {
      this.vx *= -0.8;
      this.x = clamp(this.x, PLAY_AREA_LEFT, PLAY_AREA_RIGHT);
    }
    if (this.y > PLAY_AREA_BOTTOM) {
      this.vy *= -0.8;
      this.y = PLAY_AREA_BOTTOM;
    }
    
    // Slow down
    this.vx *= 0.98;
    this.vy *= 0.98;
    
    // Check collision with player
    if (gameState.player) {
      const dist = distance(this.x, this.y, gameState.player.x, gameState.player.y);
      if (dist < this.radius + 8) {
        this.collect();
      }
    }
  }
  
  collect() {
    // Higher value at top of screen
    const heightRatio = 1 - ((this.y - PLAY_AREA_TOP) / PLAY_AREA_HEIGHT);
    const value = Math.floor(this.baseValue * heightRatio * Math.min(1, gameState.maxPointValue / 10000));
    gameState.score += Math.max(100, value);
    
    this.destroy();
  }
  
  destroy() {
    const index = gameState.collectibles.indexOf(this);
    if (index > -1) {
      gameState.collectibles.splice(index, 1);
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.animFrame * 0.1);
    
    // Star shape
    p.fill(255, 255, 0);
    p.noStroke();
    p.beginShape();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
      const x = Math.cos(angle) * this.radius;
      const y = Math.sin(angle) * this.radius;
      p.vertex(x, y);
      
      const angle2 = (Math.PI * 2 / 5) * i + Math.PI / 5 - Math.PI / 2;
      const x2 = Math.cos(angle2) * (this.radius * 0.5);
      const y2 = Math.sin(angle2) * (this.radius * 0.5);
      p.vertex(x2, y2);
    }
    p.endShape(p.CLOSE);
    
    p.pop();
  }
}

// Bentler Item class
export class BentlerItem {
  constructor(x, y, color, isWild = false) {
    this.x = x;
    this.y = y;
    this.vx = randomRange(-1, 1);
    this.vy = randomRange(-2, -1);
    this.radius = 8;
    this.color = color;
    this.isWild = isWild; // Changes color periodically
    this.colorChangeTimer = 0;
    this.colorChangeInterval = 60;
    this.frozenByPlayer = false;
    this.animFrame = 0;
    this.lifetime = 600; // 10 seconds
    this.age = 0;
  }
  
  update(p) {
    this.animFrame++;
    this.age++;
    
    // Disappear after lifetime
    if (this.age >= this.lifetime) {
      this.destroy();
      return;
    }
    
    // Physics
    this.vy += 0.1;
    this.x += this.vx;
    this.y += this.vy;
    
    // Bounce off walls
    if (this.x < PLAY_AREA_LEFT || this.x > PLAY_AREA_RIGHT) {
      this.vx *= -0.8;
      this.x = clamp(this.x, PLAY_AREA_LEFT, PLAY_AREA_RIGHT);
    }
    if (this.y > PLAY_AREA_BOTTOM) {
      this.vy *= -0.8;
      this.y = PLAY_AREA_BOTTOM;
    }
    
    // Slow down
    this.vx *= 0.98;
    this.vy *= 0.98;
    
    // Color change for wild items
    if (this.isWild && gameState.player) {
      const dist = distance(this.x, this.y, gameState.player.x, gameState.player.y);
      this.frozenByPlayer = dist < 60;
      
      if (!this.frozenByPlayer) {
        this.colorChangeTimer++;
        if (this.colorChangeTimer >= this.colorChangeInterval) {
          const colors = [BENTLER_RED, BENTLER_BLUE, BENTLER_GREEN];
          const currentIndex = colors.indexOf(this.color);
          this.color = colors[(currentIndex + 1) % colors.length];
          this.colorChangeTimer = 0;
        }
      }
    }
    
    // Check collision with player
    if (gameState.player) {
      const dist = distance(this.x, this.y, gameState.player.x, gameState.player.y);
      if (dist < this.radius + 8) {
        this.collect();
      }
    }
  }
  
  collect() {
    // Add to bentler stock
    gameState.bentlerStock.push(this.color);
    
    // Check if UFO should spawn
    if (gameState.bentlerStock.length >= 3) {
      this.spawnUFO();
    }
    
    this.destroy();
  }
  
  spawnUFO() {
    const stock = [...gameState.bentlerStock];
    gameState.bentlerStock = [];
    
    // Determine UFO type
    const red = stock.filter(c => c === BENTLER_RED).length;
    const blue = stock.filter(c => c === BENTLER_BLUE).length;
    const green = stock.filter(c => c === BENTLER_GREEN).length;
    
    let ufoType;
    if (red === 3) {
      ufoType = UFO_RED;
    } else if (blue === 3) {
      ufoType = UFO_BLUE;
    } else if (green === 3) {
      ufoType = UFO_GREEN;
    } else {
      ufoType = UFO_RAINBOW;
    }
    
    // Spawn UFO
    const ufo = new UFO(PLAY_AREA_LEFT + PLAY_AREA_WIDTH / 2, PLAY_AREA_TOP + 50, ufoType);
    gameState.ufos.push(ufo);
  }
  
  destroy() {
    const index = gameState.bentlerItems.indexOf(this);
    if (index > -1) {
      gameState.bentlerItems.splice(index, 1);
    }
  }
  
  getColorRGB() {
    switch (this.color) {
      case BENTLER_RED:
        return [255, 100, 100];
      case BENTLER_BLUE:
        return [100, 100, 255];
      case BENTLER_GREEN:
        return [100, 255, 100];
      default:
        return [255, 255, 255];
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    const rgb = this.getColorRGB();
    
    // Flashing if wild
    if (this.isWild && !this.frozenByPlayer) {
      const flash = Math.sin(this.animFrame * 0.3);
      p.fill(rgb[0], rgb[1], rgb[2], 150 + flash * 100);
    } else {
      p.fill(...rgb);
    }
    
    p.noStroke();
    
    // Pentagon shape
    p.beginShape();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
      const x = Math.cos(angle) * this.radius;
      const y = Math.sin(angle) * this.radius;
      p.vertex(x, y);
    }
    p.endShape(p.CLOSE);
    
    // Indicator if this will spawn UFO
    if (gameState.bentlerStock.length === 2) {
      p.noFill();
      p.stroke(255, 255, 0);
      p.strokeWeight(2);
      p.beginShape();
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
        const x = Math.cos(angle) * (this.radius + 4);
        const y = Math.sin(angle) * (this.radius + 4);
        p.vertex(x, y);
      }
      p.endShape(p.CLOSE);
    }
    
    p.pop();
  }
}

// UFO class
export class UFO {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 20;
    this.health = 30;
    this.maxHealth = 30;
    this.vx = 2;
    this.vy = 0;
    this.animFrame = 0;
    this.lifetime = 360; // 6 seconds to destroy it
    this.age = 0;
    this.absorbedItems = {
      power: 0,
      points: 0
    };
    this.specialBonus = false;
    this.absorptionRadius = 100;
  }
  
  update(p) {
    this.animFrame++;
    this.age++;
    
    // Escape if lifetime exceeded or boss present
    if (this.age >= this.lifetime || gameState.bossActive) {
      this.escape();
      return;
    }
    
    // Move in sine wave
    this.x += this.vx;
    this.y += Math.sin(this.animFrame * 0.1) * 0.5;
    
    // Bounce off walls
    if (this.x < PLAY_AREA_LEFT + this.radius || this.x > PLAY_AREA_RIGHT - this.radius) {
      this.vx *= -1;
    }
    
    // Absorb items
    this.absorbItems();
    
    // Check if special bonus achieved
    if (this.absorbedItems.power + this.absorbedItems.points >= 10) {
      this.specialBonus = true;
    }
  }
  
  absorbItems() {
    // Absorb power items
    for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
      const item = gameState.collectibles[i];
      const dist = distance(this.x, this.y, item.x, item.y);
      
      if (dist < this.absorptionRadius) {
        // Pull item toward UFO
        const dx = this.x - item.x;
        const dy = this.y - item.y;
        const force = 1 - (dist / this.absorptionRadius);
        item.vx = dx * force * 0.5;
        item.vy = dy * force * 0.5;
        
        // Absorb if close enough
        if (dist < this.radius) {
          if (item instanceof PowerItem) {
            this.absorbedItems.power++;
          } else if (item instanceof PointItem) {
            this.absorbedItems.points++;
          }
          gameState.collectibles.splice(i, 1);
        }
      }
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.destroy();
    }
  }
  
  destroy() {
    // Clear bullets
    gameState.bullets.forEach(bullet => {
      createExplosion(window.gameInstance, bullet.x, bullet.y, [100, 200, 255], 3);
    });
    gameState.bullets = [];
    
    // Release items with bonuses
    this.releaseItems();
    
    // Explosion
    createExplosion(window.gameInstance, this.x, this.y, [255, 255, 0], 20);
    
    // Remove from array
    const index = gameState.ufos.indexOf(this);
    if (index > -1) {
      gameState.ufos.splice(index, 1);
    }
  }
  
  escape() {
    // Items are lost
    const index = gameState.ufos.indexOf(this);
    if (index > -1) {
      gameState.ufos.splice(index, 1);
    }
  }
  
  releaseItems() {
    const p = window.gameInstance;
    let multiplier = 1;
    let convertToPoints = false;
    let convertToPower = false;
    
    switch (this.type) {
      case UFO_RED:
        // Power items become points at 2x if max power
        if (gameState.power >= gameState.maxPower) {
          multiplier = 2;
        }
        // Drop life fragments
        if (this.specialBonus) {
          // Drop extra life fragment
          gameState.score += 10000;
        }
        break;
        
      case UFO_BLUE:
        // Points get 2-6x multiplier
        multiplier = this.specialBonus ? 8 : randomInt(2, 6);
        break;
        
      case UFO_GREEN:
        // Points get 2x multiplier
        multiplier = 2;
        // Drop spell card fragments
        if (this.specialBonus) {
          gameState.spellCards++;
        }
        break;
        
      case UFO_RAINBOW:
        // Power becomes points (2-3x), points become power
        convertToPoints = true;
        multiplier = this.specialBonus ? 4 : randomRange(2, 3);
        if (this.specialBonus) {
          // Drop bentler items
          for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const dist = 30;
            const x = this.x + Math.cos(angle) * dist;
            const y = this.y + Math.sin(angle) * dist;
            const color = randomChoice([BENTLER_RED, BENTLER_BLUE, BENTLER_GREEN]);
            const item = new BentlerItem(x, y, color);
            gameState.bentlerItems.push(item);
          }
        }
        break;
    }
    
    // Release absorbed power items
    for (let i = 0; i < this.absorbedItems.power; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 40;
      const x = this.x + Math.cos(angle) * dist;
      const y = this.y + Math.sin(angle) * dist;
      
      if (this.type === UFO_RAINBOW) {
        // Convert to points
        const value = Math.floor(1000 * multiplier);
        gameState.score += value;
      } else {
        const item = new PowerItem(x, y);
        gameState.collectibles.push(item);
      }
    }
    
    // Release absorbed point items
    for (let i = 0; i < this.absorbedItems.points; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 40;
      const x = this.x + Math.cos(angle) * dist;
      const y = this.y + Math.sin(angle) * dist;
      
      if (this.type === UFO_RAINBOW) {
        // Convert to power
        const item = new PowerItem(x, y);
        gameState.collectibles.push(item);
      } else {
        const item = new PointItem(x, y);
        item.baseValue *= multiplier;
        gameState.collectibles.push(item);
      }
    }
  }
  
  getColorRGB() {
    switch (this.type) {
      case UFO_RED:
        return [255, 100, 100];
      case UFO_BLUE:
        return [100, 100, 255];
      case UFO_GREEN:
        return [100, 255, 100];
      case UFO_RAINBOW:
        return [255, 200, 255];
      default:
        return [255, 255, 255];
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    const rgb = this.getColorRGB();
    
    // Special bonus aura
    if (this.specialBonus) {
      p.noFill();
      p.stroke(255, 255, 0, 150);
      p.strokeWeight(3);
      p.circle(0, 0, this.radius * 2 + Math.sin(this.animFrame * 0.2) * 10);
    }
    
    // UFO body
    p.fill(...rgb, 200);
    p.stroke(255);
    p.strokeWeight(2);
    p.ellipse(0, 0, this.radius * 2, this.radius * 1.2);
    
    // Dome
    p.fill(...rgb.map(c => c * 1.3));
    p.arc(0, -5, this.radius, this.radius, Math.PI, 0);
    
    // Lights
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 / 3) * i + this.animFrame * 0.1;
      const x = Math.cos(angle) * this.radius * 0.7;
      const y = 0;
      p.fill(255, 255, 0, 200);
      p.noStroke();
      p.circle(x, y, 4);
    }
    
    // Health bar
    p.pop();
    p.push();
    const healthRatio = this.health / this.maxHealth;
    p.fill(255, 0, 0);
    p.noStroke();
    p.rect(this.x - 15, this.y + this.radius + 5, 30 * healthRatio, 3);
    p.noFill();
    p.stroke(255);
    p.strokeWeight(1);
    p.rect(this.x - 15, this.y + this.radius + 5, 30, 3);
    
    // Timer bar
    const timeRatio = 1 - (this.age / this.lifetime);
    p.fill(0, 255, 0);
    p.noStroke();
    p.rect(this.x - 15, this.y + this.radius + 10, 30 * timeRatio, 2);
    
    p.pop();
  }
}