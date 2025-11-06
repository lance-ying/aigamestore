// environment.js - Environmental objects

export class Wall {
  constructor(p, x, y, w, h) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  render() {
    this.p.fill(40, 40, 40);
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.rect(this.x, this.y, this.w, this.h);
  }
}

export class Vent {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.size = 30;
    this.linkedVent = null;
  }

  linkTo(otherVent) {
    this.linkedVent = otherVent;
    otherVent.linkedVent = this;
  }

  render() {
    this.p.push();
    this.p.fill(100, 100, 100);
    this.p.stroke(60, 60, 60);
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(this.x, this.y, this.size, this.size);
    
    // Grate pattern
    this.p.stroke(40, 40, 40);
    this.p.strokeWeight(1);
    for (let i = -this.size / 2 + 5; i < this.size / 2; i += 5) {
      this.p.line(this.x + i, this.y - this.size / 2, this.x + i, this.y + this.size / 2);
    }
    this.p.pop();
  }
}

export class Barrel {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.size = 25;
    this.exploded = false;
    this.explosionTimer = 0;
  }

  update() {
    if (this.explosionTimer > 0) {
      this.explosionTimer--;
    }
  }

  render() {
    if (this.exploded && this.explosionTimer > 0) {
      // Explosion effect
      const radius = 60 * (1 - this.explosionTimer / 20);
      this.p.push();
      this.p.noStroke();
      this.p.fill(255, 100, 0, 150 * (this.explosionTimer / 20));
      this.p.circle(this.x, this.y, radius * 2);
      this.p.fill(255, 200, 0, 100 * (this.explosionTimer / 20));
      this.p.circle(this.x, this.y, radius * 1.5);
      this.p.pop();
    } else if (!this.exploded) {
      this.p.push();
      this.p.fill(200, 50, 50);
      this.p.stroke(0);
      this.p.strokeWeight(2);
      this.p.circle(this.x, this.y, this.size);
      
      // Black band
      this.p.fill(0);
      this.p.noStroke();
      this.p.rectMode(this.p.CENTER);
      this.p.rect(this.x, this.y, this.size, this.size / 4);
      this.p.pop();
    }
  }
}