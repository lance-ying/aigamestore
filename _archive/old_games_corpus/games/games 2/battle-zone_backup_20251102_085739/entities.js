import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SPEED, PLAYER_SPRINT_SPEED, PLAYER_COVER_SPEED, BULLET_SPEED, ENEMY_SPEED, ENEMY_BULLET_SPEED, gameState, WEAPONS } from './globals.js';
import { canMoveTo } from './input.js';

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
    
    // Smooth movement properties
    this.velocityX = 0;
    this.velocityY = 0;
    this.acceleration = 0.5;
    this.friction = 0.85;
    this.dashVelocity = 15;
    this.dashDecay = 0.92;
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

  update(p, keys) {
    // Determine target speed based on state
    let targetSpeed = PLAYER_SPEED;
    if (this.isCrouching) {
      targetSpeed = PLAYER_COVER_SPEED;
    }
    
    // Calculate target velocity based on held keys
    let targetVelX = 0;
    let targetVelY = 0;
    
    if (keys.up) {
      targetVelY -= targetSpeed;
    }
    if (keys.down) {
      targetVelY += targetSpeed;
    }
    if (keys.left) {
      targetVelX -= targetSpeed;
    }
    if (keys.right) {
      targetVelX += targetSpeed;
    }
    
    // Normalize diagonal movement
    if (targetVelX !== 0 && targetVelY !== 0) {
      const length = Math.sqrt(targetVelX * targetVelX + targetVelY * targetVelY);
      targetVelX = (targetVelX / length) * targetSpeed;
      targetVelY = (targetVelY / length) * targetSpeed;
    }
    
    // Smoothly accelerate towards target velocity
    if (targetVelX !== 0 || targetVelY !== 0) {
      this.velocityX += (targetVelX - this.velocityX) * this.acceleration;
      this.velocityY += (targetVelY - this.velocityY) * this.acceleration;
    } else {
      // Apply friction when no input
      this.velocityX *= this.friction;
      this.velocityY *= this.friction;
      
      // Stop completely when velocity is very small
      if (Math.abs(this.velocityX) < 0.1) this.velocityX = 0;
      if (Math.abs(this.velocityY) < 0.1) this.velocityY = 0;
    }
    
    // Apply velocity with collision detection
    const newX = this.x + this.velocityX;
    const newY = this.y + this.velocityY;
    
    // Try moving on both axes
    if (canMoveTo(newX, newY, this.radius)) {
      this.x = newX;
      this.y = newY;
    } else {
      // Try moving on X axis only
      if (canMoveTo(newX, this.y, this.radius)) {
        this.x = newX;
      } else {
        this.velocityX = 0; // Stop X velocity if blocked
      }
      // Try moving on Y axis only
      if (canMoveTo(this.x, newY, this.radius)) {
        this.y = newY;
      } else {
        this.velocityY = 0; // Stop Y velocity if blocked
      }
    }
    
    // Set accuracy based on crouch state
    let currentAccuracy = this.accuracy;
    if (this.isCrouching) {
      currentAccuracy = this.crouchAccuracy;
    }

    // Handle shooting - only trigger on discrete key press
    if (keys.shoot && !this.reloading && this.ammo > 0 && p.millis() - this.lastShot > this.fireRate) {
      this.shoot(p, currentAccuracy);
      this.lastShot = p.millis();
      this.ammo--;
      this.weapons[this.currentWeapon].ammo = this.ammo;
    }

    // Handle reloading
    if (this.ammo === 0 && !this.reloading) {
      this.reloading = true;
      this.reloadStart = p.millis();
    }

    if (this.reloading && p.millis() - this.reloadStart > this.reloadTime) {
      this.reloading = false;
      this.ammo = this.maxAmmo;
      this.weapons[this.currentWeapon].ammo = this.ammo;
    }

    // Update camera to follow player
    gameState.level.cameraX = p.constrain(this.x - CANVAS_WIDTH / 2, 0, gameState.level.width - CANVAS_WIDTH);
    gameState.level.cameraY = p.constrain(this.y - CANVAS_HEIGHT / 2, 0, gameState.level.height - CANVAS_HEIGHT);
  }
  
  // Method to apply dash velocity boost
  applyDash() {
    // Add dash velocity in current direction
    this.velocityX += Math.cos(this.direction) * this.dashVelocity;
    this.velocityY += Math.sin(this.direction) * this.dashVelocity;
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
    } else if (type === "tank") {
      this.health = 10;
      this.speed = ENEMY_SPEED * 0.4;
      this.fireRate = 3500;
      this.damage = 30;
      this.detectionRange = 250;
      this.radius = 22;
      this.armor = true;
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
    this.avoidanceDirection = 0;
    this.avoidanceTimer = 0;
  }
  
  checkCollisionWithRect(circleX, circleY, circleRadius, rectX, rectY, rectWidth, rectHeight) {
    const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
    const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));
    const distanceX = circleX - closestX;
    const distanceY = circleY - closestY;
    return (distanceX * distanceX + distanceY * distanceY) < (circleRadius * circleRadius);
  }
  
  // Check if there's a clear line of sight to the player
  hasLineOfSight(player) {
    const steps = 20;
    const dx = (player.x - this.x) / steps;
    const dy = (player.y - this.y) / steps;
    
    for (let i = 0; i < steps; i++) {
      const checkX = this.x + dx * i;
      const checkY = this.y + dy * i;
      
      for (const obstacle of gameState.obstacles) {
        if (this.checkCollisionWithRect(checkX, checkY, 5, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  // Find a path around obstacles
  findPathDirection(targetX, targetY) {
    const directAngle = Math.atan2(targetY - this.y, targetX - this.x);
    
    // Check if direct path is clear
    const checkDist = 50;
    const checkX = this.x + Math.cos(directAngle) * checkDist;
    const checkY = this.y + Math.sin(directAngle) * checkDist;
    
    let blocked = false;
    for (const obstacle of gameState.obstacles) {
      if (this.checkCollisionWithRect(checkX, checkY, this.radius + 10, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
        blocked = true;
        break;
      }
    }
    
    if (!blocked) {
      return directAngle;
    }
    
    // Try angles to the left and right
    const testAngles = [
      directAngle + Math.PI / 4,
      directAngle - Math.PI / 4,
      directAngle + Math.PI / 2,
      directAngle - Math.PI / 2,
      directAngle + 3 * Math.PI / 4,
      directAngle - 3 * Math.PI / 4
    ];
    
    for (const angle of testAngles) {
      const testX = this.x + Math.cos(angle) * checkDist;
      const testY = this.y + Math.sin(angle) * checkDist;
      
      let clear = true;
      for (const obstacle of gameState.obstacles) {
        if (this.checkCollisionWithRect(testX, testY, this.radius + 10, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
          clear = false;
          break;
        }
      }
      
      if (clear) {
        return angle;
      }
    }
    
    return directAngle;
  }

  update(p, player) {
    const now = p.millis();
    const distToPlayer = p.dist(this.x, this.y, player.x, player.y);
    const hasLOS = this.hasLineOfSight(player);
    
    // Adjust detection range based on player's cover status
    let effectiveDetectionRange = this.detectionRange;
    if (player.isCrouching && !hasLOS) {
      // If player is crouching and there's no line of sight, reduce detection range significantly
      effectiveDetectionRange *= 0.3;
    } else if (player.isCrouching) {
      // Even with line of sight, crouching reduces detection
      effectiveDetectionRange *= 0.7;
    }
    
    switch (this.state) {
      case "patrol":
        if (now - this.patrolTimer > this.patrolDuration) {
          this.direction = Math.random() * Math.PI * 2;
          this.patrolTimer = now;
        }
        
        const patrolX = this.x + Math.cos(this.direction) * this.speed * 0.5;
        const patrolY = this.y + Math.sin(this.direction) * this.speed * 0.5;
        
        // Check for obstacles in patrol path
        let patrolBlocked = false;
        for (const obstacle of gameState.obstacles) {
          if (this.checkCollisionWithRect(patrolX, patrolY, this.radius, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
            patrolBlocked = true;
            break;
          }
        }
        
        if (!patrolBlocked) {
          this.x = patrolX;
          this.y = patrolY;
        } else {
          // Change direction if blocked
          this.direction += Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 4;
          this.patrolTimer = now;
        }
        
        this.handleCollisions(p);
        
        if (distToPlayer < effectiveDetectionRange && hasLOS) {
          this.state = "chase";
          this.lastStateChange = now;
        }
        break;
        
      case "chase":
        if (!hasLOS || distToPlayer > effectiveDetectionRange * 1.8) {
          // Lost sight of player
          this.state = "patrol";
          this.lastStateChange = now;
          break;
        }
        
        // Use smart pathfinding
        this.direction = this.findPathDirection(player.x, player.y);
        
        if (!this.takingCover && this.type !== "sniper" && this.type !== "tank") {
          this.x += Math.cos(this.direction) * this.speed;
          this.y += Math.sin(this.direction) * this.speed;
        } else if (this.type === "tank") {
          // Tanks move slowly but steadily
          this.x += Math.cos(this.direction) * this.speed;
          this.y += Math.sin(this.direction) * this.speed;
        }
        
        this.handleCollisions(p);
        
        if (distToPlayer < effectiveDetectionRange * 0.7 && hasLOS) {
          this.state = "attack";
          this.lastStateChange = now;
        }
        break;
        
      case "attack":
        if (!hasLOS || distToPlayer > effectiveDetectionRange * 1.5) {
          // Lost sight of player
          this.state = "chase";
          this.lastStateChange = now;
          break;
        }
        
        this.direction = Math.atan2(player.y - this.y, player.x - this.x);
        
        if (!this.takingCover && Math.random() < 0.005 && this.type !== "sniper" && this.type !== "tank") {
          this.takingCover = true;
          this.coverTimer = now;
        }
        
        if (this.takingCover && now - this.coverTimer > 1500) {
          this.takingCover = false;
        }
        
        // Strafe behavior for most enemies
        if (!this.takingCover && this.type !== "sniper" && this.type !== "heavy" && this.type !== "tank") {
          const strafeAngle = this.direction + (Math.random() > 0.5 ? Math.PI/2 : -Math.PI/2);
          const strafeX = this.x + Math.cos(strafeAngle) * this.speed * 0.3;
          const strafeY = this.y + Math.sin(strafeAngle) * this.speed * 0.3;
          
          // Check if strafe is safe
          let safeToStrafe = true;
          for (const obstacle of gameState.obstacles) {
            if (this.checkCollisionWithRect(strafeX, strafeY, this.radius, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
              safeToStrafe = false;
              break;
            }
          }
          
          if (safeToStrafe) {
            this.x = strafeX;
            this.y = strafeY;
          }
        }
        
        this.handleCollisions(p);
        
        // Only shoot if has line of sight
        if (now - this.lastShot > this.fireRate && !this.takingCover && hasLOS) {
          this.shoot(p);
          this.lastShot = now;
        }
        
        if (distToPlayer > effectiveDetectionRange * 0.9 && this.type !== "sniper") {
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
        // Push away from obstacle
        this.x -= Math.cos(this.direction) * this.speed * 2;
        this.y -= Math.sin(this.direction) * this.speed * 2;
        break;
      }
    }
  }

  shoot(p) {
    const spread = this.type === "sniper" ? 0.05 : this.type === "tank" ? 0.15 : (Math.random() - 0.5) * 0.2;
    const bulletDirection = this.direction + spread;
    
    const bullet = new Bullet(
      this.x + Math.cos(this.direction) * (this.radius + 5),
      this.y + Math.sin(this.direction) * (this.radius + 5),
      bulletDirection,
      false,
      this.damage,
      this.type === "sniper" ? ENEMY_BULLET_SPEED * 1.5 : this.type === "tank" ? ENEMY_BULLET_SPEED * 0.8 : ENEMY_BULLET_SPEED
    );
    
    gameState.enemyBullets.push(bullet);
  }

  takeDamage(amount) {
    // Tanks have armor - reduce damage
    if (this.type === "tank") {
      amount = Math.ceil(amount * 0.6);
    }
    
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
    } else if (this.type === "tank") {
      p.fill(80, 80, 80);
    } else {
      p.fill(200, 0, 0);
    }
    
    if (this.takingCover) {
      p.fill(150, 0, 0);
    }
    
    p.circle(this.x - gameState.level.cameraX, this.y - gameState.level.cameraY, this.radius * 2);
    
    // Draw armor indicator for tanks
    if (this.type === "tank") {
      p.noFill();
      p.stroke(150, 150, 150);
      p.strokeWeight(2);
      p.circle(this.x - gameState.level.cameraX, this.y - gameState.level.cameraY, this.radius * 2 + 4);
    }
    
    p.stroke(255);
    p.strokeWeight(2);
    p.line(
      this.x - gameState.level.cameraX,
      this.y - gameState.level.cameraY,
      this.x - gameState.level.cameraX + Math.cos(this.direction) * (this.radius + 5),
      this.y - gameState.level.cameraY + Math.sin(this.direction) * (this.radius + 5)
    );
    
    if (this.health > 1) {
      for (let i = 0; i < Math.min(this.health, 10); i++) {
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