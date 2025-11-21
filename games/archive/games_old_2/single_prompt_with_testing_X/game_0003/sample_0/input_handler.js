// input_handler.js - Handle keyboard inputs
import { gameState } from './globals.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function handleInput(p) {
  if (gameState.gamePhase !== "PLAYING") return;

  let action = null;

  if (gameState.controlMode === "HUMAN") {
    action = getHumanAction(p);
  } else {
    action = get_automated_testing_action(gameState);
  }

  if (action) {
    applyAction(action, p);
  }
}

function getHumanAction(p) {
  const action = {
    turn: null,
    boost: false
  };

  if (p.keyIsDown(37)) { // LEFT
    action.turn = 'left';
  } else if (p.keyIsDown(39)) { // RIGHT
    action.turn = 'right';
  } else if (p.keyIsDown(38)) { // UP
    action.turn = 'up';
  } else if (p.keyIsDown(40)) { // DOWN
    action.turn = 'down';
  }

  if (p.keyIsDown(32)) { // SPACE
    action.boost = true;
  }

  return action;
}

function applyAction(action, p) {
  if (!gameState.player || !gameState.player.isAlive) return;

  const head = gameState.player.getHead();
  const currentAngle = gameState.player.angle;

  if (action.turn) {
    let targetAngle = currentAngle;
    
    switch (action.turn) {
      case 'left':
        targetAngle = Math.PI;
        break;
      case 'right':
        targetAngle = 0;
        break;
      case 'up':
        targetAngle = -Math.PI / 2;
        break;
      case 'down':
        targetAngle = Math.PI / 2;
        break;
      case 'angle':
        targetAngle = action.angle;
        break;
    }

    gameState.player.setTargetAngle(targetAngle);
  }

  if (action.boost && gameState.player.mass > 20) {
    gameState.player.isBoosting = true;
  } else {
    gameState.player.isBoosting = false;
  }
}

export function logInput(p, key, keyCode, inputType) {
  p.logs.inputs.push({
    input_type: inputType,
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}