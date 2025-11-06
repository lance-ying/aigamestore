// enemy.js - Enemy character class

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Enemy {
  constructor(p, type, hp, maxHp, attack, index, totalEnemies, isBoss = false) {
    this.p = p;
    this.type = type;
    this.hp = hp;
    this.maxHp = maxHp;
    this.attack = attack;
    this.isBoss = isBoss;
    this.width = isBoss ? 80 : 50;
    this.height = isBoss ? 100 : 70;
    
    // Position enemies vertically based on count
    const spacing = CANVAS_HEIGHT / (totalEnemies + 1);
    this.x = CANVAS_WIDTH - 120;
    this.y = spacing * (index + 1);
    
    this.isAttacking = false;
    this.attackTimer = 0;
    this.flashTimer = 0;
    this.isDead = false;
    this.deathTimer = 0;
  }

  update() {
    if (this.isDead) {
      this.deathTimer++;
      return;
    }
    
    if (this.isAttacking) {
      this.attackTimer--;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
      }
    }
    
    if (this.flashTimer > 0) {
      this.flashTimer--;
    }
  }

  draw() {
    const p = this.p;
    
    if (this.isDead && this.deathTimer > 30) {
      return; // Don't draw after death animation
    }
    
    p.push();
    
    // Death fade
    const alpha = this.isDead ? Math.max(0, 255 - this.deathTimer * 8) : 255;
    
    // Shadow
    p.fill(0, 0, 0, 50 * (alpha / 255));
    p.noStroke();
    p.ellipse(this.x, this.y + this.height / 2 + 5, this.width * 0.8, 20);
    
    // Attack jump animation
    const jumpOffset = this.isAttacking ? -10 : 0;
    const bodyY = this.y + jumpOffset;
    
    // Flash effect when damaged
    if (this.flashTimer > 0) {
      p.fill(255, 200, 200, 150);
      p.rect(this.x - this.width / 2 - 5, bodyY - this.height / 2 - 5,
             this.width + 10, this.height + 10, 10);
    }
    
    // Main body
    const bodyColor = this.isBoss ? [150, 20, 20] : [200, 50, 50];
    p.fill(...bodyColor.map(c => c * (alpha / 255)));
    p.stroke(100, 20, 20, alpha);
    p.strokeWeight(3);
    p.rect(this.x - this.width / 2, bodyY - this.height / 2, this.width, this.height, 8);
    
    // Eyes
    p.fill(255, 255, 0, alpha);
    p.noStroke();
    p.ellipse(this.x - this.width / 4, bodyY - this.height / 4, 
              this.isBoss ? 14 : 10, this.isBoss ? 14 : 10);
    p.ellipse(this.x + this.width / 4, bodyY - this.height / 4, 
              this.isBoss ? 14 : 10, this.isBoss ? 14 : 10);
    p.fill(255, 0, 0, alpha);
    p.ellipse(this.x - this.width / 4, bodyY - this.height / 4, 
              this.isBoss ? 7 : 5, this.isBoss ? 7 : 5);
    p.ellipse(this.x + this.width / 4, bodyY - this.height / 4, 
              this.isBoss ? 7 : 5, this.isBoss ? 7 : 5);
    
    // Boss crown
    if (this.isBoss) {
      p.fill(255, 215, 0, alpha);
      p.noStroke();
      for (let i = 0; i < 3; i++) {
        const px = this.x - 20 + i * 20;
        const py = bodyY - this.height / 2 - 10;
        p.triangle(px - 5, py, px + 5, py, px, py - 15);
      }
    }
    
    // HP Bar
    if (!this.isDead) {
      this.drawHPBar();
    }
    
    // Name tag
    p.fill(255, 255, 255, alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(this.isBoss ? 12 : 10);
    p.text(this.type, this.x, this.y - this.height / 2 - 35);
    
    p.pop();
  }

  drawHPBar() {
    const p = this.p;
    const barWidth = this.isBoss ? 100 : 70;
    const barHeight = 8;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.height / 2 - 20;
    
    // Background
    p.fill(100, 100, 100);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight, 3);
    
    // HP fill
    const hpPercent = this.hp / this.maxHp;
    p.fill(200, 50, 50);
    p.rect(barX, barY, barWidth * hpPercent, barHeight, 3);
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.flashTimer = 10;
    if (this.hp <= 0) {
      this.isDead = true;
      this.deathTimer = 0;
    }
  }

  performAttack() {
    this.isAttacking = true;
    this.attackTimer = 20;
  }
}