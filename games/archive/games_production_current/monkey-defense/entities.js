import { CANVAS_WIDTH, CANVAS_HEIGHT, TOWER_TYPES, BALLOON_TYPES, PATH_POINTS } from './globals.js';

// Tower class
export class Tower {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.config = { ...TOWER_TYPES[type] };
    this.cooldown = 0;
    this.level = 1;
    this.target = null;
    this.lastIncome = 0;
    this.shootAngle = 0;
  }

  upgrade() {
    this.level++;
    this.config.range += this.config.upgradeEffect.range;
    this.config.attackSpeed -= this.config.upgradeEffect.attackSpeed;
    this.config.damage += this.config.upgradeEffect.damage;
    return this.config.upgradePrice;
  }

  canUpgrade(money) {
    return money >= this.config.upgradePrice;
  }

  update(p, balloons, projectiles) {
    this.cooldown -= 1;

    if (this.type === "FARM" && this.cooldown <= 0) {
      this.cooldown = this.config.attackSpeed * 60;
      this.lastIncome = 20;
      return 20;
    }

    if (this.cooldown <= 0 && balloons.length > 0) {
      let closestDist = Infinity;
      let closestBalloon = null;

      for (const balloon of balloons) {
        const dist = p.dist(this.x, this.y, balloon.x, balloon.y);
        if (dist < this.config.range && dist < closestDist) {
          closestDist = dist;
          closestBalloon = balloon;
        }
      }

      if (closestBalloon) {
        this.target = closestBalloon;
        this.cooldown = this.config.attackSpeed * 60;
        this.shootAngle = p.atan2(closestBalloon.y - this.y, closestBalloon.x - this.x);
        
        if (this.type === "TACK") {
          for (let angle = 0; angle < 360; angle += 45) {
            const radians = p.radians(angle);
            const vx = p.cos(radians) * 3;
            const vy = p.sin(radians) * 3;
            projectiles.push(new Projectile(this.x, this.y, vx, vy, this.config.damage, this.type));
          }
        } else if (this.type === "BOMB") {
          const angle = p.atan2(closestBalloon.y - this.y, closestBalloon.x - this.x);
          const vx = p.cos(angle) * 2;
          const vy = p.sin(angle) * 2;
          projectiles.push(new Projectile(this.x, this.y, vx, vy, this.config.damage, this.type, true));
        } else {
          const angle = p.atan2(closestBalloon.y - this.y, closestBalloon.x - this.x);
          const vx = p.cos(angle) * 3;
          const vy = p.sin(angle) * 3;
          projectiles.push(new Projectile(this.x, this.y, vx, vy, this.config.damage, this.type));
        }
      }
    }
    return 0;
  }

  draw(p) {
    p.push();
    
    // Draw range circle when targeting
    if (this.target && this.type !== "FARM") {
      p.noFill();
      p.stroke(255, 255, 255, 80);
      p.strokeWeight(1);
      p.ellipse(this.x, this.y, this.config.range * 2);
    }
    
    // Draw tower based on type
    if (this.type === "FARM") {
      // Farm
      p.fill(180, 150, 50);
      p.stroke(120, 100, 30);
      p.strokeWeight(2);
      p.rect(this.x - 12, this.y - 12, 24, 24);
      
      // Roof
      p.fill(200, 50, 50);
      p.triangle(this.x - 14, this.y - 12, this.x + 14, this.y - 12, this.x, this.y - 22);
      
      // Windows
      p.fill(100, 200, 255);
      p.noStroke();
      p.rect(this.x - 7, this.y - 6, 6, 6);
      p.rect(this.x + 1, this.y - 6, 6, 6);
      
      // Banana detail
      p.fill(255, 255, 0);
      p.ellipse(this.x, this.y + 4, 8, 4);
    } else if (this.type === "TACK") {
      // Tack shooter with spikes
      p.fill(180, 20, 20);
      p.stroke(100, 10, 10);
      p.strokeWeight(2);
      p.ellipse(this.x, this.y, 18, 18);
      
      // Spikes
      p.fill(220, 40, 40);
      for (let angle = 0; angle < 360; angle += 45) {
        const radians = p.radians(angle);
        p.push();
        p.translate(this.x, this.y);
        p.rotate(radians);
        p.triangle(-2, -9, 2, -9, 0, -14);
        p.pop();
      }
      
      // Center highlight
      p.fill(255, 100, 100);
      p.noStroke();
      p.ellipse(this.x - 2, this.y - 2, 6, 6);
    } else if (this.type === "BOMB") {
      // Bomb tower
      p.fill(40, 40, 40);
      p.stroke(20, 20, 20);
      p.strokeWeight(2);
      p.ellipse(this.x, this.y, 18, 18);
      
      // Highlight
      p.fill(60, 60, 60);
      p.noStroke();
      p.ellipse(this.x - 3, this.y - 3, 8, 8);
      
      // Fuse
      p.stroke(100, 50, 0);
      p.strokeWeight(2);
      p.line(this.x, this.y - 9, this.x + 2, this.y - 14);
      p.fill(255, 150, 0);
      p.noStroke();
      p.ellipse(this.x + 2, this.y - 14, 4, 4);
    } else {
      // Dart monkey
      p.fill(139, 69, 19);
      p.stroke(80, 40, 10);
      p.strokeWeight(2);
      p.ellipse(this.x, this.y, 18, 18);
      
      // Ears
      p.ellipse(this.x - 7, this.y - 7, 7, 7);
      p.ellipse(this.x + 7, this.y - 7, 7, 7);
      
      // Face
      p.fill(222, 184, 135);
      p.ellipse(this.x, this.y, 12, 12);
      
      // Eyes
      p.fill(0);
      p.noStroke();
      p.ellipse(this.x - 3, this.y - 2, 3, 3);
      p.ellipse(this.x + 3, this.y - 2, 3, 3);
      
      // Eye shine
      p.fill(255);
      p.ellipse(this.x - 2.5, this.y - 2.5, 1, 1);
      p.ellipse(this.x + 3.5, this.y - 2.5, 1, 1);
      
      // Mouth
      p.stroke(0);
      p.strokeWeight(1);
      p.noFill();
      p.arc(this.x, this.y + 2, 6, 4, 0, p.PI);
      
      // Show direction when shooting
      if (this.cooldown > this.config.attackSpeed * 55) {
        p.stroke(139, 69, 19);
        p.strokeWeight(2);
        const dirX = this.x + p.cos(this.shootAngle) * 12;
        const dirY = this.y + p.sin(this.shootAngle) * 12;
        p.line(this.x, this.y, dirX, dirY);
      }
    }
    
    // Level indicator
    if (this.level > 1) {
      p.fill(255, 215, 0);
      p.stroke(200, 150, 0);
      p.strokeWeight(1);
      p.ellipse(this.x + 8, this.y - 8, 12, 12);
      
      p.fill(0);
      p.noStroke();
      p.textSize(9);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(this.level, this.x + 8, this.y - 8);
    }
    
    // Income animation for farms
    if (this.type === "FARM" && this.lastIncome > 0) {
      const yOffset = p.map(this.lastIncome, 20, 0, -20, -35);
      p.fill(255, 255, 0, this.lastIncome * 12);
      p.textSize(14);
      p.textStyle(p.BOLD);
      p.text("+$" + Math.floor(this.lastIncome), this.x, this.y + yOffset);
      this.lastIncome -= 0.15;
      if (this.lastIncome < 0) this.lastIncome = 0;
    }
    
    p.pop();
  }
}

