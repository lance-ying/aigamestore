import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class TruthBullet {
  constructor(name, type, description) {
    this.name = name;
    this.type = type; // 'weapon', 'alibi', 'location', 'time', 'evidence'
    this.description = description;
    this.id = Math.random();
  }
}

export class Statement {
  constructor(text, speaker, weakPointType, y, speed, hasWeakPoint = true) {
    this.text = text;
    this.speaker = speaker;
    this.weakPointType = weakPointType;
    this.x = CANVAS_WIDTH;
    this.y = y;
    this.speed = speed;
    this.hasWeakPoint = hasWeakPoint;
    this.exposed = false;
    this.alpha = 255;
    this.id = Math.random();
    
    // Weak point position relative to text
    this.weakPointOffset = Math.random() * 0.6 + 0.2; // 0.2 to 0.8 along text
    this.absorbable = !hasWeakPoint && Math.random() < 0.3; // Some non-weak statements can be absorbed
  }
  
  update() {
    this.x -= this.speed;
    if (this.exposed) {
      this.alpha = Math.max(0, this.alpha - 10);
    }
  }
  
  isOffScreen() {
    return this.x < -400 || this.alpha <= 0;
  }
  
  getWeakPointX() {
    return this.x + this.weakPointOffset * 300;
  }
  
  getWeakPointY() {
    return this.y;
  }
}

export class FiredBullet {
  constructor(x, y, targetX, targetY, bulletData) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.bulletData = bulletData;
    this.speed = 8;
    this.active = true;
    this.alpha = 255;
    
    // Calculate direction
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.vx = (dx / dist) * this.speed;
    this.vy = (dy / dist) * this.speed;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    
    // Check if reached target area
    const dx = this.x - this.targetX;
    const dy = this.y - this.targetY;
    if (Math.sqrt(dx * dx + dy * dy) < 20) {
      this.active = false;
    }
    
    // Check if off screen
    if (this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.active = false;
    }
  }
}

export class VisualEffect {
  constructor(x, y, type, data = {}) {
    this.x = x;
    this.y = y;
    this.type = type; // 'hit', 'miss', 'expose', 'damage'
    this.data = data;
    this.frame = 0;
    this.maxFrames = type === 'expose' ? 60 : 30;
    this.alpha = 255;
  }
  
  update() {
    this.frame++;
    this.alpha = 255 * (1 - this.frame / this.maxFrames);
  }
  
  isFinished() {
    return this.frame >= this.maxFrames;
  }
}

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 50;
  }
  
  update() {
    // Player is stationary in this game, acts as bullet source
  }
}