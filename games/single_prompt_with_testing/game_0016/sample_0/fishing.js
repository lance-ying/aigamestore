// fishing.js - Fishing mechanics

import { gameState, FISHING_PHASES, LOCATIONS, FISH_DATA, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Fish, Projectile, Particle } from './entities.js';

let fishSpawnTimer = 0;
let particles = [];

export function initFishing(p) {
  fishSpawnTimer = 0;
  particles = [];
}

export function updateFishing(p) {
  const location = LOCATIONS[gameState.currentLocation];
  
  if (gameState.fishingPhase === FISHING_PHASES.SURFACE) {
    // Waiting to cast
  } else if (gameState.fishingPhase === FISHING_PHASES.DESCENDING) {
    updateDescending(p, location);
  } else if (gameState.fishingPhase === FISHING_PHASES.ASCENDING) {
    updateAscending(p, location);
  }
  
  // Update particles
  particles = particles.filter(particle => {
    particle.update();
    return !particle.isDead();
  });
}

function updateDescending(p, location) {
  // Move lure down
  const baseSpeed = 2 * (1 + gameState.speedUpgradeLevel * 0.15);
  gameState.player.vy = baseSpeed;
  gameState.player.update();
  
  gameState.currentDepth = gameState.player.y - 50;
  
  // Spawn fish
  fishSpawnTimer++;
  if (fishSpawnTimer > 40) {
    spawnFish(p, location);
    fishSpawnTimer = 0;
  }
  
  // Update fish
  gameState.entities.forEach(entity => {
    if (entity instanceof Fish) {
      entity.update();
    }
  });
  
  // Check collision with fish
  gameState.entities.forEach(entity => {
    if (entity instanceof Fish && entity.checkCollision(gameState.player.x, gameState.player.y, gameState.player.size)) {
      startAscending(p);
    }
  });
  
  // Check if reached max depth
  const maxDepth = 200 + gameState.lineUpgradeLevel * 50;
  if (gameState.currentDepth >= maxDepth) {
    startAscending(p);
  }
  
  // Remove inactive entities
  gameState.entities = gameState.entities.filter(e => e.active);
}

function updateAscending(p, location) {
  // Move lure up
  const baseSpeed = 3 * (1 + gameState.speedUpgradeLevel * 0.1);
  gameState.player.vy = -baseSpeed;
  gameState.player.update();
  
  gameState.currentDepth = gameState.player.y - 50;
  
  // Spawn fish
  fishSpawnTimer++;
  if (fishSpawnTimer > 30) {
    spawnFish(p, location);
    fishSpawnTimer = 0;
  }
  
  // Update fish
  gameState.entities.forEach(entity => {
    if (entity instanceof Fish) {
      entity.update();
    }
  });
  
  // Update projectiles
  gameState.framesSinceLastShot++;
  gameState.projectiles.forEach(proj => {
    proj.update();
    
    // Check collision with fish
    gameState.entities.forEach(entity => {
      if (entity instanceof Fish && proj.checkCollision(entity)) {
        entity.active = false;
        proj.active = false;
        
        // Add to caught fish
        gameState.fishCaught.push(entity.species);
        gameState.uniqueSpeciesCaught.add(entity.species);
        gameState.cash += entity.data.value;
        gameState.score += entity.data.value;
        
        // Create particles
        for (let i = 0; i < 8; i++) {
          particles.push(new Particle(p, entity.x, entity.y, entity.data.color));
        }
      }
    });
  });
  
  gameState.projectiles = gameState.projectiles.filter(p => p.active);
  
  // Check if returned to surface
  if (gameState.player.y <= 50) {
    returnToSurface(p);
  }
  
  // Remove inactive entities
  gameState.entities = gameState.entities.filter(e => e.active);
}

function spawnFish(p, location) {
  const fishTypes = location.fishTypes;
  const species = fishTypes[Math.floor(p.random(fishTypes.length))];
  
  let x, direction;
  if (p.random() < 0.5) {
    x = -30;
    direction = 1;
  } else {
    x = CANVAS_WIDTH + 30;
    direction = -1;
  }
  
  const y = gameState.player.y + p.random(-100, 100);
  
  if (y > 40 && y < CANVAS_HEIGHT - 40) {
    const fish = new Fish(p, species, x, y, direction);
    gameState.entities.push(fish);
  }
}

export function castLine(p) {
  if (gameState.fishingPhase === FISHING_PHASES.SURFACE) {
    gameState.fishingPhase = FISHING_PHASES.DESCENDING;
    gameState.player.y = 50;
    gameState.player.x = CANVAS_WIDTH / 2;
    gameState.currentDepth = 0;
    gameState.entities = [];
    gameState.projectiles = [];
    fishSpawnTimer = 0;
    
    p.logs.game_info.push({
      data: "Cast line",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function startAscending(p) {
  gameState.fishingPhase = FISHING_PHASES.ASCENDING;
  gameState.framesSinceLastShot = 0;
  
  p.logs.game_info.push({
    data: "Start ascending",
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function returnToSurface(p) {
  gameState.fishingPhase = FISHING_PHASES.SURFACE;
  gameState.player.y = 50;
  gameState.player.x = CANVAS_WIDTH / 2;
  gameState.entities = [];
  gameState.projectiles = [];
  particles = [];
  
  // Check for location unlocks
  checkLocationUnlock(p);
  
  p.logs.game_info.push({
    data: "Return to surface",
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function steerLure(direction) {
  if (gameState.fishingPhase === FISHING_PHASES.DESCENDING) {
    gameState.player.vx = direction * 3;
  }
}

export function shootWeapon(p) {
  if (gameState.fishingPhase === FISHING_PHASES.ASCENDING) {
    const cooldown = 10;
    if (gameState.framesSinceLastShot < cooldown) return;
    
    const projectileCount = 1 + gameState.weaponUpgradeLevel;
    
    // Find nearest fish
    const visibleFish = gameState.entities.filter(e => 
      e instanceof Fish && e.active && 
      e.y > 0 && e.y < CANVAS_HEIGHT
    );
    
    if (visibleFish.length > 0) {
      // Sort by distance
      visibleFish.sort((a, b) => {
        const distA = p.dist(gameState.player.x, gameState.player.y, a.x, a.y);
        const distB = p.dist(gameState.player.x, gameState.player.y, b.x, b.y);
        return distA - distB;
      });
      
      // Shoot at nearest fish
      for (let i = 0; i < Math.min(projectileCount, visibleFish.length); i++) {
        const proj = new Projectile(p, gameState.player.x, gameState.player.y, visibleFish[i]);
        gameState.projectiles.push(proj);
      }
      
      gameState.framesSinceLastShot = 0;
    }
  }
}

function checkLocationUnlock(p) {
  for (let i = gameState.unlockedLocations; i < LOCATIONS.length; i++) {
    if (gameState.cash >= LOCATIONS[i].unlockCash) {
      gameState.unlockedLocations = i + 1;
      
      p.logs.game_info.push({
        data: `Unlocked ${LOCATIONS[i].name}`,
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export function openShop() {
  if (gameState.fishingPhase === FISHING_PHASES.SURFACE) {
    gameState.fishingPhase = FISHING_PHASES.SHOP;
  }
}

export function closeShop() {
  if (gameState.fishingPhase === FISHING_PHASES.SHOP) {
    gameState.fishingPhase = FISHING_PHASES.SURFACE;
  }
}

export function drawFishing(p) {
  // Draw particles
  particles.forEach(particle => particle.draw());
}

export function getParticles() {
  return particles;
}