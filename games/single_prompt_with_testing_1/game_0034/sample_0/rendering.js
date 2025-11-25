// rendering.js - Rendering functions

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  DUEL_INTRO,
  DUEL_READY,
  DUEL_STEADY,
  DUEL_WAIT,
  DUEL_BANG,
  DUEL_RESULT
} from './globals.js';

let p5Instance = null;

export function initRendering(p) {
  p5Instance = p;
}

export function renderGame() {
  const p = p5Instance;
  if (!p) return;
  
  p.background(135, 206, 235); // Sky blue
  
  switch (gameState.gamePhase) {
    case PHASE_START:
      renderStartScreen(p);
      break;
    case PHASE_PLAYING:
      renderPlaying(p);
      break;
    case PHASE_PAUSED:
      renderPlaying(p);
      renderPausedOverlay(p);
      break;
    case PHASE_GAME_OVER_WIN:
    case PHASE_GAME_OVER_LOSE:
      renderGameOver(p);
      break;
  }
}

function renderStartScreen(p) {
  // Desert ground
  p.fill(222, 184, 135);
  p.noStroke();
  p.rect(0, 250, CANVAS_WIDTH, 150);
  
  // Distant mountains
  p.fill(160, 120, 80, 150);
  drawMountain(p, 100, 250, 200);
  drawMountain(p, 300, 250, 250);
  drawMountain(p, 500, 250, 180);
  
  // Title
  p.fill(139, 69, 19);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("READY STEADY BANG", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(80, 40, 10);
  p.textSize(18);
  p.textStyle(p.NORMAL);
  p.text("A Wild West Quick-Draw Duel", CANVAS_WIDTH / 2, 120);
  
  // Instructions box
  p.fill(222, 184, 135, 230);
  p.stroke(139, 69, 19);
  p.strokeWeight(3);
  p.rect(100, 160, 400, 180, 10);
  
  p.noStroke();
  p.fill(80, 40, 10);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "OBJECTIVE:",
    "Face 10 increasingly skilled gunslingers.",
    "Wait for BANG! then press SPACE to draw.",
    "Draw too early and you'll FOUL!",
    "",
    "CONTROLS:",
    "SPACE - Draw your weapon (after BANG!)",
    "ESC - Pause/Unpause",
    "R - Return to title screen"
  ];
  
  let y = 170;
  instructions.forEach(line => {
    const isBold = line.endsWith(':');
    p.textStyle(isBold ? p.BOLD : p.NORMAL);
    p.text(line, 115, y);
    y += isBold ? 22 : 18;
  });
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.textStyle(p.BOLD);
  p.fill(139, 69, 19);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 365);
  }
}

function renderPlaying(p) {
  // Desert ground
  p.fill(222, 184, 135);
  p.noStroke();
  p.rect(0, 250, CANVAS_WIDTH, 150);
  
  // Ground detail
  p.stroke(200, 170, 120, 80);
  p.strokeWeight(2);
  for (let i = 0; i < 20; i++) {
    const x = (i * 50 + p.frameCount * 0.5) % CANVAS_WIDTH;
    p.line(x, 280, x + 30, 290);
  }
  
  // Distant mountains
  p.noStroke();
  p.fill(160, 120, 80, 120);
  drawMountain(p, 100, 250, 200);
  drawMountain(p, 300, 250, 250);
  drawMountain(p, 500, 250, 180);
  
  // Draw entities (player and AI)
  gameState.entities.forEach(entity => {
    if (entity.draw) {
      entity.draw(p);
    }
  });
  
  // HUD
  renderHUD(p);
  
  // Duel phase indicators
  renderDuelPhase(p);
}

function renderHUD(p) {
  // Score and round info
  p.fill(255, 255, 255, 200);
  p.noStroke();
  p.rect(10, 10, 200, 60, 5);
  
  p.fill(80, 40, 10);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.textStyle(p.BOLD);
  p.text(`ROUND: ${gameState.currentRound}/${gameState.totalRounds}`, 20, 18);
  p.text(`WINS: ${gameState.roundsWon}`, 20, 36);
  p.text(`SCORE: ${gameState.score}`, 20, 54);
  
  // AI info
  const ai = gameState.entities[1];
  if (ai) {
    p.fill(255, 255, 255, 200);
    p.rect(390, 10, 200, 40, 5);
    p.fill(139, 0, 0);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`GUNSLINGER #${ai.level}`, 580, 18);
    p.textSize(12);
    p.textStyle(p.NORMAL);
    p.text(`Skill Level: ${ai.level}/10`, 580, 36);
  }
}

