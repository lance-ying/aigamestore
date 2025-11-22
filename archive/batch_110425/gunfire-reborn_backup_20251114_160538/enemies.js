// enemies.js - Enemy entities
import { gameState, ENEMY_NORMAL, ENEMY_ELITE, ENEMY_BOSS, ROOM_WIDTH, ROOM_HEIGHT } from './globals.js';
import { distance, angleBetween, randomRange } from './utils.js';

export class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.vx = 0;
    this.vy = 0;
    
    // Stats based on type
    switch (type) {
      case ENEMY_NORMAL:
        this.maxHealth = 30;
        this.health = this.maxHealth;
        this.speed = 1.5;
        this.damage = 10;
        this.radius = 10;
        this.color = [255, 100, 100];
        this.goldDrop = 5;
        this.expDrop = 10;
        break;
        
      case ENEMY_ELITE:
        this.maxHealth = 80;
        this.health = this.maxHealth;
        this.speed = 2;
        this.damage = 20;
        this.radius = 15;
        this.color = [255, 150, 0];
        this.goldDrop = 20;
        this.expDrop = 50;
        this.shootInterval = 120;
        this.lastShot = 0;
        break;
        
      case ENEMY_BOSS:
        this.maxHealth = 300;
        this.health = this.maxHealth;
        this.speed = 1;
        this.damage = 30;
        this.radius = 25;
        this.color = [200, 50, 200];
        this.goldDrop = 100;
        this.expDrop = 200;
        this.shootInterval = 60;
        this.lastShot = 0;
        this.phase = 1;
        break;
    }
    
    this.alive = true;
    this.hitFlash = 0;
    
    // AI state
    this.targetX = x;
    this.targetY = y;
    this.aggroRange = 400;
    this.attackRange = 50;
    this.wanderTimer = 0;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.hitFlash = 10;
    
    if (this.health <= 0) {
      this.alive = false;
      return true;
    }
    
    // Boss phase transition
    if (this.type === ENEMY_BOSS && this.health <= this.maxHealth / 2 && this.phase === 1) {
      this.phase = 2;
      this.speed *= 1.5;
      this.shootInterval = 40;
    }
    
    return false;
  }
  
  update() {
    if (!this.alive) return;
    
    const player = gameState.player;
    if (!player) return;
    
    const distToPlayer = distance(this.x, this.y, player.x, player.y);
    
    // AI behavior
    if (distToPlayer < this.aggroRange) {
      // Chase player
      const angle = angleBetween(this.x, this.y, player.x, player.y);
      
      if (distToPlayer > this.attackRange) {
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
      } else {
        // Attack range - slow down
        this.vx *= 0.5;
        this.vy *= 0.5;
        
        // Contact damage
        if (distToPlayer < this.radius + player.radius) {
          if (player.takeDamage(this.damage)) {
            // Player died
          }
        }
      }
      
      // Ranged attacks for elite and boss
      if ((this.type === ENEMY_ELITE || this.type === ENEMY_BOSS) && 
          gameState.frameCount - this.lastShot >= this.shootInterval) {
        this.shoot(player);
      }
    } else {
      // Wander
      this.wanderTimer++;
      if (this.wanderTimer > 120) {
        this.targetX = randomRange(50, ROOM_WIDTH - 50);
        this.targetY = randomRange(50, ROOM_HEIGHT - 50);
        this.wanderTimer = 0;
      }
      
      const angleToTarget = angleBetween(this.x, this.y, this.targetX, this.targetY);
      this.vx = Math.cos(angleToTarget) * this.speed * 0.5;
      this.vy = Math.sin(angleToTarget) * this.speed * 0.5;
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Boundary check
    this.x = Math.max(this.radius, Math.min(ROOM_WIDTH - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(ROOM_HEIGHT - this.radius, this.y));
    
    // Apply friction
    this.vx *= 0.9;
    this.vy *= 0.9;
    
    // Update effects
    if (this.hitFlash > 0) this.hitFlash--;
  }
  
  shoot(player) {
    this.lastShot = gameState.frameCount;
    
    const angle = angleBetween(this.x, this.y, player.x, player.y);
    
    // Create enemy projectile
    const projectile = {
      x: this.x,
      y: this.y,
      vx: Math.cos(angle) * 5,
      vy: Math.sin(angle) * 5,
      radius: 5,
      damage: this.damage,
      isEnemy: true,
      color: this.type === ENEMY_BOSS ? [200, 50, 200] : [255, 150, 0]
    };
    
    gameState.projectiles.push(projectile);
    
    // Boss shoots multiple projectiles in phase 2
    if (this.type === ENEMY_BOSS && this.phase === 2) {
      for (let i = -1; i <= 1; i += 0.5) {
        if (i === 0) continue;
        const spreadAngle = angle + i * 0.3;
        gameState.projectiles.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(spreadAngle) * 5,
          vy: Math.sin(spreadAngle) * 5,
          radius: 5,
          damage: this.damage,
          isEnemy: true,
          color: [200, 50, 200]
        });
      }
    }
  }
  
  draw(p) {
    const screenPos = this.getScreenPosition();
    
    p.push();
    
    // Hit flash
    if (this.hitFlash > 0) {
      p.fill(255, 255, 255);
    } else {
      p.fill(...this.color);
    }
    
    p.stroke(0);
    p.strokeWeight(2);
    p.circle(screenPos.x, screenPos.y, this.radius * 2);
    
    // Elite/Boss indicators
    if (this.type === ENEMY_ELITE) {
      p.stroke(255, 200, 0);
      p.strokeWeight(3);
      p.noFill();
      p.circle(screenPos.x, screenPos.y, this.radius * 2 + 5);
    } else if (this.type === ENEMY_BOSS) {
      p.stroke(255, 100, 255);
      p.strokeWeight(4);
      p.noFill();
      p.circle(screenPos.x, screenPos.y, this.radius * 2 + 8);
      
      // Phase 2 indicator
      if (this.phase === 2) {
        p.stroke(255, 0, 255);
        p.strokeWeight(2);
        p.circle(screenPos.x, screenPos.y, this.radius * 2 + 12);
      }
    }
    
    // Health bar
    const barWidth = this.radius * 2;
    const barHeight = 4;
    const healthPercent = this.health / this.maxHealth;
    
    p.noStroke();
    p.fill(50);
    p.rect(screenPos.x - barWidth / 2, screenPos.y - this.radius - 10, barWidth, barHeight);
    
    p.fill(0, 255, 0);
    p.rect(screenPos.x - barWidth / 2, screenPos.y - this.radius - 10, barWidth * healthPercent, barHeight);
    
    p.pop();
  }
  
  getScreenPosition() {
    return {
      x: this.x - gameState.cameraX + 300,
      y: this.y - gameState.cameraY + 200
    };
  }
}

