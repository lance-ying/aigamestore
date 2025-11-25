// projectiles.js - Projectile and attack pattern systems
export class Projectile {
  constructor(x, y, vx, vy, size, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.color = color;
    this.active = true;
    this.rotation = 0;
    this.rotationSpeed = 0;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    
    // Deactivate if out of bounds
    if (this.x < 0 || this.x > 600 || this.y < 200 || this.y > 400) {
      this.active = false;
    }
  }

  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    p.fill(...this.color);
    p.noStroke();
    
    // Different shapes for visual variety
    if (this.size < 10) {
      p.circle(0, 0, this.size);
    } else {
      p.rect(-this.size / 2, -this.size / 2, this.size, this.size);
    }
    
    p.pop();
  }

  checkCollision(player, p) {
    const dist = p.dist(this.x, this.y, player.x, player.y);
    return dist < (this.size / 2 + player.size / 2);
  }
}

export class AttackPatternManager {
  constructor() {
    this.projectiles = [];
    this.frameCount = 0;
    this.maxDuration = 300; // 5 seconds at 60fps
    this.currentPattern = null;
  }

  startPattern(patternName, p) {
    this.projectiles = [];
    this.frameCount = 0;
    this.currentPattern = patternName;
    
    // Seed for deterministic patterns
    p.randomSeed(42 + (patternName.charCodeAt(0) || 0));
  }

  update(p) {
    this.frameCount++;
    
    // Generate projectiles based on pattern
    if (this.currentPattern) {
      this.generateProjectiles(p);
    }
    
    // Update all projectiles
    for (let proj of this.projectiles) {
      proj.update();
    }
    
    // Remove inactive projectiles
    this.projectiles = this.projectiles.filter(proj => proj.active);
    
    return this.frameCount >= this.maxDuration;
  }

  generateProjectiles(p) {
    const centerX = 300;
    const centerY = 305;
    
    switch (this.currentPattern) {
      case "SIMPLE_FLIES":
        if (this.frameCount % 30 === 0) {
          const angle = p.random(0, p.TWO_PI);
          const speed = 1.5;
          this.projectiles.push(new Projectile(
            centerX + p.cos(angle) * 150,
            centerY + p.sin(angle) * 75,
            -p.cos(angle) * speed,
            -p.sin(angle) * speed,
            8,
            [100, 200, 100]
          ));
        }
        break;
        
      case "BUTTERFLIES":
        if (this.frameCount % 25 === 0) {
          const startX = p.random(0, 1) > 0.5 ? 160 : 440;
          const targetY = 240 + p.random(0, 130);
          this.projectiles.push(new Projectile(
            startX,
            targetY,
            (startX < 300 ? 1.2 : -1.2),
            p.sin(this.frameCount * 0.05) * 0.5,
            10,
            [255, 150, 255]
          ));
        }
        break;
        
      case "PLANES":
        if (this.frameCount % 40 === 0) {
          const lane = p.floor(p.random(0, 3));
          const yPos = 250 + lane * 40;
          const proj = new Projectile(
            460,
            yPos,
            -2.5,
            0,
            15,
            [150, 150, 255]
          );
          proj.rotationSpeed = 0.1;
          this.projectiles.push(proj);
        }
        
        // Add occasional vertical attacks
        if (this.frameCount % 60 === 0) {
          this.projectiles.push(new Projectile(
            centerX + p.random(-100, 100),
            220,
            0,
            1.5,
            12,
            [200, 100, 200]
          ));
        }
        break;
    }
  }

  draw(p) {
    for (let proj of this.projectiles) {
      proj.draw(p);
    }
  }

  checkCollisions(player, p) {
    for (let proj of this.projectiles) {
      if (proj.active && proj.checkCollision(player, p)) {
        proj.active = false;
        return true;
      }
    }
    return false;
  }

  clear() {
    this.projectiles = [];
  }
}