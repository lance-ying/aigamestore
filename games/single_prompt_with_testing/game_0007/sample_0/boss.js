// boss.js - Boss enemy implementation

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Boss {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 80;
    this.height = 80;
    this.health = 500;
    this.maxHealth = 500;
    this.phase = 1;
    this.attackTimer = 0;
    this.attackCooldown = 60;
    this.currentAttack = null;
    this.moveTimer = 0;
    this.targetY = y;
    this.velocityY = 0;
    
    // Animation
    this.floatOffset = 0;
    this.eyeBlinkTimer = 0;
    this.isBlinking = false;
    this.angryLevel = 0;
  }

  update() {
    const p = this.p;
    
    // Update phase based on health
    const healthPercent = this.health / this.maxHealth;
    if (healthPercent < 0.7 && this.phase === 1) {
      this.phase = 2;
      this.attackCooldown = 45;
    } else if (healthPercent < 0.4 && this.phase === 2) {
      this.phase = 3;
      this.attackCooldown = 30;
    }
    
    this.angryLevel = 1 - healthPercent;
    
    // Movement pattern - float up and down
    this.moveTimer++;
    if (this.moveTimer > 120) {
      this.targetY = 100 + p.random(80);
      this.moveTimer = 0;
    }
    
    const dy = this.targetY - this.y;
    this.velocityY = dy * 0.03;
    this.y += this.velocityY;
    
    // Keep in bounds
    if (this.y < 60) this.y = 60;
    if (this.y > 200) this.y = 200;
    
    // Animation
    this.floatOffset = Math.sin(p.frameCount * 0.05) * 3;
    
    // Blink animation
    this.eyeBlinkTimer--;
    if (this.eyeBlinkTimer <= 0) {
      this.isBlinking = true;
      this.eyeBlinkTimer = 60 + p.random(120);
    }
    if (this.isBlinking) {
      if (this.eyeBlinkTimer > 54) {
        this.isBlinking = false;
      }
    }
    
    // Attack logic
    this.attackTimer++;
    if (this.attackTimer >= this.attackCooldown) {
      this.attackTimer = 0;
      return this.selectAttack();
    }
    
    return null;
  }

  selectAttack() {
    const attacks = [];
    
    if (this.phase >= 1) {
      attacks.push('spread', 'aimed');
    }
    if (this.phase >= 2) {
      attacks.push('wave', 'spiral');
    }
    if (this.phase >= 3) {
      attacks.push('barrage', 'cross');
    }
    
    const idx = Math.floor(this.p.random(attacks.length));
    this.currentAttack = attacks[idx];
    return this.currentAttack;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }

  render() {
    const p = this.p;
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2 + this.floatOffset;
    
    p.push();
    
    // Damage flash
    if (p.frameCount % 2 === 0 && this.health < this.maxHealth * 0.3) {
      p.fill(255, 100, 100, 50);
      p.noStroke();
      p.ellipse(centerX, centerY, this.width + 20, this.height + 20);
    }
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(centerX, gameState.groundY + 10, this.width * 0.7, 20);
    
    // Main body (evil devil/demon boss)
    p.fill(150 + this.angryLevel * 100, 50, 50);
    p.stroke(0);
    p.strokeWeight(3);
    
    // Body
    p.ellipse(centerX, centerY, this.width, this.height);
    
    // Horns
    p.fill(100, 30, 30);
    p.triangle(centerX - 25, centerY - 30, 
               centerX - 20, centerY - 50,
               centerX - 15, centerY - 30);
    p.triangle(centerX + 25, centerY - 30, 
               centerX + 20, centerY - 50,
               centerX + 15, centerY - 30);
    
    // Eyes
    p.fill(255, 255, 200);
    p.ellipse(centerX - 15, centerY - 10, 18, this.isBlinking ? 2 : 20);
    p.ellipse(centerX + 15, centerY - 10, 18, this.isBlinking ? 2 : 20);
    
    if (!this.isBlinking) {
      // Pupils
      p.fill(200, 0, 0);
      const playerX = gameState.player ? gameState.player.x + gameState.player.width / 2 : 300;
      const lookX = (playerX - centerX) * 0.1;
      p.ellipse(centerX - 15 + lookX, centerY - 8, 10, 12);
      p.ellipse(centerX + 15 + lookX, centerY - 8, 10, 12);
      
      // Highlight
      p.fill(255, 255, 255);
      p.noStroke();
      p.ellipse(centerX - 12 + lookX, centerY - 12, 4, 4);
      p.ellipse(centerX + 18 + lookX, centerY - 12, 4, 4);
    }
    
    // Mouth
    p.stroke(0);
    p.strokeWeight(2);
    p.noFill();
    const mouthWidth = 30 + this.angryLevel * 20;
    p.arc(centerX, centerY + 10, mouthWidth, 20, 0, p.PI);
    
    // Teeth
    p.fill(255);
    for (let i = 0; i < 5; i++) {
      const tx = centerX - mouthWidth/2 + (i * mouthWidth/4);
      p.triangle(tx, centerY + 10, tx + 4, centerY + 10, tx + 2, centerY + 16);
    }
    
    // Arms/Tentacles
    p.noFill();
    p.stroke(100, 30, 30);
    p.strokeWeight(6);
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1;
      const armX = centerX + side * 35;
      const wave = Math.sin(p.frameCount * 0.1 + i) * 15;
      p.bezier(armX, centerY,
               armX + side * 20, centerY + 20 + wave,
               armX + side * 30, centerY + 40 - wave,
               armX + side * 25, centerY + 60);
    }
    
    p.pop();
    
    // Health bar
    this.renderHealthBar();
  }

  renderHealthBar() {
    const p = this.p;
    const barWidth = 200;
    const barHeight = 20;
    const barX = CANVAS_WIDTH / 2 - barWidth / 2;
    const barY = 20;
    
    p.push();
    
    // Background
    p.fill(50, 50, 50);
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(barX, barY, barWidth, barHeight);
    
    // Health
    const healthWidth = (this.health / this.maxHealth) * (barWidth - 4);
    p.noStroke();
    const healthColor = this.health > this.maxHealth * 0.5 ? 
                        [100, 200, 100] : 
                        this.health > this.maxHealth * 0.25 ? 
                        [200, 200, 50] : 
                        [200, 50, 50];
    p.fill(...healthColor);
    p.rect(barX + 2, barY + 2, healthWidth, barHeight - 4);
    
    // Boss name
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text("DEVIL BOSS", CANVAS_WIDTH / 2, barY + barHeight + 12);
    
    p.pop();
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}