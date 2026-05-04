// entities.js - Game entity classes

import { CANVAS_WIDTH, CELL_WIDTH, CELL_HEIGHT, PLANT_TYPES, ZOMBIE_TYPES, gameState } from './globals.js';

export class Plant {
  constructor(row, col, type) {
    this.row = row;
    this.col = col;
    this.type = type;
    this.x = col * CELL_WIDTH + CELL_WIDTH / 2;
    this.y = row * CELL_HEIGHT + CELL_HEIGHT / 2;
    this.active = true;
    this.shootTimer = 0;
    this.sunTimer = 0;
    this.plantFoodActive = false;
    this.plantFoodTimer = 0;
    this.scaleAnimation = 0;
    
    if (type === PLANT_TYPES.SUNFLOWER) {
      this.health = 300;
      this.maxHealth = 300;
      this.sunProductionRate = 24; // Generate sun every 24 seconds
    } else if (type === PLANT_TYPES.PEASHOOTER) {
      this.health = 300;
      this.maxHealth = 300;
      this.shootRate = 1.5; // Shoot every 1.5 seconds
      this.damage = 20;
    } else if (type === PLANT_TYPES.WALLNUT) {
      this.health = 400;
      this.maxHealth = 400;
    }
  }
  
  update(p, deltaTime) {
    // Scale animation on placement
    if (this.scaleAnimation < 1) {
      this.scaleAnimation += deltaTime * 3;
      if (this.scaleAnimation > 1) this.scaleAnimation = 1;
    }
    
    // Plant Food effect
    if (this.plantFoodActive) {
      this.plantFoodTimer -= deltaTime;
      if (this.plantFoodTimer <= 0) {
        this.plantFoodActive = false;
      }
    }
    
    if (this.type === PLANT_TYPES.SUNFLOWER) {
      this.sunTimer += deltaTime;
      const productionRate = this.plantFoodActive ? this.sunProductionRate / 4 : this.sunProductionRate;
      if (this.sunTimer >= productionRate) {
        this.sunTimer = 0;
        this.produceSun();
      }
    } else if (this.type === PLANT_TYPES.PEASHOOTER) {
      // Check for zombies in lane
      const zombieInLane = gameState.zombies.find(z => z.lane === this.row && z.x > this.x);
      if (zombieInLane) {
        this.shootTimer += deltaTime;
        const shootRate = this.plantFoodActive ? this.shootRate / 3 : this.shootRate;
        if (this.shootTimer >= shootRate) {
          this.shootTimer = 0;
          this.shoot();
        }
      }
    }
    
    if (this.health <= 0) {
      this.active = false;
    }
  }
  
  produceSun() {
    const sunDrop = new SunDrop(this.x, this.y, 25);
    gameState.sunDrops.push(sunDrop);
  }
  
  shoot() {
    const projectile = new Projectile(this.x + 20, this.y, this.row, this.damage);
    gameState.projectiles.push(projectile);
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }
  
  activatePlantFood() {
    this.plantFoodActive = true;
    this.plantFoodTimer = 5; // 5 seconds of boost
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    const scale = 0.3 + this.scaleAnimation * 0.7;
    p.scale(scale);
    
    // Plant Food glow effect
    if (this.plantFoodActive) {
      const glowAlpha = p.map(p.sin(p.frameCount * 0.2), -1, 1, 100, 200);
      p.fill(255, 255, 100, glowAlpha);
      p.noStroke();
      p.circle(0, 0, 80);
    }
    
    if (this.type === PLANT_TYPES.SUNFLOWER) {
      // Yellow flower
      p.fill(255, 220, 0);
      p.noStroke();
      p.circle(0, 0, 50);
      p.fill(139, 69, 19);
      p.circle(0, 0, 20);
      // Stem
      p.stroke(50, 150, 50);
      p.strokeWeight(4);
      p.line(0, 25, 0, 35);
    } else if (this.type === PLANT_TYPES.PEASHOOTER) {
      // Green head
      p.fill(100, 200, 100);
      p.noStroke();
      p.circle(0, 0, 50);
      // Mouth
      p.fill(50, 100, 50);
      p.arc(10, 0, 20, 15, 0, p.PI);
      // Stem
      p.stroke(50, 150, 50);
      p.strokeWeight(4);
      p.line(0, 25, 0, 35);
    } else if (this.type === PLANT_TYPES.WALLNUT) {
      // Brown nut
      p.fill(139, 90, 43);
      p.stroke(101, 67, 33);
      p.strokeWeight(2);
      p.rect(-30, -30, 60, 60, 5);
      
      // Damage cracks
      const damageRatio = 1 - (this.health / this.maxHealth);
      if (damageRatio > 0.3) {
        p.stroke(80, 50, 20);
        p.strokeWeight(2);
        p.line(-20, -10, 20, 10);
      }
      if (damageRatio > 0.6) {
        p.line(-20, 10, 20, -10);
      }
    }
    
    // Health bar
    if (this.health < this.maxHealth) {
      p.noStroke();
      p.fill(200, 0, 0);
      p.rect(-25, -40, 50, 5);
      p.fill(0, 200, 0);
      const healthWidth = 50 * (this.health / this.maxHealth);
      p.rect(-25, -40, healthWidth, 5);
    }
    
    p.pop();
  }
}

