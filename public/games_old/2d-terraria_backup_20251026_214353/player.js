import { TILE_SIZE, GRAVITY, JUMP_FORCE, MOVE_SPEED, TOOL_TYPES, ITEM_TYPES, TILE_TYPES, gameState } from './globals.js';
import { isSolidTile, isPlatform, getTileAt, setTileAt, tileToItem, itemToTile } from './world.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 32;
    this.velocityX = 0;
    this.velocityY = 0;
    this.isJumping = false;
    this.isGrounded = false;
    this.facingRight = true;
    this.mining = false;
    this.miningCooldown = 0;
    this.miningProgress = 0; // NEW: Track mining progress
    this.miningTarget = null; // NEW: Track what we're mining
    this.attackCooldown = 0;
    this.hurtCooldown = 0;
    this.dropThroughPlatform = false;
    this.groundedGraceFrames = 0;
  }
  
  update(p, world, entities, inventory, selectedTool, selectedBlock) {
    if (!p || !world) return; // Safety check
    
    this.isGrounded = this._probeGround(world);

    // Use UP arrow for jumping instead of SPACE
    const wantsJump = p.keyIsDown(p.UP_ARROW);
    
    if (this.isGrounded) this.groundedGraceFrames = 6;
    else if (this.groundedGraceFrames > 0) this.groundedGraceFrames--;

    if (wantsJump && (this.isGrounded || this.groundedGraceFrames > 0) && !this.isJumping) {
      this.velocityY = -JUMP_FORCE;
      this.isJumping = true;
      this.isGrounded = false;
    }

    if (this.isGrounded) this.isJumping = false;

    this.applyPhysics(world);
    if (inventory) this.handleMining(p, world, inventory, selectedTool);
    if (entities) this.handleAttack(p, entities, selectedTool);

    if (this.miningCooldown > 0) this.miningCooldown--;
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.hurtCooldown > 0) this.hurtCooldown--;

    // Only set mining to false if we're not currently mining
    if (!p.keyIsDown(32)) {
      this.mining = false;
    }
  }

  _probeGround(world) {
    // sample just below feet; no velocity gating
    const probeY = this.y + this.height + 0.5;
    const xs = [this.x + 1, this.x + this.width / 2, this.x + this.width - 1];
    for (const x of xs) {
      const t = getTileAt(world, x, probeY);
      if (isSolidTile(t) || (isPlatform(t) && !this.dropThroughPlatform)) return true;
    }
    return false;
  }
  
  applyPhysics(world) {
    
    this.velocityY += GRAVITY;
    
    // DON'T reset isGrounded here - let _probeGround handle it
    
    const bottomY = this.y + this.height;
    const leftX = this.x;
    const rightX = this.x + this.width;
    const midX = this.x + this.width / 2;
    
    const bottomSampleXs = [leftX + 1, midX, rightX - 1];
    for (let i = 0; i < bottomSampleXs.length; i++) {
      const sampleX = bottomSampleXs[i];
      const tileType = getTileAt(world, sampleX, bottomY + 1);
      if (this.velocityY >= 0 && (isSolidTile(tileType) || (isPlatform(tileType) && !this.dropThroughPlatform))) {
        this.isGrounded = true;
        this.velocityY = 0;
        this.y = Math.floor((bottomY + 1) / TILE_SIZE) * TILE_SIZE - this.height;
        break;
      }
    }
    
    // Apply horizontal movement
    this.x += this.velocityX;
    
    // Left collision
    if (this.velocityX < 0) {
      const leftX = this.x;
      const topY = this.y;
      const bottomY = this.y + this.height;
      for (let testY = topY; testY <= bottomY - 1; testY += Math.max(4, TILE_SIZE / 2)) {
        if (isSolidTile(getTileAt(world, leftX, testY))) {
          this.x = Math.floor(leftX / TILE_SIZE + 1) * TILE_SIZE;
          this.velocityX = 0;
          break;
        }
      }
    }
    
    // Right collision
    if (this.velocityX > 0) {
      const rightX = this.x + this.width;
      const topY = this.y;
      const bottomY = this.y + this.height;
      for (let testY = topY; testY <= bottomY - 1; testY += Math.max(4, TILE_SIZE / 2)) {
        if (isSolidTile(getTileAt(world, rightX, testY))) {
          this.x = Math.floor(rightX / TILE_SIZE) * TILE_SIZE - this.width;
          this.velocityX = 0;
          break;
        }
      }
    }
    
    // Apply vertical movement
    this.y += this.velocityY;
    
    // Top collision
    if (this.velocityY < 0) {
      const topY = this.y;
      const leftXTop = this.x;
      const rightXTop = this.x + this.width;
      const midXTop = this.x + this.width / 2;
      const topSampleXs = [leftXTop + 1, midXTop, rightXTop - 1];
      for (let i = 0; i < topSampleXs.length; i++) {
        const sampleX = topSampleXs[i];
        if (isSolidTile(getTileAt(world, sampleX, topY))) {
          this.y = Math.floor(topY / TILE_SIZE + 1) * TILE_SIZE;
          this.velocityY = 0;
          break;
        }
      }
    }
    
    // Bottom collision again after movement
    if (this.velocityY > 0) {
      const bottomY2 = this.y + this.height;
      const leftX2 = this.x;
      const rightX2 = this.x + this.width;
      const midX2 = this.x + this.width / 2;
      const bottomSampleXs2 = [leftX2 + 1, midX2, rightX2 - 1];
      for (let i = 0; i < bottomSampleXs2.length; i++) {
        const sampleX = bottomSampleXs2[i];
        const tileType = getTileAt(world, sampleX, bottomY2 + 1);
        if (isSolidTile(tileType) || (isPlatform(tileType) && !this.dropThroughPlatform)) {
          this.isGrounded = true;
          this.velocityY = 0;
          this.y = Math.floor(bottomY2 / TILE_SIZE) * TILE_SIZE - this.height;
          break;
        }
      }
    }
    
    // Limit velocity
    this.velocityY = Math.min(this.velocityY, 15);
    
    // Apply friction
    this.velocityX *= 0.8;
    if (Math.abs(this.velocityX) < 0.1) this.velocityX = 0;
  }
  
  jump() {
    if (this.isGrounded) {
      this.velocityY = -JUMP_FORCE;
      this.isJumping = true;
      this.isGrounded = false;
    }
  }
  
  moveLeft() {
    this.velocityX = -MOVE_SPEED;
    this.facingRight = false;
  }
  
  moveRight() {
    this.velocityX = MOVE_SPEED;
    this.facingRight = true;
  }
  
  duck(isDucking) {
    this.dropThroughPlatform = isDucking;
  }
  
  // NEW: Get the target block for mining
  getMiningTarget(world) {
    // Check multiple directions - make mining more flexible
    const directions = [
      // Facing direction
      { x: this.facingRight ? this.x + this.width + 5 : this.x - 25, y: this.y + this.height / 2 },
      // Below (for mining down)
      { x: this.x + this.width / 2, y: this.y + this.height + 10 },
      // Above (for mining up)
      { x: this.x + this.width / 2, y: this.y - 10 },
      // Slightly up from facing direction
      { x: this.facingRight ? this.x + this.width + 5 : this.x - 25, y: this.y + this.height / 2 - 15 },
      // Slightly down from facing direction  
      { x: this.facingRight ? this.x + this.width + 5 : this.x - 25, y: this.y + this.height / 2 + 15 }
    ];

    // Find the first solid block we can mine
    for (const dir of directions) {
      const tileX = Math.floor(dir.x / TILE_SIZE);
      const tileY = Math.floor(dir.y / TILE_SIZE);
      const tileType = getTileAt(world, dir.x, dir.y);
      
      if (tileType !== 0) { // Found a block to mine
        return { x: tileX, y: tileY, tileType: tileType, worldX: dir.x, worldY: dir.y };
      }
    }
    
    return null;
  }

  mine(p, world, inventory) {
    if (!world || !inventory) return; // Safety check
    
    const target = this.getMiningTarget(world);
    
    if (!target) {
      this.miningTarget = null;
      this.miningProgress = 0;
      return;
    }

    // If we're starting to mine a new block
    if (!this.miningTarget || this.miningTarget.x !== target.x || this.miningTarget.y !== target.y) {
      this.miningTarget = target;
      this.miningProgress = 0;
    }

    // Increase mining progress
    this.miningProgress += 1;
    this.mining = true;

    // Different blocks take different time to mine
    let miningTime = this.getMiningTime(target.tileType);

    // Block is fully mined
    if (this.miningProgress >= miningTime) {
      // Get the block type directly - no conversion!
      let blockType = this.getBlockDrop(target.tileType);
      
      if (blockType) {
        // Add to inventory
        if (!inventory[blockType]) {
          inventory[blockType] = 0;
        }
        inventory[blockType]++;
        
        // Remove tile
        setTileAt(world, target.worldX, target.worldY, 0);
      }

      // Reset mining
      this.miningTarget = null;
      this.miningProgress = 0;
      this.miningCooldown = 10; // Short cooldown between blocks
    }
  }

  // NEW: Get what block/item drops when mining
  getBlockDrop(tileType) {
    switch(tileType) {
      case TILE_TYPES.WOOD:
        return 'wooden_platform'; // Wood becomes wooden platforms
      case TILE_TYPES.STONE:
        return 'stone_wall'; // Stone becomes stone walls
      case TILE_TYPES.DIRT:
      case TILE_TYPES.GRASS:
        return 'dirt_block'; // Dirt becomes dirt blocks
      case TILE_TYPES.IRON_ORE:
        return 'iron_block'; // Iron ore becomes iron blocks
      case TILE_TYPES.GOLD_ORE:
        return 'gold_block'; // Gold ore becomes gold blocks
      case TILE_TYPES.WOODEN_PLATFORM:
        return 'wooden_platform'; // Platform drops platform
      case TILE_TYPES.WOODEN_WALL:
        return 'wooden_wall'; // Wall drops wall
      case TILE_TYPES.STONE_WALL:
        return 'stone_wall'; // Stone wall drops stone wall
      default:
        return null;
    }
  }

  handleMining(p, world, inventory, selectedTool) {
    if (p.keyIsDown(32)) { // SPACE
      if (selectedTool === TOOL_TYPES.PICKAXE || selectedTool === TOOL_TYPES.AXE) {
        if (this.miningCooldown === 0) {
          this.mine(p, world, inventory);
        }
      }
    } else {
      // Stop mining when key is released
      this.miningTarget = null;
      this.miningProgress = 0;
      this.mining = false;
    }
  }

  handleAttack(p, entities, selectedTool) {
    // Only attack when sword is equipped
    if (selectedTool !== TOOL_TYPES.SWORD) return;

    if (p.keyIsDown(32) && this.attackCooldown === 0) { // SPACE
      const attackDistance = 40;
      const attackX = this.facingRight ? this.x + this.width : this.x - attackDistance;
      const attackWidth = attackDistance;
      
      // Check for enemy collisions
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        
        if (entity.type && entity.type.includes('enemy')) {
          if (this.facingRight) {
            if (entity.x < attackX + attackWidth && entity.x + entity.width > attackX &&
                entity.y < this.y + this.height && entity.y + entity.height > this.y) {
              entity.takeDamage(10);
              this.attackCooldown = 20;
            }
          } else {
            if (entity.x < attackX + attackWidth && entity.x + entity.width > attackX &&
                entity.y < this.y + this.height && entity.y + entity.height > this.y) {
              entity.takeDamage(10);
              this.attackCooldown = 20;
            }
          }
        }
      }
    }
  }
  
  // Simplify the placeBlock method
  placeBlock(world, inventory, selectedBlock) {
    if (!selectedBlock || !inventory[selectedBlock] || inventory[selectedBlock] <= 0) {
      return false;
    }
    
    const placeX = this.facingRight ? this.x + this.width + 5 : this.x - 25;
    const placeY = this.y + this.height / 2;
    
    const tileType = getTileAt(world, placeX, placeY);
    
    if (tileType === 0) { // Only place in air
      const blockTile = itemToTile(selectedBlock);
      
      if (blockTile && setTileAt(world, placeX, placeY, blockTile)) {
        inventory[selectedBlock]--;
        return true;
      }
    }
    return false;
  }
  
  takeDamage(amount) {
    if (this.hurtCooldown === 0) {
      this.hurtCooldown = 30;
      // Apply damage to global player health
      gameState.health = Math.max(0, gameState.health - amount);
      return amount;
    }
    return 0;
  }
  
  draw(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    // Draw mining target highlight
    if (this.miningTarget && this.miningTarget.x !== undefined && this.miningTarget.y !== undefined) {
      p.push(); // Save current drawing state
      
      const targetScreenX = this.miningTarget.x * TILE_SIZE - cameraX;
      const targetScreenY = this.miningTarget.y * TILE_SIZE - cameraY;
      
      // Highlight the target block
      p.stroke(255, 255, 0); // Yellow outline
      p.strokeWeight(3);
      p.noFill();
      p.rect(targetScreenX, targetScreenY, TILE_SIZE, TILE_SIZE);
      
      // Draw mining progress bar
      if (this.miningProgress > 0 && this.miningTarget.tileType !== undefined) {
        const progress = this.miningProgress / (this.getMiningTime(this.miningTarget.tileType));
        
        p.fill(255, 0, 0, 200); // Red background
        p.noStroke();
        p.rect(targetScreenX, targetScreenY - 8, TILE_SIZE, 6);
        
        p.fill(0, 255, 0, 200); // Green progress
        p.rect(targetScreenX, targetScreenY - 8, TILE_SIZE * progress, 6);
      }
      
      p.pop(); // Restore drawing state
    }
    
    // Draw player
    p.push();
    if (this.hurtCooldown > 0 && Math.floor(p.frameCount / 4) % 2 === 0) {
      p.tint(255, 0, 0, 200);
    }
    
    // Draw player body with black outline
    p.stroke(0); // Black outline
    p.strokeWeight(1);
    p.fill(255, 200, 150); // Skin color
    p.rect(screenX, screenY, this.width, this.height);
    
    // Draw eyes
    p.noStroke();
    p.fill(0);
    if (this.facingRight) {
      p.ellipse(screenX + 12, screenY + 8, 3, 3);
    } else {
      p.ellipse(screenX + 4, screenY + 8, 3, 3);
    }
    
    // Draw body
    p.stroke(0); // Black outline
    p.strokeWeight(1);
    p.fill(50, 100, 200); // Shirt color
    p.rect(screenX, screenY + 12, this.width, this.height - 12);
    
    // Draw tool/weapon animation
    if ((this.mining || this.attackCooldown > 0) && gameState.selectedTool) {
      p.push(); // Save drawing state
      p.stroke(0); // Black outline for all tools
      p.strokeWeight(1);
      
      const toolX = this.facingRight ? screenX + this.width : screenX - 25;
      const toolY = screenY + 12;
      
      // Different tools have different appearances - all horizontal
      if (gameState.selectedTool === TOOL_TYPES.PICKAXE) {
        // Pickaxe - horizontal orientation
        p.fill(139, 69, 19); // Brown handle
        if (this.facingRight) {
          p.rect(toolX, toolY, 15, 4); // Horizontal handle
          p.fill(128, 128, 128); // Gray metal head
          p.rect(toolX + 15, toolY - 2, 8, 8); // Square pickaxe head
          p.rect(toolX + 18, toolY - 4, 3, 3); // Pointed tip
        } else {
          p.rect(toolX + 10, toolY, 15, 4); // Horizontal handle
          p.fill(128, 128, 128); // Gray metal head
          p.rect(toolX + 2, toolY - 2, 8, 8); // Square pickaxe head
          p.rect(toolX, toolY - 4, 3, 3); // Pointed tip
        }
        
      } else if (gameState.selectedTool === TOOL_TYPES.AXE) {
        // Axe - horizontal orientation with wider head
        p.fill(139, 69, 19); // Brown handle
        if (this.facingRight) {
          p.rect(toolX, toolY, 15, 4); // Horizontal handle
          p.fill(128, 128, 128); // Gray metal head
          p.rect(toolX + 15, toolY - 3, 8, 10); // Wide axe blade
          p.rect(toolX + 20, toolY - 1, 4, 6); // Blade edge
        } else {
          p.rect(toolX + 10, toolY, 15, 4); // Horizontal handle
          p.fill(128, 128, 128); // Gray metal head
          p.rect(toolX + 2, toolY - 3, 8, 10); // Wide axe blade
          p.rect(toolX - 2, toolY - 1, 4, 6); // Blade edge
        }
        
      } else if (gameState.selectedTool === TOOL_TYPES.SWORD) {
        // Sword - horizontal orientation
        p.fill(139, 69, 19); // Brown handle
        if (this.facingRight) {
          p.rect(toolX, toolY, 8, 4); // Horizontal handle
          p.fill(255, 215, 0); // Gold guard
          p.rect(toolX + 8, toolY - 2, 2, 8); // Cross guard
          p.fill(192, 192, 192); // Silver blade
          p.rect(toolX + 10, toolY + 1, 15, 2); // Horizontal blade
          p.rect(toolX + 23, toolY, 3, 4); // Pointed tip
        } else {
          p.rect(toolX + 17, toolY, 8, 4); // Horizontal handle
          p.fill(255, 215, 0); // Gold guard
          p.rect(toolX + 15, toolY - 2, 2, 8); // Cross guard
          p.fill(192, 192, 192); // Silver blade
          p.rect(toolX, toolY + 1, 15, 2); // Horizontal blade
          p.rect(toolX - 2, toolY, 3, 4); // Pointed tip
        }
      }
      
      p.pop(); // Restore drawing state
    }
    
    p.pop();
  }

  // Helper method for mining time calculation
  getMiningTime(tileType) {
    if (tileType === TILE_TYPES.STONE || tileType === TILE_TYPES.STONE_WALL) {
      return 45;
    } else if (tileType === TILE_TYPES.IRON_ORE) {
      return 60;
    } else if (tileType === TILE_TYPES.GOLD_ORE) {
      return 75;
    }
    return 30; // Default
  }
}
