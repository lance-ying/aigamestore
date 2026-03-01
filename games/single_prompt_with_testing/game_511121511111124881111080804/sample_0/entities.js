// entities.js - Game entity classes

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_RADIUS,
  PLAYER_BOUNCE,
  JUMP_POWER,
  MOVE_SPEED,
  PLATFORM_DECAY_TIME,
  PLATFORM_SHAKE_DURATION,
  PLATFORM_FALL_SPEED,
  STAR_RADIUS,
  STAR_VALUE,
  STAR_ROTATION_SPEED,
  STAR_BOB_AMPLITUDE,
  STAR_BOB_SPEED,
  GRAPPLE_RANGE,
  COLORS,
  distance,
  angleBetween,
  clamp
} from './globals.js';
import { 
  applyPhysics, 
  checkCircleRectCollision, 
  resolveCircleRectCollision,
  checkOnPlatform,
  checkCircleCircleCollision,
  calculateGrappleForce,
  isOffScreen
} from './physics.js';
import { createParticles, createStarBurstParticles } from './particles.js';

// Player class - the bouncy ball character
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = PLAYER_RADIUS;
    
    // Physics
    this.vx = 0;
    this.vy = 0;
    this.speed = MOVE_SPEED;
    this.jumpPower = JUMP_POWER;
    this.onGround = false;
    this.bounce = PLAYER_BOUNCE;
    
    // Grapple state
    this.isGrappling = false;
    this.grappleTarget = null;
    this.grapplePressed = false;
    this.jumpPressed = false;
    
    // Animation state
    this.squashX = 1;
    this.squashY = 1;
    this.rotation = 0;
    this.eyeOffsetX = 0;
    this.eyeOffsetY = 0;
    
    // Movement state
    this.facing = 1; // 1 = right, -1 = left
    this.lastPosition = { x: x, y: y };
    
    // Invulnerability frames (for platform collisions)
    this.iframes = 0;
    
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    // Decrement iframes
    if (this.iframes > 0) {
      this.iframes--;
    }
    
    // Apply grapple physics if grappling
    if (this.isGrappling && this.grappleTarget) {
      const force = calculateGrappleForce(
        this,
        this.grappleTarget.x,
        this.grappleTarget.y
      );
      this.vx += force.fx;
      this.vy += force.fy;
      
      // Add slight gravity when grappling
      this.vy += gameState.gravity * 0.3;
      
      // Damping
      this.vx *= 0.99;
      this.vy *= 0.99;
      
      // Update position
      this.x += this.vx;
      this.y += this.vy;
      
      // Maintain grapple length
      const dx = this.grappleTarget.x - this.x;
      const dy = this.grappleTarget.y - this.y;
      const currentLength = Math.sqrt(dx * dx + dy * dy);
      
      if (currentLength > gameState.grappleLength) {
        const ratio = gameState.grappleLength / currentLength;
        this.x = this.grappleTarget.x - dx * ratio;
        this.y = this.grappleTarget.y - dy * ratio;
      }
    } else {
      // Normal physics
      applyPhysics(this);
    }
    
    // Reset on ground flag
    this.onGround = false;
    
    // Check platform collisions
    for (const platform of gameState.platforms) {
      if (platform.isActive && checkCircleRectCollision(this, platform)) {
        resolveCircleRectCollision(this, platform, this.bounce);
        
        // Trigger platform decay on landing
        if (platform.decayOnTouch && !platform.isDecaying && this.iframes <= 0) {
          platform.startDecay();
          this.iframes = 10; // Brief invulnerability
        }
      }
    }
    
    // Check collectible collisions
    for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
      const collectible = gameState.collectibles[i];
      if (checkCircleCircleCollision(this, collectible)) {
        collectible.collect(p);
      }
    }
    
    // Check goal collision
    if (gameState.goalPlatform && checkCircleRectCollision(this, gameState.goalPlatform)) {
      this.reachGoal(p);
    }
    
    // Check boundaries
    this.checkBoundaries();
    
    // Update animation
    this.updateAnimation();
    
    // Check lose condition
    if (isOffScreen(this)) {
      this.die(p);
    }
    
    // Log position if moved significantly
    if (Math.abs(this.x - this.lastPosition.x) > 1 || 
        Math.abs(this.y - this.lastPosition.y) > 1) {
      this.logPosition(p);
      this.lastPosition.x = this.x;
      this.lastPosition.y = this.y;
    }
  }
  
  moveLeft() {
    if (!this.isGrappling) {
      this.vx -= this.speed * 0.5;
      this.facing = -1;
    } else {
      // Apply horizontal force while grappling
      this.vx -= this.speed * 0.2;
    }
  }
  
  moveRight() {
    if (!this.isGrappling) {
      this.vx += this.speed * 0.5;
      this.facing = 1;
    } else {
      // Apply horizontal force while grappling
      this.vx += this.speed * 0.2;
    }
  }
  
  jump() {
    if (this.onGround) {
      this.vy = this.jumpPower;
      this.onGround = false;
      this.squashY = 0.7;
      this.squashX = 1.3;
      
      // Create jump particles
      createParticles(this.x, this.y + this.radius, 5, COLORS.particle);
    }
  }
  
  launchGrapple() {
    if (this.isGrappling) return;
    
    // Find nearest grapple point in range
    let nearest = null;
    let minDist = GRAPPLE_RANGE;
    
    for (const point of gameState.grapplePoints) {
      const dist = distance(this.x, this.y, point.x, point.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = point;
      }
    }
    
    if (nearest) {
      this.isGrappling = true;
      this.grappleTarget = nearest;
      gameState.isGrappling = true;
      gameState.grappleTarget = nearest;
      gameState.grappleLength = minDist;
      
      // Visual feedback
      nearest.activated = true;
      
      // Cancel vertical velocity slightly
      this.vy *= 0.7;
    }
  }
  
  maintainGrapple() {
    // Grapple is maintained automatically in update
  }
  
  releaseGrapple() {
    if (this.isGrappling) {
      this.isGrappling = false;
      gameState.isGrappling = false;
      
      if (this.grappleTarget) {
        this.grappleTarget.activated = false;
        this.grappleTarget = null;
      }
      
      gameState.grappleTarget = null;
    }
  }
  
  checkBoundaries() {
    // Left and right walls
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx = Math.abs(this.vx) * this.bounce;
    }
    if (this.x + this.radius > CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - this.radius;
      this.vx = -Math.abs(this.vx) * this.bounce;
    }
  }
  
  updateAnimation() {
    // Squash and stretch effect
    const targetSquashX = 1;
    const targetSquashY = 1;
    
    this.squashX += (targetSquashX - this.squashX) * 0.2;
    this.squashY += (targetSquashY - this.squashY) * 0.2;
    
    // Rotation based on horizontal velocity
    if (!this.onGround) {
      this.rotation += this.vx * 0.05;
    } else {
      this.rotation *= 0.9;
    }
    
    // Eye offset based on velocity
    this.eyeOffsetX = clamp(this.vx * 0.5, -3, 3);
    this.eyeOffsetY = clamp(this.vy * 0.3, -2, 2);
  }
  
  reachGoal(p) {
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "GAME_OVER_WIN";
      
      // Create celebration particles
      createStarBurstParticles(this.x, this.y, 30);
      
      if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
          data: { 
            gamePhase: "GAME_OVER_WIN",
            finalScore: gameState.score,
            starsCollected: gameState.starsCollected,
            levelTime: gameState.levelTime
          },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  die(p) {
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "GAME_OVER_LOSE";
      
      // Create death particles
      createParticles(this.x, this.y, 20, COLORS.player);
      
      if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
          data: { 
            gamePhase: "GAME_OVER_LOSE",
            finalScore: gameState.score
          },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: this.x,
        screen_y: this.y,
        game_x: this.x,
        game_y: this.y,
        velocity_x: this.vx,
        velocity_y: this.vy,
        on_ground: this.onGround,
        is_grappling: this.isGrappling,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    p.scale(this.squashX, this.squashY);
    
    // Draw main body
    p.fill(...COLORS.player);
    p.noStroke();
    p.circle(0, 0, this.radius * 2);
    
    // Draw highlight
    p.fill(255, 255, 255, 100);
    p.circle(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.8);
    
    // Draw eyes
    const eyeY = -this.radius * 0.2 + this.eyeOffsetY;
    const eyeSpacing = this.radius * 0.5;
    
    // Left eye
    p.fill(...COLORS.playerEye);
    p.circle(-eyeSpacing + this.eyeOffsetX, eyeY, this.radius * 0.4);
    p.fill(...COLORS.playerPupil);
    p.circle(-eyeSpacing + this.eyeOffsetX * 1.5, eyeY, this.radius * 0.2);
    
    // Right eye
    p.fill(...COLORS.playerEye);
    p.circle(eyeSpacing + this.eyeOffsetX, eyeY, this.radius * 0.4);
    p.fill(...COLORS.playerPupil);
    p.circle(eyeSpacing + this.eyeOffsetX * 1.5, eyeY, this.radius * 0.2);
    
    p.pop();
    
    // Draw grapple line
    if (this.isGrappling && this.grappleTarget) {
      p.push();
      p.stroke(...COLORS.grappleLine);
      p.strokeWeight(3);
      
      // Animate line with wave effect
      const segments = 10;
      const waveOffset = gameState.frameCount * 0.1;
      
      for (let i = 0; i < segments; i++) {
        const t1 = i / segments;
        const t2 = (i + 1) / segments;
        
        const x1 = this.x + (this.grappleTarget.x - this.x) * t1;
        const y1 = this.y + (this.grappleTarget.y - this.y) * t1;
        const x2 = this.x + (this.grappleTarget.x - this.x) * t2;
        const y2 = this.y + (this.grappleTarget.y - this.y) * t2;
        
        // Add wave
        const wave1 = Math.sin(t1 * Math.PI * 2 + waveOffset) * 2;
        const wave2 = Math.sin(t2 * Math.PI * 2 + waveOffset) * 2;
        
        const perpAngle = angleBetween(x1, y1, x2, y2) + Math.PI / 2;
        
        p.line(
          x1 + Math.cos(perpAngle) * wave1,
          y1 + Math.sin(perpAngle) * wave1,
          x2 + Math.cos(perpAngle) * wave2,
          y2 + Math.sin(perpAngle) * wave2
        );
      }
      
      p.pop();
    }
  }
}

