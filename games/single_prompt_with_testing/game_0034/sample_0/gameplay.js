// gameplay.js - Core gameplay mechanics

import { gameState, GAME_PHASES, ENTITY_TYPES, RESOURCE_TYPES } from './globals.js';
import { Habitat } from './entities.js';

export function handlePlayerMovement(p) {
  const player = gameState.player;
  if (!player) return;
  
  const isSprinting = p.keyIsDown(16);
  const speed = isSprinting ? player.sprintSpeed : player.speed;
  
  let dx = 0;
  let dy = 0;
  
  if (p.keyIsDown(37)) dx -= speed; // LEFT
  if (p.keyIsDown(39)) dx += speed; // RIGHT
  if (p.keyIsDown(38)) dy -= speed; // UP
  if (p.keyIsDown(40)) dy += speed; // DOWN
  
  if (dx !== 0 || dy !== 0) {
    player.move(dx, dy, gameState);
    
    // Log player position periodically
    if (p.frameCount % 30 === 0) {
      p.logs.player_info.push({
        screen_x: player.x - gameState.camera.x,
        screen_y: player.y - gameState.camera.y,
        game_x: player.x,
        game_y: player.y,
        framecount: p.frameCount
      });
    }
  }
  
  // Space - interact
  if (p.keyIsDown(32)) {
    if (p.frameCount % 10 === 0) {
      handleInteractions(p);
    }
  }
  
  // Z - build habitat
  if (p.keyIsDown(90)) {
    if (p.frameCount % 30 === 0) {
      tryBuildHabitat(p);
    }
  }
}

function handleInteractions(p) {
  const player = gameState.player;
  const interactionRange = 40;
  
  gameState.entities.forEach(entity => {
    const dist = p.dist(player.x, player.y, entity.x, entity.y);
    
    if (dist < interactionRange) {
      if (entity.type === ENTITY_TYPES.RESOURCE && !entity.collected) {
        entity.collected = true;
        entity.active = false;
        gameState.resources[entity.resourceType]++;
        gameState.score += 10;
      } else if (entity.type === ENTITY_TYPES.ARTIFACT && !entity.collected) {
        entity.collected = true;
        entity.active = false;
        gameState.artifactsCollected++;
        gameState.score += 100;
        
        // Check win condition
        if (gameState.artifactsCollected >= gameState.totalArtifacts) {
          gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
          p.logs.game_info.push({
            data: { phase: "GAME_OVER_WIN" },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
    }
  });
}

function tryBuildHabitat(p) {
  const player = gameState.player;
  const cost = {
    TITANIUM: 2,
    COPPER: 1,
    QUARTZ: 1
  };
  
  // Check if player has enough resources
  if (gameState.resources.TITANIUM >= cost.TITANIUM &&
      gameState.resources.COPPER >= cost.COPPER &&
      gameState.resources.QUARTZ >= cost.QUARTZ) {
    
    // Check if not too close to existing habitat
    let canBuild = true;
    gameState.habitats.forEach(habitat => {
      const dist = p.dist(player.x, player.y, habitat.x, habitat.y);
      if (dist < 100) {
        canBuild = false;
      }
    });
    
    if (canBuild) {
      gameState.resources.TITANIUM -= cost.TITANIUM;
      gameState.resources.COPPER -= cost.COPPER;
      gameState.resources.QUARTZ -= cost.QUARTZ;
      
      const habitat = new Habitat(player.x, player.y);
      gameState.habitats.push(habitat);
      gameState.entities.push(habitat);
      gameState.score += 50;
    }
  }
}

export function updateGameLogic(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const player = gameState.player;
  
  // Update all entities
  gameState.entities.forEach(entity => {
    if (entity.active) {
      entity.update(p, gameState);
    }
  });
  
  // Check lose conditions
  if (player.oxygen <= 0 || player.temperature <= 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Update camera to follow player
  updateCamera(p);
}

function updateCamera(p) {
  const player = gameState.player;
  const targetX = player.x - 300;
  const targetY = player.y - 200;
  
  gameState.camera.x = p.constrain(targetX, 0, 1800 - 600);
  gameState.camera.y = p.constrain(targetY, 0, 1200 - 400);
}