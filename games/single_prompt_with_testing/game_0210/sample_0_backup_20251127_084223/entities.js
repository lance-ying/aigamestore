// Entity classes for the game
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, COLORS, LEVEL_WIDTH, LEVEL_HEIGHT } from './globals.js';
import { advanceToNextLevel } from './levelgen.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 12;
    this.height = 20;
    
    // Physics
    this.vx = 0;
    this.vy = 0;
    this.speed = 3;
    this.gravityDirection = 1; // 1 = down, -1 = up
    this.onGround = false;
    
    // Animation
    this.animFrame = 0;
    this.animSpeed = 0.15;
    this.facing = 1; // 1 = right, -1 = left
    
    // State
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.canFlipGravity = true;
    this.flipCooldown = 0;
    
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    // Apply gravity
    this.vy += gameState.gravity * this.gravityDirection;
    
    // Apply friction
    this.vx *= gameState.friction;
    
    // Clamp velocity
    const maxVel = gameState.maxVelocity;
    this.vx = p.constrain(this.vx, -maxVel, maxVel);
    this.vy = p.constrain(this.vy, -maxVel * 1.5, maxVel * 1.5);
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Constrain to level bounds (left and right)
    this.x = p.constrain(this.x, 10, LEVEL_WIDTH - 10);
    
    // Check collisions
    this.checkPlatformCollisions(p);
    this.checkSpikeCollisions(p);
    this.checkCheckpointCollisions(p);
    this.checkCrewCollisions(p);
    this.checkExitCollision(p);
    
    // Update animation
    if (Math.abs(this.vx) > 0.5) {
      this.animFrame += this.animSpeed;
    }
    
    // Update timers
    if (this.invulnerable) {
      this.invulnerableTimer--;
      if (this.invulnerableTimer <= 0) {
        this.invulnerable = false;
      }
    }
    
    if (this.flipCooldown > 0) {
      this.flipCooldown--;
    }
    
    // Log position
    if (p.frameCount % 10 === 0) {
      this.logPosition(p);
    }
  }
  
  checkPlatformCollisions(p) {
    this.onGround = false;
    
    for (const platform of gameState.platforms) {
      if (this.collidesWith(platform)) {
        // Determine collision side
        const playerBottom = this.y + this.height / 2;
        const playerTop = this.y - this.height / 2;
        const playerLeft = this.x - this.width / 2;
        const playerRight = this.x + this.width / 2;
        
        const platformTop = platform.y;
        const platformBottom = platform.y + platform.height;
        const platformLeft = platform.x;
        const platformRight = platform.x + platform.width;
        
        // Calculate overlap on each side
        const overlapTop = playerBottom - platformTop;
        const overlapBottom = platformBottom - playerTop;
        const overlapLeft = playerRight - platformLeft;
        const overlapRight = platformRight - playerLeft;
        
        // Find minimum overlap
        const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight);
        
        if (minOverlap === overlapTop && this.vy > 0 && this.gravityDirection === 1) {
          // Collision from top (standing on platform)
          this.y = platformTop - this.height / 2;
          this.vy = 0;
          this.onGround = true;
        } else if (minOverlap === overlapBottom && this.vy < 0 && this.gravityDirection === -1) {
          // Collision from bottom (standing on ceiling)
          this.y = platformBottom + this.height / 2;
          this.vy = 0;
          this.onGround = true;
        } else if (minOverlap === overlapLeft) {
          // Collision from left
          this.x = platformLeft - this.width / 2;
          this.vx = 0;
        } else if (minOverlap === overlapRight) {
          // Collision from right
          this.x = platformRight + this.width / 2;
          this.vx = 0;
        }
      }
    }
  }
  
  checkSpikeCollisions(p) {
    if (this.invulnerable) return;
    
    for (const spike of gameState.spikes) {
      if (this.collidesWith(spike)) {
        this.die(p);
        return;
      }
    }
    
    // Check if fell off screen
    if (this.y < -50 || this.y > CANVAS_HEIGHT + 50) {
      this.die(p);
    }
  }
  
  checkCheckpointCollisions(p) {
    for (const checkpoint of gameState.checkpoints) {
      if (!checkpoint.activated && this.collidesWith(checkpoint)) {
        checkpoint.activate(p);
        gameState.lastCheckpoint = {
          x: checkpoint.x + checkpoint.width / 2,
          y: checkpoint.y + checkpoint.height / 2,
          level: gameState.currentLevel
        };
      }
    }
  }
  
  checkCrewCollisions(p) {
    for (const crew of gameState.crewMembers) {
      if (!crew.collected && this.collidesWith(crew)) {
        crew.collect(p);
      }
    }
  }
  
  checkExitCollision(p) {
    if (gameState.levelExit && !gameState.transitioning) {
      if (this.collidesWith(gameState.levelExit)) {
        advanceToNextLevel();
      }
    }
  }
  
  collidesWith(other) {
    return (
      this.x - this.width / 2 < other.x + other.width &&
      this.x + this.width / 2 > other.x &&
      this.y - this.height / 2 < other.y + other.height &&
      this.y + this.height / 2 > other.y
    );
  }
  
  die(p) {
    gameState.deathCount++;
    this.invulnerable = true;
    this.invulnerableTimer = 30;
    
    // Create death particles
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      gameState.particles.push(new Particle(
        this.x,
        this.y,
        Math.cos(angle) * 3,
        Math.sin(angle) * 3,
        COLORS.player
      ));
    }
    
    // Respawn at last checkpoint
    this.x = gameState.lastCheckpoint.x;
    this.y = gameState.lastCheckpoint.y;
    
    // If checkpoint is from a different level, reload that level
    if (gameState.lastCheckpoint.level !== gameState.currentLevel) {
      const { loadLevel } = require('./levelgen.js');
      loadLevel(gameState.lastCheckpoint.level);
    }
    
    this.vx = 0;
    this.vy = 0;
    this.gravityDirection = 1;
    
    // Screen shake
    gameState.screenShake = 10;
  }
  
  moveLeft() {
    this.vx = -this.speed;
    this.facing = -1;
  }
  
  moveRight() {
    this.vx = this.speed;
    this.facing = 1;
  }
  
  flipGravity(p) {
    if (!this.canFlipGravity || this.flipCooldown > 0) return;
    
    this.gravityDirection *= -1;
    this.vy = 0;
    this.flipCooldown = 5;
    
    // Create flip particles
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10;
      gameState.particles.push(new Particle(
        this.x,
        this.y,
        Math.cos(angle) * 2,
        Math.sin(angle) * 2,
        COLORS.player
      ));
    }
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: this.x,
        screen_y: this.y,
        level: gameState.currentLevel,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    if (this.invulnerable && Math.floor(gameState.frameCount / 3) % 2 === 0) {
      return; // Flashing effect
    }
    
    p.push();
    p.translate(this.x, this.y);
    
    // Flip sprite based on gravity
    if (this.gravityDirection === -1) {
      p.scale(1, -1);
    }
    
    // Flip horizontally based on facing
    if (this.facing === -1) {
      p.scale(-1, 1);
    }
    
    // Draw player body
    p.fill(...COLORS.player);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height);
    
    // Draw simple animation (legs)
    const legOffset = Math.sin(this.animFrame) * 2;
    p.rect(-3, this.height / 2 - 2, 3, 4 + legOffset);
    p.rect(3, this.height / 2 - 2, 3, 4 - legOffset);
    
    // Draw visor
    p.fill(0);
    p.rect(0, -this.height / 4, this.width - 4, 4);
    
    p.pop();
  }
}

