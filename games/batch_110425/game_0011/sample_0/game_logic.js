// game_logic.js - Game logic and updates
import { gameState, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { createLevel } from './levels.js';

export function initializeLevel(levelNum) {
  const level = createLevel(levelNum);
  
  // Create player
  gameState.player = new Player(level.playerStart.x, level.playerStart.y);
  
  // Set up level entities
  gameState.platforms = level.platforms;
  gameState.movableBlocks = level.movableBlocks;
  gameState.switches = level.switches;
  gameState.doors = level.doors;
  gameState.crystals = level.crystals;
  gameState.exitPortal = level.exitPortal;
  gameState.hazards = level.hazards;
  
  // Reset level state
  gameState.crystalsCollected = 0;
  gameState.totalCrystals = level.crystals.length;
  gameState.levelComplete = false;
  gameState.currentWorld = 'NORMAL';
  
  // Build entities array
  gameState.entities = [
    gameState.player,
    ...gameState.platforms,
    ...gameState.movableBlocks,
    ...gameState.switches,
    ...gameState.doors,
    ...gameState.crystals,
    ...gameState.hazards
  ];
  
  if (gameState.exitPortal) {
    gameState.entities.push(gameState.exitPortal);
  }
}

export function updateGame(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  // Update player
  if (gameState.player) {
    const currentWorldPlatforms = gameState.platforms.filter(
      plat => plat.world === gameState.currentWorld
    );
    const currentWorldDoors = gameState.doors.filter(
      door => door.world === gameState.currentWorld && door.isBlocking()
    );
    
    gameState.player.update(
      [...currentWorldPlatforms, ...currentWorldDoors],
      gameState.movableBlocks
    );
    
    // Log player info periodically
    if (p.frameCount % 30 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  }
  
  // Update movable blocks
  const currentWorldPlatforms = gameState.platforms.filter(
    plat => plat.world === gameState.currentWorld
  );
  gameState.movableBlocks.forEach(block => {
    block.update(currentWorldPlatforms);
  });
  
  // Update doors based on switches
  gameState.doors.forEach(door => {
    door.update(gameState.switches);
  });
  
  // Update crystals
  gameState.crystals.forEach(crystal => {
    if (crystal.world === gameState.currentWorld) {
      crystal.update();
      if (crystal.checkCollection(gameState.player)) {
        gameState.crystalsCollected++;
        gameState.score += 50;
      }
    }
  });
  
  // Update hazards
  gameState.hazards.forEach(hazard => {
    hazard.update();
    if (hazard.world === gameState.currentWorld && hazard.checkCollision(gameState.player)) {
      playerDeath(p);
    }
  });
  
  // Update exit portal
  if (gameState.exitPortal) {
    gameState.exitPortal.update();
    if (gameState.exitPortal.world === gameState.currentWorld &&
        gameState.exitPortal.checkEntry(gameState.player) &&
        gameState.crystalsCollected === gameState.totalCrystals) {
      levelComplete(p);
    }
  }
  
  // Check for fall death
  if (gameState.player && gameState.player.y > CANVAS_HEIGHT + 50) {
    playerDeath(p);
  }
}

function playerDeath(p) {
  gameState.deathCount++;
  gameState.score = Math.max(0, gameState.score - 20);
  
  // Respawn player
  initializeLevel(gameState.currentLevel);
  
  // If too many deaths, game over
  if (gameState.deathCount >= 10) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, reason: "too_many_deaths" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function levelComplete(p) {
  gameState.score += 100;
  gameState.score += Math.max(0, 50 - Math.floor((Date.now() - gameState.levelStartTime) / 1000));
  
  if (gameState.currentLevel < gameState.totalLevels) {
    // Move to next level
    gameState.currentLevel++;
    initializeLevel(gameState.currentLevel);
  } else {
    // Won the game!
    gameState.gamePhase = "GAME_OVER_WIN";
    p.logs.game_info.push({
      data: { 
        gamePhase: gameState.gamePhase,
        finalScore: gameState.score,
        totalDeaths: gameState.deathCount
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}