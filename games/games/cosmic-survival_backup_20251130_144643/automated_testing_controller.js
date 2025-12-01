// automated_testing_controller.js - Automated testing
import { 
  PHASE_PLAYING, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  CANVAS_WIDTH, CANVAS_HEIGHT
} from './globals.js';

function getTestWinAction(gameState) {
  if (!gameState.player || gameState.gamePhase !== PHASE_PLAYING) {
    return { moveX: 0, moveY: 0, fire: false, special: false };
  }

  const action = {
    moveX: 0,
    moveY: 0,
    fire: true, // Always firing
    special: false
  };

  // Choose upgrade during level up
  if (gameState.showingUpgradeScreen && gameState.upgradeChoices.length > 0) {
    // Prioritize damage and survivability upgrades
    const damageUpgrade = gameState.upgradeChoices.find(u => 
      u.type === 'damage' || u.type === 'fire_rate' || u.type === 'multishot'
    );
    if (damageUpgrade) {
      const index = gameState.upgradeChoices.indexOf(damageUpgrade);
      // This will be handled by keyPressed event simulation
      return { moveX: 0, moveY: 0, fire: false, special: false, upgradeChoice: index };
    }
  }

  const player = gameState.player;

  // Find closest enemy
  let closestEnemy = null;
  let closestDist = Infinity;

  for (let enemy of gameState.enemies) {
    const dist = Math.sqrt(
      Math.pow(enemy.x - player.x, 2) + 
      Math.pow(enemy.y - player.y, 2)
    );
    if (dist < closestDist) {
      closestDist = dist;
      closestEnemy = enemy;
    }
  }

  if (closestEnemy) {
    // Kiting strategy: maintain optimal distance
    const optimalDistance = 150;
    const dx = closestEnemy.x - player.x;
    const dy = closestEnemy.y - player.y;
    
    if (closestDist < optimalDistance - 20) {
      // Too close, move away
      action.moveX = dx < 0 ? 1 : -1;
      action.moveY = dy < 0 ? 1 : -1;
    } else if (closestDist > optimalDistance + 20) {
      // Too far, move closer
      action.moveX = dx > 0 ? 1 : -1;
      action.moveY = dy > 0 ? 1 : -1;
    } else {
      // Circle strafe
      action.moveX = -dy / closestDist;
      action.moveY = dx / closestDist;
    }

    // Aim at closest enemy
    player.facingAngle = Math.atan2(dy, dx);
  } else {
    // No enemies, move to center
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const dx = centerX - player.x;
    const dy = centerY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 50) {
      action.moveX = dx / dist;
      action.moveY = dy / dist;
    }
  }

  // Stay away from edges
  const edgeMargin = 80;
  if (player.x < edgeMargin) action.moveX = 1;
  if (player.x > CANVAS_WIDTH - edgeMargin) action.moveX = -1;
  if (player.y < edgeMargin) action.moveY = 1;
  if (player.y > CANVAS_HEIGHT - edgeMargin) action.moveY = -1;

  // Collect XP orbs if close and safe
  if (gameState.xpOrbs.length > 0 && closestDist > 100) {
    let closestOrb = null;
    let closestOrbDist = Infinity;
    
    for (let orb of gameState.xpOrbs) {
      const dist = Math.sqrt(
        Math.pow(orb.x - player.x, 2) + 
        Math.pow(orb.y - player.y, 2)
      );
      if (dist < closestOrbDist) {
        closestOrbDist = dist;
        closestOrb = orb;
      }
    }

    if (closestOrb && closestOrbDist < 150) {
      const dx = closestOrb.x - player.x;
      const dy = closestOrb.y - player.y;
      action.moveX = dx / closestOrbDist;
      action.moveY = dy / closestOrbDist;
    }
  }

  return action;
}

function getBasicTestAction(gameState) {
  if (!gameState.player || gameState.gamePhase !== PHASE_PLAYING) {
    return { moveX: 0, moveY: 0, fire: false, special: false };
  }

  const action = {
    moveX: 0,
    moveY: 0,
    fire: true,
    special: false
  };

  // Simple circular movement pattern
  const time = Date.now() / 1000;
  const radius = 100;
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;
  
  const targetX = centerX + Math.cos(time) * radius;
  const targetY = centerY + Math.sin(time) * radius;
  
  const dx = targetX - gameState.player.x;
  const dy = targetY - gameState.player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist > 10) {
    action.moveX = dx / dist;
    action.moveY = dy / dist;
  }

  // Face nearest enemy
  if (gameState.enemies.length > 0) {
    const enemy = gameState.enemies[0];
    const ex = enemy.x - gameState.player.x;
    const ey = enemy.y - gameState.player.y;
    gameState.player.facingAngle = Math.atan2(ey, ex);
  }

  return action;
}

function getUpgradeTestAction(gameState) {
  // Similar to win test but focuses on getting upgrades quickly
  const action = getTestWinAction(gameState);
  
  // Aggressively collect XP
  if (gameState.xpOrbs.length > 0 && gameState.enemies.length < 10) {
    let closestOrb = null;
    let closestOrbDist = Infinity;
    
    for (let orb of gameState.xpOrbs) {
      const dist = Math.sqrt(
        Math.pow(orb.x - gameState.player.x, 2) + 
        Math.pow(orb.y - gameState.player.y, 2)
      );
      if (dist < closestOrbDist) {
        closestOrbDist = dist;
        closestOrb = orb;
      }
    }

    if (closestOrb) {
      const dx = closestOrb.x - gameState.player.x;
      const dy = closestOrb.y - gameState.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      action.moveX = dx / dist;
      action.moveY = dy / dist;
    }
  }

  return action;
}

function getRandomAction(gameState) {
  return {
    moveX: Math.random() * 2 - 1,
    moveY: Math.random() * 2 - 1,
    fire: Math.random() > 0.5,
    special: false
  };
}

export function get_automated_testing_action(gameState) {
  // Auto-select upgrades during level up
  if (gameState.showingUpgradeScreen && gameState.upgradeChoices.length > 0) {
    // Simulate pressing '1' for first upgrade
    setTimeout(() => {
      const event = new KeyboardEvent('keydown', { keyCode: 49, key: '1' });
      document.dispatchEvent(event);
    }, 100);
  }

  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getUpgradeTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;