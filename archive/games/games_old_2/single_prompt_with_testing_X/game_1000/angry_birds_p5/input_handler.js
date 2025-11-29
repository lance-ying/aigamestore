// input_handler.js - Input handling for different control modes

import { gameState, GAME_PHASES } from './globals.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function handleInput(p) {
  if (gameState.controlMode === "HUMAN") {
    return handleHumanInput(p);
  } else {
    return handleAutomatedInput(p);
  }
}

function handleHumanInput(p) {
  const actions = {
    aimLeft: p.keyIsDown(37),
    aimRight: p.keyIsDown(39),
    powerUp: p.keyIsDown(38),
    powerDown: p.keyIsDown(40),
    launch: false,
    ability: false,
    powerUp: false
  };
  
  return actions;
}

function handleAutomatedInput(p) {
  try {
    const action = get_automated_testing_action(gameState);
    return action || {
      aimLeft: false,
      aimRight: false,
      powerUp: false,
      powerDown: false,
      launch: false,
      ability: false,
      usePowerUp: false
    };
  } catch (e) {
    console.error("Automated testing error:", e);
    return {
      aimLeft: false,
      aimRight: false,
      powerUp: false,
      powerDown: false,
      launch: false,
      ability: false,
      usePowerUp: false
    };
  }
}

export function processActions(p, actions) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  if (gameState.isAiming && !gameState.birdLaunched) {
    // Aiming controls
    if (actions.aimLeft) {
      gameState.slingshotAngle -= 1.5;
      gameState.slingshotAngle = Math.max(-90, gameState.slingshotAngle);
    }
    if (actions.aimRight) {
      gameState.slingshotAngle += 1.5;
      gameState.slingshotAngle = Math.min(0, gameState.slingshotAngle);
    }
    if (actions.powerUp) {
      gameState.slingshotPower += 1;
      gameState.slingshotPower = Math.min(100, gameState.slingshotPower);
    }
    if (actions.powerDown) {
      gameState.slingshotPower -= 1;
      gameState.slingshotPower = Math.max(20, gameState.slingshotPower);
    }
    if (actions.launch) {
      launchBird(p);
    }
  } else if (gameState.currentBird && gameState.currentBird.launched && !gameState.currentBird.abilityUsed) {
    // Mid-flight ability activation
    if (actions.ability) {
      const newBirds = gameState.currentBird.activateAbility();
      if (newBirds && newBirds.length > 0) {
        gameState.birds.push(...newBirds);
      }
    }
  }
}

function launchBird(p) {
  if (!gameState.currentBird) return;
  
  gameState.currentBird.launch(gameState.slingshotAngle, gameState.slingshotPower);
  gameState.birdLaunched = true;
  gameState.isAiming = false;
  
  // Log bird launch
  p.logs.player_info.push({
    screen_x: gameState.currentBird.x,
    screen_y: gameState.currentBird.y,
    game_x: gameState.currentBird.x,
    game_y: gameState.currentBird.y,
    framecount: p.frameCount
  });
}