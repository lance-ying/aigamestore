import { CANVAS_HEIGHT } from './globals.js';

export class Platform {
  constructor(p, x, y, width, type = 'flat') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = 20;
    this.type = type; // 'flat', 'slope_up', 'slope_down'
    this.color = [80, 60, 120];
  }

  draw(scrollOffset) {
    const p = this.p;
    const screenX = this.x - scrollOffset;
    
    p.push();
    p.fill(...this.color);
    p.stroke(120, 100, 180);
    p.strokeWeight(2);

    if (this.type === 'flat') {
      p.rect(screenX, this.y, this.width, this.height);
    } else if (this.type === 'slope_down') {
      p.beginShape();
      p.vertex(screenX, this.y);
      p.vertex(screenX + this.width, this.y + this.height * 3);
      p.vertex(screenX + this.width, CANVAS_HEIGHT);
      p.vertex(screenX, CANVAS_HEIGHT);
      p.endShape(p.CLOSE);
    } else if (this.type === 'slope_up') {
      p.beginShape();
      p.vertex(screenX, this.y + this.height * 3);
      p.vertex(screenX + this.width, this.y);
      p.vertex(screenX + this.width, CANVAS_HEIGHT);
      p.vertex(screenX, CANVAS_HEIGHT);
      p.endShape(p.CLOSE);
    }
    p.pop();
  }

  getTopY(x) {
    if (this.type === 'flat') {
      return this.y;
    } else if (this.type === 'slope_down') {
      const relX = x - this.x;
      const ratio = relX / this.width;
      return this.y + (this.height * 3 * ratio);
    } else if (this.type === 'slope_up') {
      const relX = x - this.x;
      const ratio = relX / this.width;
      return this.y + this.height * 3 - (this.height * 3 * ratio);
    }
    return this.y;
  }

  isOnPlatform(playerX, playerY, playerRadius) {
    if (playerX + playerRadius < this.x || playerX - playerRadius > this.x + this.width) {
      return false;
    }
    
    const topY = this.getTopY(playerX);
    return playerY + playerRadius >= topY && playerY + playerRadius <= topY + 10;
  }
}