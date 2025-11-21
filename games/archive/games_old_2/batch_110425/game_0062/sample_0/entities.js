// entities.js - Game entity classes

import { GRID_SIZE, BUILDING_TYPES, RESOURCE_TYPES, BUILDING_COLORS } from './globals.js';

export class Building {
  constructor(gridX, gridY, type, p) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.type = type;
    this.p = p;
    this.health = 100;
    this.maxHealth = 100;
    this.productionTimer = 0;
    this.inventory = {};
    this.direction = 0; // For conveyors
    this.targetEnemy = null; // For turrets
    this.cooldown = 0;
  }

  update(gameState) {
    if (this.type === BUILDING_TYPES.DRILL) {
      this.updateDrill(gameState);
    } else if (this.type === BUILDING_TYPES.CONVEYOR) {
      this.updateConveyor(gameState);
    } else if (this.type === BUILDING_TYPES.FACTORY) {
      this.updateFactory(gameState);
    } else if (this.type === BUILDING_TYPES.TURRET) {
      this.updateTurret(gameState);
    } else if (this.type === BUILDING_TYPES.UNIT_FACTORY) {
      this.updateUnitFactory(gameState);
    }
  }

  updateDrill(gameState) {
    this.productionTimer++;
    if (this.productionTimer >= 60) { // Produce every second
      this.productionTimer = 0;
      const resource = this.getResourceAtLocation(gameState);
      if (resource) {
        this.inventory[resource] = (this.inventory[resource] || 0) + 1;
      }
    }
  }

  updateConveyor(gameState) {
    // Transfer items to adjacent buildings
    if (this.productionTimer % 30 === 0) { // Transfer every 0.5 seconds
      const targetX = this.gridX + (this.direction === 0 ? 1 : this.direction === 2 ? -1 : 0);
      const targetY = this.gridY + (this.direction === 1 ? 1 : this.direction === 3 ? -1 : 0);
      
      const targetBuilding = gameState.buildings.find(b => 
        b.gridX === targetX && b.gridY === targetY && b !== this
      );
      
      if (targetBuilding && Object.keys(this.inventory).length > 0) {
        const resource = Object.keys(this.inventory)[0];
        const amount = this.inventory[resource];
        if (amount > 0) {
          targetBuilding.inventory[resource] = (targetBuilding.inventory[resource] || 0) + Math.min(1, amount);
          this.inventory[resource] = Math.max(0, amount - 1);
          if (this.inventory[resource] === 0) delete this.inventory[resource];
        }
      }
    }
    this.productionTimer++;
  }

  updateFactory(gameState) {
    this.productionTimer++;
    // Produce steel from iron and copper
    if (this.productionTimer >= 120) { // Every 2 seconds
      if ((this.inventory.IRON || 0) >= 2 && (this.inventory.COPPER || 0) >= 1) {
        this.inventory.IRON -= 2;
        this.inventory.COPPER -= 1;
        gameState.resources.STEEL = (gameState.resources.STEEL || 0) + 1;
        this.productionTimer = 0;
      }
    }
  }

  updateTurret(gameState) {
    if (this.cooldown > 0) {
      this.cooldown--;
      return;
    }

    // Find nearest enemy
    let nearestEnemy = null;
    let nearestDist = 150;
    
    for (const enemy of gameState.enemies) {
      const dx = (enemy.x / GRID_SIZE) - this.gridX;
      const dy = (enemy.y / GRID_SIZE) - this.gridY;
      const dist = Math.sqrt(dx * dx + dy * dy) * GRID_SIZE;
      
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    }

    if (nearestEnemy && (this.inventory.COPPER || 0) >= 1) {
      this.targetEnemy = nearestEnemy;
      this.cooldown = 30; // Fire every 0.5 seconds
      this.inventory.COPPER -= 1;
      
      // Create projectile
      const projectile = new Projectile(
        this.gridX * GRID_SIZE + GRID_SIZE / 2,
        this.gridY * GRID_SIZE + GRID_SIZE / 2,
        nearestEnemy,
        10,
        this.p
      );
      gameState.projectiles.push(projectile);
    }
  }

  updateUnitFactory(gameState) {
    this.productionTimer++;
    // Produce units
    if (this.productionTimer >= 180 && (this.inventory.STEEL || 0) >= 2) { // Every 3 seconds
      this.inventory.STEEL -= 2;
      const unit = new Unit(
        this.gridX * GRID_SIZE + GRID_SIZE / 2,
        this.gridY * GRID_SIZE + GRID_SIZE / 2,
        this.p
      );
      gameState.units.push(unit);
      gameState.entities.push(unit);
      this.productionTimer = 0;
    }
  }

  getResourceAtLocation(gameState) {
    // Check resource map
    const mapKey = `${this.gridX},${this.gridY}`;
    if (gameState.resourceMap && gameState.resourceMap[mapKey]) {
      return gameState.resourceMap[mapKey];
    }
    return null;
  }

  render(p, camera) {
    p.push();
    const screenX = this.gridX * GRID_SIZE - camera.x;
    const screenY = this.gridY * GRID_SIZE - camera.y;
    
    // Building body
    const color = BUILDING_COLORS[this.type] || [100, 100, 100];
    p.fill(...color);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(screenX, screenY, GRID_SIZE, GRID_SIZE);
    
    // Health bar
    if (this.health < this.maxHealth) {
      p.fill(200, 50, 50);
      p.noStroke();
      p.rect(screenX, screenY - 5, GRID_SIZE, 3);
      p.fill(50, 200, 50);
      p.rect(screenX, screenY - 5, GRID_SIZE * (this.health / this.maxHealth), 3);
    }
    
    // Type indicator
    p.fill(255);
    p.textSize(8);
    p.textAlign(p.CENTER, p.CENTER);
    const label = this.type[0];
    p.text(label, screenX + GRID_SIZE / 2, screenY + GRID_SIZE / 2);
    
    p.pop();
  }
}

