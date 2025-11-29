// input_handler.js - Input handling
import { gameState } from './globals.js';

export function getPlayerInputs(p) {
  if (gameState.controlMode === "HUMAN") {
    return {
      left: p.keyIsDown(37),
      right: p.keyIsDown(39),
      jump: p.keyIsDown(32)
    };
  } else {
    // Automated testing mode
    if (typeof window.get_automated_testing_action === 'function') {
      const action = window.get_automated_testing_action(gameState);
      return {
        left: action.left || false,
        right: action.right || false,
        jump: action.jump || false
      };
    }
  }
  
  return { left: false, right: false, jump: false };
}

export function logInput(p, inputType, data) {
  p.logs.inputs.push({
    input_type: inputType,
    data: data,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function logGameInfo(p, data) {
  p.logs.game_info.push({
    data: data,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function logPlayerInfo(p, player) {
  if (!player) return;
  
  p.logs.player_info.push({
    screen_x: player.x - gameState.camera.x,
    screen_y: player.y,
    game_x: player.x,
    game_y: player.y,
    framecount: p.frameCount
  });
}