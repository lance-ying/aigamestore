// entities.js - Game entity classes (Snake, Bricks, Collectibles, Particles)

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SNAKE_BALL_RADIUS,
  SNAKE_BALL_SPACING,
  SNAKE_HORIZONTAL_SPEED,
  BRICK_WIDTH,
  BRICK_HEIGHT,
  COLLECTIBLE_RADIUS,
  INITIAL_SNAKE_LENGTH,
  COLORS,
  clamp,
  lerp,
  distance,
  addScreenShake,
  addFlash
} from './globals.js';

// Snake Ball class - individual ball in the snake chain
export class SnakeBall {
  constructor(x, y, index) {
    this.x = x;
    this.y = y;
    this.index = index;
    this.radius = SNAKE_BALL_RADIUS;
    this.targetX = x;
    this.targetY = y;
    this.vx = 0;
    this.vy = 0;
    this.following = null;
    this.pulsePhase = index * 0.3;
    this.trailPoints = [];
    this.maxTrailPoints = 5;
  }

  update(p) {
    // Update trail
    this.trailPoints.push({ x: this.x, y: this.y });
    if (this.trailPoints.length > this.maxTrailPoints) {
      this.trailPoints.shift();
    }

    // Update pulse animation
    this.pulsePhase += 0.1;

    // Follow the ball in front if not the head
    if (this.following) {
      const dx = this.following.x - this.x;
      const dy = this.following.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > SNAKE_BALL_SPACING) {
        const angle = Math.atan2(dy, dx);
        this.targetX = this.following.x - Math.cos(angle) * SNAKE_BALL_SPACING;
        this.targetY = this.following.y - Math.sin(angle) * SNAKE_BALL_SPACING;
      }

      // Smooth following with lerp
      this.x = lerp(this.x, this.targetX, 0.3);
      this.y = lerp(this.y, this.targetY, 0.3);
    }
  }

  render(p) {
    // Draw trail
    if (this.trailPoints.length > 1) {
      for (let i = 0; i < this.trailPoints.length - 1; i++) {
        const alpha = (i / this.trailPoints.length) * 100;
        const size = this.radius * (i / this.trailPoints.length);
        p.fill(COLORS.trail[0], COLORS.trail[1], COLORS.trail[2], alpha);
        p.noStroke();
        p.circle(this.trailPoints[i].x, this.trailPoints[i].y, size * 2);
      }
    }

    // Draw ball with pulse effect
    const pulseSize = Math.sin(this.pulsePhase) * 2;
    const currentRadius = this.radius + pulseSize;

    // Outer glow
    for (let i = 3; i > 0; i--) {
      const alpha = 50 - i * 15;
      p.fill(COLORS.snakeBall[0], COLORS.snakeBall[1], COLORS.snakeBall[2], alpha);
      p.noStroke();
      p.circle(this.x, this.y, (currentRadius + i * 2) * 2);
    }

    // Main ball
    p.fill(...COLORS.snakeBall);
    p.stroke(...COLORS.snakeBallOutline);
    p.strokeWeight(2);
    p.circle(this.x, this.y, currentRadius * 2);

    // Inner highlight
    p.fill(255, 255, 255, 150);
    p.noStroke();
    p.circle(this.x - currentRadius * 0.3, this.y - currentRadius * 0.3, currentRadius * 0.6);
  }
}

// Snake class - manages the chain of balls
export class Snake {
  constructor(x, y, length) {
    this.x = x;
    this.y = y;
    this.balls = [];
    this.targetX = x;
    this.moveSpeed = SNAKE_HORIZONTAL_SPEED;

    // Create initial snake balls
    for (let i = 0; i < length; i++) {
      const ball = new SnakeBall(x, y + i * SNAKE_BALL_SPACING, i);
      this.balls.push(ball);

      if (i > 0) {
        ball.following = this.balls[i - 1];
      }
    }

    gameState.player = this;
  }