function renderDuelPhase(p) {
  const centerX = CANVAS_WIDTH / 2;
  let message = "";
  let messageColor = [80, 40, 10];
  let messageSize = 48;
  
  switch (gameState.duelPhase) {
    case DUEL_INTRO:
      message = "GET READY...";
      messageSize = 36;
      break;
    case DUEL_READY:
      message = "READY...";
      messageColor = [139, 69, 19];
      break;
    case DUEL_STEADY:
      message = "STEADY...";
      messageColor = [184, 134, 11];
      break;
    case DUEL_WAIT:
      message = "...";
      messageSize = 60;
      messageColor = [160, 82, 45];
      break;
    case DUEL_BANG:
      message = "BANG!";
      messageColor = [220, 20, 60];
      messageSize = 64;
      
      // Dramatic flash effect
      if (gameState.duelTimer < 20) {
        p.fill(255, 255, 0, 100 - gameState.duelTimer * 5);
        p.noStroke();
        p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
      break;
    case DUEL_RESULT:
      if (gameState.playerFouled) {
        message = "FOUL! YOU LOSE!";
        messageColor = [139, 0, 0];
      } else if (gameState.aiFouled) {
        message = "OPPONENT FOULED! YOU WIN!";
        messageColor = [0, 128, 0];
        messageSize = 32;
      } else if (gameState.roundWinner === 'player') {
        message = "YOU WIN!";
        messageColor = [0, 128, 0];
      } else {
        message = "YOU LOSE!";
        messageColor = [139, 0, 0];
      }
      
      // Show times
      if (gameState.playerDrawTime !== null || gameState.aiDrawTime !== null) {
        p.fill(255, 255, 255, 200);
        p.noStroke();
        p.rect(centerX - 150, 140, 300, 60, 5);
        
        p.fill(80, 40, 10);
        p.textSize(16);
        p.textAlign(p.CENTER, p.TOP);
        if (gameState.playerDrawTime !== null) {
          p.text(`Your Time: ${gameState.playerDrawTime}ms`, centerX, 148);
        } else {
          p.text(`You: FOUL`, centerX, 148);
        }
        if (gameState.aiDrawTime !== null) {
          p.text(`Opponent: ${gameState.aiDrawTime}ms`, centerX, 170);
        } else {
          p.text(`Opponent: FOUL`, centerX, 170);
        }
      }
      break;
  }
  
  if (message) {
    // Shadow
    p.fill(0, 0, 0, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(messageSize);
    p.textStyle(p.BOLD);
    p.text(message, centerX + 3, 113);
    
    // Main text
    p.fill(...messageColor);
    p.text(message, centerX, 110);
  }
}

function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(18);
  p.textStyle(p.NORMAL);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  
  // Small paused indicator in top right
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function renderGameOver(p) {
  // Desert ground
  p.fill(222, 184, 135);
  p.noStroke();
  p.rect(0, 250, CANVAS_WIDTH, 150);
  
  // Mountains
  p.fill(160, 120, 80, 150);
  drawMountain(p, 100, 250, 200);
  drawMountain(p, 300, 250, 250);
  drawMountain(p, 500, 250, 180);
  
  // Result box
  p.fill(222, 184, 135, 240);
  p.stroke(139, 69, 19);
  p.strokeWeight(4);
  p.rect(100, 80, 400, 240, 10);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.noStroke();
  p.fill(isWin ? [34, 139, 34] : [139, 0, 0]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text(isWin ? "VICTORY!" : "DEFEATED", CANVAS_WIDTH / 2, 130);
  
  // Message
  p.fill(80, 40, 10);
  p.textSize(18);
  p.textStyle(p.NORMAL);
  if (isWin) {
    p.text("You've become the Legendary Gunfighter!", CANVAS_WIDTH / 2, 180);
    p.text(`All ${gameState.totalRounds} gunslingers defeated!`, CANVAS_WIDTH / 2, 205);
  } else {
    p.text(`Defeated at Round ${gameState.currentRound}`, CANVAS_WIDTH / 2, 180);
    p.text("Better luck next time, partner.", CANVAS_WIDTH / 2, 205);
  }
  
  // Stats
  p.textSize(16);
  p.textStyle(p.BOLD);
  p.text(`Rounds Won: ${gameState.roundsWon}/${gameState.currentRound}`, CANVAS_WIDTH / 2, 240);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 265);
  
  // Restart prompt
  p.textSize(20);
  p.fill(139, 69, 19);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 300);
  }
}

function drawMountain(p, x, y, width) {
  p.beginShape();
  p.vertex(x - width / 2, y);
  p.vertex(x, y - width * 0.6);
  p.vertex(x + width / 2, y);
  p.endShape(p.CLOSE);
}