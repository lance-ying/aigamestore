// entities.js - Game entity classes

import { GRID_SIZE, OFFSET_X, OFFSET_Y, ENTITY_TYPE, DIRECTION } from './globals.js';

export class Entity {
  constructor(gridX, gridY, type) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.type = type;
    this.removed = false;
  }

  getScreenX() {
    return OFFSET_X + this.gridX * GRID_SIZE + GRID_SIZE / 2;
  }

  getScreenY() {
    return OFFSET_Y + this.gridY * GRID_SIZE + GRID_SIZE / 2;
  }

  isAt(x, y) {
    return this.gridX === x && this.gridY === y;
  }

  render(p) {
    // Override in subclasses
  }
}

export class Player extends Entity {
  constructor(gridX, gridY) {
    super(gridX, gridY, ENTITY_TYPE.PLAYER);
    this.health = 100;
  }

  render(p) {
    const x = this.getScreenX();
    const y = this.getScreenY();
    const size = GRID_SIZE * 0.7;

    p.push();
    // Player body (Adam Jensen styled)
    p.fill(40, 60, 80);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(x, y, size * 0.6, size * 0.8, 5);
    
    // Head
    p.fill(70, 90, 110);
    p.circle(x, y - size * 0.35, size * 0.4);
    
    // Augmentation glow (yellow/orange)
    p.fill(255, 180, 0, 150);
    p.circle(x - size * 0.15, y - size * 0.35, size * 0.15);
    p.circle(x + size * 0.15, y - size * 0.35, size * 0.15);
    
    // Arms
    p.stroke(40, 60, 80);
    p.strokeWeight(size * 0.15);
    p.line(x - size * 0.3, y, x - size * 0.45, y + size * 0.2);
    p.line(x + size * 0.3, y, x + size * 0.45, y + size * 0.2);
    
    p.pop();
  }
}

export class Guard extends Entity {
  constructor(gridX, gridY, direction, patrolPath) {
    super(gridX, gridY, ENTITY_TYPE.GUARD);
    this.direction = direction;
    this.patrolPath = patrolPath || [];
    this.patrolIndex = 0;
    this.viewDistance = 3;
  }

  move(grid) {
    if (this.patrolPath.length > 0) {
      this.patrolIndex = (this.patrolIndex + 1) % this.patrolPath.length;
      const target = this.patrolPath[this.patrolIndex];
      this.gridX = target.x;
      this.gridY = target.y;
      this.updateDirection();
    }
  }

  updateDirection() {
    if (this.patrolPath.length > 1) {
      const current = this.patrolPath[this.patrolIndex];
      const next = this.patrolPath[(this.patrolIndex + 1) % this.patrolPath.length];
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      
      if (dx > 0) this.direction = DIRECTION.RIGHT;
      else if (dx < 0) this.direction = DIRECTION.LEFT;
      else if (dy > 0) this.direction = DIRECTION.DOWN;
      else if (dy < 0) this.direction = DIRECTION.UP;
    }
  }

  canSeePlayer(player, grid) {
    const dx = this.direction.x;
    const dy = this.direction.y;
    
    for (let i = 1; i <= this.viewDistance; i++) {
      const checkX = this.gridX + dx * i;
      const checkY = this.gridY + dy * i;
      
      // Check for walls blocking view
      if (grid[checkY] && grid[checkY][checkX] === 1) {
        return false;
      }
      
      // Check if player is at this position
      if (player.gridX === checkX && player.gridY === checkY) {
        return true;
      }
    }
    return false;
  }

  render(p) {
    const x = this.getScreenX();
    const y = this.getScreenY();
    const size = GRID_SIZE * 0.6;

    p.push();
    // Guard body
    p.fill(150, 50, 50);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(x, y, size * 0.6, size * 0.8, 3);
    
    // Head
    p.fill(180, 70, 70);
    p.circle(x, y - size * 0.35, size * 0.35);
    
    // Vision cone
    p.fill(255, 100, 100, 80);
    p.noStroke();
    const visionLength = this.viewDistance * GRID_SIZE;
    const angle = Math.atan2(this.direction.y, this.direction.x);
    
    p.push();
    p.translate(x, y);
    p.rotate(angle);
    p.triangle(0, -10, visionLength, -15, visionLength, 15);
    p.triangle(0, 10, visionLength, -15, visionLength, 15);
    p.pop();
    
    p.pop();
  }
}

export class Turret extends Entity {
  constructor(gridX, gridY, active = true) {
    super(gridX, gridY, ENTITY_TYPE.TURRET);
    this.active = active;
    this.viewDistance = 4;
    this.rotationAngle = 0;
  }

  canSeePlayer(player, grid) {
    if (!this.active) return false;
    
    // Turret can see in all directions
    const dx = player.gridX - this.gridX;
    const dy = player.gridY - this.gridY;
    const dist = Math.abs(dx) + Math.abs(dy);
    
    if (dist > this.viewDistance) return false;
    
    // Check for walls blocking view
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    for (let i = 1; i <= steps; i++) {
      const checkX = Math.round(this.gridX + (dx / steps) * i);
      const checkY = Math.round(this.gridY + (dy / steps) * i);
      
      if (grid[checkY] && grid[checkY][checkX] === 1) {
        return false;
      }
    }
    
    return true;
  }

