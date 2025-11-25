// entities.js - Game entities and objects
import { GRAVITY, CANVAS_HEIGHT } from './globals.js';

export class Box {
  constructor(x, y, width = 30, height = 30) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = 'box';
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
  }

  push(direction, force, obstacles) {
    this.vx = direction * Math.abs(force) * 0.5;
  }

  update(obstacles) {
    // Apply gravity
    this.vy += GRAVITY;
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Friction
    this.vx *= 0.8;
    
    // Collision with obstacles
    this.onGround = false;
    for (let obs of obstacles) {
      if (this.checkCollision(obs)) {
        this.resolveCollision(obs);
      }
    }
    
    // Ground collision
    if (this.y > CANVAS_HEIGHT - this.height) {
      this.y = CANVAS_HEIGHT - this.height;
      this.vy = 0;
      this.onGround = true;
    }
    
    if (this.vy > 15) this.vy = 15;
  }

  checkCollision(obs) {
    return this.x < obs.x + obs.width &&
           this.x + this.width > obs.x &&
           this.y < obs.y + obs.height &&
           this.y + this.height > obs.y;
  }

  resolveCollision(obs) {
    const overlapLeft = (this.x + this.width) - obs.x;
    const overlapRight = (obs.x + obs.width) - this.x;
    const overlapTop = (this.y + this.height) - obs.y;
    const overlapBottom = (obs.y + obs.height) - this.y;

    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

    if (minOverlap === overlapTop && this.vy > 0) {
      this.y = obs.y - this.height;
      this.vy = 0;
      this.onGround = true;
    } else if (minOverlap === overlapBottom && this.vy < 0) {
      this.y = obs.y + obs.height;
      this.vy = 0;
    } else if (minOverlap === overlapLeft) {
      this.x = obs.x - this.width;
      this.vx = 0;
    } else if (minOverlap === overlapRight) {
      this.x = obs.x + obs.width;
      this.vx = 0;
    }
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    
    p.push();
    p.fill(80, 70, 60);
    p.stroke(60, 50, 40);
    p.strokeWeight(2);
    p.rect(screenX, this.y, this.width, this.height, 2);
    
    // Texture lines
    p.stroke(100, 90, 80);
    p.strokeWeight(1);
    p.line(screenX + 5, this.y + 5, screenX + this.width - 5, this.y + 5);
    p.line(screenX + 5, this.y + this.height / 2, screenX + this.width - 5, this.y + this.height / 2);
    p.line(screenX + 5, this.y + this.height - 5, screenX + this.width - 5, this.y + this.height - 5);
    
    p.pop();
  }
}

export class Spike {
  constructor(x, y, width = 30) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = 15;
    this.type = 'spike';
  }

  checkCollision(player) {
    return player.x < this.x + this.width &&
           player.x + player.width > this.x &&
           player.y < this.y + this.height &&
           player.y + player.height > this.y;
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    p.push();
    p.fill(120, 30, 30);
    p.stroke(80, 20, 20);
    p.strokeWeight(1);
    
    const numSpikes = Math.floor(this.width / 10);
    for (let i = 0; i < numSpikes; i++) {
      const x1 = screenX + i * 10;
      const x2 = screenX + i * 10 + 5;
      const x3 = screenX + i * 10 + 10;
      p.triangle(x1, this.y + this.height, x2, this.y, x3, this.y + this.height);
    }
    p.pop();
  }
}

export class Pit {
  constructor(x, width = 80) {
    this.x = x;
    this.y = CANVAS_HEIGHT - 50;
    this.width = width;
    this.height = 50;
    this.type = 'pit';
  }

  checkCollision(player) {
    return player.y + player.height > this.y &&
           player.x + player.width > this.x &&
           player.x < this.x + this.width;
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    p.push();
    p.fill(10, 10, 15);
    p.noStroke();
    p.rect(screenX, this.y, this.width, this.height);
    
    // Danger gradient
    for (let i = 0; i < 5; i++) {
      p.stroke(20 + i * 10, 10, 10, 150 - i * 30);
      p.line(screenX, this.y + i * 2, screenX + this.width, this.y + i * 2);
    }
    p.pop();
  }
}

export class Switch {
  constructor(x, y, id) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 30;
    this.type = 'switch';
    this.id = id;
    this.activated = false;
  }

  activate() {
    this.activated = true;
  }

  checkPlayerNear(player) {
    return Math.abs(player.x + player.width / 2 - (this.x + this.width / 2)) < 30 &&
           Math.abs(player.y - this.y) < 40;
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    p.push();
    
    // Base
    p.fill(60, 60, 70);
    p.stroke(40, 40, 50);
    p.strokeWeight(2);
    p.rect(screenX, this.y + 15, this.width, 15, 2);
    
    // Lever
    const leverAngle = this.activated ? 0.5 : -0.5;
    p.stroke(this.activated ? 50 : 100, this.activated ? 150 : 50, 50);
    p.strokeWeight(4);
    p.line(screenX + this.width / 2, this.y + 15,
           screenX + this.width / 2 + Math.cos(leverAngle) * 12,
           this.y + 15 + Math.sin(leverAngle) * 12);
    
    // Light
    p.fill(this.activated ? 50 : 100, this.activated ? 255 : 50, this.activated ? 50 : 50);
    p.noStroke();
    p.ellipse(screenX + this.width / 2, this.y + 5, 8, 8);
    
    p.pop();
  }
}