export class Zombie {
  constructor(lane, type) {
    this.lane = lane;
    this.type = type;
    this.x = CANVAS_WIDTH + 30;
    this.y = lane * CELL_HEIGHT + CELL_HEIGHT / 2;
    this.active = true;
    this.eatingPlant = null;
    this.eatTimer = 0;
    this.walkPhase = 0;
    
    if (type === ZOMBIE_TYPES.BASIC) {
      this.health = 100;
      this.maxHealth = 100;
      this.speed = 15 + (gameState.currentLevel - 1) * 3; // Pixels per second
      this.damage = 30;
      this.eatRate = 1; // Bite every 1 second
      this.scoreValue = 10;
    } else if (type === ZOMBIE_TYPES.CONEHEAD) {
      this.health = 250;
      this.maxHealth = 250;
      this.speed = 12 + (gameState.currentLevel - 1) * 2;
      this.damage = 30;
      this.eatRate = 1;
      this.scoreValue = 20;
    }
  }
  
  update(p, deltaTime) {
    this.walkPhase += deltaTime * 2;
    
    if (this.eatingPlant) {
      // Check if plant still exists and is in range
      if (!this.eatingPlant.active || 
          Math.abs(this.eatingPlant.x - this.x) > CELL_WIDTH / 2) {
        this.eatingPlant = null;
      } else {
        this.eatTimer += deltaTime;
        if (this.eatTimer >= this.eatRate) {
          this.eatTimer = 0;
          this.eatingPlant.takeDamage(this.damage);
        }
        return; // Don't move while eating
      }
    }
    
    // Check for plants to eat
    const plantInFront = gameState.plants.find(plant => 
      plant.row === this.lane && 
      Math.abs(plant.x - this.x) < CELL_WIDTH / 2 &&
      plant.x < this.x
    );
    
    if (plantInFront) {
      this.eatingPlant = plantInFront;
      this.eatTimer = 0;
    } else {
      // Move forward
      this.x -= this.speed * deltaTime;
    }
    
    // Check if reached house
    if (this.x < -20) {
      gameState.gamePhase = "GAME_OVER_LOSE";
    }
    
    if (this.health <= 0) {
      this.active = false;
      gameState.score += this.scoreValue;
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Walking bobbing animation
    const bob = this.eatingPlant ? 0 : p.sin(this.walkPhase) * 2;
    p.translate(0, bob);
    
    // Body
    p.fill(120, 120, 120);
    p.noStroke();
    p.rect(-20, -30, 40, 60, 5);
    
    // Eyes
    p.fill(255, 255, 255);
    p.circle(-10, -15, 10);
    p.circle(10, -15, 10);
    p.fill(0);
    p.circle(-10, -15, 5);
    p.circle(10, -15, 5);
    
    // Mouth
    p.stroke(200, 0, 0);
    p.strokeWeight(2);
    p.noFill();
    p.arc(0, 5, 20, 15, 0, p.PI);
    
    // Conehead accessory
    if (this.type === ZOMBIE_TYPES.CONEHEAD) {
      p.fill(255, 140, 0);
      p.noStroke();
      p.triangle(-15, -30, 15, -30, 0, -50);
    }
    
    // Health bar
    if (this.health < this.maxHealth) {
      p.noStroke();
      p.fill(50, 50, 50);
      p.rect(-20, -45, 40, 5);
      p.fill(200, 0, 0);
      const healthWidth = 40 * (this.health / this.maxHealth);
      p.rect(-20, -45, healthWidth, 5);
    }
    
    p.pop();
  }
}

export class Projectile {
  constructor(x, y, lane, damage) {
    this.x = x;
    this.y = y;
    this.lane = lane;
    this.damage = damage;
    this.speed = 200; // Pixels per second
    this.active = true;
  }
  
  update(p, deltaTime) {
    this.x += this.speed * deltaTime;
    
    // Check collision with zombies
    const zombie = gameState.zombies.find(z => 
      z.lane === this.lane && 
      Math.abs(z.x - this.x) < 30
    );
    
    if (zombie) {
      zombie.takeDamage(this.damage);
      this.active = false;
    }
    
    // Remove if off screen
    if (this.x > CANVAS_WIDTH + 20) {
      this.active = false;
    }
  }
  
  render(p) {
    p.push();
    p.fill(100, 255, 100);
    p.noStroke();
    p.circle(this.x, this.y, 10);
    p.pop();
  }
}

export class SunDrop {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.active = true;
    this.collectTimer = 0;
    this.pulsePhase = 0;
    this.autoCollectDelay = 5; // Auto-collect after 5 seconds
  }
  
  update(p, deltaTime) {
    this.pulsePhase += deltaTime * 3;
    this.collectTimer += deltaTime;
    
    if (this.collectTimer >= this.autoCollectDelay) {
      this.collect();
    }
  }
  
  collect() {
    gameState.sun += this.value;
    gameState.score += 5;
    this.active = false;
  }
  
  render(p) {
    p.push();
    const pulse = 1 + p.sin(this.pulsePhase) * 0.1;
    p.fill(255, 220, 0);
    p.noStroke();
    p.circle(this.x, this.y, 25 * pulse);
    
    // Inner glow
    p.fill(255, 255, 150);
    p.circle(this.x, this.y, 15 * pulse);
    
    // Value text
    p.fill(0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(this.value, this.x, this.y);
    
    p.pop();
  }
}