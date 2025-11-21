// game_logic.js - Core game logic and state management

import { gameState, PHASES, TURN_PHASES, WEAPON_TYPES } from './globals.js';
import { Worm } from './worm.js';
import { Projectile } from './weapons.js';

export function initializeGame(p) {
  // Reset game state
  gameState.score = 0;
  gameState.entities = [];
  gameState.projectiles = [];
  gameState.explosions = [];
  gameState.particles = [];
  gameState.playerWorms = [];
  gameState.enemyWorms = [];
  gameState.currentTeam = 0;
  gameState.currentWormIndex = 0;
  gameState.turnPhase = TURN_PHASES.MOVEMENT;
  gameState.movementTimer = 0;
  gameState.attackTimer = 0;
  gameState.currentMovement = 0;
  gameState.aimAngle = -45;
  gameState.aimPower = 50;
  gameState.selectedWeapon = WEAPON_TYPES.BAZOOKA;
  gameState.missionComplete = false;
  
  // Create player worms
  const playerPositions = [
    { x: 100, y: 200 },
    { x: 150, y: 200 },
    { x: 200, y: 200 }
  ];
  
  for (const pos of playerPositions) {
    const worm = new Worm(p, pos.x, pos.y, 0);
    gameState.playerWorms.push(worm);
    gameState.entities.push(worm);
  }
  
  // Create enemy worms
  const enemyPositions = [
    { x: 500, y: 200 },
    { x: 450, y: 200 },
    { x: 400, y: 200 }
  ];
  
  for (const pos of enemyPositions) {
    const worm = new Worm(p, pos.x, pos.y, 1);
    gameState.enemyWorms.push(worm);
    gameState.entities.push(worm);
  }
  
  // Set first active worm
  setActiveWorm();
  
  // Set player reference for logging
  gameState.player = gameState.playerWorms[0];
}

export function setActiveWorm() {
  // Deactivate all worms
  for (const worm of gameState.entities) {
    worm.isActive = false;
  }
  
  // Get current team worms
  const teamWorms = gameState.currentTeam === 0 ? gameState.playerWorms : gameState.enemyWorms;
  const aliveWorms = teamWorms.filter(w => !w.isDead);
  
  if (aliveWorms.length === 0) return;
  
  // Find next alive worm
  let attempts = 0;
  while (attempts < teamWorms.length) {
    if (gameState.currentWormIndex >= teamWorms.length) {
      gameState.currentWormIndex = 0;
    }
    
    const worm = teamWorms[gameState.currentWormIndex];
    if (!worm.isDead) {
      worm.isActive = true;
      gameState.player = worm; // Update player reference for logging
      break;
    }
    
    gameState.currentWormIndex++;
    attempts++;
  }
}

export function switchTurn(p) {
  gameState.turnPhase = TURN_PHASES.SWITCHING;
  gameState.attackTimer = 60; // Delay before next turn
  
  // Check win/lose conditions
  const alivePlayerWorms = gameState.playerWorms.filter(w => !w.isDead).length;
  const aliveEnemyWorms = gameState.enemyWorms.filter(w => !w.isDead).length;
  
  if (aliveEnemyWorms === 0) {
    gameState.gamePhase = PHASES.GAME_OVER_WIN;
    gameState.winCoins = 100 + gameState.score;
    gameState.winXP = 50 + Math.floor(gameState.score / 10);
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (alivePlayerWorms === 0) {
    gameState.gamePhase = PHASES.GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Switch to next team
  gameState.currentTeam = gameState.currentTeam === 0 ? 1 : 0;
  gameState.currentWormIndex = 0;
  gameState.currentMovement = 0;
  gameState.aimAngle = -45;
  gameState.aimPower = 50;
  
  setActiveWorm();
}

export function updateGameLogic(p) {
  // Update all worms
  for (const worm of gameState.entities) {
    worm.update(gameState.terrain);
  }
  
  // Update projectiles
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const projectile = gameState.projectiles[i];
    const shouldRemove = projectile.update(gameState.terrain);
    if (shouldRemove || !projectile.active) {
      gameState.projectiles.splice(i, 1);
    }
  }
  
  // Update explosions
  for (let i = gameState.explosions.length - 1; i >= 0; i--) {
    const explosion = gameState.explosions[i];
    const finished = explosion.update();
    if (finished) {
      gameState.explosions.splice(i, 1);
    }
  }
  
  // Update particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    const finished = particle.update();
    if (finished) {
      gameState.particles.splice(i, 1);
    }
  }
  
  // Handle turn phases
  handleTurnPhases(p);
}

