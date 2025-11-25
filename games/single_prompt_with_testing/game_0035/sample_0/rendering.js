// rendering.js - Rendering functions

import { CANVAS_WIDTH, CANVAS_HEIGHT, ARENA_CONFIG, GAME_PHASES, WINS_TO_WIN, gameState } from './globals.js';
import { wrapText } from './utils.js';

export function renderStartScreen(p) {
  p.push();
  
  // Background
  p.background(20, 25, 35);
  
  // Animated background particles
  for (let i = 0; i < 30; i++) {
    const x = (i * 37 + p.frameCount * 0.5) % CANVAS_WIDTH;
    const y = (i * 23) % CANVAS_HEIGHT;
    p.fill(80, 100, 150, 50);
    p.noStroke();
    p.circle(x, y, 3);
  }
  
  // Title
  p.fill(255, 200, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('ROUNDS', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 200, 220);
  p.textSize(16);
  p.text('1v1 Rogue-lite Arena Combat', CANVAS_WIDTH / 2, 120);
  
  // Instructions box
  p.fill(40, 45, 55, 200);
  p.stroke(80, 150, 255);
  p.strokeWeight(2);
  p.rect(100, 160, 400, 180, 8);
  
  // Instructions
  p.noStroke();
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  
  const instructions = [
    'OBJECTIVE: Win 3 rounds before your opponent!',
    '',
    'CONTROLS:',
    'Arrow Keys - Move',
    'Space - Shoot',
    'Shift - Shield',
    'Z - Dash',
    '',
    'After each round, the loser chooses an upgrade!'
  ];
  
  let y = 170;
  instructions.forEach(line => {
    if (line === '') {
      y += 10;
    } else {
      p.text(line, 115, y);
      y += 18;
    }
  });
  
  // Start prompt (blinking)
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.fill(80, 150, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 370);
  }
  
  p.pop();
}

export function renderArena(p) {
  p.push();
  
  // Arena floor
  p.fill(30, 35, 45);
  p.noStroke();
  p.rect(ARENA_CONFIG.marginX, ARENA_CONFIG.marginY, ARENA_CONFIG.width, ARENA_CONFIG.height);
  
  // Grid pattern
  p.stroke(50, 55, 65);
  p.strokeWeight(1);
  const gridSize = 40;
  for (let x = ARENA_CONFIG.marginX; x <= ARENA_CONFIG.marginX + ARENA_CONFIG.width; x += gridSize) {
    p.line(x, ARENA_CONFIG.marginY, x, ARENA_CONFIG.marginY + ARENA_CONFIG.height);
  }
  for (let y = ARENA_CONFIG.marginY; y <= ARENA_CONFIG.marginY + ARENA_CONFIG.height; y += gridSize) {
    p.line(ARENA_CONFIG.marginX, y, ARENA_CONFIG.marginX + ARENA_CONFIG.width, y);
  }
  
  // Arena border
  p.stroke(80, 150, 255);
  p.strokeWeight(3);
  p.noFill();
  p.rect(ARENA_CONFIG.marginX, ARENA_CONFIG.marginY, ARENA_CONFIG.width, ARENA_CONFIG.height);
  
  // Center line
  p.stroke(80, 150, 255, 100);
  p.strokeWeight(2);
  p.line(CANVAS_WIDTH / 2, ARENA_CONFIG.marginY, CANVAS_WIDTH / 2, ARENA_CONFIG.marginY + ARENA_CONFIG.height);
  
  p.pop();
}

export function renderUI(p) {
  p.push();
  
  // Round counter
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text(`ROUND ${gameState.roundNumber}`, CANVAS_WIDTH / 2, 5);
  
  // Win counters
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  
  // Player wins
  p.fill(80, 150, 255);
  p.text('PLAYER', 10, 5);
  for (let i = 0; i < WINS_TO_WIN; i++) {
    if (i < gameState.playerRoundWins) {
      p.fill(100, 255, 100);
    } else {
      p.fill(50, 50, 50);
    }
    p.circle(15 + i * 20, 35, 12);
  }
  
  // Enemy wins
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(255, 80, 80);
  p.text('ENEMY', CANVAS_WIDTH - 10, 5);
  for (let i = 0; i < WINS_TO_WIN; i++) {
    if (i < gameState.enemyRoundWins) {
      p.fill(100, 255, 100);
    } else {
      p.fill(50, 50, 50);
    }
    p.circle(CANVAS_WIDTH - 15 - i * 20, 35, 12);
  }
  
  p.pop();
}

export function renderPauseIndicator(p) {
  p.push();
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text('PAUSED', CANVAS_WIDTH - 10, 60);
  p.pop();
}

export function renderRoundEnd(p, winner) {
  p.push();
  
  // Dark overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Result text
  p.fill(winner === 'player' ? [80, 150, 255] : [255, 80, 80]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text(winner === 'player' ? 'PLAYER WINS ROUND!' : 'ENEMY WINS ROUND!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.fill(200);
  p.textSize(16);
  p.text('Preparing next round...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  
  p.pop();
}

export function renderGameOver(p, winner) {
  p.push();
  
  // Background
  p.background(20, 25, 35);
  
  // Result
  const isWin = winner === 'player';
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? 'VICTORY!' : 'DEFEAT', CANVAS_WIDTH / 2, 120);
  
  // Score
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.playerRoundWins} - ${gameState.enemyRoundWins}`, CANVAS_WIDTH / 2, 180);
  
  // Message
  p.fill(200);
  p.textSize(16);
  const message = isWin ? 
    'You have proven your mastery of the arena!' :
    'The enemy has bested you this time...';
  p.text(message, CANVAS_WIDTH / 2, 230);
  
  // Restart prompt
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.fill(80, 150, 255);
    p.textSize(20);
    p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 320);
  }
  
  p.pop();
}