export class Core extends Building {
  constructor(gridX, gridY, p) {
    super(gridX, gridY, 'CORE', p);
    this.health = 500;
    this.maxHealth = 500;
  }

  render(p, camera) {
    p.push();
    const screenX = this.gridX * GRID_SIZE - camera.x;
    const screenY = this.gridY * GRID_SIZE - camera.y;
    
    // Core is 2x2
    p.fill(...BUILDING_COLORS.CORE);
    p.stroke(0);
    p.strokeWeight(3);
    p.rect(screenX, screenY, GRID_SIZE * 2, GRID_SIZE * 2);
    
    // Pulsing effect
    const pulseSize = 5 + Math.sin(p.frameCount * 0.1) * 3;
    p.fill(150, 255, 150, 100);
    p.noStroke();
    p.ellipse(screenX + GRID_SIZE, screenY + GRID_SIZE, pulseSize, pulseSize);
    
    // Health bar
    p.fill(200, 50, 50);
    p.rect(screenX, screenY - 8, GRID_SIZE * 2, 5);
    p.fill(50, 200, 50);
    p.rect(screenX, screenY - 8, GRID_SIZE * 2 * (this.health / this.maxHealth), 5);
    
    p.fill(255);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('CORE', screenX + GRID_SIZE, screenY + GRID_SIZE);
    
    p.pop();
  }
}

export class Enemy {
  constructor(x, y, wave, p) {
    this.x = x;
    this.y = y;
    this.wave = wave;
    this.p = p;
    this.health = 20 + wave * 5;
    this.maxHealth = this.health;
    this.speed = 0.5 + wave * 0.05;
    this.damage = 5 + wave * 2;
    this.size = 12 + wave * 2;
    this.attackCooldown = 0;
  }

