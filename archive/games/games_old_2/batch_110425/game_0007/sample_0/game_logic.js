// game_logic.js - Core game logic and mechanics

import { gameState, RECIPES, QUEST_DEFINITIONS, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, TILE_SIZE } from './globals.js';
import { Monster } from './monster.js';

export function initializeGame(p, world) {
  // Reset inventory
  gameState.inventory = {
    dirt: 0,
    stone: 0,
    wood: 0,
    blocks_placed: 0,
    monsters_defeated: 0,
    crafted_wooden_sword: 0
  };
  
  // Initialize quests
  gameState.quests = JSON.parse(JSON.stringify(QUEST_DEFINITIONS));
  
  gameState.score = 0;
  gameState.time = 0;
  gameState.breakingBlock = null;
  gameState.breakProgress = 0;
  gameState.craftingOpen = false;
  gameState.monsterSpawnTimer = 180;
  gameState.questsCompleted = 0;
  
  // Reset entities (keep player, remove monsters)
  gameState.entities = gameState.entities.filter(e => e.type === 'player' || e.type === 'npc');
}

export function updateGame(p, world, keys) {
  gameState.time++;
  
  // Update player
  if (gameState.player) {
    gameState.player.update(world, keys);
    
    // Update camera to follow player
    gameState.camera.x = gameState.player.x - CANVAS_WIDTH / 2 + gameState.player.width / 2;
    gameState.camera.y = gameState.player.y - CANVAS_HEIGHT / 2 + gameState.player.height / 2;
    
    // Clamp camera
    gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, TILE_SIZE * world.blocks[0].length - CANVAS_WIDTH));
    gameState.camera.y = Math.max(0, Math.min(gameState.camera.y, TILE_SIZE * world.blocks.length - CANVAS_HEIGHT));
  }
  
  // Update monsters
  for (const entity of gameState.entities) {
    if (entity.type === 'monster') {
      entity.update(world, gameState.player);
    }
  }
  
  // Remove inactive entities
  gameState.entities = gameState.entities.filter(e => {
    if (e.type === 'monster' && !e.active) {
      gameState.inventory.monsters_defeated = (gameState.inventory.monsters_defeated || 0) + 1;
      gameState.score += 50;
      return false;
    }
    return true;
  });
  
  // Handle block breaking
  if (keys.space && !gameState.craftingOpen) {
    handleBlockBreaking(p, world);
  } else {
    gameState.breakingBlock = null;
    gameState.breakProgress = 0;
  }
  
  // Handle block placing
  if (keys.z && !gameState.craftingOpen) {
    handleBlockPlacing(world);
  }
  
  // Handle crafting
  if (keys.shift && gameState.craftingOpen && keys.z) {
    attemptCrafting(p);
  }
  
  // Handle attacking
  if (keys.space && gameState.player && gameState.player.hasWeapon) {
    handleAttack();
  }
  
  // Spawn monsters
  spawnMonsters(p, world);
  
  // Check quest completion
  checkQuests(p);
  
  // Check game over conditions
  checkGameOver();
}

