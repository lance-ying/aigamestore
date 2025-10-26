// entities.js - Game entities like obstacles and particles

export class Obstacle {
  constructor(x, y, width, height, type, moveSpeed = 0, moveRange = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.moveSpeed = moveSpeed;
    this.moveRange = moveRange;
    this.moveOffset = 0;
    this.moveDirection = 1;
    this.initialX = x;
    this.initialY = y;
  }

  update() {
    if (this.type === "moving") {
      this.moveOffset += this.moveSpeed * this.moveDirection;
      if (Math.abs(this.moveOffset) > this.moveRange) {
        this.moveDirection *= -1;
      }
      this.x = this.initialX + this.moveOffset;
    }
  }

  render(p, cameraOffset) {
    p.push();
    p.translate(-cameraOffset, 0);
    
    if (this.type === "moving") {
      p.fill(255, 100, 0);
    } else {
      p.fill(200, 0, 0);
    }
    p.noStroke();
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    p.pop();
  }
}

export class Particle {
  constructor(x, y, vx, vy, life, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.color = color;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }

  isDead() {
    return this.life <= 0;
  }

  render(p, cameraOffset) {
    p.push();
    p.translate(-cameraOffset, 0);
    const alpha = (this.life / this.maxLife) * 255;
    p.fill(...this.color, alpha);
    p.noStroke();
    p.circle(this.x, this.y, 4);
    p.pop();
  }
}

export class TapFeedback {
  constructor(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 60;
    this.offsetY = 0;
  }

  update() {
    this.life--;
    this.offsetY -= 1;
  }

  isDead() {
    return this.life <= 0;
  }

  render(p, cameraOffset) {
    p.push();
    p.translate(-cameraOffset, 0);
    const alpha = (this.life / 60) * 255;
    p.fill(...this.color, alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text(this.text, this.x, this.y + this.offsetY);
    p.pop();
  }
}