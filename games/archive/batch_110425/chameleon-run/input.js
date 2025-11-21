// input.js - Input handling

import { gameState, PHASE_PLAYING, COLOR_PINK, COLOR_YELLOW } from './globals.js';

export function handlePlayingInput(p, keyCode) {
  const player = gameState.player;
  if (!player) return;
  
  // Jump
  if (keyCode === 38 || keyCode === 32) { // UP or SPACE
    player.jump();
  }
  
  // Switch to Pink
  if (keyCode === 37) { // LEFT
    player.switchColor(COLOR_PINK);
  }
  
  // Switch to Yellow
  if (keyCode === 39) { // RIGHT
    player.switchColor(COLOR_YELLOW);
  }
}

export function logInput(p, inputType, key, keyCode) {
  p.logs.inputs.push({
    input_type: inputType,
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function logPlayerInfo(p, player) {
  if (!player) return;
  
  p.logs.player_info.push({
    screen_x: player.getScreenX(),
    screen_y: player.getScreenY(),
    game_x: player.getGameX(),
    game_y: player.getGameY(),
    framecount: p.frameCount
  });
}