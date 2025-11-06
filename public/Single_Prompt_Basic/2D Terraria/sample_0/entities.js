import { TILE_SIZE, ENEMY_TYPES } from './globals.js';
import { isSolidTile, getTileAt } from './world.js';

// Base entity class
export class Entity {
  constructor(x, y, width, height, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.velocityX = 0;
    this.velocityY = 0;
    this.type = type;
    this.health = 100;
    this.maxHealth = 100;
    this.damage = 10;
    this.isDead = false;
  }
  
  update(p, world, player) {
    // Base update logic
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.isDead = true;
    }
  }
  
  draw(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    // Draw entity
    p.fill(255, 0, 0);
    p.rect(screenX, screenY, this.width, this.height);
    
    // Draw health bar
    p.fill(0);
    p.rect(screenX, screenY - 10, this.width, 5);
    p.fill(255, 0, 0);
    p.rect(screenX, screenY - 10, this.width * (this.health / this.maxHealth), 5);
  }
}

// Slime enemy
export class Slime extends Entity {
  constructor(x, y) {
    super(x, y, 20, 15, 'enemy_slime');
    this.jumpCooldown = 0;
    this.health = 30;
    this.maxHealth = 30;
    this.damage = 5;
    this.movingRight = Math.random() > 0.5;
  }
  
  update(p, world, player) {
    // Apply gravity
    this.velocityY += 0.2;
    
    // Jump randomly
    if (this.jumpCooldown === 0 && Math.random() < 0.01) {
      this.velocityY = -3;
      this.jumpCooldown = 60;
    }
    
    // Move towards player
    if (player.x < this.x) {
      this.movingRight = false;
      this.velocityX = -0.5;
    } else {
      this.movingRight = true;
      this.velocityX = 0.5;
    }
    
    // Apply movement
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // Check for collisions
    this.checkCollisions(world);
    
    // Reduce cooldowns
    if (this.jumpCooldown > 0) this.jumpCooldown--;
    
    // Check player collision for damage
    if (this.intersects(player)) {
      player.takeDamage(this.damage);
    }
  }
  
  checkCollisions(world) {
    // Bottom collision
    const bottomY = this.y + this.height;
    if (isSolidTile(getTileAt(world, this.x, bottomY)) || isSolidTile(getTileAt(world, this.x + this.width, bottomY))) {
      this.y = Math.floor(bottomY / TILE_SIZE) * TILE_SIZE - this.height;
      this.velocityY = 0;
    }
    
    // Left collision
    if (this.velocityX < 0 && isSolidTile(getTileAt(world, this.x, this.y))) {
      this.x = Math.floor(this.x / TILE_SIZE + 1) * TILE_SIZE;
      this.velocityX *= -1;
    }
    
    // Right collision
    if (this.velocityX > 0 && isSolidTile(getTileAt(world, this.x + this.width, this.y))) {
      this.x = Math.floor((this.x + this.width) / TILE_SIZE) * TILE_SIZE - this.width;
      this.velocityX *= -1;
    }
  }
  
  intersects(entity) {
    const pad = 2; // allow slight contact to count
    return this.x - pad < entity.x + entity.width &&
           this.x + this.width + pad > entity.x &&
           this.y - pad < entity.y + entity.height &&
           this.y + this.height + pad > entity.y;
  }
  
  draw(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    p.push(); // Save drawing state
    
    // Draw slime
    p.stroke(0); // Black outline
    p.strokeWeight(1);
    p.fill(100, 200, 100);
    p.ellipse(screenX + this.width/2, screenY + this.height/2, this.width, this.height);
    
    // Draw eyes
    p.noStroke();
    p.fill(0);
    if (this.movingRight) {
      p.ellipse(screenX + this.width/2 + 5, screenY + this.height/2 - 3, 3, 3);
    } else {
      p.ellipse(screenX + this.width/2 - 5, screenY + this.height/2 - 3, 3, 3);
    }
    
    // Draw health bar
    p.noStroke();
    p.fill(0);
    p.rect(screenX, screenY - 10, this.width, 5);
    p.fill(255, 0, 0);
    p.rect(screenX, screenY - 10, this.width * (this.health / this.maxHealth), 5);
    
    p.pop(); // Restore drawing state
  }
}

// Zombie enemy
export class Zombie extends Entity {
  constructor(x, y) {
    super(x, y, 16, 32, 'enemy_zombie');
    this.health = 50;
    this.maxHealth = 50;
    this.damage = 10;
    this.facingRight = Math.random() > 0.5;
    this.attackCooldown = 0;
  }
  
