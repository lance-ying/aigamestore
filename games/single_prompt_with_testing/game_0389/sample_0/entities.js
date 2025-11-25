// entities.js - Game entities
import { gameState, CANVAS_HEIGHT, GRAVITY } from './globals.js';

export class Platform {
  constructor(x, y, width, height, type = 'normal') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // normal, fragile, moving
    this.vy = 0;
    this.moveRange = 100;
    this.moveSpeed = 1;
    this.startY = y;
  }

  update() {
    if (this.type === 'moving') {
      this.y += this.moveSpeed;
      if (this.y > this.startY + this.moveRange || this.y < this.startY - this.moveRange) {
        this.moveSpeed *= -1;
      }
    }
  }

  draw(p, cameraX) {
    const screenX = this.x - cameraX;
    p.push();
    
    if (this.type === 'normal') {
      p.fill(80, 80, 90);
      p.stroke(60, 60, 70);
    } else if (this.type === 'moving') {
      p.fill(120, 80, 150);
      p.stroke(90, 60, 120);
    }
    
    p.strokeWeight(2);
    p.rect(screenX, this.y, this.width, this.height, 2);
    
    // Add texture
    p.stroke(100, 100, 110);
    p.strokeWeight(1);
    for (let i = 0; i < this.width; i += 20) {
      p.line(screenX + i, this.y, screenX + i, this.y + this.height);
    }
    
    p.pop();
  }
}

export class MovableObject {
  constructor(p, x, y, radius, type = 'block') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = radius;
    this.type = type;
    this.grounded = false;
    this.rotation = 0;
    this.rotationSpeed = 0;
  }

  update() {
    const p = this.p;
    
    // Apply gravity if not grabbed
    if (gameState.grabbedObject !== this) {
      this.vy += GRAVITY * 0.8;
      if (this.vy > 12) this.vy = 12;
    }

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Friction
    this.vx *= 0.95;

    // Check platform collisions
    this.grounded = false;
    for (let platform of gameState.platforms) {
      if (this.checkPlatformCollision(platform)) {
        this.grounded = true;
      }
    }

    // Check other object collisions
    for (let obj of gameState.movableObjects) {
      if (obj !== this) {
        const dist = p.dist(this.x, this.y, obj.x, obj.y);
        if (dist < this.radius + obj.radius) {
          const angle = p.atan2(this.y - obj.y, this.x - obj.x);
          const overlap = (this.radius + obj.radius) - dist;
          this.x += p.cos(angle) * overlap * 0.5;
          this.y += p.sin(angle) * overlap * 0.5;
          obj.x -= p.cos(angle) * overlap * 0.5;
          obj.y -= p.sin(angle) * overlap * 0.5;
        }
      }
    }

    // Boundary checks
    if (this.x < this.radius) {
      this.x = this.radius;
      this.vx *= -0.5;
    }
    if (this.x > gameState.levelWidth - this.radius) {
      this.x = gameState.levelWidth - this.radius;
      this.vx *= -0.5;
    }

    // Death by falling
    if (this.y > CANVAS_HEIGHT + 100) {
      this.y = -50; // Respawn at top
      this.vy = 0;
    }

    // Rotation
    this.rotation += this.rotationSpeed;
    this.rotationSpeed *= 0.95;
  }

  checkPlatformCollision(platform) {
    const p = this.p;
    
    // Simple circle-rect collision
    const closestX = p.constrain(this.x, platform.x, platform.x + platform.width);
    const closestY = p.constrain(this.y, platform.y, platform.y + platform.height);
    
    const dist = p.dist(this.x, this.y, closestX, closestY);
    
    if (dist < this.radius) {
      // Collision response
      const angle = p.atan2(this.y - closestY, this.x - closestX);
      const overlap = this.radius - dist;
      this.x += p.cos(angle) * overlap;
      this.y += p.sin(angle) * overlap;
      
      // If on top, stop falling
      if (this.vy > 0 && this.y < platform.y) {
        this.vy = 0;
        this.y = platform.y - this.radius;
        this.vx *= 0.8; // Rolling friction
        this.rotationSpeed = this.vx * 0.1;
        return true;
      } else {
        this.vx *= 0.5;
        this.vy *= 0.5;
      }
    }
    
    return false;
  }

  draw(cameraX) {
    const p = this.p;
    const screenX = this.x - cameraX;
    
    p.push();
    p.translate(screenX, this.y);
    p.rotate(this.rotation);
    
    if (this.type === 'block') {
      p.fill(150, 100, 60);
      p.stroke(100, 70, 40);
      p.strokeWeight(2);
      p.rect(-this.radius, -this.radius, this.radius * 2, this.radius * 2, 3);
      
      // Texture
      p.stroke(120, 85, 50);
      p.strokeWeight(1);
      p.line(-this.radius, 0, this.radius, 0);
      p.line(0, -this.radius, 0, this.radius);
    } else if (this.type === 'metal') {
      p.fill(180, 180, 190);
      p.stroke(140, 140, 150);
      p.strokeWeight(2);
      p.circle(0, 0, this.radius * 2);
      
      // Details
      p.stroke(160, 160, 170);
      p.strokeWeight(1);
      p.line(-this.radius * 0.7, 0, this.radius * 0.7, 0);
      p.line(0, -this.radius * 0.7, 0, this.radius * 0.7);
    }
    
    p.pop();
  }
}

