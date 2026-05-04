import { gameState } from './globals.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function handleInput(p) {
  const player = gameState.player;
  if (!player || gameState.gamePhase !== "PLAYING") return;
  
  if (gameState.controlMode === "HUMAN") {
    // Human controls
    if (p.keyIsDown(37)) { // Left
      player.moveLeft();
    }
    if (p.keyIsDown(39)) { // Right
      player.moveRight();
    }
    if (p.keyIsDown(38) && player.grounded) { // Up/Jump
      player.jump();
    }
    if (p.keyIsDown(32)) { // Space - Light attack
      player.lightAttack();
    }
    if (p.keyIsDown(16)) { // Shift - Heavy attack
      player.heavyAttack();
    }
    if (p.keyIsDown(90)) { // Z - Dash
      player.dash();
    }
  } else {
    // Automated testing
    const action = get_automated_testing_action(gameState);
    if (action) {
      if (action.left) player.moveLeft();
      if (action.right) player.moveRight();
      if (action.jump) player.jump();
      if (action.lightAttack) player.lightAttack();
      if (action.heavyAttack) player.heavyAttack();
      if (action.dash) player.dash();
    }
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

export function logPlayerInfo(p) {
  const player = gameState.player;
  if (!player) return;
  
  p.logs.player_info.push({
    screen_x: player.x - gameState.cameraX,
    screen_y: player.y,
    game_x: player.x,
    game_y: player.y,
    framecount: p.frameCount
  });
}