  update(p, world, player) {
    // Apply gravity
    this.velocityY += 0.2;
    
    // Move towards player
    const distToPlayer = Math.abs(player.x - this.x);
    
    if (distToPlayer < 200) {
      if (player.x < this.x) {
        this.facingRight = false;
        this.velocityX = -0.7;
      } else {
        this.facingRight = true;
        this.velocityX = 0.7;
      }
    } else {
      this.velocityX = 0;
    }
    
    // Apply movement
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // Check for collisions
    this.checkCollisions(world);
    
    // Reduce cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    
    // Check player collision for damage
    if (this.intersects(player) && this.attackCooldown === 0) {
      player.takeDamage(this.damage);
      this.attackCooldown = 60;
    }
  }
  
  checkCollisions(world) {
    // Bottom collision
    const bottomY = this.y + this.height;
    if (isSolidTile(getTileAt(world, this.x, bottomY)) || isSolidTile(getTileAt(world, this.x + this.width, bottomY))) {
      this.y = Math.floor(bottomY / TILE_SIZE) * TILE_SIZE - this.height;
      this.velocityY = 0;
    }
    
    // Left collision
    if (this.velocityX < 0 && (isSolidTile(getTileAt(world, this.x, this.y)) || isSolidTile(getTileAt(world, this.x, this.y + this.height - 1)))) {
      this.x = Math.floor(this.x / TILE_SIZE + 1) * TILE_SIZE;
      this.velocityX = 0;
    }
    
    // Right collision
    if (this.velocityX > 0 && (isSolidTile(getTileAt(world, this.x + this.width, this.y)) || isSolidTile(getTileAt(world, this.x + this.width, this.y + this.height - 1)))) {
      this.x = Math.floor((this.x + this.width) / TILE_SIZE) * TILE_SIZE - this.width;
      this.velocityX = 0;
    }
  }
  
  intersects(entity) {
    const pad = 2;
    return this.x - pad < entity.x + entity.width &&
           this.x + this.width + pad > entity.x &&
           this.y - pad < entity.y + entity.height &&
           this.y + this.height + pad > entity.y;
  }
  
  draw(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    p.push(); // Save drawing state
    
    // Draw zombie
    p.stroke(0); // Black outline
    p.strokeWeight(1);
    p.fill(100, 150, 100); // Green skin
    p.rect(screenX, screenY, this.width, this.height);
    
    // Draw eyes
    p.noStroke();
    p.fill(255, 0, 0); // Red eyes
    if (this.facingRight) {
      p.ellipse(screenX + 12, screenY + 8, 3, 3);
    } else {
      p.ellipse(screenX + 4, screenY + 8, 3, 3);
    }
    
    // Draw arms
    p.stroke(0);
    p.strokeWeight(1);
    p.fill(100, 150, 100);
    if (this.facingRight) {
      p.rect(screenX + this.width, screenY + 10, 5, 15);
    } else {
      p.rect(screenX - 5, screenY + 10, 5, 15);
    }
    
    // Draw health bar
    p.noStroke();
    p.fill(0);
    p.rect(screenX, screenY - 10, this.width, 5);
    p.fill(255, 0, 0);
    p.rect(screenX, screenY - 10, this.width * (this.health / this.maxHealth), 5);
    
    p.pop(); // Restore drawing state
  }
}

// Flying Eye enemy
export class FlyingEye extends Entity {
  constructor(x, y) {
    super(x, y, 20, 15, 'enemy_flying_eye');
    this.health = 40;
    this.maxHealth = 40;
    this.damage = 8;
    this.facingRight = Math.random() > 0.5;
    this.attackCooldown = 0;
    this.floatOffset = 0;
    this.floatSpeed = 0.05;
  }
  
  update(p, world, player) {
    // Flying movement - no gravity
    
    // Move towards player
    const distToPlayer = Math.abs(player.x - this.x);
    
    if (distToPlayer < 250) {
      if (player.x < this.x) {
        this.facingRight = false;
        this.velocityX = -1.2;
      } else {
        this.facingRight = true;
        this.velocityX = 1.2;
      }
      
      if (player.y < this.y) {
        this.velocityY = -0.5;
      } else {
        this.velocityY = 0.5;
      }
    } else {
      this.velocityX = 0;
      this.velocityY = 0;
    }
    
    // Apply floating effect
    this.floatOffset += this.floatSpeed;
    this.y += Math.sin(this.floatOffset) * 0.5;
    
    // Apply movement
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // Avoid solid tiles
    this.avoidSolidTiles(world);
    
    // Reduce cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    
    // Check player collision for damage
    if (this.intersects(player) && this.attackCooldown === 0) {
      player.takeDamage(this.damage);
      this.attackCooldown = 60;
    }
  }
  
