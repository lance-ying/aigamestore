// entities.js - Game entities (collectibles, hazards, etc.)
import { gameState } from './globals.js';

export class TimePiece {
  constructor(x, y, id) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.width = 20;
    this.height = 20;
    this.collected = false;
    this.rotation = 0;
    this.bobOffset = 0;
    this.hidden = false; // Only visible with dimension hat
  }

  update(p) {
    this.rotation += 0.05;
    this.bobOffset = Math.sin(p.frameCount * 0.05) * 3;
  }

  draw(p, camera) {
    if (this.collected) return;
    if (this.hidden && !gameState.dimensionActive) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y + this.bobOffset;

    p.push();
    p.translate(screenX, screenY);
    p.rotate(this.rotation);
    
    if (this.hidden) {
      p.fill(150, 150, 255, 180);
    } else {
      p.fill(255, 215, 0);
    }
    p.stroke(255, 165, 0);
    p.strokeWeight(2);
    
    // Hourglass shape
    p.beginShape();
    p.vertex(-8, -10);
    p.vertex(8, -10);
    p.vertex(4, -2);
    p.vertex(0, 0);
    p.vertex(4, 2);
    p.vertex(8, 10);
    p.vertex(-8, 10);
    p.vertex(-4, 2);
    p.vertex(0, 0);
    p.vertex(-4, -2);
    p.endShape(p.CLOSE);

    // Sparkles
    if (!this.hidden) {
      p.noStroke();
      p.fill(255, 255, 200, 200);
      for (let i = 0; i < 4; i++) {
        const angle = this.rotation * 2 + (i * Math.PI / 2);
        const dist = 15 + Math.sin(p.frameCount * 0.1 + i) * 3;
        const sx = Math.cos(angle) * dist;
        const sy = Math.sin(angle) * dist;
        p.ellipse(sx, sy, 3, 3);
      }
    }

    p.pop();
  }

  checkCollision(player) {
    if (this.collected) return false;
    if (this.hidden && !gameState.dimensionActive) return false;
    
    return player.x < this.x + this.width &&
           player.x + player.width > this.x &&
           player.y < this.y + this.height &&
           player.y + player.height > this.y;
  }
}

export class Yarn {
  constructor(x, y, id) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.width = 12;
    this.height = 12;
    this.collected = false;
    this.rotation = 0;
  }

  update(p) {
    this.rotation += 0.1;
  }

  draw(p, camera) {
    if (this.collected) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    p.translate(screenX, screenY);
    p.rotate(this.rotation);
    
    p.fill(255, 105, 180);
    p.stroke(200, 50, 150);
    p.strokeWeight(1);
    p.ellipse(0, 0, 12, 12);
    
    // Yarn texture
    p.noFill();
    p.stroke(255, 150, 200);
    p.arc(0, 0, 8, 8, 0, Math.PI);
    p.arc(0, 0, 6, 6, Math.PI, Math.PI * 2);
    
    p.pop();
  }

  checkCollision(player) {
    if (this.collected) return false;
    
    return player.x < this.x + this.width &&
           player.x + player.width > this.x &&
           player.y < this.y + this.height &&
           player.y + player.height > this.y;
  }
}

export class Spike {
  constructor(x, y, width) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = 16;
  }

  draw(p, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    p.fill(80, 80, 80);
    p.stroke(60, 60, 60);
    p.strokeWeight(1);
    
    const spikeWidth = 12;
    const numSpikes = Math.floor(this.width / spikeWidth);
    
    for (let i = 0; i < numSpikes; i++) {
      const sx = screenX + i * spikeWidth;
      p.triangle(
        sx, screenY + this.height,
        sx + spikeWidth, screenY + this.height,
        sx + spikeWidth / 2, screenY
      );
    }
    
    p.pop();
  }

  checkCollision(player) {
    return player.x + 4 < this.x + this.width &&
           player.x + player.width - 4 > this.x &&
           player.y + player.height - 4 < this.y + this.height &&
           player.y + player.height > this.y;
  }
}

