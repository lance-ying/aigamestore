import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Enemy {
  constructor(p, x, y, type = 'basic') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 10;
    
    // Stats based on type
    this.setupStats(type);
    
    // Movement
    this.vx = 0;
    this.vy = 0;
    this.targetX = x;
    this.targetY = y;
    
    // Combat
    this.attackCooldown = 0;
    this.hitFlash = 0;
    
    // Animation
    this.angle = 0;
    this.animFrame = p.random(100);
  }
  
  setupStats(type) {
    const waveMultiplier = 1 + (gameState.waveLevel - 1) * 0.15;
    
    switch (type) {
      case 'basic':
        this.maxHealth = 20 * waveMultiplier;
        this.health = this.maxHealth;
        this.moveSpeed = 1.2 * Math.min(1 + (gameState.waveLevel - 1) * 0.05, 2);
        this.damage = 10 * waveMultiplier;
        this.expValue = 5;
        this.color = [200, 100, 100];
        this.attackRange = 0; // Melee
        this.shootSpeed = 0;
        break;
        
      case 'fast':
        this.maxHealth = 15 * waveMultiplier;
        this.health = this.maxHealth;
        this.moveSpeed = 2.5 * Math.min(1 + (gameState.waveLevel - 1) * 0.05, 2);
        this.damage = 8 * waveMultiplier;
        this.expValue = 8;
        this.color = [255, 150, 50];
        this.radius = 8;
        this.attackRange = 0;
        this.shootSpeed = 0;
        break;
        
      case 'shooter':
        this.maxHealth = 25 * waveMultiplier;
        this.health = this.maxHealth;
        this.moveSpeed = 0.8 * Math.min(1 + (gameState.waveLevel - 1) * 0.05, 1.5);
        this.damage = 15 * waveMultiplier;
        this.expValue = 12;
        this.color = [100, 150, 200];
        this.attackRange = 200;
        this.shootSpeed = 5;
        this.attackCooldownMax = 90; // 1.5 seconds
        break;
        
      case 'tank':
        this.maxHealth = 50 * waveMultiplier;
        this.health = this.maxHealth;
        this.moveSpeed = 0.6 * Math.min(1 + (gameState.waveLevel - 1) * 0.05, 1.2);
        this.damage = 20 * waveMultiplier;
        this.expValue = 15;
        this.color = [150, 100, 150];
        this.radius = 15;
        this.attackRange = 0;
        this.shootSpeed = 0;
        break;
        
      case 'boss':
        this.maxHealth = 500 * waveMultiplier;
        this.health = this.maxHealth;
        this.moveSpeed = 1.5;
        this.damage = 25 * waveMultiplier;
        this.expValue = 100;
        this.color = [200, 50, 50];
        this.radius = 30;
        this.attackRange = 250;
        this.shootSpeed = 6;
        this.attackCooldownMax = 30; // 0.5 seconds
        this.isBoss = true;
        break;
    }
    
    this.attackCooldown = this.attackCooldownMax || 0;
  }
  
  update(p) {
    if (!gameState.player) return;
    
    this.animFrame++;
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.hitFlash > 0) this.hitFlash--;
    
    // AI behavior
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const dist = p.dist(this.x, this.y, gameState.player.x, gameState.player.y);
    
    this.angle = p.atan2(dy, dx);
    
    // Ranged enemies keep distance
    if (this.attackRange > 0 && dist < this.attackRange * 0.7) {
      // Move away
      this.vx = -p.cos(this.angle) * this.moveSpeed;
      this.vy = -p.sin(this.angle) * this.moveSpeed;
    } else {
      // Move toward player
      this.vx = p.cos(this.angle) * this.moveSpeed;
      this.vy = p.sin(this.angle) * this.moveSpeed;
    }
    
    // Apply movement
    this.x += this.vx;
    this.y += this.vy;
    
    // Keep on screen
    this.x = p.constrain(this.x, this.radius, CANVAS_WIDTH - this.radius);
    this.y = p.constrain(this.y, this.radius, CANVAS_HEIGHT - this.radius);
    
    // Attack
    if (this.attackRange > 0 && dist < this.attackRange && this.attackCooldown <= 0) {
      this.shoot(p);
      this.attackCooldown = this.attackCooldownMax;
    }
    
    // Melee damage on collision
    if (this.attackRange === 0) {
      const collisionDist = this.radius + gameState.player.radius;
      if (dist < collisionDist) {
        gameState.player.takeDamage(this.damage * 0.016); // Per frame damage
      }
    }
  }
  
  shoot(p) {
    const angle = p.atan2(gameState.player.y - this.y, gameState.player.x - this.x);
    
    const projectile = {
      x: this.x,
      y: this.y,
      vx: p.cos(angle) * this.shootSpeed,
      vy: p.sin(angle) * this.shootSpeed,
      radius: 5,
      damage: this.damage,
      lifetime: 180,
      owner: 'enemy',
      color: this.color
    };
    
    gameState.projectiles.push(projectile);
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.hitFlash = 5;
    
    if (this.health <= 0) {
      this.onDeath();
      return true;
    }
    return false;
  }
  
  onDeath() {
    // Drop experience
    for (let i = 0; i < (this.isBoss ? 10 : 1); i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      gameState.experienceOrbs.push({
        x: this.x + Math.cos(angle) * 10,
        y: this.y + Math.sin(angle) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: this.isBoss ? 8 : 5,
        value: this.expValue,
        life: 600
      });
    }
    
    // Death particles
    this.createDeathParticles();
    
    // Boss death = win
    if (this.isBoss) {
      gameState.gamePhase = "GAME_OVER_WIN";
    }
  }
  
  createDeathParticles() {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      gameState.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        color: this.color,
        size: this.radius * 0.5
      });
    }
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Flash when hit
    if (this.hitFlash > 0) {
      p.fill(255);
    } else {
      p.fill(...this.color);
    }
    
    // Body
    p.noStroke();
    
    if (this.isBoss) {
      // Boss design
      p.circle(0, 0, this.radius * 2);
      
      // Horns
      p.fill(100, 50, 50);
      p.triangle(-this.radius, -this.radius, -this.radius - 10, -this.radius - 15, -this.radius + 5, -this.radius);
      p.triangle(this.radius, -this.radius, this.radius + 10, -this.radius - 15, this.radius - 5, -this.radius);
      
      // Eyes
      p.fill(255, 0, 0);
      p.circle(-8, -5, 6);
      p.circle(8, -5, 6);
    } else {
      // Regular enemy
      p.circle(0, 0, this.radius * 2);
      
      // Hat
      p.fill(50);
      p.rect(-this.radius * 0.7, -this.radius - 5, this.radius * 1.4, 3);
      p.rect(-this.radius * 0.4, -this.radius - 8, this.radius * 0.8, 5);
      
      // Eyes
      p.fill(0);
      p.circle(-this.radius * 0.3, -2, 2);
      p.circle(this.radius * 0.3, -2, 2);
    }
    
    p.pop();
    
    // Health bar
    if (this.health < this.maxHealth || this.isBoss) {
      this.drawHealthBar(p);
    }
  }
  
  drawHealthBar(p) {
    const barWidth = this.isBoss ? 60 : 30;
    const barHeight = this.isBoss ? 6 : 4;
    const x = this.x - barWidth / 2;
    const y = this.y - this.radius - (this.isBoss ? 40 : 15);
    
    p.fill(50);
    p.noStroke();
    p.rect(x, y, barWidth, barHeight);
    
    const healthRatio = this.health / this.maxHealth;
    p.fill(255 * (1 - healthRatio), 255 * healthRatio, 0);
    p.rect(x, y, barWidth * healthRatio, barHeight);
  }
}

