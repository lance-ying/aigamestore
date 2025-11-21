// entities.js - Game entity classes

import { gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.speed = 2.5;
    this.angle = 0;
    this.fireCooldown = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.inCover = false;
    this.behindCover = null;
    this.stealthMode = false;
  }
  
  update(p) {
    // Update position based on input (handled in game.js)
    // Check cover status
    this.checkCover();
    
    // Update cooldowns
    if (this.fireCooldown > 0) this.fireCooldown--;
  }
  
  checkCover() {
    this.inCover = false;
    this.behindCover = null;
    
    for (let cover of gameState.cover) {
      const dist = Math.sqrt((this.x - cover.x) ** 2 + (this.y - cover.y) ** 2);
      if (dist < cover.radius + 30) {
        this.inCover = true;
        this.behindCover = cover;
        break;
      }
    }
  }
  
  takeDamage(damage) {
    let actualDamage = damage;
    if (this.inCover) {
      actualDamage *= 0.25; // 75% damage reduction
    }
    this.health -= actualDamage;
    gameState.playerHealth = Math.max(0, this.health);
    
    if (this.health <= 0) {
      return true; // Player died
    }
    return false;
  }
  
  fire(p) {
    const weapon = gameState.weapons[gameState.currentWeapon];
    if (this.fireCooldown > 0 || weapon.ammo <= 0) return null;
    
    weapon.ammo--;
    this.fireCooldown = weapon.fireRate;
    
    // Create bullet
    const bullet = new Bullet(
      this.x,
      this.y,
      this.angle,
      weapon.damage,
      weapon.range,
      true,
      weapon.silenced || false
    );
    
    return bullet;
  }
  
  switchWeapon() {
    gameState.currentWeapon = gameState.currentWeapon === "rifle" ? "pistol" : "rifle";
  }
  
  throwGrenade(p) {
    if (gameState.playerGrenades <= 0) return null;
    
    gameState.playerGrenades--;
    
    const grenade = new Grenade(
      this.x + Math.cos(this.angle) * 30,
      this.y + Math.sin(this.angle) * 30,
      this.angle
    );
    
    return grenade;
  }
  
  placeMine(p) {
    if (gameState.playerMines <= 0) return null;
    
    gameState.playerMines--;
    
    const mine = new Mine(this.x, this.y);
    return mine;
  }
  
  render(p) {
    p.push();
    p.translate(this.x - gameState.cameraX, this.y - gameState.cameraY);
    
    // Body
    if (this.stealthMode) {
      p.fill(80, 120, 80); // Green tint when in stealth
    } else {
      p.fill(0, 150, 255);
    }
    p.noStroke();
    p.circle(0, 0, this.width);
    
    // Direction indicator
    p.stroke(255);
    p.strokeWeight(2);
    p.line(0, 0, Math.cos(this.angle) * 15, Math.sin(this.angle) * 15);
    
    // Weapon
    p.fill(60);
    p.noStroke();
    p.push();
    p.rotate(this.angle);
    p.rect(5, -2, 12, 4);
    p.pop();
    
    // Cover indicator
    if (this.inCover) {
      p.noFill();
      p.stroke(100, 255, 100);
      p.strokeWeight(2);
      p.circle(0, 0, this.width + 10);
    }
    
    p.pop();
  }
}

export class Enemy {
  constructor(x, y, type = "guard") {
    this.x = x;
    this.y = y;
    this.width = 18;
    this.height = 18;
    this.speed = 1.2;
    this.angle = 0;
    this.health = 50;
    this.maxHealth = 50;
    this.fireCooldown = 0;
    this.type = type;
    this.state = "patrol"; // patrol, alert, combat
    this.alertness = 0;
    this.patrolPoints = [];
    this.currentPatrolIndex = 0;
    this.patrolWait = 0;
    this.visionRange = 150;
    this.visionAngle = Math.PI / 3; // 60 degrees
    this.damage = 10;
    this.fireRate = 30;
    this.lastSeenPlayerX = 0;
    this.lastSeenPlayerY = 0;
  }
  
  setPatrolPoints(points) {
    this.patrolPoints = points;
  }
  
  update(p) {
    if (this.fireCooldown > 0) this.fireCooldown--;
    
    const player = gameState.player;
    if (!player) return;
    
    // Check if player is in vision cone
    const canSeePlayer = this.checkPlayerVision(player);
    
    if (canSeePlayer) {
      this.alertness = Math.min(100, this.alertness + 5);
      this.lastSeenPlayerX = player.x;
      this.lastSeenPlayerY = player.y;
      
      if (this.alertness > 50) {
        this.state = "combat";
      } else if (this.alertness > 20) {
        this.state = "alert";
      }
    } else {
      this.alertness = Math.max(0, this.alertness - 1);
      if (this.alertness < 20) {
        this.state = "patrol";
      }
    }
    
    // Behavior based on state
    switch (this.state) {
      case "patrol":
        this.patrol(p);
        break;
      case "alert":
        this.investigate(p);
        break;
      case "combat":
        this.combat(p, player);
        break;
    }
  }
  
