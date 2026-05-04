// enemies.js - Enemy entities
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { DamageParticle } from './player.js';

export class Enemy {
  constructor(p, x, y, type = 'basic') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 20;
    this.height = 20;
    this.speed = 1.5;
    this.hp = 30;
    this.maxHP = 30;
    this.damage = 10;
    this.attackCooldown = 0;
    this.dead = false;
    this.deathTimer = 0;
    this.animFrame = 0;
    this.animTimer = 0;
    this.moveTimer = 0;
    this.moveDirection = { x: 0, y: 0 };
  }
  
  update() {
    if (this.dead) {
      this.deathTimer++;
      return;
    }
    
    this.animTimer++;
    if (this.animTimer > 15) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }
    
    if (this.attackCooldown > 0) this.attackCooldown--;
    
    // AI behavior
    const player = gameState.player;
    if (player) {
      const dist = this.p.dist(this.x, this.y, player.x, player.y);
      
      if (dist < 150) {
        // Chase player
        const angle = this.p.atan2(player.y - this.y, player.x - this.x);
        const dx = this.p.cos(angle) * this.speed;
        const dy = this.p.sin(angle) * this.speed;
        
        this.x += dx;
        this.y += dy;
        
        // Attack if close
        if (dist < 30 && this.attackCooldown <= 0) {
          player.takeDamage(this.damage);
          this.attackCooldown = 40;
        }
      } else {
        // Wander
        this.moveTimer++;
        if (this.moveTimer > 60) {
          this.moveTimer = 0;
          const angle = this.p.random(this.p.TWO_PI);
          this.moveDirection = {
            x: this.p.cos(angle),
            y: this.p.sin(angle)
          };
        }
        
        this.x += this.moveDirection.x * this.speed * 0.5;
        this.y += this.moveDirection.y * this.speed * 0.5;
      }
      
      // Keep in bounds
      this.x = this.p.constrain(this.x, 20, gameState.worldWidth - 20);
      this.y = this.p.constrain(this.y, 20, gameState.worldHeight - 20);
    }
  }
  
  takeDamage(amount) {
    this.hp -= amount;
    
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      gameState.enemiesDefeated++;
      gameState.score += 100;
      
      // Spawn health drop sometimes
      if (this.p.random() < 0.3) {
        gameState.entities.push(new HealthDrop(this.p, this.x, this.y));
      }
    }
    
    // Create damage particles
    for (let i = 0; i < 3; i++) {
      gameState.particles.push(new DamageParticle(this.p, this.x, this.y));
    }
  }
  
  render() {
    this.p.push();
    
    if (gameState.hasScrolling) {
      this.p.translate(-gameState.cameraX, -gameState.cameraY);
    }
    
    if (this.dead) {
      // Fade out
      const alpha = this.p.map(this.deathTimer, 0, 30, 255, 0);
      this.p.fill(gameState.hasColor ? [200, 50, 50, alpha] : [150, alpha]);
      this.p.noStroke();
      this.p.rectMode(this.p.CENTER);
      this.p.rect(this.x, this.y, this.width * 0.5, this.height * 0.5, 2);
    } else {
      // Draw enemy
      if (gameState.hasColor) {
        this.p.fill(200, 50, 50);
        this.p.stroke(150, 30, 30);
      } else {
        this.p.fill(180);
        this.p.stroke(120);
      }
      
      this.p.strokeWeight(2);
      this.p.rectMode(this.p.CENTER);
      this.p.rect(this.x, this.y, this.width, this.height, 2);
      
      // Eyes
      this.p.fill(gameState.hasColor ? [255, 200, 0] : [255]);
      this.p.noStroke();
      this.p.circle(this.x - 5, this.y - 3, 4);
      this.p.circle(this.x + 5, this.y - 3, 4);
      
      // Health bar
      if (this.hp < this.maxHP) {
        const barWidth = 20;
        const barHeight = 3;
        this.p.fill(100, 0, 0);
        this.p.rect(this.x, this.y - this.height / 2 - 8, barWidth, barHeight);
        this.p.fill(0, 255, 0);
        this.p.rect(this.x - barWidth / 2, this.y - this.height / 2 - 8, 
                   (this.hp / this.maxHP) * barWidth, barHeight);
      }
    }
    
    this.p.pop();
  }
  
  shouldRemove() {
    return this.dead && this.deathTimer > 30;
  }
}

