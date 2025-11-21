// rendering.js
import { gameState, GAME_PHASES, TURN_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("LUX DLX 3", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200, 220, 255);
  p.textSize(14);
  p.text("Conquer all territories to achieve world domination!", CANVAS_WIDTH / 2, 140);
  
  // Instructions
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "OBJECTIVE:",
    "• Conquer all enemy territories to win",
    "• Deploy reinforcements strategically",
    "• Attack adjacent enemy territories",
    "",
    "CONTROLS:",
    "• Arrow Keys: Navigate territories",
    "• Space: Confirm selection/action",
    "• Z: End current phase",
    "",
    "GAMEPLAY:",
    "• Reinforcement: Receive armies each turn",
    "• Deployment: Place armies on your territories",
    "• Attack: Battle adjacent enemies (need 3+ armies)",
    "• Fortify: Move armies between connected territories"
  ];
  
  let y = 180;
  for (const line of instructions) {
    p.text(line, 80, y);
    y += 16;
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

export function drawPausedOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

export function drawGameOver(p, won) {
  p.background(20, 30, 50);
  
  p.fill(won ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(won ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH / 2, 120);
  
  p.fill(255);
  p.textSize(20);
  p.text(won ? "You conquered all territories!" : "The AI conquered all territories!", 
         CANVAS_WIDTH / 2, 180);
  
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.text(`Turns: ${gameState.turnNumber}`, CANVAS_WIDTH / 2, 250);
  
  p.fill(255, 255, 100);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function drawUI(p) {
  p.push();
  
  // Background for UI
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  // Turn info
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Turn: ${gameState.turnNumber}`, 10, 10);
  
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  p.fill(...currentPlayer.color);
  p.text(`${currentPlayer.name}'s Turn`, 100, 10);
  
  // Phase indicator
  p.fill(255, 255, 100);
  const phaseText = {
    [TURN_PHASES.REINFORCEMENT]: "Phase: Receiving Reinforcements",
    [TURN_PHASES.DEPLOYMENT]: `Phase: Deploy (${gameState.reinforcementsToPlace} left)`,
    [TURN_PHASES.ATTACK]: "Phase: Attack (Z to end)",
    [TURN_PHASES.FORTIFY]: "Phase: Fortify (Z to end)"
  };
  p.text(phaseText[gameState.turnPhase] || "", 280, 10);
  
  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(255);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  p.pop();
}

export function drawCombatLog(p) {
  if (gameState.combatLog.length === 0) return;
  
  p.push();
  p.fill(0, 0, 0, 200);
  p.rect(10, CANVAS_HEIGHT - 80, 300, 70);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(11);
  
  const recentLogs = gameState.combatLog.slice(-3);
  let y = CANVAS_HEIGHT - 75;
  for (const log of recentLogs) {
    p.text(log, 15, y);
    y += 20;
  }
  p.pop();
}

export function drawInstructions(p) {
  p.push();
  p.fill(255, 255, 255, 200);
  p.textAlign(p.LEFT, p.BOTTOM);
  p.textSize(10);
  
  let instructions = "";
  switch (gameState.turnPhase) {
    case TURN_PHASES.DEPLOYMENT:
      instructions = "Arrows: Navigate | Space: Deploy army | Z: End deployment";
      break;
    case TURN_PHASES.ATTACK:
      instructions = "Arrows: Navigate | Space: Select attacker/target | Z: End attacks";
      break;
    case TURN_PHASES.FORTIFY:
      instructions = "Arrows: Navigate | Space: Select source/destination | Z: Skip fortify";
      break;
  }
  
  p.text(instructions, 10, CANVAS_HEIGHT - 5);
  p.pop();
}