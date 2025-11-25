// entities.js
import { gameState, PLAYER_SIZE, ENEMY_SIZE, PLAYER_SPEED, PLAYER_SPRINT_SPEED, ENEMY_SPEED, ENEMY_ALERT_SPEED, ENEMY_VISION_RANGE, MELEE_RANGE, SHOOT_RANGE, BULLET_SPEED, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = PLAYER_SIZE;
    this.speed = PLAYER_SPEED;
    this.sprintSpeed = PLAYER_SPRINT_SPEED;
    this.health = 1;
    this.ammo = 15;
    this.maxAmmo = 15;
    this.isSprinting = false;
    this.attackCooldown = 0;
    this.shootCooldown = 0;
    this.direction = 0; // angle in radians
    this.isAlive = true;
  }

  update(p) {
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.shootCooldown > 0) this.shootCooldown--;
  }

  move(dx, dy, walls, p) {
    if (!this.isAlive) return;
    
    const currentSpeed = this.isSprinting ? this.sprintSpeed : this.speed;
    const newX = this.x + dx * currentSpeed;
    const newY = this.y + dy * currentSpeed;

    // Update direction based on movement
    if (dx !== 0 || dy !== 0) {
      this.direction = Math.atan2(dy, dx);
    }

    // Check collision with walls
    let canMoveX = true;
    let canMoveY = true;

    for (let wall of walls) {
      if (this.checkWallCollision(newX, this.y, wall)) {
        canMoveX = false;
      }
      if (this.checkWallCollision(this.x, newY, wall)) {
        canMoveY = false;
      }
    }

    if (canMoveX) this.x = newX;
    if (canMoveY) this.y = newY;

    // Keep player in bounds
    this.x = p.constrain(this.x, this.size / 2, CANVAS_WIDTH * 3 - this.size / 2);
    this.y = p.constrain(this.y, this.size / 2, CANVAS_HEIGHT * 3 - this.size / 2);
  }

  checkWallCollision(x, y, wall) {
    return x + this.size / 2 > wall.x &&
           x - this.size / 2 < wall.x + wall.w &&
           y + this.size / 2 > wall.y &&
           y - this.size / 2 < wall.y + wall.h;
  }

  meleeAttack(enemies, p) {
    if (this.attackCooldown > 0 || !this.isAlive) return false;

    this.attackCooldown = 20;

    for (let enemy of enemies) {
      if (!enemy.isAlive) continue;
      const dist = p.dist(this.x, this.y, enemy.x, enemy.y);
      if (dist < MELEE_RANGE) {
        enemy.takeDamage();
        return true;
      }
    }
    return false;
  }

  shoot(bullets, p) {
    if (this.shootCooldown > 0 || this.ammo <= 0 || !this.isAlive) return false;

    this.shootCooldown = 15;
    this.ammo--;

    const bullet = new Bullet(
      this.x,
      this.y,
      Math.cos(this.direction) * BULLET_SPEED,
      Math.sin(this.direction) * BULLET_SPEED,
      true
    );
    bullets.push(bullet);
    gameState.entities.push(bullet);
    return true;
  }

  takeDamage() {
    this.health--;
    if (this.health <= 0) {
      this.isAlive = false;
    }
  }

  render(p, camera) {
    if (!this.isAlive) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    p.translate(screenX, screenY);
    p.rotate(this.direction);

    // Body
    p.fill(255, 220, 100);
    p.noStroke();
    p.ellipse(0, 0, this.size, this.size);

    // Direction indicator
    p.fill(255, 100, 100);
    p.triangle(
      this.size / 2, 0,
      this.size / 4, -4,
      this.size / 4, 4
    );

    p.pop();

    // Attack cooldown indicator
    if (this.attackCooldown > 0) {
      p.fill(255, 50, 50, 100);
      p.noStroke();
      p.ellipse(screenX, screenY, this.size + 10, this.size + 10);
    }
  }
}

export class Enemy {
  constructor(x, y, patrolPoints = []) {
    this.x = x;
    this.y = y;
    this.size = ENEMY_SIZE;
    this.speed = ENEMY_SPEED;
    this.alertSpeed = ENEMY_ALERT_SPEED;
    this.health = 1;
    this.isAlive = true;
    this.isAlert = false;
    this.direction = 0;
    this.patrolPoints = patrolPoints.length > 0 ? patrolPoints : [{x, y}];
    this.currentPatrolIndex = 0;
    this.idleTimer = 0;
    this.shootCooldown = 0;
    this.lastKnownPlayerPos = null;
    this.searchTimer = 0;
  }

  update(player, walls, bullets, p) {
    if (!this.isAlive) return;

    if (this.shootCooldown > 0) this.shootCooldown--;
    
    const distToPlayer = p.dist(this.x, this.y, player.x, player.y);
    const canSeePlayer = this.canSeeTarget(player, walls, p);

    // Alert detection
    if (canSeePlayer && distToPlayer < ENEMY_VISION_RANGE) {
      this.isAlert = true;
      this.lastKnownPlayerPos = { x: player.x, y: player.y };
      this.searchTimer = 180; // 3 seconds at 60 FPS
    } else if (player.isSprinting && distToPlayer < ENEMY_VISION_RANGE * 1.5) {
      this.isAlert = true;
      this.lastKnownPlayerPos = { x: player.x, y: player.y };
      this.searchTimer = 120;
    }

    if (this.isAlert) {
      this.updateAlertBehavior(player, walls, bullets, p);
    } else {
      this.updatePatrolBehavior(p);
    }
  }