  avoidSolidTiles(world) {
    // Check surroundings and avoid solid tiles
    if (isSolidTile(getTileAt(world, this.x, this.y)) || 
        isSolidTile(getTileAt(world, this.x + this.width, this.y)) ||
        isSolidTile(getTileAt(world, this.x, this.y + this.height)) || 
        isSolidTile(getTileAt(world, this.x + this.width, this.y + this.height))) {
      
      // Move away from solid tiles
      this.x -= this.velocityX * 2;
      this.y -= this.velocityY * 2;
      
      // Reverse direction
      this.velocityX *= -1;
      this.velocityY *= -1;
      this.facingRight = !this.facingRight;
    }
  }
  
  intersects(entity) {
    const pad = 2;
    return this.x - pad < entity.x + entity.width &&
           this.x + this.width + pad > entity.x &&
           this.y - pad < entity.y + entity.height &&
           this.y + this.height + pad > entity.y;
  }
  
  draw(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    p.push(); // Save drawing state
    
    // Draw flying eye
    p.stroke(0); // Black outline
    p.strokeWeight(1);
    p.fill(150, 50, 200); // Purple body
    p.ellipse(screenX + this.width/2, screenY + this.height/2, this.width, this.height);
    
    // Draw eye
    p.fill(255);
    p.ellipse(screenX + this.width/2, screenY + this.height/2, 12, 12);
    
    // Draw pupil
    p.noStroke();
    p.fill(0);
    if (this.facingRight) {
      p.ellipse(screenX + this.width/2 + 3, screenY + this.height/2, 5, 5);
    } else {
      p.ellipse(screenX + this.width/2 - 3, screenY + this.height/2, 5, 5);
    }
    
    // Draw wings
    p.stroke(0);
    p.strokeWeight(1);
    p.fill(200, 100, 250, 150);
    p.ellipse(screenX + this.width/2 - 10, screenY + this.height/2, 8, 16);
    p.ellipse(screenX + this.width/2 + 10, screenY + this.height/2, 8, 16);
    
    // Draw health bar
    p.noStroke();
    p.fill(0);
    p.rect(screenX, screenY - 10, this.width, 5);
    p.fill(255, 0, 0);
    p.rect(screenX, screenY - 10, this.width * (this.health / this.maxHealth), 5);
    
    p.pop(); // Restore drawing state
  }
}

// Boss enemy
export class Boss extends Entity {
  constructor(x, y) {
    super(x, y, 40, 60, 'enemy_boss');
    this.health = 300;
    this.maxHealth = 300;
    this.damage = 20;
    this.facingRight = true;
    this.attackCooldown = 0;
    this.jumpCooldown = 0;
    this.phase = 1; // Boss has multiple phases
  }
  
  update(p, world, player) {
    // Apply gravity
    this.velocityY += 0.2;
    
    // Update behavior based on phase
    if (this.health < this.maxHealth * 0.5 && this.phase === 1) {
      this.phase = 2; // Enter phase 2 at 50% health
    }
    
    // Move towards player
    const distToPlayer = Math.abs(player.x - this.x);
    
    if (distToPlayer < 300) {
      if (player.x < this.x) {
        this.facingRight = false;
        this.velocityX = this.phase === 1 ? -0.8 : -1.2;
      } else {
        this.facingRight = true;
        this.velocityX = this.phase === 1 ? 0.8 : 1.2;
      }
      
      // Jump if player is above and we're on ground
      if (player.y < this.y - 40 && this.velocityY === 0 && this.jumpCooldown === 0) {
        this.velocityY = -8;
        this.jumpCooldown = 120;
      }
    } else {
      this.velocityX = 0;
    }
    
    // Apply movement
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // Check for collisions
    this.checkCollisions(world);
    
    // Reduce cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.jumpCooldown > 0) this.jumpCooldown--;
    
    // Check player collision for damage
    if (this.intersects(player) && this.attackCooldown === 0) {
      player.takeDamage(this.damage);
      this.attackCooldown = 60;
    }
  }
  
