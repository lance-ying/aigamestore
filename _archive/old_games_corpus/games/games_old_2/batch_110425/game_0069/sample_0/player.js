import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 12;
    
    // Stats
    this.maxHealth = 100;
    this.health = 100;
    this.moveSpeed = 2.5;
    this.experience = 0;
    this.level = 1;
    this.experienceToNextLevel = 10;
    
    // Combat
    this.damage = 10;
    this.attackSpeed = 1.0; // attacks per second
    this.attackRange = 150;
    this.attackCooldown = 0;
    this.projectileSpeed = 8;
    
    // Abilities
    this.dashSpeed = 12;
    this.dashDuration = 8;
    this.dashCooldown = 0;
    this.dashCooldownMax = 60; // 1 second
    this.isDashing = false;
    this.dashTimer = 0;
    this.invulnerable = false;
    
    // Special ability
    this.specialAbility = null;
    this.specialCooldown = 0;
    this.specialCooldownMax = 180; // 3 seconds
    
    // Upgrades
    this.pickupRange = 60;
    this.maxHealthBonus = 0;
    this.damageMultiplier = 1.0;
    this.speedMultiplier = 1.0;
    this.attackSpeedMultiplier = 1.0;
    this.projectileCount = 1;
    this.piercing = false;
    this.critChance = 0;
    this.critDamage = 2.0;
    
    // Animation
    this.angle = 0;
    this.shootAngle = 0;
    this.hitFlash = 0;
  }
  
  update(p) {
    // Update cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.specialCooldown > 0) this.specialCooldown--;
    if (this.hitFlash > 0) this.hitFlash--;
    
    // Dash mechanics
    if (this.isDashing) {
      this.dashTimer--;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.invulnerable = false;
      }
    }
    
    // Movement
    if (!this.isDashing) {
      this.x += this.vx;
      this.y += this.vy;
    } else {
      const dashVX = p.cos(this.angle) * this.dashSpeed;
      const dashVY = p.sin(this.angle) * this.dashSpeed;
      this.x += dashVX;
      this.y += dashVY;
    }
    
    // Boundary check
    this.x = p.constrain(this.x, this.radius, CANVAS_WIDTH - this.radius);
    this.y = p.constrain(this.y, this.radius, CANVAS_HEIGHT - this.radius);
    
    // Auto-attack nearest enemy
    this.autoAttack(p);
    
    // Collect nearby experience orbs
    this.collectOrbs(p);
  }
  
  autoAttack(p) {
    if (this.attackCooldown > 0) return;
    
    // Find nearest enemy
    let nearest = null;
    let nearestDist = this.attackRange;
    
    for (const enemy of gameState.enemies) {
      const dist = p.dist(this.x, this.y, enemy.x, enemy.y);
      if (dist < nearestDist) {
        nearest = enemy;
        nearestDist = dist;
      }
    }
    
    if (nearest) {
      this.shoot(p, nearest);
      this.attackCooldown = 60 / (this.attackSpeed * this.attackSpeedMultiplier);
    }
  }
  
  shoot(p, target) {
    const angle = p.atan2(target.y - this.y, target.x - this.x);
    this.shootAngle = angle;
    
    // Create projectiles
    const spreadAngle = this.projectileCount > 1 ? 0.3 : 0;
    const startAngle = angle - (spreadAngle * (this.projectileCount - 1) / 2);
    
    for (let i = 0; i < this.projectileCount; i++) {
      const projAngle = startAngle + (spreadAngle * i);
      const projectile = {
        x: this.x,
        y: this.y,
        vx: p.cos(projAngle) * this.projectileSpeed,
        vy: p.sin(projAngle) * this.projectileSpeed,
        radius: 4,
        damage: this.damage * this.damageMultiplier,
        piercing: this.piercing,
        lifetime: 120,
        owner: 'player',
        hitEnemies: new Set()
      };
      gameState.projectiles.push(projectile);
    }
  }
  
  collectOrbs(p) {
    for (let i = gameState.experienceOrbs.length - 1; i >= 0; i--) {
      const orb = gameState.experienceOrbs[i];
      const dist = p.dist(this.x, this.y, orb.x, orb.y);
      
      // Magnetic pull when close
      if (dist < this.pickupRange * 2) {
        const pullAngle = p.atan2(this.y - orb.y, this.x - orb.x);
        orb.x += p.cos(pullAngle) * 4;
        orb.y += p.sin(pullAngle) * 4;
      }
      
      // Collect
      if (dist < this.radius + orb.radius) {
        this.gainExperience(orb.value);
        gameState.experienceOrbs.splice(i, 1);
        
        // Particle effect
        this.createCollectParticles(p, orb.x, orb.y);
      }
    }
  }
  
  gainExperience(amount) {
    this.experience += amount;
    gameState.score += amount;
    
    // Level up check
    while (this.experience >= this.experienceToNextLevel) {
      this.experience -= this.experienceToNextLevel;
      this.levelUp();
    }
  }
  
  levelUp() {
    this.level++;
    this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
    
    // Trigger upgrade selection
    gameState.pendingLevelUp = true;
  }
  
  takeDamage(amount) {
    if (this.invulnerable) return;
    
    this.health -= amount;
    this.hitFlash = 10;
    
    if (this.health <= 0) {
      this.health = 0;
      gameState.gamePhase = "GAME_OVER_LOSE";
    }
  }
  
  dash(p) {
    if (this.dashCooldown > 0 || this.isDashing) return;
    
    // Calculate dash direction based on current movement
    if (this.vx !== 0 || this.vy !== 0) {
      this.angle = p.atan2(this.vy, this.vx);
    }
    
    this.isDashing = true;
    this.dashTimer = this.dashDuration;
    this.dashCooldown = this.dashCooldownMax;
    this.invulnerable = true;
  }
  
  useSpecialAbility(p) {
    if (this.specialCooldown > 0 || !this.specialAbility) return;
    
    this.specialAbility.activate(p, this);
    this.specialCooldown = this.specialCooldownMax;
  }
  
  createCollectParticles(p, x, y) {
    for (let i = 0; i < 5; i++) {
      const angle = p.random(p.TWO_PI);
      const speed = p.random(1, 3);
      gameState.particles.push({
        x: x,
        y: y,
        vx: p.cos(angle) * speed,
        vy: p.sin(angle) * speed,
        life: 20,
        maxLife: 20,
        color: [100, 255, 100],
        size: 3
      });
    }
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Hit flash effect
    if (this.hitFlash > 0) {
      p.fill(255, 200, 200);
    } else if (this.isDashing) {
      p.fill(150, 200, 255);
    } else {
      p.fill(255, 220, 100);
    }
    
    // Body
    p.noStroke();
    p.circle(0, 0, this.radius * 2);
    
    // Hat (cowboy)
    p.fill(100, 70, 40);
    p.rect(-10, -this.radius - 8, 20, 4);
    p.rect(-6, -this.radius - 12, 12, 8);
    
    // Eyes
    p.fill(50);
    p.circle(-4, -2, 3);
    p.circle(4, -2, 3);
    
    // Weapon direction indicator
    p.stroke(200, 100, 50);
    p.strokeWeight(3);
    const weaponLength = 15;
    p.line(0, 0, 
           p.cos(this.shootAngle) * weaponLength, 
           p.sin(this.shootAngle) * weaponLength);
    
    p.pop();
    
    // Health bar
    this.drawHealthBar(p);
    
    // Dash cooldown indicator
    if (this.dashCooldown > 0) {
      const cooldownRatio = this.dashCooldown / this.dashCooldownMax;
      p.fill(150, 200, 255, 100);
      p.noStroke();
      p.arc(this.x, this.y, this.radius * 3, this.radius * 3, 
            -p.HALF_PI, -p.HALF_PI + p.TWO_PI * (1 - cooldownRatio));
    }
  }
  
  drawHealthBar(p) {
    const barWidth = 40;
    const barHeight = 5;
    const x = this.x - barWidth / 2;
    const y = this.y - this.radius - 18;
    
    // Background
    p.fill(50);
    p.noStroke();
    p.rect(x, y, barWidth, barHeight);
    
    // Health
    const healthRatio = this.health / (this.maxHealth + this.maxHealthBonus);
    p.fill(255 * (1 - healthRatio), 255 * healthRatio, 0);
    p.rect(x, y, barWidth * healthRatio, barHeight);
  }
}