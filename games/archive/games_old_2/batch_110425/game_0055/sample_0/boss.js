import { GRAVITY, GROUND_Y, gameState } from './globals.js';

export class Boss {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 40;
    this.height = 60;
    this.health = 300;
    this.maxHealth = 300;
    this.damage = 20;
    this.speed = 2;
    this.grounded = false;
    this.facing = -1;
    
    // Phase system
    this.phase = 1; // 1, 2, 3
    this.phaseThresholds = [200, 100];
    
    // Attack patterns
    this.attacking = false;
    this.attackType = null; // "slam", "dash", "projectile"
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.projectiles = [];
    
    // Visual
    this.hitFlash = 0;
    this.animTimer = 0;
    this.dead = false;
    
    // Weaknesses
    this.vulnerable = false;
    this.vulnerableTimer = 0;
  }
  
  update() {
    if (this.dead) return;
    
    const p = this.p;
    
    // Apply gravity
    if (this.y < GROUND_Y) {
      this.vy += GRAVITY;
      this.grounded = false;
    } else {
      this.y = GROUND_Y;
      this.vy = 0;
      this.grounded = true;
    }
    
    // Update timers
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.hitFlash > 0) this.hitFlash--;
    if (this.vulnerableTimer > 0) {
      this.vulnerableTimer--;
      if (this.vulnerableTimer === 0) {
        this.vulnerable = false;
      }
    }
    this.animTimer++;
    
    // Check phase transitions
    if (this.health <= this.phaseThresholds[1] && this.phase < 3) {
      this.phase = 3;
      this.speed = 3;
    } else if (this.health <= this.phaseThresholds[0] && this.phase < 2) {
      this.phase = 2;
      this.speed = 2.5;
    }
    
    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx;
      proj.y += proj.vy;
      proj.life--;
      
      // Check collision with player
      const player = gameState.player;
      if (player) {
        const dist = Math.sqrt(Math.pow(proj.x - player.x, 2) + Math.pow(proj.y - player.y, 2));
        if (dist < 15 + player.width / 2) {
          player.takeDamage(this.damage * 0.5);
          this.projectiles.splice(i, 1);
          continue;
        }
      }
      
      if (proj.life <= 0 || proj.x < -100 || proj.x > 900) {
        this.projectiles.splice(i, 1);
      }
    }
    
    // AI behavior
    const player = gameState.player;
    if (player && !this.attacking) {
      const distToPlayer = Math.abs(this.x - player.x);
      
      // Face player
      this.facing = this.x < player.x ? 1 : -1;
      
      if (this.attackCooldown === 0) {
        // Choose attack based on phase and distance
        if (this.phase === 3 && p.random() < 0.3) {
          this.startAttack("projectile");
        } else if (distToPlayer < 80) {
          this.startAttack("slam");
        } else if (distToPlayer < 200) {
          this.startAttack("dash");
        } else {
          // Move towards player
          this.vx = this.speed * this.facing;
        }
      }
    }
    
    // Execute attacks
    if (this.attacking) {
      this.attackTimer++;
      
      switch(this.attackType) {
        case "slam":
          if (this.attackTimer === 20) {
            // Check if player is in range
            if (player) {
              const dist = Math.abs(this.x - player.x);
              if (dist < 60 && Math.abs(this.y - player.y) < 50) {
                player.takeDamage(this.damage);
              }
            }
          }
          if (this.attackTimer >= 40) {
            this.endAttack();
          }
          break;
          
        case "dash":
          this.vx = this.speed * 4 * this.facing;
          if (this.attackTimer === 15 || this.attackTimer === 30) {
            // Check collision with player during dash
            if (player) {
              const dist = Math.abs(this.x - player.x);
              if (dist < 50 && Math.abs(this.y - player.y) < 50) {
                player.takeDamage(this.damage * 0.7);
              }
            }
          }
          if (this.attackTimer >= 45) {
            this.endAttack();
            // Vulnerable after dash
            this.vulnerable = true;
            this.vulnerableTimer = 60;
          }
          break;
          
        case "projectile":
          if (this.attackTimer % 15 === 0 && this.attackTimer <= 45) {
            // Shoot projectile
            const angle = Math.atan2(player.y - 30 - this.y, player.x - this.x);
            this.projectiles.push({
              x: this.x + this.facing * 30,
              y: this.y - 30,
              vx: Math.cos(angle) * 6,
              vy: Math.sin(angle) * 6,
              life: 120
            });
          }
          if (this.attackTimer >= 60) {
            this.endAttack();
          }
          break;
      }
    }
    
    // Apply velocity
    if (!this.attacking || this.attackType === "dash") {
      this.x += this.vx;
    }
    this.y += this.vy;
    
    // Friction
    this.vx *= 0.85;
    
    // Bounds
    if (this.x < 100) this.x = 100;
    if (this.x > 700) this.x = 700;
  }
  
  startAttack(type) {
    this.attacking = true;
    this.attackType = type;
    this.attackTimer = 0;
    this.attackCooldown = type === "projectile" ? 120 : 90;
    this.vx = 0;
  }
  
  endAttack() {
    this.attacking = false;
    this.attackType = null;
    this.attackTimer = 0;
  }
  
  takeDamage(amount) {
    const multiplier = this.vulnerable ? 2 : 1;
    this.health -= amount * multiplier;
    this.hitFlash = 10;
    
    if (this.vulnerable) {
      // Extra visual feedback for critical hits
      for (let i = 0; i < 5; i++) {
        gameState.particles.push({
          x: this.x,
          y: this.y - 30,
          vx: this.p.random(-4, 4),
          vy: this.p.random(-6, -3),
          life: 40,
          maxLife: 40,
          color: [255, 255, 0]
        });
      }
    }
    
    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
      gameState.score += 1000;
      gameState.bossDefeated = true;
      this.createDeathParticles();
      return true;
    }
    return false;
  }
  
  createDeathParticles() {
    for (let i = 0; i < 30; i++) {
      gameState.particles.push({
        x: this.x,
        y: this.y - 30,
        vx: this.p.random(-6, 6),
        vy: this.p.random(-8, -3),
        life: 60,
        maxLife: 60,
        color: [150 + this.p.random(100), 50, 150 + this.p.random(100)]
      });
    }
  }
  
  draw() {
    if (this.dead) return;
    
    const p = this.p;
    const screenX = this.x - gameState.cameraX;
    
    // Draw projectiles
    for (const proj of this.projectiles) {
      p.push();
      p.fill(255, 100, 255);
      p.noStroke();
      const projScreenX = proj.x - gameState.cameraX;
      p.ellipse(projScreenX, proj.y, 12, 12);
      p.fill(255, 200, 255, 100);
      p.ellipse(projScreenX, proj.y, 20, 20);
      p.pop();
    }
    
    p.push();
    p.translate(screenX, this.y);
    
    // Color based on state
    let bodyColor;
    if (this.hitFlash > 0) {
      bodyColor = [255, 255, 255];
    } else if (this.vulnerable) {
      bodyColor = [255, 255, 0];
    } else {
      bodyColor = [150, 50, 200];
    }
    
    // Body
    p.fill(...bodyColor);
    p.noStroke();
    p.rect(-this.width/2, -this.height, this.width, this.height);
    
    // Armor plates
    p.fill(...(bodyColor.map(c => c * 0.7)));
    p.rect(-this.width/2 - 5, -this.height + 10, 10, 15);
    p.rect(this.width/2 - 5, -this.height + 10, 10, 15);
    
    // Head
    p.fill(...(bodyColor.map(c => c * 0.8)));
    p.ellipse(0, -this.height - 12, 24, 24);
    
    // Eyes
    p.fill(255, 0, 0);
    p.ellipse(this.facing * 4, -this.height - 12, 6, 6);
    p.ellipse(this.facing * 10, -this.height - 12, 4, 4);
    
    // Attack effects
    if (this.attacking) {
      p.fill(255, 0, 0, 100);
      if (this.attackType === "slam") {
        p.ellipse(0, -this.height/2, 80, 80);
      } else if (this.attackType === "dash") {
        // Trail effect
        for (let i = 1; i <= 3; i++) {
          p.fill(150, 50, 200, 100 - i * 30);
          p.rect(-this.width/2 - (this.facing * i * 15), -this.height, this.width, this.height);
        }
      }
    }
    
    // Phase indicator (crown/spikes)
    p.fill(255, 215, 0);
    for (let i = 0; i < this.phase; i++) {
      p.triangle(-8 + i * 8, -this.height - 20, -4 + i * 8, -this.height - 28, 0 + i * 8, -this.height - 20);
    }
    
    p.pop();
    
    // Health bar (larger for boss)
    p.push();
    p.fill(50);
    p.noStroke();
    p.rect(screenX - 50, this.y - this.height - 25, 100, 6);
    
    // Color based on phase
    const healthPercent = this.health / this.maxHealth;
    const healthColor = healthPercent > 0.66 ? [100, 255, 100] : 
                       healthPercent > 0.33 ? [255, 255, 100] : [255, 100, 100];
    p.fill(...healthColor);
    p.rect(screenX - 50, this.y - this.height - 25, 100 * healthPercent, 6);
    
    // Phase markers
    p.stroke(0);
    p.strokeWeight(2);
    for (const threshold of this.phaseThresholds) {
      const x = screenX - 50 + 100 * (threshold / this.maxHealth);
      p.line(x, this.y - this.height - 25, x, this.y - this.height - 19);
    }
    p.pop();
  }
}