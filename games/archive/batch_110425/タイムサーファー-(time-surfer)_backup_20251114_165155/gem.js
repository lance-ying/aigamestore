export class Gem {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = 8;
    this.collected = false;
    this.rotation = 0;
    this.pulseOffset = p.random(1000);
  }

  update() {
    this.rotation += 0.1;
  }

  draw(scrollOffset) {
    if (this.collected) return;
    
    const p = this.p;
    const screenX = this.x - scrollOffset;
    
    p.push();
    p.translate(screenX, this.y);
    p.rotate(this.rotation);
    
    const pulse = p.sin((p.frameCount + this.pulseOffset) * 0.1) * 2;
    const size = this.radius + pulse;
    
    // Outer glow
    p.fill(255, 255, 100, 50);
    p.noStroke();
    p.circle(0, 0, size * 3);
    
    // Gem body
    p.fill(255, 220, 50);
    p.stroke(255, 255, 150);
    p.strokeWeight(2);
    p.beginShape();
    for (let i = 0; i < 6; i++) {
      const angle = (p.TWO_PI / 6) * i;
      const r = i % 2 === 0 ? size : size * 0.6;
      p.vertex(p.cos(angle) * r, p.sin(angle) * r);
    }
    p.endShape(p.CLOSE);
    
    // Inner shine
    p.fill(255, 255, 200);
    p.noStroke();
    p.circle(0, 0, size * 0.3);
    p.pop();
  }

  checkCollision(player) {
    if (this.collected) return false;
    const dist = this.p.dist(this.x, this.y, player.x + player.p.gameState.scrollOffset, player.y);
    return dist < this.radius + player.radius;
  }
}