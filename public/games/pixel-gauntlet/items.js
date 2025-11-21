import { gameState } from './globals.js';

export class Item {
  constructor(p, x, y, type) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    this.collected = false;
    this.size = type === 'health' ? 15 : 20;
  }

  checkCollection(player) {
    if (this.collected) return;

    const dist = this.p.dist(this.x, this.y, player.x + player.width / 2, player.y + player.height / 2);
    if (dist < this.size + 15) {
      this.collect(player);
    }
  }

  collect(player) {
    this.collected = true;
    
    if (this.type === 'health') {
      player.heal(5);
      gameState.score += 5;
    } else if (this.type === 'attackBoost') {
      player.applyAttackBoost(5, 600); // 10 seconds
      gameState.score += 5;
    }
  }

  render() {
    if (this.collected) return;

    this.p.push();
    this.p.noStroke();
    
    if (this.type === 'health') {
      // Green circle (health potion)
      this.p.fill(0, 255, 0, 200);
      this.p.ellipse(this.x, this.y, this.size * 2, this.size * 2);
      this.p.fill(255);
      this.p.text('H', this.x - 4, this.y + 5);
    } else if (this.type === 'attackBoost') {
      // Yellow star
      this.p.fill(255, 215, 0, 200);
      this.drawStar(this.x, this.y, this.size / 2, this.size, 5);
    }
    
    this.p.pop();
  }

  drawStar(x, y, radius1, radius2, npoints) {
    const angle = this.p.TWO_PI / npoints;
    const halfAngle = angle / 2;
    this.p.beginShape();
    for (let a = -this.p.PI / 2; a < this.p.TWO_PI - this.p.PI / 2; a += angle) {
      let sx = x + this.p.cos(a) * radius2;
      let sy = y + this.p.sin(a) * radius2;
      this.p.vertex(sx, sy);
      sx = x + this.p.cos(a + halfAngle) * radius1;
      sy = y + this.p.sin(a + halfAngle) * radius1;
      this.p.vertex(sx, sy);
    }
    this.p.endShape(this.p.CLOSE);
  }
}