  checkPlayerVision(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > this.visionRange) return false;
    
    // Check angle
    const angleToPlayer = Math.atan2(dy, dx);
    let angleDiff = angleToPlayer - this.angle;
    
    // Normalize angle difference
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    if (Math.abs(angleDiff) > this.visionAngle / 2) return false;
    
    // Stealth modifier
    if (player.stealthMode) {
      return dist < this.visionRange * 0.5; // Half vision range in stealth
    }
    
    return true;
  }
  
  patrol(p) {
    if (this.patrolPoints.length === 0) {
      // Random walk
      if (p.frameCount % 60 === 0) {
        this.angle = p.random(0, Math.PI * 2);
      }
      this.x += Math.cos(this.angle) * this.speed * 0.5;
      this.y += Math.sin(this.angle) * this.speed * 0.5;
      return;
    }
    
    if (this.patrolWait > 0) {
      this.patrolWait--;
      return;
    }
    
    const target = this.patrolPoints[this.currentPatrolIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 10) {
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
      this.patrolWait = 60;
    } else {
      this.angle = Math.atan2(dy, dx);
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;
    }
  }
  
  investigate(p) {
    const dx = this.lastSeenPlayerX - this.x;
    const dy = this.lastSeenPlayerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 20) {
      this.angle = Math.atan2(dy, dx);
      this.x += Math.cos(this.angle) * this.speed * 1.5;
      this.y += Math.sin(this.angle) * this.speed * 1.5;
    }
  }
  
  combat(p, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    this.angle = Math.atan2(dy, dx);
    
    // Move to optimal range
    if (dist > 120) {
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;
    } else if (dist < 80) {
      this.x -= Math.cos(this.angle) * this.speed;
      this.y -= Math.sin(this.angle) * this.speed;
    }
    
    // Fire at player
    if (this.fireCooldown === 0 && dist < 200) {
      this.fire(p);
    }
  }
  
  fire(p) {
    this.fireCooldown = this.fireRate;
    
    const bullet = new Bullet(
      this.x,
      this.y,
      this.angle,
      this.damage,
      200,
      false
    );
    
    return bullet;
  }
  
  takeDamage(damage, isFlanking = false) {
    let actualDamage = damage;
    if (isFlanking) {
      actualDamage *= 1.5; // 50% bonus damage from flanking
    }
    
    this.health -= actualDamage;
    this.state = "combat";
    this.alertness = 100;
    
    return this.health <= 0;
  }
  
  render(p) {
    p.push();
    p.translate(this.x - gameState.cameraX, this.y - gameState.cameraY);
    
    // Body
    const stateColor = this.state === "combat" ? [255, 50, 50] :
                       this.state === "alert" ? [255, 200, 0] :
                       [255, 100, 100];
    p.fill(...stateColor);
    p.noStroke();
    p.circle(0, 0, this.width);
    
    // Direction indicator
    p.stroke(0);
    p.strokeWeight(2);
    p.line(0, 0, Math.cos(this.angle) * 12, Math.sin(this.angle) * 12);
    
    // Vision cone (only show when alert or in combat)
    if (this.state !== "patrol") {
      p.fill(255, 0, 0, 30);
      p.noStroke();
      p.arc(0, 0, this.visionRange * 2, this.visionRange * 2,
            this.angle - this.visionAngle / 2,
            this.angle + this.visionAngle / 2);
    }
    
    // Health bar
    if (this.health < this.maxHealth) {
      p.fill(255, 0, 0);
      p.noStroke();
      p.rect(-10, -15, 20, 3);
      p.fill(0, 255, 0);
      p.rect(-10, -15, 20 * (this.health / this.maxHealth), 3);
    }
    
    p.pop();
  }
}

export class Bullet {
  constructor(x, y, angle, damage, range, friendly = true, silenced = false) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.angle = angle;
    this.speed = 8;
    this.damage = damage;
    this.range = range;
    this.friendly = friendly;
    this.active = true;
    this.silenced = silenced;
  }
  
  update(p) {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    
    const dist = Math.sqrt((this.x - this.startX) ** 2 + (this.y - this.startY) ** 2);
    if (dist > this.range) {
      this.active = false;
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x - gameState.cameraX, this.y - gameState.cameraY);
    p.fill(this.friendly ? [255, 255, 100] : [255, 100, 100]);
    p.noStroke();
    p.circle(0, 0, 4);
    p.pop();
  }
}

export class Cover {
  constructor(x, y, width, height, type = "crate") {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.radius = Math.max(width, height) / 2;
  }
  
