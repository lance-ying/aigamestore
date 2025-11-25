// entities.js - Game entities: Player, Orbs, Platforms, Particles

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, JUMP_FORCE, MOVE_SPEED, DASH_SPEED, DASH_DURATION, GROUND_POUND_FORCE } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 20;
    this.height = 30;
    this.onGround = false;
    this.hasDoubleJumped = false;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashDirection = 1;
    this.isGroundPounding = false;
    this.lookingUp = false;
    this.facingRight = true;
    
    // Animation
    this.animationFrame = 0;
    this.walkCycle = 0;
  }

  update(p) {
    // Handle dashing
    if (this.isDashing) {
      this.dashTimer--;
      this.vx = DASH_SPEED * this.dashDirection;
      this.vy = 0;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    } else if (!this.isGroundPounding) {
      // Normal movement
      this.vx *= 0.8; // Friction
    }

    // Apply gravity
    if (!this.onGround && !this.isDashing) {
      this.vy += GRAVITY;
    }

    // Ground pound
    if (this.isGroundPounding) {
      this.vy = GROUND_POUND_FORCE;
      this.vx *= 0.5;
    }

    // Cap velocity
    this.vy = p.constrain(this.vy, -15, 20);
    this.vx = p.constrain(this.vx, -DASH_SPEED, DASH_SPEED);

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Keep in bounds horizontally
    this.x = p.constrain(this.x, this.width / 2, CANVAS_WIDTH - this.width / 2);

    // Animation
    if (Math.abs(this.vx) > 0.5 && this.onGround) {
      this.walkCycle += 0.2;
    }
    this.animationFrame++;

    // Check if fell off world
    if (this.y > gameState.cameraY + CANVAS_HEIGHT + 100) {
      this.y = gameState.cameraY - 50;
      this.vy = 0;
    }

    this.onGround = false;
  }

  jump() {
    if (this.onGround) {
      this.vy = JUMP_FORCE;
      this.onGround = false;
      this.hasDoubleJumped = false;
      this.isGroundPounding = false;
      return true;
    } else if (gameState.abilities.doubleJump && !this.hasDoubleJumped) {
      this.vy = JUMP_FORCE * 0.9;
      this.hasDoubleJumped = true;
      this.isGroundPounding = false;
      // Create particles
      createJumpParticles(this.x, this.y);
      return true;
    }
    return false;
  }

  startDash() {
    if (gameState.abilities.dash && !this.isDashing) {
      this.isDashing = true;
      this.dashTimer = DASH_DURATION;
      this.dashDirection = this.facingRight ? 1 : -1;
      this.isGroundPounding = false;
      createDashParticles(this.x, this.y);
      return true;
    }
    return false;
  }

  startGroundPound() {
    if (gameState.abilities.groundPound && !this.onGround && !this.isGroundPounding) {
      this.isGroundPounding = true;
      this.vy = GROUND_POUND_FORCE;
      return true;
    }
    return false;
  }

  render(p) {
    const screenY = this.y - gameState.cameraY;
    
    p.push();
    p.translate(this.x, screenY);
    
    // Dress/cape flowing effect
    const saturation = gameState.worldSaturation;
    const dressColors = [
      [200 * saturation, 50 * saturation, 50 * saturation], // Red
      [50 * saturation, 100 * saturation, 200 * saturation], // Blue
      [220 * saturation, 200 * saturation, 50 * saturation]  // Yellow
    ];
    
    // Draw dress layers (cape-like)
    for (let i = 0; i < 3; i++) {
      if (i === 0 || (i === 1 && gameState.abilities.doubleJump) || (i === 2 && gameState.abilities.dash)) {
        const offset = Math.sin(this.animationFrame * 0.1 + i) * 2;
        p.fill(...dressColors[i], 150);
        p.noStroke();
        const direction = this.facingRight ? 1 : -1;
        p.beginShape();
        p.vertex(0, 5);
        p.vertex(-8 * direction + offset, 15);
        p.vertex(-10 * direction + offset, 25);
        p.vertex(0, 20);
        p.endShape(p.CLOSE);
      }
    }
    
    // Body
    p.fill(200 + 55 * saturation, 200 + 55 * saturation, 200 + 55 * saturation);
    p.noStroke();
    p.ellipse(0, 0, this.width, this.height);
    
    // Head
    p.ellipse(0, -this.height / 2 - 5, 15, 15);
    
    // Simple face
    p.fill(50);
    const eyeY = this.lookingUp ? -this.height / 2 - 8 : -this.height / 2 - 5;
    p.ellipse(-3, eyeY, 2, 2);
    p.ellipse(3, eyeY, 2, 2);
    
    // Ground pound effect
    if (this.isGroundPounding) {
      p.stroke(100 + 155 * saturation, 150 * saturation, 200 * saturation);
      p.strokeWeight(2);
      p.noFill();
      p.ellipse(0, this.height / 2, 25, 10);
    }
    
    // Dash effect
    if (this.isDashing) {
      p.stroke(255 * saturation, 200 * saturation, 100 * saturation, 150);
      p.strokeWeight(3);
      for (let i = 1; i <= 3; i++) {
        p.line(-this.dashDirection * i * 8, 0, -this.dashDirection * i * 8, 10);
      }
    }
    
    p.pop();
  }
}

