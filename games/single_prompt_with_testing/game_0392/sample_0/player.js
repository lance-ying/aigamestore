import { GAME_AREA_X, GAME_AREA_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 8;
    this.height = 8;
    this.speed = 4;
    this.slowSpeed = 2;
    this.shooting = false;
    this.slowMode = false;
    this.shootCooldown = 0;
    this.hitboxRadius = 2;
    this.options = 1;
  }

  update() {
    const keys = this.p.keyStates || {};
    
    // Movement
    let moveSpeed = this.slowMode ? this.slowSpeed : this.speed;
    
    if (keys[37] || keys[65]) this.x -= moveSpeed; // LEFT or A
    if (keys[39] || keys[68]) this.x += moveSpeed; // RIGHT or D
    if (keys[38] || keys[87]) this.y -= moveSpeed; // UP or W
    if (keys[40] || keys[83]) this.y += moveSpeed; // DOWN or S
    
    // Constrain to game area
    this.x = this.p.constrain(this.x, GAME_AREA_X + 10, GAME_AREA_X + GAME_AREA_WIDTH - 10);
    this.y = this.p.constrain(this.y, 20, CANVAS_HEIGHT - 20);
    
    // Shooting
    if (this.shootCooldown > 0) this.shootCooldown--;
  }

  shoot(bullets) {
    if (this.shootCooldown === 0) {
      this.shootCooldown = 6;
      
      // Main shot
      bullets.push(new PlayerBullet(this.p, this.x, this.y - 10, 0, -8, 5));
      
      // Options
      const optionPositions = this.getOptionPositions();
      for (let pos of optionPositions) {
        bullets.push(new PlayerBullet(this.p, pos.x, pos.y, 0, -8, 4));
      }
    }
  }

  getOptionPositions() {
    const positions = [];
    const radius = 30;
    const angleOffset = this.p.frameCount * 0.05;
    
    for (let i = 0; i < this.options; i++) {
      const angle = (i / this.options) * this.p.TWO_PI + angleOffset;
      positions.push({
        x: this.x + this.p.cos(angle) * radius,
        y: this.y + this.p.sin(angle) * radius
      });
    }
    return positions;
  }

  render() {
    const p = this.p;
    
    // Draw options
    const optionPositions = this.getOptionPositions();
    for (let pos of optionPositions) {
      p.push();
      p.fill(100, 200, 255);
      p.noStroke();
      p.circle(pos.x, pos.y, 12);
      p.fill(200, 230, 255);
      p.circle(pos.x, pos.y, 6);
      p.pop();
    }
    
    // Draw player
    p.push();
    p.fill(255, 50, 80);
    p.noStroke();
    p.circle(this.x, this.y, this.width * 2);
    
    // Draw bow/ribbon
    p.fill(255, 200, 220);
    p.circle(this.x - 6, this.y - 8, 8);
    p.circle(this.x + 6, this.y - 8, 8);
    
    // Hitbox indicator when slow
    if (this.slowMode) {
      p.noFill();
      p.stroke(255, 255, 255, 150);
      p.strokeWeight(1);
      p.circle(this.x, this.y, this.hitboxRadius * 2);
    }
    p.pop();
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      radius: this.hitboxRadius
    };
  }
}

export class PlayerBullet {
  constructor(p, x, y, vx, vy, damage = 5) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.radius = 4;
    this.active = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    
    if (this.y < -10 || this.x < 0 || this.x > GAME_AREA_X + GAME_AREA_WIDTH) {
      this.active = false;
    }
  }

  render() {
    this.p.push();
    this.p.fill(255, 255, 150);
    this.p.noStroke();
    this.p.circle(this.x, this.y, this.radius * 2);
    this.p.fill(255, 255, 255);
    this.p.circle(this.x, this.y, this.radius);
    this.p.pop();
  }
}