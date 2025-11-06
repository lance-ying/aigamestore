import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SPEED, PLAYER_SPRINT_SPEED, PLAYER_COVER_SPEED, BULLET_SPEED, ENEMY_SPEED, ENEMY_BULLET_SPEED, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.health = 100;
    this.maxHealth = 100;
    this.ammo = 30;
    this.maxAmmo = 30;
    this.reloadTime = 2000; // ms
    this.reloading = false;
    this.reloadStart = 0;
    this.lastShot = 0;
    this.fireRate = 300; // ms
    this.isSprinting = false;
    this.isCrouching = false;
    this.direction = 0; // angle in radians
    this.accuracy = 0.05; // bullet spread
    this.sprintAccuracy = 0.2;
    this.crouchAccuracy = 0.01;
    this.invincibilityTime = 0;
    this.lastHit = 0;
  }
  
  // Helper method for collision detection
  checkCollisionWithRect(circleX, circleY, circleRadius, rectX, rectY, rectWidth, rectHeight) {
    // Find the closest point on the rectangle to the circle
    const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
    const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));
    
    // Calculate the distance from the circle to this closest point
    const distanceX = circleX - closestX;
    const distanceY = circleY - closestY;
    
    // If the distance is less than the circle's radius, an intersection occurs
    return (distanceX * distanceX + distanceY * distanceY) < (circleRadius * circleRadius);
  }

  update(p, keys) {
    let dx = 0;
    let dy = 0;
    let speed = PLAYER_SPEED;
    let currentAccuracy = this.accuracy;

    // Update direction based on movement
    if (keys.up || keys.down || keys.left || keys.right) {
      if (keys.up) dy -= 1;
      if (keys.down) dy += 1;
      if (keys.left) dx -= 1;
      if (keys.right) dx += 1;
      
      if (dx !== 0 || dy !== 0) {
        this.direction = Math.atan2(dy, dx);
      }
    }

    // Handle sprinting and crouching
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

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx = dx / length;
      dy = dy / length;
    }

    // Apply movement
    const newX = this.x + dx * speed;
    const newY = this.y + dy * speed;

    // Check collision with obstacles
    let canMove = true;
    for (const obstacle of gameState.obstacles) {
      if (this.checkCollisionWithRect(newX, newY, this.radius, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
        canMove = false;
        break;
      }
    }

    // Boundary check
    if (newX - this.radius < 0 || newX + this.radius > gameState.level.width ||
        newY - this.radius < 0 || newY + this.radius > gameState.level.height) {
      canMove = false;
    }

    if (canMove) {
      this.x = newX;
      this.y = newY;
    }

    // Handle shooting
    if (keys.shoot && !this.reloading && this.ammo > 0 && p.millis() - this.lastShot > this.fireRate) {
      this.shoot(p, currentAccuracy);
      this.lastShot = p.millis();
      this.ammo--;
    }

    // Handle reloading
    if (this.ammo === 0 && !this.reloading) {
      this.reloading = true;
      this.reloadStart = p.millis();
    }

    if (this.reloading && p.millis() - this.reloadStart > this.reloadTime) {
      this.reloading = false;
      this.ammo = this.maxAmmo;
    }

    // Check for invincibility frames
    if (p.millis() - this.lastHit < this.invincibilityTime) {
      // Player is invincible
    }

    // Update camera position
    gameState.level.cameraX = p.constrain(this.x - CANVAS_WIDTH / 2, 0, gameState.level.width - CANVAS_WIDTH);
    gameState.level.cameraY = p.constrain(this.y - CANVAS_HEIGHT / 2, 0, gameState.level.height - CANVAS_HEIGHT);
  }

  shoot(p, accuracy) {
    // Add random spread based on accuracy
    const spread = (Math.random() - 0.5) * accuracy;
    const bulletDirection = this.direction + spread;
    
    const bullet = new Bullet(
      this.x + Math.cos(this.direction) * (this.radius + 5),
      this.y + Math.sin(this.direction) * (this.radius + 5),
      bulletDirection,
      true // isPlayerBullet
    );
    
    gameState.bullets.push(bullet);
  }

  takeDamage(amount) {
    const now = Date.now();
    if (now - this.lastHit < this.invincibilityTime) {
      return; // Still invincible
    }
    
    this.health = Math.max(0, this.health - amount);
    this.lastHit = now;
    this.invincibilityTime = 500; // 0.5 seconds of invincibility
    
    if (this.health <= 0) {
      gameState.gamePhase = "GAME_OVER_LOSE";
    }
  }

  draw(p) {
    p.push();
    
    // Draw player body
    p.fill(0, 100, 255);
    if (Date.now() - this.lastHit < this.invincibilityTime) {
      // Flash when hit
      if (Math.floor(Date.now() / 100) % 2 === 0) {
        p.fill(255, 100, 100);
      }
    }
    
    if (this.isCrouching) {
      p.fill(0, 80, 200); // Darker blue when crouching
    }
    
    p.circle(this.x - gameState.level.cameraX, this.y - gameState.level.cameraY, this.radius * 2);
    
    // Draw direction indicator
    p.stroke(255);
    p.strokeWeight(3);
    p.line(
      this.x - gameState.level.cameraX,
      this.y - gameState.level.cameraY,
      this.x - gameState.level.cameraX + Math.cos(this.direction) * (this.radius + 5),
      this.y - gameState.level.cameraY + Math.sin(this.direction) * (this.radius + 5)
    );
    
    // Draw reloading indicator if reloading
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
    this.health = type === "elite" ? 3 : 1;
    this.speed = type === "elite" ? ENEMY_SPEED * 1.2 : ENEMY_SPEED;
    this.direction = Math.random() * Math.PI * 2;
    this.lastShot = 0;
    this.fireRate = type === "elite" ? 1500 : 2000; // ms
    this.detectionRange = 250;
    this.state = "patrol"; // patrol, chase, attack
    this.patrolTimer = 0;
    this.patrolDuration = 2000;
    this.lastStateChange = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.takingCover = false;
    this.coverTimer = 0;
  }
  
  // Helper method for collision detection
  checkCollisionWithRect(circleX, circleY, circleRadius, rectX, rectY, rectWidth, rectHeight) {
    // Find the closest point on the rectangle to the circle
    const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
    const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));
    
    // Calculate the distance from the circle to this closest point
    const distanceX = circleX - closestX;
    const distanceY = circleY - closestY;
    
    // If the distance is less than the circle's radius, an intersection occurs
    return (distanceX * distanceX + distanceY * distanceY) < (circleRadius * circleRadius);
  }

  update(p, player) {
    const now = p.millis();
    const distToPlayer = p.dist(this.x, this.y, player.x, player.y);
    
    // State machine for enemy AI
    switch (this.state) {
      case "patrol":
        // Random movement
        if (now - this.patrolTimer > this.patrolDuration) {
          this.direction = Math.random() * Math.PI * 2;
          this.patrolTimer = now;
        }
        
        // Move in patrol direction
        this.x += Math.cos(this.direction) * this.speed * 0.5;
        this.y += Math.sin(this.direction) * this.speed * 0.5;
        
        // Boundary check and collision with obstacles
        this.handleCollisions(p);
        
        // Detect player
        if (distToPlayer < this.detectionRange) {
          this.state = "chase";
          this.lastStateChange = now;
        }
        break;
        
      case "chase":
        // Move towards player
        const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
        this.direction = angleToPlayer;
        
        // Only move if not taking cover
        if (!this.takingCover) {
          this.x += Math.cos(this.direction) * this.speed;
          this.y += Math.sin(this.direction) * this.speed;
        }
        
        // Boundary check and collision with obstacles
        this.handleCollisions(p);
        
        // Attack if close enough
        if (distToPlayer < this.detectionRange * 0.7) {
          this.state = "attack";
          this.lastStateChange = now;
        }
        
        // Lose track of player
        if (distToPlayer > this.detectionRange * 1.5) {
          this.state = "patrol";
          this.lastStateChange = now;
        }
        break;
        
      case "attack":
        // Face player
        this.direction = Math.atan2(player.y - this.y, player.x - this.x);
        
        // Randomly take cover
        if (!this.takingCover && Math.random() < 0.005) {
          this.takingCover = true;
          this.coverTimer = now;
        }
        
        if (this.takingCover && now - this.coverTimer > 1500) {
          this.takingCover = false;
        }
        
        // Move less when attacking, maybe strafe
        if (!this.takingCover) {
          // Strafe perpendicular to player direction
          const strafeAngle = this.direction + (Math.random() > 0.5 ? Math.PI/2 : -Math.PI/2);
          this.x += Math.cos(strafeAngle) * this.speed * 0.3;
          this.y += Math.sin(strafeAngle) * this.speed * 0.3;
        }
        
        // Boundary check and collision with obstacles
        this.handleCollisions(p);
        
        // Shoot at player
        if (now - this.lastShot > this.fireRate && !this.takingCover) {
          this.shoot(p);
          this.lastShot = now;
        }
        
        // Move back to chase if player gets too far
        if (distToPlayer > this.detectionRange * 0.8) {
          this.state = "chase";
          this.lastStateChange = now;
        }
        break;
    }
  }
  
  handleCollisions(p) {
    // Boundary checks
    this.x = p.constrain(this.x, this.radius, gameState.level.width - this.radius);
    this.y = p.constrain(this.y, this.radius, gameState.level.height - this.radius);
    
    // Obstacle collisions
    for (const obstacle of gameState.obstacles) {
      if (this.checkCollisionWithRect(this.x, this.y, this.radius, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
        // Simple bounce back
        this.x -= Math.cos(this.direction) * this.speed * 1.5;
        this.y -= Math.sin(this.direction) * this.speed * 1.5;
        
        // Change direction slightly
        this.direction += Math.PI / 4 * (Math.random() * 2 - 1);
        break;
      }
    }
  }

  shoot(p) {
    // Add some inaccuracy
    const spread = (Math.random() - 0.5) * 0.2;
    const bulletDirection = this.direction + spread;
    
    const bullet = new Bullet(
      this.x + Math.cos(this.direction) * (this.radius + 5),
      this.y + Math.sin(this.direction) * (this.radius + 5),
      bulletDirection,
      false // not a player bullet
    );
    
    gameState.enemyBullets.push(bullet);
  }

  takeDamage() {
    this.health--;
    if (this.health <= 0) {
      return true; // Enemy is dead
    }
    return false;
  }

  draw(p) {
    p.push();
    
    // Draw enemy body
    if (this.type === "elite") {
      p.fill(200, 50, 0); // Red for elite enemies
    } else {
      p.fill(200, 0, 0); // Darker red for regular enemies
    }
    
    if (this.takingCover) {
      p.fill(150, 0, 0); // Even darker when taking cover
    }
    
    p.circle(this.x - gameState.level.cameraX, this.y - gameState.level.cameraY, this.radius * 2);
    
    // Draw direction indicator
    p.stroke(255);
    p.strokeWeight(2);
    p.line(
      this.x - gameState.level.cameraX,
      this.y - gameState.level.cameraY,
      this.x - gameState.level.cameraX + Math.cos(this.direction) * (this.radius + 5),
      this.y - gameState.level.cameraY + Math.sin(this.direction) * (this.radius + 5)
    );
    
    // Draw health indicators for elite enemies
    if (this.type === "elite") {
      for (let i = 0; i < this.health; i++) {
        p.fill(255, 0, 0);
        p.noStroke();
        p.circle(
          this.x - gameState.level.cameraX - 10 + i * 10,
          this.y - gameState.level.cameraY - 20,
          5
        );
      }
    }
    
    p.pop();
  }
}

