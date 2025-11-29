// render.js - Rendering functions

import { gameState, GAME_PHASES, TURN_PHASES, PLAYERS, LEVEL_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderGame(p) {
  // Background
  const levelConfig = LEVEL_CONFIG[gameState.level - 1];
  p.background(...levelConfig.bgColor);
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderGameplay(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderGameplay(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    renderGameOverScreen(p, true);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOverScreen(p, false);
  }
}

function renderStartScreen(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(48);
  p.text("FARKLE FORTUNE", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.textSize(16);
  p.text("Roll dice, select scoring combinations, and bank points", CANVAS_WIDTH / 2, 140);
  p.text("to reach the target score before the AI opponent!", CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const startX = 80;
  let y = 200;
  
  p.text("CONTROLS:", startX, y);
  y += 25;
  p.text("SPACE: Roll dice / Roll again", startX, y);
  y += 20;
  p.text("SHIFT: Select/deselect die (use arrows to navigate)", startX, y);
  y += 20;
  p.text("B: Bank score (when minimum reached)", startX, y);
  y += 20;
  p.text("Z: Deselect all dice", startX, y);
  y += 20;
  p.text("ESC: Pause game", startX, y);
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.fill(255, 255, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

function renderGameplay(p) {
  // Scores
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`P1 Score: ${gameState.playerScoreTotal}`, 10, 10);
  p.text(`Level: ${gameState.level}/3`, 10, 35);
  
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`AI Score: ${gameState.aiScoreTotal}`, CANVAS_WIDTH - 10, 10);
  
  p.textAlign(p.CENTER, p.TOP);
  p.text(`Target: ${gameState.targetScore}`, CANVAS_WIDTH / 2, 10);
  
  // Current turn score
  p.textSize(24);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.fill(255, 255, 100);
  p.text(`Current Turn: ${gameState.currentTurnScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
  
  // Turn indicator
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  p.fill(gameState.currentPlayer === PLAYERS.PLAYER ? [100, 255, 100] : [255, 100, 100]);
  const turnText = gameState.currentPlayer === PLAYERS.PLAYER ? "YOUR TURN" : "AI TURN";
  p.text(turnText, CANVAS_WIDTH / 2, 60);
  
  // Dice
  const availableDice = gameState.dice.filter((d, i) => !gameState.selectedDiceIndices.includes(i));
  for (let i = 0; i < gameState.dice.length; i++) {
    const die = gameState.dice[i];
    const isHighlighted = gameState.turnPhase === TURN_PHASES.SELECTING && 
                         gameState.currentPlayer === PLAYERS.PLAYER &&
                         availableDice[gameState.selectedDieIndex] === die;
    die.draw(p, isHighlighted);
  }
  
  // Action hints
  if (gameState.turnPhase === TURN_PHASES.SELECTING && gameState.currentPlayer === PLAYERS.PLAYER) {
    p.textSize(14);
    p.textAlign(p.CENTER, p.TOP);
    p.fill(200);
    
    let hints = [];
    if (gameState.turnPhase === TURN_PHASES.WAITING_TO_ROLL || gameState.canRollAgain) {
      hints.push("SPACE: Roll");
    }
    if (gameState.canBank) {
      hints.push("B: Bank");
    }
    if (gameState.selectedDiceIndices.length > 0) {
      hints.push("Z: Clear");
    }
    
    p.text(hints.join(" | "), CANVAS_WIDTH / 2, 85);
  }
  
  // Waiting to roll prompt
  if (gameState.turnPhase === TURN_PHASES.WAITING_TO_ROLL && gameState.currentPlayer === PLAYERS.PLAYER) {
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 255, 200);
    p.text("Press SPACE to roll dice", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
  
  // Farkle animation
  if (gameState.turnPhase === TURN_PHASES.FARKLE) {
    const alpha = p.map(gameState.farkleAnimationFrame, 0, gameState.animationDuration, 255, 0);
    p.textSize(48);
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 0, 0, alpha);
    p.text("FARKLE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    // Screen shake
    if (gameState.farkleAnimationFrame < 20) {
      p.translate(p.random(-5, 5), p.random(-5, 5));
    }
  }
  
  // Banking animation
  if (gameState.turnPhase === TURN_PHASES.BANKING) {
    const alpha = p.map(gameState.bankAnimationFrame, 0, gameState.animationDuration, 255, 0);
    p.textSize(32);
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(100, 255, 100, alpha);
    p.text("BANKED!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
}

function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textSize(32);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

function renderGameOverScreen(p, isWin) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(48);
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.text(isWin ? "YOU WIN!" : "GAME OVER", CANVAS_WIDTH / 2, 120);
  
  // Scores
  p.textSize(24);
  p.fill(255);
  p.text(`Final Score: ${gameState.playerScoreTotal}`, CANVAS_WIDTH / 2, 200);
  p.text(`AI Score: ${gameState.aiScoreTotal}`, CANVAS_WIDTH / 2, 240);
  
  // Restart prompt
  p.textSize(20);
  p.fill(255, 255, 100);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}