// entities.js - Game entity classes

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(p, x, y, value = 5) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.value = value;
    this.width = 50;
    this.height = 50;
    this.speed = 5;
    this.prevValue = value;
    this.animationTimer = 0;
  }

  update() {
    // Handle horizontal movement
    if (gameState.controlMode === "HUMAN") {
      if (this.p.keyIsDown(37) || this.p.keyIsDown(65)) { // LEFT or A
        this.x -= this.speed;
      }
      if (this.p.keyIsDown(39) || this.p.keyIsDown(68)) { // RIGHT or D
        this.x += this.speed;
      }
    }

    // Keep player in bounds
    this.x = this.p.constrain(this.x, this.width / 2, CANVAS_WIDTH - this.width / 2);

    // Update animation timer
    if (this.animationTimer > 0) {
      this.animationTimer--;
    }
  }

  draw() {
    this.p.push();
    
    // Color based on value
    let fillColor;
    if (this.value < 50) {
      fillColor = [100, 220, 100];
    } else if (this.value < 150) {
      fillColor = [100, 150, 255];
    } else if (this.value < 300) {
      fillColor = [255, 200, 100];
    } else {
      fillColor = [255, 100, 220];
    }
    
    this.p.fill(...fillColor);
    this.p.stroke(0);
    this.p.strokeWeight(3);
    this.p.rectMode(this.p.CENTER);
    
    // Animation effect
    let scale = 1;
    if (this.animationTimer > 0) {
      scale = 1 + 0.3 * (this.animationTimer / 10);
    }
    
    this.p.rect(this.x, this.y, this.width * scale, this.height * scale, 5);
    
    // Draw value
    this.p.fill(0);
    this.p.noStroke();
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(24 * scale);
    this.p.text(this.value, this.x, this.y);
    
    this.p.pop();
  }

  absorb(numberBlock) {
    this.prevValue = this.value;
    this.value += numberBlock.value;
    this.animationTimer = 10;
    gameState.score += numberBlock.value;
  }

  getBounds() {
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2
    };
  }
}

export class NumberBlock {
  constructor(p, x, y, value) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.value = value;
    this.width = 35;
    this.height = 35;
    this.alive = true;
    this.fadeOut = 0;
  }

  update(scrollSpeed) {
    this.y += scrollSpeed;
  }

  draw() {
    if (!this.alive && this.fadeOut <= 0) return;
    
    this.p.push();
    
    let alpha = 255;
    if (this.fadeOut > 0) {
      alpha = this.p.map(this.fadeOut, 10, 0, 255, 0);
      this.fadeOut--;
    }
    
    this.p.fill(200, 180, 255, alpha);
    this.p.stroke(100, 80, 150, alpha);
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(this.x, this.y, this.width, this.height, 3);
    
    this.p.fill(0, 0, 0, alpha);
    this.p.noStroke();
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(16);
    this.p.text(this.value, this.x, this.y);
    
    this.p.pop();
  }

  getBounds() {
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2
    };
  }

  startFadeOut() {
    this.alive = false;
    this.fadeOut = 10;
  }
}

export class ElectricSaw {
  constructor(p, x, y, radius, moveSpeed, moveRange) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.startX = x;
    this.radius = radius;
    this.moveSpeed = moveSpeed;
    this.moveRange = moveRange;
    this.moveDirection = 1;
    this.rotation = 0;
    this.alive = true;
  }

  update(scrollSpeed) {
    this.y += scrollSpeed;
    
    // Horizontal movement
    this.x += this.moveSpeed * this.moveDirection;
    if (this.x > this.startX + this.moveRange / 2) {
      this.moveDirection = -1;
    } else if (this.x < this.startX - this.moveRange / 2) {
      this.moveDirection = 1;
    }
    
    // Update scroll position of start point
    this.startX += scrollSpeed * 0; // Keep relative to scrolling
    
    this.rotation += 0.2;
  }

  draw() {
    if (!this.alive) return;
    
    this.p.push();
    this.p.translate(this.x, this.y);
    this.p.rotate(this.rotation);
    
    // Outer circle
    this.p.fill(200, 50, 50);
    this.p.stroke(150, 30, 30);
    this.p.strokeWeight(2);
    this.p.circle(0, 0, this.radius * 2);
    
    // Teeth
    this.p.fill(180, 40, 40);
    this.p.noStroke();
    for (let i = 0; i < 8; i++) {
      let angle = (this.p.TWO_PI / 8) * i;
      let x1 = this.p.cos(angle) * this.radius;
      let y1 = this.p.sin(angle) * this.radius;
      let x2 = this.p.cos(angle + this.p.PI / 8) * (this.radius + 5);
      let y2 = this.p.sin(angle + this.p.PI / 8) * (this.radius + 5);
      let x3 = this.p.cos(angle + this.p.PI / 4) * this.radius;
      let y3 = this.p.sin(angle + this.p.PI / 4) * this.radius;
      this.p.triangle(x1, y1, x2, y2, x3, y3);
    }
    
    // Center
    this.p.fill(100, 20, 20);
    this.p.circle(0, 0, this.radius * 0.4);
    
    this.p.pop();
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      radius: this.radius
    };
  }
}