export function spawnEnemy(p, type = null) {
  // Choose random spawn point on edge
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  
  switch (edge) {
    case 0: // Top
      x = Math.random() * CANVAS_WIDTH;
      y = -20;
      break;
    case 1: // Right
      x = CANVAS_WIDTH + 20;
      y = Math.random() * CANVAS_HEIGHT;
      break;
    case 2: // Bottom
      x = Math.random() * CANVAS_WIDTH;
      y = CANVAS_HEIGHT + 20;
      break;
    case 3: // Left
      x = -20;
      y = Math.random() * CANVAS_HEIGHT;
      break;
  }
  
  // Choose enemy type
  if (!type) {
    const rand = Math.random();
    if (rand < 0.5) type = 'basic';
    else if (rand < 0.7) type = 'fast';
    else if (rand < 0.85) type = 'shooter';
    else type = 'tank';
  }
  
  const enemy = new Enemy(p, x, y, type);
  gameState.enemies.push(enemy);
  gameState.entities.push(enemy);
  
  return enemy;
}

export function spawnBoss(p) {
  const boss = new Enemy(p, CANVAS_WIDTH / 2, -50, 'boss');
  gameState.enemies.push(boss);
  gameState.entities.push(boss);
  gameState.currentBoss = boss;
  return boss;
}