import { GAME_AREA_X, GAME_AREA_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';
import { Item } from './items.js';

export class Enemy {
  constructor(p, x, y, type = 'basic') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    this.vx = 0;
    this.vy = 1;
    this.health = 20;
    this.maxHealth = 20;
    this.radius = 12;
    this.active = true;
    this.shootTimer = 60;
    this.movePattern = 'straight';
    this.spawnTime = this.p.frameCount;
  }

  update() {
    // Movement patterns
    switch (this.movePattern) {
      case 'straight':
        this.y += this.vy;
        break;
      case 'sine':
        this.x += Math.sin((this.p.frameCount - this.spawnTime) * 0.05) * 2;
        this.y += this.vy;
        break;
      case 'zigzag':
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < GAME_AREA_X + 20 || this.x > GAME_AREA_X + GAME_AREA_WIDTH - 20) {
          this.vx *= -1;
        }
        break;
    }
    
    // Shooting
    this.shootTimer--;
    if (this.shootTimer <= 0) {
      this.shoot();
      this.shootTimer = 120 + Math.floor(this.p.random(60));
    }
    
    // Remove if off screen
    if (this.y > CANVAS_HEIGHT + 50) {
      this.active = false;
    }
  }

  shoot() {
    const angle = Math.atan2(gameState.player.y - this.y, gameState.player.x - this.x);
    gameState.enemyBullets.push(new EnemyBullet(this.p, this.x, this.y, Math.cos(angle) * 3, Math.sin(angle) * 3));
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.active = false;
    this.dropItems();
    gameState.score += 100;
  }

  dropItems() {
    // Drop power items
    if (this.p.random() < 0.3) {
      gameState.items.push(new Item(this.p, this.x, this.y, 'power'));
    }
    
    // Drop point items
    for (let i = 0; i < 2; i++) {
      gameState.items.push(new Item(this.p, this.x + this.p.random(-10, 10), this.y, 'point'));
    }
    
    // Drop Venturer items
    if (this.p.random() < 0.4) {
      const colors = ['red', 'blue', 'green', 'random'];
      const color = colors[Math.floor(this.p.random(colors.length))];
      gameState.items.push(new Item(this.p, this.x, this.y, 'venturer', color));
    }
  }

  render() {
    const p = this.p;
    p.push();
    
    // Enemy body
    p.fill(150, 100, 200);
    p.noStroke();
    p.circle(this.x, this.y, this.radius * 2);
    
    // Eyes
    p.fill(255, 50, 50);
    p.circle(this.x - 5, this.y - 3, 4);
    p.circle(this.x + 5, this.y - 3, 4);
    
    // Health bar
    p.fill(255, 0, 0);
    p.rect(this.x - 15, this.y - 20, 30, 3);
    p.fill(0, 255, 0);
    p.rect(this.x - 15, this.y - 20, 30 * (this.health / this.maxHealth), 3);
    
    p.pop();
  }
}

export class Boss extends Enemy {
  constructor(p, x, y) {
    super(p, x, y, 'boss');
    this.health = 500;
    this.maxHealth = 500;
    this.radius = 30;
    this.vy = 0.5;
    this.movePattern = 'boss';
    this.phase = 0;
    this.phaseTimer = 0;
    this.targetY = 80;
  }

  update() {
    // Move to target position
    if (this.y < this.targetY) {
      this.y += this.vy;
    } else {
      // Boss movement pattern
      this.x += Math.sin(this.p.frameCount * 0.02) * 3;
      this.x = this.p.constrain(this.x, GAME_AREA_X + 50, GAME_AREA_X + GAME_AREA_WIDTH - 50);
    }
    
    this.phaseTimer++;
    
    // Attack patterns
    if (this.phaseTimer % 60 === 0) {
      this.shootPattern();
    }
  }

  shootPattern() {
    const numBullets = 12;
    for (let i = 0; i < numBullets; i++) {
      const angle = (i / numBullets) * Math.PI * 2;
      gameState.enemyBullets.push(
        new EnemyBullet(this.p, this.x, this.y, Math.cos(angle) * 2, Math.sin(angle) * 2)
      );
    }
  }

  dropItems() {
    // Boss drops many items
    for (let i = 0; i < 5; i++) {
      gameState.items.push(new Item(this.p, this.x + this.p.random(-30, 30), this.y + this.p.random(-20, 20), 'power'));
      gameState.items.push(new Item(this.p, this.x + this.p.random(-30, 30), this.y + this.p.random(-20, 20), 'point'));
    }
    
    // Life fragment
    gameState.items.push(new Item(this.p, this.x, this.y, 'life-fragment'));
    
    // Spell fragments
    gameState.items.push(new Item(this.p, this.x - 20, this.y, 'spell-fragment'));
    gameState.items.push(new Item(this.p, this.x + 20, this.y, 'spell-fragment'));
  }

  render() {
    const p = this.p;
    p.push();
    
    // Boss aura
    p.fill(200, 100, 255, 50);
    p.noStroke();
    p.circle(this.x, this.y, this.radius * 3);
    
    // Boss body
    p.fill(180, 80, 220);
    p.circle(this.x, this.y, this.radius * 2);
    
    // Crown
    p.fill(255, 215, 0);
    p.triangle(this.x - 20, this.y - 25, this.x, this.y - 40, this.x - 10, this.y - 25);
    p.triangle(this.x - 5, this.y - 25, this.x, this.y - 45, this.x + 5, this.y - 25);
    p.triangle(this.x + 10, this.y - 25, this.x, this.y - 40, this.x + 20, this.y - 25);
    
    // Eyes
    p.fill(255, 255, 0);
    p.circle(this.x - 10, this.y - 5, 8);
    p.circle(this.x + 10, this.y - 5, 8);
    p.fill(255, 0, 0);
    p.circle(this.x - 10, this.y - 5, 4);
    p.circle(this.x + 10, this.y - 5, 4);
    
    // Health bar
    p.fill(100, 0, 0);
    p.rect(GAME_AREA_X + 10, 10, GAME_AREA_WIDTH - 20, 8);
    p.fill(255, 50, 50);
    p.rect(GAME_AREA_X + 10, 10, (GAME_AREA_WIDTH - 20) * (this.health / this.maxHealth), 8);
    
    p.pop();
  }
}

export class EnemyBullet {
  constructor(p, x, y, vx, vy) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 5;
    this.active = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    
    if (this.y > CANVAS_HEIGHT + 10 || this.x < GAME_AREA_X - 10 || 
        this.x > GAME_AREA_X + GAME_AREA_WIDTH + 10 || this.y < -10) {
      this.active = false;
    }
  }

  render() {
    this.p.push();
    this.p.fill(255, 100, 100);
    this.p.noStroke();
    this.p.circle(this.x, this.y, this.radius * 2);
    this.p.fill(255, 200, 200);
    this.p.circle(this.x, this.y, this.radius);
    this.p.pop();
  }
}