export class Platform {
  constructor(x, y, width, height, type = 'solid') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // 'solid', 'fragile'
    this.broken = false;
    this.breakProgress = 0;
  }

  checkCollision(player, p) {
    if (this.broken) return false;

    const screenY = this.y - gameState.cameraY;
    const playerScreenY = player.y - gameState.cameraY;
    
    // Check if player is colliding from above
    if (p.collideRectRect(
      player.x - player.width / 2,
      playerScreenY - player.height / 2,
      player.width,
      player.height,
      this.x,
      screenY,
      this.width,
      this.height
    )) {
      // Only collide if coming from above
      const playerBottom = player.y - player.height / 2 + player.vy;
      const platformTop = this.y;
      
      if (player.vy > 0 && playerBottom <= platformTop + 5) {
        player.y = this.y - player.height / 2;
        player.vy = 0;
        player.onGround = true;
        player.hasDoubleJumped = false;
        
        // Break fragile platforms if ground pounding
        if (this.type === 'fragile' && player.isGroundPounding) {
          this.breakProgress++;
          if (this.breakProgress > 1) {
            this.broken = true;
            createBreakParticles(this.x + this.width / 2, this.y, p);
          }
        }
        
        player.isGroundPounding = false;
        return true;
      }
    }
    return false;
  }

  render(p) {
    if (this.broken) return;
    
    const screenY = this.y - gameState.cameraY;
    const saturation = gameState.worldSaturation;
    
    p.push();
    if (this.type === 'fragile') {
      // Fragile platforms - cracked appearance
      p.fill(150 + 50 * saturation, 120 + 50 * saturation, 100 + 50 * saturation);
      p.stroke(100 + 50 * saturation, 80 + 50 * saturation, 60 + 50 * saturation);
      p.strokeWeight(1);
      p.rect(this.x, screenY, this.width, this.height);
      
      // Cracks
      if (this.breakProgress > 0) {
        p.stroke(80, 60, 40);
        p.line(this.x + this.width / 3, screenY, this.x + this.width / 2, screenY + this.height);
        p.line(this.x + 2 * this.width / 3, screenY, this.x + this.width / 2, screenY + this.height);
      }
    } else {
      // Solid platforms
      p.fill(100 + 80 * saturation, 100 + 80 * saturation, 120 + 80 * saturation);
      p.stroke(70 + 60 * saturation, 70 + 60 * saturation, 90 + 60 * saturation);
      p.strokeWeight(2);
      p.rect(this.x, screenY, this.width, this.height);
      
      // Decorative lines
      p.stroke(120 + 80 * saturation, 120 + 80 * saturation, 140 + 80 * saturation);
      p.strokeWeight(1);
      p.line(this.x + 5, screenY + this.height / 2, this.x + this.width - 5, screenY + this.height / 2);
    }
    p.pop();
  }
}

export class Orb {
  constructor(x, y, abilityType, color) {
    this.x = x;
    this.y = y;
    this.abilityType = abilityType; // 'doubleJump', 'groundPound', 'dash'
    this.color = color;
    this.collected = false;
    this.radius = 15;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  checkCollision(player, p) {
    if (this.collected) return false;
    
    const screenY = this.y - gameState.cameraY;
    const playerScreenY = player.y - gameState.cameraY;
    
    const dist = p.dist(player.x, playerScreenY, this.x, screenY);
    if (dist < this.radius + player.width / 2) {
      this.collected = true;
      gameState.abilities[this.abilityType] = true;
      gameState.score += 100;
      gameState.worldSaturation = Math.min(1, gameState.worldSaturation + 0.33);
      createCollectParticles(this.x, this.y, this.color, p);
      return true;
    }
    return false;
  }

  render(p) {
    if (this.collected) return;
    
    const screenY = this.y - gameState.cameraY;
    this.pulsePhase += 0.05;
    const pulse = Math.sin(this.pulsePhase) * 3;
    
    p.push();
    p.translate(this.x, screenY);
    
    // Outer glow
    for (let i = 3; i > 0; i--) {
      p.fill(...this.color, 30 / i);
      p.noStroke();
      p.ellipse(0, 0, (this.radius + pulse) * 2 * (1 + i * 0.2), (this.radius + pulse) * 2 * (1 + i * 0.2));
    }
    
    // Core
    p.fill(...this.color);
    p.noStroke();
    p.ellipse(0, 0, (this.radius + pulse) * 2, (this.radius + pulse) * 2);
    
    // Shine
    p.fill(255, 255, 255, 150);
    p.ellipse(-3, -3, 5, 5);
    
    p.pop();
  }
}

export class Particle {
  constructor(x, y, vx, vy, color, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.life--;
  }

  render(p) {
    const screenY = this.y - gameState.cameraY;
    const alpha = (this.life / this.maxLife) * 255;
    p.fill(...this.color, alpha);
    p.noStroke();
    p.ellipse(this.x, screenY, 4, 4);
  }

  isDead() {
    return this.life <= 0;
  }
}

// Particle creation helpers
export function createJumpParticles(x, y) {
  const p = window.gameInstance;
  for (let i = 0; i < 5; i++) {
    const angle = p.random(Math.PI, Math.PI * 2);
    const speed = p.random(1, 3);
    const color = [200, 100, 100];
    gameState.particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 20));
  }
}

export function createDashParticles(x, y) {
  const p = window.gameInstance;
  for (let i = 0; i < 8; i++) {
    const angle = p.random(Math.PI * 2);
    const speed = p.random(2, 4);
    const color = [220, 200, 50];
    gameState.particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 15));
  }
}

export function createCollectParticles(x, y, color, p) {
  for (let i = 0; i < 20; i++) {
    const angle = p.random(Math.PI * 2);
    const speed = p.random(2, 5);
    gameState.particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 30));
  }
}

export function createBreakParticles(x, y, p) {
  for (let i = 0; i < 10; i++) {
    const angle = p.random(Math.PI * 2);
    const speed = p.random(1, 4);
    const color = [150, 120, 100];
    gameState.particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 25));
  }
}