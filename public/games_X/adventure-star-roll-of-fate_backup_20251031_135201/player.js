// player.js - Player entity

import { gameState, GRID_CONFIG, WEAPONS } from './globals.js';
import { triggerEvent } from './events.js';

export class Player {
  constructor(gridX, gridY, maxHP) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.maxHP = maxHP;
    this.hp = maxHP;
    this.damageFlashTimer = 0;
    this.moveDelay = 0;
    this.moveDelayMax = 0; // No delay for turn-based movement
    this.facingDirection = 1; // 0=left, 1=right, 2=up, 3=down
    this.movementCooldown = 0; // Cooldown to prevent key-repeat issues
  }

  getScreenX() {
    return GRID_CONFIG.offsetX + this.gridX * GRID_CONFIG.tileSize + GRID_CONFIG.tileSize / 2;
  }

  getScreenY() {
    return GRID_CONFIG.offsetY + this.gridY * GRID_CONFIG.tileSize + GRID_CONFIG.tileSize / 2;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp < 0) this.hp = 0;
    this.damageFlashTimer = 15; // flash for 15 frames
  }

  heal(amount) {
    this.hp += amount;
    if (this.hp > this.maxHP) this.hp = this.maxHP;
  }

  canMoveTo(gridX, gridY, map) {
    if (gridX < 0 || gridX >= map.width || gridY < 0 || gridY >= map.height) {
      return false;
    }
    const tile = map.tiles[gridY][gridX];
    return tile.type !== 'WALL';
  }

  moveTo(gridX, gridY, map) {
    if (this.canMoveTo(gridX, gridY, map)) {
      // Update facing direction
      if (gridX < this.gridX) this.facingDirection = 0; // left
      else if (gridX > this.gridX) this.facingDirection = 1; // right
      else if (gridY < this.gridY) this.facingDirection = 2; // up
      else if (gridY > this.gridY) this.facingDirection = 3; // down

      this.gridX = gridX;
      this.gridY = gridY;
      
      const tile = map.tiles[gridY][gridX];
      
      // Mark empty tiles as visited for exploration points
      if (!tile.visited && tile.type === 'EMPTY') {
        tile.visited = true;
        gameState.score += 5; // points for exploring
      }

      // Check for weapon pickup
      if (tile.type === 'WEAPON' && !tile.interacted) {
        tile.interacted = true;
        gameState.weaponPower++;
        gameState.eventMessage = `Weapon Upgrade! Attack Power: ${gameState.weaponPower}`;
        gameState.eventMessageTimer = gameState.eventMessageDuration;
        gameState.score += 50;
      }
    }
  }

  setMovementCooldown(frames) {
    this.movementCooldown = frames;
  }

  shoot(projectiles) {
    // Create a Projectile instance in facing direction with current weapon
    const weapon = WEAPONS[gameState.currentWeapon];
    const projectile = new Projectile(
      this.gridX,
      this.gridY,
      this.facingDirection,
      weapon.damage,
      weapon.speed,
      weapon.color
    );
    projectiles.push(projectile);
  }

  update(p) {
    if (this.damageFlashTimer > 0) {
      this.damageFlashTimer--;
    }
    if (this.moveDelay > 0) {
      this.moveDelay--;
    }
    if (this.movementCooldown > 0) {
      this.movementCooldown--;
    }
  }

  render(p) {
    const x = this.getScreenX();
    const y = this.getScreenY();
    const size = GRID_CONFIG.tileSize * 0.7;

    // Draw player
    p.push();
    if (this.damageFlashTimer > 0 && this.damageFlashTimer % 6 < 3) {
      p.fill(255, 100, 100);
    } else {
      p.fill(50, 150, 255);
    }
    p.stroke(0);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(x, y, size, size, 5);
    
    // Draw "A" for Adventure
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(size * 0.6);
    p.text('A', x, y);

    // Draw direction indicator with weapon color
    const weapon = WEAPONS[gameState.currentWeapon];
    p.fill(...weapon.color);
    const indicatorSize = 6;
    let ix = x, iy = y;
    switch (this.facingDirection) {
      case 0: ix -= size * 0.5; break; // left
      case 1: ix += size * 0.5; break; // right
      case 2: iy -= size * 0.5; break; // up
      case 3: iy += size * 0.5; break; // down
    }
    p.ellipse(ix, iy, indicatorSize, indicatorSize);

    p.pop();
  }
}

export class Projectile {
  constructor(gridX, gridY, direction, damage, speed, color) {
    this.x = gridX;
    this.y = gridY;
    this.direction = direction;
    this.damage = damage;
    this.speed = speed;
    this.color = color;
    this.active = true;
    this.moveDelay = 0;
    this.isEnemyProjectile = false;
  }

  update(map, enemies) {
    if (!this.active) return;

    this.moveDelay++;
    if (this.moveDelay >= this.speed) {
      this.moveDelay = 0;
      
      // Move in direction
      let newX = this.x;
      let newY = this.y;
      
      switch (this.direction) {
        case 0: newX--; break; // left
        case 1: newX++; break; // right
        case 2: newY--; break; // up
        case 3: newY++; break; // down
      }

      // Check if hit wall or out of bounds
      if (newX < 0 || newX >= map.width || newY < 0 || newY >= map.height) {
        this.active = false;
        return;
      }

      const tile = map.tiles[newY][newX];
      if (tile.type === 'WALL') {
        this.active = false;
        return;
      }

      this.x = newX;
      this.y = newY;

      // Check if hit enemy
      enemies.forEach(enemy => {
        if (enemy.active && enemy.gridX === this.x && enemy.gridY === this.y) {
          enemy.takeDamage(this.damage);
          this.active = false;
          if (!enemy.active) {
            gameState.score += 100;
            gameState.eventMessage = `${enemy.name} Enemy defeated! +100 gold`;
            gameState.eventMessageTimer = 60;
          }
        }
      });
    }
  }

  getScreenX() {
    return GRID_CONFIG.offsetX + this.x * GRID_CONFIG.tileSize + GRID_CONFIG.tileSize / 2;
  }

  getScreenY() {
    return GRID_CONFIG.offsetY + this.y * GRID_CONFIG.tileSize + GRID_CONFIG.tileSize / 2;
  }

  render(p) {
    if (!this.active) return;

    const x = this.getScreenX();
    const y = this.getScreenY();

    p.push();
    p.fill(...this.color);
    p.stroke(this.color[0] * 0.8, this.color[1] * 0.8, this.color[2] * 0.8);
    p.strokeWeight(2);
    p.ellipse(x, y, 10, 10);
    p.pop();
  }
}