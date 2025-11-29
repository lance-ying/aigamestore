// entities.js - Game entity classes
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CONFIG, POWERUP_TYPES } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.rectangle(x, y, 30, 20, {
      label: 'player',
      friction: 0,
      frictionAir: 0.05,
      restitution: 0,
      inertia: Infinity,
      density: 0.01
    });
    World.add(gameState.world, this.body);
    
    this.health = CONFIG.PLAYER_MAX_HEALTH;
    this.invulnerable = 0;
    this.width = 30;
    this.height = 20;
    this.lastShot = 0;
    this.shootCooldown = 8;
  }

  update() {
    // Boundary constraints
    if (this.body.position.x < 15) Body.setPosition(this.body, { x: 15, y: this.body.position.y });
    if (this.body.position.x > CANVAS_WIDTH - 15) Body.setPosition(this.body, { x: CANVAS_WIDTH - 15, y: this.body.position.y });
    if (this.body.position.y < 10) Body.setPosition(this.body, { x: this.body.position.x, y: 10 });
    if (this.body.position.y > CANVAS_HEIGHT - 10) Body.setPosition(this.body, { x: this.body.position.x, y: CANVAS_HEIGHT - 10 });

    if (this.invulnerable > 0) this.invulnerable--;

    // Log player position periodically
    if (this.p.frameCount - gameState.lastPlayerLogFrame > 30) {
      this.p.logs.player_info.push({
        screen_x: this.body.position.x,
        screen_y: this.body.position.y,
        game_x: this.body.position.x,
        game_y: this.body.position.y,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
      gameState.lastPlayerLogFrame = this.p.frameCount;
    }
  }

  render() {
    const p = this.p;
    p.push();
    p.translate(this.body.position.x, this.body.position.y);
    
    // Flashing when invulnerable
    if (this.invulnerable > 0 && this.p.frameCount % 6 < 3) {
      p.pop();
      return;
    }

    // Ship body
    p.fill(100, 150, 255);
    p.noStroke();
    p.beginShape();
    p.vertex(15, 0);
    p.vertex(-15, -8);
    p.vertex(-10, 0);
    p.vertex(-15, 8);
    p.endShape(p.CLOSE);

    // Cockpit
    p.fill(50, 100, 200);
    p.ellipse(5, 0, 8, 8);

    // Engine glow
    p.fill(255, 150, 50, 150);
    p.ellipse(-12, 0, 6, 6);

    p.pop();
  }

  takeDamage(amount) {
    if (this.invulnerable > 0) return;
    this.health -= amount;
    this.invulnerable = 60;
    
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    gameState.lives--;
    createExplosion(this.p, this.body.position.x, this.body.position.y, 30);
    
    if (gameState.lives <= 0) {
      gameState.gamePhase = "GAME_OVER_LOSE";
      this.p.logs.game_info.push({
        data: { gamePhase: "GAME_OVER_LOSE", finalScore: gameState.score },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    } else {
      this.respawn();
    }
  }

  respawn() {
    Body.setPosition(this.body, { x: 100, y: CANVAS_HEIGHT / 2 });
    Body.setVelocity(this.body, { x: 0, y: 0 });
    this.health = CONFIG.PLAYER_MAX_HEALTH;
    this.invulnerable = 120;
  }

  shoot() {
    if (this.p.frameCount - this.lastShot < this.shootCooldown) return;
    this.lastShot = this.p.frameCount;

    const bulletOffsets = [
      [{ x: 15, y: 0 }],
      [{ x: 15, y: -3 }, { x: 15, y: 3 }],
      [{ x: 15, y: -5 }, { x: 15, y: 0 }, { x: 15, y: 5 }]
    ];

    const offsets = bulletOffsets[Math.min(gameState.weaponLevel - 1, 2)];
    offsets.forEach(offset => {
      gameState.bullets.push(new Bullet(this.p, 
        this.body.position.x + offset.x, 
        this.body.position.y + offset.y, 
        CONFIG.BULLET_SPEED, 0
      ));
    });

    if (gameState.hasMissiles && this.p.frameCount % 30 === 0) {
      gameState.bullets.push(new Missile(this.p, 
        this.body.position.x, 
        this.body.position.y - 10
      ));
      gameState.bullets.push(new Missile(this.p, 
        this.body.position.x, 
        this.body.position.y + 10
      ));
    }
  }

  shootChargedBeam() {
    const beamWidth = 10 + gameState.weaponLevel * 5;
    const beamLength = 300;
    gameState.bullets.push(new ChargedBeam(this.p, 
      this.body.position.x + 20, 
      this.body.position.y, 
      beamWidth, 
      beamLength
    ));
  }
}

export class ForcePod {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.circle(x, y, 12, {
      label: 'forcePod',
      friction: 0,
      frictionAir: 0.05,
      restitution: 0.5,
      density: 0.01
    });
    World.add(gameState.world, this.body);
    
    this.attached = true;
    this.attachSide = 'front'; // 'front' or 'back'
    this.radius = 12;
    this.launched = false;
  }

  update() {
    if (this.attached && gameState.player) {
      const offsetX = this.attachSide === 'front' ? 25 : -25;
      Body.setPosition(this.body, {
        x: gameState.player.body.position.x + offsetX,
        y: gameState.player.body.position.y
      });
      Body.setVelocity(this.body, { x: 0, y: 0 });
    } else if (this.launched) {
      // Continue moving forward when launched
      if (this.body.position.x > CANVAS_WIDTH + 20) {
        this.launched = false;
        this.returnToPlayer();
      }
    }

    // Boundary check
    if (this.body.position.x < -20 || this.body.position.x > CANVAS_WIDTH + 20 ||
        this.body.position.y < -20 || this.body.position.y > CANVAS_HEIGHT + 20) {
      this.returnToPlayer();
    }
  }

  render() {
    const p = this.p;
    p.push();
    p.translate(this.body.position.x, this.body.position.y);
    
    // Outer shell
    p.fill(255, 200, 50);
    p.noStroke();
    p.circle(0, 0, this.radius * 2);

    // Inner core
    p.fill(255, 100, 50);
    p.circle(0, 0, this.radius);

    // Rotating energy ring
    p.noFill();
    p.stroke(255, 255, 100);
    p.strokeWeight(2);
    p.push();
    p.rotate(this.p.frameCount * 0.1);
    p.ellipse(0, 0, this.radius * 2.5, this.radius * 1.5);
    p.pop();

    p.pop();
  }

  detach() {
    this.attached = false;
    this.launched = false;
  }

  attach(side = 'front') {
    this.attached = true;
    this.attachSide = side;
    this.launched = false;
    Body.setVelocity(this.body, { x: 0, y: 0 });
  }

  launch() {
    this.attached = false;
    this.launched = true;
    Body.setVelocity(this.body, { x: CONFIG.FORCE_POD_SPEED, y: 0 });
  }

  returnToPlayer() {
    if (gameState.player) {
      Body.setPosition(this.body, {
        x: gameState.player.body.position.x + 25,
        y: gameState.player.body.position.y
      });
      this.attach('front');
    }
  }
}

export class Bullet {
  constructor(p, x, y, vx, vy) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 3;
    this.damage = 10 * gameState.weaponLevel;
    this.dead = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < -10 || this.x > CANVAS_WIDTH + 10 ||
        this.y < -10 || this.y > CANVAS_HEIGHT + 10) {
      this.dead = true;
    }
  }

  render() {
    this.p.push();
    this.p.fill(100, 255, 255);
    this.p.noStroke();
    this.p.circle(this.x, this.y, this.radius * 2);
    
    // Trail
    this.p.fill(100, 255, 255, 100);
    this.p.circle(this.x - this.vx, this.y - this.vy, this.radius);
    this.p.pop();
  }

  checkCollision(enemy) {
    const dx = this.x - enemy.body.position.x;
    const dy = this.y - enemy.body.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + enemy.radius;
  }
}

