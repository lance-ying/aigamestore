// entities.js - Game entity classes

import { 
  SEGMENT_SIZE, WORM_SPEED, TURN_SPEED, INITIAL_WORM_LENGTH,
  ARENA_WIDTH, ARENA_HEIGHT, FOOD_SIZE, FOOD_VALUE,
  MIN_WORM_SIZE, SPEED_BOOST_MULTIPLIER, SPEED_BOOST_DRAIN,
  MAGNET_DURATION, MAGNET_RANGE
} from './globals.js';

export class Worm {
  constructor(x, y, isPlayer = false, name = "AI") {
    this.segments = [];
    this.x = x;
    this.y = y;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = WORM_SPEED;
    this.targetAngle = this.angle;
    this.isPlayer = isPlayer;
    this.alive = true;
    this.name = name;
    this.color = this.isPlayer ? [100, 200, 255] : this.randomColor();
    this.length = INITIAL_WORM_LENGTH;
    this.mass = INITIAL_WORM_LENGTH;
    this.speedBoostActive = false;
    this.magnetActive = false;
    this.magnetTimer = 0;
    this.powerups = { magnet: 0, speedBoost: 0 };
    
    // Initialize segments
    for (let i = 0; i < this.length; i++) {
      this.segments.push({
        x: this.x - i * SEGMENT_SIZE * Math.cos(this.angle),
        y: this.y - i * SEGMENT_SIZE * Math.sin(this.angle)
      });
    }
  }

  randomColor() {
    const colors = [
      [255, 100, 100], [100, 255, 100], [255, 255, 100],
      [255, 100, 255], [100, 255, 255], [255, 150, 100]
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  setTargetAngle(angle) {
    this.targetAngle = angle;
  }

  update(p) {
    if (!this.alive) return;

    // Update angle smoothly toward target
    let angleDiff = this.targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.angle += angleDiff * TURN_SPEED;

    // Apply speed
    let currentSpeed = this.speed;
    if (this.speedBoostActive) {
      currentSpeed *= SPEED_BOOST_MULTIPLIER;
      this.mass -= SPEED_BOOST_DRAIN;
      if (this.mass < MIN_WORM_SIZE) {
        this.mass = MIN_WORM_SIZE;
        this.speedBoostActive = false;
      }
    }

    // Move head
    this.x += Math.cos(this.angle) * currentSpeed;
    this.y += Math.sin(this.angle) * currentSpeed;

    // Wrap around arena
    if (this.x < 0) this.x = ARENA_WIDTH;
    if (this.x > ARENA_WIDTH) this.x = 0;
    if (this.y < 0) this.y = ARENA_HEIGHT;
    if (this.y > ARENA_HEIGHT) this.y = 0;

    // Update segments
    this.segments.unshift({ x: this.x, y: this.y });
    
    // Update length based on mass
    this.length = Math.floor(this.mass);
    while (this.segments.length > this.length) {
      this.segments.pop();
    }

    // Update magnet timer
    if (this.magnetActive) {
      this.magnetTimer--;
      if (this.magnetTimer <= 0) {
        this.magnetActive = false;
      }
    }
  }

  grow(amount) {
    this.mass += amount;
    if (this.mass < MIN_WORM_SIZE) {
      this.mass = MIN_WORM_SIZE;
    }
  }

  activateSpeedBoost() {
    if (this.mass > MIN_WORM_SIZE * 1.5) {
      this.speedBoostActive = true;
    }
  }

  deactivateSpeedBoost() {
    this.speedBoostActive = false;
  }

  activateMagnet() {
    if (this.powerups.magnet > 0) {
      this.magnetActive = true;
      this.magnetTimer = MAGNET_DURATION;
      this.powerups.magnet--;
    }
  }

  getHead() {
    return this.segments[0] || { x: this.x, y: this.y };
  }

  draw(p, camera) {
    if (!this.alive) return;

    p.push();
    
    // Draw segments
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const seg = this.segments[i];
      const screenX = seg.x - camera.x;
      const screenY = seg.y - camera.y;
      
      const size = SEGMENT_SIZE + (i === 0 ? 2 : 0);
      const brightness = 1 - (i / this.segments.length) * 0.3;
      
      p.fill(...(this.color.map(c => c * brightness)));
      p.noStroke();
      
      // Head is slightly different
      if (i === 0) {
        p.stroke(255, 255, 255, 150);
        p.strokeWeight(1);
        p.circle(screenX, screenY, size * 2.5);
        
        // Draw eyes
        const eyeOffset = 3;
        const eyeAngle1 = this.angle + Math.PI / 4;
        const eyeAngle2 = this.angle - Math.PI / 4;
        p.fill(255);
        p.circle(screenX + Math.cos(eyeAngle1) * eyeOffset, 
                screenY + Math.sin(eyeAngle1) * eyeOffset, 3);
        p.circle(screenX + Math.cos(eyeAngle2) * eyeOffset, 
                screenY + Math.sin(eyeAngle2) * eyeOffset, 3);
      } else {
        p.circle(screenX, screenY, size * 2);
      }
    }

    // Draw effects
    if (this.speedBoostActive) {
      p.stroke(255, 200, 0, 100);
      p.strokeWeight(2);
      p.noFill();
      const head = this.getHead();
      p.circle(head.x - camera.x, head.y - camera.y, SEGMENT_SIZE * 4);
    }

    if (this.magnetActive) {
      p.stroke(255, 100, 255, 80);
      p.strokeWeight(2);
      p.noFill();
      const head = this.getHead();
      const radius = MAGNET_RANGE * (this.magnetTimer / MAGNET_DURATION);
      p.circle(head.x - camera.x, head.y - camera.y, radius * 2);
    }

    p.pop();
  }

  die() {
    this.alive = false;
  }
}

export class Food {
  constructor(x, y, value = FOOD_VALUE) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.size = FOOD_SIZE;
    this.hue = Math.random() * 360;
    this.collected = false;
  }

  draw(p, camera) {
    if (this.collected) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;
    
    p.push();
    p.noStroke();
    
    // Convert HSV to RGB for colorful food
    p.colorMode(p.HSB);
    p.fill(this.hue, 80, 90);
    p.circle(screenX, screenY, this.size * 2);
    
    p.fill(this.hue, 60, 100);
    p.circle(screenX, screenY, this.size * 1.2);
    
    p.colorMode(p.RGB);
    p.pop();
  }

  collect() {
    this.collected = true;
  }
}

export class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'magnet' or 'speed'
    this.collected = false;
    this.size = 12;
    this.rotation = 0;
  }

  update(p) {
    this.rotation += 0.05;
  }

  draw(p, camera) {
    if (this.collected) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;
    
    p.push();
    p.translate(screenX, screenY);
    p.rotate(this.rotation);
    
    if (this.type === 'magnet') {
      // Draw magnet symbol
      p.fill(255, 100, 255);
      p.stroke(200, 50, 200);
      p.strokeWeight(2);
      p.rect(-this.size/2, -this.size/2, this.size, this.size, 2);
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text('M', 0, 0);
    } else if (this.type === 'speed') {
      // Draw speed boost symbol
      p.fill(255, 200, 0);
      p.stroke(200, 150, 0);
      p.strokeWeight(2);
      p.beginShape();
      p.vertex(0, -this.size);
      p.vertex(this.size/2, 0);
      p.vertex(0, this.size/2);
      p.vertex(-this.size/2, 0);
      p.endShape(p.CLOSE);
    }
    
    p.pop();
  }

  collect() {
    this.collected = true;
  }
}