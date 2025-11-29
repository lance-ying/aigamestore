import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SPEED, PLAYER_SPRINT_SPEED, PLAYER_COVER_SPEED, BULLET_SPEED, ENEMY_SPEED, ENEMY_BULLET_SPEED, gameState, WEAPONS } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.health = 100;
    this.maxHealth = 100;
    this.currentWeapon = "pistol";
    this.weapons = {
      pistol: { ...WEAPONS.pistol },
      rifle: null,
      shotgun: null,
      sniper: null
    };
    this.ammo = this.weapons.pistol.ammo;
    this.maxAmmo = this.weapons.pistol.maxAmmo;
    this.reloadTime = this.weapons.pistol.reloadTime;
    this.reloading = false;
    this.reloadStart = 0;
    this.lastShot = 0;
    this.fireRate = this.weapons.pistol.fireRate;
    this.isSprinting = false;
    this.isCrouching = false;
    this.direction = 0;
    this.accuracy = this.weapons.pistol.accuracy;
    this.sprintAccuracy = this.weapons.pistol.sprintAccuracy;
    this.crouchAccuracy = this.weapons.pistol.crouchAccuracy;
    this.invincibilityTime = 0;
    this.lastHit = 0;
  }
  
  switchWeapon(weaponType) {
    if (this.weapons[weaponType] && !this.reloading) {
      this.currentWeapon = weaponType;
      const weapon = this.weapons[weaponType];
      this.ammo = weapon.ammo;
      this.maxAmmo = weapon.maxAmmo;
      this.fireRate = weapon.fireRate;
      this.reloadTime = weapon.reloadTime;
      this.accuracy = weapon.accuracy;
      this.sprintAccuracy = weapon.sprintAccuracy;
      this.crouchAccuracy = weapon.crouchAccuracy;
    }
  }
  
  pickupWeapon(weaponType) {
    this.weapons[weaponType] = { ...WEAPONS[weaponType] };
    this.switchWeapon(weaponType);
  }
  
  // Helper method for collision detection
  checkCollisionWithRect(circleX, circleY, circleRadius, rectX, rectY, rectWidth, rectHeight) {
    const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
    const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));
    const distanceX = circleX - closestX;
    const distanceY = circleY - closestY;
    return (distanceX * distanceX + distanceY * distanceY) < (circleRadius * circleRadius);
  }

  update(p, keys) {
    let dx = 0;
    let dy = 0;
    let speed = PLAYER_SPEED;
    let currentAccuracy = this.accuracy;

    if (keys.up || keys.down || keys.left || keys.right) {
      if (keys.up) dy -= 1;
      if (keys.down) dy += 1;
      if (keys.left) dx -= 1;
      if (keys.right) dx += 1;
      
      if (dx !== 0 || dy !== 0) {
        this.direction = Math.atan2(dy, dx);
      }
    }

    if (keys.sprint && !keys.crouch) {
      this.isSprinting = true;
      this.isCrouching = false;
      speed = PLAYER_SPRINT_SPEED;
      currentAccuracy = this.sprintAccuracy;
    } else if (keys.crouch && !keys.sprint) {
      this.isCrouching = true;
      this.isSprinting = false;
      speed = PLAYER_COVER_SPEED;
      currentAccuracy = this.crouchAccuracy;
    } else {
      this.isSprinting = false;
      this.isCrouching = false;
    }

    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx = dx / length;
      dy = dy / length;
    }

    const newX = this.x + dx * speed;
    const newY = this.y + dy * speed;

    let canMove = true;
    for (const obstacle of gameState.obstacles) {
      if (this.checkCollisionWithRect(newX, newY, this.radius, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
        canMove = false;
        break;
      }
    }

    if (newX - this.radius < 0 || newX + this.radius > gameState.level.width ||
        newY - this.radius < 0 || newY + this.radius > gameState.level.height) {
      canMove = false;
    }

    if (canMove) {
      this.x = newX;
      this.y = newY;
    }

    if (keys.shoot && !this.reloading && this.ammo > 0 && p.millis() - this.lastShot > this.fireRate) {
      this.shoot(p, currentAccuracy);
      this.lastShot = p.millis();
      this.ammo--;
      this.weapons[this.currentWeapon].ammo = this.ammo;
    }

    if (this.ammo === 0 && !this.reloading) {
      this.reloading = true;
      this.reloadStart = p.millis();
    }

    if (this.reloading && p.millis() - this.reloadStart > this.reloadTime) {
      this.reloading = false;
      this.ammo = this.maxAmmo;
      this.weapons[this.currentWeapon].ammo = this.ammo;
    }

    if (p.millis() - this.lastHit < this.invincibilityTime) {
      // Player is invincible
    }

    gameState.level.cameraX = p.constrain(this.x - CANVAS_WIDTH / 2, 0, gameState.level.width - CANVAS_WIDTH);
    gameState.level.cameraY = p.constrain(this.y - CANVAS_HEIGHT / 2, 0, gameState.level.height - CANVAS_HEIGHT);
  }

  shoot(p, accuracy) {
    const weapon = WEAPONS[this.currentWeapon];
    
    // Shotgun fires multiple pellets
    if (this.currentWeapon === "shotgun") {
      const pellets = weapon.pellets || 5;
      for (let i = 0; i < pellets; i++) {
        const spread = (Math.random() - 0.5) * accuracy;
        const bulletDirection = this.direction + spread;
        
        const bullet = new Bullet(
          this.x + Math.cos(this.direction) * (this.radius + 5),
          this.y + Math.sin(this.direction) * (this.radius + 5),
          bulletDirection,
          true,
          weapon.damage,
          weapon.bulletSpeed
        );
        
        gameState.bullets.push(bullet);
      }
    } else {
      const spread = (Math.random() - 0.5) * accuracy;
      const bulletDirection = this.direction + spread;
      
      const bullet = new Bullet(
        this.x + Math.cos(this.direction) * (this.radius + 5),
        this.y + Math.sin(this.direction) * (this.radius + 5),
        bulletDirection,
        true,
        weapon.damage,
        weapon.bulletSpeed
      );
      
      gameState.bullets.push(bullet);
    }
  }

  takeDamage(amount) {
    const now = Date.now();
    if (now - this.lastHit < this.invincibilityTime) {
      return;
    }
    
    this.health = Math.max(0, this.health - amount);
    this.lastHit = now;
    this.invincibilityTime = 500;
    
    if (this.health <= 0) {
      gameState.gamePhase = "GAME_OVER_LOSE";
    }
  }

  draw(p) {
    p.push();
    
    p.fill(0, 100, 255);
    if (Date.now() - this.lastHit < this.invincibilityTime) {
      if (Math.floor(Date.now() / 100) % 2 === 0) {
        p.fill(255, 100, 100);
      }
    }
    
    if (this.isCrouching) {
      p.fill(0, 80, 200);
    }
    
    p.circle(this.x - gameState.level.cameraX, this.y - gameState.level.cameraY, this.radius * 2);
    
    p.stroke(255);
    p.strokeWeight(3);
    p.line(
      this.x - gameState.level.cameraX,
      this.y - gameState.level.cameraY,
      this.x - gameState.level.cameraX + Math.cos(this.direction) * (this.radius + 5),
      this.y - gameState.level.cameraY + Math.sin(this.direction) * (this.radius + 5)
    );
    
    if (this.reloading) {
      const reloadProgress = (p.millis() - this.reloadStart) / this.reloadTime;
      p.noFill();
      p.stroke(255, 200, 0);
      p.arc(
        this.x - gameState.level.cameraX,
        this.y - gameState.level.cameraY,
        this.radius * 2.5,
        this.radius * 2.5,
        -p.HALF_PI,
        -p.HALF_PI + p.TWO_PI * reloadProgress
      );
    }
    
    p.pop();
  }
}