export class Missile extends Bullet {
  constructor(p, x, y) {
    super(p, x, y, CONFIG.BULLET_SPEED * 0.8, 0);
    this.radius = 4;
    this.damage = 25;
    this.target = null;
    this.tracking = true;
  }

  update() {
    // Simple homing behavior
    if (this.tracking && gameState.enemies.length > 0) {
      let closest = null;
      let closestDist = Infinity;
      
      gameState.enemies.forEach(enemy => {
        const dx = enemy.body.position.x - this.x;
        const dy = enemy.body.position.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist && dx > 0) {
          closestDist = dist;
          closest = enemy;
        }
      });

      if (closest) {
        const dx = closest.body.position.x - this.x;
        const dy = closest.body.position.y - this.y;
        const angle = Math.atan2(dy, dx);
        this.vx = Math.cos(angle) * CONFIG.BULLET_SPEED * 0.8;
        this.vy = Math.sin(angle) * CONFIG.BULLET_SPEED * 0.8;
      }
    }

    super.update();
  }

  render() {
    this.p.push();
    this.p.fill(255, 150, 50);
    this.p.noStroke();
    this.p.ellipse(this.x, this.y, this.radius * 3, this.radius * 2);
    
    // Exhaust trail
    this.p.fill(255, 100, 50, 150);
    this.p.circle(this.x - this.vx * 2, this.y - this.vy * 2, this.radius);
    this.p.pop();
  }
}