export class Door {
  constructor(x, y, switchId, width = 20, height = 80) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = 'door';
    this.switchId = switchId;
    this.open = false;
    this.openProgress = 0;
  }

  update() {
    if (this.open && this.openProgress < 1) {
      this.openProgress += 0.05;
    }
  }

  setOpen(isOpen) {
    this.open = isOpen;
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    const currentHeight = this.height * (1 - this.openProgress);
    
    if (currentHeight > 0) {
      p.push();
      p.fill(40, 40, 50);
      p.stroke(30, 30, 40);
      p.strokeWeight(2);
      p.rect(screenX, this.y + this.height - currentHeight, this.width, currentHeight);
      
      // Grid pattern
      p.stroke(60, 60, 70);
      p.strokeWeight(1);
      for (let i = 0; i < currentHeight; i += 10) {
        p.line(screenX, this.y + this.height - i, screenX + this.width, this.y + this.height - i);
      }
      p.pop();
    }
  }

  isBlocking() {
    return !this.open || this.openProgress < 0.8;
  }
}

export class ExitPortal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 60;
    this.type = 'exit';
    this.animationOffset = 0;
  }

  update() {
    this.animationOffset += 0.1;
  }

  checkCollision(player) {
    return player.x < this.x + this.width &&
           player.x + player.width > this.x &&
           player.y < this.y + this.height &&
           player.y + player.height > this.y;
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    
    p.push();
    
    // Outer glow
    for (let i = 3; i > 0; i--) {
      p.fill(100, 200, 255, 30);
      p.noStroke();
      p.rect(screenX - i * 5, this.y - i * 5, 
             this.width + i * 10, this.height + i * 10, 5);
    }
    
    // Portal frame
    p.stroke(80, 150, 200);
    p.strokeWeight(3);
    p.noFill();
    p.rect(screenX, this.y, this.width, this.height, 5);
    
    // Animated energy
    for (let i = 0; i < 5; i++) {
      const yPos = this.y + ((i * 15 + this.animationOffset * 20) % this.height);
      p.stroke(150, 220, 255, 200);
      p.strokeWeight(2);
      p.line(screenX + 5, yPos, screenX + this.width - 5, yPos);
    }
    
    // Center glow
    p.fill(150, 220, 255, 100);
    p.noStroke();
    p.rect(screenX + 5, this.y + 5, this.width - 10, this.height - 10);
    
    p.pop();
  }
}

export class Surveillance {
  constructor(x, y, range = 150, direction = 1) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 20;
    this.type = 'surveillance';
    this.range = range;
    this.direction = direction;
    this.scanAngle = 0;
    this.detected = false;
  }

  update(player) {
    this.scanAngle += 0.02;
    
    // Check if player is in detection cone
    const dx = player.x + player.width / 2 - this.x;
    const dy = player.y + player.height / 2 - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    const coneAngle = this.scanAngle * this.direction;
    const angleDiff = Math.abs(angle - coneAngle);
    
    this.detected = distance < this.range && angleDiff < 0.5;
    
    return this.detected;
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    
    p.push();
    
    // Detection cone
    if (this.detected) {
      p.fill(255, 50, 50, 50);
    } else {
      p.fill(255, 255, 100, 30);
    }
    p.noStroke();
    const coneAngle = this.scanAngle * this.direction;
    p.arc(screenX, this.y, this.range * 2, this.range * 2, 
          coneAngle - 0.5, coneAngle + 0.5, p.PIE);
    
    // Camera body
    p.fill(50, 50, 60);
    p.stroke(30, 30, 40);
    p.strokeWeight(2);
    p.rect(screenX - this.width / 2, this.y - this.height / 2, 
           this.width, this.height, 3);
    
    // Lens
    p.fill(this.detected ? 255 : 100, this.detected ? 50 : 50, 50);
    p.noStroke();
    p.ellipse(screenX, this.y, 12, 12);
    
    // Light indicator
    if (this.detected) {
      p.fill(255, 0, 0);
      p.ellipse(screenX - 8, this.y - 5, 4, 4);
    }
    
    p.pop();
  }
}

export class Platform {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = 'platform';
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    p.push();
    p.fill(45, 45, 55);
    p.stroke(35, 35, 45);
    p.strokeWeight(2);
    p.rect(screenX, this.y, this.width, this.height);
    
    // Texture
    p.stroke(55, 55, 65);
    p.strokeWeight(1);
    for (let i = 0; i < this.width; i += 20) {
      p.line(screenX + i, this.y, screenX + i, this.y + this.height);
    }
    p.pop();
  }
}