export class Platform {
  constructor(x, y, width, height, type = 'normal') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
  }

  draw(p, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    
    if (this.type === 'ground') {
      p.fill(34, 139, 34);
      p.stroke(20, 100, 20);
    } else if (this.type === 'wood') {
      p.fill(139, 90, 43);
      p.stroke(100, 60, 20);
    } else {
      p.fill(120, 120, 120);
      p.stroke(80, 80, 80);
    }
    
    p.strokeWeight(2);
    p.rect(screenX, screenY, this.width, this.height);
    
    // Texture details
    if (this.type === 'ground') {
      p.noStroke();
      p.fill(40, 160, 40, 100);
      for (let i = 0; i < this.width; i += 20) {
        for (let j = 0; j < this.height; j += 20) {
          p.ellipse(screenX + i + 10, screenY + j + 10, 8, 8);
        }
      }
    } else if (this.type === 'wood') {
      p.stroke(80, 50, 20, 100);
      p.strokeWeight(1);
      for (let i = 0; i < Math.floor(this.width / 40); i++) {
        p.line(screenX + i * 40, screenY, screenX + i * 40, screenY + this.height);
      }
    }
    
    p.pop();
  }
}

export class Ladder {
  constructor(x, y, height) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = height;
  }

  draw(p, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    p.stroke(139, 90, 43);
    p.strokeWeight(3);
    
    // Side rails
    p.line(screenX + 4, screenY, screenX + 4, screenY + this.height);
    p.line(screenX + this.width - 4, screenY, screenX + this.width - 4, screenY + this.height);
    
    // Rungs
    p.strokeWeight(2);
    for (let i = 0; i < this.height; i += 15) {
      p.line(screenX + 4, screenY + i, screenX + this.width - 4, screenY + i);
    }
    
    p.pop();
  }
}

export class Explosion {
  constructor(x, y, radius, p) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.maxRadius = radius;
    this.life = 30;
    this.maxLife = 30;
    this.particles = [];
    
    // Create particles
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * p.random(2, 5),
        vy: Math.sin(angle) * p.random(2, 5),
        size: p.random(3, 8),
        life: p.random(20, 30)
      });
    }
  }

  update() {
    this.life--;
    this.radius = (this.life / this.maxLife) * this.maxRadius;
    
    for (let particle of this.particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.2;
      particle.life--;
    }
    
    this.particles = this.particles.filter(p => p.life > 0);
  }

  draw(p, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    p.noStroke();
    
    // Main explosion circle
    const alpha = (this.life / this.maxLife) * 255;
    p.fill(255, 150, 0, alpha);
    p.ellipse(screenX, screenY, this.radius * 2, this.radius * 2);
    
    p.fill(255, 200, 0, alpha * 0.7);
    p.ellipse(screenX, screenY, this.radius * 1.5, this.radius * 1.5);
    
    p.fill(255, 255, 100, alpha * 0.5);
    p.ellipse(screenX, screenY, this.radius, this.radius);
    
    // Particles
    for (let particle of this.particles) {
      const pAlpha = (particle.life / 30) * 255;
      p.fill(255, 100 + Math.random() * 100, 0, pAlpha);
      p.ellipse(particle.x - camera.x, particle.y - camera.y, particle.size, particle.size);
    }
    
    p.pop();
  }

  isDone() {
    return this.life <= 0;
  }
}

export class DestructibleBlock {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.destroyed = false;
    this.health = 1;
  }

  draw(p, camera) {
    if (this.destroyed) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    p.fill(160, 82, 45);
    p.stroke(120, 60, 30);
    p.strokeWeight(2);
    p.rect(screenX, screenY, this.width, this.height);
    
    // Cracks
    p.stroke(100, 50, 20);
    p.strokeWeight(1);
    p.line(screenX + this.width / 2, screenY, screenX + this.width / 2, screenY + this.height);
    p.line(screenX, screenY + this.height / 2, screenX + this.width, screenY + this.height / 2);
    
    p.pop();
  }

  takeDamage() {
    this.health--;
    if (this.health <= 0) {
      this.destroyed = true;
      return true;
    }
    return false;
  }

  checkExplosionCollision(explosion) {
    if (this.destroyed) return false;
    
    const dist = Math.sqrt(
      Math.pow(this.x + this.width / 2 - explosion.x, 2) +
      Math.pow(this.y + this.height / 2 - explosion.y, 2)
    );
    
    return dist < explosion.radius + Math.max(this.width, this.height) / 2;
  }
}