export class Enemy {
  constructor(p, x, y, patrolRange) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.startX = x;
    this.vx = 2;
    this.vy = 0;
    this.width = 25;
    this.height = 25;
    this.patrolRange = patrolRange;
    this.grounded = false;
    this.active = true;
    this.animationFrame = 0;
  }

  update() {
    if (!this.active) return;
    
    const p = this.p;
    
    // Patrol movement
    this.x += this.vx;
    if (this.x > this.startX + this.patrolRange) {
      this.x = this.startX + this.patrolRange;
      this.vx *= -1;
    }
    if (this.x < this.startX - this.patrolRange) {
      this.x = this.startX - this.patrolRange;
      this.vx *= -1;
    }

    // Gravity
    this.vy += GRAVITY;
    if (this.vy > 15) this.vy = 15;
    this.y += this.vy;

    // Platform collision
    this.grounded = false;
    for (let platform of gameState.platforms) {
      if (this.checkPlatformCollision(platform)) {
        this.grounded = true;
      }
    }

    // Check collision with player
    if (gameState.player) {
      const dist = p.dist(this.x, this.y, gameState.player.x, gameState.player.y);
      if (dist < (this.width + gameState.player.width) / 2) {
        gameState.health -= 0.5;
      }
    }

    // Animation
    this.animationFrame += 0.15;

    // Death by falling
    if (this.y > CANVAS_HEIGHT + 100) {
      this.active = false;
    }
  }

  checkPlatformCollision(platform) {
    const p = this.p;
    
    if (this.vy >= 0 &&
        this.x + this.width / 2 > platform.x &&
        this.x - this.width / 2 < platform.x + platform.width &&
        this.y + this.height / 2 >= platform.y &&
        this.y + this.height / 2 <= platform.y + 15) {
      this.y = platform.y - this.height / 2;
      this.vy = 0;
      return true;
    }
    return false;
  }

  draw(cameraX) {
    if (!this.active) return;
    
    const p = this.p;
    const screenX = this.x - cameraX;
    
    p.push();
    p.translate(screenX, this.y);
    
    // Enemy body (hostile robot)
    p.fill(255, 80, 80);
    p.stroke(200, 40, 40);
    p.strokeWeight(2);
    p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 3);
    
    // Eyes (angry)
    const eyeBounce = Math.sin(this.animationFrame) * 2;
    p.fill(255, 200, 0);
    p.noStroke();
    p.circle(-6, -5 + eyeBounce, 5);
    p.circle(6, -5 + eyeBounce, 5);
    
    // Spikes
    p.fill(200, 40, 40);
    p.triangle(-8, -this.height / 2, -5, -this.height / 2 - 6, -2, -this.height / 2);
    p.triangle(2, -this.height / 2, 5, -this.height / 2 - 6, 8, -this.height / 2);
    
    p.pop();
  }
}

export class Hazard {
  constructor(x, y, width, height, type = 'lava') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.animationFrame = 0;
  }

  update() {
    this.animationFrame += 0.1;
    
    // Check collision with player
    if (gameState.player) {
      const p = gameState.player;
      if (p.x + p.width / 2 > this.x &&
          p.x - p.width / 2 < this.x + this.width &&
          p.y + p.height / 2 > this.y &&
          p.y - p.height / 2 < this.y + this.height) {
        gameState.health -= 2;
      }
    }
  }

  draw(p, cameraX) {
    const screenX = this.x - cameraX;
    
    p.push();
    
    if (this.type === 'lava') {
      // Lava effect
      p.noStroke();
      p.fill(255, 100, 0, 200);
      p.rect(screenX, this.y, this.width, this.height);
      
      // Bubbles
      p.fill(255, 150, 0);
      for (let i = 0; i < this.width; i += 40) {
        const bubbleY = this.y + 10 + Math.sin(this.animationFrame + i * 0.1) * 5;
        p.circle(screenX + i + 20, bubbleY, 8);
      }
    }
    
    p.pop();
  }
}

export class ExitPortal {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 80;
    this.animationFrame = 0;
    this.active = true;
  }

  update() {
    this.animationFrame += 0.1;
    
    // Check if player reached portal
    if (gameState.player && this.active) {
      const dist = this.p.dist(this.x + this.width / 2, this.y + this.height / 2,
                               gameState.player.x, gameState.player.y);
      if (dist < 40) {
        gameState.gamePhase = "GAME_OVER_WIN";
        this.active = false;
      }
    }
  }

  draw(cameraX) {
    const p = this.p;
    const screenX = this.x - cameraX;
    
    p.push();
    p.translate(screenX + this.width / 2, this.y + this.height / 2);
    
    // Portal swirl effect
    for (let i = 0; i < 5; i++) {
      const angle = this.animationFrame + i * 1.2;
      const radius = 30 - i * 3;
      const alpha = 255 - i * 40;
      p.noStroke();
      p.fill(100, 200, 255, alpha);
      p.circle(Math.cos(angle) * 5, Math.sin(angle) * 5, radius);
    }
    
    // Portal frame
    p.noFill();
    p.stroke(150, 220, 255);
    p.strokeWeight(4);
    p.ellipse(0, 0, this.width, this.height);
    
    p.pop();
  }
}