export class Enemy {
  constructor(x, y, type = "regular") {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 15;
    
    // Different stats based on type
    if (type === "elite") {
      this.health = 3;
      this.speed = ENEMY_SPEED * 1.2;
      this.fireRate = 1500;
      this.damage = 12;
      this.detectionRange = 250;
    } else if (type === "heavy") {
      this.health = 5;
      this.speed = ENEMY_SPEED * 0.7;
      this.fireRate = 2500;
      this.damage = 20;
      this.detectionRange = 200;
      this.radius = 18;
    } else if (type === "scout") {
      this.health = 1;
      this.speed = ENEMY_SPEED * 1.8;
      this.fireRate = 1800;
      this.damage = 8;
      this.detectionRange = 300;
      this.radius = 12;
    } else if (type === "sniper") {
      this.health = 2;
      this.speed = ENEMY_SPEED * 0.5;
      this.fireRate = 3000;
      this.damage = 25;
      this.detectionRange = 400;
      this.radius = 15;
    } else { // regular
      this.health = 1;
      this.speed = ENEMY_SPEED;
      this.fireRate = 2000;
      this.damage = 10;
      this.detectionRange = 250;
    }
    
    this.direction = Math.random() * Math.PI * 2;
    this.lastShot = 0;
    this.state = "patrol";
    this.patrolTimer = 0;
    this.patrolDuration = 2000;
    this.lastStateChange = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.takingCover = false;
    this.coverTimer = 0;
  }
  