export class Bullet {
  constructor(x, y, direction, isPlayerBullet) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.speed = isPlayerBullet ? BULLET_SPEED : ENEMY_BULLET_SPEED;
    this.radius = 3;
    this.isPlayerBullet = isPlayerBullet;
    this.damage = isPlayerBullet ? 1 : 10;
  }

  update() {
    this.x += Math.cos(this.direction) * this.speed;
    this.y += Math.sin(this.direction) * this.speed;
    
    // Check if bullet is out of bounds
    if (this.x < 0 || this.x > gameState.level.width ||
        this.y < 0 || this.y > gameState.level.height) {
      return true; // Remove bullet
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
    this.type = type; // "ammo" or "health"
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
      
      // Draw cross
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
    
    // Draw outer circle
    p.noFill();
    p.stroke(0, 255, 200);
    p.strokeWeight(2);
    p.circle(
      this.x - gameState.level.cameraX,
      this.y - gameState.level.cameraY,
      this.radius * 2 + pulseSize
    );
    
    // Draw inner circle
    p.fill(0, 200, 150, 100);
    p.noStroke();
    p.circle(
      this.x - gameState.level.cameraX,
      this.y - gameState.level.cameraY,
      this.radius * 2 - 10
    );
    
    // Draw helicopter icon
    p.fill(255);
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("H", this.x - gameState.level.cameraX, this.y - gameState.level.cameraY);
    
    p.pop();
  }
}