export class ChargedBeam {
  constructor(p, x, y, width, length) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.length = length;
    this.damage = 50 + gameState.weaponLevel * 20;
    this.duration = 20;
    this.age = 0;
    this.dead = false;
  }

  update() {
    this.age++;
    if (this.age > this.duration) {
      this.dead = true;
    }
  }

  render() {
    const alpha = 255 * (1 - this.age / this.duration);
    this.p.push();
    
    // Outer glow
    this.p.fill(100, 200, 255, alpha * 0.3);
    this.p.noStroke();
    this.p.rect(this.x, this.y - this.width, this.length, this.width * 2);
    
    // Inner beam
    this.p.fill(200, 255, 255, alpha);
    this.p.rect(this.x, this.y - this.width * 0.5, this.length, this.width);
    
    this.p.pop();
  }

  checkCollision(enemy) {
    return enemy.body.position.x >= this.x &&
           enemy.body.position.x <= this.x + this.length &&
           Math.abs(enemy.body.position.y - this.y) < this.width + enemy.radius;
  }
}

export class Enemy {
  constructor(p, x, y, type = 'basic') {
    this.p = p;
    this.type = type;
    this.radius = 15;
    
    this.body = Bodies.circle(x, y, this.radius, {
      label: 'enemy',
      friction: 0,
      frictionAir: 0.02,
      restitution: 0,
      density: 0.01
    });
    World.add(gameState.world, this.body);

    this.health = 20 + gameState.currentLevel * 10;
    this.maxHealth = this.health;
    this.dead = false;
    this.lastShot = 0;
    this.shootCooldown = 90 - gameState.currentLevel * 10;
    this.movePattern = Math.floor(this.p.random(3));
    this.timeAlive = 0;
  }

  update() {
    this.timeAlive++;

    // Movement patterns
    let vx = -2 - gameState.currentLevel * 0.3;
    let vy = 0;

    switch (this.movePattern) {
      case 0: // Straight
        break;
      case 1: // Sine wave
        vy = Math.sin(this.timeAlive * 0.05) * 2;
        break;
      case 2: // Dive
        if (gameState.player && this.timeAlive > 30) {
          const dy = gameState.player.body.position.y - this.body.position.y;
          vy = dy * 0.02;
        }
        break;
    }

    Body.setVelocity(this.body, { x: vx, y: vy });

    // Shoot at player
    if (this.p.frameCount - this.lastShot > this.shootCooldown) {
      this.shoot();
      this.lastShot = this.p.frameCount;
    }

    // Remove if off screen
    if (this.body.position.x < -50) {
      this.dead = true;
    }
  }

  render() {
    const p = this.p;
    p.push();
    p.translate(this.body.position.x, this.body.position.y);

    // Enemy body
    p.fill(255, 50, 50);
    p.noStroke();
    p.beginShape();
    p.vertex(-this.radius, 0);
    p.vertex(-this.radius * 0.5, -this.radius);
    p.vertex(this.radius * 0.5, -this.radius * 0.5);
    p.vertex(this.radius, 0);
    p.vertex(this.radius * 0.5, this.radius * 0.5);
    p.vertex(-this.radius * 0.5, this.radius);
    p.endShape(p.CLOSE);

    // Core
    p.fill(255, 100, 100);
    p.circle(0, 0, this.radius * 0.8);

    // Health bar
    const healthRatio = this.health / this.maxHealth;
    p.fill(255, 0, 0);
    p.rect(-this.radius, -this.radius - 5, this.radius * 2, 3);
    p.fill(0, 255, 0);
    p.rect(-this.radius, -this.radius - 5, this.radius * 2 * healthRatio, 3);

    p.pop();
  }

