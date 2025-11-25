// Boss class with multiple phases and attack patterns

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, PHASE_GAME_OVER_WIN } from './globals.js';
import { randomRange, randomInt, angleBetween } from './utils.js';
import { BossProjectile, SpiralProjectile, HomingProjectile, WaveProjectile } from './projectiles.js';
import { createExplosion, createDamageNumber } from './particles.js';

export class Boss {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 80;
    this.height = 80;
    this.radius = 40;
    
    // Health system with phases
    this.maxHealth = 300;
    this.health = this.maxHealth;
    this.phase = 1;
    this.maxPhases = 3;
    
    // Movement
    this.vx = 0;
    this.vy = 0;
    this.targetX = x;
    this.targetY = y;
    this.moveSpeed = 2;
    
    // Attack patterns
    this.attackTimer = 0;
    this.attackCooldown = 120;
    this.currentAttack = null;
    this.attackProgress = 0;
    
    // State
    this.isDead = false;
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    
    // Animation
    this.animFrame = 0;
    this.animSpeed = 0.1;
    this.rotation = 0;
    this.scale = 1.0;
    this.hitFlash = 0;
    
    // Visual effects
    this.auraRotation = 0;
    this.phaseTransitionTimer = 0;
    
    gameState.boss = this;
    gameState.entities.push(this);
  }
  
  update() {
    if (this.isDead) return;
    
    // Update timers
    this.attackTimer++;
    this.animFrame += this.animSpeed;
    this.auraRotation += 0.02;
    if (this.hitFlash > 0) this.hitFlash--;
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer--;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
      }
    }
    if (this.phaseTransitionTimer > 0) this.phaseTransitionTimer--;
    
    // Check phase transitions
    this.checkPhaseTransition();
    
    // Movement AI
    this.updateMovement();
    
    // Attack patterns
    if (this.attackTimer >= this.attackCooldown && !this.isInvulnerable) {
      this.performAttack();
      this.attackTimer = 0;
    }
    
    // Update scale for breathing effect
    this.scale = 1.0 + Math.sin(this.animFrame) * 0.05;
  }
  
  updateMovement() {
    // Phase-based movement patterns
    if (this.phase === 1) {
      // Slow circular movement
      const centerX = CANVAS_WIDTH / 2;
      const centerY = 150;
      const radius = 100;
      const angle = gameState.frameCount * 0.01;
      
      this.targetX = centerX + Math.cos(angle) * radius;
      this.targetY = centerY + Math.sin(angle) * radius;
    } else if (this.phase === 2) {
      // Faster figure-8 movement
      const centerX = CANVAS_WIDTH / 2;
      const centerY = 150;
      const angle = gameState.frameCount * 0.02;
      
      this.targetX = centerX + Math.cos(angle) * 120;
      this.targetY = centerY + Math.sin(angle * 2) * 80;
    } else if (this.phase === 3) {
      // Aggressive dashing movement
      if (gameState.frameCount % 120 === 0 && gameState.player) {
        this.targetX = gameState.player.x;
        this.targetY = Math.min(200, gameState.player.y);
      }
    }
    
    // Move towards target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 5) {
      const speed = this.phase === 3 ? this.moveSpeed * 1.5 : this.moveSpeed;
      this.vx = (dx / distance) * speed;
      this.vy = (dy / distance) * speed;
    } else {
      this.vx *= 0.9;
      this.vy *= 0.9;
    }
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Keep in bounds
    this.x = Math.max(60, Math.min(CANVAS_WIDTH - 60, this.x));
    this.y = Math.max(60, Math.min(250, this.y));
  }
  
  checkPhaseTransition() {
    const healthPercent = this.health / this.maxHealth;
    const newPhase = Math.ceil((1 - healthPercent) * this.maxPhases) + 1;
    
    if (newPhase > this.phase && newPhase <= this.maxPhases) {
      this.enterNewPhase(newPhase);
    }
  }
  
  enterNewPhase(newPhase) {
    this.phase = newPhase;
    this.isInvulnerable = true;
    this.invulnerabilityTimer = 60;
    this.phaseTransitionTimer = 60;
    this.attackCooldown = Math.max(60, 120 - (this.phase * 20));
    
    // Visual effect
    createExplosion(this.x, this.y, 20, COLORS.BOSS_PURPLE);
    
    gameState.bossPhase = this.phase;
  }
  
  performAttack() {
    if (!gameState.player || gameState.player.isDead) return;
    
    // Choose attack based on phase
    const attacks = this.getAvailableAttacks();
    const attack = attacks[randomInt(0, attacks.length - 1)];
    
    this[attack]();
  }
  
  getAvailableAttacks() {
    const attacks = ['attackSpray', 'attackCircle'];
    
    if (this.phase >= 2) {
      attacks.push('attackSpiral', 'attackHoming');
    }
    
    if (this.phase >= 3) {
      attacks.push('attackWave', 'attackBarrage');
    }
    
    return attacks;
  }
  
  // Attack Pattern: Spray bullets in an arc
  attackSpray() {
    const bulletCount = 5 + this.phase * 2;
    const spreadAngle = Math.PI / 3;
    const startAngle = angleBetween(this.x, this.y, gameState.player.x, gameState.player.y) - spreadAngle / 2;
    
    for (let i = 0; i < bulletCount; i++) {
      const angle = startAngle + (spreadAngle / bulletCount) * i;
      const speed = 4 + this.phase * 0.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      // Some bullets are parryable
      const isParryable = i % 3 === 0;
      
      gameState.bossProjectiles.push(new BossProjectile(this.x, this.y, vx, vy, isParryable));
    }
  }
  
  // Attack Pattern: Ring of bullets
  attackCircle() {
    const bulletCount = 8 + this.phase * 2;
    
    for (let i = 0; i < bulletCount; i++) {
      const angle = (Math.PI * 2 / bulletCount) * i;
      const speed = 3;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      const isParryable = i % 4 === 0;
      
      gameState.bossProjectiles.push(new BossProjectile(this.x, this.y, vx, vy, isParryable));
    }
  }
  
  // Attack Pattern: Spiral
  attackSpiral() {
    const spiralCount = 3;
    const rotationOffset = randomRange(0, Math.PI * 2);
    
    for (let i = 0; i < spiralCount; i++) {
      const angle = (Math.PI * 2 / spiralCount) * i + rotationOffset;
      const speed = 3;
      const isParryable = i === 0;
      
      gameState.bossProjectiles.push(new SpiralProjectile(this.x, this.y, angle, speed, isParryable));
    }
  }
  
  // Attack Pattern: Homing missiles
  attackHoming() {
    const missileCount = 2 + this.phase;
    
    for (let i = 0; i < missileCount; i++) {
      setTimeout(() => {
        if (!this.isDead && gameState.player && !gameState.player.isDead) {
          const isParryable = i === missileCount - 1;
          gameState.bossProjectiles.push(
            new HomingProjectile(this.x, this.y, gameState.player.x, gameState.player.y, isParryable)
          );
        }
      }, i * 200);
    }
  }
  
  // Attack Pattern: Wave bullets
  attackWave() {
    const waveCount = 4;
    const baseAngle = angleBetween(this.x, this.y, gameState.player.x, gameState.player.y);
    
    for (let i = 0; i < waveCount; i++) {
      const angle = baseAngle + randomRange(-0.3, 0.3);
      const isParryable = i === waveCount - 1;
      
      gameState.bossProjectiles.push(new WaveProjectile(this.x, this.y, angle, isParryable));
    }
  }
  
  // Attack Pattern: Rapid fire barrage
  attackBarrage() {
    const barrageCount = 12;
    
    for (let i = 0; i < barrageCount; i++) {
      setTimeout(() => {
        if (!this.isDead && gameState.player && !gameState.player.isDead) {
          const angle = angleBetween(this.x, this.y, gameState.player.x, gameState.player.y);
          const spread = randomRange(-0.2, 0.2);
          const speed = 5;
          const vx = Math.cos(angle + spread) * speed;
          const vy = Math.sin(angle + spread) * speed;
          
          const isParryable = i % 5 === 0;
          
          gameState.bossProjectiles.push(new BossProjectile(this.x, this.y, vx, vy, isParryable));
        }
      }, i * 100);
    }
  }
  
  takeDamage(amount) {
    if (this.isDead || this.isInvulnerable) return;
    
    this.health -= amount;
    this.hitFlash = 10;
    
    // Visual feedback
    createDamageNumber(this.x, this.y - 50, amount);
    createExplosion(this.x + randomRange(-20, 20), this.y + randomRange(-20, 20), 5, COLORS.PARTICLE_YELLOW);
    
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }
  
  die() {
    this.isDead = true;
    
    // Epic death explosion
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        createExplosion(
          this.x + randomRange(-40, 40),
          this.y + randomRange(-40, 40),
          15,
          i % 2 === 0 ? COLORS.BOSS_PURPLE : COLORS.BOSS_PINK
        );
      }, i * 50);
    }
    
    // Win condition
    setTimeout(() => {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
    }, 1500);
    
    // Bonus score
    gameState.score += 1000;
  }
  
  getCollisionRadius() {
    return this.radius;
  }
  
  render(p) {
    if (this.isDead) return;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Phase transition effect
    if (this.phaseTransitionTimer > 0) {
      const pulseSize = this.radius * (1 + this.phaseTransitionTimer / 20);
      p.fill(...COLORS.BOSS_PURPLE, 100);
      p.noStroke();
      p.circle(0, 0, pulseSize * 2);
    }
    
    // Aura based on phase
    if (this.phase >= 2) {
      p.push();
      p.rotate(this.auraRotation);
      p.noFill();
      p.stroke(...COLORS.BOSS_PINK, 150);
      p.strokeWeight(3);
      
      for (let i = 0; i < 3; i++) {
        const size = (this.radius + 10 + i * 10) * this.scale;
        p.circle(0, 0, size * 2);
      }
      p.pop();
    }
    
    // Invulnerability shield
    if (this.isInvulnerable) {
      p.fill(...COLORS.BOSS_YELLOW, 50);
      p.noStroke();
      p.circle(0, 0, this.radius * 2.5);
    }
    
    p.scale(this.scale);
    
    // Hit flash
    if (this.hitFlash > 0) {
      p.tint(255, 200, 200);
    }
    
    // Draw boss body
    p.strokeWeight(3);
    p.stroke(...COLORS.CUP_BLACK);
    
    // Main body - demon/devil inspired
    p.fill(...COLORS.BOSS_PURPLE);
    p.circle(0, 0, this.radius * 2);
    
    // Horns
    p.fill(...COLORS.BOSS_YELLOW);
    p.beginShape();
    p.vertex(-20, -20);
    p.bezierVertex(-25, -35, -20, -40, -15, -38);
    p.vertex(-15, -20);
    p.endShape(p.CLOSE);
    
    p.beginShape();
    p.vertex(20, -20);
    p.bezierVertex(25, -35, 20, -40, 15, -38);
    p.vertex(15, -20);
    p.endShape(p.CLOSE);
    
    // Face
    p.fill(255, 255, 255);
    p.noStroke();
    
    // Eyes
    const eyeOffset = Math.sin(this.animFrame) * 2;
    p.ellipse(-12, -5 + eyeOffset, 10, 12);
    p.ellipse(12, -5 + eyeOffset, 10, 12);
    
    // Evil pupils
    p.fill(255, 0, 0);
    p.circle(-12, -5 + eyeOffset, 5);
    p.circle(12, -5 + eyeOffset, 5);
    
    // Glints
    p.fill(255);
    p.circle(-14, -7 + eyeOffset, 2);
    p.circle(10, -7 + eyeOffset, 2);
    
    // Evil grin
    p.noFill();
    p.stroke(...COLORS.CUP_BLACK);
    p.strokeWeight(3);
    p.arc(0, 5, 30, 20, 0, Math.PI);
    
    // Sharp teeth
    p.fill(...COLORS.CUP_WHITE);
    for (let i = -2; i <= 2; i++) {
      p.triangle(i * 6 - 2, 5, i * 6, 12, i * 6 + 2, 5);
    }
    
    // Phase indicator (crown)
    if (this.phase >= 2) {
      p.fill(...COLORS.BOSS_YELLOW);
      p.noStroke();
      for (let i = -1; i <= 1; i++) {
        p.triangle(i * 10 - 3, -25, i * 10, -35, i * 10 + 3, -25);
      }
    }
    
    // Phase 3 indicator (extra crown points)
    if (this.phase >= 3) {
      for (let i = -1; i <= 1; i += 2) {
        p.triangle(i * 15 - 3, -22, i * 15, -30, i * 15 + 3, -22);
      }
    }
    
    p.pop();
    
    // Health bar
    this.renderHealthBar(p);
  }
  
  renderHealthBar(p) {
    const barWidth = 100;
    const barHeight = 8;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.radius - 20;
    
    p.push();
    
    // Background
    p.fill(100, 0, 0);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);
    
    // Health fill
    const healthPercent = this.health / this.maxHealth;
    const healthColor = healthPercent > 0.5 ? COLORS.HEALTH_GREEN : 
                       healthPercent > 0.25 ? COLORS.PARTICLE_YELLOW : COLORS.HEALTH_RED;
    p.fill(...healthColor);
    p.rect(barX, barY, barWidth * healthPercent, barHeight);
    
    // Border
    p.noFill();
    p.stroke(255);
    p.strokeWeight(1);
    p.rect(barX, barY, barWidth, barHeight);
    
    // Phase markers
    for (let i = 1; i < this.maxPhases; i++) {
      const markerX = barX + (barWidth / this.maxPhases) * i;
      p.stroke(255);
      p.strokeWeight(2);
      p.line(markerX, barY, markerX, barY + barHeight);
    }
    
    p.pop();
  }
}