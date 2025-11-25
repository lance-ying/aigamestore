import { gameState, GAME_AREA_X, GAME_AREA_WIDTH, CANVAS_HEIGHT } from './globals.js';

let previousPositions = [];
let stuckCounter = 0;
let dodgeDirection = 1;

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player) return {};
  
  const actions = {
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: true,
    slow: false,
    spell: false
  };
  
  // Track position for stuck detection
  previousPositions.push({ x: player.x, y: player.y });
  if (previousPositions.length > 60) {
    previousPositions.shift();
  }
  
  // Check if stuck
  if (previousPositions.length >= 60) {
    const recent = previousPositions.slice(-30);
    const variance = recent.reduce((sum, pos) => sum + Math.abs(pos.x - player.x), 0) / recent.length;
    if (variance < 5) {
      stuckCounter++;
      if (stuckCounter > 60) {
        dodgeDirection *= -1;
        stuckCounter = 0;
      }
    } else {
      stuckCounter = 0;
    }
  }
  
  // Priority 1: Stay near top to auto-collect items
  if (player.y > 70 && gameState.items.length > 3) {
    actions.up = true;
  }
  
  // Priority 2: Avoid enemy bullets
  let closestBullet = null;
  let closestDist = Infinity;
  
  for (let bullet of gameState.enemyBullets) {
    const dist = Math.sqrt((bullet.x - player.x) ** 2 + (bullet.y - player.y) ** 2);
    if (dist < closestDist && dist < 80) {
      closestDist = dist;
      closestBullet = bullet;
    }
  }
  
  if (closestBullet && closestDist < 40) {
    actions.slow = true;
    
    // Use spell card if in immediate danger
    if (closestDist < 20 && gameState.spellCards > 0) {
      actions.spell = true;
    }
    
    // Dodge perpendicular to bullet trajectory
    const dx = closestBullet.x - player.x;
    const dy = closestBullet.y - player.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dy > 0) {
        actions.up = true;
      } else {
        actions.down = true;
      }
    } else {
      if (dx > 0) {
        actions.left = true;
      } else {
        actions.right = true;
      }
    }
  } else {
    // Priority 3: Target enemies and UFOs
    let target = null;
    let targetDist = Infinity;
    
    // Prioritize UFOs
    for (let ufo of gameState.ufos) {
      const dist = Math.sqrt((ufo.x - player.x) ** 2 + (ufo.y - player.y) ** 2);
      if (dist < targetDist) {
        targetDist = dist;
        target = ufo;
      }
    }
    
    // Then enemies
    if (!target) {
      for (let enemy of gameState.enemies) {
        const dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
        if (dist < targetDist) {
          targetDist = dist;
          target = enemy;
        }
      }
    }
    
    if (target) {
      // Move to align with target
      if (Math.abs(target.x - player.x) > 20) {
        if (target.x > player.x) {
          actions.right = true;
        } else {
          actions.left = true;
        }
      }
      
      // Maintain optimal distance
      if (target.y - player.y > 100) {
        actions.up = true;
      } else if (target.y - player.y < 50) {
        actions.down = true;
      }
    }
  }
  
  // Priority 4: Collect Venturer items strategically
  const needsRed = gameState.venturer.red < gameState.venturerMax;
  const needsBlue = gameState.venturer.blue < gameState.venturerMax;
  const needsGreen = gameState.venturer.green < gameState.venturerMax;
  
  if (needsRed || needsBlue || needsGreen) {
    let closestVenturer = null;
    let closestVenturerDist = Infinity;
    
    for (let item of gameState.items) {
      if (item.type === 'venturer') {
        const needed = (item.color === 'red' && needsRed) ||
                      (item.color === 'blue' && needsBlue) ||
                      (item.color === 'green' && needsGreen);
        
        if (needed || item.color === 'random') {
          const dist = Math.sqrt((item.x - player.x) ** 2 + (item.y - player.y) ** 2);
          if (dist < closestVenturerDist) {
            closestVenturerDist = dist;
            closestVenturer = item;
          }
        }
      }
    }
    
    if (closestVenturer && closestVenturerDist < 150 && !closestBullet) {
      if (closestVenturer.x > player.x) {
        actions.right = true;
      } else {
        actions.left = true;
      }
      if (closestVenturer.y > player.y) {
        actions.down = true;
      } else {
        actions.up = true;
      }
      actions.slow = true;
    }
  }
  
  // Boundary avoidance
  if (player.x < GAME_AREA_X + 30) {
    actions.right = true;
    actions.left = false;
  }
  if (player.x > GAME_AREA_X + GAME_AREA_WIDTH - 30) {
    actions.left = true;
    actions.right = false;
  }
  if (player.y < 30) {
    actions.down = true;
    actions.up = false;
  }
  if (player.y > CANVAS_HEIGHT - 30) {
    actions.up = true;
    actions.down = false;
  }
  
  return actions;
}

