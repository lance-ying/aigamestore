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
      // EASY PATTERNS
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
        
      case "SIMPLE_BOUNCES":
        if (this.frameCount % 35 === 0) {
          const startY = 240 + p.random(0, 130);
          const proj = new Projectile(
            160,
            startY,
            1.0,
            p.random(-0.5, 0.5),
            12,
            [150, 255, 150]
          );
          this.projectiles.push(proj);
        }
        break;
      
      // MEDIUM PATTERNS
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
        
      case "EYES":
        if (this.frameCount % 30 === 0) {
          const side = p.floor(p.random(0, 4)); // 4 sides
          let x, y, vx, vy;
          
          if (side === 0) { // Top
            x = 160 + p.random(0, 280);
            y = 220;
            vx = p.random(-0.5, 0.5);
            vy = 1.8;
          } else if (side === 1) { // Bottom
            x = 160 + p.random(0, 280);
            y = 390;
            vx = p.random(-0.5, 0.5);
            vy = -1.8;
          } else if (side === 2) { // Left
            x = 140;
            y = 240 + p.random(0, 130);
            vx = 1.8;
            vy = p.random(-0.5, 0.5);
          } else { // Right
            x = 460;
            y = 240 + p.random(0, 130);
            vx = -1.8;
            vy = p.random(-0.5, 0.5);
          }
          
          this.projectiles.push(new Projectile(x, y, vx, vy, 11, [255, 100, 100]));
        }
        break;
        
      case "SWARM":
        if (this.frameCount % 20 === 0) {
          // Create a cluster of small fast projectiles
          const clusterX = p.random(0, 1) > 0.5 ? 160 : 440;
          const clusterY = 240 + p.random(20, 110);
          
          for (let i = 0; i < 3; i++) {
            const angle = p.random(0, p.TWO_PI);
            const speed = 1.8;
            this.projectiles.push(new Projectile(
              clusterX,
              clusterY,
              p.cos(angle) * speed * (clusterX < 300 ? 1 : -1),
              p.sin(angle) * speed,
              7,
              [255, 200, 100]
            ));
          }
        }
        break;
      
      // HARD PATTERNS
      case "SWORD_SWIPES":
        if (this.frameCount % 25 === 0) {
          const horizontal = p.random(0, 1) > 0.5;
          
          if (horizontal) {
            const y = 250 + p.floor(p.random(0, 3)) * 40;
            for (let x = 440; x >= 160; x -= 20) {
              this.projectiles.push(new Projectile(
                x,
                y,
                -3.0,
                0,
                14,
                [200, 200, 255]
              ));
            }
          } else {
            const x = 180 + p.floor(p.random(0, 5)) * 50;
            for (let y = 370; y >= 240; y -= 20) {
              this.projectiles.push(new Projectile(
                x,
                y,
                0,
                -3.0,
                14,
                [200, 200, 255]
              ));
            }
          }
        }
        break;
        
      case "MAGIC_ORBS":
        if (this.frameCount % 20 === 0) {
          const angle = (this.frameCount * 0.05);
          const radius = 140;
          
          for (let i = 0; i < 3; i++) {
            const orbAngle = angle + (i * p.TWO_PI / 3);
            const startX = centerX + p.cos(orbAngle) * radius;
            const startY = centerY + p.sin(orbAngle) * (radius * 0.5);
            
            const proj = new Projectile(
              startX,
              startY,
              -p.cos(orbAngle) * 1.5,
              -p.sin(orbAngle) * 1.5,
              13,
              [255, 100, 255]
            );
            proj.rotationSpeed = 0.15;
            this.projectiles.push(proj);
          }
        }
        break;
        
      case "ADVANCED_FLIES":
        // Faster, more complex version of SIMPLE_FLIES
        if (this.frameCount % 18 === 0) {
          const angle = p.random(0, p.TWO_PI);
          const speed = 2.2;
          this.projectiles.push(new Projectile(
            centerX + p.cos(angle) * 150,
            centerY + p.sin(angle) * 75,
            -p.cos(angle) * speed,
            -p.sin(angle) * speed,
            9,
            [100, 255, 100]
          ));
        }
        
        // Add homing-like behavior
        if (this.frameCount % 45 === 0) {
          const corners = [
            {x: 160, y: 240},
            {x: 440, y: 240},
            {x: 160, y: 370},
            {x: 440, y: 370}
          ];
          const corner = corners[p.floor(p.random(0, 4))];
          const dx = centerX - corner.x;
          const dy = centerY - corner.y;
          const dist = p.sqrt(dx * dx + dy * dy);
          
          this.projectiles.push(new Projectile(
            corner.x,
            corner.y,
            (dx / dist) * 2.0,
            (dy / dist) * 2.0,
            10,
            [50, 255, 50]
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