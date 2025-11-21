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
  constructor(levelNumber = 1) {
    this.obstacles = [];
    this.portals = [];
    this.startX = 100;
    this.startY = GROUND_Y - BLOCK_SIZE;
    this.endX = 0;
    this.levelNumber = levelNumber;
    this.generateLevel();
  }

  generateLevel() {
    // Ground platform
    this.obstacles.push(new Obstacle(0, GROUND_Y, 10000, 100, 'block'));
    
    // Generate specific level based on level number
    switch (this.levelNumber) {
      case 1:
        this.generateLevel1();
        break;
      case 2:
        this.generateLevel2();
        break;
      case 3:
        this.generateLevel3();
        break;
      case 4:
        this.generateLevel4();
        break;
      default:
        this.generateLevel1();
    }
  }

  generateLevel1() {
    // Simplified Level 1 - Shorter and easier
    let x = 300;
    
    // Section 1: Just 2 easy spikes instead of 3
    x += 200;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    
    x += 250; // Increased spacing for easier jumps
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    
    // Section 2: One simple platform
    x += 200;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE * 2, BLOCK_SIZE * 2, BLOCK_SIZE * 2, 'block'));
    
    // Ship portal - earlier in the level
    x += 200;
    this.portals.push(new Portal(x, GROUND_Y - BLOCK_SIZE * 3, PLAYER_MODES.SHIP));
    
    // Section 3: Simplified ship section - just one ceiling obstacle
    x += 150;
    this.obstacles.push(new Obstacle(x, 0, BLOCK_SIZE * 3, BLOCK_SIZE * 2, 'ceiling'));
    
    // Just a few ground spikes for ship section - reduced from 12 to 4
    x += -100;
    for (let i = 0; i < 4; i++) {
      this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
      x += BLOCK_SIZE * 3; // Even more spacing for easier navigation
    }
    
    // Back to cube portal
    x += 150;
    this.portals.push(new Portal(x, GROUND_Y - BLOCK_SIZE * 3, PLAYER_MODES.CUBE));
    
    // Final section: Just one spike
    x += 200;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    
    // End much sooner
    x += 200;
    this.endX = x + 100;
    this.length = this.endX + 200;
  }

  generateLevel2() {
    // Level 2 - More platforms and longer ship section
    let x = 300;
    
    // Section 1: Staircase of platforms
    for (let i = 0; i < 4; i++) {
      x += 120;
      this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE * (i + 1), BLOCK_SIZE * 2, BLOCK_SIZE, 'block'));
    }
    
    // Section 2: Spike valley - increased spacing from 100 to 160
    x += 150;
    for (let i = 0; i < 5; i++) {
      x += 160;
      this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    }
    
    // High platform
    x += 150;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE * 4, BLOCK_SIZE * 4, BLOCK_SIZE, 'block'));
    
    // Ship portal
    x += 200;
    this.portals.push(new Portal(x, GROUND_Y - BLOCK_SIZE * 3, PLAYER_MODES.SHIP));
    
    // Section 3: Ship corridor with alternating obstacles
    x += 150;
    this.obstacles.push(new Obstacle(x, 0, BLOCK_SIZE * 3, BLOCK_SIZE * 2, 'ceiling'));
    
    x += 200;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE * 3, BLOCK_SIZE * 3, BLOCK_SIZE, 'block'));
    
    x += 200;
    this.obstacles.push(new Obstacle(x, 0, BLOCK_SIZE * 4, BLOCK_SIZE * 3, 'ceiling'));
    
    x += 250;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE * 4, BLOCK_SIZE * 2, BLOCK_SIZE, 'block'));
    
    x += 200;
    this.obstacles.push(new Obstacle(x, 0, BLOCK_SIZE * 3, BLOCK_SIZE * 2, 'ceiling'));
    
    // Back to cube portal
    x += 250;
    this.portals.push(new Portal(x, GROUND_Y - BLOCK_SIZE * 3, PLAYER_MODES.CUBE));
    
    // Section 4: Final cube challenges
    x += 150;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    
    x += 180;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE * 3, BLOCK_SIZE * 2, BLOCK_SIZE * 3, 'block'));
    
    x += 150;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    
    x += 200;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    
    x += 200;
    this.endX = x + 100;
    this.length = this.endX + 200;
  }

  generateLevel3() {
    // Level 3 - Rapid transitions and tight spaces
    let x = 300;
    
    // Section 1: Quick spike gauntlet - increased spacing from 120 to 160
    for (let i = 0; i < 6; i++) {
      x += 160;
      this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    }
    
    // Platform rest area
    x += 150;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE * 2, BLOCK_SIZE * 3, BLOCK_SIZE * 2, 'block'));
    
    // Ship portal
    x += 180;
    this.portals.push(new Portal(x, GROUND_Y - BLOCK_SIZE * 3, PLAYER_MODES.SHIP));
    
    // Section 2: Tight ship corridor
    x += 120;
    this.obstacles.push(new Obstacle(x, 0, BLOCK_SIZE * 6, BLOCK_SIZE * 2, 'ceiling'));
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE * 5, BLOCK_SIZE * 6, BLOCK_SIZE, 'block'));
    
    x += 300;
    this.obstacles.push(new Obstacle(x, 0, BLOCK_SIZE * 4, BLOCK_SIZE * 3, 'ceiling'));
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE * 4, BLOCK_SIZE * 4, BLOCK_SIZE, 'block'));
    
    // Back to cube
    x += 250;
    this.portals.push(new Portal(x, GROUND_Y - BLOCK_SIZE * 3, PLAYER_MODES.CUBE));
    
    // Section 3: Platform jumps
    x += 150;
    for (let i = 0; i < 3; i++) {
      x += 140;
      this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE * 2, BLOCK_SIZE * 2, BLOCK_SIZE * 2, 'block'));
    }
    
    // Ship portal again
    x += 200;
    this.portals.push(new Portal(x, GROUND_Y - BLOCK_SIZE * 3, PLAYER_MODES.SHIP));
    
    // Final ship section
    x += 150;
    this.obstacles.push(new Obstacle(x, 0, BLOCK_SIZE * 5, BLOCK_SIZE * 2, 'ceiling'));
    
    x += 250;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE * 3, BLOCK_SIZE * 3, BLOCK_SIZE, 'block'));
    
    // Back to cube for finish
    x += 200;
    this.portals.push(new Portal(x, GROUND_Y - BLOCK_SIZE * 3, PLAYER_MODES.CUBE));
    
    x += 200;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    
    x += 200;
    this.endX = x + 100;
    this.length = this.endX + 200;
  }

  generateLevel4() {
    // Level 4 - Ultimate challenge combining all mechanics
    let x = 300;
    
    // Section 1: Platform parkour
    for (let i = 0; i < 5; i++) {
      x += 130;
      let height = (i % 2 === 0) ? BLOCK_SIZE * 2 : BLOCK_SIZE * 3;
      this.obstacles.push(new Obstacle(x, GROUND_Y - height, BLOCK_SIZE * 2, BLOCK_SIZE, 'block'));
    }
    
    // Spike trap - increased spacing from BLOCK_SIZE * 2 (60) to 160
    x += 150;
    for (let i = 0; i < 3; i++) {
      x += 160;
      this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    }
    
    // Ship portal
    x += 180;
    this.portals.push(new Portal(x, GROUND_Y - BLOCK_SIZE * 3, PLAYER_MODES.SHIP));
    
    // Section 2: Complex ship maze
    x += 150;
    this.obstacles.push(new Obstacle(x, 0, BLOCK_SIZE * 4, BLOCK_SIZE * 2, 'ceiling'));
    
    x += 220;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE * 5, BLOCK_SIZE * 4, BLOCK_SIZE, 'block'));
    
    x += 220;
    this.obstacles.push(new Obstacle(x, 0, BLOCK_SIZE * 5, BLOCK_SIZE * 3, 'ceiling'));
    
    x += 250;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE * 4, BLOCK_SIZE * 3, BLOCK_SIZE, 'block'));
    
    x += 200;
    this.obstacles.push(new Obstacle(x, 0, BLOCK_SIZE * 3, BLOCK_SIZE * 2, 'ceiling'));
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE * 6, BLOCK_SIZE * 3, BLOCK_SIZE, 'block'));
    
    // Back to cube
    x += 250;
    this.portals.push(new Portal(x, GROUND_Y - BLOCK_SIZE * 3, PLAYER_MODES.CUBE));
    
    // Section 3: Mixed obstacles
    x += 150;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    
    x += 120;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE * 3, BLOCK_SIZE * 2, BLOCK_SIZE * 3, 'block'));
    
    x += 140;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    
    x += 140;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE * 4, BLOCK_SIZE * 3, BLOCK_SIZE, 'block'));
    
    // Ship portal for final section
    x += 180;
    this.portals.push(new Portal(x, GROUND_Y - BLOCK_SIZE * 3, PLAYER_MODES.SHIP));
    
    // Final ship gauntlet
    x += 150;
    this.obstacles.push(new Obstacle(x, 0, BLOCK_SIZE * 6, BLOCK_SIZE * 2, 'ceiling'));
    
    x += 280;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE * 4, BLOCK_SIZE * 4, BLOCK_SIZE, 'block'));
    
    x += 250;
    this.obstacles.push(new Obstacle(x, 0, BLOCK_SIZE * 4, BLOCK_SIZE * 3, 'ceiling'));
    
    // Final cube section
    x += 280;
    this.portals.push(new Portal(x, GROUND_Y - BLOCK_SIZE * 3, PLAYER_MODES.CUBE));
    
    x += 150;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    
    x += 150;
    this.obstacles.push(new Obstacle(x, GROUND_Y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 'spike'));
    
    x += 200;
    this.endX = x + 100;
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