// entities.js - Game entities (blocks, switches, doors, etc.)
import { TILE_SIZE, WORLD_NORMAL, WORLD_INNER } from './globals.js';

export class Platform {
  constructor(x, y, width, height, world) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.world = world; // NORMAL or INNER
  }

  render(p, currentWorld) {
    if (this.world !== currentWorld) return;
    
    p.push();
    if (this.world === WORLD_NORMAL) {
      p.fill(80, 120, 180);
      p.stroke(60, 100, 160);
    } else {
      p.fill(150, 80, 180);
      p.stroke(130, 60, 160);
    }
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Grid pattern
    p.stroke(255, 50);
    for (let i = TILE_SIZE; i < this.width; i += TILE_SIZE) {
      p.line(this.x + i, this.y, this.x + i, this.y + this.height);
    }
    for (let j = TILE_SIZE; j < this.height; j += TILE_SIZE) {
      p.line(this.x, this.y + j, this.x + this.width, this.y + j);
    }
    p.pop();
  }
}

export class MovableBlock {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = TILE_SIZE;
    this.height = TILE_SIZE;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
  }

  update(platforms, gravity = 0.6) {
    this.vy += gravity;
    if (this.vy > 15) this.vy = 15;

    this.x += this.vx;
    this.y += this.vy;
    
    this.onGround = false;
    this.checkCollisions(platforms);
    
    this.vx *= 0.8; // Friction
  }

  checkCollisions(platforms) {
    for (let platform of platforms) {
      if (this.collidesWith(platform)) {
        if (this.vy > 0) {
          this.y = platform.y - this.height;
          this.vy = 0;
          this.onGround = true;
        } else if (this.vy < 0) {
          this.y = platform.y + platform.height;
          this.vy = 0;
        }
        
        if (this.vx > 0) {
          this.x = platform.x - this.width;
          this.vx = 0;
        } else if (this.vx < 0) {
          this.x = platform.x + platform.width;
          this.vx = 0;
        }
      }
    }
  }

  collidesWith(obj) {
    return this.x < obj.x + obj.width &&
           this.x + this.width > obj.x &&
           this.y < obj.y + obj.height &&
           this.y + this.height > obj.y;
  }

  push(direction) {
    this.vx = direction * 3;
  }

  render(p) {
    p.push();
    p.fill(139, 90, 43);
    p.stroke(101, 67, 33);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Wood grain pattern
    p.stroke(120, 80, 40, 100);
    for (let i = 0; i < 3; i++) {
      p.line(this.x + 4, this.y + 5 + i * 5, this.x + this.width - 4, this.y + 5 + i * 5);
    }
    p.pop();
  }
}

export class Switch {
  constructor(x, y, id, world) {
    this.x = x;
    this.y = y;
    this.width = TILE_SIZE;
    this.height = TILE_SIZE / 2;
    this.id = id;
    this.world = world;
    this.active = false;
  }

  activate() {
    this.active = !this.active;
  }

  render(p, currentWorld) {
    if (this.world !== currentWorld) return;
    
    p.push();
    p.fill(this.active ? 100 : 200, this.active ? 200 : 100, 50);
    p.stroke(this.active ? 70 : 170, this.active ? 170 : 70, 30);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height, 4);
    
    // Indicator light
    p.fill(this.active ? 0 : 255, this.active ? 255 : 0, 0);
    p.noStroke();
    p.circle(this.x + this.width / 2, this.y + this.height / 2, 6);
    p.pop();
  }
}

export class Door {
  constructor(x, y, width, height, switchId, world) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.switchId = switchId;
    this.world = world;
    this.open = false;
  }

  update(switches) {
    const linkedSwitch = switches.find(s => s.id === this.switchId);
    if (linkedSwitch) {
      this.open = linkedSwitch.active;
    }
  }

  render(p, currentWorld) {
    if (this.world !== currentWorld || this.open) return;
    
    p.push();
    p.fill(180, 50, 50, 200);
    p.stroke(150, 30, 30);
    p.strokeWeight(3);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Warning stripes
    p.stroke(255, 200, 0);
    p.strokeWeight(2);
    for (let i = 0; i < this.height; i += 10) {
      p.line(this.x, this.y + i, this.x + this.width, this.y + i + 10);
    }
    p.pop();
  }

  isBlocking() {
    return !this.open;
  }
}

