// renderer.js - Rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 30, 40);
  
  // Title with shadow effect
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(0, 0, 0, 100);
  p.textSize(36);
  p.text("Die drei ??? - Chamäleonbande", CANVAS_WIDTH/2 + 3, 83);
  p.fill(100, 200, 100);
  p.text("Die drei ??? - Chamäleonbande", CANVAS_WIDTH/2, 80);
  
  // Description
  p.fill(200);
  p.textSize(14);
  p.text("Solve the mystery of the Chameleon Gang!", CANVAS_WIDTH/2, 140);
  p.text("Collect evidence, interrogate suspects, and solve puzzles.", CANVAS_WIDTH/2, 165);
  
  // Instructions box
  p.fill(40, 50, 60);
  p.rect(100, 200, 400, 130, 10);
  
  p.fill(255, 220, 100);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text("HOW TO PLAY:", 120, 215);
  
  p.fill(220);
  p.textSize(12);
  p.text("• Arrow Keys: Navigate and select options", 120, 240);
  p.text("• SPACE: Interact with hotspots and confirm", 120, 260);
  p.text("• Z: Open/close case file", 120, 280);
  p.text("• Collect all clues, solve puzzles, interrogate suspects!", 120, 300);
  
  // Start prompt
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const alpha = Math.sin(p.frameCount * 0.1) * 127 + 128;
  p.fill(255, 255, 0, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 360);
}

export function renderPlayingScreen(p) {
  const currentLoc = gameState.locations[gameState.currentLocation];
  
  // Render location
  currentLoc.render(p);
  
  // Render hotspots
  currentLoc.hotspots.forEach(hotspot => {
    const isSelected = gameState.selectedHotspot === hotspot;
    hotspot.render(p, isSelected);
  });
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Render UI
  renderUI(p);
  
  // Render dialogue if active
  if (gameState.dialogueState) {
    renderDialogue(p);
  }
  
  // Render puzzle if active
  if (gameState.puzzleActive !== null) {
    renderPuzzle(p);
  }
  
  // Render case file if open
  if (gameState.showCaseFile) {
    renderCaseFile(p);
  }
}

function renderUI(p) {
  // Score and progress
  p.fill(0, 0, 0, 150);
  p.rect(10, CANVAS_HEIGHT - 50, 250, 40, 5);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  p.text(`Score: ${gameState.score}`, 20, CANVAS_HEIGHT - 35);
  
  // Progress indicators
  const clueProgress = `${gameState.requiredCluesCollected}/${gameState.totalClues}`;
  const suspectProgress = `${gameState.requiredSuspectsInterrogated}/${gameState.totalSuspects}`;
  const puzzleProgress = `${gameState.requiredPuzzlesSolved}/${gameState.totalPuzzles}`;
  
  p.textSize(10);
  p.text(`Clues: ${clueProgress} | Suspects: ${suspectProgress} | Puzzles: ${puzzleProgress}`, 20, CANVAS_HEIGHT - 20);
  
  // Hint
  if (gameState.selectedHotspot) {
    p.fill(0, 0, 0, 150);
    p.rect(CANVAS_WIDTH - 260, CANVAS_HEIGHT - 40, 250, 30, 5);
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(11);
    p.text("Press SPACE to interact", CANVAS_WIDTH - 135, CANVAS_HEIGHT - 25);
  }
}

function renderDialogue(p) {
  const suspect = gameState.suspects[gameState.dialogueState.suspectId];
  const currentNode = suspect.dialogue[gameState.dialogueState.currentNode];
  
  // Dialogue box
  p.fill(0, 0, 0, 200);
  p.rect(50, CANVAS_HEIGHT - 150, CANVAS_WIDTH - 100, 120, 10);
  
  // Suspect name
  p.fill(255, 200, 100);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(suspect.name, 70, CANVAS_HEIGHT - 140);
  
  // Dialogue text
  p.fill(255);
  p.textSize(12);
  const lines = wrapText(p, currentNode.text, CANVAS_WIDTH - 140);
  let yPos = CANVAS_HEIGHT - 115;
  lines.forEach(line => {
    p.text(line, 70, yPos);
    yPos += 16;
  });
  
  // Continue prompt
  p.fill(255, 255, 0);
  p.textAlign(p.RIGHT, p.BOTTOM);
  p.textSize(10);
  p.text("SPACE to continue", CANVAS_WIDTH - 70, CANVAS_HEIGHT - 45);
}

