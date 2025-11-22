import { FISH_TYPES, PROJECTILE_RADIUS, PROJECTILE_SPEED, PROJECTILE_DAMAGE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Projectile {
  constructor(x, y, angle, p, weaponType = 'Normal') {
    this.x = x;
    this.y = y;
    this.angle = angle; // in degrees
    this.radius = PROJECTILE_RADIUS;
    this.speed = PROJECTILE_SPEED;
    this.active = true;
    this.p = p;
    this.weaponType = weaponType;
    this.piercing = weaponType === 'Piercing';
    this.hitCount = 0;
    
    // Adjust properties based on weapon type
    if (weaponType === 'Rapid') {
      this.speed = PROJECTILE_SPEED * 1.5;
      this.radius = PROJECTILE_RADIUS * 0.8;
    } else if (weaponType === 'Piercing') {
      this.radius = PROJECTILE_RADIUS * 0.7;
    }
    
    // Convert angle to velocity
    const radians = this.p.radians(angle);
    this.vx = this.p.sin(radians) * this.speed;
    this.vy = -this.p.cos(radians) * this.speed;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    
    // Deactivate if off screen
    if (this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.active = false;
    }
  }
  
  draw() {
    this.p.push();
    
    if (this.weaponType === 'Rapid') {
      this.p.fill(255, 100, 100);
      this.p.stroke(255, 50, 50);
      this.p.strokeWeight(1);
      this.p.circle(this.x, this.y, this.radius * 2);
    } else if (this.weaponType === 'Piercing') {
      this.p.fill(100, 255, 255);
      this.p.stroke(50, 200, 255);
      this.p.strokeWeight(2);
      // Draw as elongated projectile
      this.p.push();
      this.p.translate(this.x, this.y);
      this.p.rotate(this.p.atan2(this.vy, this.vx));
      this.p.ellipse(0, 0, this.radius * 4, this.radius * 2);
      this.p.pop();
    } else if (this.weaponType === 'Spread') {
      this.p.fill(255, 200, 100);
      this.p.stroke(255, 150, 50);
      this.p.strokeWeight(1);
      this.p.circle(this.x, this.y, this.radius * 2);
    } else {
      this.p.fill(255, 255, 100);
      this.p.noStroke();
      this.p.circle(this.x, this.y, this.radius * 2);
    }
    
    this.p.pop();
  }
}

export class Fish {
  constructor(type, x, y, direction, p) {
    this.p = p;
    this.type = type;
    this.config = FISH_TYPES[type];
    this.x = x;
    this.y = y;
    this.radius = this.config.radius;
    this.health = this.config.health;
    this.maxHealth = this.config.health;
    this.points = this.config.points;
    this.direction = direction; // angle in radians
    this.speed = this.p.random(this.config.minSpeed, this.config.maxSpeed);
    this.active = true;
    this.hitFlashTimer = 0;
    
    // Movement variation for curves
    this.curveOffset = this.p.random(-0.02, 0.02);
    this.frameCount = 0;
  }
  
  update() {
    this.frameCount++;
    
    // Apply curve to movement
    const curvedDirection = this.direction + this.p.sin(this.frameCount * 0.05) * this.curveOffset;
    
    this.x += this.p.cos(curvedDirection) * this.speed;
    this.y += this.p.sin(curvedDirection) * this.speed;
    
    // Special movement for jellyfish (bobbing)
    if (this.type === 'JELLYFISH') {
      this.y += this.p.sin(this.frameCount * 0.1) * 0.5;
    }
    
    // Deactivate if off screen
    const margin = this.radius + 50;
    if (this.x < -margin || this.x > CANVAS_WIDTH + margin || 
        this.y < -margin || this.y > CANVAS_HEIGHT + margin) {
      this.active = false;
    }
    
    // Update hit flash
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer--;
    }
  }
  
  takeDamage(damage) {
    this.health -= damage;
    this.hitFlashTimer = 10;
    return this.health <= 0;
  }
  
  draw() {
    this.p.push();
    this.p.translate(this.x, this.y);
    this.p.rotate(this.direction);
    
    // Draw hit flash
    if (this.hitFlashTimer > 0) {
      this.p.fill(255, 0, 0, 100);
      this.p.noStroke();
      this.p.circle(0, 0, this.radius * 2.5);
    }
    
    // Draw fish body
    const color = this.config.color;
    this.p.fill(...color);
    this.p.stroke(color[0] * 0.7, color[1] * 0.7, color[2] * 0.7);
    this.p.strokeWeight(2);
    
    if (this.type === 'SHARK') {
      // Triangular shark shape
      this.p.beginShape();
      this.p.vertex(this.radius, 0);
      this.p.vertex(-this.radius * 0.8, -this.radius * 0.5);
      this.p.vertex(-this.radius * 0.8, this.radius * 0.5);
      this.p.endShape(this.p.CLOSE);
      
      // Dorsal fin
      this.p.triangle(-this.radius * 0.3, -this.radius * 0.5,
                      -this.radius * 0.3, -this.radius * 1.2,
                      this.radius * 0.1, -this.radius * 0.5);
    } else if (this.type === 'SQUID') {
      // Body
      this.p.ellipse(0, 0, this.radius * 2, this.radius * 1.5);
      
      // Tentacles
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * this.p.TWO_PI - this.p.PI;
        const tentacleLength = this.radius * 1.5;
        const wave = this.p.sin(this.frameCount * 0.1 + i) * 5;
        this.p.line(-this.radius * 0.5, 0,
                   -this.radius * 0.5 - tentacleLength + wave,
                   this.p.sin(angle) * this.radius * 0.8);
      }
      
      // Eye
      this.p.fill(255);
      this.p.circle(this.radius * 0.3, 0, this.radius * 0.4);
      this.p.fill(0);
      this.p.circle(this.radius * 0.4, 0, this.radius * 0.2);
    } else if (this.type === 'MANTA') {
      // Manta ray wings
      this.p.beginShape();
      this.p.vertex(this.radius, 0);
      this.p.vertex(-this.radius * 0.5, -this.radius * 1.2);
      this.p.vertex(-this.radius, 0);
      this.p.vertex(-this.radius * 0.5, this.radius * 1.2);
      this.p.endShape(this.p.CLOSE);
    } else if (this.type === 'JELLYFISH') {
      // Bell/dome
      this.p.arc(0, 0, this.radius * 2, this.radius * 2, this.p.PI, this.p.TWO_PI);
      
      // Tentacles
      this.p.noFill();
      for (let i = 0; i < 6; i++) {
        const xOffset = (i - 2.5) * this.radius * 0.4;
        const wave = this.p.sin(this.frameCount * 0.15 + i) * 3;
        this.p.bezier(xOffset, 0,
                     xOffset + wave, this.radius * 0.5,
                     xOffset - wave, this.radius,
                     xOffset, this.radius * 1.5);
      }
      this.p.fill(...color);
    } else if (this.type === 'SWORDFISH') {
      // Body
      this.p.ellipse(0, 0, this.radius * 2, this.radius * 1.2);
      
      // Sword/bill
      this.p.strokeWeight(3);
      this.p.line(this.radius, 0, this.radius * 1.8, 0);
      
      // Dorsal fin
      this.p.strokeWeight(2);
      this.p.triangle(-this.radius * 0.2, -this.radius * 0.6,
                     -this.radius * 0.2, -this.radius * 1.3,
                     this.radius * 0.2, -this.radius * 0.6);
      
      // Tail
      this.p.triangle(-this.radius, -this.radius * 0.5,
                     -this.radius, this.radius * 0.5,
                     -this.radius * 1.5, 0);
    } else if (this.type === 'SEAHORSE') {
      // S-shaped body
      this.p.noFill();
      this.p.strokeWeight(this.radius * 0.5);
      this.p.bezier(0, -this.radius,
                   this.radius * 0.3, -this.radius * 0.3,
                   -this.radius * 0.3, this.radius * 0.3,
                   0, this.radius);
      
      // Head
      this.p.fill(...color);
      this.p.strokeWeight(2);
      this.p.circle(0, -this.radius, this.radius * 0.7);
      
      // Snout
      this.p.strokeWeight(3);
      this.p.line(0, -this.radius, this.radius * 0.5, -this.radius);
    } else if (this.type === 'CLOWNFISH') {
      // Body with stripes
      this.p.ellipse(0, 0, this.radius * 2, this.radius * 1.5);
      
      // White stripes
      this.p.fill(255);
      this.p.noStroke();
      this.p.ellipse(-this.radius * 0.5, 0, this.radius * 0.4, this.radius * 1.6);
      this.p.ellipse(this.radius * 0.3, 0, this.radius * 0.4, this.radius * 1.6);
      
      // Tail
      this.p.fill(...color);
      this.p.stroke(color[0] * 0.7, color[1] * 0.7, color[2] * 0.7);
      this.p.strokeWeight(2);
      this.p.triangle(-this.radius, -this.radius * 0.3,
                     -this.radius, this.radius * 0.3,
                     -this.radius * 1.5, 0);
    } else {
      // Basic oval fish
      this.p.ellipse(0, 0, this.radius * 2, this.radius * 1.5);
      
      // Tail
      this.p.triangle(-this.radius, -this.radius * 0.3,
                     -this.radius, this.radius * 0.3,
                     -this.radius * 1.5, 0);
    }
    
    // Draw health bar for larger fish
    if (this.maxHealth > 3) {
      this.p.noStroke();
      const barWidth = this.radius * 2;
      const barHeight = 4;
      const healthPercent = this.health / this.maxHealth;
      
      // Background
      this.p.fill(50, 50, 50);
      this.p.rect(-barWidth / 2, -this.radius - 15, barWidth, barHeight);
      
      // Health
      this.p.fill(...(healthPercent > 0.3 ? [50, 255, 50] : [255, 50, 50]));
      this.p.rect(-barWidth / 2, -this.radius - 15, barWidth * healthPercent, barHeight);
    }
    
    this.p.pop();
  }
}

export class Particle {
  constructor(x, y, p) {
    this.x = x;
    this.y = y;
    this.vx = p.random(-3, 3);
    this.vy = p.random(-3, 3);
    this.life = 255;
    this.p = p;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 8;
  }
  
  draw() {
    this.p.push();
    this.p.noStroke();
    this.p.fill(255, 200, 100, this.life);
    this.p.circle(this.x, this.y, 6);
    this.p.pop();
  }
  
  isDead() {
    return this.life <= 0;
  }
}

export class FloatingText {
  constructor(text, x, y, p) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.life = 60;
    this.p = p;
  }
  
  update() {
    this.y -= 1;
    this.life -= 2;
  }
  
  draw() {
    this.p.push();
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(20);
    this.p.fill(255, 255, 0, this.life * 4);
    this.p.strokeWeight(3);
    this.p.stroke(0, 0, 0, this.life * 4);
    this.p.text(this.text, this.x, this.y);
    this.p.pop();
  }
  
  isDead() {
    return this.life <= 0;
  }
}