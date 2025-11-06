// player.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';
import { createDashParticles } from './particle.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 60;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facingRight = true;
    this.state = 'idle'; // idle, running, jumping, attacking, dodging, casting
    this.animFrame = 0;
    this.animTimer = 0;
    this.runCycle = 0;
    
    // Stats
    this.health = 100;
    this.maxHealth = 100;
    this.mana = 50;
    this.maxMana = 50;
    this.level = 1;
    this.xp = 0;
    this.xpThreshold = 100;
    this.attackPower = 10;
    this.defense = 2;
    
    // Combat
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.attackTimer = 0;
    this.attackCooldown = 20; // frames
    this.attackAnimProgress = 0;
    this.dodgeTimer = 0;
    this.dodgeCooldown = 60;
    this.dashSpeed = 0; // For smooth dash movement
    this.skill1Cooldown = 0;
    this.skill1MaxCooldown = 180; // 3 seconds at 60fps
    this.skill2Cooldown = 0;
    this.skill2MaxCooldown = 300; // 5 seconds
    this.skill2Unlocked = false;
    
    // Movement - HOLD-BASED for simultaneous inputs
    this.moveSpeed = 4.5;
    this.acceleration = 0.8;
    this.friction = 0.85;
    this.jumpForce = -12;
    this.gravity = 0.6;
    this.maxFallSpeed = 15;
    
    // Hitbox for attacks
    this.attackHitbox = null;
  }
  
  update(p, keys, platforms, enemies) {
    this.animTimer++;
    
    // Handle state timers
    if (this.attackTimer > 0) {
      this.attackTimer--;
      this.attackAnimProgress = 1 - (this.attackTimer / this.attackCooldown);
      if (this.attackTimer === 0) {
        this.state = 'idle';
        this.attackHitbox = null;
        this.attackAnimProgress = 0;
      }
    }
    
    if (this.dodgeTimer > 0) {
      this.dodgeTimer--;
      // Smooth dash deceleration
      if (this.dodgeTimer > 40) {
        this.dashSpeed *= 0.85;
      } else {
        this.dashSpeed = 0;
      }
      
      if (this.dodgeTimer === 0) {
        this.state = 'idle';
        this.dashSpeed = 0;
      }
    }
    
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer--;
      if (this.invulnerableTimer === 0) {
        this.invulnerable = false;
      }
    }
    
    if (this.skill1Cooldown > 0) this.skill1Cooldown--;
    if (this.skill2Cooldown > 0) this.skill2Cooldown--;
    
    // Mana regeneration
    if (this.mana < this.maxMana && p.frameCount % 30 === 0) {
      this.mana = Math.min(this.maxMana, this.mana + 1);
    }
    
    // Handle CONTINUOUS HOLD-BASED movement (allows simultaneous inputs)
    if (this.state !== 'attacking' && this.state !== 'dodging' && this.state !== 'casting') {
      // Apply friction
      this.vx *= this.friction;
      
      // Stop if moving very slowly
      if (Math.abs(this.vx) < 0.3) {
        this.vx = 0;
      }
      
      // Handle held movement keys - accelerate while held
      if (keys.left) {
        this.vx -= this.acceleration;
        if (this.vx < -this.moveSpeed) this.vx = -this.moveSpeed;
        this.facingRight = false;
        this.state = 'running';
      }
      
      if (keys.right) {
        this.vx += this.acceleration;
        if (this.vx > this.moveSpeed) this.vx = this.moveSpeed;
        this.facingRight = true;
        this.state = 'running';
      }
      
      // Update animation
      if (Math.abs(this.vx) > 0.5) {
        this.runCycle += Math.abs(this.vx) * 0.05;
      } else if (this.onGround) {
        this.state = 'idle';
        this.runCycle = 0;
      }
      
      // Jump - can be pressed while moving
      if (keys.up && this.onGround) {
        this.vy = this.jumpForce;
        this.onGround = false;
        this.state = 'jumping';
      }
    } else if (this.state === 'dodging' && this.dashSpeed !== 0) {
      // Apply dash movement
      this.vx = this.dashSpeed;
      
      // Create dash particle trail
      if (p.frameCount % 2 === 0) {
        gameState.particles.push(...createDashParticles(
          this.x + this.width/2, 
          this.y + this.height/2,
          !this.facingRight
        ));
      }
    } else {
      // Apply friction even during special states (except dodge which has its own handling)
      if (this.state !== 'dodging') {
        this.vx *= this.friction;
      }
    }
    
    // Apply gravity
    if (!this.onGround) {
      this.vy += this.gravity;
      if (this.vy > this.maxFallSpeed) this.vy = this.maxFallSpeed;
      if (this.state !== 'attacking' && this.state !== 'dodging') {
        this.state = 'jumping';
      }
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Check platform collisions
    this.onGround = false;
    for (let platform of platforms) {
      // Horizontal collisions (walls)
      const verticalOverlap = this.y + this.height > platform.y + 10 && this.y + 10 < platform.y + platform.height;
      
      if (verticalOverlap) {
        // Moving right into platform's left side
        if (this.vx > 0 && 
            this.x + this.width > platform.x && 
            this.x < platform.x) {
          this.x = platform.x - this.width;
          this.vx = 0;
          this.dashSpeed = 0;
        }
        // Moving left into platform's right side
        if (this.vx < 0 && 
            this.x < platform.x + platform.width && 
            this.x + this.width > platform.x + platform.width) {
          this.x = platform.x + platform.width;
          this.vx = 0;
          this.dashSpeed = 0;
        }
      }
      
      // Vertical collision (floor)
      if (this.vy > 0 && 
          this.y + this.height > platform.y && 
          this.y < platform.y + 10 &&
          this.x + this.width > platform.x + 5 && 
          this.x < platform.x + platform.width - 5) {
        this.y = platform.y - this.height;
        this.vy = 0;
        this.onGround = true;
      }
    }
    
    // World boundaries
    if (this.x < 0) {
      this.x = 0;
      this.dashSpeed = 0;
      this.vx = 0;
    }
    if (this.x > gameState.levelWidth - this.width) {
      this.x = gameState.levelWidth - this.width;
      this.dashSpeed = 0;
      this.vx = 0;
    }
    if (this.y > CANVAS_HEIGHT + 100) {
      this.takeDamage(this.health); // Fall death
    }
    
    // Update attack hitbox position
    if (this.attackHitbox) {
      this.attackHitbox.x = this.facingRight ? this.x + this.width : this.x - 50;
      this.attackHitbox.y = this.y + 10;
    }
  }
  
  attack(p) {
    if (this.attackTimer > 0 || this.dodgeTimer > 0) return;
    
    this.state = 'attacking';
    this.attackTimer = this.attackCooldown;
    this.animFrame = 0;
    
    // Create attack hitbox
    this.attackHitbox = {
      x: this.facingRight ? this.x + this.width : this.x - 50,
      y: this.y + 10,
      width: 50,
      height: 40,
      damage: this.attackPower,
      owner: 'player'
    };
    
    return this.attackHitbox;
  }
  
  dodge(p) {
    if (this.dodgeTimer > 0 || this.attackTimer > 0) return;
    
    this.state = 'dodging';
    this.dodgeTimer = this.dodgeCooldown;
    this.invulnerable = true;
    this.invulnerableTimer = 20; // Brief invulnerability
    
    // Smooth dash with speed
    const dashSpeed = 12;
    this.dashSpeed = this.facingRight ? dashSpeed : -dashSpeed;
    
    // Create initial dash burst particles
    gameState.particles.push(...createDashParticles(
      this.x + this.width/2, 
      this.y + this.height/2,
      !this.facingRight,
      15 // More particles for burst
    ));
  }
  
  useSkill1(p) {
    if (this.skill1Cooldown > 0 || this.mana < 20) return null;
    
    this.skill1Cooldown = this.skill1MaxCooldown;
    this.mana -= 20;
    this.state = 'casting';
    this.attackTimer = 15;
    
    // Create powerful AoE burst attack around player
    return {
      x: this.x - 30,
      y: this.y - 10,
      width: 100,
      height: 80,
      damage: this.attackPower * 2,
      duration: 15,
      owner: 'player',
      type: 'aoe'
    };
  }
  
  useSkill2(p) {
    if (!this.skill2Unlocked || this.skill2Cooldown > 0 || this.mana < 30) return null;
    
    this.skill2Cooldown = this.skill2MaxCooldown;
    this.mana -= 30;
    this.state = 'casting';
    this.attackTimer = 10;
    
    // Create projectile
    return {
      x: this.facingRight ? this.x + this.width : this.x,
      y: this.y + 20,
      vx: this.facingRight ? 10 : -10,
      vy: 0,
      width: 20,
      height: 20,
      damage: this.attackPower * 1.5,
      owner: 'player',
      type: 'projectile'
    };
  }
  
  takeDamage(amount) {
    if (this.invulnerable) return 0;
    
    const actualDamage = Math.max(1, amount - this.defense);
    this.health -= actualDamage;
    this.invulnerable = true;
    this.invulnerableTimer = 30;
    
    if (this.health <= 0) {
      this.health = 0;
    }
    
    return actualDamage;
  }
  
  gainXP(amount) {
    this.xp += amount;
    if (this.xp >= this.xpThreshold) {
      this.levelUp();
    }
  }
  
  levelUp() {
    this.level++;
    this.xp = this.xp - this.xpThreshold;
    this.xpThreshold = Math.floor(this.xpThreshold * 1.5);
    
    // Increase stats
    this.maxHealth += 20;
    this.health = this.maxHealth;
    this.maxMana += 10;
    this.mana = this.maxMana;
    this.attackPower += 3;
    this.defense += 1;
    
    // Unlock skill 2 at level 2
    if (this.level === 2) {
      this.skill2Unlocked = true;
    }
  }
  
  collect(item) {
    if (item.type === 'gold') {
      gameState.score += 1;
    } else if (item.type === 'health') {
      this.health = Math.min(this.maxHealth, this.health + 30);
    } else if (item.type === 'mana') {
      this.mana = Math.min(this.maxMana, this.mana + 20);
    }
  }
  
  draw(p, cameraX) {
    p.push();
    
    // Flash when invulnerable
    if (this.invulnerable && Math.floor(p.frameCount / 5) % 2 === 0) {
      p.tint(255, 150);
    }
    
    const screenX = this.x - cameraX;
    
    // Draw dash trail effect
    if (this.state === 'dodging' && this.dodgeTimer > 40) {
      this.drawDashTrail(p, screenX);
    }
    
    // Draw attack slash effect
    if (this.state === 'attacking' && this.attackAnimProgress < 0.7) {
      this.drawAttackSlash(p, screenX);
    }
    
    // Draw shadow (player silhouette)
    p.fill(20, 20, 40);
    p.noStroke();
    
    // Body bobbing during run
    let bodyY = this.y;
    if (this.state === 'running') {
      bodyY += Math.abs(Math.sin(this.runCycle)) * 2;
    }
    
    // Body
    p.rect(screenX + 10, bodyY + 10, 20, 35, 3);
    
    // Head
    p.ellipse(screenX + 20, bodyY + 5, 15, 15);
    
    // Arms - better animation
    let leftArmAngle = 0;
    let rightArmAngle = 0;
    
    if (this.state === 'running') {
      leftArmAngle = Math.sin(this.runCycle) * 0.5;
      rightArmAngle = -Math.sin(this.runCycle) * 0.5;
    } else if (this.state === 'attacking') {
      // Swing motion
      const swingAngle = this.attackAnimProgress * Math.PI;
      if (this.facingRight) {
        rightArmAngle = -swingAngle;
      } else {
        leftArmAngle = swingAngle;
      }
    }
    
    p.push();
    p.translate(screenX + 7, bodyY + 17);
    p.rotate(leftArmAngle);
    p.rect(0, 0, 6, 18, 2);
    p.pop();
    
    p.push();
    p.translate(screenX + 27, bodyY + 17);
    p.rotate(rightArmAngle);
    p.rect(0, 0, 6, 18, 2);
    p.pop();
    
    // Legs - improved running animation
    if (this.state === 'running') {
      const legCycle = Math.sin(this.runCycle);
      const legCycle2 = Math.sin(this.runCycle + Math.PI);
      
      // Left leg
      p.push();
      p.translate(screenX + 14, bodyY + 45);
      p.rotate(legCycle * 0.4);
      p.rect(0, 0, 6, 15, 2);
      p.pop();
      
      // Right leg
      p.push();
      p.translate(screenX + 20, bodyY + 45);
      p.rotate(legCycle2 * 0.4);
      p.rect(0, 0, 6, 15, 2);
      p.pop();
    } else {
      p.rect(screenX + 12, bodyY + 45, 7, 15, 2);
      p.rect(screenX + 21, bodyY + 45, 7, 15, 2);
    }
    
    // Weapon (katana) - better positioning
    p.stroke(100, 100, 120);
    p.strokeWeight(3);
    
    if (this.state === 'attacking') {
      // Dramatic sword swing
      const swingProgress = this.attackAnimProgress;
      const startAngle = this.facingRight ? -2.5 : 2.5;
      const endAngle = this.facingRight ? 0.8 : -0.8;
      const angle = startAngle + (endAngle - startAngle) * swingProgress;
      
      const swordLength = 35;
      const swordX = screenX + 20;
      const swordY = bodyY + 25;
      
      p.line(
        swordX, swordY,
        swordX + Math.cos(angle) * swordLength,
        swordY + Math.sin(angle) * swordLength
      );
      
      // Sword glow/trail
      p.stroke(150, 200, 255, 150);
      p.strokeWeight(5);
      p.line(
        swordX, swordY,
        swordX + Math.cos(angle) * swordLength,
        swordY + Math.sin(angle) * swordLength
      );
    } else {
      // Sword at rest
      p.line(
        screenX + (this.facingRight ? 30 : 10),
        bodyY + 25,
        screenX + (this.facingRight ? 30 : 10),
        bodyY + 40
      );
    }
    
    // Eyes (glowing)
    p.noStroke();
    p.fill(100, 200, 255);
    const eyeY = bodyY + 4;
    if (this.facingRight) {
      p.ellipse(screenX + 23, eyeY, 3, 3);
    } else {
      p.ellipse(screenX + 17, eyeY, 3, 3);
    }
    
    p.pop();
  }
  
  drawDashTrail(p, screenX) {
    p.push();
    
    // Motion blur effect
    const trailCount = 5;
    for (let i = 1; i <= trailCount; i++) {
      const trailAlpha = 100 * (1 - i / trailCount);
      const trailOffset = this.dashSpeed * i * 0.5;
      
      p.fill(100, 150, 255, trailAlpha);
      p.noStroke();
      p.rect(screenX - trailOffset + 10, this.y + 10, 20, 35, 3);
      p.ellipse(screenX - trailOffset + 20, this.y + 5, 15, 15);
    }
    
    p.pop();
  }
  
  drawAttackSlash(p, screenX) {
    p.push();
    
    const progress = this.attackAnimProgress;
    const centerX = screenX + 20 + (this.facingRight ? 25 : -25);
    const centerY = this.y + 30;
    
    // Bright energy slash arc
    p.noFill();
    p.stroke(200, 230, 255, 255 * (1 - progress));
    p.strokeWeight(8);
    
    const arcRadius = 40;
    const startAngle = this.facingRight ? -Math.PI * 0.3 : Math.PI * 0.7;
    const endAngle = this.facingRight ? Math.PI * 0.5 : Math.PI * 1.3;
    
    p.arc(centerX, centerY, arcRadius * 2, arcRadius * 2, 
          startAngle, startAngle + (endAngle - startAngle) * progress);
    
    // Inner glow
    p.stroke(255, 255, 255, 200 * (1 - progress));
    p.strokeWeight(4);
    p.arc(centerX, centerY, arcRadius * 2, arcRadius * 2, 
          startAngle, startAngle + (endAngle - startAngle) * progress);
    
    // Outer energy particles
    for (let i = 0; i < 5; i++) {
      const angle = startAngle + (endAngle - startAngle) * progress * (i / 5);
      const dist = arcRadius + Math.random() * 10;
      const px = centerX + Math.cos(angle) * dist;
      const py = centerY + Math.sin(angle) * dist;
      
      p.fill(220, 240, 255, 200 * (1 - progress));
      p.noStroke();
      p.ellipse(px, py, 6 - progress * 4, 6 - progress * 4);
    }
    
    p.pop();
  }
}