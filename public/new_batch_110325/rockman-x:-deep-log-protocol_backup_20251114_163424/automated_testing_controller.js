import { gameState } from './globals.js';

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player) return {};
  
  const actions = {};
  
  // Always move right to progress through stage
  actions.right = true;
  
  // Jump over gaps and to reach platforms
  const needsJump = player.y > 350 || // On ground, jump to reach platforms
                    (player.x > 380 && player.x < 420 && player.y > 300) || // Jump to first platform
                    (player.x > 580 && player.x < 620 && player.y > 240) || // Jump to second platform
                    (player.x > 1520 && player.x < 1570); // Jump gap
  
  if (needsJump && player.onGround) {
    actions.jump = true;
  }
  
  // Double jump for high platforms
  if (player.x > 1680 && player.x < 1720 && !player.onGround && player.jumpsLeft > 0) {
    actions.jump = true;
  }
  
  // Shoot at enemies
  if (gameState.enemies.length > 0 || gameState.boss) {
    actions.shoot = true;
  }
  
  // Aim up when enemies are above
  const enemiesAbove = gameState.enemies.some(e => 
    e.active && Math.abs(e.x - player.x) < 150 && e.y < player.y - 50
  );
  if (enemiesAbove) {
    actions.aimUp = true;
  }
  
  // Dodge enemy projectiles with dash
  const dangerousProjectile = gameState.projectiles.some(proj => 
    proj.owner !== 'player' && 
    Math.abs(proj.x - player.x) < 80 && 
    Math.abs(proj.y - player.y) < 50
  );
  
  if (dangerousProjectile && player.energy >= player.dashCost) {
    actions.dash = true;
  }
  
  // Collect pickups when low on resources
  if (player.health < player.maxHealth * 0.6) {
    const nearbyHealth = gameState.collectibles.find(c => 
      c.active && c.type === 'health' && Math.abs(c.x - player.x) < 100
    );
    if (nearbyHealth && nearbyHealth.x < player.x) {
      actions.right = false;
      actions.left = true;
    }
  }
  
  return actions;
}

function getBasicTestAction(gameState) {
  const player = gameState.player;
  if (!player) return {};
  
  const actions = {};
  
  // Simple movement pattern: move right and jump occasionally
  if (Math.random() < 0.7) {
    actions.right = true;
  } else {
    actions.left = true;
  }
  
  if (Math.random() < 0.1 && player.onGround) {
    actions.jump = true;
  }
  
  if (Math.random() < 0.3) {
    actions.shoot = true;
  }
  
  return actions;
}

function getCombatTestAction(gameState) {
  const player = gameState.player;
  if (!player) return {};
  
  const actions = {};
  
  // Focus on combat
  const nearestEnemy = gameState.enemies
    .filter(e => e.active)
    .sort((a, b) => Math.abs(a.x - player.x) - Math.abs(b.x - player.x))[0];
  
  if (nearestEnemy) {
    if (nearestEnemy.x > player.x) {
      actions.right = true;
    } else {
      actions.left = true;
    }
    
    actions.shoot = true;
    
    if (nearestEnemy.y < player.y - 30) {
      actions.aimUp = true;
    }
  }
  
  return actions;
}

function getMovementTestAction(gameState) {
  const player = gameState.player;
  if (!player) return {};
  
  const actions = {};
  const time = Date.now() / 1000;
  
  // Test all movement capabilities
  if (Math.sin(time * 2) > 0) {
    actions.right = true;
  } else {
    actions.left = true;
  }
  
  if (Math.sin(time * 3) > 0.5 && player.onGround) {
    actions.jump = true;
  }
  
  if (Math.sin(time * 1.5) > 0.7 && player.energy >= player.dashCost) {
    actions.dash = true;
  }
  
  return actions;
}

function getSurvivalTestAction(gameState) {
  const player = gameState.player;
  if (!player) return {};
  
  const actions = {};
  
  // Prioritize survival over progress
  const nearbyEnemies = gameState.enemies.filter(e => 
    e.active && Math.abs(e.x - player.x) < 200
  );
  
  if (nearbyEnemies.length > 0) {
    const closestEnemy = nearbyEnemies.sort((a, b) => 
      Math.abs(a.x - player.x) - Math.abs(b.x - player.x)
    )[0];
    
    // Keep distance
    if (Math.abs(closestEnemy.x - player.x) < 100) {
      if (closestEnemy.x > player.x) {
        actions.left = true;
      } else {
        actions.right = true;
      }
      
      if (player.energy >= player.dashCost) {
        actions.dash = true;
      }
    }
    
    actions.shoot = true;
  } else {
    actions.right = true;
  }
  
  // Jump to avoid ground hazards
  if (Math.random() < 0.15 && player.onGround) {
    actions.jump = true;
  }
  
  return actions;
}

function getRandomAction(gameState) {
  const player = gameState.player;
  if (!player) return {};
  
  const actions = {};
  
  if (Math.random() < 0.5) actions.right = true;
  if (Math.random() < 0.3) actions.left = true;
  if (Math.random() < 0.2) actions.jump = true;
  if (Math.random() < 0.3) actions.shoot = true;
  if (Math.random() < 0.1) actions.dash = true;
  
  return actions;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getCombatTestAction(gameState);
    case "TEST_4":
      return getMovementTestAction(gameState);
    case "TEST_5":
      return getSurvivalTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;