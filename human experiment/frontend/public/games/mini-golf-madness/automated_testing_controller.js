// automated_testing_controller.js - Automated testing logic

function getTestBasicAction(gameState) {
  if (!gameState.ball || !gameState.canShoot) return null;
  
  const currentHole = gameState.holes[gameState.currentHole];
  if (!currentHole) return null;
  
  // Calculate angle to hole
  const dx = currentHole.x - gameState.ball.x;
  const dy = currentHole.y - gameState.ball.y;
  const angleToHole = Math.atan2(dy, dx);
  
  // Adjust aim towards hole
  const angleDiff = angleToHole - gameState.aimAngle;
  
  // Normalize angle difference to -PI to PI
  let normalizedDiff = angleDiff;
  while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
  while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
  
  // If aim is close enough, shoot
  if (Math.abs(normalizedDiff) < 0.1) {
    return { keyCode: 32 }; // Space to shoot
  }
  
  // Otherwise, adjust aim
  if (normalizedDiff > 0) {
    return { keyCode: 39 }; // Right arrow
  } else {
    return { keyCode: 37 }; // Left arrow
  }
}

function getTestWinAction(gameState) {
  if (!gameState.ball || !gameState.canShoot) return null;
  
  const currentHole = gameState.holes[gameState.currentHole];
  if (!currentHole) return null;
  
  // Calculate optimal angle and power
  const dx = currentHole.x - gameState.ball.x;
  const dy = currentHole.y - gameState.ball.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angleToHole = Math.atan2(dy, dx);
  
  // Check for obstacles in the way (only current hole's walls)
  let hasObstacle = false;
  for (const wall of currentHole.walls) {
    // Simple line-rectangle intersection check
    if (lineIntersectsRect(
      gameState.ball.x, gameState.ball.y,
      currentHole.x, currentHole.y,
      wall.x, wall.y, wall.width, wall.height
    )) {
      hasObstacle = true;
      break;
    }
  }
  
  // If there's an obstacle, aim around it
  let targetAngle = angleToHole;
  if (hasObstacle) {
    // Try different angles to find clear path
    for (let offset = 0.2; offset < Math.PI; offset += 0.2) {
      let clearPath = true;
      const testAngle1 = angleToHole + offset;
      const testAngle2 = angleToHole - offset;
      
      for (const wall of currentHole.walls) {
        if (!lineIntersectsRect(
          gameState.ball.x, gameState.ball.y,
          gameState.ball.x + Math.cos(testAngle1) * 100,
          gameState.ball.y + Math.sin(testAngle1) * 100,
          wall.x, wall.y, wall.width, wall.height
        )) {
          targetAngle = testAngle1;
          clearPath = true;
          break;
        }
        if (!lineIntersectsRect(
          gameState.ball.x, gameState.ball.y,
          gameState.ball.x + Math.cos(testAngle2) * 100,
          gameState.ball.y + Math.sin(testAngle2) * 100,
          wall.x, wall.y, wall.width, wall.height
        )) {
          targetAngle = testAngle2;
          clearPath = true;
          break;
        }
      }
      
      if (clearPath) break;
    }
  }
  
  // Adjust aim towards target angle
  const angleDiff = targetAngle - gameState.aimAngle;
  let normalizedDiff = angleDiff;
  while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
  while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
  
  // If aim is close enough and power is sufficient, shoot
  if (Math.abs(normalizedDiff) < 0.05) {
    // Calculate required power based on distance
    const requiredPower = Math.min(20, distance * 0.15);
    
    if (gameState.isCharging && gameState.power >= requiredPower) {
      // Power is good, release to shoot
      return null; // Will auto-release on keyReleased
    } else if (!gameState.isCharging) {
      return { keyCode: 32 }; // Start charging
    }
    
    return { keyCode: 32 }; // Continue charging
  }
  
  // Adjust aim
  if (normalizedDiff > 0) {
    return { keyCode: 39 }; // Right arrow
  } else {
    return { keyCode: 37 }; // Left arrow
  }
}

function lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
  // Check if line segment intersects with rectangle
  const left = lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx, ry + rh);
  const right = lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh);
  const top = lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx + rw, ry);
  const bottom = lineIntersectsLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh);
  
  return left || right || top || bottom;
}

function lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
  const denominator = ((x2 - x1) * (y4 - y3)) - ((y2 - y1) * (x4 - x3));
  if (denominator === 0) return false;
  
  const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
  const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;
  
  return (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1);
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;