  checkCollisions(world) {
    // Bottom collision
    const bottomY = this.y + this.height;
    if (isSolidTile(getTileAt(world, this.x, bottomY)) || isSolidTile(getTileAt(world, this.x + this.width, bottomY))) {
      this.y = Math.floor(bottomY / TILE_SIZE) * TILE_SIZE - this.height;
      this.velocityY = 0;
    }
    
    // Left collision
    if (this.velocityX < 0 && (isSolidTile(getTileAt(world, this.x, this.y)) || isSolidTile(getTileAt(world, this.x, this.y + this.height - 1)))) {
      this.x = Math.floor(this.x / TILE_SIZE + 1) * TILE_SIZE;
      this.velocityX = 0;
    }
    
    // Right collision
    if (this.velocityX > 0 && (isSolidTile(getTileAt(world, this.x + this.width, this.y)) || isSolidTile(getTileAt(world, this.x + this.width, this.y + this.height - 1)))) {
      this.x = Math.floor((this.x + this.width) / TILE_SIZE) * TILE_SIZE - this.width;
      this.velocityX = 0;
    }
  }
  
  intersects(entity) {
    const pad = 2;
    return this.x - pad < entity.x + entity.width &&
           this.x + this.width + pad > entity.x &&
           this.y - pad < entity.y + entity.height &&
           this.y + this.height + pad > entity.y;
  }
  
  draw(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    p.push(); // Save drawing state
    
    // Draw boss
    p.stroke(0); // Black outline
    p.strokeWeight(2); // Thicker outline for boss
    p.fill(this.phase === 1 ? [200, 50, 50] : [255, 0, 0]);
    p.rect(screenX, screenY, this.width, this.height);
    
    // Draw eyes
    p.noStroke();
    p.fill(255, 255, 0); // Yellow eyes
    if (this.facingRight) {
      p.ellipse(screenX + 30, screenY + 15, 8, 8);
    } else {
      p.ellipse(screenX + 10, screenY + 15, 8, 8);
    }
    
    // Draw horns
    p.stroke(0);
    p.strokeWeight(1);
    p.fill(100);
    p.triangle(screenX + 10, screenY, screenX + 5, screenY - 15, screenX + 15, screenY);
    p.triangle(screenX + 30, screenY, screenX + 25, screenY - 15, screenX + 35, screenY);
    
    // Draw arms
    p.fill(this.phase === 1 ? [200, 50, 50] : [255, 0, 0]);
    if (this.facingRight) {
      p.rect(screenX + this.width, screenY + 15, 15, 10);
    } else {
      p.rect(screenX - 15, screenY + 15, 15, 10);
    }
    
    // Draw phase 2 effects
    if (this.phase === 2) {
      p.noStroke();
      p.fill(255, 100, 0, 150);
      p.ellipse(screenX + this.width/2, screenY + this.height/2, 50, 50);
    }
    
    // Draw health bar
    p.noStroke();
    p.fill(0);
    p.rect(screenX, screenY - 15, this.width, 10);
    p.fill(255, 0, 0);
    p.rect(screenX, screenY - 15, this.width * (this.health / this.maxHealth), 10);
    
    p.pop(); // Restore drawing state
  }
}

// Spawn enemies based on world position and time
export function spawnEnemies(p, world, entities, player, isDay, bossSpawned) {
  // Only spawn enemies occasionally
  if (Math.random() > 0.01) return;
  
  // Find a valid spawn position
  let spawnX, spawnY;
  let attempts = 0;
  
  while (attempts < 10) {
    // Try to spawn near player but off-screen
    const direction = Math.random() > 0.5 ? 1 : -1;
    spawnX = player.x + direction * (300 + Math.random() * 100);
    spawnY = Math.random() * 200;
    
    // Check if position is in air
    if (getTileAt(world, spawnX, spawnY) === 0 && 
        getTileAt(world, spawnX, spawnY + TILE_SIZE) !== 0) {
      break;
    }
    
    attempts++;
  }
  
  if (attempts >= 10) return;
  
  // Spawn different enemies based on day/night and progress
  if (!isDay) {
    // Night spawns more dangerous enemies
    const enemyType = Math.random();
    
    if (enemyType < 0.4) {
      entities.push(new Slime(spawnX, spawnY));
    } else if (enemyType < 0.7) {
      entities.push(new Zombie(spawnX, spawnY));
    } else {
      entities.push(new FlyingEye(spawnX, spawnY));
    }
  } else {
    // Day spawns mostly slimes
    if (Math.random() < 0.8) {
      entities.push(new Slime(spawnX, spawnY));
    } else {
      entities.push(new FlyingEye(spawnX, spawnY));
    }
  }
  
  // Spawn boss when conditions are met
  if (!bossSpawned && !isDay && Math.random() < 0.001) {
    entities.push(new Boss(spawnX, spawnY));
    return true;
  }
  
  return false;
}