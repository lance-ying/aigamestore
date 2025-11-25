import { gameState } from './globals.js';

export function getPlayerInputs(p, controlMode, automatedAction) {
  let player1Inputs = { left: false, right: false, jump: false };
  let player2Inputs = { left: false, right: false, jump: false };
  
  if (controlMode === "HUMAN") {
    // Player 1 controls (Arrow keys)
    if (gameState.activePlayer === 1 || true) { // Always allow both
      player1Inputs.left = p.keyIsDown(37); // LEFT
      player1Inputs.right = p.keyIsDown(39); // RIGHT
      player1Inputs.jump = p.keyIsDown(38); // UP
    }
    
    // Player 2 controls (WASD)
    if (gameState.activePlayer === 2 || true) { // Always allow both
      player2Inputs.left = p.keyIsDown(65); // A
      player2Inputs.right = p.keyIsDown(68); // D
      player2Inputs.jump = p.keyIsDown(87); // W
    }
  } else {
    // Automated testing
    if (automatedAction) {
      player1Inputs = automatedAction.player1 || player1Inputs;
      player2Inputs = automatedAction.player2 || player2Inputs;
    }
  }
  
  return { player1: player1Inputs, player2: player2Inputs };
}