export class Platform {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = 'static';
  }
  
  render(p) {
    p.fill(...COLORS.platform);
    p.noStroke();
    p.rect(this.x, this.y, this.width, this.height);
  }
}

export class MovingPlatform extends Platform {
  constructor(x, y, width, height, startX, endX, startY, endY, speed) {
    super(x, y, width, height);
    this.startX = startX;
    this.endX = endX;
    this.startY = startY;
    this.endY = endY;
    this.speed = speed;
    this.progress = 0;
    this.type = 'moving';
  }
  
  update(p) {
    this.progress += this.speed;
    const t = (Math.sin(this.progress) + 1) / 2; // Oscillate between 0 and 1
    
    this.x = this.startX + (this.endX - this.startX) * t;
    this.y = this.startY + (this.endY - this.startY) * t;
  }
}

export class Spike {
  constructor(x, y, width, height, direction = 'up') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.direction = direction; // 'up', 'down', 'left', 'right'
  }
  
  render(p) {
    p.fill(...COLORS.spike);
    p.noStroke();
    
    p.push();
    p.translate(this.x, this.y);
    
    // Draw spikes based on direction
    const numSpikes = Math.floor(this.width / 10);
    for (let i = 0; i < numSpikes; i++) {
      const spikeX = i * (this.width / numSpikes);
      const spikeWidth = this.width / numSpikes;
      
      p.beginShape();
      if (this.direction === 'up') {
        p.vertex(spikeX, this.height);
        p.vertex(spikeX + spikeWidth / 2, 0);
        p.vertex(spikeX + spikeWidth, this.height);
      } else if (this.direction === 'down') {
        p.vertex(spikeX, 0);
        p.vertex(spikeX + spikeWidth / 2, this.height);
        p.vertex(spikeX + spikeWidth, 0);
      }
      p.endShape(p.CLOSE);
    }
    
    p.pop();
  }
}

