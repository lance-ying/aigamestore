import { COURT, PLAYER_SIZE, gameState } from './globals.js';

export class Player {
  constructor(x, y, isOpponent = false) {
    this.x = x;
    this.y = y;
    this.isOpponent = isOpponent;
    this.targetX = x;
    this.speed = isOpponent ? 3 : 4;
    this.hitRadius = 30;
    this.color = isOpponent ? [255, 0, 0] : [0, 100, 255];
  }

  update(p) {
    // Auto-move towards target
    const dx = this.targetX - this.x;
    if (Math.abs(dx) > 1) {
      this.x += Math.sign(dx) * Math.min(this.speed, Math.abs(dx));
    }

    // Keep within court bounds
    this.x = p.constrain(this.x, COURT.x + PLAYER_SIZE, COURT.x + COURT.width - PLAYER_SIZE);
  }

  setTarget(targetX) {
    this.targetX = targetX;
  }

  draw(p) {
    p.push();
    p.fill(...this.color);
    p.noStroke();
    p.circle(this.x, this.y, PLAYER_SIZE);
    
    // Draw racket
    p.stroke(...this.color);
    p.strokeWeight(3);
    const racketAngle = this.isOpponent ? p.PI / 4 : -p.PI / 4;
    const racketX = this.x + p.cos(racketAngle) * 15;
    const racketY = this.y + p.sin(racketAngle) * 15;
    p.line(this.x, this.y, racketX, racketY);
    p.pop();
  }

  canHitBall(ball) {
    const dist = p5.Vector.dist(
      new p5.Vector(this.x, this.y),
      new p5.Vector(ball.x, ball.y)
    );
    return dist < this.hitRadius;
  }
}