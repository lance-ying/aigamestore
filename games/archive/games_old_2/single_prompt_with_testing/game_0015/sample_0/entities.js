// entities.js - Game entities (walls, clues, interactables)

export class Wall {
  constructor(x1, z1, x2, z2, height = 80) {
    this.x1 = Math.min(x1, x2);
    this.z1 = Math.min(z1, z2);
    this.x2 = Math.max(x1, x2);
    this.z2 = Math.max(z1, z2);
    this.height = height;
  }
}

export class Interactable {
  constructor(x, y, z, type, name, id) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.type = type; // 'clue', 'puzzle', 'exit'
    this.name = name;
    this.id = id;
    this.collected = false;
    this.size = 20;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  update(p) {
    this.pulsePhase += 0.05;
  }

  draw(p, player) {
    if (this.collected && this.type !== 'exit') return;

    // Calculate position relative to player
    const dx = this.x - player.x;
    const dz = this.z - player.z;
    
    // Rotate to player's view
    const rotatedX = dx * Math.cos(-player.angle) - dz * Math.sin(-player.angle);
    const rotatedZ = dx * Math.sin(-player.angle) + dz * Math.cos(-player.angle);

    // Only draw if in front of player
    if (rotatedZ < 10) return;

    // Project to 2D
    const scale = 300 / rotatedZ;
    const screenX = p.width / 2 + rotatedX * scale;
    const screenY = p.height / 2 - this.y * scale + Math.sin(player.bobOffset) * 3;

    // Draw based on type
    p.push();
    
    const pulse = Math.sin(this.pulsePhase) * 0.3 + 1;
    const size = this.size * scale * pulse;

    if (this.type === 'clue') {
      p.fill(255, 255, 150, 200);
      p.noStroke();
      p.ellipse(screenX, screenY, size, size);
      p.fill(255, 255, 0, 100);
      p.ellipse(screenX, screenY, size * 1.5, size * 1.5);
    } else if (this.type === 'puzzle') {
      p.fill(150, 200, 255, 200);
      p.stroke(100, 150, 255);
      p.strokeWeight(2);
      p.rectMode(p.CENTER);
      p.rect(screenX, screenY, size, size);
    } else if (this.type === 'exit') {
      p.fill(100, 255, 100, 150);
      p.noStroke();
      p.ellipse(screenX, screenY, size * 1.5, size * 2);
      p.fill(50, 200, 50, 100);
      p.ellipse(screenX, screenY, size * 2, size * 2.5);
    }

    p.pop();
  }
}

export class AmbientEntity {
  constructor(x, y, z, type) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.type = type; // 'shadow', 'particle', 'ghost'
    this.phase = Math.random() * Math.PI * 2;
    this.speed = Math.random() * 0.02 + 0.01;
    this.alpha = Math.random() * 100 + 50;
  }

  update(p) {
    this.phase += this.speed;
    // Slow drift
    this.x += Math.sin(this.phase) * 0.1;
    this.z += Math.cos(this.phase * 0.7) * 0.1;
  }

  draw(p, player) {
    const dx = this.x - player.x;
    const dz = this.z - player.z;
    
    const rotatedX = dx * Math.cos(-player.angle) - dz * Math.sin(-player.angle);
    const rotatedZ = dx * Math.sin(-player.angle) + dz * Math.cos(-player.angle);

    if (rotatedZ < 10) return;

    const scale = 300 / rotatedZ;
    const screenX = p.width / 2 + rotatedX * scale;
    const screenY = p.height / 2 - this.y * scale;

    p.push();
    p.noStroke();
    
    if (this.type === 'shadow') {
      p.fill(0, 0, 0, this.alpha * 0.3);
      p.ellipse(screenX, screenY, 40 * scale, 40 * scale);
    } else if (this.type === 'particle') {
      p.fill(200, 200, 255, this.alpha);
      p.ellipse(screenX, screenY, 5 * scale, 5 * scale);
    }
    
    p.pop();
  }
}