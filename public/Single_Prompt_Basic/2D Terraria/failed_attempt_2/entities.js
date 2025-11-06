import { TILE_SIZE, GRAVITY, JUMP_FORCE, MOVE_SPEED, BLOCK_TYPES, ITEM_TYPES, TOOL_TIERS, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = TILE_SIZE * 0.8;
    this.height = TILE_SIZE * 1.8;
    this.velocityX = 0;
    this.velocityY = 0;
    this.isJumping = false;
    this.isGrounded = false;
    this.facingRight = true;
    this.health = 100;
    this.maxHealth = 100;
    this.attackCooldown = 0;
    this.miningCooldown = 0;
    this.placingCooldown = 0;
    this.invincibilityFrames = 0;
    this.tool = TOOL_TIERS.HAND;
    this.weaponType = null;
  }

  update(p) {
    // Apply gravity
    this.velocityY += GRAVITY;
    
    // Apply velocity
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // Friction
    this.velocityX *= 0.8;
    
    // Check world boundaries
    if (this.x < 0) this.x = 0;
    if (this.x > TILE_SIZE * gameState.world.length - this.width) {
      this.x = TILE_SIZE * gameState.world.length - this.width;
    }
    
    // Check collision with blocks
    this.checkCollisions();
    
    // Cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.miningCooldown > 0) this.miningCooldown--;
    if (this.placingCooldown > 0) this.placingCooldown--;
    if (this.invincibilityFrames > 0) this.invincibilityFrames--;

    // Update tool based on inventory
    this.updateTool();
    
    // Check if near crafting table
    this.checkCraftingTable();
  }

  checkCollisions() {
    this.isGrounded = false;
    
    // Get the grid positions
    const leftTile = Math.floor(this.x / TILE_SIZE);
    const rightTile = Math.floor((this.x + this.width) / TILE_SIZE);
    const topTile = Math.floor(this.y / TILE_SIZE);
    const bottomTile = Math.floor((this.y + this.height) / TILE_SIZE);
    
    // Check each potentially colliding tile
    for (let y = topTile; y <= bottomTile; y++) {
      for (let x = leftTile; x <= rightTile; x++) {
        if (y >= 0 && y < gameState.world[0].length && x >= 0 && x < gameState.world.length) {
          const block = gameState.world[x][y];
          
          if (block !== BLOCK_TYPES.AIR) {
            const blockLeft = x * TILE_SIZE;
            const blockRight = blockLeft + TILE_SIZE;
            const blockTop = y * TILE_SIZE;
            const blockBottom = blockTop + TILE_SIZE;
            
            // Collision resolution
            if (this.x + this.width > blockLeft && this.x < blockRight && 
                this.y + this.height > blockTop && this.y < blockBottom) {
              
              // Calculate overlap on each side
              const overlapLeft = this.x + this.width - blockLeft;
              const overlapRight = blockRight - this.x;
              const overlapTop = this.y + this.height - blockTop;
              const overlapBottom = blockBottom - this.y;
              
              // Find minimum overlap
              const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
              
              // Resolve based on minimum overlap
              if (minOverlap === overlapTop && this.velocityY >= 0) {
                this.y = blockTop - this.height;
                this.velocityY = 0;
                this.isGrounded = true;
                this.isJumping = false;
              } else if (minOverlap === overlapBottom && this.velocityY <= 0) {
                this.y = blockBottom;
                this.velocityY = 0;
              } else if (minOverlap === overlapLeft && this.velocityX > 0) {
                this.x = blockLeft - this.width;
                this.velocityX = 0;
              } else if (minOverlap === overlapRight && this.velocityX < 0) {
                this.x = blockRight;
                this.velocityX = 0;
              }
            }
          }
        }
      }
    }
  }

  move(direction) {
    this.velocityX += direction * MOVE_SPEED;
    if (direction > 0) this.facingRight = true;
    if (direction < 0) this.facingRight = false;
  }

  jump() {
    if (this.isGrounded && !this.isJumping) {
      this.velocityY = -JUMP_FORCE;
      this.isJumping = true;
      this.isGrounded = false;
    }
  }

  mine(p) {
    if (this.miningCooldown > 0) return;
    
    // Determine mining position based on facing direction
    const mineX = this.facingRight ? 
      Math.floor((this.x + this.width + TILE_SIZE / 2) / TILE_SIZE) : 
      Math.floor((this.x - TILE_SIZE / 2) / TILE_SIZE);
    const mineY = Math.floor((this.y + this.height / 2) / TILE_SIZE);
    
    // Check if the position is valid
    if (mineX >= 0 && mineX < gameState.world.length && 
        mineY >= 0 && mineY < gameState.world[0].length) {
      
      const block = gameState.world[mineX][mineY];
      
      // If there's a block to mine
      if (block !== BLOCK_TYPES.AIR) {
        // Add to inventory
        this.addToInventory(block);
        
        // Remove the block
        gameState.world[mineX][mineY] = BLOCK_TYPES.AIR;
        
        // Set cooldown
        this.miningCooldown = 10;
      }
    }
  }

  placeBlock(p) {
    if (this.placingCooldown > 0) return;
    
    // Get the currently selected item
    const selectedItem = gameState.inventory[gameState.selectedItemIndex];
    if (!selectedItem || selectedItem.count <= 0) return;
    
    // Only certain items can be placed as blocks
    let blockType = null;
    switch (selectedItem.type) {
      case ITEM_TYPES.DIRT:
        blockType = BLOCK_TYPES.DIRT;
        break;
      case ITEM_TYPES.STONE:
        blockType = BLOCK_TYPES.STONE;
        break;
      case ITEM_TYPES.WOOD:
        blockType = BLOCK_TYPES.WOOD;
        break;
      case ITEM_TYPES.IRON:
        blockType = BLOCK_TYPES.IRON;
        break;
      case ITEM_TYPES.GOLD:
        blockType = BLOCK_TYPES.GOLD;
        break;
      case ITEM_TYPES.CRAFTING_TABLE:
        blockType = BLOCK_TYPES.CRAFTING_TABLE;
        break;
      case ITEM_TYPES.PORTAL:
        blockType = BLOCK_TYPES.PORTAL;
        // Placing a portal wins the game!
        gameState.gamePhase = "GAME_OVER_WIN";
        p.logs.game_info.push({
          game_status: gameState.gamePhase,
          data: { score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        break;
      default:
        return; // Can't place this item
    }
    
    // Determine placement position based on facing direction
    const placeX = this.facingRight ? 
      Math.floor((this.x + this.width + TILE_SIZE / 2) / TILE_SIZE) : 
      Math.floor((this.x - TILE_SIZE / 2) / TILE_SIZE);
    const placeY = Math.floor((this.y + this.height / 2) / TILE_SIZE);
    
    // Check if the position is valid and empty
    if (placeX >= 0 && placeX < gameState.world.length && 
        placeY >= 0 && placeY < gameState.world[0].length &&
        gameState.world[placeX][placeY] === BLOCK_TYPES.AIR) {
      
      // Place the block
      gameState.world[placeX][placeY] = blockType;
      
      // Decrease item count
      selectedItem.count--;
      if (selectedItem.count <= 0) {
        gameState.inventory.splice(gameState.selectedItemIndex, 1);
        if (gameState.selectedItemIndex >= gameState.inventory.length) {
          gameState.selectedItemIndex = Math.max(0, gameState.inventory.length - 1);
        }
      }
      
      // Set cooldown
      this.placingCooldown = 10;
    }
  }

  addToInventory(blockType) {
    // Convert block type to item type
    let itemType;
    switch (blockType) {
      case BLOCK_TYPES.DIRT:
        itemType = ITEM_TYPES.DIRT;
        break;
      case BLOCK_TYPES.STONE:
        itemType = ITEM_TYPES.STONE;
        break;
      case BLOCK_TYPES.IRON:
        itemType = ITEM_TYPES.IRON;
        break;
      case BLOCK_TYPES.GOLD:
        itemType = ITEM_TYPES.GOLD;
        break;
      case BLOCK_TYPES.WOOD:
        itemType = ITEM_TYPES.WOOD;
        break;
      case BLOCK_TYPES.CRAFTING_TABLE:
        itemType = ITEM_TYPES.CRAFTING_TABLE;
        break;
      default:
        return; // Can't add this to inventory
    }
    
    // Check if we already have this item type
    for (let i = 0; i < gameState.inventory.length; i++) {
      if (gameState.inventory[i].type === itemType) {
        gameState.inventory[i].count++;
        return;
      }
    }
    
    // Otherwise, add new item
    gameState.inventory.push({ type: itemType, count: 1 });
  }

  takeDamage(amount) {
    if (this.invincibilityFrames > 0) return;
    
    this.health -= amount;
    this.invincibilityFrames = 30; // Half a second of invincibility
    
    if (this.health <= 0) {
      this.health = 0;
      gameState.gamePhase = "GAME_OVER_LOSE";
    }
  }

  attack() {
    if (this.attackCooldown > 0) return;
    
    // Attack enemies in range
    const attackRange = 40; // pixels
    const attackX = this.facingRight ? this.x + this.width : this.x - attackRange;
    const attackWidth = attackRange;
    
    for (let i = 0; i < gameState.entities.length; i++) {
      const entity = gameState.entities[i];
      if (entity instanceof Enemy) {
        // Check if enemy is in attack range
        if (entity.x + entity.width > attackX && 
            entity.x < attackX + attackWidth &&
            entity.y + entity.height > this.y &&
            entity.y < this.y + this.height) {
          
          // Damage based on current weapon
          const damage = this.tool.damage || 1;
          entity.takeDamage(damage);
        }
      }
    }
    
    this.attackCooldown = 20; // Attack cooldown
  }

  updateTool() {
    // Check inventory for best tools
    let bestPickaxe = TOOL_TIERS.HAND;
    let bestSword = null;
    
    for (const item of gameState.inventory) {
      switch (item.type) {
        case ITEM_TYPES.WOODEN_PICKAXE:
          if (TOOL_TIERS.WOODEN_PICKAXE.power > bestPickaxe.power) {
            bestPickaxe = TOOL_TIERS.WOODEN_PICKAXE;
          }
          break;
        case ITEM_TYPES.STONE_PICKAXE:
          if (TOOL_TIERS.STONE_PICKAXE.power > bestPickaxe.power) {
            bestPickaxe = TOOL_TIERS.STONE_PICKAXE;
          }
          break;
        case ITEM_TYPES.IRON_PICKAXE:
          if (TOOL_TIERS.IRON_PICKAXE.power > bestPickaxe.power) {
            bestPickaxe = TOOL_TIERS.IRON_PICKAXE;
          }
          break;
        case ITEM_TYPES.GOLD_PICKAXE:
          if (TOOL_TIERS.GOLD_PICKAXE.power > bestPickaxe.power) {
            bestPickaxe = TOOL_TIERS.GOLD_PICKAXE;
          }
          break;
        case ITEM_TYPES.WOODEN_SWORD:
          if (!bestSword || TOOL_TIERS.WOODEN_SWORD.damage > bestSword.damage) {
            bestSword = TOOL_TIERS.WOODEN_SWORD;
          }
          break;
        case ITEM_TYPES.STONE_SWORD:
          if (!bestSword || TOOL_TIERS.STONE_SWORD.damage > bestSword.damage) {
            bestSword = TOOL_TIERS.STONE_SWORD;
          }
          break;
        case ITEM_TYPES.IRON_SWORD:
          if (!bestSword || TOOL_TIERS.IRON_SWORD.damage > bestSword.damage) {
            bestSword = TOOL_TIERS.IRON_SWORD;
          }
          break;
        case ITEM_TYPES.GOLD_SWORD:
          if (!bestSword || TOOL_TIERS.GOLD_SWORD.damage > bestSword.damage) {
            bestSword = TOOL_TIERS.GOLD_SWORD;
          }
          break;
      }
    }
    
    // Update player's tool and weapon
    this.tool = bestPickaxe;
    this.weaponType = bestSword;
  }

  checkCraftingTable() {
    // Check if player is near a crafting table
    gameState.nearCraftingTable = false;
    
    // Check in a 3x3 area around the player
    const centerX = Math.floor((this.x + this.width / 2) / TILE_SIZE);
    const centerY = Math.floor((this.y + this.height / 2) / TILE_SIZE);
    
    for (let y = centerY - 1; y <= centerY + 1; y++) {
      for (let x = centerX - 1; x <= centerX + 1; x++) {
        if (y >= 0 && y < gameState.world[0].length && x >= 0 && x < gameState.world.length) {
          if (gameState.world[x][y] === BLOCK_TYPES.CRAFTING_TABLE) {
            gameState.nearCraftingTable = true;
            return;
          }
        }
      }
    }
  }

  render(p) {
    p.push();
    
    // Flash when invincible
    if (this.invincibilityFrames > 0 && p.frameCount % 4 < 2) {
      p.tint(255, 100, 100);
    }
    
    // Draw player
    p.fill(255, 200, 150); // Skin color
    p.noStroke();
    
    // Body
    p.rect(this.x - gameState.camera.x, this.y - gameState.camera.y, this.width, this.height);
    
    // Eyes
    p.fill(0);
    const eyeX = this.facingRight ? this.x + this.width * 0.7 : this.x + this.width * 0.3;
    p.ellipse(eyeX - gameState.camera.x, this.y + this.height * 0.3 - gameState.camera.y, 3, 3);
    
    // Tool or weapon
    p.stroke(100, 70, 40);
    p.strokeWeight(3);
    if (this.facingRight) {
      p.line(
        this.x + this.width - gameState.camera.x,
        this.y + this.height * 0.5 - gameState.camera.y,
        this.x + this.width + 15 - gameState.camera.x,
        this.y + this.height * 0.3 - gameState.camera.y
      );
    } else {
      p.line(
        this.x - gameState.camera.x,
        this.y + this.height * 0.5 - gameState.camera.y,
        this.x - 15 - gameState.camera.x,
        this.y + this.height * 0.3 - gameState.camera.y
      );
    }
    
    p.pop();
  }
}

export class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = TILE_SIZE;
    this.height = TILE_SIZE * 1.5;
    this.velocityX = 0;
    this.velocityY = 0;
    this.isGrounded = false;
    this.health = 10;
    this.maxHealth = 10;
    this.damage = 10;
    this.attackCooldown = 0;
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.jumpCooldown = 0;
    this.type = Math.floor(Math.random() * 3); // 0 = slime, 1 = zombie, 2 = skeleton
    
    // Adjust properties based on type
    if (this.type === 0) { // Slime
      this.height = TILE_SIZE;
      this.health = 5;
      this.damage = 5;
    } else if (this.type === 2) { // Skeleton
      this.health = 15;
      this.damage = 15;
    }
  }

  update(p) {
    // Apply gravity
    this.velocityY += GRAVITY;
    
    // Move towards player if nearby
    const player = gameState.player;
    const distToPlayer = Math.abs(this.x - player.x);
    
    if (distToPlayer < TILE_SIZE * 10) { // Aggro range
      this.direction = this.x < player.x ? 1 : -1;
      
      // Move towards player
      this.velocityX += this.direction * 0.1;
      
      // Jump if obstacle in front
      if (this.isGrounded && this.jumpCooldown <= 0) {
        const frontX = Math.floor((this.x + (this.direction > 0 ? this.width + 5 : -5)) / TILE_SIZE);
        const frontY = Math.floor((this.y + this.height - 5) / TILE_SIZE);
        
        if (frontY >= 0 && frontY < gameState.world[0].length && frontX >= 0 && frontX < gameState.world.length) {
          if (gameState.world[frontX][frontY] !== BLOCK_TYPES.AIR) {
            this.velocityY = -JUMP_FORCE * 0.7;
            this.jumpCooldown = 60;
          }
        }
      }
      
      // Attack if very close
      if (distToPlayer < TILE_SIZE * 1.5 && this.attackCooldown <= 0) {
        player.takeDamage(this.damage);
        this.attackCooldown = 60;
      }
    } else {
      // Random movement
      if (Math.random() < 0.01) {
        this.direction = -this.direction;
      }
      this.velocityX += this.direction * 0.05;
    }
    
    // Apply velocity with limits
    this.velocityX = Math.max(-1.5, Math.min(1.5, this.velocityX));
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // Friction
    this.velocityX *= 0.9;
    
    // Check world boundaries
    if (this.x < 0) {
      this.x = 0;
      this.direction = 1;
    }
    if (this.x > TILE_SIZE * gameState.world.length - this.width) {
      this.x = TILE_SIZE * gameState.world.length - this.width;
      this.direction = -1;
    }
    
    // Check collision with blocks
    this.checkCollisions();
    
    // Update cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.jumpCooldown > 0) this.jumpCooldown--;
  }

  checkCollisions() {
    this.isGrounded = false;
    
    // Get the grid positions
    const leftTile = Math.floor(this.x / TILE_SIZE);
    const rightTile = Math.floor((this.x + this.width) / TILE_SIZE);
    const topTile = Math.floor(this.y / TILE_SIZE);
    const bottomTile = Math.floor((this.y + this.height) / TILE_SIZE);
    
    // Check each potentially colliding tile
    for (let y = topTile; y <= bottomTile; y++) {
      for (let x = leftTile; x <= rightTile; x++) {
        if (y >= 0 && y < gameState.world[0].length && x >= 0 && x < gameState.world.length) {
          const block = gameState.world[x][y];
          
          if (block !== BLOCK_TYPES.AIR) {
            const blockLeft = x * TILE_SIZE;
            const blockRight = blockLeft + TILE_SIZE;
            const blockTop = y * TILE_SIZE;
            const blockBottom = blockTop + TILE_SIZE;
            
            // Collision resolution
            if (this.x + this.width > blockLeft && this.x < blockRight && 
                this.y + this.height > blockTop && this.y < blockBottom) {
              
              // Calculate overlap on each side
              const overlapLeft = this.x + this.width - blockLeft;
              const overlapRight = blockRight - this.x;
              const overlapTop = this.y + this.height - blockTop;
              const overlapBottom = blockBottom - this.y;
              
              // Find minimum overlap
              const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
              
              // Resolve based on minimum overlap
              if (minOverlap === overlapTop && this.velocityY >= 0) {
                this.y = blockTop - this.height;
                this.velocityY = 0;
                this.isGrounded = true;
              } else if (minOverlap === overlapBottom && this.velocityY <= 0) {
                this.y = blockBottom;
                this.velocityY = 0;
              } else if (minOverlap === overlapLeft && this.velocityX > 0) {
                this.x = blockLeft - this.width;
                this.velocityX = 0;
                this.direction = -1;
              } else if (minOverlap === overlapRight && this.velocityX < 0) {
                this.x = blockRight;
                this.velocityX = 0;
                this.direction = 1;
              }
            }
          }
        }
      }
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    
    if (this.health <= 0) {
      // Remove from entities
      const index = gameState.entities.indexOf(this);
      if (index !== -1) {
        gameState.entities.splice(index, 1);
      }
      
      // Add score
      gameState.score += this.type === 0 ? 10 : (this.type === 1 ? 20 : 30);
    }
  }

  render(p) {
    p.push();
    
    // Draw enemy based on type
    if (this.type === 0) { // Slime
      p.fill(100, 200, 100);
      p.noStroke();
      p.rect(this.x - gameState.camera.x, this.y - gameState.camera.y, this.width, this.height, 5);
      
      // Eyes
      p.fill(0);
      p.ellipse(this.x + this.width * 0.3 - gameState.camera.x, this.y + this.height * 0.3 - gameState.camera.y, 3, 3);
      p.ellipse(this.x + this.width * 0.7 - gameState.camera.x, this.y + this.height * 0.3 - gameState.camera.y, 3, 3);
    } else if (this.type === 1) { // Zombie
      p.fill(100, 150, 100);
      p.noStroke();
      p.rect(this.x - gameState.camera.x, this.y - gameState.camera.y, this.width, this.height);
      
      // Eyes
      p.fill(200, 0, 0);
      p.ellipse(this.x + this.width * 0.3 - gameState.camera.x, this.y + this.height * 0.2 - gameState.camera.y, 4, 4);
      p.ellipse(this.x + this.width * 0.7 - gameState.camera.x, this.y + this.height * 0.2 - gameState.camera.y, 4, 4);
      
      // Mouth
      p.stroke(50);
      p.strokeWeight(1);
      p.line(
        this.x + this.width * 0.3 - gameState.camera.x,
        this.y + this.height * 0.4 - gameState.camera.y,
        this.x + this.width * 0.7 - gameState.camera.x,
        this.y + this.height * 0.4 - gameState.camera.y
      );
    } else if (this.type === 2) { // Skeleton
      p.fill(220, 220, 200);
      p.noStroke();
      p.rect(this.x - gameState.camera.x, this.y - gameState.camera.y, this.width, this.height);
      
      // Eyes
      p.fill(0);
      p.ellipse(this.x + this.width * 0.3 - gameState.camera.x, this.y + this.height * 0.2 - gameState.camera.y, 4, 4);
      p.ellipse(this.x + this.width * 0.7 - gameState.camera.x, this.y + this.height * 0.2 - gameState.camera.y, 4, 4);
      
      // Ribs
      p.stroke(180);
      p.strokeWeight(1);
      for (let i = 0; i < 3; i++) {
        p.line(
          this.x - gameState.camera.x,
          this.y + this.height * (0.5 + i * 0.1) - gameState.camera.y,
          this.x + this.width - gameState.camera.x,
          this.y + this.height * (0.5 + i * 0.1) - gameState.camera.y
        );
      }
    }
    
    // Health bar
    const healthPercent = this.health / this.maxHealth;
    p.fill(255, 0, 0);
    p.rect(this.x - gameState.camera.x, this.y - 10 - gameState.camera.y, this.width, 5);
    p.fill(0, 255, 0);
    p.rect(this.x - gameState.camera.x, this.y - 10 - gameState.camera.y, this.width * healthPercent, 5);
    
    p.pop();
  }
}