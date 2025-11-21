import { gameState, BLOCK_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { getBlockAt, isBlockSolid } from './world.js';

export class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // "slime", "zombie", "boss_golem"
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.health = 20;
    this.maxHealth = 20;
    this.damage = 5;
    this.moveSpeed = 1;
    this.detectionRange = 200;
    this.attackCooldown = 0;
    this.alive = true;
    
    if (type === "slime") {
      this.width = 20;
      this.height = 20;
      this.health = 20;
      this.maxHealth = 20;
      this.damage = 5;
      this.moveSpeed = 1.5;
      this.color = [50, 255, 50];
    } else if (type === "zombie") {
      this.width = 16;
      this.height = 30;
      this.health = 40;
      this.maxHealth = 40;
      this.damage = 10;
      this.moveSpeed = 1;
      this.color = [100, 150, 100];
    } else if (type === "boss_golem") {
      this.width = 40;
      this.height = 60;
      this.health = 200;
      this.maxHealth = 200;
      this.damage = 20;
      this.moveSpeed = 0.8;
      this.detectionRange = 300;
      this.color = [120, 120, 120];
    }
  }
  
  update(p) {
    if (!this.alive || this.health <= 0) {
      this.alive = false;
      return;
    }
    
    const player = gameState.player;
    if (!player) return;
    
    const dist = p.dist(this.x, this.y, player.x, player.y);
    
    if (dist < this.detectionRange) {
      // Move toward player
      if (player.x < this.x - 10) {
        this.vx = -this.moveSpeed;
      } else if (player.x > this.x + 10) {
        this.vx = this.moveSpeed;
      } else {
        this.vx = 0;
      }
      
      // Attack if close
      if (dist < 30 && this.attackCooldown <= 0) {
        player.takeDamage(this.damage);
        this.attackCooldown = 60;
      }
    } else {
      // Wander
      if (p.frameCount % 120 === 0) {
        this.vx = p.random(-1, 1) * this.moveSpeed;
      }
    }
    
    // Apply gravity
    this.vy += 0.5;
    if (this.vy > 15) this.vy = 15;
    
    // Move
    this.x += this.vx;
    this.checkCollisionX();
    
    this.y += this.vy;
    this.checkCollisionY();
    
    // Update cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
  }
  
  checkCollisionX() {
    const left = this.x;
    const right = this.x + this.width;
    const top = this.y;
    const bottom = this.y + this.height;
    
    const checks = [
      { x: left, y: top },
      { x: right, y: top },
      { x: left, y: bottom },
      { x: right, y: bottom },
    ];
    
    for (const check of checks) {
      const block = getBlockAt(check.x, check.y);
      if (block && isBlockSolid(block.type)) {
        if (this.vx > 0) {
          this.x = Math.floor(check.x / BLOCK_SIZE) * BLOCK_SIZE - this.width - 0.1;
        } else {
          this.x = Math.ceil(check.x / BLOCK_SIZE) * BLOCK_SIZE + 0.1;
        }
        this.vx = 0;
        return;
      }
    }
  }
  
  checkCollisionY() {
    const left = this.x;
    const right = this.x + this.width;
    const top = this.y;
    const bottom = this.y + this.height;
    
    this.onGround = false;
    
    const checks = [
      { x: left, y: top },
      { x: right, y: top },
      { x: left, y: bottom },
      { x: right, y: bottom },
    ];
    
    for (const check of checks) {
      const block = getBlockAt(check.x, check.y);
      if (block && isBlockSolid(block.type)) {
        if (this.vy > 0) {
          this.y = Math.floor(check.y / BLOCK_SIZE) * BLOCK_SIZE - this.height - 0.1;
          this.onGround = true;
        } else {
          this.y = Math.ceil(check.y / BLOCK_SIZE) * BLOCK_SIZE + 0.1;
        }
        this.vy = 0;
        return;
      }
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
      this.onDeath();
    }
  }
  
  onDeath() {
    gameState.score += this.maxHealth * 5;
    
    // Drop items
    if (this.type === "slime") {
      // Nothing special
    } else if (this.type === "zombie") {
      // Nothing special
    } else if (this.type === "boss_golem") {
      // Boss defeated!
      if (!gameState.bossesDefeated.includes("golem")) {
        gameState.bossesDefeated.push("golem");
        gameState.unlockedRecipes.push("iron_pickaxe", "iron_sword", "iron_armor");
        
        // Win condition
        gameState.gamePhase = "GAME_OVER_WIN";
      }
    }
  }
  
  render(p) {
    if (!this.alive) return;
    
    p.push();
    
    // Body
    p.fill(...this.color);
    p.rect(this.x - gameState.camera.x, this.y - gameState.camera.y, this.width, this.height);
    
    // Eyes (for zombies and bosses)
    if (this.type !== "slime") {
      p.fill(255, 0, 0);
      const eyeY = this.y - gameState.camera.y + this.height * 0.2;
      p.rect(this.x - gameState.camera.x + this.width * 0.25, eyeY, 3, 3);
      p.rect(this.x - gameState.camera.x + this.width * 0.65, eyeY, 3, 3);
    }
    
    // Health bar
    p.fill(255, 0, 0);
    p.rect(this.x - gameState.camera.x, this.y - gameState.camera.y - 10, this.width, 4);
    p.fill(0, 255, 0);
    const healthWidth = (this.health / this.maxHealth) * this.width;
    p.rect(this.x - gameState.camera.x, this.y - gameState.camera.y - 10, healthWidth, 4);
    
    p.pop();
  }
}

export function spawnEnemies(p) {
  const player = gameState.player;
  if (!player) return;
  
  // Spawn rate based on time of day
  const isNight = gameState.time > 500;
  const spawnChance = isNight ? 0.02 : 0.005;
  
  if (p.random() < spawnChance && gameState.enemies.length < 10) {
    // Spawn off-screen
    const spawnX = player.x + p.random(-400, 400);
    let spawnY = 0;
    
    // Find ground level
    for (let y = 0; y < gameState.blocks[0].length; y++) {
      const bx = Math.floor(spawnX / BLOCK_SIZE);
      if (bx >= 0 && bx < gameState.blocks.length) {
        if (gameState.blocks[bx][y].type !== 0) {
          spawnY = (y - 2) * BLOCK_SIZE;
          break;
        }
      }
    }
    
    const enemyType = p.random() < 0.6 ? "slime" : "zombie";
    const enemy = new Enemy(spawnX, spawnY, enemyType);
    gameState.enemies.push(enemy);
  }
  
  // Spawn boss if conditions met
  if (gameState.bossesDefeated.length === 0 && gameState.score > 500) {
    let hasBoss = false;
    for (const enemy of gameState.enemies) {
      if (enemy.type === "boss_golem" && enemy.alive) {
        hasBoss = true;
        break;
      }
    }
    
    if (!hasBoss && p.random() < 0.001) {
      const spawnX = player.x + 400;
      let spawnY = 0;
      
      for (let y = 0; y < gameState.blocks[0].length; y++) {
        const bx = Math.floor(spawnX / BLOCK_SIZE);
        if (bx >= 0 && bx < gameState.blocks.length) {
          if (gameState.blocks[bx][y].type !== 0) {
            spawnY = (y - 3) * BLOCK_SIZE;
            break;
          }
        }
      }
      
      const boss = new Enemy(spawnX, spawnY, "boss_golem");
      gameState.enemies.push(boss);
    }
  }
}