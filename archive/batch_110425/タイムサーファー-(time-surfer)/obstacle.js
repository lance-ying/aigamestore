import { CANVAS_HEIGHT } from './globals.js';

export class Obstacle {
  constructor(p, x, y, type = 'spike') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type; // 'spike', 'gap'
    this.width = type === 'gap' ? 80 : 30;
    this.height = type === 'gap' ? CANVAS_HEIGHT : 40;
  }

  draw(scrollOffset) {
    const p = this.p;
    const screenX = this.x - scrollOffset;
    
    if (this.type === 'spike') {
      p.push();
      p.fill(200, 50, 50);
      p.stroke(255, 100, 100);
      p.strokeWeight(2);
      
      // Draw multiple spikes
      const spikeCount = 3;
      const spikeWidth = this.width / spikeCount;
      for (let i = 0; i < spikeCount; i++) {
        p.triangle(
          screenX + i * spikeWidth, this.y,
          screenX + (i + 0.5) * spikeWidth, this.y - this.height,
          screenX + (i + 1) * spikeWidth, this.y
        );
      }
      p.pop();
    } else if (this.type === 'gap') {
      p.push();
      p.fill(20, 10, 30);
      p.noStroke();
      p.rect(screenX, this.y, this.width, this.height);
      
      // Draw danger indicators
      p.stroke(200, 50, 50);
      p.strokeWeight(3);
      p.line(screenX, this.y, screenX, this.y + 20);
      p.line(screenX + this.width, this.y, screenX + this.width, this.y + 20);
      p.pop();
    }
  }

  checkCollision(player, scrollOffset) {
    const playerWorldX = player.x + scrollOffset;
    
    if (this.type === 'spike') {
      const dist = this.p.dist(playerWorldX, player.y, this.x + this.width / 2, this.y - this.height / 2);
      return dist < player.radius + 15;
    } else if (this.type === 'gap') {
      const inGapX = playerWorldX + player.radius > this.x && playerWorldX - player.radius < this.x + this.width;
      const inGapY = player.y + player.radius > this.y;
      return inGapX && inGapY;
    }
    return false;
  }
}