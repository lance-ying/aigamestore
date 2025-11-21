// rendering.js - Rendering functions

import { gameState, GAME_PHASES, TURN_PHASES, PLAYERS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { getHomeColumnPosition } from './board.js';

export function renderPieces(p, pieces, isPlayer, eligiblePieces, selectedPieceIndex) {
  pieces.forEach((piece, index) => {
    if (piece.isFinished) {
      // Render in center
      p.push();
      p.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      p.fill(isPlayer ? 255 : 100, 100, isPlayer ? 100 : 255);
      p.stroke(255);
      p.strokeWeight(2);
      p.circle(0, 0, 8);
      p.pop();
      return;
    }
    
    let x = piece.x;
    let y = piece.y;
    
    if (piece.inHomeColumn && !piece.isFinished) {
      const pos = getHomeColumnPosition(piece.owner, piece.homeColumnSteps);
      x = pos.x;
      y = pos.y;
    }
    
    p.push();
    p.translate(x, y);
    
    // Highlight eligible pieces
    const isEligible = eligiblePieces.includes(piece);
    const isSelected = isEligible && eligiblePieces[selectedPieceIndex] === piece;
    
    if (isSelected) {
      p.fill(255, 255, 100, 150);
      p.noStroke();
      p.circle(0, 0, 20);
    } else if (isEligible) {
      const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
      p.fill(255, 255, 255, pulse * 150);
      p.noStroke();
      p.circle(0, 0, 18);
    }
    
    // Draw piece
    p.fill(isPlayer ? 255 : 100, 100, isPlayer ? 100 : 255);
    p.stroke(255);
    p.strokeWeight(2);
    p.circle(0, 0, 12);
    
    // Stuck indicator
    if (piece.isStuck) {
      p.stroke(255, 200, 0);
      p.strokeWeight(3);
      p.noFill();
      p.circle(0, 0, 16);
    }
    
    p.pop();
  });
}

export function renderDice(p, diceValue, isRolling) {
  const x = CANVAS_WIDTH - 80;
  const y = CANVAS_HEIGHT - 60;
  const size = 40;
  
  p.push();
  p.translate(x, y);
  
  if (isRolling) {
    p.rotate(p.frameCount * 0.3);
    const scale = 1 + p.sin(p.frameCount * 0.5) * 0.2;
    p.scale(scale);
  }
  
  p.fill(255);
  p.stroke(50);
  p.strokeWeight(2);
  p.rect(-size / 2, -size / 2, size, size, 5);
  
  p.fill(50);
  p.noStroke();
  const pipSize = 4;
  
  const pipPositions = {
    1: [[0, 0]],
    2: [[-10, -10], [10, 10]],
    3: [[-10, -10], [0, 0], [10, 10]],
    4: [[-10, -10], [10, -10], [-10, 10], [10, 10]],
    5: [[-10, -10], [10, -10], [0, 0], [-10, 10], [10, 10]],
    6: [[-10, -10], [10, -10], [-10, 0], [10, 0], [-10, 10], [10, 10]]
  };
  
  if (diceValue > 0 && diceValue <= 6) {
    pipPositions[diceValue].forEach(pos => {
      p.circle(pos[0], pos[1], pipSize);
    });
  }
  
  p.pop();
}

export function renderUI(p) {
  // Score
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${gameState.currentScore}`, CANVAS_WIDTH - 20, 20);
  
  // Level
  p.textAlign(p.LEFT, p.TOP);
  p.text(`LEVEL: ${gameState.currentLevel}`, 20, 20);
  
  // Turn indicator
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  if (gameState.currentPlayer === PLAYERS.PLAYER) {
    p.fill(255, 200, 200);
    p.text("YOUR TURN", CANVAS_WIDTH / 2, 50);
  } else {
    p.fill(200, 200, 255);
    p.text("AI'S TURN", CANVAS_WIDTH / 2, 50);
  }
  
  // Prompts
  if (gameState.currentPlayer === PLAYERS.PLAYER) {
    if (gameState.currentTurnPhase === TURN_PHASES.ROLL_DICE) {
      p.fill(255, 255, 150);
      p.textSize(16);
      const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
      p.fill(255, 255, 150, pulse * 255);
      p.text("PRESS SPACE TO ROLL", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
    } else if (gameState.currentTurnPhase === TURN_PHASES.SELECT_PIECE) {
      p.fill(255, 255, 150);
      p.textSize(14);
      p.text("ARROW KEYS TO SELECT, SPACE TO CONFIRM", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
    }
  }
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(18);
    p.text("PAUSED", CANVAS_WIDTH - 20, 50);
  }
  
  // Finished piece counts
  p.textAlign(p.LEFT, p.BOTTOM);
  p.textSize(12);
  p.fill(255, 150, 150);
  p.text(`Player Home: ${gameState.playerFinishedCount}/4`, 20, CANVAS_HEIGHT - 20);
  p.fill(150, 150, 255);
  p.text(`AI Home: ${gameState.aiFinishedCount}/4`, 20, CANVAS_HEIGHT - 5);
}

export function renderStartScreen(p) {
  p.background(40, 80, 120);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("LUDO DASH", CANVAS_WIDTH / 2, 80);
  
  p.textSize(16);
  p.fill(220);
  const desc = [
    "Race against AI to get all 4 pieces home first!",
    "",
    "Roll 6 to bring pieces out from home base",
    "Land on opponent pieces to cut them (except safe spots)",
    "Navigate through 3 challenging levels"
  ];
  
  desc.forEach((line, i) => {
    p.text(line, CANVAS_WIDTH / 2, 150 + i * 25);
  });
  
  p.textSize(14);
  p.fill(200, 200, 255);
  const controls = [
    "SPACE - Roll dice / Confirm selection",
    "ARROW KEYS - Select pieces",
    "ESC - Pause / Unpause",
    "R - Restart"
  ];
  
  controls.forEach((line, i) => {
    p.text(line, CANVAS_WIDTH / 2, 280 + i * 20);
  });
  
  p.textSize(20);
  p.fill(255, 255, 100);
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 100, pulse * 255);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  
  // High score
  p.textSize(14);
  p.fill(255, 215, 0);
  p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, 100);
}

export function renderGameOver(p, isWin) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  p.pop();
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  
  if (isWin) {
    p.fill(100, 255, 100);
    if (gameState.currentLevel === 3) {
      p.text("GAME COMPLETE!", CANVAS_WIDTH / 2, 120);
    } else {
      p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 120);
    }
    
    // Confetti effect
    for (let i = 0; i < 20; i++) {
      const x = (p.frameCount * 2 + i * 30) % CANVAS_WIDTH;
      const y = ((p.frameCount * 3 + i * 50) % CANVAS_HEIGHT);
      p.fill(p.random(255), p.random(255), p.random(255));
      p.noStroke();
      p.circle(x, y, 5);
    }
  } else {
    p.fill(255, 100, 100);
    p.text("GAME OVER!", CANVAS_WIDTH / 2, 120);
  }
  
  p.fill(255);
  p.textSize(20);
  p.text(`FINAL SCORE: ${gameState.currentScore}`, CANVAS_WIDTH / 2, 200);
  p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, 230);
  
  p.textSize(18);
  p.fill(255, 255, 150);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 300);
}