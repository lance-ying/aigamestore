import { gameState, PLAYER_WIDTH, PLAYER_HEIGHT, BLOCK_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, BLOCK_TYPES, TOOL_POWER, WEAPON_DAMAGE, BLOCK_HARDNESS } from './globals.js';
import { getBlockAt, setBlockAt, isBlockSolid } from './world.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    
    this.moveSpeed = 3;
    this.jumpPower = 8;
    this.gravity = 0.5;
    
    this.miningBlock = null;
    this.miningProgress = 0;
    
    this.equippedTool = "none";
    this.equippedWeapon = "none";
    this.equippedArmor = "none";
    
    this.attackCooldown = 0;
    this.attackRange = 40;
    
    this.invulnerableFrames = 0;
  }
  
  update(p, inputs) {
    // Handle mining
    if (inputs.mining && !gameState.craftingMenuOpen) {
      this.handleMining(p);
    } else {
      this.miningBlock = null;
      this.miningProgress = 0;
    }
    
    // Handle attacking
    if (inputs.mining && !gameState.craftingMenuOpen && this.attackCooldown <= 0) {
      this.handleAttack(p);
    }
    
    // Movement
    if (!gameState.craftingMenuOpen) {
      if (inputs.left) {
        this.vx = -this.moveSpeed;
      } else if (inputs.right) {
        this.vx = this.moveSpeed;
      } else {
        this.vx = 0;
      }
      
      // Jumping
      if (inputs.jump && this.onGround) {
        this.vy = -this.jumpPower;
        this.onGround = false;
      }
    }
    
    // Apply gravity
    this.vy += this.gravity;
    if (this.vy > 15) this.vy = 15;
    
    // Move and check collisions
    this.x += this.vx;
    this.checkCollisionX();
    
    this.y += this.vy;
    this.checkCollisionY();
    
    // Update cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.invulnerableFrames > 0) this.invulnerableFrames--;
    
    // Check bounds
    if (this.y > CANVAS_HEIGHT * 3) {
      this.takeDamage(999);
    }
  }
  
  checkCollisionX() {
    const left = this.x;
    const right = this.x + this.width;
    const top = this.y;
    const bottom = this.y + this.height;
    
    // Check all corners
    const checks = [
      { x: left, y: top },
      { x: right, y: top },
      { x: left, y: bottom },
      { x: right, y: bottom },
      { x: left, y: (top + bottom) / 2 },
      { x: right, y: (top + bottom) / 2 },
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
      { x: (left + right) / 2, y: top },
      { x: (left + right) / 2, y: bottom },
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
  
  handleMining(p) {
    // Find nearest block to mine
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    
    let closestBlock = null;
    let closestDist = 60; // Mining range
    
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const checkX = Math.floor(centerX / BLOCK_SIZE) + dx;
        const checkY = Math.floor(centerY / BLOCK_SIZE) + dy;
        
        if (checkX >= 0 && checkX < gameState.blocks.length && checkY >= 0 && checkY < gameState.blocks[0].length) {
          const block = gameState.blocks[checkX][checkY];
          if (block.type !== BLOCK_TYPES.AIR) {
            const blockCenterX = checkX * BLOCK_SIZE + BLOCK_SIZE / 2;
            const blockCenterY = checkY * BLOCK_SIZE + BLOCK_SIZE / 2;
            const dist = p.dist(centerX, centerY, blockCenterX, blockCenterY);
            
            if (dist < closestDist) {
              closestDist = dist;
              closestBlock = { x: checkX, y: checkY, block: block };
            }
          }
        }
      }
    }
    
    if (closestBlock) {
      if (this.miningBlock && (this.miningBlock.x !== closestBlock.x || this.miningBlock.y !== closestBlock.y)) {
        this.miningProgress = 0;
      }
      
      this.miningBlock = closestBlock;
      
      const toolPower = TOOL_POWER[this.equippedTool] || 1;
      const hardness = BLOCK_HARDNESS[closestBlock.block.type] || 1;
      
      this.miningProgress += toolPower / hardness;
      
      if (this.miningProgress >= 60) {
        // Block mined!
        const blockType = closestBlock.block.type;
        this.addToInventory(blockType);
        setBlockAt(closestBlock.x * BLOCK_SIZE, closestBlock.y * BLOCK_SIZE, BLOCK_TYPES.AIR);
        this.miningProgress = 0;
        this.miningBlock = null;
      }
    } else {
      this.miningBlock = null;
      this.miningProgress = 0;
    }
  }
  
  handleAttack(p) {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    
    // Find nearest enemy
    let closestEnemy = null;
    let closestDist = this.attackRange;
    
    for (const enemy of gameState.enemies) {
      if (enemy.health > 0) {
        const dist = p.dist(centerX, centerY, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
        if (dist < closestDist) {
          closestDist = dist;
          closestEnemy = enemy;
        }
      }
    }
    
    if (closestEnemy) {
      const damage = WEAPON_DAMAGE[this.equippedWeapon] || 5;
      closestEnemy.takeDamage(damage);
      
      // Knockback
      const dx = closestEnemy.x - centerX;
      closestEnemy.vx = dx > 0 ? 5 : -5;
      closestEnemy.vy = -3;
      
      this.attackCooldown = 20;
    }
  }
  
  addToInventory(blockType) {
    const blockName = getBlockName(blockType);
    if (!gameState.playerInventory[blockName]) {
      gameState.playerInventory[blockName] = 0;
    }
    gameState.playerInventory[blockName]++;
    gameState.score += 10;
  }
  
  takeDamage(amount) {
    if (this.invulnerableFrames > 0) return;
    
    const armor = this.equippedArmor === "iron_armor" ? 0.5 : 1;
    const damage = Math.floor(amount * armor);
    
    gameState.playerHealth -= damage;
    this.invulnerableFrames = 60;
    
    if (gameState.playerHealth <= 0) {
      gameState.playerHealth = 0;
      gameState.gamePhase = "GAME_OVER_LOSE";
    }
  }
  
  render(p) {
    p.push();
    
    // Body
    if (this.invulnerableFrames > 0 && this.invulnerableFrames % 10 < 5) {
      p.fill(255, 100, 100);
    } else {
      p.fill(100, 150, 255);
    }
    p.rect(this.x - gameState.camera.x, this.y - gameState.camera.y, this.width, this.height);
    
    // Head
    p.fill(255, 220, 180);
    p.rect(this.x - gameState.camera.x + 2, this.y - gameState.camera.y + 2, 12, 12);
    
    // Eyes
    p.fill(0);
    p.rect(this.x - gameState.camera.x + 4, this.y - gameState.camera.y + 6, 2, 2);
    p.rect(this.x - gameState.camera.x + 10, this.y - gameState.camera.y + 6, 2, 2);
    
    // Tool in hand
    if (this.equippedTool !== "none") {
      p.fill(150, 100, 50);
      p.rect(this.x - gameState.camera.x + 14, this.y - gameState.camera.y + 18, 8, 3);
    }
    
    p.pop();
  }
}

function getBlockName(blockType) {
  const names = {
    [BLOCK_TYPES.DIRT]: "dirt",
    [BLOCK_TYPES.STONE]: "stone",
    [BLOCK_TYPES.WOOD]: "wood",
    [BLOCK_TYPES.IRON_ORE]: "iron_ore",
    [BLOCK_TYPES.GOLD_ORE]: "gold_ore",
    [BLOCK_TYPES.GRASS]: "grass",
    [BLOCK_TYPES.LEAF]: "leaf",
  };
  return names[blockType] || "unknown";
}