  updateAlertBehavior(player, walls, bullets, p) {
    const distToPlayer = p.dist(this.x, this.y, player.x, player.y);
    const canSeePlayer = this.canSeeTarget(player, walls, p);

    if (canSeePlayer) {
      // Face player
      this.direction = Math.atan2(player.y - this.y, player.x - this.x);

      // Shoot if in range
      if (distToPlayer < SHOOT_RANGE && this.shootCooldown === 0) {
        this.shoot(bullets, p);
      }

      // Move towards player but keep some distance
      if (distToPlayer > 100) {
        const dx = Math.cos(this.direction);
        const dy = Math.sin(this.direction);
        this.moveWithCollision(dx * this.alertSpeed, dy * this.alertSpeed, walls, p);
      } else if (distToPlayer < 60) {
        // Back away if too close
        const dx = Math.cos(this.direction);
        const dy = Math.sin(this.direction);
        this.moveWithCollision(-dx * this.alertSpeed, -dy * this.alertSpeed, walls, p);
      }
    } else if (this.lastKnownPlayerPos) {
      // Move to last known position
      const dx = this.lastKnownPlayerPos.x - this.x;
      const dy = this.lastKnownPlayerPos.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 5) {
        this.direction = Math.atan2(dy, dx);
        this.moveWithCollision((dx / dist) * this.alertSpeed, (dy / dist) * this.alertSpeed, walls, p);
      } else {
        this.searchTimer--;
        if (this.searchTimer <= 0) {
          this.isAlert = false;
          this.lastKnownPlayerPos = null;
        }
      }
    }
  }

  updatePatrolBehavior(p) {
    if (this.idleTimer > 0) {
      this.idleTimer--;
      return;
    }

    const target = this.patrolPoints[this.currentPatrolIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
      this.idleTimer = 60;
    } else {
      this.direction = Math.atan2(dy, dx);
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  moveWithCollision(dx, dy, walls, p) {
    const newX = this.x + dx;
    const newY = this.y + dy;

    let canMoveX = true;
    let canMoveY = true;

    for (let wall of walls) {
      if (this.checkWallCollision(newX, this.y, wall)) {
        canMoveX = false;
      }
      if (this.checkWallCollision(this.x, newY, wall)) {
        canMoveY = false;
      }
    }

    if (canMoveX) this.x = newX;
    if (canMoveY) this.y = newY;
  }

  checkWallCollision(x, y, wall) {
    return x + this.size / 2 > wall.x &&
           x - this.size / 2 < wall.x + wall.w &&
           y + this.size / 2 > wall.y &&
           y - this.size / 2 < wall.y + wall.h;
  }

  canSeeTarget(target, walls, p) {
    // Simple line of sight check
    for (let wall of walls) {
      if (p.collideLineRect(this.x, this.y, target.x, target.y, wall.x, wall.y, wall.w, wall.h)) {
        return false;
      }
    }
    return true;
  }

  shoot(bullets, p) {
    this.shootCooldown = 45;

    const bullet = new Bullet(
      this.x,
      this.y,
      Math.cos(this.direction) * BULLET_SPEED,
      Math.sin(this.direction) * BULLET_SPEED,
      false
    );
    bullets.push(bullet);
    gameState.entities.push(bullet);
  }

  takeDamage() {
    this.health--;
    if (this.health <= 0) {
      this.isAlive = false;
      gameState.kills++;
      gameState.score += 100;
    }
  }

  render(p, camera) {
    if (!this.isAlive) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    p.translate(screenX, screenY);
    p.rotate(this.direction);

    // Body
    p.fill(this.isAlert ? 255 : 150, 50, 50);
    p.noStroke();
    p.ellipse(0, 0, this.size, this.size);

    // Direction indicator
    p.fill(255);
    p.triangle(
      this.size / 2, 0,
      this.size / 4, -3,
      this.size / 4, 3
    );

    p.pop();

    // Alert indicator
    if (this.isAlert) {
      p.noFill();
      p.stroke(255, 50, 50);
      p.strokeWeight(2);
      p.ellipse(screenX, screenY, this.size + 15, this.size + 15);
    }
  }
}

export class Bullet {
  constructor(x, y, vx, vy, isPlayerBullet) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = 4;
    this.isPlayerBullet = isPlayerBullet;
    this.isActive = true;
    this.lifetime = 120; // 2 seconds
  }

  update(walls, p) {
    if (!this.isActive) return;

    this.x += this.vx;
    this.y += this.vy;
    this.lifetime--;

    // Check wall collision
    for (let wall of walls) {
      if (this.checkWallCollision(wall)) {
        this.isActive = false;
        return;
      }
    }

    // Check bounds
    if (this.x < 0 || this.x > CANVAS_WIDTH * 3 || this.y < 0 || this.y > CANVAS_HEIGHT * 3) {
      this.isActive = false;
    }

    if (this.lifetime <= 0) {
      this.isActive = false;
    }
  }

  checkWallCollision(wall) {
    return this.x > wall.x &&
           this.x < wall.x + wall.w &&
           this.y > wall.y &&
           this.y < wall.y + wall.h;
  }

  render(p, camera) {
    if (!this.isActive) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.fill(this.isPlayerBullet ? 255 : 255, this.isPlayerBullet ? 200 : 50, 0);
    p.noStroke();
    p.ellipse(screenX, screenY, this.size, this.size);

    // Trail
    p.fill(this.isPlayerBullet ? 255 : 255, this.isPlayerBullet ? 200 : 50, 0, 100);
    p.ellipse(screenX - this.vx * 0.3, screenY - this.vy * 0.3, this.size * 0.7, this.size * 0.7);
  }
}

export class Wall {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  render(p, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.fill(40, 40, 50);
    p.stroke(60, 60, 70);
    p.strokeWeight(2);
    p.rect(screenX, screenY, this.w, this.h);
  }
}