  update(p) {
    if (this.balls.length === 0) {
      this.die();
      return;
    }

    // Update head position based on target
    const head = this.balls[0];
    const dx = this.targetX - head.x;

    if (Math.abs(dx) > 1) {
      head.x += clamp(dx * 0.15, -this.moveSpeed, this.moveSpeed);
    }

    // Keep head moving downward with camera
    head.y = gameState.cameraY + 100;

    // Update head target for following balls
    head.targetX = head.x;
    head.targetY = head.y;

    // Update all balls
    this.balls.forEach(ball => ball.update(p));

    // Update snake position for collision detection
    this.x = head.x;
    this.y = head.y;

    // Log player position
    this.logPosition(p);
  }

  setTargetX(x) {
    this.targetX = clamp(x, SNAKE_BALL_RADIUS * 2, CANVAS_WIDTH - SNAKE_BALL_RADIUS * 2);
  }

  addBall(count = 1) {
    for (let i = 0; i < count; i++) {
      const lastBall = this.balls[this.balls.length - 1];
      const newBall = new SnakeBall(
        lastBall.x,
        lastBall.y + SNAKE_BALL_SPACING,
        this.balls.length
      );
      newBall.following = lastBall;
      this.balls.push(newBall);
    }

    gameState.ballsCollected += count;
  }

  removeBalls(count) {
    const removed = Math.min(count, this.balls.length);
    
    for (let i = 0; i < removed; i++) {
      const ball = this.balls.pop();
      if (ball) {
        // Create particles at removed ball position
        this.createDestructionParticles(ball.x, ball.y);
      }
    }

    // Update following references
    if (this.balls.length > 0) {
      const lastBall = this.balls[this.balls.length - 1];
      lastBall.following = this.balls.length > 1 ? this.balls[this.balls.length - 2] : null;
    }

    return removed;
  }

  createDestructionParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 2 + Math.random() * 2;
      const particle = new Particle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        COLORS.snakeBall,
        20
      );
      gameState.particles.push(particle);
    }
  }

  getLength() {
    return this.balls.length;
  }

  die() {
    gameState.gamePhase = "GAME_OVER_LOSE";
  }

  logPosition(p) {
    if (p.logs && p.logs.player_info && gameState.frameCount % 5 === 0) {
      p.logs.player_info.push({
        screen_x: this.x,
        screen_y: this.y,
        game_x: this.x,
        game_y: this.y + gameState.cameraY,
        balls: this.balls.length,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }

  render(p) {
    // Render all balls from back to front
    for (let i = this.balls.length - 1; i >= 0; i--) {
      this.balls[i].render(p);
    }

    // Draw number on head
    if (this.balls.length > 0) {
      const head = this.balls[0];
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.textStyle(p.BOLD);
      p.text(this.balls.length, head.x, head.y);
    }
  }
}

// Brick class - obstacles that reduce snake length
export class Brick {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.width = BRICK_WIDTH;
    this.height = BRICK_HEIGHT;
    this.value = value;
    this.originalValue = value;
    this.destroyed = false;
    this.hitFlash = 0;
    this.destructionProgress = 0;
    this.shakeOffset = { x: 0, y: 0 };

    gameState.bricks.push(this);
    gameState.entities.push(this);
  }

  update(p) {
    // Update hit flash
    if (this.hitFlash > 0) {
      this.hitFlash -= 0.05;
    }

    // Update destruction animation
    if (this.value <= 0 && !this.destroyed) {
      this.destructionProgress += 0.1;
      if (this.destructionProgress >= 1) {
        this.destroy();
      }
    }

    // Update shake
    if (this.shakeOffset.x !== 0 || this.shakeOffset.y !== 0) {
      this.shakeOffset.x *= 0.8;
      this.shakeOffset.y *= 0.8;
      if (Math.abs(this.shakeOffset.x) < 0.1) this.shakeOffset.x = 0;
      if (Math.abs(this.shakeOffset.y) < 0.1) this.shakeOffset.y = 0;
    }

    // Check collision with snake
    this.checkSnakeCollision();

    // Remove if off screen
    if (this.y > CANVAS_HEIGHT + 100) {
      this.destroy();
    }
  }

  checkSnakeCollision() {
    if (!gameState.player || this.destroyed || this.value <= 0) return;

    const snake = gameState.player;
    const head = snake.balls[0];

    if (!head) return;

    // Check if head is inside brick
    if (
      head.x + head.radius > this.x &&
      head.x - head.radius < this.x + this.width &&
      head.y + head.radius > this.y &&
      head.y - head.radius < this.y + this.height
    ) {
      this.hit();
    }
  }

  hit() {
    if (this.destroyed || this.value <= 0) return;

    // Prevent multiple hits in quick succession
    if (gameState.frameCount - gameState.lastCollisionFrame < gameState.invulnerabilityFrames) {
      return;
    }

    gameState.lastCollisionFrame = gameState.frameCount;

    // Remove one ball from snake
    if (gameState.player && gameState.player.getLength() > 0) {
      gameState.player.removeBalls(1);
      this.value--;

      // Visual feedback
      this.hitFlash = 1;
      this.shakeOffset.x = (Math.random() - 0.5) * 6;
      this.shakeOffset.y = (Math.random() - 0.5) * 6;
      addScreenShake(3);

      // Create particles
      this.createHitParticles();

      // Update score
      gameState.score += 1;

      // Check if brick is destroyed
      if (this.value <= 0) {
        gameState.bricksDestroyed++;
        gameState.score += this.originalValue;
        addScreenShake(5);
        addFlash(100);
        this.createDestructionParticles();
      }
    }
  }

  createHitParticles() {
    for (let i = 0; i < 5; i++) {
      const particle = new Particle(
        this.x + this.width / 2 + (Math.random() - 0.5) * this.width,
        this.y + this.height / 2 + (Math.random() - 0.5) * this.height,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        COLORS.brick,
        15
      );
      gameState.particles.push(particle);
    }
  }

  createDestructionParticles() {
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const speed = 2 + Math.random() * 3;
      const particle = new Particle(
        this.x + this.width / 2,
        this.y + this.height / 2,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        COLORS.brick,
        30
      );
      gameState.particles.push(particle);
    }
  }

  destroy() {
    this.destroyed = true;

    const brickIndex = gameState.bricks.indexOf(this);
    if (brickIndex > -1) {
      gameState.bricks.splice(brickIndex, 1);
    }

    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
  }

  render(p) {
    if (this.destroyed) return;

    p.push();

    // Apply destruction animation
    if (this.destructionProgress > 0) {
      p.translate(
        this.x + this.width / 2,
        this.y + this.height / 2
      );
      p.scale(1 - this.destructionProgress);
      p.rotate(this.destructionProgress * Math.PI * 2);
      p.translate(
        -(this.x + this.width / 2),
        -(this.y + this.height / 2)
      );
    }

    // Apply shake offset
    const renderX = this.x + this.shakeOffset.x;
    const renderY = this.y + this.shakeOffset.y;

    // Calculate color based on value and hit flash
    const flashAmount = this.hitFlash * 255;
    const baseColor = COLORS.brick;
    const r = Math.min(255, baseColor[0] + flashAmount);
    const g = Math.min(255, baseColor[1] + flashAmount);
    const b = Math.min(255, baseColor[2] + flashAmount);

    // Draw brick background
    p.fill(r, g, b);
    p.stroke(...COLORS.brickOutline);
    p.strokeWeight(2);
    p.rect(renderX, renderY, this.width, this.height, 5);

    // Draw value text
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(18);
    p.textStyle(p.BOLD);
    p.text(this.value, renderX + this.width / 2, renderY + this.height / 2);

    // Draw health bar
    if (this.value < this.originalValue) {
      const barWidth = this.width - 8;
      const barHeight = 4;
      const barX = renderX + 4;
      const barY = renderY + this.height - 8;
      const healthRatio = this.value / this.originalValue;

      p.fill(50, 50, 50);
      p.noStroke();
      p.rect(barX, barY, barWidth, barHeight, 2);

      p.fill(255, 200, 0);
      p.rect(barX, barY, barWidth * healthRatio, barHeight, 2);
    }

    p.pop();
  }
}

