// renderer.js - Rendering functions

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED, 
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  TURN_STATE_CHOOSE_ACTION,
  TURN_STATE_CHOOSE_TARGET,
  TURN_STATE_ANIMATING
} from './globals.js';
import { ITEM_NAMES } from './items.js';
import { getRemainingShells, countRemainingLive, countRemainingBlank } from './shotgun.js';

export function drawStartScreen(p) {
  p.background(20, 15, 25);
  
  // Title
  p.fill(220, 50, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("SHOTGUN STANDOFF", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200);
  p.textSize(16);
  p.text("Face The Dealer in a deadly game of Russian Roulette", CANVAS_WIDTH / 2, 140);
  p.text("Win 2 rounds to survive. Lose all health and it's over.", CANVAS_WIDTH / 2, 165);
  
  // Instructions
  p.textSize(14);
  p.fill(180);
  p.text("HOW TO PLAY:", CANVAS_WIDTH / 2, 210);
  p.textSize(12);
  p.fill(160);
  p.text("Arrow Keys: Navigate menu", CANVAS_WIDTH / 2, 235);
  p.text("Space: Confirm selection", CANVAS_WIDTH / 2, 255);
  p.text("Z: Quick shoot yourself", CANVAS_WIDTH / 2, 275);
  p.text("Shift: Quick shoot dealer", CANVAS_WIDTH / 2, 295);
  p.text("Use items wisely to gain advantage", CANVAS_WIDTH / 2, 315);
  
  // Prompt
  p.fill(220, 200, 50);
  p.textSize(20);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  }
}

export function drawPlayingScreen(p) {
  p.background(25, 20, 30);
  
  // Draw table/arena
  drawArena(p);
  
  // Draw players
  drawPlayer(p, gameState.player);
  drawPlayer(p, gameState.dealer);
  
  // Draw shotgun in center
  drawShotgun(p);
  
  // Draw UI
  drawUI(p);
  
  // Draw menu overlay if player's turn
  if (gameState.currentTurn === "PLAYER" && gameState.turnState !== TURN_STATE_ANIMATING) {
    drawPlayerMenu(p);
  }
  
  // Draw animation overlay
  if (gameState.turnState === TURN_STATE_ANIMATING) {
    drawAnimation(p);
  }
}

function drawArena(p) {
  // Dark table
  p.fill(40, 30, 35);
  p.rect(50, 150, 500, 200);
  
  // Table edge highlight
  p.stroke(60, 50, 55);
  p.strokeWeight(3);
  p.line(50, 150, 550, 150);
  p.noStroke();
  
  // Ambient lines
  for (let i = 0; i < 5; i++) {
    p.stroke(60, 50, 55, 50);
    p.strokeWeight(1);
    p.line(50, 170 + i * 40, 550, 170 + i * 40);
  }
  p.noStroke();
}

function drawPlayer(p, player) {
  const isActive = (player.isDealer && gameState.currentTurn === "DEALER") || 
                   (!player.isDealer && gameState.currentTurn === "PLAYER");
  
  // Character silhouette
  p.push();
  p.translate(player.x, player.y);
  
  // Glow if active
  if (isActive) {
    p.fill(220, 200, 100, 30);
    p.ellipse(0, 0, player.width + 20, player.height + 20);
  }
  
  // Body
  p.fill(player.isDealer ? 180 : 100, player.isDealer ? 70 : 100, player.isDealer ? 70 : 220);
  p.rect(-player.width / 2, -player.height / 2, player.width, player.height * 0.6, 5);
  
  // Head
  p.ellipse(0, -player.height / 2 + 10, player.width * 0.6, player.width * 0.6);
  
  // Face details
  p.fill(255, 200, 200);
  p.ellipse(0, -player.height / 2 + 10, player.width * 0.5, player.width * 0.5);
  
  // Eyes
  p.fill(50);
  p.ellipse(-8, -player.height / 2 + 8, 4, 6);
  p.ellipse(8, -player.height / 2 + 8, 4, 6);
  
  p.pop();
  
  // Health bar
  const barWidth = 80;
  const barHeight = 10;
  const barX = player.x - barWidth / 2;
  const barY = player.y + 60;
  
  p.fill(100, 30, 30);
  p.rect(barX, barY, barWidth, barHeight);
  
  const healthPercent = player.health / 4;
  p.fill(220, 50, 50);
  p.rect(barX, barY, barWidth * healthPercent, barHeight);
  
  // Name
  p.fill(200);
  p.textAlign(p.CENTER);
  p.textSize(14);
  p.text(player.name, player.x, player.y + 85);
  p.text(`HP: ${player.health}`, player.x, player.y + 100);
}

function drawShotgun(p) {
  p.push();
  p.translate(CANVAS_WIDTH / 2, 250);
  
  // Barrel
  p.fill(60, 60, 70);
  p.rect(-50, -8, 100, 16, 3);
  
  if (gameState.sawedOff) {
    p.fill(220, 180, 50);
    p.rect(-50, -12, 100, 4);
    p.rect(-50, 12, 100, 4);
  }
  
  // Stock
  p.fill(80, 60, 40);
  p.rect(-70, -10, 25, 20, 3);
  
  // Trigger guard
  p.noFill();
  p.stroke(60, 60, 70);
  p.strokeWeight(2);
  p.arc(-20, 0, 15, 20, 0, p.PI);
  p.noStroke();
  
  p.pop();
}