  update(frameCount) {
    if (this.active) {
      this.rotationAngle = (frameCount * 2) % 360;
    }
  }

  toggle() {
    this.active = !this.active;
  }

  render(p) {
    const x = this.getScreenX();
    const y = this.getScreenY();
    const size = GRID_SIZE * 0.5;

    p.push();
    // Base
    p.fill(this.active ? 200 : 100, this.active ? 50 : 50, this.active ? 50 : 100);
    p.noStroke();
    p.circle(x, y, size);
    
    // Rotating turret
    p.push();
    p.translate(x, y);
    p.rotate(p.radians(this.rotationAngle));
    p.fill(this.active ? 150 : 80, this.active ? 30 : 30, this.active ? 30 : 80);
    p.rect(-size * 0.1, -size * 0.1, size * 0.6, size * 0.2);
    p.fill(this.active ? 255 : 100, this.active ? 100 : 100, this.active ? 100 : 150);
    p.circle(size * 0.4, 0, size * 0.15);
    p.pop();
    
    // Status indicator
    p.fill(this.active ? 255 : 100, this.active ? 0 : 255, 0);
    p.circle(x, y - size * 0.6, size * 0.15);
    
    p.pop();
  }
}

export class Drone extends Entity {
  constructor(gridX, gridY, patrolPath) {
    super(gridX, gridY, ENTITY_TYPE.DRONE);
    this.patrolPath = patrolPath || [];
    this.patrolIndex = 0;
    this.viewDistance = 2;
    this.hoverOffset = 0;
  }

  move(grid) {
    if (this.patrolPath.length > 0) {
      this.patrolIndex = (this.patrolIndex + 1) % this.patrolPath.length;
      const target = this.patrolPath[this.patrolIndex];
      this.gridX = target.x;
      this.gridY = target.y;
    }
  }

  canSeePlayer(player, grid) {
    const dist = Math.abs(player.gridX - this.gridX) + Math.abs(player.gridY - this.gridY);
    return dist <= this.viewDistance;
  }

  update(frameCount) {
    this.hoverOffset = Math.sin(frameCount * 0.1) * 5;
  }

  render(p) {
    const x = this.getScreenX();
    const y = this.getScreenY() + this.hoverOffset;
    const size = GRID_SIZE * 0.5;

    p.push();
    // Drone body
    p.fill(100, 100, 150);
    p.noStroke();
    p.circle(x, y, size);
    
    // Propellers
    p.fill(150, 150, 200, 150);
    p.circle(x - size * 0.4, y - size * 0.4, size * 0.3);
    p.circle(x + size * 0.4, y - size * 0.4, size * 0.3);
    p.circle(x - size * 0.4, y + size * 0.4, size * 0.3);
    p.circle(x + size * 0.4, y + size * 0.4, size * 0.3);
    
    // Scanner light
    p.fill(0, 200, 255);
    p.circle(x, y, size * 0.3);
    
    // Detection range indicator
    p.noFill();
    p.stroke(0, 200, 255, 50);
    p.strokeWeight(1);
    p.circle(x, y, this.viewDistance * GRID_SIZE);
    
    p.pop();
  }
}

export class Terminal extends Entity {
  constructor(gridX, gridY) {
    super(gridX, gridY, ENTITY_TYPE.TERMINAL);
    this.hacked = false;
  }

  hack() {
    this.hacked = !this.hacked;
  }

  render(p) {
    const x = this.getScreenX();
    const y = this.getScreenY();
    const size = GRID_SIZE * 0.6;

    p.push();
    // Terminal base
    p.fill(60, 60, 80);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(x, y, size * 0.7, size * 0.9, 3);
    
    // Screen
    p.fill(this.hacked ? 100 : 20, this.hacked ? 200 : 150, this.hacked ? 100 : 180);
    p.rect(x, y - size * 0.15, size * 0.5, size * 0.5, 2);
    
    // Status text
    p.fill(this.hacked ? 0 : 0, this.hacked ? 255 : 200, this.hacked ? 0 : 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(8);
    p.text(this.hacked ? "HACK" : "TERM", x, y - size * 0.15);
    
    p.pop();
  }
}

export class Exit extends Entity {
  constructor(gridX, gridY) {
    super(gridX, gridY, ENTITY_TYPE.EXIT);
    this.glowPhase = 0;
  }

  update(frameCount) {
    this.glowPhase = frameCount;
  }

  render(p) {
    const x = this.getScreenX();
    const y = this.getScreenY();
    const size = GRID_SIZE * 0.8;

    p.push();
    // Outer glow
    const glowAlpha = 100 + Math.sin(this.glowPhase * 0.1) * 50;
    p.fill(0, 255, 100, glowAlpha);
    p.noStroke();
    p.circle(x, y, size * 1.2);
    
    // Exit marker
    p.fill(0, 200, 80);
    p.rectMode(p.CENTER);
    p.rect(x, y, size * 0.8, size * 0.8, 5);
    
    // Arrow/symbol
    p.fill(0, 255, 150);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(size * 0.6);
    p.text("↑", x, y);
    
    p.pop();
  }
}