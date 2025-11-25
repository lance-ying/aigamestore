export class Particle {
  constructor(p, x, y, color, type = 'confetti') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = p.random(-3, 3);
    this.vy = p.random(-8, -3);
    this.life = 1.0;
    this.color = color;
    this.size = p.random(5, 12);
    this.rotation = p.random(p.TWO_PI);
    this.rotationSpeed = p.random(-0.2, 0.2);
    this.type = type;
  }

  update() {
    const p = this.p;
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.3; // gravity
    this.life -= 0.02;
    this.rotation += this.rotationSpeed;
  }

  render() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    
    const alpha = this.life * 255;
    
    if (this.type === 'confetti') {
      p.fill(this.color[0], this.color[1], this.color[2], alpha);
      p.noStroke();
      p.rect(-this.size/2, -this.size/2, this.size, this.size * 1.5);
    } else if (this.type === 'star') {
      p.fill(this.color[0], this.color[1], this.color[2], alpha);
      p.noStroke();
      this.drawStar(0, 0, this.size/2, this.size, 5);
    }
    
    p.pop();
  }

  drawStar(x, y, radius1, radius2, npoints) {
    const p = this.p;
    const angle = p.TWO_PI / npoints;
    const halfAngle = angle / 2.0;
    p.beginShape();
    for (let a = -p.PI/2; a < p.TWO_PI - p.PI/2; a += angle) {
      let sx = x + p.cos(a) * radius2;
      let sy = y + p.sin(a) * radius2;
      p.vertex(sx, sy);
      sx = x + p.cos(a + halfAngle) * radius1;
      sy = y + p.sin(a + halfAngle) * radius1;
      p.vertex(sx, sy);
    }
    p.endShape(p.CLOSE);
  }

  isDead() {
    return this.life <= 0;
  }
}