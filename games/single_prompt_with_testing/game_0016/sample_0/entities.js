// entities.js - Game entities

import { CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 40;
    this.speed = 3;
    this.color = [200, 150, 100];
  }
  
  update(p, keys) {
    const oldX = this.x;
    const oldY = this.y;
    
    if (keys.left) this.x -= this.speed;
    if (keys.right) this.x += this.speed;
    if (keys.up) this.y -= this.speed;
    if (keys.down) this.y += this.speed;
    
    // Collision with world bounds
    this.x = p.constrain(this.x, this.width / 2, WORLD_WIDTH - this.width / 2);
    this.y = p.constrain(this.y, this.height / 2, WORLD_HEIGHT - this.height / 2);
    
    // Collision with resources
    for (const resource of gameState.resources) {
      if (resource.solid && this.collidesWith(resource)) {
        this.x = oldX;
        this.y = oldY;
        break;
      }
    }
  }
  
  collidesWith(entity) {
    return (
      this.x - this.width / 2 < entity.x + entity.width / 2 &&
      this.x + this.width / 2 > entity.x - entity.width / 2 &&
      this.y - this.height / 2 < entity.y + entity.height / 2 &&
      this.y + this.height / 2 > entity.y - entity.height / 2
    );
  }
  
  isNear(entity, distance = 50) {
    const dx = this.x - entity.x;
    const dy = this.y - entity.y;
    return Math.sqrt(dx * dx + dy * dy) < distance;
  }
  
  draw(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    p.push();
    // Body
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(screenX - this.width / 2, screenY - this.height / 2 + 10, this.width, this.height - 10, 5);
    
    // Head
    p.fill(220, 180, 140);
    p.circle(screenX, screenY - this.height / 2 + 5, 18);
    
    // Eyes
    p.fill(0);
    p.noStroke();
    p.circle(screenX - 4, screenY - this.height / 2 + 3, 3);
    p.circle(screenX + 4, screenY - this.height / 2 + 3, 3);
    
    // Smile
    p.stroke(0);
    p.strokeWeight(1);
    p.noFill();
    p.arc(screenX, screenY - this.height / 2 + 6, 10, 6, 0, p.PI);
    
    p.pop();
  }
}

export class Resource {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'tree', 'rock', 'berry_bush'
    this.depleted = false;
    this.respawnTimer = 0;
    this.respawnTime = 1200; // frames
    
    if (type === 'tree') {
      this.width = 40;
      this.height = 60;
      this.solid = true;
      this.item = 'wood';
    } else if (type === 'rock') {
      this.width = 35;
      this.height = 30;
      this.solid = true;
      this.item = 'stone';
    } else if (type === 'berry_bush') {
      this.width = 30;
      this.height = 25;
      this.solid = false;
      this.item = 'berry';
    }
  }
  
  update() {
    if (this.depleted) {
      this.respawnTimer++;
      if (this.respawnTimer >= this.respawnTime) {
        this.depleted = false;
        this.respawnTimer = 0;
      }
    }
  }
  
  gather() {
    if (!this.depleted) {
      this.depleted = true;
      return this.item;
    }
    return null;
  }
  
  draw(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    p.push();
    p.stroke(0);
    p.strokeWeight(2);
    
    if (this.type === 'tree') {
      // Trunk
      p.fill(100, 70, 40);
      p.rect(screenX - 8, screenY - 10, 16, 30);
      
      // Foliage
      if (!this.depleted) {
        p.fill(60, 120, 60);
      } else {
        p.fill(100, 100, 80);
      }
      p.circle(screenX, screenY - 30, 40);
      p.circle(screenX - 15, screenY - 20, 30);
      p.circle(screenX + 15, screenY - 20, 30);
    } else if (this.type === 'rock') {
      if (!this.depleted) {
        p.fill(120, 120, 130);
      } else {
        p.fill(80, 80, 90);
      }
      // Irregular rock shape
      p.beginShape();
      p.vertex(screenX, screenY - 15);
      p.vertex(screenX + 15, screenY - 8);
      p.vertex(screenX + 12, screenY + 10);
      p.vertex(screenX - 12, screenY + 10);
      p.vertex(screenX - 15, screenY - 5);
      p.endShape(p.CLOSE);
    } else if (this.type === 'berry_bush') {
      // Bush
      p.fill(80, 140, 80);
      p.circle(screenX, screenY, 25);
      p.circle(screenX - 10, screenY + 5, 18);
      p.circle(screenX + 10, screenY + 5, 18);
      
      // Berries
      if (!this.depleted) {
        p.fill(200, 50, 50);
        p.noStroke();
        p.circle(screenX - 8, screenY - 5, 6);
        p.circle(screenX + 5, screenY - 3, 6);
        p.circle(screenX, screenY + 8, 6);
      }
    }
    
    p.pop();
  }
}

export class Rabbit {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 15;
    this.speed = 2.5;
    this.alive = true;
    this.fleeDistance = 80;
    this.hunted = false;
    