  checkCollisionWithRect(circleX, circleY, circleRadius, rectX, rectY, rectWidth, rectHeight) {
    const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
    const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));
    const distanceX = circleX - closestX;
    const distanceY = circleY - closestY;
    return (distanceX * distanceX + distanceY * distanceY) < (circleRadius * circleRadius);
  }

  update(p, player) {
    const now = p.millis();
    const distToPlayer = p.dist(this.x, this.y, player.x, player.y);
    
    switch (this.state) {
      case "patrol":
        if (now - this.patrolTimer > this.patrolDuration) {
          this.direction = Math.random() * Math.PI * 2;
          this.patrolTimer = now;
        }
        
        this.x += Math.cos(this.direction) * this.speed * 0.5;
        this.y += Math.sin(this.direction) * this.speed * 0.5;
        
        this.handleCollisions(p);
        
        if (distToPlayer < this.detectionRange) {
          this.state = "chase";
          this.lastStateChange = now;
        }
        break;
        
      case "chase":
        const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
        this.direction = angleToPlayer;
        
        if (!this.takingCover && this.type !== "sniper") {
          this.x += Math.cos(this.direction) * this.speed;
          this.y += Math.sin(this.direction) * this.speed;
        }
        
        this.handleCollisions(p);
        
        if (distToPlayer < this.detectionRange * 0.7) {
          this.state = "attack";
          this.lastStateChange = now;
        }
        
        if (distToPlayer > this.detectionRange * 1.5) {
          this.state = "patrol";
          this.lastStateChange = now;
        }
        break;
        
      case "attack":
        this.direction = Math.atan2(player.y - this.y, player.x - this.x);
        
        if (!this.takingCover && Math.random() < 0.005 && this.type !== "sniper") {
          this.takingCover = true;
          this.coverTimer = now;
        }
        
        if (this.takingCover && now - this.coverTimer > 1500) {
          this.takingCover = false;
        }
        
        if (!this.takingCover && this.type !== "sniper" && this.type !== "heavy") {
          const strafeAngle = this.direction + (Math.random() > 0.5 ? Math.PI/2 : -Math.PI/2);
          this.x += Math.cos(strafeAngle) * this.speed * 0.3;
          this.y += Math.sin(strafeAngle) * this.speed * 0.3;
        }
        
        this.handleCollisions(p);
        
        if (now - this.lastShot > this.fireRate && !this.takingCover) {
          this.shoot(p);
          this.lastShot = now;
        }
        
        if (distToPlayer > this.detectionRange * 0.8 && this.type !== "sniper") {
          this.state = "chase";
          this.lastStateChange = now;
        }
        break;
    }
  }
  
  handleCollisions(p) {
    this.x = p.constrain(this.x, this.radius, gameState.level.width - this.radius);
    this.y = p.constrain(this.y, this.radius, gameState.level.height - this.radius);
    
    for (const obstacle of gameState.obstacles) {
      if (this.checkCollisionWithRect(this.x, this.y, this.radius, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
        this.x -= Math.cos(this.direction) * this.speed * 1.5;
        this.y -= Math.sin(this.direction) * this.speed * 1.5;
        this.direction += Math.PI / 4 * (Math.random() * 2 - 1);
        break;
      }
    }
  }

  shoot(p) {
    const spread = this.type === "sniper" ? 0.05 : (Math.random() - 0.5) * 0.2;
    const bulletDirection = this.direction + spread;
    
    const bullet = new Bullet(
      this.x + Math.cos(this.direction) * (this.radius + 5),
      this.y + Math.sin(this.direction) * (this.radius + 5),
      bulletDirection,
      false,
      this.damage,
      this.type === "sniper" ? ENEMY_BULLET_SPEED * 1.5 : ENEMY_BULLET_SPEED
    );
    
    gameState.enemyBullets.push(bullet);
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      return true;
    }
    return false;
  }

  draw(p) {
    p.push();
    
    if (this.type === "elite") {
      p.fill(200, 50, 0);
    } else if (this.type === "heavy") {
      p.fill(150, 50, 50);
    } else if (this.type === "scout") {
      p.fill(255, 150, 0);
    } else if (this.type === "sniper") {
      p.fill(100, 0, 150);
    } else {
      p.fill(200, 0, 0);
    }
    
    if (this.takingCover) {
      p.fill(150, 0, 0);
    }
    
    p.circle(this.x - gameState.level.cameraX, this.y - gameState.level.cameraY, this.radius * 2);
    
    p.stroke(255);
    p.strokeWeight(2);
    p.line(
      this.x - gameState.level.cameraX,
      this.y - gameState.level.cameraY,
      this.x - gameState.level.cameraX + Math.cos(this.direction) * (this.radius + 5),
      this.y - gameState.level.cameraY + Math.sin(this.direction) * (this.radius + 5)
    );
    
    if (this.health > 1) {
      for (let i = 0; i < this.health; i++) {
        p.fill(255, 0, 0);
        p.noStroke();
        p.circle(
          this.x - gameState.level.cameraX - 10 + i * 7,
          this.y - gameState.level.cameraY - 20,
          5
        );
      }
    }
    
    p.pop();
  }
}

