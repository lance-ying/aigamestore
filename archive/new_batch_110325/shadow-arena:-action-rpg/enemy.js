// enemy.js - Enemy classes
import { CANVAS_WIDTH, GROUND_Y, GRAVITY, gameState } from './globals.js';

export class Enemy {
  constructor(p, x, y, type = "grunt") {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 25;
    this.height = 35;
    this.vx = 0;
    this.vy = 0;
    this.speed = 1.5;
    this.isGrounded = false;
    this.facingRight = true;
    this.isDead = false;
    this.deathTimer = 0;
    
    // Stats based on type
    if (type === "grunt") {
      this.maxHealth = 30;
      this.health = 30;
      this.attackDamage = 8;
      this.expValue = 15;
      this.speed = 1.5;
      this.color = [150, 50, 50];
    } else if (type === "warrior") {
      this.maxHealth = 50;
      this.health = 50;
      this.attackDamage = 12;
      this.expValue = 25;
      this.speed = 2;
      this.width = 30;
      this.height = 40;
      this.color = [180, 80, 50];
    } else if (type === "miniboss") {
      this.maxHealth = 100;
      this.health = 100;
      this.attackDamage = 15;
      this.expValue = 50;
      this.speed = 1.8;
      this.width = 40;
      this.height = 50;
      this.color = [200, 100, 50];
    } else if (type === "boss") {
      this.maxHealth = 300;
      this.health = 300;
      this.attackDamage = 20;
      this.expValue = 100;
      this.speed = 2.5;
      this.width = 60;
      this.height = 70;
      this.color = [220, 50, 50];
    }
    
    this.attackCooldown = 0;
    this.attackRange = 40;
    this.isAttacking = false;
    this.attackFrame = 0;
    this.detectionRange = 300;
    this.animFrame = 0;
    this.animSpeed = 0.12;
  }
  
  update() {
    if (this.isDead) {
      this.deathTimer++;
      return;
    }
    
    // Apply gravity
    if (this.y < GROUND_Y - this.height / 2) {
      this.vy += GRAVITY;
      this.isGrounded = false;
    } else {
      this.y = GROUND_Y - this.height / 2;
      this.vy = 0;
      this.isGrounded = true;
    }
    
    // AI behavior
    if (gameState.player && !gameState.player.health <= 0) {
      const distToPlayer = this.p.dist(this.x, this.y, gameState.player.x, gameState.player.y);
      
      if (distToPlayer < this.detectionRange) {
        if (distToPlayer > this.attackRange + 10) {
          // Move toward player
          if (gameState.player.x < this.x) {
            this.vx = -this.speed;
            this.facingRight = false;
          } else {
            this.vx = this.speed;
            this.facingRight = true;
          }
        } else {
          // In attack range
          this.vx *= 0.5;
          if (this.attackCooldown <= 0) {
            this.performAttack();
          }
        }
      }
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Boundaries
    this.x = this.p.constrain(this.x, this.width / 2, CANVAS_WIDTH - this.width / 2);
    
    // Friction
    this.vx *= 0.85;
    
    // Update cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.isAttacking) {
      this.attackFrame++;
      if (this.attackFrame > 15) {
        this.isAttacking = false;
        this.attackFrame = 0;
      }
    }
    
    // Animation
    if (this.p.abs(this.vx) > 0.5) {
      this.animFrame += this.animSpeed;
    }
  }
  
  performAttack() {
    this.isAttacking = true;
    this.attackFrame = 0;
    this.attackCooldown = 60;
    
    // Check if player is in range
    if (gameState.player) {
      const dist = this.p.dist(this.x, this.y, gameState.player.x, gameState.player.y);
      if (dist < this.attackRange + gameState.player.width / 2) {
        // Deal damage after a short delay
        setTimeout(() => {
          if (gameState.player && !this.isDead) {
            const dist2 = this.p.dist(this.x, this.y, gameState.player.x, gameState.player.y);
            if (dist2 < this.attackRange + gameState.player.width / 2) {
              gameState.player.takeDamage(this.attackDamage);
            }
          }
        }, 250);
      }
    }
  }
  