// Platform class
export class Platform {
  constructor(x, y, width, height, decayOnTouch = true, isGoal = false) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    this.decayOnTouch = decayOnTouch;
    this.isGoal = isGoal;
    this.isActive = true;
    this.isDecaying = false;
    this.isFalling = false;
    
    this.decayTimer = PLATFORM_DECAY_TIME;
    this.shakeIntensity = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.fallSpeed = 0;
    
    // Visual
    this.opacity = 255;
    
    if (isGoal) {
      gameState.goalPlatform = this;
    }
    
    gameState.platforms.push(this);
  }
  
  startDecay() {
    if (!this.decayOnTouch || this.isDecaying) return;
    
    this.isDecaying = true;
  }
  
  update(p) {
    if (!this.isActive) return;
    
    if (this.isDecaying && !this.isFalling) {
      this.decayTimer--;
      
      // Shake when about to fall
      if (this.decayTimer < PLATFORM_SHAKE_DURATION) {
        this.shakeIntensity = (PLATFORM_SHAKE_DURATION - this.decayTimer) / PLATFORM_SHAKE_DURATION * 3;
        this.offsetX = (Math.random() - 0.5) * this.shakeIntensity;
        this.offsetY = (Math.random() - 0.5) * this.shakeIntensity;
      }
      
      // Start falling
      if (this.decayTimer <= 0) {
        this.isFalling = true;
        
        // Create particles
        createParticles(
          this.x + this.width / 2,
          this.y,
          10,
          COLORS.platformDecay
        );
      }
    }
    
    if (this.isFalling) {
      this.fallSpeed += PLATFORM_FALL_SPEED * 0.1;
      this.y += this.fallSpeed;
      this.opacity -= 5;
      
      // Rotate while falling
      this.rotation = (this.rotation || 0) + 0.05;
      
      // Deactivate when off screen
      if (this.y > CANVAS_HEIGHT + 50 || this.opacity <= 0) {
        this.isActive = false;
      }
    }
  }
  
  render(p) {
    if (!this.isActive) return;
    
    p.push();
    p.translate(this.x + this.width / 2 + this.offsetX, this.y + this.height / 2 + this.offsetY);
    
    if (this.isFalling) {
      p.rotate(this.rotation);
    }
    
    p.translate(-this.width / 2, -this.height / 2);
    
    // Choose color based on platform type
    let fillColor;
    if (this.isGoal) {
      fillColor = [...COLORS.platformGoal, this.opacity];
      
      // Pulsing glow for goal
      const pulse = Math.sin(gameState.frameCount * 0.1) * 20 + 235;
      fillColor = [pulse * 0.4, pulse, pulse * 0.6, this.opacity];
    } else if (this.isDecaying && !this.isFalling) {
      const decayRatio = this.decayTimer / PLATFORM_DECAY_TIME;
      fillColor = [
        COLORS.platform[0] * decayRatio + COLORS.platformDecay[0] * (1 - decayRatio),
        COLORS.platform[1] * decayRatio + COLORS.platformDecay[1] * (1 - decayRatio),
        COLORS.platform[2] * decayRatio + COLORS.platformDecay[2] * (1 - decayRatio),
        this.opacity
      ];
    } else {
      fillColor = [...COLORS.platform, this.opacity];
    }
    
    p.fill(...fillColor);
    p.noStroke();
    p.rect(0, 0, this.width, this.height, 3);
    
    // Decay indicator
    if (this.isDecaying && !this.isFalling) {
      const decayRatio = this.decayTimer / PLATFORM_DECAY_TIME;
      p.fill(255, 50, 50, 150);
      p.rect(0, 0, this.width * (1 - decayRatio), this.height, 3);
    }
    
    // Goal platform indicator
    if (this.isGoal) {
      p.fill(255, 255, 255, this.opacity * 0.5);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text("GOAL", this.width / 2, this.height / 2);
    }
    
    p.pop();
  }
}