// Balloon class
export class Balloon {
  constructor(type, pathIndex = 0) {
    this.type = type;
    this.config = { ...BALLOON_TYPES[type] };
    this.health = this.config.health;
    this.pathIndex = pathIndex;
    this.progress = 0;
    this.x = 0;
    this.y = 0;
    this.radius = 10;
    this.popped = false;
    this.wobble = Math.random() * Math.PI * 2;
  }

  update(p, path) {
    this.progress += 0.5 * this.config.speed;
    this.wobble += 0.1;
    
    if (this.pathIndex < path.length - 1) {
      const currentPoint = path[this.pathIndex];
      const nextPoint = path[this.pathIndex + 1];
      
      const dx = nextPoint.x - currentPoint.x;
      const dy = nextPoint.y - currentPoint.y;
      const segmentLength = p.sqrt(dx * dx + dy * dy);
      
      if (this.progress >= segmentLength) {
        this.progress -= segmentLength;
        this.pathIndex++;
      }
      
      if (this.pathIndex < path.length - 1) {
        const currentPoint = path[this.pathIndex];
        const nextPoint = path[this.pathIndex + 1];
        
        const dx = nextPoint.x - currentPoint.x;
        const dy = nextPoint.y - currentPoint.y;
        const angle = p.atan2(dy, dx);
        
        this.x = currentPoint.x + p.cos(angle) * this.progress;
        this.y = currentPoint.y + p.sin(angle) * this.progress;
      }
    }
    
    if (this.pathIndex >= path.length - 1) {
      return true;
    }
    
    return false;
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.popped = true;
      return this.config.reward;
    }
    return 0;
  }

  draw(p) {
    p.push();
    
    // Wobble effect
    const wobbleOffset = Math.sin(this.wobble) * 1;
    const drawY = this.y + wobbleOffset;
    
    // Balloon string
    p.stroke(100);
    p.strokeWeight(1);
    p.line(this.x, drawY + this.radius, this.x, drawY + this.radius + 8);
    
    // Balloon with simple gradient
    const r = this.config.color[0];
    const g = this.config.color[1];
    const b = this.config.color[2];
    
    // Main balloon
    p.fill(r, g, b);
    p.stroke(r * 0.6, g * 0.6, b * 0.6);
    p.strokeWeight(1.5);
    p.ellipse(this.x, drawY, this.radius * 2);
    
    // Shine highlight
    p.fill(255, 255, 255, 180);
    p.noStroke();
    p.ellipse(this.x - 4, drawY - 4, this.radius * 0.6);
    
    // Health indicator
    if (this.health > 1) {
      p.fill(255);
      p.stroke(0);
      p.strokeWeight(2);
      p.textSize(10);
      p.textAlign(p.CENTER, p.CENTER);
      p.textStyle(p.BOLD);
      p.text(this.health, this.x, drawY);
    }
    
    p.pop();
  }
}