function renderPuzzle(p) {
  const puzzle = gameState.puzzles[gameState.puzzleActive.puzzleId];
  
  // Puzzle background
  p.fill(30, 40, 50, 240);
  p.rect(100, 100, 400, 200, 10);
  
  // Title
  p.fill(255, 200, 100);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  let title = "Code Puzzle";
  if (puzzle.type === 'document') title = "Document Assembly";
  else if (puzzle.type === 'fingerprint') title = "Fingerprint Match";
  p.text(title, 300, 120);
  
  // Instructions
  p.fill(220);
  p.textSize(11);
  p.text("Use Arrow Keys to adjust, SPACE to submit", 300, 150);
  
  // Puzzle input
  const startX = 200;
  const startY = 190;
  const boxSize = 40;
  const spacing = 50;
  
  for (let i = 0; i < puzzle.solution.length; i++) {
    const x = startX + i * spacing;
    
    // Box
    if (i === gameState.puzzleActive.cursorPos) {
      p.fill(100, 150, 255);
      p.stroke(255, 255, 100);
      p.strokeWeight(3);
    } else {
      p.fill(60, 70, 80);
      p.stroke(100);
      p.strokeWeight(1);
    }
    p.rect(x, startY, boxSize, boxSize, 5);
    
    // Number
    p.noStroke();
    p.fill(255);
    p.textSize(24);
    const num = gameState.puzzleActive.currentInput[i] !== undefined ? 
                gameState.puzzleActive.currentInput[i] : '-';
    p.text(num, x + boxSize/2, startY + boxSize/2);
  }
  
  p.noStroke();
}

function renderCaseFile(p) {
  // Case file background
  p.fill(240, 230, 210, 250);
  p.rect(80, 50, 440, 300, 10);
  
  // Title
  p.fill(80, 40, 20);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(20);
  p.text("CASE FILE", 300, 70);
  
  // Sections
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.fill(0);
  
  let yPos = 110;
  
  // Collected Clues
  p.textSize(14);
  p.fill(150, 50, 50);
  p.text("Evidence Collected:", 100, yPos);
  yPos += 25;
  
  p.textSize(11);
  p.fill(0);
  gameState.collectedClues.forEach(clueId => {
    const clue = gameState.clues[clueId];
    p.text(`• ${clue.name}`, 110, yPos);
    yPos += 18;
  });
  
  yPos += 10;
  
  // Interrogated Suspects
  p.textSize(14);
  p.fill(150, 50, 50);
  p.text("Suspects Interrogated:", 100, yPos);
  yPos += 25;
  
  p.textSize(11);
  p.fill(0);
  gameState.interrogatedSuspects.forEach(suspectId => {
    const suspect = gameState.suspects[suspectId];
    p.text(`• ${suspect.name}`, 110, yPos);
    yPos += 18;
  });
  
  // Close instruction
  p.fill(100);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(10);
  p.text("Press Z to close", 300, 335);
}

export function renderPausedScreen(p) {
  renderPlayingScreen(p);
  
  // Pause indicator
  p.fill(255, 255, 0);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function renderGameOverScreen(p) {
  p.background(20, 30, 40);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  if (isWin) {
    p.fill(100, 255, 100);
    p.textSize(40);
    p.text("CASE SOLVED!", CANVAS_WIDTH/2, 100);
    
    p.fill(200);
    p.textSize(16);
    p.text("You've successfully identified the Chameleon Gang!", CANVAS_WIDTH/2, 160);
    p.text("The culprits have been apprehended.", CANVAS_WIDTH/2, 185);
  } else {
    p.fill(255, 100, 100);
    p.textSize(40);
    p.text("CASE UNSOLVED", CANVAS_WIDTH/2, 100);
  }
  
  // Final score
  p.fill(255, 220, 100);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 240);
  
  // Stats
  p.fill(200);
  p.textSize(14);
  p.text(`Clues Collected: ${gameState.requiredCluesCollected}/${gameState.totalClues}`, CANVAS_WIDTH/2, 280);
  p.text(`Suspects Interrogated: ${gameState.requiredSuspectsInterrogated}/${gameState.totalSuspects}`, CANVAS_WIDTH/2, 300);
  p.text(`Puzzles Solved: ${gameState.requiredPuzzlesSolved}/${gameState.totalPuzzles}`, CANVAS_WIDTH/2, 320);
  
  // Restart prompt
  p.fill(255, 255, 0);
  p.textSize(18);
  const alpha = Math.sin(p.frameCount * 0.1) * 127 + 128;
  p.fill(255, 255, 0, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH/2, 360);
}

function wrapText(p, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const testWidth = p.textWidth(testLine);
    
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}