  shoot() {
    if (!gameState.player) return;

    const dx = gameState.player.body.position.x - this.body.position.x;
    const dy = gameState.player.body.position.y - this.body.position.y;
    const angle = Math.atan2(dy, dx);
    const speed = 3 + gameState.currentLevel * 0.5;

    gameState.enemyBullets.push(new EnemyBullet(
      this.p,
      this.body.position.x,
      this.body.position.y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    ));
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.dead = true;
    gameState.score += 100;
    gameState.enemiesKilled++;
    createExplosion(this.p, this.body.position.x, this.body.position.y, 20);

    // Drop power-up
    if (this.p.random() < CONFIG.POWERUP_CHANCE) {
      const types = Object.values(POWERUP_TYPES);
      const type = types[Math.floor(this.p.random(types.length))];
      gameState.powerups.push(new PowerUp(this.p, this.body.position.x, this.body.position.y, type));
    }
  }
}

export class Boss extends Enemy {
  constructor(p, x, y) {
    super(p, x, y, 'boss');
    this.radius = 40;
    this.health = CONFIG.BOSS_HEALTH + gameState.currentLevel * 100;
    this.maxHealth = this.health;
    this.shootCooldown = 30;
    this.phase = 0;
    this.moveTimer = 0;
    
    Body.scale(this.body, 2.5, 2.5);
  }

  update() {
    this.timeAlive++;
    this.moveTimer++;

    // Boss movement
    let vy = 0;
    if (this.moveTimer < 60) {
      vy = 2;
    } else if (this.moveTimer < 120) {
      vy = -2;
    } else {
      this.moveTimer = 0;
    }

    const targetX = CANVAS_WIDTH - 100;
    const dx = targetX - this.body.position.x;
    const vx = dx * 0.05;

    Body.setVelocity(this.body, { x: vx, y: vy });

    // Shooting patterns based on phase
    if (this.p.frameCount - this.lastShot > this.shootCooldown) {
      this.shootPattern();
      this.lastShot = this.p.frameCount;
    }

    // Update phase based on health
    const healthPercent = this.health / this.maxHealth;
    if (healthPercent < 0.3) {
      this.phase = 2;
      this.shootCooldown = 15;
    } else if (healthPercent < 0.6) {
      this.phase = 1;
      this.shootCooldown = 20;
    }
  }

  shootPattern() {
    if (!gameState.player) return;

    const speed = 4 + this.phase;

    switch (this.phase) {
      case 0: // Aimed shots
        for (let i = 0; i < 3; i++) {
          const dx = gameState.player.body.position.x - this.body.position.x;
          const dy = gameState.player.body.position.y - this.body.position.y;
          const angle = Math.atan2(dy, dx) + (i - 1) * 0.2;
          gameState.enemyBullets.push(new EnemyBullet(
            this.p,
            this.body.position.x - 20,
            this.body.position.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
          ));
        }
        break;
      case 1: // Spread shot
        for (let i = 0; i < 5; i++) {
          const angle = -Math.PI / 2 + (i - 2) * 0.3;
          gameState.enemyBullets.push(new EnemyBullet(
            this.p,
            this.body.position.x - 20,
            this.body.position.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
          ));
        }
        break;
      case 2: // Spiral
        for (let i = 0; i < 8; i++) {
          const angle = (this.timeAlive * 0.1) + (i * Math.PI / 4);
          gameState.enemyBullets.push(new EnemyBullet(
            this.p,
            this.body.position.x,
            this.body.position.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
          ));
        }
        break;
    }
  }

  render() {
    const p = this.p;
    p.push();
    p.translate(this.body.position.x, this.body.position.y);

    // Boss body - larger and more complex
    p.fill(150, 50, 200);
    p.noStroke();
    
    // Main body
    p.ellipse(0, 0, this.radius * 2, this.radius * 1.5);
    
    // Wings
    p.fill(120, 40, 170);
    p.beginShape();
    p.vertex(-this.radius, -this.radius);
    p.vertex(-this.radius * 1.5, -this.radius * 0.5);
    p.vertex(-this.radius, 0);
    p.endShape(p.CLOSE);
    
    p.beginShape();
    p.vertex(-this.radius, this.radius);
    p.vertex(-this.radius * 1.5, this.radius * 0.5);
    p.vertex(-this.radius, 0);
    p.endShape(p.CLOSE);

    // Core
    p.fill(200, 100, 255);
    p.circle(0, 0, this.radius);

    // Weak point (glowing)
    const glowIntensity = 150 + Math.sin(this.timeAlive * 0.1) * 50;
    p.fill(255, glowIntensity, glowIntensity);
    p.circle(0, 0, this.radius * 0.5);

    // Health bar
    const healthRatio = this.health / this.maxHealth;
    p.fill(255, 0, 0);
    p.rect(-this.radius * 2, -this.radius * 2 - 10, this.radius * 4, 5);
    p.fill(0, 255, 0);
    p.rect(-this.radius * 2, -this.radius * 2 - 10, this.radius * 4 * healthRatio, 5);

    p.pop();
  }