function handleTurnPhases(p) {
  switch (gameState.turnPhase) {
    case TURN_PHASES.MOVEMENT:
      gameState.movementTimer++;
      
      // Auto-advance after time limit or movement limit
      if (gameState.movementTimer > 300 || gameState.currentMovement >= gameState.movementLimit) {
        gameState.turnPhase = TURN_PHASES.ATTACK;
        gameState.attackTimer = 0;
      }
      break;
      
    case TURN_PHASES.ATTACK:
      gameState.attackTimer++;
      
      // Auto-advance after time limit
      if (gameState.attackTimer > 400) {
        switchTurn(p);
      }
      break;
      
    case TURN_PHASES.FIRING:
      // Wait for projectiles to finish
      if (gameState.projectiles.length === 0 && gameState.explosions.length === 0) {
        gameState.attackTimer++;
        if (gameState.attackTimer > 30) {
          switchTurn(p);
        }
      } else {
        gameState.attackTimer = 0;
      }
      break;
      
    case TURN_PHASES.SWITCHING:
      gameState.attackTimer--;
      if (gameState.attackTimer <= 0) {
        gameState.turnPhase = TURN_PHASES.MOVEMENT;
        gameState.movementTimer = 0;
      }
      break;
  }
}

export function fireWeapon(p) {
  if (gameState.turnPhase !== TURN_PHASES.ATTACK) return;
  
  const activeWorm = gameState.entities.find(w => w.isActive);
  if (!activeWorm || activeWorm.isDead) return;
  
  const angleRad = (gameState.aimAngle * Math.PI) / 180;
  const powerScale = gameState.aimPower / 100;
  const baseSpeed = 8;
  const speed = baseSpeed * powerScale;
  
  const vx = Math.cos(angleRad) * speed;
  const vy = Math.sin(angleRad) * speed;
  
  // Handle shotgun differently (multiple projectiles)
  if (gameState.selectedWeapon === WEAPON_TYPES.SHOTGUN) {
    for (let i = -2; i <= 2; i++) {
      const spreadAngle = angleRad + (i * 0.15);
      const spreadVx = Math.cos(spreadAngle) * speed;
      const spreadVy = Math.sin(spreadAngle) * speed;
      const projectile = new Projectile(
        p,
        activeWorm.x,
        activeWorm.y,
        spreadVx,
        spreadVy,
        gameState.selectedWeapon
      );
      gameState.projectiles.push(projectile);
    }
  } else {
    const projectile = new Projectile(
      p,
      activeWorm.x,
      activeWorm.y,
      vx,
      vy,
      gameState.selectedWeapon
    );
    gameState.projectiles.push(projectile);
  }
  
  gameState.turnPhase = TURN_PHASES.FIRING;
  gameState.attackTimer = 0;
  gameState.score += 10;
}

export function cycleWeapon() {
  const weapons = [WEAPON_TYPES.BAZOOKA, WEAPON_TYPES.GRENADE, WEAPON_TYPES.SHOTGUN];
  const currentIndex = weapons.indexOf(gameState.selectedWeapon);
  const nextIndex = (currentIndex + 1) % weapons.length;
  gameState.selectedWeapon = weapons[nextIndex];
}