export class Boss extends Enemy {
  constructor(p, x, y) {
    super(p, x, y, 'boss');
    this.width = 48;
    this.height = 48;
    this.hp = 150;
    this.maxHP = 150;
    this.damage = 20;
    this.speed = 2;
    this.phase = 0;
    this.phaseTimer = 0;
    this.shootCooldown = 0;
  }
  
  update() {
    if (this.dead) {
      this.deathTimer++;
      if (this.deathTimer === 1) {
        gameState.bossDefeated = true;
        gameState.gamePhase = "GAME_OVER_WIN";
      }
      return;
    }
    
    this.animTimer++;
    if (this.animTimer > 10) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }
    
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.shootCooldown > 0) this.shootCooldown--;
    
    const player = gameState.player;
    if (!player) return;
    
    const dist = this.p.dist(this.x, this.y, player.x, player.y);
    
    // Phase changes based on HP
    if (this.hp < this.maxHP * 0.66 && this.phase === 0) {
      this.phase = 1;
      this.speed = 2.5;
    } else if (this.hp < this.maxHP * 0.33 && this.phase === 1) {
      this.phase = 2;
      this.speed = 3;
    }
    
    // Movement AI
    this.phaseTimer++;
    
    if (dist > 100) {
      // Chase
      const angle = this.p.atan2(player.y - this.y, player.x - this.x);
      this.x += this.p.cos(angle) * this.speed;
      this.y += this.p.sin(angle) * this.speed;
    } else if (dist < 60) {
      // Back away
      const angle = this.p.atan2(player.y - this.y, player.x - this.x);
      this.x -= this.p.cos(angle) * this.speed * 0.5;
      this.y -= this.p.sin(angle) * this.speed * 0.5;
    } else {
      // Circle strafe
      const angle = this.p.atan2(player.y - this.y, player.x - this.x);
      const perpAngle = angle + this.p.HALF_PI;
      this.x += this.p.cos(perpAngle) * this.speed * 0.8;
      this.y += this.p.sin(perpAngle) * this.speed * 0.8;
    }
    
    // Melee attack
    if (dist < 40 && this.attackCooldown <= 0) {
      player.takeDamage(this.damage);
      this.attackCooldown = 50;
    }
    
    // Ranged attack in higher phases
    if (this.phase > 0 && this.shootCooldown <= 0) {
      this.shootCooldown = 80;
      const angle = this.p.atan2(player.y - this.y, player.x - this.x);
      gameState.entities.push(new Projectile(this.p, this.x, this.y, angle, this.damage * 0.5));
    }
    
    // Keep in bounds
    this.x = this.p.constrain(this.x, 40, gameState.worldWidth - 40);
    this.y = this.p.constrain(this.y, 40, gameState.worldHeight - 40);
  }
  
  render() {
    this.p.push();
    
    if (gameState.hasScrolling) {
      this.p.translate(-gameState.cameraX, -gameState.cameraY);
    }
    
    if (this.dead) {
      const alpha = this.p.map(this.deathTimer, 0, 60, 255, 0);
      this.p.fill(gameState.hasColor ? [150, 0, 150, alpha] : [100, alpha]);
      this.p.noStroke();
      this.p.rectMode(this.p.CENTER);
      const scale = this.p.map(this.deathTimer, 0, 60, 1, 0.3);
      this.p.rect(this.x, this.y, this.width * scale, this.height * scale, 4);
    } else {
      // Draw boss
      if (gameState.hasColor) {
        this.p.fill(150, 0, 150);
        this.p.stroke(100, 0, 100);
      } else {
        this.p.fill(100);
        this.p.stroke(80);
      }
      
      this.p.strokeWeight(3);
      this.p.rectMode(this.p.CENTER);
      this.p.rect(this.x, this.y, this.width, this.height, 4);
      
      // Crown/horns
      this.p.fill(gameState.hasColor ? [255, 215, 0] : [255]);
      this.p.triangle(
        this.x - this.width / 3, this.y - this.height / 2,
        this.x - this.width / 3 + 8, this.y - this.height / 2 - 12,
        this.x - this.width / 3 + 16, this.y - this.height / 2
      );
      this.p.triangle(
        this.x + this.width / 3 - 16, this.y - this.height / 2,
        this.x + this.width / 3 - 8, this.y - this.height / 2 - 12,
        this.x + this.width / 3, this.y - this.height / 2
      );
      
      // Eyes
      this.p.fill(gameState.hasColor ? [255, 0, 0] : [200]);
      this.p.circle(this.x - 10, this.y - 5, 8);
      this.p.circle(this.x + 10, this.y - 5, 8);
      
      // Health bar
      const barWidth = 50;
      const barHeight = 5;
      this.p.noStroke();
      this.p.fill(100, 0, 0);
      this.p.rectMode(this.p.CENTER);
      this.p.rect(this.x, this.y - this.height / 2 - 15, barWidth, barHeight);
      this.p.fill(255, 0, 0);
      const hpWidth = (this.hp / this.maxHP) * barWidth;
      this.p.rect(this.x - (barWidth - hpWidth) / 2, this.y - this.height / 2 - 15, hpWidth, barHeight);
      
      // Boss label
      this.p.fill(gameState.hasColor ? [255, 215, 0] : [255]);
      this.p.textAlign(this.p.CENTER);
      this.p.textSize(10);
      this.p.text("BOSS", this.x, this.y - this.height / 2 - 25);
    }
    
    this.p.pop();
  }
}

