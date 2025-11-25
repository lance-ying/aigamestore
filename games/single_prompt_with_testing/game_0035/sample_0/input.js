// input.js - Input handling

import { KEY_CODES, GAME_PHASES, gameState } from './globals.js';

export function handlePlayerInput(p) {
  if (!gameState.player || gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return;
  }
  
  // Movement
  let dx = 0;
  let dy = 0;
  
  if (p.keyIsDown(KEY_CODES.LEFT)) dx -= 1;
  if (p.keyIsDown(KEY_CODES.RIGHT)) dx += 1;
  if (p.keyIsDown(KEY_CODES.UP)) dy -= 1;
  if (p.keyIsDown(KEY_CODES.DOWN)) dy += 1;
  
  if (dx !== 0 || dy !== 0) {
    gameState.player.move(dx, dy);
  }
  
  // Shooting
  if (p.keyIsDown(KEY_CODES.SPACE)) {
    gameState.player.shoot();
  }
  
  // Shield
  if (p.keyIsDown(KEY_CODES.SHIFT)) {
    gameState.player.activateShield();
  }
  
  // Dash
  if (p.keyIsDown(KEY_CODES.Z)) {
    gameState.player.dash();
  }
}

export function logInput(p, type, data) {
  p.logs.inputs.push({
    input_type: type,
    data: data,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function logPlayerInfo(p) {
  if (gameState.player) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}

export function logGameInfo(p, data) {
  p.logs.game_info.push({
    data: data,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}