  takeDamage(amount) {
    if (this.isDead) return;
    
    this.health -= amount;
    
    // Damage particles
    for (let i = 0; i < 5; i++) {
      const angle = this.p.random(this.p.TWO_PI);
      const speed = this.p.random(2, 4);
      gameState.particles.push({
        x: this.x,
        y: this.y - 10,
        vx: this.p.cos(angle) * speed,
        vy: this.p.sin(angle) * speed - 2,
        life: 15,
        color: [255, 100, 100],
        size: 3
      });
    }
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    this.isDead = true;
    this.deathTimer = 0;
    gameState.enemiesDefeated++;
    
    // Grant exp to player
    if (gameState.player) {
      gameState.player.gainExp(this.expValue);
    }
    
    // Increase score
    gameState.score += this.expValue;
    
    // Chance to drop items
    if (this.p.random() < 0.3) {
      this.dropItem();
    }
    
    // Death particles
    for (let i = 0; i < 20; i++) {
      const angle = this.p.random(this.p.TWO_PI);
      const speed = this.p.random(2, 6);
      gameState.particles.push({
        x: this.x,
        y: this.y,
        vx: this.p.cos(angle) * speed,
        vy: this.p.sin(angle) * speed - 2,
        life: 30,
        color: [...this.color, 200],
        size: this.p.random(3, 7)
      });
    }
  }
  
  dropItem() {
    const dropTypes = ["health", "mana"];
    const dropType = this.p.random(dropTypes);
    
    gameState.drops.push({
      x: this.x,
      y: this.y,
      type: dropType,
      collected: false,
      size: 12,
      bobOffset: this.p.random(100)
    });
  }
  
  render() {
    if (this.isDead && this.deathTimer > 30) return;
    
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    
    // Fade out when dying
    if (this.isDead) {
      const alpha = p.map(this.deathTimer, 0, 30, 255, 0);
      p.tint(255, alpha);
    }
    
    // Flip for direction
    if (!this.facingRight) {
      p.scale(-1, 1);
    }
    
    // Body
    p.fill(...this.color);
    p.noStroke();
    p.rect(-this.width / 2, -this.height / 2, this.width, this.height * 0.6, 3);
    
    // Legs
    const legOffset = this.p.sin(this.animFrame) * 2;
    p.fill(this.color[0] - 30, this.color[1] - 30, this.color[2] - 30);
    p.rect(-6, this.height * 0.1, 5, this.height * 0.4);
    p.rect(1, this.height * 0.1 + legOffset, 5, this.height * 0.4);
    
    // Head
    p.fill(this.color[0] + 20, this.color[1] + 20, this.color[2] + 20);
    p.ellipse(0, -this.height / 2 - 6, 14, 14);
    
    // Eyes (red)
    p.fill(255, 0, 0);
    p.ellipse(-3, -this.height / 2 - 6, 3, 3);
    p.ellipse(3, -this.height / 2 - 6, 3, 3);
    
    // Weapon
    if (this.isAttacking) {
      const attackAngle = this.p.map(this.attackFrame, 0, 15, -p.PI / 4, p.PI / 4);
      p.push();
      p.rotate(attackAngle);
      p.stroke(100, 100, 100);
      p.strokeWeight(2);
      p.line(this.width / 2, 0, this.width / 2 + 20, -3);
      p.pop();
    }
    
    // Boss crown
    if (this.type === "boss" || this.type === "miniboss") {
      p.fill(255, 200, 0);
      p.noStroke();
      for (let i = 0; i < 5; i++) {
        const angle = p.map(i, 0, 5, 0, p.TWO_PI);
        const px = p.cos(angle) * 10;
        const py = p.sin(angle) * 10 - this.height / 2 - 6;
        p.triangle(px - 2, py, px + 2, py, px, py - 5);
      }
    }
    
    p.pop();
    
    // Health bar
    if (!this.isDead) {
      this.renderHealthBar();
    }
  }
  
  renderHealthBar() {
    const p = this.p;
    const barWidth = this.width;
    const barHeight = 4;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.height / 2 - 15;
    
    // Background
    p.fill(50, 50, 50);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);
    
    // Health
    const healthPercent = this.health / this.maxHealth;
    p.fill(255, 100, 100);
    p.rect(barX, barY, barWidth * healthPercent, barHeight);
  }
}