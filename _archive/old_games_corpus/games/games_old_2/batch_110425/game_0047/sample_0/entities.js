// entities.js - Game entities (coins, hazards, platforms, exit)

import { gameState } from './globals.js';

export class Coin {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.collected = false;
    this.animationOffset = Math.random() * Math.PI * 2;
    this.rotationSpeed = 0.1;
    this.rotation = 0;
  }

  update(p) {
    if (!this.collected) {
      this.rotation += this.rotationSpeed;
    }
  }

  draw(p, cameraX, cameraY) {
    if (this.collected) return;

    p.push();
    p.translate(-cameraX, -cameraY);
    
    let bobOffset = Math.sin(p.frameCount * 0.05 + this.animationOffset) * 3;
    
    // Outer ring
    p.stroke(255, 200, 0);
    p.strokeWeight(2);
    p.fill(255, 220, 50);
    p.ellipse(this.x, this.y + bobOffset, this.radius * 2, this.radius * 2);
    
    // Inner detail
    p.fill(255, 180, 0);
    p.noStroke();
    p.ellipse(this.x, this.y + bobOffset, this.radius * 1.2, this.radius * 1.2);
    
    // Sparkle
    p.stroke(255, 255, 200);
    p.strokeWeight(2);
    let sparkleSize = 4 + Math.sin(p.frameCount * 0.1 + this.animationOffset) * 2;
    p.line(this.x - sparkleSize, this.y + bobOffset, this.x + sparkleSize, this.y + bobOffset);
    p.line(this.x, this.y + bobOffset - sparkleSize, this.x, this.y + bobOffset + sparkleSize);
    
    p.pop();
  }

  collect() {
    if (!this.collected) {
      this.collected = true;
      gameState.coinsCollected++;
      gameState.score += 100;
      return true;
    }
    return false;
  }
}

export class Spike {
  constructor(x, y, width, pointUp = true) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.pointUp = pointUp;
    this.spikeCount = Math.floor(width / 20);
    this.height = 20;
  }

  draw(p, cameraX, cameraY) {
    p.push();
    p.translate(-cameraX, -cameraY);
    
    p.fill(80, 80, 100);
    p.noStroke();
    
    for (let i = 0; i < this.spikeCount; i++) {
      let spikeX = this.x + (i * this.width / this.spikeCount);
      let spikeWidth = this.width / this.spikeCount;
      
      if (this.pointUp) {
        p.triangle(
          spikeX, this.y,
          spikeX + spikeWidth / 2, this.y - this.height,
          spikeX + spikeWidth, this.y
        );
      } else {
        p.triangle(
          spikeX, this.y,
          spikeX + spikeWidth / 2, this.y + this.height,
          spikeX + spikeWidth, this.y
        );
      }
    }
    
    // Add shine to spikes
    p.fill(100, 100, 120, 100);
    for (let i = 0; i < this.spikeCount; i++) {
      let spikeX = this.x + (i * this.width / this.spikeCount);
      let spikeWidth = this.width / this.spikeCount;
      
      if (this.pointUp) {
        p.triangle(
          spikeX + spikeWidth * 0.25, this.y - 5,
          spikeX + spikeWidth / 2, this.y - this.height,
          spikeX + spikeWidth * 0.4, this.y - 5
        );
      } else {
        p.triangle(
          spikeX + spikeWidth * 0.25, this.y + 5,
          spikeX + spikeWidth / 2, this.y + this.height,
          spikeX + spikeWidth * 0.4, this.y + 5
        );
      }
    }
    
    p.pop();
  }

  checkCollision(player) {
    // Simplified collision check for spikes
    if (player.x + player.radius > this.x && 
        player.x - player.radius < this.x + this.width) {
      if (this.pointUp) {
        if (player.y + player.radius > this.y - this.height && 
            player.y - player.radius < this.y) {
          return true;
        }
      } else {
        if (player.y - player.radius < this.y + this.height && 
            player.y + player.radius > this.y) {
          return true;
        }
      }
    }
    return false;
  }
}

export class Platform {
  constructor(x, y, width, height, movable = false) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.movable = movable;
    this.startX = x;
    this.startY = y;
    this.moveSpeed = 2;
    this.moveRange = 100;
    this.moveDirection = 1;
  }

  update(p) {
    if (this.movable) {
      this.x += this.moveSpeed * this.moveDirection;
      if (Math.abs(this.x - this.startX) > this.moveRange) {
        this.moveDirection *= -1;
      }
    }
  }

  draw(p, cameraX, cameraY) {
    p.push();
    p.translate(-cameraX, -cameraY);
    
    // Platform shadow
    p.fill(0, 0, 0, 30);
    p.noStroke();
    p.rect(this.x + 5, this.y + 5, this.width, this.height, 5);
    
    // Platform gradient
    for (let i = 0; i < this.height; i++) {
      let lerpAmt = i / this.height;
      let c = p.lerpColor(p.color(100, 80, 60), p.color(70, 50, 40), lerpAmt);
      p.fill(c);
      p.noStroke();
      p.rect(this.x, this.y + i, this.width, 1);
    }
    
    // Platform border
    p.noFill();
    p.stroke(50, 40, 30);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Platform details
    p.stroke(120, 100, 80);
    p.strokeWeight(1);
    for (let i = 20; i < this.width; i += 30) {
      p.line(this.x + i, this.y + 5, this.x + i, this.y + this.height - 5);
    }
    
    p.pop();
  }
}

export class ExitPortal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 80;
    this.active = false;
  }

  update(p) {
    this.active = gameState.coinsCollected >= gameState.totalCoins;
  }

  draw(p, cameraX, cameraY) {
    p.push();
    p.translate(-cameraX, -cameraY);
    
    if (this.active) {
      // Active portal - swirling effect
      p.noFill();
      for (let i = 0; i < 5; i++) {
        let offset = (p.frameCount * 0.1 + i * 0.5) % (p.TWO_PI);
        let radius = 20 + i * 5;
        p.stroke(100 + i * 30, 200, 255, 200 - i * 30);
        p.strokeWeight(3);
        p.arc(this.x + this.width / 2, this.y + this.height / 2, 
              radius, radius, offset, offset + p.PI);
      }
      
      // Center glow
      p.fill(150, 220, 255, 150);
      p.noStroke();
      p.ellipse(this.x + this.width / 2, this.y + this.height / 2, 20, 20);
    } else {
      // Inactive portal - gray
      p.fill(100, 100, 100, 100);
      p.stroke(80, 80, 80);
      p.strokeWeight(2);
      p.rect(this.x, this.y, this.width, this.height, 10);
      
      // Lock icon
      p.fill(60, 60, 60);
      p.rect(this.x + this.width / 2 - 8, this.y + this.height / 2 - 5, 16, 12);
      p.ellipse(this.x + this.width / 2, this.y + this.height / 2 - 10, 12, 12);
    }
    
    p.pop();
  }

  checkCollision(player) {
    if (!this.active) return false;
    
    return player.x + player.radius > this.x &&
           player.x - player.radius < this.x + this.width &&
           player.y + player.radius > this.y &&
           player.y - player.radius < this.y + this.height;
  }
}