// Grapple point class
export class GrapplePoint {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 8;
    this.activated = false;
    this.pulsePhase = Math.random() * Math.PI * 2;
    
    gameState.grapplePoints.push(this);
  }
  
  update(p) {
    this.pulsePhase += 0.08;
  }
  
  render(p) {
    const pulse = Math.sin(this.pulsePhase) * 0.3 + 1;
    const size = this.radius * pulse;
    
    // Outer glow
    p.fill(...COLORS.grapplePoint, 100);
    p.noStroke();
    p.circle(this.x, this.y, size * 3);
    
    // Main circle
    p.fill(...COLORS.grapplePoint);
    p.circle(this.x, this.y, size * 2);
    
    // Inner highlight
    p.fill(255, 255, 255);
    p.circle(this.x - this.radius * 0.3, this.y - this.radius * 0.3, size * 0.8);
    
    // Connection indicator when activated
    if (this.activated) {
      p.stroke(...COLORS.grapplePoint);
      p.strokeWeight(2);
      p.noFill();
      p.circle(this.x, this.y, size * 4);
    }
  }
}

// Collectible star class
export class Collectible {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.initialY = y;
    this.radius = STAR_RADIUS;
    this.value = STAR_VALUE;
    
    this.rotation = 0;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.collected = false;
    
