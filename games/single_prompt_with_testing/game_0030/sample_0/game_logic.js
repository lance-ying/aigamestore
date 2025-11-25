// game_logic.js - Game logic and mechanics

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_PLAYING, PHASE_GAME_OVER_WIN, SPIRIT_STATE_WAITING, SPIRIT_STATE_ON_BOAT } from './globals.js';
import { Player } from './player.js';
import { Boat } from './boat.js';
import { Spirit } from './spirit.js';
import { Island } from './island.js';
import { Everdoor } from './everdoor.js';

export function initGame(p) {
  // Reset game state
  gameState.entities = [];
  gameState.spirits = [];
  gameState.islands = [];
  gameState.resources = { fish: 0, plants: 0, meals: 0 };
  gameState.score = 0;
  gameState.boatX = CANVAS_WIDTH / 2;
  gameState.everdoorReached = false;
  gameState.spiritsReleased = 0;
  gameState.totalSpirits = 3;
  gameState.frameCount = 0;
  gameState.lastIslandSpawn = 0;
  gameState.interactionCooldown = 0;
  gameState.cookingCooldown = 0;
  
  // Create boat
  gameState.boat = new Boat(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
  
  // Create player
  gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 150);
  gameState.entities.push(gameState.player);
  
  // Create spirits at different positions
  const spiritPositions = [
    { x: 100, y: 150 },
    { x: 300, y: 120 },
    { x: 500, y: 140 }
  ];
  
  for (let i = 0; i < 3; i++) {
    const spirit = new Spirit(spiritPositions[i].x, spiritPositions[i].y, i);
    gameState.spirits.push(spirit);
    gameState.entities.push(spirit);
  }
  
  // Create initial islands
  spawnIsland(p, 150, 250, 'fish');
  spawnIsland(p, 450, 220, 'plant');
  
  // Create Everdoor
  gameState.everdoor = new Everdoor(CANVAS_WIDTH + 200);
  
  // Log game start
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, message: "Game started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function spawnIsland(p, x, y, type) {
  const island = new Island(x, y, type);
  gameState.islands.push(island);
  gameState.entities.push(island);
}

export function updateGame(p) {
  gameState.frameCount++;
  
  // Update boat
  gameState.boat.update();
  const boatDeckY = gameState.boat.getDeckY();
  
  // Update player
  gameState.player.update(boatDeckY, gameState.islands);
  
  // Update spirits
  for (let spirit of gameState.spirits) {
    spirit.update(gameState.boatX, boatDeckY);
  }
  
  // Update islands
  for (let island of gameState.islands) {
    island.update();
  }
  
  // Update everdoor
  if (gameState.everdoor) {
    gameState.everdoor.update();
  }
  
  // Spawn new islands periodically
  if (gameState.frameCount - gameState.lastIslandSpawn > 180) {
    const type = Math.random() > 0.5 ? 'fish' : 'plant';
    const x = Math.random() * (CANVAS_WIDTH - 100) + 50;
    const y = 180 + Math.random() * 60;
    spawnIsland(p, x, y, type);
    gameState.lastIslandSpawn = gameState.frameCount;
  }
  
  // Remove inactive islands
  gameState.islands = gameState.islands.filter(island => island.active);
  
  // Check if all spirits picked up and boat should move to everdoor
  const allSpiritsOnBoard = gameState.spirits.every(s => s.state !== SPIRIT_STATE_WAITING);
  if (allSpiritsOnBoard && !gameState.everdoorReached) {
    // Move boat and everdoor towards each other
    if (gameState.boatX < CANVAS_WIDTH - 150) {
      gameState.boatX += 1;
      gameState.boat.x = gameState.boatX;
    }
    if (gameState.everdoor.x > CANVAS_WIDTH - 100) {
      gameState.everdoor.x -= 0.5;
    }
    if (gameState.everdoor.isNear(gameState.player.x, gameState.boatX)) {
      gameState.everdoorReached = true;
    }
  }
  
  // Cooldowns
  if (gameState.interactionCooldown > 0) {
    gameState.interactionCooldown--;
  }
  if (gameState.cookingCooldown > 0) {
    gameState.cookingCooldown--;
  }
  
  // Check win condition
  if (gameState.spiritsReleased >= gameState.totalSpirits) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_WIN, message: "All spirits released!" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Log player position
  if (gameState.frameCount % 60 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}

export function handleInteraction(p) {
  if (gameState.interactionCooldown > 0) return;
  
  const player = gameState.player;
  
  // Check spirit pickup
  for (let spirit of gameState.spirits) {
    if (spirit.state === SPIRIT_STATE_WAITING) {
      const dist = Math.sqrt((player.x - spirit.x) ** 2 + (player.y - spirit.y) ** 2);
      if (dist < 40) {
        spirit.pickUp();
        gameState.score += 100;
        gameState.interactionCooldown = 30;
        p.logs.game_info.push({
          data: { action: "spirit_pickup", spirit: spirit.name },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        return;
      }
    }
  }
  
  // Check island harvesting
  for (let island of gameState.islands) {
    if (island.active) {
      const dist = Math.sqrt((player.x - (island.x + island.width / 2)) ** 2 + 
                             (player.y - island.y) ** 2);
      if (dist < 50) {
        if (island.harvest()) {
          if (island.type === 'fish') {
            gameState.resources.fish++;
          } else if (island.type === 'plant') {
            gameState.resources.plants++;
          }
          gameState.score += 10;
          gameState.interactionCooldown = 20;
          p.logs.game_info.push({
            data: { action: "harvest", type: island.type },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
          return;
        }
      }
    }
  }
  
  // Check spirit release at everdoor
  if (gameState.everdoorReached) {
    for (let spirit of gameState.spirits) {
      if (spirit.state === SPIRIT_STATE_ON_BOAT && spirit.isReady()) {
        const dist = Math.sqrt((player.x - gameState.everdoor.x) ** 2 + 
                               (player.y - gameState.everdoor.y) ** 2);
        if (dist < 80) {
          spirit.release();
          gameState.spiritsReleased++;
          gameState.score += 500;
          gameState.interactionCooldown = 30;
          p.logs.game_info.push({
            data: { action: "spirit_release", spirit: spirit.name },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
          return;
        }
      }
    }
  }
}

export function handleCooking(p) {
  if (gameState.cookingCooldown > 0) return;
  
  // Need at least 2 ingredients to cook
  if (gameState.resources.fish > 0 && gameState.resources.plants > 0) {
    gameState.resources.fish--;
    gameState.resources.plants--;
    gameState.resources.meals++;
    gameState.score += 20;
    gameState.cookingCooldown = 60;
    
    p.logs.game_info.push({
      data: { action: "cook_meal" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Auto-feed spirits if there are meals
    feedSpirits(p);
  }
}

function feedSpirits(p) {
  if (gameState.resources.meals <= 0) return;
  
  // Feed spirits on board
  for (let spirit of gameState.spirits) {
    if (spirit.state === SPIRIT_STATE_ON_BOAT && !spirit.isReady() && gameState.resources.meals > 0) {
      spirit.feed();
      gameState.resources.meals--;
      gameState.score += 50;
      p.logs.game_info.push({
        data: { action: "feed_spirit", spirit: spirit.name, happiness: spirit.happiness },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      if (gameState.resources.meals <= 0) break;
    }
  }
}