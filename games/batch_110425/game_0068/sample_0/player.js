import { CENTER_X, CENTER_Y, PLAYER_ORBIT_RADIUS, PLAYER_RADIUS } from './globals.js';

export class Player {
  constructor() {
    this.angle = 0; // angle in radians around the center
    this.rotationSpeed = 0.08; // radians per frame
    this.health = 1;
    this.isAlive = true;
  }

  update(inputState) {
    if (!this.isAlive) return;

    // Rotate based on input
    if (inputState.leftPressed) {
      this.angle -= this.rotationSpeed;
    }
    if (inputState.rightPressed) {
      this.angle += this.rotationSpeed;
    }

    // Normalize angle
    this.angle = this.angle % (Math.PI * 2);
  }

  getScreenX() {
    return CENTER_X + Math.cos(this.angle) * PLAYER_ORBIT_RADIUS;
  }

  getScreenY() {
    return CENTER_Y + Math.sin(this.angle) * PLAYER_ORBIT_RADIUS;
  }

  getGameX() {
    return this.getScreenX();
  }

  getGameY() {
    return this.getScreenY();
  }

  takeDamage() {
    this.health--;
    if (this.health <= 0) {
      this.isAlive = false;
    }
  }

  draw(p) {
    if (!this.isAlive) return;

    p.push();
    p.translate(this.getScreenX(), this.getScreenY());
    p.rotate(this.angle);

    // Ship body - triangle pointing outward
    p.fill(100, 200, 255);
    p.stroke(200, 230, 255);
    p.strokeWeight(2);
    p.beginShape();
    p.vertex(PLAYER_RADIUS, 0);
    p.vertex(-PLAYER_RADIUS * 0.7, -PLAYER_RADIUS * 0.6);
    p.vertex(-PLAYER_RADIUS * 0.7, PLAYER_RADIUS * 0.6);
    p.endShape(p.CLOSE);

    // Cockpit
    p.fill(150, 220, 255);
    p.noStroke();
    p.circle(PLAYER_RADIUS * 0.3, 0, PLAYER_RADIUS * 0.5);

    // Engine glow
    p.fill(255, 150, 50, 150);
    p.circle(-PLAYER_RADIUS * 0.7, 0, PLAYER_RADIUS * 0.4);

    p.pop();
  }
}