  render(p) {
    p.push();
    p.translate(this.x - gameState.cameraX, this.y - gameState.cameraY);
    
    if (this.type === "crate") {
      p.fill(139, 90, 43);
      p.stroke(100, 60, 30);
      p.strokeWeight(2);
      p.rectMode(p.CENTER);
      p.rect(0, 0, this.width, this.height);
      
      // Crate details
      p.stroke(160, 110, 60);
      p.line(-this.width / 3, -this.height / 2, -this.width / 3, this.height / 2);
      p.line(this.width / 3, -this.height / 2, this.width / 3, this.height / 2);
    } else if (this.type === "wall") {
      p.fill(120, 120, 120);
      p.stroke(80, 80, 80);
      p.strokeWeight(2);
      p.rectMode(p.CENTER);
      p.rect(0, 0, this.width, this.height);
      
      // Brick pattern
      for (let i = 0; i < 3; i++) {
        p.stroke(100, 100, 100);
        p.line(-this.width / 2, -this.height / 2 + (i * this.height / 3), 
               this.width / 2, -this.height / 2 + (i * this.height / 3));
      }
    }
    
    p.pop();
  }
}

export class Grenade {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * 5;
    this.vy = Math.sin(angle) * 5;
    this.timer = 60; // 1 second fuse
    this.active = true;
    this.exploded = false;
    this.blastRadius = 80;
    this.damage = 60;
  }
  
  update(p) {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.95;
    this.vy *= 0.95;
    
    this.timer--;
    
    if (this.timer <= 0 && !this.exploded) {
      this.explode(p);
    }
  }
  
  explode(p) {
    this.exploded = true;
    this.active = false;
    
    // Create explosion particles
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const particle = new Particle(
        this.x,
        this.y,
        Math.cos(angle) * 3,
        Math.sin(angle) * 3,
        [255, 150, 0],
        20
      );
      gameState.particles.push(particle);
    }
    
    // Damage enemies in range
    for (let enemy of gameState.enemies) {
      const dist = Math.sqrt((enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2);
      if (dist < this.blastRadius) {
        const damage = this.damage * (1 - dist / this.blastRadius);
        enemy.takeDamage(damage);
      }
    }
    
    // Damage player if in range
    if (gameState.player) {
      const dist = Math.sqrt(
        (gameState.player.x - this.x) ** 2 + 
        (gameState.player.y - this.y) ** 2
      );
      if (dist < this.blastRadius) {
        const damage = this.damage * 0.5 * (1 - dist / this.blastRadius);
        gameState.player.takeDamage(damage);
      }
    }
  }
  
  render(p) {
    if (this.exploded) return;
    
    p.push();
    p.translate(this.x - gameState.cameraX, this.y - gameState.cameraY);
    
    // Grenade body
    p.fill(50, 80, 50);
    p.noStroke();
    p.circle(0, 0, 8);
    
    // Flash when about to explode
    if (this.timer < 20 && this.timer % 6 < 3) {
      p.fill(255, 0, 0);
      p.circle(0, 0, 6);
    }
    
    p.pop();
  }
}

export class Mine {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 30;
    this.armed = false;
    this.armTimer = 30; // Arm after 0.5 seconds
    this.active = true;
    this.damage = 80;
  }
  
  update(p) {
    if (this.armTimer > 0) {
      this.armTimer--;
      if (this.armTimer === 0) {
        this.armed = true;
      }
      return;
    }
    
    if (!this.armed) return;
    
    // Check for enemies in trigger radius
    for (let enemy of gameState.enemies) {
      const dist = Math.sqrt((enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2);
      if (dist < this.radius) {
        this.explode(p);
        return;
      }
    }
  }
  
  explode(p) {
    this.active = false;
    
    // Create explosion particles
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2;
      const particle = new Particle(
        this.x,
        this.y,
        Math.cos(angle) * 2,
        Math.sin(angle) * 2,
        [255, 100, 0],
        15
      );
      gameState.particles.push(particle);
    }
    
    // Damage enemies in range
    for (let enemy of gameState.enemies) {
      const dist = Math.sqrt((enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2);
      if (dist < this.radius * 1.5) {
        enemy.takeDamage(this.damage);
      }
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x - gameState.cameraX, this.y - gameState.cameraY);
    
    // Mine body
    p.fill(this.armed ? [100, 0, 0] : [80, 80, 80]);
    p.stroke(50);
    p.strokeWeight(1);
    p.circle(0, 0, 12);
    
    // Trigger area indicator (subtle)
    if (this.armed) {
      p.noFill();
      p.stroke(255, 0, 0, 50);
      p.strokeWeight(1);
      p.circle(0, 0, this.radius * 2);
    }
    
    p.pop();
  }
}

export class Particle {
  constructor(x, y, vx, vy, color, lifetime) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.active = true;
  }
  
  update(p) {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.95;
    this.vy *= 0.95;
    this.lifetime--;
    
    if (this.lifetime <= 0) {
      this.active = false;
    }
  }
  
  render(p) {
    const alpha = (this.lifetime / this.maxLifetime) * 255;
    p.push();
    p.translate(this.x - gameState.cameraX, this.y - gameState.cameraY);
    p.fill(...this.color, alpha);
    p.noStroke();
    p.circle(0, 0, 4);
    p.pop();
  }
}