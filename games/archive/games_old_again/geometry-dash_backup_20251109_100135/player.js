import { GRAVITY, JUMP_FORCE, SHIP_LIFT, GROUND_Y, PLAYER_MODES, BLOCK_SIZE } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.velocityY = 0;
    this.width = BLOCK_SIZE;
    this.height = BLOCK_SIZE;
    this.isJumping = false;
    this.mode = PLAYER_MODES.CUBE;
    this.rotation = 0;
    this.onGround = false;
    this.dead = false;
    this.trail = []; // For particle effects
  }

  jump() {
    if (this.mode === PLAYER_MODES.CUBE) {
      // Cube mode: Only jump when on ground (still one jump per ground touch)
      if (this.onGround && !this.isJumping) {
        this.velocityY = JUMP_FORCE;
        this.isJumping = true;
        this.onGround = false;
      }
    } else if (this.mode === PLAYER_MODES.SHIP) {
      // Ship mode: Continuous lift while key is held
      this.velocityY += SHIP_LIFT;
    }
  }

  update(p) {
    // Apply gravity based on mode
    if (this.mode === PLAYER_MODES.CUBE) {
      this.velocityY += GRAVITY;
    } else if (this.mode === PLAYER_MODES.SHIP) {
      // Ship has less gravity and can fly up
      this.velocityY += GRAVITY * 0.5;
    }

    // Update position
    this.y += this.velocityY;

    // Check ground collision for cube mode
    if (this.mode === PLAYER_MODES.CUBE && this.y >= GROUND_Y - this.height) {
      this.y = GROUND_Y - this.height;
      this.velocityY = 0;
      this.onGround = true;
      this.isJumping = false;
      this.rotation = 0;
    } else {
      this.onGround = false;
      
      // Rotate based on velocity
      if (this.mode === PLAYER_MODES.CUBE) {
        this.rotation += 0.1;
      } else if (this.mode === PLAYER_MODES.SHIP) {
        // Ship rotation follows velocity
        this.rotation = p.map(this.velocityY, -10, 10, -Math.PI/6, Math.PI/6);
      }
    }

    // Limit ship movement to prevent going off-screen
    if (this.mode === PLAYER_MODES.SHIP) {
      if (this.y < 0) {
        this.y = 0;
        this.velocityY = 0;
      }
    }

    // Add trail particles
    if (p.frameCount % 3 === 0) {
      this.trail.push({
        x: this.x,
        y: this.y + this.height / 2,
        alpha: 255,
        size: 5
      });
    }

    // Update trail particles
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].alpha -= 15;
      this.trail[i].size -= 0.2;
      if (this.trail[i].alpha <= 0 || this.trail[i].size <= 0) {
        this.trail.splice(i, 1);
      }
    }
  }

  draw(p, cameraX) {
    p.push();
    
    // Draw trail
    for (const particle of this.trail) {
      p.noStroke();
      p.fill(255, 255, 255, particle.alpha);
      p.ellipse(particle.x - cameraX, particle.y, particle.size, particle.size);
    }

    // Draw player
    p.translate(this.x - cameraX + this.width / 2, this.y + this.height / 2);
    p.rotate(this.rotation);
    
    if (this.mode === PLAYER_MODES.CUBE) {
      p.fill(255, 50, 50);
      p.stroke(255);
      p.strokeWeight(2);
      p.rect(-this.width / 2, -this.height / 2, this.width, this.height);
      
      // Draw face
      p.fill(255);
      p.rect(-this.width / 4, -this.height / 4, this.width / 2, this.height / 2);
    } else if (this.mode === PLAYER_MODES.SHIP) {
      p.fill(50, 50, 255);
      p.stroke(255);
      p.strokeWeight(2);
      
      // Ship shape
      p.beginShape();
      p.vertex(-this.width / 2, 0);
      p.vertex(this.width / 2, -this.height / 3);
      p.vertex(this.width / 2, this.height / 3);
      p.endShape(p.CLOSE);
      
      // Cockpit
      p.fill(200, 200, 255);
      p.ellipse(0, 0, this.width / 3, this.height / 3);
    }
    
    p.pop();
  }

  changeMode(newMode) {
    this.mode = newMode;
    // Reset velocity when changing modes
    this.velocityY = 0;
  }

  die() {
    this.dead = true;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.velocityY = 0;
    this.isJumping = false;
    this.rotation = 0;
    this.onGround = false;
    this.mode = PLAYER_MODES.CUBE;
    this.dead = false;
    this.trail = [];
  }
}