export class Crystal {
  constructor(x, y, world) {
    this.x = x;
    this.y = y;
    this.size = 12;
    this.world = world;
    this.collected = false;
    this.rotation = 0;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  update() {
    this.rotation += 0.05;
    this.pulsePhase += 0.1;
  }

  checkCollection(player) {
    if (this.collected) return false;
    
    const dx = (player.x + player.width / 2) - this.x;
    const dy = (player.y + player.height / 2) - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < this.size + 8) {
      this.collected = true;
      return true;
    }
    return false;
  }

  render(p, currentWorld) {
    if (this.collected || this.world !== currentWorld) return;
    
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    
    const pulse = Math.sin(this.pulsePhase) * 2;
    const size = this.size + pulse;
    
    // Crystal glow
    p.noStroke();
    p.fill(255, 255, 150, 50);
    p.circle(0, 0, size * 2);
    
    // Crystal body
    p.fill(255, 255, 100);
    p.stroke(200, 200, 50);
    p.strokeWeight(2);
    p.beginShape();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      const r = i % 2 === 0 ? size : size * 0.6;
      p.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    p.endShape(p.CLOSE);
    
    p.pop();
  }
}

export class ExitPortal {
  constructor(x, y, world) {
    this.x = x;
    this.y = y;
    this.width = TILE_SIZE * 2;
    this.height = TILE_SIZE * 2;
    this.world = world;
    this.animPhase = 0;
  }

  update() {
    this.animPhase += 0.08;
  }

  checkEntry(player) {
    return player.x + player.width > this.x &&
           player.x < this.x + this.width &&
           player.y + player.height > this.y &&
           player.y < this.y + this.height;
  }

  render(p, currentWorld) {
    if (this.world !== currentWorld) return;
    
    p.push();
    
    // Portal swirl
    p.noFill();
    for (let i = 0; i < 3; i++) {
      p.stroke(100 + i * 50, 255 - i * 50, 255, 150);
      p.strokeWeight(3 - i);
      p.circle(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width * (0.5 + Math.sin(this.animPhase + i) * 0.2)
      );
    }
    
    // Center
    p.fill(200, 230, 255, 200);
    p.noStroke();
    p.circle(this.x + this.width / 2, this.y + this.height / 2, this.width * 0.4);
    
    // Particles
    for (let i = 0; i < 8; i++) {
      const angle = this.animPhase * 2 + (Math.PI * 2 / 8) * i;
      const r = this.width * 0.4;
      const px = this.x + this.width / 2 + Math.cos(angle) * r;
      const py = this.y + this.height / 2 + Math.sin(angle) * r;
      p.fill(255, 255, 255, 200);
      p.circle(px, py, 3);
    }
    
    p.pop();
  }
}

export class Hazard {
  constructor(x, y, width, height, world) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.world = world;
    this.animPhase = 0;
  }

  update() {
    this.animPhase += 0.1;
  }

  checkCollision(player) {
    return player.x + player.width > this.x &&
           player.x < this.x + this.width &&
           player.y + player.height > this.y &&
           player.y < this.y + this.height;
  }

  render(p, currentWorld) {
    if (this.world !== currentWorld) return;
    
    p.push();
    p.fill(255, 50, 50, 150);
    p.noStroke();
    p.rect(this.x, this.y, this.width, this.height);
    
    // Animated spikes
    p.fill(200, 0, 0);
    const spikeCount = Math.floor(this.width / 10);
    for (let i = 0; i < spikeCount; i++) {
      const sx = this.x + i * 10 + 5;
      const offset = Math.sin(this.animPhase + i) * 2;
      p.triangle(
        sx - 5, this.y + this.height,
        sx, this.y + offset,
        sx + 5, this.y + this.height
      );
    }
    p.pop();
  }
}