function drawUI(p) {
  // Round info
  p.fill(200);
  p.textAlign(p.LEFT);
  p.textSize(16);
  p.text(`Round ${gameState.currentRound}`, 20, 30);
  p.text(`You: ${gameState.playerRoundsWon} | Dealer: ${gameState.dealerRoundsWon}`, 20, 50);
  
  // Shell info
  p.textAlign(p.RIGHT);
  p.text(`Shells: ${getRemainingShells()}`, CANVAS_WIDTH - 20, 30);
  p.textSize(12);
  p.fill(220, 50, 50);
  p.text(`Live: ${countRemainingLive()}`, CANVAS_WIDTH - 20, 50);
  p.fill(100, 150, 220);
  p.text(`Blank: ${countRemainingBlank()}`, CANVAS_WIDTH - 20, 65);
  
  // Known shell info
  if (gameState.knownNextShell) {
    p.fill(220, 220, 100);
    p.textAlign(p.CENTER);
    p.textSize(14);
    p.text(`Next: ${gameState.knownNextShell}`, CANVAS_WIDTH / 2, 320);
  }
  
  // Turn indicator
  p.fill(200);
  p.textAlign(p.CENTER);
  p.textSize(18);
  const turnText = gameState.currentTurn === "PLAYER" ? "YOUR TURN" : "DEALER'S TURN";
  p.text(turnText, CANVAS_WIDTH / 2, 380);
}

function drawPlayerMenu(p) {
  if (gameState.turnState === TURN_STATE_CHOOSE_ACTION) {
    // Menu background
    p.fill(20, 20, 30, 230);
    p.rect(180, 100, 240, 200);
    
    p.fill(220, 200, 100);
    p.textAlign(p.LEFT);
    p.textSize(16);
    p.text("ACTIONS", 200, 130);
    
    // Shoot option
    const shootSelected = gameState.menuSelection === 0;
    p.fill(shootSelected ? 220 : 180);
    p.textSize(14);
    p.text("> Shoot", 200, 160);
    
    // Items
    for (let i = 0; i < gameState.playerItems.length; i++) {
      const selected = gameState.menuSelection === i + 1;
      p.fill(selected ? 220 : 180);
      const itemName = ITEM_NAMES[gameState.playerItems[i]];
      p.text(`> Use ${itemName}`, 200, 185 + i * 25);
    }
  } else if (gameState.turnState === TURN_STATE_CHOOSE_TARGET) {
    // Target selection
    p.fill(20, 20, 30, 230);
    p.rect(200, 150, 200, 100);
    
    p.fill(220, 200, 100);
    p.textAlign(p.CENTER);
    p.textSize(16);
    p.text("CHOOSE TARGET", CANVAS_WIDTH / 2, 180);
    
    p.textSize(14);
    p.fill(gameState.targetSelection === 0 ? 220 : 180);
    p.text("Yourself", CANVAS_WIDTH / 2 - 50, 220);
    p.fill(gameState.targetSelection === 1 ? 220 : 180);
    p.text("Dealer", CANVAS_WIDTH / 2 + 50, 220);
  }
}

function drawAnimation(p) {
  gameState.animationFrame++;
  
  // Darken screen
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Message
  const alpha = p.map(gameState.animationFrame, 0, gameState.animationMaxFrames, 255, 0);
  p.fill(220, 220, 220, alpha);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text(gameState.animationMessage, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // End animation
  if (gameState.animationFrame >= gameState.animationMaxFrames) {
    gameState.turnState = TURN_STATE_CHOOSE_ACTION;
    gameState.animationFrame = 0;
  }
}

export function drawPausedScreen(p) {
  drawPlayingScreen(p);
  
  // Pause overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(220, 220, 220);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 20, 20);
}

export function drawGameOverScreen(p) {
  p.background(20, 15, 25);
  
  const won = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.fill(won ? 100 : 220, won ? 220 : 50, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(won ? "YOU SURVIVED!" : "GAME OVER", CANVAS_WIDTH / 2, 120);
  
  // Message
  p.fill(200);
  p.textSize(20);
  if (won) {
    p.text("You defeated The Dealer!", CANVAS_WIDTH / 2, 180);
    p.text(`Rounds Won: ${gameState.playerRoundsWon}`, CANVAS_WIDTH / 2, 220);
  } else {
    p.text("The Dealer wins...", CANVAS_WIDTH / 2, 180);
    p.text(`Rounds Won: ${gameState.playerRoundsWon}`, CANVAS_WIDTH / 2, 220);
  }
  
  // Restart prompt
  p.fill(220, 200, 50);
  p.textSize(18);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 300);
  }
}

export function render(p) {
  switch (gameState.gamePhase) {
    case PHASE_START:
      drawStartScreen(p);
      break;
    case PHASE_PLAYING:
      drawPlayingScreen(p);
      break;
    case PHASE_PAUSED:
      drawPausedScreen(p);
      break;
    case PHASE_GAME_OVER_WIN:
    case PHASE_GAME_OVER_LOSE:
      drawGameOverScreen(p);
      break;
  }
}