export class Ditch {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.alive = true;
  }

  update(scrollSpeed) {
    this.y += scrollSpeed;
  }

  draw() {
    if (!this.alive) return;
    
    this.p.push();
    
    // Warning outline
    this.p.fill(40, 40, 40);
    this.p.stroke(255, 200, 0);
    this.p.strokeWeight(3);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(this.x, this.y, this.width, this.height);
    
    // Inner darkness
    this.p.fill(20, 20, 20);
    this.p.noStroke();
    this.p.rect(this.x, this.y, this.width - 6, this.height - 6);
    
    this.p.pop();
  }

  getBounds() {
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2
    };
  }
}

export class Wall {
  constructor(p, x, y, value, index) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.value = value;
    this.index = index;
    this.width = 100;
    this.height = 150;
    this.broken = false;
    this.failed = false;
    this.shakeX = 0;
    this.shakeY = 0;
    this.particles = [];
  }

  update() {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.5; // gravity
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
    
    if ((this.broken || this.failed) && this.particles.length === 0) {
      // Can be removed
    }
  }

  draw() {
    this.p.push();
    
    if (!this.broken && !this.failed) {
      this.p.translate(this.shakeX, this.shakeY);
      
      // Wall body
      this.p.fill(120, 100, 80);
      this.p.stroke(80, 60, 40);
      this.p.strokeWeight(3);
      this.p.rectMode(this.p.CENTER);
      this.p.rect(this.x, this.y, this.width, this.height, 5);
      
      // Brick pattern
      this.p.stroke(100, 80, 60);
      this.p.strokeWeight(2);
      for (let i = 0; i < 5; i++) {
        let yPos = this.y - this.height / 2 + (i * this.height / 5);
        this.p.line(this.x - this.width / 2, yPos, this.x + this.width / 2, yPos);
      }
      
      // Value
      this.p.fill(255, 220, 100);
      this.p.noStroke();
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.textSize(32);
      this.p.text(this.value, this.x, this.y);
    } else if (this.failed) {
      // Draw faded wall for failed attempts
      this.p.fill(80, 60, 50, 100);
      this.p.stroke(60, 40, 30, 100);
      this.p.strokeWeight(3);
      this.p.rectMode(this.p.CENTER);
      this.p.rect(this.x, this.y, this.width, this.height, 5);
      
      // X mark
      this.p.stroke(255, 100, 100, 150);
      this.p.strokeWeight(8);
      this.p.line(this.x - 30, this.y - 30, this.x + 30, this.y + 30);
      this.p.line(this.x + 30, this.y - 30, this.x - 30, this.y + 30);
    }
    
    // Draw particles
    for (let particle of this.particles) {
      this.p.fill(120, 100, 80, particle.life * 255 / 30);
      this.p.noStroke();
      this.p.rect(particle.x, particle.y, particle.size, particle.size);
    }
    
    this.p.pop();
  }

  break() {
    this.broken = true;
    
    // Create particles
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: this.x + this.p.random(-this.width / 2, this.width / 2),
        y: this.y + this.p.random(-this.height / 2, this.height / 2),
        vx: this.p.random(-5, 5),
        vy: this.p.random(-8, -2),
        size: this.p.random(5, 15),
        life: 30
      });
    }
  }

  fail() {
    this.failed = true;
  }

  shake() {
    this.shakeX = this.p.random(-5, 5);
    this.shakeY = this.p.random(-5, 5);
  }
}