// automated_testing_controller.js - Automated testing logic

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let testState = {
  positionHistory: [],
  lastX: 0,
  lastY: 0,
  stuckCounter: 0,
  shootTimer: 0,
  dashTimer: 0,
  jumpTimer: 0,
  moveDirection: 1,
  strategyPhase: 'engage'
};

function isStuck(x, y) {
  const threshold = 5;
  const timePeriod = 60;
  
  testState.positionHistory.push({ x, y });
  if (testState.positionHistory.length > timePeriod) {
    testState.positionHistory.shift();
  }
  
  if (testState.positionHistory.length < timePeriod) return false;
  
  const oldPos = testState.positionHistory[0];
  const dist = Math.sqrt((x - oldPos.x) ** 2 + (y - oldPos.y) ** 2);
  
  return dist < threshold;
}

function getTestWinAction(gameState) {
  if (!gameState.player || !gameState.boss) {
    return { right: false, left: false, jump: false, shoot: false, dash: false };
  }
  
  const player = gameState.player;
  const boss = gameState.boss;
  const playerX = player.x + player.width / 2;
  const playerY = player.y + player.height / 2;
  const bossX = boss.x + boss.width / 2;
  const bossY = boss.y + boss.height / 2;
  
  // Update timers
  testState.shootTimer++;
  testState.dashTimer++;
  testState.jumpTimer++;
  
  const action = {
    left: false,
    right: false,
    jump: false,
    shoot: false,
    dash: false
  };
  
  // Always shoot when possible
  if (testState.shootTimer > 8) {
    action.shoot = true;
    testState.shootTimer = 0;
  }
  
  // Check for incoming projectiles nearby
  let nearestThreat = null;
  let minDist = Infinity;
  
  gameState.bossProjectiles.forEach(proj => {
    const dx = proj.x - playerX;
    const dy = proj.y - playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < minDist && dist < 150) {
      minDist = dist;
      nearestThreat = { x: proj.x, y: proj.y, dist };
    }
  });
  
  // Dodge logic
  if (nearestThreat && nearestThreat.dist < 80) {
    // Dash if available and threat is very close
    if (nearestThreat.dist < 50 && player.dashCooldown <= 0) {
      action.dash = true;
      testState.dashTimer = 0;
      // Dash away from threat
      if (nearestThreat.x < playerX) {
        action.right = true;
      } else {
        action.left = true;
      }
    } else {
      // Jump over threats
      if (player.onGround && testState.jumpTimer > 20) {
        action.jump = true;
        testState.jumpTimer = 0;
      }
      
      // Move perpendicular to threat
      if (nearestThreat.x < playerX - 30) {
        action.right = true;
      } else if (nearestThreat.x > playerX + 30) {
        action.left = true;
      }
    }
  } else {
    // Offensive positioning
    // Stay in middle-left area for good angle
    const idealX = CANVAS_WIDTH * 0.35;
    
    if (playerX < idealX - 40) {
      action.right = true;
    } else if (playerX > idealX + 40) {
      action.left = true;
    } else {
      // Weave left and right slightly
      if (gameState.frameCount % 60 < 30) {
        action.left = true;
      } else {
        action.right = true;
      }
    }
    
    // Occasional jumps to avoid ground-level attacks
    if (player.onGround && testState.jumpTimer > 40 && Math.random() < 0.3) {
      action.jump = true;
      testState.jumpTimer = 0;
    }
  }
  
  // Boundary avoidance
  if (playerX < 50) {
    action.right = true;
    action.left = false;
  } else if (playerX > CANVAS_WIDTH - 50) {
    action.left = true;
    action.right = false;
  }
  
  // Check if stuck
  if (isStuck(playerX, playerY)) {
    testState.stuckCounter++;
    if (testState.stuckCounter > 30) {
      // Try to get unstuck
      action.jump = true;
      action.right = !action.left;
      testState.stuckCounter = 0;
    }
  } else {
    testState.stuckCounter = 0;
  }
  
  return action;
}

function getBasicTestAction(gameState) {
  // Basic movement and shooting test
  if (!gameState.player) {
    return { right: false, left: false, jump: false, shoot: false, dash: false };
  }
  
  const player = gameState.player;
  const playerX = player.x + player.width / 2;
  
  const action = {
    left: false,
    right: false,
    jump: false,
    shoot: false,
    dash: false
  };
  
  // Move back and forth
  if (playerX < CANVAS_WIDTH * 0.3) {
    action.right = true;
    testState.moveDirection = 1;
  } else if (playerX > CANVAS_WIDTH * 0.7) {
    action.left = true;
    testState.moveDirection = -1;
  } else {
    if (testState.moveDirection > 0) {
      action.right = true;
    } else {
      action.left = true;
    }
  }
  
  // Jump periodically
  if (player.onGround && gameState.frameCount % 90 === 0) {
    action.jump = true;
  }
  
  // Shoot periodically
  if (gameState.frameCount % 15 === 0) {
    action.shoot = true;
  }
  
  return action;
}

function getDefensiveTestAction(gameState) {
  // Focus on dodging
  if (!gameState.player) {
    return { right: false, left: false, jump: false, shoot: false, dash: false };
  }
  
  const player = gameState.player;
  const playerX = player.x + player.width / 2;
  const playerY = player.y + player.height / 2;
  
  const action = {
    left: false,
    right: false,
    jump: false,
    shoot: false,
    dash: false
  };
  
  // Find nearest projectile
  let nearestProj = null;
  let minDist = Infinity;
  
  gameState.bossProjectiles.forEach(proj => {
    const dx = proj.x - playerX;
    const dy = proj.y - playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < minDist) {
      minDist = dist;
      nearestProj = proj;
    }
  });
  
  if (nearestProj && minDist < 100) {
    // Dodge
    if (minDist < 60 && player.dashCooldown <= 0) {
      action.dash = true;
      action.right = nearestProj.x < playerX;
      action.left = nearestProj.x > playerX;
    } else {
      action.left = nearestProj.x > playerX;
      action.right = nearestProj.x < playerX;
      
      if (player.onGround && minDist < 80) {
        action.jump = true;
      }
    }
  } else {
    // Move around
    action.right = gameState.frameCount % 120 < 60;
    action.left = !action.right;
  }
  
  // Occasional shooting
  if (gameState.frameCount % 30 === 0) {
    action.shoot = true;
  }
  
  return action;
}

function getLoseTestAction(gameState) {
  // Stand still to lose
  return {
    left: false,
    right: false,
    jump: false,
    shoot: false,
    dash: false
  };
}

function getRandomAction(gameState) {
  return {
    left: Math.random() < 0.3,
    right: Math.random() < 0.3,
    jump: Math.random() < 0.1,
    shoot: Math.random() < 0.5,
    dash: Math.random() < 0.05
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getDefensiveTestAction(gameState);
    case "TEST_4":
      return getLoseTestAction(gameState);
    case "TEST_5":
      return getRandomAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;