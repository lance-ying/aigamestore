// rendering.js - Rendering functions

import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, gameState } from './globals.js';
import { getSpaceColor } from './board.js';

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.fill(255, 215, 0);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("DESTINS", CANVAS_WIDTH / 2, 80);
  
  p.textSize(20);
  p.fill(200, 200, 255);
  p.text("Le Jeu De La Vie 2", CANVAS_WIDTH / 2, 115);
  
  // Description
  p.textSize(14);
  p.fill(220);
  p.text("Navigate life's journey and make choices that shape your future!", CANVAS_WIDTH / 2, 160);
  p.text("Balance Knowledge, Wealth, and Happiness to win!", CANVAS_WIDTH / 2, 180);
  
  // Instructions
  p.textSize(12);
  p.fill(180, 220, 255);
  p.textAlign(p.LEFT, p.CENTER);
  
  const instructions = [
    "SPACE: Spin the wheel and move forward",
    "ARROW KEYS: Navigate choices",
    "Z: Confirm selection",
    "ESC: Pause game",
    "R: Restart from game over"
  ];
  
  let yPos = 220;
  instructions.forEach(instruction => {
    p.text(instruction, 180, yPos);
    yPos += 20;
  });
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.fill(100, 255, 100);
  const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(100, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

export function renderPausedIndicator(p) {
  p.fill(255, 255, 100);
  p.noStroke();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function renderGameOver(p) {
  p.background(20, 20, 40);
  
  const total = gameState.knowledge + gameState.wealth + gameState.happiness;
  
  // Title
  p.fill(255, 215, 0);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.text("RETIREMENT!", CANVAS_WIDTH / 2, 60);
  } else {
    p.text("GAME OVER", CANVAS_WIDTH / 2, 60);
  }
  
  // Final scores
  p.textSize(16);
  p.fill(220);
  p.text("Final Life Scores:", CANVAS_WIDTH / 2, 110);
  
  p.textAlign(p.LEFT, p.CENTER);
  p.fill(100, 150, 255);
  p.text("Knowledge:", 180, 150);
  p.fill(255);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(gameState.knowledge, 420, 150);
  
  p.textAlign(p.LEFT, p.CENTER);
  p.fill(255, 200, 50);
  p.text("Wealth:", 180, 180);
  p.fill(255);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(gameState.wealth, 420, 180);
  
  p.textAlign(p.LEFT, p.CENTER);
  p.fill(255, 100, 150);
  p.text("Happiness:", 180, 210);
  p.fill(255);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(gameState.happiness, 420, 210);
  
  // Total
  p.strokeWeight(2);
  p.stroke(255, 215, 0);
  p.line(180, 230, 420, 230);
  
  p.noStroke();
  p.textAlign(p.LEFT, p.CENTER);
  p.fill(255, 215, 0);
  p.textSize(20);
  p.text("Total Score:", 180, 260);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(total, 420, 260);
  
  // Unlocks
  if (gameState.unlockedCosmetics.length > 0) {
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.fill(150, 255, 150);
    p.text("Unlocked: " + gameState.unlockedCosmetics.join(", "), CANVAS_WIDTH / 2, 300);
  }
  
  // Restart prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(100, 255, 100, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
}

export function renderBoard(p, boardPath, currentPosition) {
  // Draw connections
  p.stroke(100, 100, 120);
  p.strokeWeight(3);
  for (let i = 0; i < boardPath.length - 1; i++) {
    const space = boardPath[i];
    const nextSpace = boardPath[i + 1];
    p.line(space.x, space.y, nextSpace.x, nextSpace.y);
  }
  
  // Draw spaces
  boardPath.forEach((space, index) => {
    const color = getSpaceColor(space.type);
    const isCurrent = index === currentPosition;
    
    p.fill(...color);
    p.stroke(50);
    p.strokeWeight(isCurrent ? 3 : 2);
    p.circle(space.x, space.y, isCurrent ? 18 : 14);
    
    // Space number
    if (index % 5 === 0 || isCurrent) {
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(8);
      p.text(index, space.x, space.y);
    }
  });
}

export function renderUI(p) {
  // Stats panel
  const panelX = 10;
  const panelY = 10;
  const panelW = 180;
  const panelH = 100;
  
  p.fill(30, 30, 50, 220);
  p.stroke(100, 100, 150);
  p.strokeWeight(2);
  p.rect(panelX, panelY, panelW, panelH, 8);
  
  // Stats
  p.noStroke();
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  
  p.fill(100, 150, 255);
  p.text("Knowledge:", panelX + 10, panelY + 20);
  p.fill(255);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(gameState.knowledge, panelX + panelW - 10, panelY + 20);
  
  p.textAlign(p.LEFT, p.CENTER);
  p.fill(255, 200, 50);
  p.text("Wealth:", panelX + 10, panelY + 45);
  p.fill(255);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(gameState.wealth, panelX + panelW - 10, panelY + 45);
  
  p.textAlign(p.LEFT, p.CENTER);
  p.fill(255, 100, 150);
  p.text("Happiness:", panelX + 10, panelY + 70);
  p.fill(255);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(gameState.happiness, panelX + panelW - 10, panelY + 70);
  
  // Turn counter
  const turnPanelX = CANVAS_WIDTH - 120;
  const turnPanelY = 10;
  p.fill(30, 30, 50, 220);
  p.stroke(100, 100, 150);
  p.strokeWeight(2);
  p.rect(turnPanelX, turnPanelY, 110, 35, 8);
  
  p.noStroke();
  p.fill(220);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  p.text("Turn:", turnPanelX + 10, turnPanelY + 17);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(gameState.turn, turnPanelX + 100, turnPanelY + 17);
}

export function renderEventDialog(p, event) {
  const dialogW = 400;
  const dialogH = 220;
  const dialogX = (CANVAS_WIDTH - dialogW) / 2;
  const dialogY = (CANVAS_HEIGHT - dialogH) / 2;
  
  // Background overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Dialog box
  p.fill(40, 40, 60);
  p.stroke(150, 150, 200);
  p.strokeWeight(3);
  p.rect(dialogX, dialogY, dialogW, dialogH, 10);
  
  // Title
  p.fill(255, 215, 0);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text(event.title, dialogX + dialogW / 2, dialogY + 30);
  
  // Description
  p.fill(220);
  p.textSize(14);
  p.text(event.description, dialogX + dialogW / 2, dialogY + 60);
  
  // Choices
  event.choices.forEach((choice, index) => {
    const choiceY = dialogY + 100 + index * 35;
    const isSelected = index === gameState.selectedChoice;
    
    p.fill(isSelected ? 80 : 50, isSelected ? 80 : 50, isSelected ? 100 : 70);
    p.stroke(isSelected ? 200 : 120, isSelected ? 200 : 120, isSelected ? 255 : 150);
    p.strokeWeight(2);
    p.rect(dialogX + 20, choiceY, dialogW - 40, 28, 5);
    
    p.fill(255);
    p.noStroke();
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(12);
    p.text(choice.text, dialogX + 30, choiceY + 14);
    
    // Show stat changes
    let statText = "";
    if (choice.knowledge) statText += `K:${choice.knowledge > 0 ? '+' : ''}${choice.knowledge} `;
    if (choice.wealth) statText += `W:${choice.wealth > 0 ? '+' : ''}${choice.wealth} `;
    if (choice.happiness) statText += `H:${choice.happiness > 0 ? '+' : ''}${choice.happiness}`;
    
    p.textAlign(p.RIGHT, p.CENTER);
    p.fill(180, 180, 220);
    p.textSize(10);
    p.text(statText, dialogX + dialogW - 30, choiceY + 14);
  });
  
  // Instructions
  p.fill(150, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(11);
  p.text("Use ARROW KEYS to select, press Z to confirm", dialogX + dialogW / 2, dialogY + dialogH - 20);
}

export function renderSpinPrompt(p, wheel) {
  // Spin prompt
  const promptY = CANVAS_HEIGHT - 80;
  
  if (!gameState.spinning && !gameState.moving && !gameState.showingEvent) {
    p.fill(50, 50, 80, 200);
    p.stroke(100, 150, 255);
    p.strokeWeight(2);
    p.rect(CANVAS_WIDTH / 2 - 100, promptY - 20, 200, 50, 8);
    
    const alpha = 150 + Math.sin(p.frameCount * 0.15) * 100;
    p.fill(100, 255, 100, alpha);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text("Press SPACE to Spin", CANVAS_WIDTH / 2, promptY);
  }
  
  // Draw wheel if spinning
  if (gameState.spinning || gameState.wheelSpinning) {
    wheel.draw(CANVAS_WIDTH / 2, 120, 50);
    
    if (!wheel.spinning && gameState.spinResult > 0) {
      p.fill(255, 215, 0);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(24);
      p.text(gameState.spinResult, CANVAS_WIDTH / 2, 120);
    }
  }
}