function handleBlockBreaking(p, world) {
  if (!gameState.player) return;
  
  const target = gameState.player.getTargetBlock(world);
  const block = world.getBlock(target.x, target.y);
  
  if (!block || block.type === 'empty') {
    gameState.breakingBlock = null;
    gameState.breakProgress = 0;
    return;
  }
  
  // Check if same block
  if (!gameState.breakingBlock || 
      gameState.breakingBlock.x !== target.x || 
      gameState.breakingBlock.y !== target.y) {
    gameState.breakingBlock = target;
    gameState.breakProgress = 0;
  }
  
  // Increase break progress
  gameState.breakProgress += 0.02;
  
  if (gameState.breakProgress >= 1) {
    const material = world.breakBlock(target.x, target.y);
    if (material) {
      gameState.inventory[material] = (gameState.inventory[material] || 0) + 1;
      gameState.score += 5;
      
      // Log to p.logs
      p.logs.player_info.push({
        screen_x: gameState.player.x - gameState.camera.x,
        screen_y: gameState.player.y - gameState.camera.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
    gameState.breakingBlock = null;
    gameState.breakProgress = 0;
  }
}

function handleBlockPlacing(world) {
  if (!gameState.player) return;
  
  const target = gameState.player.getTargetBlock(world);
  
  // Check if player has blocks to place
  const availableMaterial = ['wood', 'stone', 'dirt'].find(m => (gameState.inventory[m] || 0) > 0);
  if (!availableMaterial) return;
  
  if (gameState.player.canPlaceBlock(world, target.x, target.y)) {
    // Determine block type from material
    let blockType = 'wood';
    if (availableMaterial === 'stone') blockType = 'stone';
    if (availableMaterial === 'dirt') blockType = 'dirt';
    
    if (world.setBlock(target.x, target.y, blockType)) {
      gameState.inventory[availableMaterial]--;
      gameState.inventory.blocks_placed = (gameState.inventory.blocks_placed || 0) + 1;
      gameState.score += 10;
    }
  }
}

function handleAttack() {
  if (!gameState.player.attack()) return;
  
  // Check for monsters in range
  const attackRange = TILE_SIZE * 1.5;
  for (const entity of gameState.entities) {
    if (entity.type === 'monster' && entity.active) {
      const dx = entity.x - gameState.player.x;
      const dy = entity.y - gameState.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < attackRange) {
        // Check if in front of player
        if ((gameState.player.facingRight && dx > 0) || (!gameState.player.facingRight && dx < 0)) {
          entity.takeDamage(20);
        }
      }
    }
  }
}

function attemptCrafting(p) {
  // Try to craft first available recipe
  for (const [recipeName, recipe] of Object.entries(RECIPES)) {
    let canCraft = true;
    for (const [material, count] of Object.entries(recipe.materials)) {
      if ((gameState.inventory[material] || 0) < count) {
        canCraft = false;
        break;
      }
    }
    
    if (canCraft) {
      // Consume materials
      for (const [material, count] of Object.entries(recipe.materials)) {
        gameState.inventory[material] -= count;
      }
      
      // Add crafted item
      if (recipeName === 'wooden_sword') {
        gameState.inventory.crafted_wooden_sword = (gameState.inventory.crafted_wooden_sword || 0) + 1;
        gameState.player.hasWeapon = true;
      } else {
        // Add as material for building
        const material = recipe.category === 'building' ? 'wood' : 'stone';
        gameState.inventory[material] = (gameState.inventory[material] || 0) + 2;
      }
      
      gameState.score += 25;
      break;
    }
  }
}

function spawnMonsters(p, world) {
  gameState.monsterSpawnTimer--;
  
  if (gameState.monsterSpawnTimer <= 0) {
    gameState.monsterSpawnTimer = 300;
    
    // Don't spawn too many monsters
    const monsterCount = gameState.entities.filter(e => e.type === 'monster').length;
    if (monsterCount < 5) {
      // Spawn away from player
      const spawnX = gameState.player.x + (p.random() > 0.5 ? 1 : -1) * (TILE_SIZE * 8 + p.random() * TILE_SIZE * 4);
      const spawnY = TILE_SIZE * 9;
      
      const monster = new Monster(p, spawnX, spawnY);
      gameState.entities.push(monster);
    }
  }
}

function checkQuests(p) {
  for (const quest of gameState.quests) {
    if (quest.completed) continue;
    
    let allComplete = true;
    for (const [key, value] of Object.entries(quest.objectives)) {
      if ((gameState.inventory[key] || 0) < value) {
        allComplete = false;
        break;
      }
    }
    
    if (allComplete) {
      quest.completed = true;
      gameState.score += quest.reward;
      gameState.questsCompleted++;
      
      // Log quest completion
      p.logs.game_info.push({
        data: `Quest completed: ${quest.title}`,
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

function checkGameOver() {
  // Win condition: all quests completed
  if (gameState.questsCompleted >= QUEST_DEFINITIONS.length) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
  }
  
  // Lose condition: player health depleted
  if (gameState.player && gameState.player.health <= 0) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
  }
}