export function spawnEnemies(roomType, act) {
  const enemies = [];
  
  if (roomType === "boss") {
    // Spawn boss in center
    enemies.push(new Enemy(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, ENEMY_BOSS));
    
    // Add some normal enemies
    for (let i = 0; i < 3 + act; i++) {
      const angle = (Math.PI * 2 * i) / (3 + act);
      const x = ROOM_WIDTH / 2 + Math.cos(angle) * 200;
      const y = ROOM_HEIGHT / 2 + Math.sin(angle) * 200;
      enemies.push(new Enemy(x, y, ENEMY_NORMAL));
    }
  } else if (roomType === "elite") {
    // Spawn elite enemies
    const count = 2 + Math.floor(act / 2);
    for (let i = 0; i < count; i++) {
      const x = randomRange(100, ROOM_WIDTH - 100);
      const y = randomRange(100, ROOM_HEIGHT - 100);
      enemies.push(new Enemy(x, y, ENEMY_ELITE));
    }
    
    // Add normal enemies
    for (let i = 0; i < 4 + act * 2; i++) {
      const x = randomRange(100, ROOM_WIDTH - 100);
      const y = randomRange(100, ROOM_HEIGHT - 100);
      enemies.push(new Enemy(x, y, ENEMY_NORMAL));
    }
  } else {
    // Normal room
    const count = 5 + act * 3;
    for (let i = 0; i < count; i++) {
      const x = randomRange(100, ROOM_WIDTH - 100);
      const y = randomRange(100, ROOM_HEIGHT - 100);
      enemies.push(new Enemy(x, y, ENEMY_NORMAL));
    }
  }
  
  return enemies;
}