    gameState.collectibles.push(this);
    gameState.totalStars++;
  }
  
  update(p) {
    if (this.collected) return;
    
    // Rotate
    this.rotation += STAR_ROTATION_SPEED;
    
    // Bob up and down
    this.bobPhase += STAR_BOB_SPEED;
    this.y = this.initialY + Math.sin(this.bobPhase) * STAR_BOB_AMPLITUDE;
  }
  
  collect(p) {
    if (this.collected) return;
    
    this.collected = true;
    gameState.score += this.value;
    gameState.starsCollected++;
    
    // Create particles
    createStarBurstParticles(this.x, this.y, 15);
    
    // Remove from array
    const index = gameState.collectibles.indexOf(this);
    if (index > -1) {
      gameState.collectibles.splice(index, 1);
    }
  }
  
  render(p) {
    if (this.collected) return;
    
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    
    // Outer glow
    p.fill(...COLORS.starGlow, 150);
    p.noStroke();
    p.star(0, 0, this.radius * 1.5, this.radius * 0.7, 5);
    
    // Main star
    p.fill(...COLORS.star);
    p.star(0, 0, this.radius, this.radius * 0.4, 5);
    
    // Inner highlight
    p.fill(255, 255, 255, 200);
    p.star(0, 0, this.radius * 0.5, this.radius * 0.2, 5);
    
    p.pop();
  }
}

// Add star drawing function to p5
if (typeof window !== 'undefined' && window.p5) {
  window.p5.prototype.star = function(x, y, radius1, radius2, npoints) {
    let angle = Math.PI * 2 / npoints;
    let halfAngle = angle / 2.0;
    this.beginShape();
    for (let a = -Math.PI / 2; a < Math.PI * 2 - Math.PI / 2; a += angle) {
      let sx = x + Math.cos(a) * radius1;
      let sy = y + Math.sin(a) * radius1;
      this.vertex(sx, sy);
      sx = x + Math.cos(a + halfAngle) * radius2;
      sy = y + Math.sin(a + halfAngle) * radius2;
      this.vertex(sx, sy);
    }
    this.endShape(this.CLOSE);
  };
}