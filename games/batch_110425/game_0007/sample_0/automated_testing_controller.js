// automated_testing_controller.js - Automated testing functions

import { gameState, QUEST_DEFINITIONS, TILE_SIZE } from './globals.js';

let testState = {
  phase: 'gather_wood',
  positionHistory: [],
  stuckTimer: 0,
  targetBlock: null,
  gatheringComplete: false,
  craftingAttempted: false,
  buildingCount: 0,
  monstersTargeted: 0
};

function getTestWinAction(gameState) {
  if (!gameState.player) return {};
  
  const keys = {
    left: false,
    right: false,
    up: false,
    space: false,
    z: false,
    shift: false
  };
  
  // Track position to detect stuck state
  const currentPos = { x: Math.floor(gameState.player.x), y: Math.floor(gameState.player.y) };
  testState.positionHistory.push(currentPos);
  if (testState.positionHistory.length > 60) {
    testState.positionHistory.shift();
    
    // Check if stuck
    const recentPositions = testState.positionHistory.slice(-30);
    const avgX = recentPositions.reduce((sum, p) => sum + p.x, 0) / recentPositions.length;
    const variance = recentPositions.reduce((sum, p) => sum + Math.abs(p.x - avgX), 0) / recentPositions.length;
    
    if (variance < 5) {
      testState.stuckTimer++;
      if (testState.stuckTimer > 60) {
        keys.up = true;
        testState.stuckTimer = 0;
      }
    } else {
      testState.stuckTimer = 0;
    }
  }
  
  // State machine for completing all quests
  const woodNeeded = 10 - (gameState.inventory.wood || 0);
  const stoneNeeded = 10 - (gameState.inventory.stone || 0);
  const hasSword = gameState.inventory.crafted_wooden_sword > 0;
  const blocksPlaced = gameState.inventory.blocks_placed || 0;
  const monstersDefeated = gameState.inventory.monsters_defeated || 0;
  
  // Phase 1: Gather wood
  if (testState.phase === 'gather_wood' && woodNeeded > 0) {
    return gatherMaterial(gameState, keys, 'wood');
  } else if (testState.phase === 'gather_wood') {
    testState.phase = 'gather_stone';
  }
  
  // Phase 2: Gather stone
  if (testState.phase === 'gather_stone' && stoneNeeded > 0) {
    return gatherMaterial(gameState, keys, 'stone');
  } else if (testState.phase === 'gather_stone') {
    testState.phase = 'craft_sword';
  }
  
  // Phase 3: Craft sword
  if (testState.phase === 'craft_sword' && !hasSword) {
    if (!gameState.craftingOpen) {
      keys.shift = true;
    } else {
      keys.z = true;
      testState.phase = 'close_crafting';
    }
    return keys;
  } else if (testState.phase === 'close_crafting') {
    keys.shift = true;
    testState.phase = 'build_blocks';
    return keys;
  }
  
  // Phase 4: Place blocks
  if (testState.phase === 'build_blocks' && blocksPlaced < 20) {
    return placeBlocks(gameState, keys);
  } else if (testState.phase === 'build_blocks') {
    testState.phase = 'fight_monsters';
  }
  
  // Phase 5: Fight monsters
  if (testState.phase === 'fight_monsters' && monstersDefeated < 5) {
    return fightMonsters(gameState, keys);
  }
  
  // Default: move around
  keys.right = gameState.time % 120 < 60;
  keys.left = gameState.time % 120 >= 60;
  
  return keys;
}

function gatherMaterial(gameState, keys, materialType) {
  const world = gameState.world;
  if (!world) return keys;
  
  // Find nearest block of desired type
  const playerTileX = Math.floor((gameState.player.x + gameState.player.width / 2) / TILE_SIZE);
  const playerTileY = Math.floor((gameState.player.y + gameState.player.height / 2) / TILE_SIZE);
  
  let nearestBlock = null;
  let nearestDist = Infinity;
  
  for (let y = 0; y < world.blocks.length; y++) {
    for (let x = 0; x < world.blocks[0].length; x++) {
      const block = world.blocks[y][x];
      if ((materialType === 'wood' && block.type === 'wood') ||
          (materialType === 'stone' && block.type === 'stone')) {
        const dist = Math.abs(x - playerTileX) + Math.abs(y - playerTileY);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestBlock = { x, y };
        }
      }
    }
  }
  
  if (nearestBlock) {
    // Move towards block
    if (Math.abs(nearestBlock.x - playerTileX) > 1) {
      keys.right = nearestBlock.x > playerTileX;
      keys.left = nearestBlock.x < playerTileX;
    }
    
    // Jump if needed
    if (nearestBlock.y < playerTileY && gameState.player.onGround) {
      keys.up = true;
    }
    
    // Break block if adjacent
    if (Math.abs(nearestBlock.x - playerTileX) <= 1 && Math.abs(nearestBlock.y - playerTileY) <= 1) {
      keys.space = true;
    }
  }
  
  return keys;
}

function placeBlocks(gameState, keys) {
  const target = gameState.player.getTargetBlock(gameState.world);
  
  // Simple placement strategy: build to the right
  keys.z = true;
  
  // Move right periodically
  if (gameState.time % 60 < 30) {
    keys.right = true;
  }
  
  return keys;
}

function fightMonsters(gameState, keys) {
  // Find nearest monster
  let nearestMonster = null;
  let nearestDist = Infinity;
  
  for (const entity of gameState.entities) {
    if (entity.type === 'monster' && entity.active) {
      const dx = entity.x - gameState.player.x;
      const dy = entity.y - gameState.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestMonster = entity;
      }
    }
  }
  
  if (nearestMonster) {
    // Move towards monster
    const dx = nearestMonster.x - gameState.player.x;
    keys.right = dx > 0;
    keys.left = dx < 0;
    
    // Attack when close
    if (Math.abs(dx) < TILE_SIZE * 2) {
      keys.space = true;
    }
    
    // Jump if monster is above
    const dy = nearestMonster.y - gameState.player.y;
    if (dy < 0 && gameState.player.onGround) {
      keys.up = true;
    }
  } else {
    // No monsters visible, move around to find them
    keys.right = gameState.time % 120 < 60;
    keys.left = gameState.time % 120 >= 60;
  }
  
  return keys;
}

function getBasicTestAction(gameState) {
  const keys = {
    left: false,
    right: false,
    up: false,
    space: false,
    z: false,
    shift: false
  };
  
  // Test basic movement
  const cycle = Math.floor(gameState.time / 60) % 4;
  
  if (cycle === 0) {
    keys.right = true;
  } else if (cycle === 1) {
    keys.left = true;
  } else if (cycle === 2 && gameState.player && gameState.player.onGround) {
    keys.up = true;
  } else if (cycle === 3) {
    keys.space = true;
  }
  
  return keys;
}

function getRandomAction(gameState) {
  const random = Math.random();
  return {
    left: random < 0.2,
    right: random >= 0.2 && random < 0.4,
    up: random >= 0.4 && random < 0.5,
    space: random >= 0.5 && random < 0.7,
    z: random >= 0.7 && random < 0.8,
    shift: random >= 0.8 && random < 0.85
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;