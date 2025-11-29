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

    // Special case for Banana Farm
    if (this.type === "FARM" && this.cooldown <= 0) {
      this.cooldown = this.config.attackSpeed * 60;
      this.lastIncome = 20;
      return 20; // Return income generated
    }

    if (this.cooldown <= 0 && balloons.length > 0) {
      // Find closest balloon in range
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
        
        if (this.type === "TACK") {
          // Tack shooter fires in 8 directions
          for (let angle = 0; angle < 360; angle += 45) {
            const radians = p.radians(angle);
            const vx = p.cos(radians) * 3;
            const vy = p.sin(radians) * 3;
            projectiles.push(new Projectile(this.x, this.y, vx, vy, this.config.damage, this.type));
          }
        } else if (this.type === "BOMB") {
          // Bomb tower fires a single explosive
          const angle = p.atan2(closestBalloon.y - this.y, closestBalloon.x - this.x);
          const vx = p.cos(angle) * 2;
          const vy = p.sin(angle) * 2;
          projectiles.push(new Projectile(this.x, this.y, vx, vy, this.config.damage, this.type, true));
        } else {
          // Default dart monkey fires at target
          const angle = p.atan2(closestBalloon.y - this.y, closestBalloon.x - this.x);
          const vx = p.cos(angle) * 3;
          const vy = p.sin(angle) * 3;
          projectiles.push(new Projectile(this.x, this.y, vx, vy, this.config.damage, this.type));
        }
      }
    }
    return 0; // No income for regular towers
  }

  draw(p) {
    p.push();
    p.fill(...this.config.color);
    p.stroke(0);
    p.strokeWeight(1);
    
    // Draw range circle
    p.noFill();
    p.stroke(255, 255, 255, 100);
    p.ellipse(this.x, this.y, this.config.range * 2);
    
    // Draw tower
    p.fill(...this.config.color);
    if (this.type === "FARM") {
      // Draw farm as a square with details
      p.rect(this.x - 10, this.y - 10, 20, 20);
      p.fill(255, 255, 0);
      p.rect(this.x - 5, this.y - 8, 10, 16);
    } else if (this.type === "TACK") {
      // Draw tack shooter as octagon with spikes
      p.ellipse(this.x, this.y, 16, 16);
      for (let angle = 0; angle < 360; angle += 45) {
        const radians = p.radians(angle);
        const x2 = this.x + p.cos(radians) * 12;
        const y2 = this.y + p.sin(radians) * 12;
        p.line(this.x + p.cos(radians) * 8, this.y + p.sin(radians) * 8, x2, y2);
      }
    } else if (this.type === "BOMB") {
      // Draw bomb tower as a circle with a top
      p.ellipse(this.x, this.y, 16, 16);
      p.fill(100);
      p.rect(this.x - 2, this.y - 12, 4, 4);
    } else {
      // Default dart monkey as circle with ears
      p.ellipse(this.x, this.y, 16, 16);
      p.ellipse(this.x - 6, this.y - 6, 6, 6);
      p.ellipse(this.x + 6, this.y - 6, 6, 6);
    }
    
    // Show level
    p.fill(255);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(this.level, this.x, this.y);
    
    // Show income for farms
    if (this.type === "FARM" && this.lastIncome > 0) {
      p.fill(255, 255, 0);
      p.textSize(10);
      p.text("+" + this.lastIncome, this.x, this.y - 20);
      this.lastIncome -= 0.1;
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
  }

  update(p, path) {
    // Move along the path with reasonable speed (0.5 max as requested)
    this.progress += 0.5 * this.config.speed;
    
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
    
    // Check if reached end of path
    if (this.pathIndex >= path.length - 1) {
      return true; // Balloon reached end
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
    p.fill(...this.config.color);
    p.stroke(0);
    p.strokeWeight(1);
    p.ellipse(this.x, this.y, this.radius * 2);
    
    // Show health if > 1
    if (this.health > 1) {
      p.fill(255);
      p.textSize(8);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(this.health, this.x, this.y);
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
  }

  update() {
    if (this.exploded) {
      this.explosionRadius += 3;
      return this.explosionRadius > this.explosionMaxRadius;
    } else {
      this.x += this.vx;
      this.y += this.vy;
      
      // Check if out of bounds
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
      // Simple distance-based collision detection
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
      // Draw explosion
      p.noFill();
      p.stroke(255, 100, 0);
      p.strokeWeight(2);
      p.ellipse(this.x, this.y, this.explosionRadius * 2);
    } else {
      // Draw projectile
      if (this.towerType === "DART") {
        p.fill(139, 69, 19);
        p.noStroke();
        p.ellipse(this.x, this.y, this.radius * 2);
      } else if (this.towerType === "BOMB") {
        p.fill(0);
        p.stroke(255, 0, 0);
        p.strokeWeight(1);
        p.ellipse(this.x, this.y, this.radius * 2);
      } else if (this.towerType === "TACK") {
        p.fill(200, 0, 0);
        p.noStroke();
        p.rect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
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
  
  // Determine balloon types based on wave number
  let types = ["RED"];
  if (waveNumber >= 3) types.push("BLUE");
  if (waveNumber >= 6) types.push("GREEN");
  if (waveNumber >= 9) types.push("YELLOW");
  if (waveNumber >= 12) types.push("PURPLE");
  
  for (let i = 0; i < count; i++) {
    // Later waves have more advanced balloons
    const typeIndex = Math.min(Math.floor(Math.random() * waveNumber / 3), types.length - 1);
    const type = types[typeIndex];
    balloons.push(new Balloon(type));
  }
  
  return balloons;
}