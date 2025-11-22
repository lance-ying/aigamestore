// enemy.js - Enemy entities

export class Enemy {
  constructor(x, y, type = 'normal') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.active = true;
    this.stunned = false;
    this.stunTimer = 0;
    this.flashTimer = 0;
    this.damageTimer = 0; // Timer for dealing damage to hostages
    
    // Type-specific properties (reduced speeds for better gameplay)
    if (type === 'normal') {
      this.health = 1;
      this.maxHealth = 1;
      this.speed = 0.6; // Reduced from 1
      this.size = 15;
      this.color = [255, 50, 50];
      this.points = 10;
      this.damage = 2; // Damage dealt to hostages per hit
      this.attackCooldown = 30; // Frames between attacks (0.5 seconds at 60fps)
    } else if (type === 'fast') {
      this.health = 1;
      this.maxHealth = 1;
      this.speed = 1.0; // Reduced from 1.5
      this.size = 15;
      this.color = [255, 150, 50];
      this.points = 20;
      this.damage = 2;
      this.attackCooldown = 30;
    } else if (type === 'tank') {
      this.health = 3;
      this.maxHealth = 3;
      this.speed = 0.5; // Reduced from 0.7
      this.size = 20;
      this.color = [150, 30, 30];
      this.points = 30;
      this.damage = 3;
      this.attackCooldown = 30;
    }
    
    this.targetX = x;
    this.targetY = y;
    this.pathIndex = 0;
    this.path = [];
    this.seekingTarget = false; // Flag for when actively seeking hostages/player
  }

  setPath(path) {
    this.path = path;
    if (path.length > 0) {
      this.targetX = path[0].x;
      this.targetY = path[0].y;
    }
  }

  // Find and move towards nearest hostage (prioritize hostages over player)
  seekNearestTarget(hostages, player) {
    let nearestDist = Infinity;
    let nearestX = this.x;
    let nearestY = this.y;
    
    // First, check all living hostages (always prioritize hostages)
    let foundHostage = false;
    for (const hostage of hostages) {
      if (hostage.alive) {
        foundHostage = true;
        const dx = hostage.x - this.x;
        const dy = hostage.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestX = hostage.x;
          nearestY = hostage.y;
        }
      }
    }
    
    // Only target player if no living hostages exist
    if (!foundHostage && player) {
      nearestX = player.x;
      nearestY = player.y;
    }
    
    this.targetX = nearestX;
    this.targetY = nearestY;
    this.seekingTarget = true;
  }

  update(hostages, player) {
    if (!this.active) return;
    
    // Update damage timer
    if (this.damageTimer > 0) {
      this.damageTimer--;
    }
    
    // Update stun
    if (this.stunned) {
      this.stunTimer--;
      if (this.stunTimer <= 0) {
        this.stunned = false;
      }
      return;
    }
    
    // Update flash
    if (this.flashTimer > 0) {
      this.flashTimer--;
    }
    
    // Move towards target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 5) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    } else if (this.path.length > 0 && !this.seekingTarget) {
      // Move to next waypoint in path
      this.pathIndex++;
      if (this.pathIndex < this.path.length) {
        this.targetX = this.path[this.pathIndex].x;
        this.targetY = this.path[this.pathIndex].y;
      } else {
        // Path complete, start seeking hostages/player
        this.seekNearestTarget(hostages, player);
      }
    } else if (!this.seekingTarget) {
      // No path or path complete, seek targets
      this.seekNearestTarget(hostages, player);
    }
    
    // If already seeking, periodically update target
    if (this.seekingTarget && Math.random() < 0.05) { // 5% chance per frame to update target
      this.seekNearestTarget(hostages, player);
    }
  }

  draw(p) {
    if (!this.active) return;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Flash white when hit
    const fillColor = this.flashTimer > 0 ? [255, 255, 255] : this.color;
    
    p.fill(...fillColor);
    p.stroke(0);
    p.strokeWeight(2);
    
    if (this.type === 'normal' || this.type === 'tank') {
      p.circle(0, 0, this.size);
    } else if (this.type === 'fast') {
      p.triangle(-this.size / 2, this.size / 2, this.size / 2, this.size / 2, 0, -this.size / 2);
    }
    
    // Draw health bar for tank
    if (this.type === 'tank') {
      const barWidth = this.size;
      const barHeight = 3;
      const healthPercent = this.health / this.maxHealth;
      
      p.fill(255, 0, 0);
      p.noStroke();
      p.rect(-barWidth / 2, -this.size / 2 - 8, barWidth, barHeight);
      
      p.fill(0, 255, 0);
      p.rect(-barWidth / 2, -this.size / 2 - 8, barWidth * healthPercent, barHeight);
    }
    
    // Draw stun indicator
    if (this.stunned) {
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text("Zzz", 0, -this.size - 10);
    }
    
    p.pop();
  }

  takeDamage(amount) {
    this.health -= amount;
    this.flashTimer = 10;
    
    if (this.health <= 0) {
      this.active = false;
      return true; // Enemy defeated
    }
    return false;
  }

  stun(duration) {
    this.stunned = true;
    this.stunTimer = duration;
  }

  canAttack() {
    return this.damageTimer <= 0;
  }

  resetAttackTimer() {
    this.damageTimer = this.attackCooldown;
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      radius: this.size / 2
    };
  }
}