  update(gameState) {
    // Move towards core
    if (!gameState.core) return;
    
    const coreX = (gameState.core.gridX + 1) * GRID_SIZE;
    const coreY = (gameState.core.gridY + 1) * GRID_SIZE;
    
    const dx = coreX - this.x;
    const dy = coreY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 40) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    } else {
      // Attack core
      if (this.attackCooldown <= 0) {
        gameState.core.health -= this.damage;
        this.attackCooldown = 60;
      }
    }
    
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
    
    // Check if dead
    if (this.health <= 0) {
      const index = gameState.enemies.indexOf(this);
      if (index > -1) {
        gameState.enemies.splice(index, 1);
        gameState.score += 10;
        gameState.resources.COPPER += 2;
      }
      const entityIndex = gameState.entities.indexOf(this);
      if (entityIndex > -1) {
        gameState.entities.splice(entityIndex, 1);
      }
    }
  }

  render(p, camera) {
    p.push();
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;
    
    // Enemy body
    p.fill(200, 50, 50);
    p.stroke(100, 0, 0);
    p.strokeWeight(2);
    p.ellipse(screenX, screenY, this.size, this.size);
    
    // Eye
    p.fill(255, 0, 0);
    p.noStroke();
    p.ellipse(screenX, screenY - 2, 4, 4);
    
    // Health bar
    if (this.health < this.maxHealth) {
      p.fill(200, 50, 50);
      p.rect(screenX - this.size / 2, screenY - this.size / 2 - 8, this.size, 3);
      p.fill(50, 200, 50);
      p.rect(screenX - this.size / 2, screenY - this.size / 2 - 8, this.size * (this.health / this.maxHealth), 3);
    }
    
    p.pop();
  }
}

export class Projectile {
  constructor(x, y, target, damage, p) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.p = p;
    this.speed = 4;
    this.active = true;
  }

  update(gameState) {
    if (!this.target || !this.active) {
      this.active = false;
      return;
    }
    
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < this.speed) {
      // Hit target
      this.target.health -= this.damage;
      this.active = false;
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  render(p, camera) {
    if (!this.active) return;
    
    p.push();
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;
    
    p.fill(255, 200, 0);
    p.noStroke();
    p.ellipse(screenX, screenY, 6, 6);
    
    p.pop();
  }
}

export class Unit {
  constructor(x, y, p) {
    this.x = x;
    this.y = y;
    this.p = p;
    this.health = 30;
    this.maxHealth = 30;
    this.speed = 1;
    this.damage = 8;
    this.size = 10;
    this.attackCooldown = 0;
    this.target = null;
  }

  update(gameState) {
    // Find nearest enemy
    if (!this.target || this.target.health <= 0) {
      let nearestEnemy = null;
      let nearestDist = Infinity;
      
      for (const enemy of gameState.enemies) {
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestEnemy = enemy;
        }
      }
      
      this.target = nearestEnemy;
    }
    
    if (this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 30) {
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
      } else {
        // Attack enemy
        if (this.attackCooldown <= 0) {
          this.target.health -= this.damage;
          this.attackCooldown = 40;
        }
      }
    }
    
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
    
    // Check if dead
    if (this.health <= 0) {
      const index = gameState.units.indexOf(this);
      if (index > -1) {
        gameState.units.splice(index, 1);
      }
      const entityIndex = gameState.entities.indexOf(this);
      if (entityIndex > -1) {
        gameState.entities.splice(entityIndex, 1);
      }
    }
  }

  render(p, camera) {
    p.push();
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;
    
    // Unit body
    p.fill(60, 150, 200);
    p.stroke(30, 100, 150);
    p.strokeWeight(2);
    p.ellipse(screenX, screenY, this.size, this.size);
    
    // Direction indicator
    if (this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        p.stroke(100, 200, 255);
        p.strokeWeight(1);
        p.line(screenX, screenY, screenX + (dx / dist) * 8, screenY + (dy / dist) * 8);
      }
    }
    
    // Health bar
    if (this.health < this.maxHealth) {
      p.noStroke();
      p.fill(200, 50, 50);
      p.rect(screenX - this.size / 2, screenY - this.size / 2 - 8, this.size, 3);
      p.fill(50, 200, 50);
      p.rect(screenX - this.size / 2, screenY - this.size / 2 - 8, this.size * (this.health / this.maxHealth), 3);
    }
    
    p.pop();
  }
}

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  update() {
    // Player is just a camera controller
  }
}