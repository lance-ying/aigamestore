import { GROUND_Y, BLOCK_SIZE, PLAYER_MODES, CANVAS_HEIGHT } from './globals.js';

export class Obstacle {
  constructor(x, y, width, height, type = 'block') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // 'block', 'spike', 'ceiling'
  }

  draw(p, cameraX) {
    p.push();
    if (this.type === 'block') {
      p.fill(100, 100, 100);
      p.stroke(50);
      p.strokeWeight(2);
      p.rect(this.x - cameraX, this.y, this.width, this.height);
    } else if (this.type === 'spike') {
      p.fill(200, 50, 50);
      p.stroke(255);
      p.strokeWeight(2);
      p.triangle(
        this.x - cameraX, this.y + this.height,
        this.x - cameraX + this.width / 2, this.y,
        this.x - cameraX + this.width, this.y + this.height
      );
    } else if (this.type === 'ceiling') {
      p.fill(100, 100, 100);
      p.stroke(50);
      p.strokeWeight(2);
      p.rect(this.x - cameraX, this.y, this.width, this.height);
      
      // Add spikes to ceiling
      p.fill(200, 50, 50);
      p.stroke(255);
      for (let i = 0; i < this.width; i += BLOCK_SIZE) {
        p.triangle(
          this.x - cameraX + i, this.y + this.height,
          this.x - cameraX + i + BLOCK_SIZE / 2, this.y + this.height - BLOCK_SIZE,
          this.x - cameraX + i + BLOCK_SIZE, this.y + this.height
        );
      }
    }
    p.pop();
  }
}

export class Portal {
  constructor(x, y, targetMode) {
    this.x = x;
    this.y = y;
    this.width = BLOCK_SIZE;
    this.height = BLOCK_SIZE * 2;
    this.targetMode = targetMode;
    this.particles = [];
    this.color = targetMode === PLAYER_MODES.CUBE ? [255, 50, 50] : [50, 50, 255];

    // Make cube (red) portals span the full screen height to prevent skipping
    if (this.targetMode === PLAYER_MODES.CUBE) {
      this.y = 0;
      this.height = CANVAS_HEIGHT;
    }
  }

  update(p) {
    // Add particles
    if (p.frameCount % 5 === 0) {
      this.particles.push({
        x: this.x + p.random(this.width),
        y: this.y + p.random(this.height),
        vx: p.random(-1, 1),
        vy: p.random(-2, -1),
        alpha: 255,
        size: p.random(3, 8)
      });
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.alpha -= 5;
      if (particle.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(p, cameraX) {
    p.push();
    
    // Draw particles
    for (const particle of this.particles) {
      p.noStroke();
      p.fill(this.color[0], this.color[1], this.color[2], particle.alpha);
      p.ellipse(particle.x - cameraX, particle.y, particle.size, particle.size);
    }
    
    // Draw portal
    p.noFill();
    p.strokeWeight(3);
    p.stroke(this.color[0], this.color[1], this.color[2]);
    p.rect(this.x - cameraX, this.y, this.width, this.height, 10);
    
    // Inner glow
    p.noStroke();
    p.fill(this.color[0], this.color[1], this.color[2], 100);
    p.rect(this.x - cameraX + 5, this.y + 5, this.width - 10, this.height - 10, 5);
    
    p.pop();
  }
}

export class Level {
  constructor() {
    this.obstacles = [];
    this.portals = [];
    this.startX = 100;
    this.startY = GROUND_Y - BLOCK_SIZE;
    this.endX = 0;
    this.generateLevel();
  }

  generateLevel() {
    // Ground platform
    this.obstacles.push(new Obstacle(0, GROUND_Y, 10000, 100, 'block'));
    
    let x = 300; // Start position for obstacles
    
    // Section 1: Basic jumps
    for (let i = 0; i < 3; i++) {
      x += 150;
      this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    }
    
    // Section 2: Platforms and gaps
    x += 200;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE * 2, BLOCK_SIZE * 3, BLOCK_SIZE * 2, 'block'));
    
    x += 200;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE * 3, BLOCK_SIZE * 2, BLOCK_SIZE * 3, 'block'));
    
    x += 150;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    
    // Ship portal
    x += 150;
    this.portals.push(new Portal(x, GROUND_Y - BLOCK_SIZE * 3, PLAYER_MODES.SHIP));
    
    // Section 3: Ship mode with ceiling obstacles
    x += 150;
    this.obstacles.push(new Obstacle(x, 0, BLOCK_SIZE * 5, BLOCK_SIZE * 3, 'ceiling'));
    
    x += 250;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE * 4, BLOCK_SIZE * 2, BLOCK_SIZE, 'block'));
    
    x += 200;
    this.obstacles.push(new Obstacle(x, 0, BLOCK_SIZE * 3, BLOCK_SIZE * 2, 'ceiling'));
    
    // Add spikes after the blue portal but before the red portal
    x += -400; // Move x position past the last ceiling obstacle
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += BLOCK_SIZE;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    
    // Back to cube portal
    x += 200;
    this.portals.push(new Portal(x, GROUND_Y - BLOCK_SIZE * 3, PLAYER_MODES.CUBE));
    
    // Section 4: Advanced jumps
    x += 200;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += 200;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += 200;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE * 2, BLOCK_SIZE * 3, BLOCK_SIZE * 2, 'block'));
    
    // Final section
    x += 200;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    x += 200;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    
    // Finish line
    x += 200;
    this.endX = x + 100;
    
    // Set level length
    this.length = this.endX + 200;
  }

  draw(p, cameraX) {
    // Draw background
    p.background(50, 50, 80);
    
    // Draw grid
    p.stroke(70, 70, 100, 100);
    p.strokeWeight(1);
    for (let i = 0; i < 20; i++) {
      let gridX = (Math.floor(cameraX / 100) * 100) + (i * 100);
      p.line(gridX - cameraX, 0, gridX - cameraX, GROUND_Y);
    }
    
    // Draw ground
    for (const obstacle of this.obstacles) {
      // Only draw obstacles that are visible
      if (obstacle.x + obstacle.width > cameraX && obstacle.x < cameraX + p.width) {
        obstacle.draw(p, cameraX);
      }
    }
    
    // Draw portals
    for (const portal of this.portals) {
      // Only draw portals that are visible
      if (portal.x + portal.width > cameraX && portal.x < cameraX + p.width) {
        portal.update(p);
        portal.draw(p, cameraX);
      }
    }
    
    // Draw finish line
    if (this.endX > cameraX - 100 && this.endX < cameraX + p.width + 100) {
      p.push();
      p.stroke(255, 255, 0);
      p.strokeWeight(5);
      p.line(this.endX - cameraX, 0, this.endX - cameraX, GROUND_Y);
      
      // Finish flag
      p.fill(255, 255, 0);
      p.noStroke();
      p.rect(this.endX - cameraX + 5, 50, 40, 30);
      p.pop();
    }
  }
}