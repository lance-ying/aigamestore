// automated_testing_controller.js
import { gameState } from './globals.js';

function getTestBasicAction(gs) {
  // Test basic movement
  const frame = gs.player ? Math.floor(Date.now() / 100) % 8 : 0;
  
  switch(frame) {
    case 0:
    case 1:
      return { key: 'ArrowRight', keyCode: 39 };
    case 2:
    case 3:
      return { key: 'ArrowDown', keyCode: 40 };
    case 4:
    case 5:
      return { key: 'ArrowLeft', keyCode: 37 };
    case 6:
    case 7:
      return { key: 'ArrowUp', keyCode: 38 };
  }
  return null;
}

function getTestWinAction(gs) {
  if (!gs.player || !gs.player.isAlive) return null;

  const player = gs.player;
  const enemies = gs.enemies.filter(e => e.isAlive);

  if (enemies.length === 0) {
    // No enemies, explore to trigger next floor
    if (Math.abs(player.x - 1500) < 50 && Math.abs(player.y - 600) < 50) {
      return { key: 'ArrowRight', keyCode: 39 };
    }
    const dx = 1500 - player.x;
    const dy = 600 - player.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
    } else {
      return dy > 0 ? { key: 'ArrowDown', keyCode: 40 } : { key: 'ArrowUp', keyCode: 38 };
    }
  }

  // Find nearest enemy
  let nearestEnemy = null;
  let minDist = Infinity;
  for (let enemy of enemies) {
    const dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
    if (dist < minDist) {
      minDist = dist;
      nearestEnemy = enemy;
    }
  }

  if (!nearestEnemy) return null;

  const dx = nearestEnemy.x - player.x;
  const dy = nearestEnemy.y - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // If close enough, attack
  if (dist < 25) {
    return { key: ' ', keyCode: 32 }; // Melee
  } else if (dist < 150 && player.ammo > 0) {
    // Face enemy and shoot
    const angle = Math.atan2(dy, dx);
    player.direction = angle;
    
    if (Math.random() < 0.3) {
      return { key: 'z', keyCode: 90 }; // Shoot
    }
  }

  // Move towards enemy
  const moveThreshold = 0.3;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > moveThreshold) {
      return { key: 'ArrowRight', keyCode: 39 };
    } else if (dx < -moveThreshold) {
      return { key: 'ArrowLeft', keyCode: 37 };
    }
  } else {
    if (dy > moveThreshold) {
      return { key: 'ArrowDown', keyCode: 40 };
    } else if (dy < -moveThreshold) {
      return { key: 'ArrowUp', keyCode: 38 };
    }
  }

  return null;
}

function getTestCombatAction(gs) {
  if (!gs.player || !gs.player.isAlive) return null;

  const player = gs.player;
  const enemies = gs.enemies.filter(e => e.isAlive);

  if (enemies.length === 0) return { key: 'ArrowRight', keyCode: 39 };

  const nearestEnemy = enemies[0];
  const dx = nearestEnemy.x - player.x;
  const dy = nearestEnemy.y - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 30) {
    return { key: ' ', keyCode: 32 };
  } else if (dist < 200 && player.ammo > 0 && Math.random() < 0.2) {
    return { key: 'z', keyCode: 90 };
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
  } else {
    return dy > 0 ? { key: 'ArrowDown', keyCode: 40 } : { key: 'ArrowUp', keyCode: 38 };
  }
}

function getRandomAction(gs) {
  const actions = [
    { key: 'ArrowUp', keyCode: 38 },
    { key: 'ArrowDown', keyCode: 40 },
    { key: 'ArrowLeft', keyCode: 37 },
    { key: 'ArrowRight', keyCode: 39 },
    { key: ' ', keyCode: 32 },
    { key: 'z', keyCode: 90 }
  ];
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gs) {
  switch (gs.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gs);
    case "TEST_2":
      return getTestWinAction(gs);
    case "TEST_3":
      return getTestCombatAction(gs);
    default:
      return getRandomAction(gs);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;