  die() {
    this.dead = true;
    gameState.score += 1000;
    gameState.bossActive = false;
    createExplosion(this.p, this.body.position.x, this.body.position.y, 60);

    // Level complete
    gameState.currentLevel++;
    if (gameState.currentLevel > CONFIG.LEVELS_TO_WIN) {
      gameState.gamePhase = "GAME_OVER_WIN";
      this.p.logs.game_info.push({
        data: { gamePhase: "GAME_OVER_WIN", finalScore: gameState.score },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    } else {
      gameState.currentWave = 0;
      gameState.enemiesKilled = 0;
    }
  }
}

export class EnemyBullet {
  constructor(p, x, y, vx, vy) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 4;
    this.damage = 15;
    this.dead = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < -10 || this.x > CANVAS_WIDTH + 10 ||
        this.y < -10 || this.y > CANVAS_HEIGHT + 10) {
      this.dead = true;
    }
  }

  render() {
    this.p.push();
    this.p.fill(255, 100, 100);
    this.p.noStroke();
    this.p.circle(this.x, this.y, this.radius * 2);
    
    // Glow
    this.p.fill(255, 150, 150, 100);
    this.p.circle(this.x, this.y, this.radius * 3);
    this.p.pop();
  }

  checkCollision(body, radius) {
    const dx = this.x - body.position.x;
    const dy = this.y - body.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + radius;
  }
}

export class PowerUp {
  constructor(p, x, y, type) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 10;
    this.vx = -1;
    this.dead = false;
    this.age = 0;
  }

  update() {
    this.x += this.vx;
    this.age++;

    if (this.x < -20 || this.age > 600) {
      this.dead = true;
    }
  }

  render() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    
    const colors = {
      [POWERUP_TYPES.WEAPON]: [100, 200, 255],
      [POWERUP_TYPES.MISSILE]: [255, 150, 50],
      [POWERUP_TYPES.SPEED]: [100, 255, 100],
      [POWERUP_TYPES.SHIELD]: [255, 255, 100]
    };

    const col = colors[this.type];
    
    // Outer glow
    p.fill(col[0], col[1], col[2], 100);
    p.noStroke();
    p.circle(0, 0, this.radius * 3);

    // Main shape
    p.fill(col[0], col[1], col[2]);
    p.rotate(this.age * 0.05);
    p.rect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);

    // Icon
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    const icons = {
      [POWERUP_TYPES.WEAPON]: 'W',
      [POWERUP_TYPES.MISSILE]: 'M',
      [POWERUP_TYPES.SPEED]: 'S',
      [POWERUP_TYPES.SHIELD]: 'H'
    };
    p.text(icons[this.type], 0, 0);

    p.pop();
  }

  checkCollision(body, radius) {
    const dx = this.x - body.position.x;
    const dy = this.y - body.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + radius;
  }

  collect() {
    this.dead = true;
    
    switch (this.type) {
      case POWERUP_TYPES.WEAPON:
        gameState.weaponLevel = Math.min(gameState.weaponLevel + 1, 3);
        break;
      case POWERUP_TYPES.MISSILE:
        gameState.hasMissiles = true;
        break;
      case POWERUP_TYPES.SPEED:
        gameState.speedBoost = 1.5;
        break;
      case POWERUP_TYPES.SHIELD:
        if (gameState.player) {
          gameState.player.health = Math.min(
            gameState.player.health + 30,
            CONFIG.PLAYER_MAX_HEALTH
          );
        }
        break;
    }
  }
}

export class Particle {
  constructor(p, x, y, vx, vy, color, size, life) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.dead = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // Gravity
    this.life--;
    
    if (this.life <= 0) {
      this.dead = true;
    }
  }

  render() {
    const alpha = 255 * (this.life / this.maxLife);
    this.p.push();
    this.p.fill(this.color[0], this.color[1], this.color[2], alpha);
    this.p.noStroke();
    this.p.circle(this.x, this.y, this.size);
    this.p.pop();
  }
}

export function createExplosion(p, x, y, size) {
  const particleCount = Math.floor(size / 2);
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount;
    const speed = p.random(1, 4);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const color = [255, p.random(100, 200), p.random(0, 100)];
    const particleSize = p.random(2, 6);
    const life = p.random(20, 40);
    
    gameState.particles.push(new Particle(p, x, y, vx, vy, color, particleSize, life));
  }
}