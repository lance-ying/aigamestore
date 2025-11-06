import { CENTER_X, CENTER_Y, TUNNEL_RADIUS } from './globals.js';

export class Enemy {
  constructor(angle, type = 'basic') {
    this.angle = angle;
    this.type = type;
    this.radius = type === 'basic' ? 12 : 10;
    this.speed = type === 'basic' ? 1.2 : 2.0;
    this.distanceFromCenter = TUNNEL_RADIUS + 20;
    this.isActive = true;
    this.health = type === 'basic' ? 1 : 2;
    this.maxHealth = this.health;
    this.color = type === 'basic' ? [255, 50, 50] : [255, 100, 200];
    this.rotationAngle = 0;
    this.rotationSpeed = 0.1;
  }

  update() {
    if (!this.isActive) return;

    this.distanceFromCenter -= this.speed;
    this.rotationAngle += this.rotationSpeed;

    // Deactivate if reached center
    if (this.distanceFromCenter < 0) {
      this.isActive = false;
    }
  }

  getScreenX() {
    return CENTER_X + Math.cos(this.angle) * this.distanceFromCenter;
  }

  getScreenY() {
    return CENTER_Y + Math.sin(this.angle) * this.distanceFromCenter;
  }

  takeDamage(damage = 1) {
    this.health -= damage;
    if (this.health <= 0) {
      this.isActive = false;
      return true; // Enemy destroyed
    }
    return false; // Enemy still alive
  }

  draw(p) {
    if (!this.isActive) return;

    const x = this.getScreenX();
    const y = this.getScreenY();

    p.push();
    p.translate(x, y);
    p.rotate(this.rotationAngle);

    if (this.type === 'basic') {
      // Basic enemy - hexagonal bug
      p.fill(...this.color);
      p.stroke(200, 100, 100);
      p.strokeWeight(1.5);
      p.beginShape();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 / 6) * i;
        p.vertex(Math.cos(a) * this.radius, Math.sin(a) * this.radius);
      }
      p.endShape(p.CLOSE);

      // Eyes
      p.fill(255, 255, 0);
      p.noStroke();
      p.circle(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.3);
      p.circle(this.radius * 0.3, -this.radius * 0.3, this.radius * 0.3);
    } else {
      // Fast enemy - angular bug
      p.fill(...this.color);
      p.stroke(255, 150, 200);
      p.strokeWeight(1.5);
      p.beginShape();
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 / 8) * i;
        const r = i % 2 === 0 ? this.radius * 1.2 : this.radius * 0.7;
        p.vertex(Math.cos(a) * r, Math.sin(a) * r);
      }
      p.endShape(p.CLOSE);

      // Center core
      p.fill(255, 255, 255);
      p.noStroke();
      p.circle(0, 0, this.radius * 0.4);
    }

    // Health bar if damaged
    if (this.health < this.maxHealth) {
      p.stroke(255);
      p.strokeWeight(2);
      p.line(-this.radius, -this.radius - 5, this.radius, -this.radius - 5);
      p.stroke(0, 255, 0);
      const healthWidth = (this.health / this.maxHealth) * (this.radius * 2);
      p.line(-this.radius, -this.radius - 5, -this.radius + healthWidth, -this.radius - 5);
    }

    p.pop();
  }
}