    // Random wander
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderTimer = 0;
  }
  
  update(player) {
    if (!this.alive) return;
    
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < this.fleeDistance) {
      // Flee from player
      const angle = Math.atan2(dy, dx);
      this.x += Math.cos(angle) * this.speed * 1.5;
      this.y += Math.sin(angle) * this.speed * 1.5;
    } else {
      // Wander
      this.wanderTimer++;
      if (this.wanderTimer > 60) {
        this.wanderAngle += (Math.random() - 0.5) * 0.5;
        this.wanderTimer = 0;
      }
      this.x += Math.cos(this.wanderAngle) * this.speed * 0.5;
      this.y += Math.sin(this.wanderAngle) * this.speed * 0.5;
    }
    
    // Keep in bounds
    this.x = Math.max(this.width, Math.min(WORLD_WIDTH - this.width, this.x));
    this.y = Math.max(this.height, Math.min(WORLD_HEIGHT - this.height, this.y));
  }
  
  isNear(entity, distance = 40) {
    const dx = this.x - entity.x;
    const dy = this.y - entity.y;
    return Math.sqrt(dx * dx + dy * dy) < distance;
  }
  
  hunt() {
    if (this.alive) {
      this.alive = false;
      this.hunted = true;
      return true;
    }
    return false;
  }
  
  draw(p, cameraX, cameraY) {
    if (!this.alive) return;
    
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    p.push();
    p.fill(200, 200, 200);
    p.stroke(0);
    p.strokeWeight(2);
    
    // Body
    p.ellipse(screenX, screenY, this.width, this.height);
    
    // Head
    p.ellipse(screenX + 8, screenY - 3, 12, 10);
    
    // Ears
    p.fill(180, 180, 180);
    p.ellipse(screenX + 10, screenY - 10, 5, 12);
    p.ellipse(screenX + 6, screenY - 10, 5, 12);
    
    // Eye
    p.fill(0);
    p.noStroke();
    p.circle(screenX + 11, screenY - 4, 2);
    
    p.pop();
  }
}

export class Campfire {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 30;
    this.fuel = 0;
    this.lit = false;
    this.lightRadius = 100;
    this.flameOffset = 0;
  }
  
  update(p) {
    if (this.lit && this.fuel > 0) {
      this.fuel = Math.max(0, this.fuel - 0.5);
      if (this.fuel <= 0) {
        this.lit = false;
      }
      this.flameOffset = p.sin(p.frameCount * 0.2) * 5;
    }
  }
  
  addFuel(amount) {
    this.fuel = Math.min(300, this.fuel + amount);
    if (this.fuel > 0) {
      this.lit = true;
    }
  }
  
  isPlayerInLight(player) {
    if (!this.lit) return false;
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    return Math.sqrt(dx * dx + dy * dy) < this.lightRadius;
  }
  
  draw(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    p.push();
    
    // Fire pit
    p.fill(80, 60, 40);
    p.stroke(0);
    p.strokeWeight(2);
    p.ellipse(screenX, screenY + 10, 40, 15);
    
    // Logs
    p.fill(100, 70, 40);
    p.rect(screenX - 15, screenY + 5, 30, 8);
    p.rect(screenX - 12, screenY, 24, 8);
    
    // Flames
    if (this.lit && this.fuel > 0) {
      p.noStroke();
      
      // Yellow flame
      p.fill(255, 200, 0, 200);
      p.triangle(
        screenX - 10, screenY + 5,
        screenX + 10, screenY + 5,
        screenX + this.flameOffset, screenY - 20
      );
      
      // Orange flame
      p.fill(255, 120, 0, 180);
      p.triangle(
        screenX - 8, screenY + 5,
        screenX + 8, screenY + 5,
        screenX + this.flameOffset * 0.8, screenY - 15
      );
      
      // Red core
      p.fill(255, 50, 0, 160);
      p.triangle(
        screenX - 5, screenY + 5,
        screenX + 5, screenY + 5,
        screenX + this.flameOffset * 0.5, screenY - 10
      );
      
      // Light glow
      if (this.lit) {
        p.fill(255, 200, 100, 30);
        p.circle(screenX, screenY, this.lightRadius * 2);
      }
    }
    
    p.pop();
  }
}

export class Portal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 80;
    this.active = false;
    this.rotation = 0;
  }
  
  update(p) {
    this.rotation += 0.05;
  }
  
  activate() {
    this.active = true;
  }
  
  draw(p, cameraX, cameraY) {
    if (!this.active) return;
    
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    p.push();
    p.translate(screenX, screenY);
    
    // Outer ring
    p.stroke(150, 100, 255);
    p.strokeWeight(4);
    p.noFill();
    p.rotate(this.rotation);
    p.ellipse(0, 0, 60, 80);
    p.rotate(this.rotation);
    p.ellipse(0, 0, 50, 70);
    
    // Inner swirl
    p.fill(200, 150, 255, 100);
    p.noStroke();
    p.ellipse(0, 0, 40, 60);
    
    // Center glow
    p.fill(255, 200, 255, 150);
    p.ellipse(0, 0, 20, 30);
    
    p.pop();
  }
}