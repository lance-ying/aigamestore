// physics.js - Gravity gun and physics mechanics

import { gameState, GRAVITY_GUN_RANGE, GRAVITY_GUN_FORCE, ENERGY_DRAIN_RATE, ENERGY_RECHARGE_RATE, MAX_ENERGY } from './globals.js';

export function updateGravityGun(p) {
  if (!gameState.player || !gameState.gravityGunActive) {
    gameState.targetedObject = null;
    return;
  }

  // Find closest block within range
  let closest = null;
  let closestDist = GRAVITY_GUN_RANGE;

  for (let block of gameState.blocks) {
    let dx = (block.x + block.width / 2) - (gameState.player.x + gameState.player.width / 2);
    let dy = (block.y + block.height / 2) - (gameState.player.y + gameState.player.height / 2);
    let dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < closestDist) {
      closest = block;
      closestDist = dist;
    }
  }

  gameState.targetedObject = closest;

  if (closest && gameState.energy > 0) {
    let dx = (closest.x + closest.width / 2) - (gameState.player.x + gameState.player.width / 2);
    let dy = (closest.y + closest.height / 2) - (gameState.player.y + gameState.player.height / 2);
    let dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      let nx = dx / dist;
      let ny = dy / dist;

      let forceMagnitude = GRAVITY_GUN_FORCE * (1 - dist / GRAVITY_GUN_RANGE);

      if (gameState.gravityGunMode === "ATTRACT") {
        closest.applyForce(-nx * forceMagnitude, -ny * forceMagnitude);
      } else { // REPEL
        closest.applyForce(nx * forceMagnitude, ny * forceMagnitude);
      }

      // Drain energy
      gameState.energy -= ENERGY_DRAIN_RATE;
      if (gameState.energy < 0) gameState.energy = 0;
    }
  }
}

export function rechargeEnergy() {
  if (!gameState.gravityGunActive && gameState.energy < MAX_ENERGY) {
    gameState.energy += ENERGY_RECHARGE_RATE;
    if (gameState.energy > MAX_ENERGY) gameState.energy = MAX_ENERGY;
  }
}

export function checkCollisions() {
  if (!gameState.player) return;

  // Player vs Enemies
  for (let enemy of gameState.enemies) {
    if (!enemy.alive) continue;
    
    if (gameState.player.x + gameState.player.width > enemy.x &&
        gameState.player.x < enemy.x + enemy.width &&
        gameState.player.y + gameState.player.height > enemy.y &&
        gameState.player.y < enemy.y + enemy.height) {
      gameState.player.takeDamage();
      // Push player back
      gameState.player.vx = (gameState.player.x < enemy.x) ? -8 : 8;
      gameState.player.vy = -6;
    }
  }

  // Player vs Hazards
  for (let hazard of gameState.hazards) {
    if (gameState.player.x + gameState.player.width > hazard.x &&
        gameState.player.x < hazard.x + hazard.width &&
        gameState.player.y + gameState.player.height > hazard.y &&
        gameState.player.y < hazard.y + hazard.height) {
      gameState.player.takeDamage();
      gameState.player.vy = -10; // Bounce out
    }
  }

  // Blocks vs Enemies
  for (let block of gameState.blocks) {
    for (let enemy of gameState.enemies) {
      if (enemy.checkHit(block)) {
        gameState.score += 100;
      }
    }
  }

  // Blocks vs Blocks collision
  for (let i = 0; i < gameState.blocks.length; i++) {
    for (let j = i + 1; j < gameState.blocks.length; j++) {
      let b1 = gameState.blocks[i];
      let b2 = gameState.blocks[j];

      if (b1.x + b1.width > b2.x &&
          b1.x < b2.x + b2.width &&
          b1.y + b1.height > b2.y &&
          b1.y < b2.y + b2.height) {
        
        // Simple separation
        let dx = (b1.x + b1.width / 2) - (b2.x + b2.width / 2);
        let dy = (b1.y + b1.height / 2) - (b2.y + b2.height / 2);
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          let overlap = (b1.width + b2.width) / 2 - Math.abs(dx);
          let nx = dx / dist;
          let ny = dy / dist;
          
          b1.x += nx * overlap * 0.5;
          b2.x -= nx * overlap * 0.5;
          
          // Exchange some velocity
          let tempVx = b1.vx;
          b1.vx = b2.vx * 0.5;
          b2.vx = tempVx * 0.5;
        }
      }
    }
  }
}