export class Projectile {
  constructor(p, x, y, angle, damage) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 5;
    this.damage = damage;
    this.life = 120;
    this.width = 8;
    this.height = 8;
  }
  
  update() {
    this.x += this.p.cos(this.angle) * this.speed;
    this.y += this.p.sin(this.angle) * this.speed;
    this.life--;
    
    // Check collision with player
    const player = gameState.player;
    if (player && !player.isDodging) {
      const dist = this.p.dist(this.x, this.y, player.x, player.y);
      if (dist < 20) {
        player.takeDamage(this.damage);
        this.life = 0;
      }
    }
  }
  
  render() {
    this.p.push();
    
    if (gameState.hasScrolling) {
      this.p.translate(-gameState.cameraX, -gameState.cameraY);
    }
    
    this.p.fill(gameState.hasColor ? [255, 100, 255] : [200]);
    this.p.noStroke();
    this.p.circle(this.x, this.y, this.width);
    
    this.p.pop();
  }
  
  shouldRemove() {
    return this.life <= 0 || 
           this.x < 0 || this.x > gameState.worldWidth ||
           this.y < 0 || this.y > gameState.worldHeight;
  }
}

export class HealthDrop {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 12;
    this.height = 12;
    this.collected = false;
    this.life = 300;
    this.bobOffset = 0;
  }
  
  update() {
    this.life--;
    this.bobOffset = this.p.sin(this.p.frameCount * 0.1) * 3;
    
    // Check collision with player
    const player = gameState.player;
    if (player) {
      const dist = this.p.dist(this.x, this.y, player.x, player.y);
      if (dist < 25) {
        player.heal(25);
        this.collected = true;
        gameState.score += 50;
      }
    }
  }
  
  render() {
    this.p.push();
    
    if (gameState.hasScrolling) {
      this.p.translate(-gameState.cameraX, -gameState.cameraY);
    }
    
    const alpha = this.life < 60 ? this.p.map(this.life, 0, 60, 0, 255) : 255;
    
    this.p.fill(gameState.hasColor ? [0, 255, 100, alpha] : [200, alpha]);
    this.p.noStroke();
    this.p.rectMode(this.p.CENTER);
    this.p.push();
    this.p.translate(this.x, this.y + this.bobOffset);
    this.p.rotate(this.p.frameCount * 0.05);
    this.p.rect(0, 0, this.width, this.width);
    this.p.rect(0, 0, this.width * 0.4, this.width);
    this.p.pop();
    
    this.p.pop();
  }
  
  shouldRemove() {
    return this.collected || this.life <= 0;
  }
}