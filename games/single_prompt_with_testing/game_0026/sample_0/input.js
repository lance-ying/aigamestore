// input.js - Input handling

import { gameState, KEYS } from './globals.js';

export function handleInput(p, player) {
  if (!player || !player.alive) return;
  
  // Movement
  if (p.keyIsDown(KEYS.LEFT)) {
    player.move('left');
  }
  if (p.keyIsDown(KEYS.RIGHT)) {
    player.move('right');
  }
  
  // Crouch
  player.setCrouch(p.keyIsDown(KEYS.DOWN));
  
  // Jump
  if (p.keyIsDown(KEYS.SPACE)) {
    player.jump();
  }
  
  // Dash
  if (p.keyIsDown(KEYS.SHIFT)) {
    player.dash();
  }
  
  // Slash
  if (p.keyIsDown(KEYS.Z)) {
    let dirX = player.facingRight ? 1 : -1;
    let dirY = 0;
    
    // Directional slash
    if (p.keyIsDown(KEYS.UP)) {
      dirY = -1;
      dirX = 0;
    } else if (p.keyIsDown(KEYS.DOWN)) {
      dirY = 1;
      dirX = 0;
    }
    
    player.slash(dirX, dirY);
  }
}