// Collectible class - adds balls to snake
export class Collectible {
  constructor(x, y, value = 1) {
    this.x = x;
    this.y = y;
    this.radius = COLLECTIBLE_RADIUS;
    this.value = value;
    this.collected = false;
    this.rotation = 0;
    this.rotationSpeed = 0.05;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.bobPhase = Math.random() * Math.PI * 2;

    gameState.collectibles.push(this);
    gameState.entities.push(this);
  }

  update(p) {
    // Rotate
    this.rotation += this.rotationSpeed;
    this.pulsePhase += 0.1;
    this.bobPhase += 0.05;

    // Check collision with snake
    this.checkSnakeCollision();

    // Remove if off screen
    if (this.y > CANVAS_HEIGHT + 100) {
      this.destroy();
    }
  }

  checkSnakeCollision() {
    if (!gameState.player || this.collected) return;

    const snake = gameState.player;

    for (const ball of snake.balls) {
      const dist = distance(this.x, this.y, ball.x, ball.y);
      if (dist < this.radius + ball.radius) {
        this.collect();
        break;
      }
    }
  }

  collect() {
    if (this.collected) return;

    this.collected = true;

    // Add balls to snake
    if (gameState.player) {
      gameState.player.addBall(this.value);
    }

    // Visual feedback
    addScreenShake(2);
    addFlash(50);

    // Create particles
    this.createCollectionParticles();

    // Update score
    gameState.score += this.value * 2;

    this.destroy();
  }

  createCollectionParticles() {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 2 + Math.random() * 2;
      const particle = new Particle(
        this.x,
        this.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        COLORS.collectible,
        20
      );
      gameState.particles.push(particle);
    }
  }

  destroy() {
    const collectibleIndex = gameState.collectibles.indexOf(this);
    if (collectibleIndex > -1) {
      gameState.collectibles.splice(collectibleIndex, 1);
    }

    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
  }

  render(p) {
    if (this.collected) return;

    const bobOffset = Math.sin(this.bobPhase) * 3;
    const pulseSize = Math.sin(this.pulsePhase) * 2;
    const currentRadius = this.radius + pulseSize;

    p.push();
    p.translate(this.x, this.y + bobOffset);
    p.rotate(this.rotation);

    // Outer glow
    for (let i = 4; i > 0; i--) {
      const alpha = 80 - i * 20;
      p.fill(COLORS.collectible[0], COLORS.collectible[1], COLORS.collectible[2], alpha);
      p.noStroke();
      p.circle(0, 0, (currentRadius + i * 3) * 2);
    }

    // Main circle
    p.fill(...COLORS.collectible);
    p.stroke(...COLORS.collectibleOutline);
    p.strokeWeight(2);
    p.circle(0, 0, currentRadius * 2);

    // Plus sign
    p.stroke(255);
    p.strokeWeight(3);
    const lineSize = currentRadius * 0.6;
    p.line(-lineSize, 0, lineSize, 0);
    p.line(0, -lineSize, 0, lineSize);

    // Value text
    if (this.value > 1) {
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.textStyle(p.BOLD);
      p.text(`+${this.value}`, 0, currentRadius + 12);
    }

    p.pop();
  }
}

// Particle class - visual effects
export class Particle {
  constructor(x, y, vx, vy, color, lifetime = 30) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.age = 0;
    this.size = 3 + Math.random() * 3;
    this.alpha = 255;
    this.gravity = 0.1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.age++;

    // Fade out
    this.alpha = 255 * (1 - this.age / this.lifetime);

    // Slow down
    this.vx *= 0.98;
    this.vy *= 0.98;
  }

  isDead() {
    return this.age >= this.lifetime;
  }

  render(p) {
    p.push();
    p.fill(this.color[0], this.color[1], this.color[2], this.alpha);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
    p.pop();
  }
}