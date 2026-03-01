// dot.js - Dot class
export class Dot {
  constructor(gridX, gridY, color, type = 'normal') {
    this.gridX = gridX;
    this.gridY = gridY;
    this.color = color;
    this.type = type; // 'normal' or 'anchor'
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.size = 0;
    this.targetSize = 0;
    this.alpha = 255;
    this.isClearing = false;
    this.isFalling = false;
  }

  update() {
    // Smooth position interpolation
    const lerpSpeed = 0.2;
    this.x += (this.targetX - this.x) * lerpSpeed;
    this.y += (this.targetY - this.y) * lerpSpeed;
    this.size += (this.targetSize - this.size) * lerpSpeed;
  }

  setTarget(x, y, size) {
    this.targetX = x;
    this.targetY = y;
    this.targetSize = size;
  }
}