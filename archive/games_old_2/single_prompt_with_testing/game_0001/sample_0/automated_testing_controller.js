// automated_testing_controller.js
import { gameState, MUTATION_TYPES } from './globals.js';

function getTestWinAction(gameState) {
  // Strategy: Use mutations strategically to win
  
  // Ensure we have at least one zombie selected
  if (!gameState.selectedZombie && gameState.zombies.length > 0) {
    return { selectZombie: 0 };
  }

  // If we have DNA and a selected zombie, apply mutations strategically
  if (gameState.selectedZombie && gameState.dnaPoints >= 10) {
    const zombie = gameState.selectedZombie;
    
    // Find nearest destructible wall
    let nearestWall = null;
    let minWallDist = Infinity;
    for (const wall of gameState.walls) {
      if (wall.destructible) {
        const dist = Math.abs(zombie.x - wall.x);
        if (dist < minWallDist) {
          minWallDist = dist;
          nearestWall = wall;
        }
      }
    }

    // Find nearest human
    let nearestHuman = null;
    let minHumanDist = Infinity;
    for (const human of gameState.humans) {
      const dist = Math.sqrt(Math.pow(zombie.x - human.x, 2) + Math.pow(zombie.y - human.y, 2));
      if (dist < minHumanDist) {
        minHumanDist = dist;
        nearestHuman = human;
      }
    }

    // Decision logic
    if (nearestWall && minWallDist < 100 && gameState.dnaPoints >= 25 && gameState.mutationCooldowns.EXPLODER === 0) {
      // Destroy wall
      if (gameState.selectedMutation !== MUTATION_TYPES.EXPLODER) {
        return { cycleMutation: true };
      }
      return { applyMutation: true };
    } else if (nearestHuman && minHumanDist < 150 && gameState.dnaPoints >= 15 && gameState.mutationCooldowns.OVERLORD === 0) {
      // Guide to human
      if (gameState.selectedMutation !== MUTATION_TYPES.OVERLORD) {
        return { cycleMutation: true };
      }
      return { applyMutation: true };
    } else if (gameState.dnaPoints >= 10 && gameState.mutationCooldowns.RUNNER === 0) {
      // Speed boost
      if (gameState.selectedMutation !== MUTATION_TYPES.RUNNER) {
        return { cycleMutation: true };
      }
      return { applyMutation: true };
    }
  }

  // Camera follows action
  if (gameState.zombies.length > 0) {
    const avgX = gameState.zombies.reduce((sum, z) => sum + z.x, 0) / gameState.zombies.length;
    const targetCamera = avgX - 300;
    if (Math.abs(gameState.cameraX - targetCamera) > 50) {
      return { cameraMove: targetCamera > gameState.cameraX ? 5 : -5 };
    }
  }

  // Select different zombie periodically
  if (gameState.frameCount % 120 === 0 && gameState.zombies.length > 0) {
    const randomIndex = Math.floor(Math.random() * gameState.zombies.length);
    return { selectZombie: randomIndex };
  }

  return null;
}

function getBasicTestAction(gameState) {
  // Basic test: select zombies and move camera
  if (gameState.frameCount % 60 === 0 && gameState.zombies.length > 0) {
    const randomIndex = Math.floor(Math.random() * gameState.zombies.length);
    return { selectZombie: randomIndex };
  }

  if (gameState.frameCount % 30 === 0) {
    return { cameraMove: Math.random() > 0.5 ? 3 : -3 };
  }

  return null;
}

function getRandomAction(gameState) {
  const actions = [
    { cameraMove: 5 },
    { cameraMove: -5 },
    { cycleMutation: true },
    { selectZombie: Math.floor(Math.random() * Math.max(1, gameState.zombies.length)) },
    { applyMutation: true },
    null
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getRandomAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;