// game_logic.js
import { gameState, CANVAS_WIDTH, GROUND_Y, MAX_ZOMBIES, CHECKPOINT_DISTANCE } from './globals.js';
import { Vehicle } from './vehicle.js';
import { Zombie } from './zombie.js';

export function initGame(p) {
  // Reset game state for new run
  gameState.player = new Vehicle(p, 100, GROUND_Y - 40);
  gameState.entities = [gameState.player];
  gameState.zombies = [];
  gameState.particles = [];
  gameState.score = 0;
  gameState.distance = 0;
  gameState.zombiesKilled = 0;
  gameState.cameraX = 0;
  gameState.keys = {};
  gameState.upgradeShopOpen = false;
  gameState.runStarted = true;
  
  // Apply upgrades
  gameState.maxFuel = 100 + gameState.upgrades.fuel * 50;
  gameState.fuel = gameState.maxFuel;
  
  gameState.maxNitro = 100 + gameState.upgrades.nitro * 20;
  gameState.nitro = gameState.maxNitro;
  
  gameState.maxHealth = 100 + gameState.upgrades.armor * 20;
  gameState.health = gameState.maxHealth;
  
  // Initial zombies
  for (let i = 0; i < 5; i++) {
    spawnZombie(p, 200 + i * 100);
  }
  
  // Log game start
  p.logs.game_info.push({
    data: { phase: "PLAYING", event: "game_started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateGame(p) {
  if (!gameState.player) return;
  
  // Update camera
  gameState.cameraX = gameState.player.x - CANVAS_WIDTH / 3;
  
  // Update player
  gameState.player.update();
  
  // Update zombies
  gameState.zombies.forEach(zombie => {
    zombie.update();
    
    // Collision with player
    if (zombie.health > 0 && gameState.player) {
      gameState.player.collideWithZombie(zombie);
    }
  });
  
  // Remove dead zombies
  gameState.zombies = gameState.zombies.filter(z => z.health > 0);
  
  // Spawn new zombies
  if (gameState.zombies.length < MAX_ZOMBIES) {
    const spawnDistance = gameState.player.x + CANVAS_WIDTH + p.random(50, 200);
    const density = 1 + Math.floor(gameState.distance / 500);
    if (p.random() < 0.02 * density) {
      spawnZombie(p, spawnDistance);
    }
  }
  
  // Update particles
  gameState.particles.forEach(particle => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.1; // Gravity
    particle.life--;
  });
  gameState.particles = gameState.particles.filter(p => p.life > 0);
  
  // Log player position
  if (p.frameCount % 30 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.player.x - gameState.cameraX,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
  
  // Check game over conditions
  if (gameState.health <= 0) {
    endGame(p, false, "health");
  } else if (gameState.fuel <= 0 && gameState.player.vx < 0.5) {
    endGame(p, false, "fuel");
  } else if (gameState.distance >= CHECKPOINT_DISTANCE) {
    endGame(p, true, "checkpoint");
  }
}

function spawnZombie(p, x) {
  const zombie = new Zombie(p, x);
  gameState.zombies.push(zombie);
}

function endGame(p, isWin, reason) {
  // Calculate cash earned
  const earnedCash = Math.floor(gameState.distance * 0.5 + gameState.zombiesKilled * 10);
  gameState.cash += earnedCash;
  gameState.totalCash += earnedCash;
  
  // Set game phase
  gameState.gamePhase = isWin ? "GAME_OVER_WIN" : "GAME_OVER_LOSE";
  
  // Log game end
  p.logs.game_info.push({
    data: { 
      phase: gameState.gamePhase, 
      event: "game_ended",
      reason: reason,
      distance: gameState.distance,
      zombies_killed: gameState.zombiesKilled,
      cash_earned: earnedCash
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function resetToStart(p) {
  gameState.runStarted = false;
  gameState.upgradeShopOpen = true;
  
  p.logs.game_info.push({
    data: { phase: "START", event: "returned_to_start" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}