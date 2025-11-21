// entities.js - Entity classes for targets and civilians

import { gameState } from './globals.js';

export class Target {
  constructor(config, p) {
    this.p = p;
    this.type = config.type; // "hostile" or "civilian"
    this.x = config.x;
    this.y = config.y;
    this.moving = config.moving || false;
    this.path = config.path || [];
    this.speed = config.speed || 0;
    this.hitboxRadius = config.hitboxRadius || 20;
    this.headRadius = config.headRadius || 8;
    this.isPriority = config.isPriority || false;
    this.alive = true;
    this.pathIndex = 0;
    this.pathDirection = 1;
    this.deathFrame = 0;
    this.hitEffect = false;
    this.hitEffectFrame = 0;
  }

  update() {
    if (!this.alive) return;

    if (this.moving && this.path.length > 1) {
      const target = this.path[this.pathIndex];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.speed) {
        this.pathIndex += this.pathDirection;
        if (this.pathIndex >= this.path.length) {
          this.pathIndex = this.path.length - 2;
          this.pathDirection = -1;
        } else if (this.pathIndex < 0) {
          this.pathIndex = 1;
          this.pathDirection = 1;
        }
      } else {
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
      }
    }

    if (this.hitEffect && this.p.frameCount - this.hitEffectFrame > 10) {
      this.hitEffect = false;
    }
  }

  render(cameraX, cameraY, zoomLevel) {
    if (!this.alive && this.p.frameCount - this.deathFrame > 30) return;

    const screenX = (this.x - cameraX) * zoomLevel + 300;
    const screenY = (this.y - cameraY) * zoomLevel + 200;

    this.p.push();

    if (!this.alive) {
      const deathProgress = (this.p.frameCount - this.deathFrame) / 30;
      this.p.fill(100, 100, 100, 255 * (1 - deathProgress));
      this.p.ellipse(screenX, screenY + deathProgress * 20, this.hitboxRadius * 2 * zoomLevel);
      this.p.pop();
      return;
    }

    // Body
    if (this.type === "hostile") {
      this.p.fill(this.isPriority ? 180 : 220, 50, 50);
    } else {
      this.p.fill(100, 150, 220);
    }
    
    if (this.hitEffect) {
      this.p.fill(255, 255, 0);
    }

    this.p.noStroke();
    this.p.ellipse(screenX, screenY, this.hitboxRadius * 2 * zoomLevel);

    // Head
    this.p.fill(255, 220, 180);
    this.p.ellipse(screenX, screenY - this.hitboxRadius * zoomLevel * 0.7, this.headRadius * 2 * zoomLevel);

    this.p.pop();
  }

  checkHit(crosshairX, crosshairY, cameraX, cameraY, zoomLevel) {
    if (!this.alive) return { hit: false, headshot: false };

    const screenX = (this.x - cameraX) * zoomLevel + 300;
    const screenY = (this.y - cameraY) * zoomLevel + 200;

    const dist = Math.sqrt((crosshairX - screenX) ** 2 + (crosshairY - screenY) ** 2);

    // Check headshot first
    const headY = screenY - this.hitboxRadius * zoomLevel * 0.7;
    const headDist = Math.sqrt((crosshairX - screenX) ** 2 + (crosshairY - headY) ** 2);
    
    if (headDist < this.headRadius * zoomLevel) {
      return { hit: true, headshot: true };
    }

    // Check body hit
    if (dist < this.hitboxRadius * zoomLevel) {
      return { hit: true, headshot: false };
    }

    return { hit: false, headshot: false };
  }

  kill() {
    this.alive = false;
    this.deathFrame = this.p.frameCount;
  }

  triggerHitEffect() {
    this.hitEffect = true;
    this.hitEffectFrame = this.p.frameCount;
  }
}

export class Player {
  constructor(p) {
    this.p = p;
    this.x = 300;
    this.y = 200;
  }

  getScreenPosition() {
    return { x: 300, y: 200 };
  }

  getGamePosition(cameraX, cameraY) {
    return { x: cameraX + 300, y: cameraY + 200 };
  }
}