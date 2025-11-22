import { gameState } from './globals.js';

function getTestWinAction(gameState) {
  // Strategy: Find weak points and fire correct truth bullets
  
  // Find statements with weak points
  const weakPointStatements = gameState.statements.filter(
    s => s.hasWeakPoint && !s.exposed && s.x < 500 && s.x > 100
  );
  
  if (weakPointStatements.length > 0) {
    // Get the first weak point statement
    const targetStmt = weakPointStatements[0];
    
    // Find matching truth bullet
    let matchingBulletIndex = -1;
    for (let i = 0; i < gameState.truthBullets.length; i++) {
      if (gameState.truthBullets[i].type === targetStmt.weakPointType) {
        matchingBulletIndex = i;
        break;
      }
    }
    
    if (matchingBulletIndex !== -1) {
      // Select correct bullet if not already selected
      if (gameState.selectedBulletIndex !== matchingBulletIndex) {
        if (matchingBulletIndex > gameState.selectedBulletIndex) {
          return { keyCode: 39 }; // RIGHT
        } else {
          return { keyCode: 37 }; // LEFT
        }
      } else {
        // Correct bullet selected, check if weak point is in good position
        const wpX = targetStmt.getWeakPointX();
        if (wpX > 150 && wpX < 450) {
          // Fire!
          const currentTime = Date.now();
          if (currentTime - gameState.lastShotTime > gameState.shotCooldown) {
            return { keyCode: 32 }; // SPACE
          }
        }
      }
    }
  }
  
  // Look for absorbable statements to expand inventory
  const absorbableStmts = gameState.statements.filter(
    s => s.absorbable && !s.exposed && s.x > 100 && s.x < 400
  );
  
  if (absorbableStmts.length > 0 && gameState.truthBullets.length < 6) {
    return { keyCode: 90 }; // Z to absorb
  }
  
  return null; // Wait
}

function getBasicTestAction(gameState) {
  // Test basic controls: cycle through bullets and occasionally fire
  const frameCount = gameState.frameCount;
  
  if (frameCount % 60 === 0) {
    return { keyCode: 39 }; // RIGHT arrow every 60 frames
  }
  
  if (frameCount % 120 === 30) {
    return { keyCode: 37 }; // LEFT arrow
  }
  
  if (frameCount % 90 === 45 && gameState.statements.length > 0) {
    return { keyCode: 32 }; // SPACE to fire
  }
  
  if (frameCount % 150 === 75) {
    return { keyCode: 90 }; // Z to try absorbing
  }
  
  return null;
}

function getAbsorbTestAction(gameState) {
  // Focus on testing absorb mechanic
  const absorbableStmts = gameState.statements.filter(
    s => s.absorbable && !s.exposed && s.x > 100 && s.x < 400
  );
  
  if (absorbableStmts.length > 0) {
    return { keyCode: 90 }; // Z
  }
  
  // Also cycle through bullets to show inventory
  if (gameState.frameCount % 30 === 0) {
    return { keyCode: 39 };
  }
  
  return null;
}

function getLoseTestAction(gameState) {
  // Intentionally play poorly to test lose condition
  
  // Fire wrong bullets or miss
  if (gameState.frameCount % 80 === 0 && gameState.truthBullets.length > 0) {
    // Select first bullet regardless of type
    if (gameState.selectedBulletIndex !== 0) {
      return { keyCode: 37 }; // LEFT
    }
  }
  
  if (gameState.frameCount % 80 === 40) {
    // Fire at random position
    return { keyCode: 32 }; // SPACE
  }
  
  return null;
}

function getRandomAction(gameState) {
  const actions = [
    { keyCode: 37 },  // LEFT
    { keyCode: 39 },  // RIGHT
    { keyCode: 32 },  // SPACE
    { keyCode: 90 },  // Z
    null,
    null
  ];
  
  const randomIndex = Math.floor(Math.random() * actions.length);
  return actions[randomIndex];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getAbsorbTestAction(gameState);
    case "TEST_4":
      return getLoseTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;