// Projectile class
export class Projectile {
  constructor(x, y, vx, vy, damage, towerType, explosive = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.towerType = towerType;
    this.explosive = explosive;
    this.radius = explosive ? 5 : 3;
    this.hitBalloons = new Set();
    this.exploded = false;
    this.explosionRadius = 0;
    this.explosionMaxRadius = 40;
    this.trail = [];
    this.trailLength = 8;
  }

  update() {
    if (this.exploded) {
      this.explosionRadius += 3;
      return this.explosionRadius > this.explosionMaxRadius;
    } else {
      // Add to trail
      this.trail.push({x: this.x, y: this.y});
      if (this.trail.length > this.trailLength) {
        this.trail.shift();
      }
      
      this.x += this.vx;
      this.y += this.vy;
      
      return this.x < -10 || this.x > CANVAS_WIDTH + 10 || 
             this.y < -10 || this.y > CANVAS_HEIGHT + 10;
    }
  }

  checkHit(p, balloon) {
    if (this.hitBalloons.has(balloon)) return false;
    
    if (this.exploded) {
      const dist = p.dist(this.x, this.y, balloon.x, balloon.y);
      if (dist < this.explosionRadius) {
        this.hitBalloons.add(balloon);
        return true;
      }
    } else {
      const dist = p.dist(this.x, this.y, balloon.x, balloon.y);
      const hit = dist < (this.radius + balloon.radius);
      
      if (hit) {
        this.hitBalloons.add(balloon);
        if (this.explosive) {
          this.exploded = true;
        }
        return true;
      }
    }
    return false;
  }

  draw(p) {
    p.push();
    if (this.exploded) {
      // Explosion with multiple circles
      for (let i = 0; i < 3; i++) {
        const offset = i * 5;
        const alpha = 255 - (this.explosionRadius / this.explosionMaxRadius) * 255;
        p.noFill();
        p.stroke(255, 150 - i * 30, 0, alpha);
        p.strokeWeight(3 - i);
        p.ellipse(this.x, this.y, (this.explosionRadius - offset) * 2);
      }
      
      // Explosion particles
      const particleCount = 8;
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const dist = this.explosionRadius * 0.7;
        const px = this.x + Math.cos(angle) * dist;
        const py = this.y + Math.sin(angle) * dist;
        p.fill(255, 200, 0, 200 - (this.explosionRadius / this.explosionMaxRadius) * 200);
        p.noStroke();
        p.ellipse(px, py, 4);
      }
    } else {
      // Draw trail
      for (let i = 0; i < this.trail.length; i++) {
        const alpha = (i / this.trail.length) * 150;
        const size = (i / this.trail.length) * this.radius;
        
        if (this.towerType === "DART") {
          p.fill(139, 69, 19, alpha);
        } else if (this.towerType === "BOMB") {
          p.fill(0, 0, 0, alpha);
        } else if (this.towerType === "TACK") {
          p.fill(200, 0, 0, alpha);
        }
        
        p.noStroke();
        p.ellipse(this.trail[i].x, this.trail[i].y, size * 2);
      }
      
      // Draw projectile
      if (this.towerType === "DART") {
        p.fill(139, 69, 19);
        p.stroke(90, 45, 12);
        p.strokeWeight(1);
        p.ellipse(this.x, this.y, this.radius * 2);
      } else if (this.towerType === "BOMB") {
        p.fill(0);
        p.stroke(255, 0, 0);
        p.strokeWeight(2);
        p.ellipse(this.x, this.y, this.radius * 2);
        
        // Fuse spark
        p.fill(255, 150, 0);
        p.noStroke();
        p.ellipse(this.x + 2, this.y - 2, 2);
      } else if (this.towerType === "TACK") {
        p.fill(200, 0, 0);
        p.stroke(150, 0, 0);
        p.strokeWeight(1);
        p.push();
        p.translate(this.x, this.y);
        p.rotate(p.frameCount * 0.2);
        p.rect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        p.pop();
      }
    }
    p.pop();
  }
}

// Path utilities
export function generatePath(p) {
  const path = [];
  for (const point of PATH_POINTS) {
    path.push({
      x: point.x * CANVAS_WIDTH,
      y: point.y * CANVAS_HEIGHT
    });
  }
  return path;
}

// Wave generation
export function generateWave(waveNumber) {
  const balloons = [];
  const count = 10 + waveNumber * 3;
  
  let types = ["RED"];
  if (waveNumber >= 3) types.push("BLUE");
  if (waveNumber >= 6) types.push("GREEN");
  if (waveNumber >= 9) types.push("YELLOW");
  if (waveNumber >= 12) types.push("PURPLE");
  
  for (let i = 0; i < count; i++) {
    const typeIndex = Math.min(Math.floor(Math.random() * waveNumber / 3), types.length - 1);
    const type = types[typeIndex];
    balloons.push(new Balloon(type));
  }
  
  return balloons;
}