export class Bullet {
  constructor(x, y, direction, isPlayerBullet, damage = 1, speed = BULLET_SPEED) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.speed = speed;
    this.radius = 3;
    this.isPlayerBullet = isPlayerBullet;
    this.damage = damage;
  }

  update() {
    this.x += Math.cos(this.direction) * this.speed;
    this.y += Math.sin(this.direction) * this.speed;
    
    if (this.x < 0 || this.x > gameState.level.width ||
        this.y < 0 || this.y > gameState.level.height) {
      return true;
    }
    
    return false;
  }

  draw(p) {
    p.push();
    p.fill(this.isPlayerBullet ? 255 : 255, 200, 0);
    p.noStroke();
    p.circle(this.x - gameState.level.cameraX, this.y - gameState.level.cameraY, this.radius * 2);
    p.pop();
  }
}

export class Obstacle {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  draw(p) {
    p.push();
    p.fill(80);
    p.rect(this.x - gameState.level.cameraX, this.y - gameState.level.cameraY, this.width, this.height);
    p.pop();
  }
}

export class Pickup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 10;
    this.pulseTime = 0;
  }

  update(p) {
    this.pulseTime += 0.05;
  }

  draw(p) {
    p.push();
    
    const pulseSize = Math.sin(this.pulseTime) * 3;
    
    if (this.type === "ammo") {
      p.fill(200, 200, 0);
      p.rect(
        this.x - this.radius - gameState.level.cameraX, 
        this.y - this.radius - gameState.level.cameraY,
        this.radius * 2 + pulseSize,
        this.radius * 2 + pulseSize
      );
    } else if (this.type === "health") {
      p.fill(0, 200, 100);
      p.rect(
        this.x - this.radius - gameState.level.cameraX,
        this.y - this.radius - gameState.level.cameraY,
        this.radius * 2 + pulseSize,
        this.radius * 2 + pulseSize
      );
      
      p.fill(255);
      p.rect(
        this.x - 2 - gameState.level.cameraX,
        this.y - 6 - gameState.level.cameraY,
        4,
        12
      );
      p.rect(
        this.x - 6 - gameState.level.cameraX,
        this.y - 2 - gameState.level.cameraY,
        12,
        4
      );
    }
    
    p.pop();
  }
}

export class WeaponPickup {
  constructor(x, y, weaponType) {
    this.x = x;
    this.y = y;
    this.weaponType = weaponType;
    this.radius = 12;
    this.pulseTime = 0;
  }

  update(p) {
    this.pulseTime += 0.05;
  }

  draw(p) {
    p.push();
    
    const pulseSize = Math.sin(this.pulseTime) * 3;
    
    // Different colors for different weapons
    if (this.weaponType === "rifle") {
      p.fill(100, 150, 255);
    } else if (this.weaponType === "shotgun") {
      p.fill(255, 100, 100);
    } else if (this.weaponType === "sniper") {
      p.fill(150, 100, 255);
    }
    
    p.rect(
      this.x - this.radius - gameState.level.cameraX,
      this.y - this.radius - gameState.level.cameraY,
      this.radius * 2 + pulseSize,
      this.radius * 2 + pulseSize
    );
    
    // Draw weapon initial
    p.fill(255);
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    const initial = this.weaponType.charAt(0).toUpperCase();
    p.text(initial, this.x - gameState.level.cameraX, this.y - gameState.level.cameraY);
    
    p.pop();
  }
}

export class ExtractionPoint {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 30;
    this.pulseTime = 0;
  }
  
  update(p) {
    this.pulseTime += 0.03;
  }
  
  draw(p) {
    p.push();
    
    const pulseSize = Math.sin(this.pulseTime) * 5;
    
    p.noFill();
    p.stroke(0, 255, 200);
    p.strokeWeight(2);
    p.circle(
      this.x - gameState.level.cameraX,
      this.y - gameState.level.cameraY,
      this.radius * 2 + pulseSize
    );
    
    p.fill(0, 200, 150, 100);
    p.noStroke();
    p.circle(
      this.x - gameState.level.cameraX,
      this.y - gameState.level.cameraY,
      this.radius * 2 - 10
    );
    
    p.fill(255);
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("H", this.x - gameState.level.cameraX, this.y - gameState.level.cameraY);
    
    p.pop();
  }
}