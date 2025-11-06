import { 
  CUBE_SIZE, 
  GRAVITY, 
  JUMP_FORCE, 
  GROUND_HEIGHT, 
  CANVAS_HEIGHT,
  SPIKE_WIDTH,
  SPIKE_HEIGHT,
  PLATFORM_HEIGHT,
  CHECKPOINT_SIZE,
  COLORS
} from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = CUBE_SIZE;
    this.height = CUBE_SIZE;
    this.velocityY = 0;
    this.isGrounded = false;
    this.rotation = 0;
    this.trail = [];
    this.trailMax = 10;
    this.jumpedAt = 0;
  }

  update(p, gameState) {
    // Apply gravity
    this.velocityY += GRAVITY;
    this.y += this.velocityY;

    // Check ground collision
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT - this.height / 2;
    if (this.y >= groundY) {
      this.y = groundY;
      this.velocityY = 0;
      this.isGrounded = true;
      gameState.lastGroundedFrame = p.frameCount;
    } else {
      this.isGrounded = false;
    }

    // Check platform collisions
    for (const platform of gameState.entities.filter(e => e.type === 'platform')) {
      if (this.y + this.height / 2 <= platform.y - platform.height / 2 && 
          this.y + this.height / 2 + this.velocityY >= platform.y - platform.height / 2 &&
          this.x + this.width / 2 > platform.x - platform.width / 2 &&
          this.x - this.width / 2 < platform.x + platform.width / 2) {
        this.y = platform.y - platform.height / 2 - this.height / 2;
        this.velocityY = 0;
        this.isGrounded = true;
        gameState.lastGroundedFrame = p.frameCount;
      }
    }

    // Update rotation based on movement
    if (!this.isGrounded) {
      this.rotation += 0.1;
    } else {
      this.rotation = Math.round(this.rotation / (Math.PI/2)) * (Math.PI/2);
    }

    // Update trail
    if (p.frameCount % 3 === 0) {
      this.trail.push({x: this.x, y: this.y, rotation: this.rotation});
      if (this.trail.length > this.trailMax) {
        this.trail.shift();
      }
    }

    // Log player info
    if (p.frameCount % 10 === 0) {
      p.logs.player_info.push({
        screen_x: this.x,
        screen_y: this.y,
        game_x: gameState.distance + this.x,
        game_y: this.y,
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  jump(p, gameState) {
    if (this.isGrounded) {
      this.velocityY = JUMP_FORCE;
      this.isGrounded = false;
      gameState.jumpCount++;
      gameState.lastJumpFrame = p.frameCount;
      this.jumpedAt = p.frameCount;
    }
  }

  draw(p) {
    // Draw trail
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const alpha = (i / this.trail.length) * 150;
      p.push();
      p.translate(t.x, t.y);
      p.rotate(t.rotation);
      p.fill(...COLORS.PLAYER_TRAIL, alpha);
      p.noStroke();
      p.rectMode(p.CENTER);
      p.rect(0, 0, this.width * 0.8, this.height * 0.8);
      p.pop();
    }

    // Draw player
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    p.fill(...COLORS.PLAYER);
    p.stroke(255);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height);
    
    // Draw design on cube
    p.fill(255);
    p.noStroke();
    p.rect(0, 0, this.width * 0.5, this.height * 0.5);
    p.pop();
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.velocityY = 0;
    this.isGrounded = false;
    this.rotation = 0;
    this.trail = [];
  }
}

export class Spike {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = SPIKE_WIDTH;
    this.height = SPIKE_HEIGHT;
    this.type = 'spike';
  }

  update(scrollSpeed) {
    this.x -= scrollSpeed;
  }

  draw(p) {
    p.fill(...COLORS.OBSTACLE);
    p.stroke(255);
    p.strokeWeight(2);
    p.beginShape();
    p.vertex(this.x - this.width / 2, this.y + this.height / 2);
    p.vertex(this.x, this.y - this.height / 2);
    p.vertex(this.x + this.width / 2, this.y + this.height / 2);
    p.endShape(p.CLOSE);
  }

  isOffScreen() {
    return this.x < -this.width;
  }
}

export class Platform {
  constructor(x, y, width) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = PLATFORM_HEIGHT;
    this.type = 'platform';
  }

  update(scrollSpeed) {
    this.x -= scrollSpeed;
  }

  draw(p) {
    p.fill(...COLORS.PLATFORM);
    p.stroke(255);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.width, this.height);
  }

  isOffScreen() {
    return this.x + this.width / 2 < 0;
  }
}

export class Checkpoint {
  constructor(x, y, id) {
    this.x = x;
    this.y = y;
    this.width = CHECKPOINT_SIZE;
    this.height = CHECKPOINT_SIZE;
    this.type = 'checkpoint';
    this.id = id;
    this.reached = false;
    this.pulseSize = 0;
    this.pulseDir = 1;
  }

  update(scrollSpeed) {
    this.x -= scrollSpeed;
    
    // Pulse animation
    this.pulseSize += 0.2 * this.pulseDir;
    if (this.pulseSize > 10 || this.pulseSize < 0) {
      this.pulseDir *= -1;
    }
  }

  draw(p) {
    // Draw checkpoint flag
    p.push();
    p.translate(this.x, this.y);
    
    // Draw pole
    p.fill(200);
    p.stroke(100);
    p.strokeWeight(1);
    p.rectMode(p.CENTER);
    p.rect(0, 0, 5, this.height);
    
    // Draw flag
    p.fill(this.reached ? [100, 255, 100] : [...COLORS.CHECKPOINT]);
    p.noStroke();
    p.triangle(
      2, -this.height/2 + 10,
      2, -this.height/2 + 40,
      25, -this.height/2 + 25
    );
    
    // Draw pulse effect if not reached
    if (!this.reached) {
      p.noFill();
      p.stroke(...COLORS.CHECKPOINT, 150 - this.pulseSize * 10);
      p.strokeWeight(2);
      p.ellipse(0, 0, this.width + this.pulseSize, this.height + this.pulseSize);
    }
    
    p.pop();
  }

  isOffScreen() {
    return this.x + this.width / 2 < 0;
  }
}

export class FinishLine {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = CANVAS_HEIGHT - GROUND_HEIGHT;
    this.type = 'finish';
    this.animation = 0;
  }

  update(scrollSpeed) {
    this.x -= scrollSpeed;
    this.animation = (this.animation + 0.1) % 1;
  }

  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Draw finish pole
    p.fill(220);
    p.stroke(100);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(0, 0, 10, this.height);
    
    // Draw checkered flag
    const squareSize = 15;
    const rows = Math.ceil(this.height / squareSize);
    const offset = this.animation * squareSize;
    
    for (let i = 0; i < rows; i++) {
      const y = -this.height/2 + i * squareSize + offset;
      p.fill((i % 2) === 0 ? 0 : 255);
      p.rect(20, y, 30, squareSize);
    }
    
    p.pop();
  }

  isOffScreen() {
    return this.x + this.width / 2 < 0;
  }
}