export class Checkpoint {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 40;
    this.activated = false;
    this.pulseTimer = 0;
  }
  
  activate(p) {
    this.activated = true;
    
    // Create activation particles
    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15;
      gameState.particles.push(new Particle(
        this.x + this.width / 2,
        this.y + this.height / 2,
        Math.cos(angle) * 2,
        Math.sin(angle) * 2,
        COLORS.checkpoint
      ));
    }
  }
  
  update(p) {
    this.pulseTimer += 0.1;
  }
  
  render(p) {
    const alpha = this.activated ? 255 : 100;
    const pulse = this.activated ? Math.sin(this.pulseTimer) * 10 : 0;
    
    p.fill(...COLORS.checkpoint, alpha);
    p.noStroke();
    p.rectMode(p.CORNER);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Draw checkpoint marker
    p.fill(255, 255, 255, alpha);
    p.circle(this.x + this.width / 2, this.y + this.height / 2 + pulse, 5);
  }
}

export class CrewMember {
  constructor(x, y, name) {
    this.x = x;
    this.y = y;
    this.width = 15;
    this.height = 25;
    this.name = name;
    this.collected = false;
    this.bobTimer = Math.random() * Math.PI * 2;
    this.bobSpeed = 0.05;
    this.initialY = y;
  }
  
  collect(p) {
    this.collected = true;
    gameState.collectedCrew++;
    gameState.score += 100;
    
    // Create collection particles
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      gameState.particles.push(new Particle(
        this.x + this.width / 2,
        this.y + this.height / 2,
        Math.cos(angle) * 4,
        Math.sin(angle) * 4,
        COLORS.crew
      ));
    }
  }
  
  update(p) {
    this.bobTimer += this.bobSpeed;
    this.y = this.initialY + Math.sin(this.bobTimer) * 5;
  }
  
  render(p) {
    if (this.collected) return;
    
    p.push();
    p.translate(this.x + this.width / 2, this.y + this.height / 2);
    
    // Draw crew member
    p.fill(...COLORS.crew);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height);
    
    // Draw face
    p.fill(0);
    p.circle(-3, -3, 3);
    p.circle(3, -3, 3);
    p.rect(0, 3, 8, 2);
    
    // Draw name above
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(8);
    p.text(this.name, 0, -this.height / 2 - 10);
    
    p.pop();
  }
}

export class LevelExit {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 50;
    this.pulseTimer = 0;
  }
  
  update(p) {
    this.pulseTimer += 0.1;
  }
  
  render(p) {
    const pulse = Math.sin(this.pulseTimer) * 5;
    const alpha = 200 + Math.sin(this.pulseTimer * 2) * 55;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Draw exit portal
    p.fill(...COLORS.exit, alpha);
    p.noStroke();
    p.rectMode(p.CORNER);
    p.rect(0, 0, this.width, this.height);
    
    // Draw glow effect
    p.fill(255, 255, 255, alpha * 0.5);
    p.rect(5, 5, this.width - 10, this.height - 10);
    
    // Draw arrow pointing to exit
    p.fill(0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text('→', this.width / 2, this.height / 2);
    
    p.pop();
  }
}

export class Particle {
  constructor(x, y, vx, vy, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = 30;
    this.age = 0;
    this.size = 3;
    
    gameState.particles.push(this);
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.age++;
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    const alpha = (1 - this.age / this.lifetime) * 255;
    p.fill(...this.color, alpha);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
  }
}