// ui.js - UI rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CHARACTERS, PHASE_START, 
         PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';

export function renderStartScreen(p) {
  p.push();
  
  // Title
  p.fill(255);
  p.textAlign(p.CENTER);
  p.textSize(48);
  p.text("RIVALS OF AETHER", CANVAS_WIDTH/2, 80);
  
  // Subtitle
  p.textSize(20);
  p.fill(200, 220, 255);
  p.text("Platform Fighter", CANVAS_WIDTH/2, 115);
  
  // Description
  p.textSize(14);
  p.fill(220);
  p.text("Battle as elemental warriors!", CANVAS_WIDTH/2, 160);
  p.text("First to 3 KOs wins the match!", CANVAS_WIDTH/2, 180);
  
  // Character selection
  p.textSize(16);
  p.fill(255, 255, 100);
  p.text("Choose your fighter:", CANVAS_WIDTH/2, 220);
  
  // Character display
  for (let i = 0; i < CHARACTERS.length; i++) {
    const char = CHARACTERS[i];
    const x = 100 + i * 120;
    const y = 250;
    
    // Highlight selected
    if (i === gameState.selectedCharacter) {
      p.fill(255, 255, 100, 100);
      p.rect(x - 35, y - 10, 70, 80, 5);
    }
    
    // Character preview
    p.fill(...char.color);
    p.rect(x - 15, y, 30, 40, 5);
    p.fill(...char.accentColor);
    p.ellipse(x + 8, y + 12, 6, 6);
    
    // Name
    p.fill(255);
    p.textSize(10);
    p.text(char.element, x, y + 55);
  }
  
  p.textSize(12);
  p.fill(200);
  p.text("Use LEFT/RIGHT arrows to select", CANVAS_WIDTH/2, 310);
  
  // Controls
  p.textSize(14);
  p.fill(255);
  p.text("CONTROLS:", CANVAS_WIDTH/2, 340);
  p.textSize(11);
  p.fill(220);
  p.text("Arrow Keys: Move/Jump", CANVAS_WIDTH/2, 358);
  p.text("SPACE: Light Attack | Z: Strong Attack | SHIFT: Special", CANVAS_WIDTH/2, 373);
  
  // Start prompt
  p.textSize(18);
  p.fill(255, 255, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 395);
  
  p.pop();
}

export function renderGameUI(p) {
  p.push();
  
  // Player info (left side)
  if (gameState.player && gameState.player.isAlive) {
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.LEFT);
    p.text(`P1: ${gameState.player.character.element}`, 10, 25);
    
    // Lives/KOs
    p.textSize(14);
    p.text(`KOs: ${gameState.playerKOs}`, 10, 45);
    
    // Stock icons
    for (let i = 0; i < gameState.player.lives; i++) {
      p.fill(...gameState.player.character.color);
      p.ellipse(15 + i * 20, 60, 15, 15);
    }
  }
  
  // Opponent info (right side)
  if (gameState.opponent && gameState.opponent.isAlive) {
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.RIGHT);
    p.text(`CPU: ${gameState.opponent.character.element}`, CANVAS_WIDTH - 10, 25);
    
    p.textSize(14);
    p.text(`KOs: ${gameState.opponentKOs}`, CANVAS_WIDTH - 10, 45);
    
    // Stock icons
    for (let i = 0; i < gameState.opponent.lives; i++) {
      p.fill(...gameState.opponent.character.color);
      p.ellipse(CANVAS_WIDTH - 15 - i * 20, 60, 15, 15);
    }
  }
  
  // Round start countdown
  if (gameState.roundStartTimer > 0) {
    p.textAlign(p.CENTER);
    p.textSize(48);
    p.fill(255, 255, 100);
    if (gameState.roundStartTimer > 45) {
      p.text("3", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    } else if (gameState.roundStartTimer > 30) {
      p.text("2", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    } else if (gameState.roundStartTimer > 15) {
      p.text("1", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    } else {
      p.text("FIGHT!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    }
  }
  
  p.pop();
}

export function renderPauseOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(18);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  
  p.pop();
}

export function renderGameOverScreen(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Result
  p.textAlign(p.CENTER);
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("VICTORY!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    
    p.fill(255);
    p.textSize(24);
    p.text(`You defeated your opponent!`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    p.text(`Final Score: ${gameState.playerKOs} - ${gameState.opponentKOs}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 45);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("DEFEAT", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    
    p.fill(255);
    p.textSize(24);
    p.text(`Your opponent won!`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    p.text(`Final Score: ${gameState.playerKOs} - ${gameState.opponentKOs}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 45);
  }
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH/2, CANVAS_HEIGHT - 50);
  
  p.pop();
}