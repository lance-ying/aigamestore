// input_handler.js - Input handling for both human and automated testing

import { gameState, PHASES, TURN_PHASES } from './globals.js';
import { fireWeapon, cycleWeapon } from './game_logic.js';

export function handleHumanInput(p) {
  if (gameState.gamePhase !== PHASES.PLAYING) return;
  if (gameState.turnPhase === TURN_PHASES.FIRING || gameState.turnPhase === TURN_PHASES.SWITCHING) return;
  
  const activeWorm = gameState.entities.find(w => w.isActive);
  if (!activeWorm || activeWorm.isDead) return;
  
  // Only allow control during player's turn
  if (gameState.currentTeam !== 0) return;
  
  if (gameState.turnPhase === TURN_PHASES.MOVEMENT) {
    // Movement controls
    if (p.keyIsDown(37)) { // Left arrow
      activeWorm.moveLeft();
      gameState.currentMovement += Math.abs(activeWorm.vx);
    }
    if (p.keyIsDown(39)) { // Right arrow
      activeWorm.moveRight();
      gameState.currentMovement += Math.abs(activeWorm.vx);
    }
    if (p.keyIsDown(32)) { // Space
      activeWorm.jump();
    }
  } else if (gameState.turnPhase === TURN_PHASES.ATTACK) {
    // Aim controls
    if (p.keyIsDown(37)) { // Left arrow - decrease angle
      gameState.aimAngle -= 1;
      if (gameState.aimAngle < -180) gameState.aimAngle = -180;
    }
    if (p.keyIsDown(39)) { // Right arrow - increase angle
      gameState.aimAngle += 1;
      if (gameState.aimAngle > 180) gameState.aimAngle = 180;
    }
    if (p.keyIsDown(38)) { // Up arrow - increase power
      gameState.aimPower += 1;
      if (gameState.aimPower > 100) gameState.aimPower = 100;
    }
    if (p.keyIsDown(40)) { // Down arrow - decrease power
      gameState.aimPower -= 1;
      if (gameState.aimPower < 10) gameState.aimPower = 10;
    }
  }
}

export function handleAutomatedInput(p, action) {
  if (!action) return;
  if (gameState.gamePhase !== PHASES.PLAYING) return;
  if (gameState.turnPhase === TURN_PHASES.FIRING || gameState.turnPhase === TURN_PHASES.SWITCHING) return;
  
  const activeWorm = gameState.entities.find(w => w.isActive);
  if (!activeWorm || activeWorm.isDead) return;
  
  // Only allow control during current team's turn
  if (gameState.turnPhase === TURN_PHASES.MOVEMENT) {
    if (action.left) {
      activeWorm.moveLeft();
      gameState.currentMovement += Math.abs(activeWorm.vx);
    }
    if (action.right) {
      activeWorm.moveRight();
      gameState.currentMovement += Math.abs(activeWorm.vx);
    }
    if (action.jump) {
      activeWorm.jump();
    }
  } else if (gameState.turnPhase === TURN_PHASES.ATTACK) {
    if (action.aimLeft) {
      gameState.aimAngle -= 2;
      if (gameState.aimAngle < -180) gameState.aimAngle = -180;
    }
    if (action.aimRight) {
      gameState.aimAngle += 2;
      if (gameState.aimAngle > 180) gameState.aimAngle = 180;
    }
    if (action.powerUp) {
      gameState.aimPower += 2;
      if (gameState.aimPower > 100) gameState.aimPower = 100;
    }
    if (action.powerDown) {
      gameState.aimPower -= 2;
      if (gameState.aimPower < 10) gameState.aimPower = 10;
    }
    if (action.fire) {
      fireWeapon(p);
    }
    if (action.cycleWeapon) {
      cycleWeapon();
    }
  }
}

export function logInput(p, input_type, key, keyCode) {
  p.logs.inputs.push({
    input_type: input_type,
    data: { key: key, keyCode: keyCode },
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