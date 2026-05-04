// player.js
import { 
  PLAYER_SIZE, PLAYER_SPEED, CANVAS_WIDTH, CANVAS_HEIGHT,
  COURSE_X_OFFSET, COURSE_WIDTH, COLORS, COLOR_KEYS,
  MIN_NECK_LENGTH, MAX_NECK_LENGTH, gameState
} from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.size = PLAYER_SIZE;
    this.neckSegments = [];
    this.targetNeckLength = gameState.neckLength;
  }

  update(p) {
    // Apply horizontal movement
    this.x += this.vx;
    
    // Constrain to course boundaries
    const minX = COURSE_X_OFFSET + this.size;
    const maxX = COURSE_X_OFFSET + COURSE_WIDTH - this.size;
    this.x = p.constrain(this.x, minX, maxX);
    
    // Update neck segments with smooth following
    this.updateNeckSegments(p);
    
    // Reset velocity
    this.vx = 0;
  }

  updateNeckSegments(p) {
    const segmentSize = 8;
    const segmentGap = 6;
    
    // Gradually adjust neck segments to match target length
    while (this.neckSegments.length < this.targetNeckLength) {
      const lastSegment = this.neckSegments.length > 0 
        ? this.neckSegments[this.neckSegments.length - 1]
        : { x: this.x, y: this.y };
      this.neckSegments.push({ x: lastSegment.x, y: lastSegment.y + segmentGap });
    }
    
    while (this.neckSegments.length > this.targetNeckLength) {
      this.neckSegments.pop();
    }
    
    // Smooth neck following animation
    if (this.neckSegments.length > 0) {
      this.neckSegments[0].x = p.lerp(this.neckSegments[0].x, this.x, 0.3);
      this.neckSegments[0].y = p.lerp(this.neckSegments[0].y, this.y + segmentGap, 0.3);
      
      for (let i = 1; i < this.neckSegments.length; i++) {
        const prev = this.neckSegments[i - 1];
        this.neckSegments[i].x = p.lerp(this.neckSegments[i].x, prev.x, 0.25);
        this.neckSegments[i].y = p.lerp(this.neckSegments[i].y, prev.y + segmentGap, 0.25);
      }
    }
  }

  moveLeft() {
    this.vx = -PLAYER_SPEED;
  }

  moveRight() {
    this.vx = PLAYER_SPEED;
  }

  changeColor(p) {
    const currentIndex = COLOR_KEYS.indexOf(gameState.currentColor);
    const nextIndex = (currentIndex + 1) % COLOR_KEYS.length;
    gameState.currentColor = COLOR_KEYS[nextIndex];
  }

  addNeckLength(amount) {
    gameState.neckLength = Math.max(MIN_NECK_LENGTH, 
      Math.min(MAX_NECK_LENGTH, gameState.neckLength + amount));
    this.targetNeckLength = gameState.neckLength;
  }

  render(p) {
    const color = COLORS[gameState.currentColor];
    
    // Draw neck segments
    for (let i = this.neckSegments.length - 1; i >= 0; i--) {
      const segment = this.neckSegments[i];
      const alpha = 150 + (i / this.neckSegments.length) * 105;
      p.push();
      p.fill(...color.rgb, alpha);
      p.noStroke();
      p.ellipse(segment.x, segment.y, 10, 10);
      p.pop();
    }
    
    // Draw head
    p.push();
    p.fill(...color.rgb);
    p.stroke(255);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, this.size, this.size);
    
    // Draw eyes
    p.fill(255);
    p.noStroke();
    p.ellipse(this.x - 5, this.y - 3, 6, 6);
    p.ellipse(this.x + 5, this.y - 3, 6, 6);
    p.fill(0);
    p.ellipse(this.x - 5, this.y - 3, 3, 3);
    p.ellipse(this.x + 5, this.y - 3, 3, 3);
    p.pop();
  }
}