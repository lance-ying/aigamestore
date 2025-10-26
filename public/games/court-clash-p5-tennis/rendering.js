import { CANVAS_WIDTH, CANVAS_HEIGHT, COURT, NET, gameState, LEVEL_CONFIG } from './globals.js';

export function renderGame(p) {
  // Clear background
  p.background(40, 100, 40);

  if (gameState.gamePhase === 'START') {
    renderStartScreen(p);
  } else if (gameState.gamePhase === 'PLAYING') {
    renderGameplay(p);
    
    if (gameState.showLevelIntro) {
      renderLevelIntro(p);
    }
    
    if (gameState.pointScored) {
      renderPointMessage(p);
    }
  } else if (gameState.gamePhase === 'PAUSED') {
    renderGameplay(p);
    renderPauseScreen(p);
  } else if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
    renderGameplay(p);
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.background(20, 60, 20);
  
  // Title
  p.fill(255, 255, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('COURT CLASH', CANVAS_WIDTH / 2, 80);
  
  p.textSize(24);
  p.fill(200, 200, 150);
  p.text('P5 Tennis', CANVAS_WIDTH / 2, 120);

  // Description
  p.textSize(14);
  p.fill(200);
  p.textAlign(p.CENTER, p.TOP);
  const desc = [
    'Face AI opponents in intense 1v1 tennis matches!',
    'Your character auto-moves to intercept the ball.',
    '',
    'First to 3 points wins the match.',
    'Complete all 4 levels to become champion!'
  ];
  
  let yPos = 160;
  for (const line of desc) {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 20;
  }

  // Controls
  p.textSize(16);
  p.fill(255, 255, 150);
  p.text('CONTROLS', CANVAS_WIDTH / 2, 280);
  
  p.textSize(12);
  p.fill(220);
  const controls = [
    'ARROW KEYS: Aim and charge your shot',
    'SPACE: Execute shot / Serve',
    'ESC: Pause game',
    'R: Restart to menu'
  ];
  
  yPos = 305;
  for (const line of controls) {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 18;
  }

  // Start prompt
  p.textSize(20);
  p.fill(100, 255, 100);
  const blink = Math.floor(p.frameCount / 30) % 2 === 0;
  if (blink) {
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }

  // High score
  p.textSize(14);
  p.fill(255, 200, 100);
  p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
}

function renderGameplay(p) {
  // Court
  p.fill(0, 150, 0);
  p.stroke(255);
  p.strokeWeight(COURT.lineWidth);
  p.rect(COURT.x, COURT.y, COURT.width, COURT.height);

  // Center line
  p.line(COURT.x, COURT.y + COURT.height / 2, 
         COURT.x + COURT.width, COURT.y + COURT.height / 2);

  // Service boxes
  p.line(COURT.x + COURT.width / 4, COURT.y,
         COURT.x + COURT.width / 4, COURT.y + COURT.height);
  p.line(COURT.x + 3 * COURT.width / 4, COURT.y,
         COURT.x + 3 * COURT.width / 4, COURT.y + COURT.height);

  // Net
  p.fill(255);
  p.noStroke();
  p.rect(NET.x, NET.y, NET.width, NET.height);

  // Net posts
  p.fill(150);
  p.rect(NET.x - 2, NET.y - 10, 8, 10);
  p.rect(NET.x - 2, NET.y + NET.height, 8, 10);

  // Entities
  if (gameState.ball) gameState.ball.draw(p);
  if (gameState.player) gameState.player.draw(p);
  if (gameState.opponent) gameState.opponent.draw(p);

  // UI
  renderUI(p);
}

function renderUI(p) {
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.fill(255);
  
  // Level
  const levelName = LEVEL_CONFIG[gameState.level].name;
  p.text(`LEVEL ${gameState.level}: ${levelName}`, 10, 10);

  // Match score
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(20);
  p.text(`PLAYER: ${gameState.score.player}  |  OPPONENT: ${gameState.score.opponent}`, 
         CANVAS_WIDTH / 2, 10);

  // Total score
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score.total}`, CANVAS_WIDTH - 10, 10);

  // Shot charge indicator
  if (gameState.controlMode === 'HUMAN' && gameState.player) {
    const inputHandler = window.inputHandlerInstance;
    if (inputHandler && inputHandler.chargeTime > 0) {
      const chargePercent = inputHandler.chargeTime / inputHandler.maxChargeTime;
      p.fill(255, 200, 0, 150);
      p.noStroke();
      p.rect(gameState.player.x - 15, gameState.player.y - 40, 30 * chargePercent, 5);
    }
  }

  // Paused indicator
  if (gameState.gamePhase === 'PAUSED') {
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.fill(255, 255, 100);
    p.text('PAUSED', CANVAS_WIDTH - 10, 40);
  }
}

function renderLevelIntro(p) {
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 255, 100);
  p.textSize(36);
  p.text(`LEVEL ${gameState.level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

  p.textSize(24);
  p.fill(200);
  const levelName = LEVEL_CONFIG[gameState.level].name;
  p.text(levelName, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
}

function renderPointMessage(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(CANVAS_WIDTH / 4, CANVAS_HEIGHT / 2 - 30, CANVAS_WIDTH / 2, 60);

  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  
  const isPlayerPoint = gameState.pointMessage.includes('PLAYER');
  p.fill(...(isPlayerPoint ? [100, 255, 100] : [255, 100, 100]));
  p.text(gameState.pointMessage, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

function renderPauseScreen(p) {
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  p.textSize(16);
  p.fill(200);
  p.text('ESC - Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.text('R - Return to Menu', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

function renderGameOverScreen(p) {
  p.fill(0, 0, 0, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === 'GAME_OVER_WIN') {
    p.fill(100, 255, 100);
    p.textSize(48);
    
    if (gameState.level >= 4) {
      p.text('CHAMPION!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
      p.textSize(24);
      p.fill(255, 255, 100);
      p.text('You defeated all opponents!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    } else {
      p.text('VICTORY!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
      p.textSize(20);
      p.fill(200);
      p.text('Match won!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    }
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  }

  p.textSize(20);
  p.fill(255, 255, 150);
  p.text(`FINAL SCORE: ${gameState.score.total}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

  p.textSize(16);
  p.fill(200);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  
  if (gameState.gamePhase === 'GAME_OVER_WIN' && gameState.level < 4) {
    p.text('PRESS ENTER FOR NEXT LEVEL', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
  }
}