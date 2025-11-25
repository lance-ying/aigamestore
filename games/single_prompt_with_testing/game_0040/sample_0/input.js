// input.js - Input handling for human and automated testing
import { gameState, PHASE, HAT_TYPE } from './globals.js';

export function handleHumanInput(p) {
  const player = gameState.player;
  if (!player) return;

  // Movement
  if (p.keyIsDown(37)) { // LEFT
    const sprint = gameState.currentHat === HAT_TYPE.SPRINT && p.keyIsDown(16);
    player.moveLeft(sprint);
  } else if (p.keyIsDown(39)) { // RIGHT
    const sprint = gameState.currentHat === HAT_TYPE.SPRINT && p.keyIsDown(16);
    player.moveRight(sprint);
  } else {
    // Decelerate when no key pressed
    if (!player.climbing) {
      player.vx *= 0.85;
    }
  }

  // Ladder climbing
  if (p.keyIsDown(38)) { // UP
    player.climbUp();
  } else if (p.keyIsDown(40)) { // DOWN
    player.climbDown();
  } else {
    if (player.climbing && player.onLadder) {
      player.vy = 0;
    }
  }
}

export function handleAutomatedInput(p, action) {
  const player = gameState.player;
  if (!player) return;

  // Reset velocities for automated control
  if (!player.climbing && !action.up && !action.down) {
    player.vx *= 0.85;
  }

  // Apply actions
  if (action.left) {
    player.moveLeft(action.sprint);
  } else if (action.right) {
    player.moveRight(action.sprint);
  }

  if (action.jump) {
    player.jump();
  }

  if (action.up) {
    player.climbUp();
  } else if (action.down) {
    player.climbDown();
  }

  if (action.ability) {
    useHatAbility(p);
  }
}

export function useHatAbility(p) {
  const player = gameState.player;
  
  if (gameState.currentHat === HAT_TYPE.BREWING) {
    // Create explosion
    const explosion = new (require('./entities.js').Explosion)(
      player.x + player.width / 2,
      player.y + player.height / 2,
      60,
      p
    );
    gameState.explosions.push(explosion);
  } else if (gameState.currentHat === HAT_TYPE.DIMENSION) {
    // Activate dimension vision
    gameState.dimensionActive = true;
    gameState.dimensionTimer = 180; // 3 seconds
  }
}

// Import Explosion dynamically to avoid circular dependency
import { Explosion } from './entities.js';

export function useHatAbilityFixed(p) {
  const player = gameState.player;
  
  if (gameState.currentHat === HAT_TYPE.BREWING) {
    const explosion = new Explosion(
      player.x + player.width / 2,
      player.y + player.height / 2,
      60,
      p
    );
    gameState.explosions.push(explosion);
  } else if (gameState.currentHat === HAT_TYPE.DIMENSION) {
    gameState.dimensionActive = true;
    gameState.dimensionTimer = 180;
  }
}