function getBasicTestAction(gameState) {
  const player = gameState.player;
  if (!player) return {};
  
  const actions = {
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: true,
    slow: false,
    spell: false
  };
  
  // Simple pattern: move in circles while shooting
  const time = gameState.frameCount * 0.02;
  const centerX = GAME_AREA_X + GAME_AREA_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;
  const radius = 80;
  
  const targetX = centerX + Math.cos(time) * radius;
  const targetY = centerY + Math.sin(time) * radius;
  
  if (Math.abs(targetX - player.x) > 5) {
    if (targetX > player.x) {
      actions.right = true;
    } else {
      actions.left = true;
    }
  }
  
  if (Math.abs(targetY - player.y) > 5) {
    if (targetY > player.y) {
      actions.down = true;
    } else {
      actions.up = true;
    }
  }
  
  // Collect items when nearby
  for (let item of gameState.items) {
    const dist = Math.sqrt((item.x - player.x) ** 2 + (item.y - player.y) ** 2);
    if (dist < 50) {
      actions.slow = true;
      break;
    }
  }
  
  return actions;
}

function getUFOTestAction(gameState) {
  const player = gameState.player;
  if (!player) return {};
  
  const actions = {
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: true,
    slow: true,
    spell: false
  };
  
  // Focus on collecting specific color Venturer items
  const targetColor = gameState.frameCount % 300 < 100 ? 'red' :
                     gameState.frameCount % 300 < 200 ? 'blue' : 'green';
  
  let closestVenturer = null;
  let closestDist = Infinity;
  
  for (let item of gameState.items) {
    if (item.type === 'venturer' && (item.color === targetColor || item.color === 'random')) {
      const dist = Math.sqrt((item.x - player.x) ** 2 + (item.y - player.y) ** 2);
      if (dist < closestDist) {
        closestDist = dist;
        closestVenturer = item;
      }
    }
  }
  
  if (closestVenturer) {
    if (closestVenturer.x > player.x) actions.right = true;
    if (closestVenturer.x < player.x) actions.left = true;
    if (closestVenturer.y > player.y) actions.down = true;
    if (closestVenturer.y < player.y) actions.up = true;
  }
  
  // Attack UFOs when they appear
  for (let ufo of gameState.ufos) {
    if (Math.abs(ufo.x - player.x) > 20) {
      if (ufo.x > player.x) actions.right = true;
      else actions.left = true;
    }
  }
  
  return actions;
}

function getSpellCardTestAction(gameState) {
  const player = gameState.player;
  if (!player) return {};
  
  const actions = {
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: true,
    slow: false,
    spell: false
  };
  
  // Move aggressively into danger zones
  let closestBullet = null;
  let closestDist = Infinity;
  
  for (let bullet of gameState.enemyBullets) {
    const dist = Math.sqrt((bullet.x - player.x) ** 2 + (bullet.y - player.y) ** 2);
    if (dist < closestDist) {
      closestDist = dist;
      closestBullet = bullet;
    }
  }
  
  // Use spell card when surrounded
  if (gameState.enemyBullets.length > 20 && gameState.spellCards > 0) {
    actions.spell = true;
  }
  
  // Move towards enemies
  if (gameState.enemies.length > 0) {
    const enemy = gameState.enemies[0];
    if (Math.abs(enemy.x - player.x) > 10) {
      if (enemy.x > player.x) actions.right = true;
      else actions.left = true;
    }
    if (enemy.y > player.y) actions.down = true;
  }
  
  return actions;
}

function getRandomAction(gameState) {
  return {
    left: Math.random() < 0.3,
    right: Math.random() < 0.3,
    up: Math.random() < 0.3,
    down: Math.random() < 0.3,
    shoot: Math.random() < 0.8,
    slow: Math.random() < 0.2,
    spell: Math.random() < 0.01 && gameState.spellCards > 0
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getUFOTestAction(gameState);
    case "TEST_4":
      return getSpellCardTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;