import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, NODE_TYPES } from './globals.js';
import { getCurrentPuzzle } from './puzzleManager.js';
import { getCursorVisible, getTypingBuffer } from './input.js';

export function drawStartScreen(p) {
  p.background(20, 20, 30);
  
  // Title
  p.fill(0, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("TIS-100 REPAIR", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(150, 200, 150);
  p.textSize(14);
  p.text("TESSELLATED INTELLIGENCE SYSTEM", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(200, 200, 220);
  p.textSize(12);
  p.textAlign(p.CENTER, p.CENTER);
  const desc = [
    "Program corrupted nodes to process data streams.",
    "Use assembly-like instructions to transform inputs.",
    "Complete puzzles to repair the TIS-100!"
  ];
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], CANVAS_WIDTH / 2, 160 + i * 20);
  }
  
  // Instructions
  p.fill(100, 255, 200);
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "ARROW KEYS: Navigate nodes/instructions",
    "SPACE: Toggle edit mode",
    "Z: Clear instruction",
    "SHIFT: Reset puzzle",
    "ESC: Pause",
    "R: Restart"
  ];
  let yPos = 240;
  for (const inst of instructions) {
    p.text(inst, 50, yPos);
    yPos += 18;
  }
  
  // Available instructions
  p.fill(255, 200, 100);
  p.textSize(11);
  p.textAlign(p.RIGHT, p.TOP);
  const ops = [
    "MOV src dst - Move value",
    "ADD src - Add to ACC",
    "SUB src - Subtract from ACC",
    "JMP lbl - Jump to label",
    "JEZ/JNZ/JGZ/JLZ lbl - Conditional jump",
    "SAV/SWP - Save/Swap ACC and BAK"
  ];
  yPos = 240;
  for (const op of ops) {
    p.text(op, CANVAS_WIDTH - 50, yPos);
    yPos += 18;
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function drawPlayingScreen(p) {
  p.background(20, 20, 30);
  
  const puzzle = getCurrentPuzzle();
  
  // Draw puzzle info
  p.fill(0, 255, 100);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`PUZZLE ${gameState.currentPuzzle + 1}: ${puzzle.name}`, 10, 10);
  
  p.fill(150, 200, 150);
  p.textSize(10);
  p.text(puzzle.description, 10, 30);
  
  // Draw cycle count
  p.fill(200, 200, 220);
  p.textSize(10);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`CYCLES: ${gameState.cycleCount}`, CANVAS_WIDTH - 10, 10);
  
  // Draw nodes
  for (const node of gameState.nodes) {
    drawNode(p, node);
  }
  
  // Draw connections
  p.stroke(50, 50, 70);
  p.strokeWeight(1);
  for (const node of gameState.nodes) {
    if (node.neighbors.RIGHT && node.neighbors.RIGHT.type !== NODE_TYPES.DAMAGED) {
      p.line(node.x + node.width, node.y + node.height / 2,
             node.neighbors.RIGHT.x, node.neighbors.RIGHT.y + node.neighbors.RIGHT.height / 2);
    }
    if (node.neighbors.DOWN && node.neighbors.DOWN.type !== NODE_TYPES.DAMAGED) {
      p.line(node.x + node.width / 2, node.y + node.height,
             node.neighbors.DOWN.x + node.neighbors.DOWN.width / 2, node.neighbors.DOWN.y);
    }
  }
  
  // Draw instruction panel for selected node
  if (gameState.selectedNode && gameState.selectedNode.type === NODE_TYPES.COMPUTE) {
    drawInstructionPanel(p);
  }
  
  // Draw input/output status
  drawIOStatus(p, puzzle);
  
  // Puzzle complete message
  if (gameState.puzzleComplete) {
    p.fill(0, 255, 100, 200);
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("PUZZLE COMPLETE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.textSize(14);
    p.text(`Cycles: ${gameState.totalCycles}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  }
}

export function drawPausedScreen(p) {
  drawPlayingScreen(p);
  
  // Overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255, 255, 100);
  p.textSize(12);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 30);
}

export function drawGameOverScreen(p) {
  p.background(20, 20, 30);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [0, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text(isWin ? "SYSTEM REPAIRED" : "SYSTEM FAILURE", CANVAS_WIDTH / 2, 120);
  
  // Message
  p.fill(200, 200, 220);
  p.textSize(16);
  if (isWin) {
    p.text("All puzzles completed!", CANVAS_WIDTH / 2, 180);
    p.text(`Total Puzzles: ${gameState.currentPuzzle + 1}`, CANVAS_WIDTH / 2, 210);
  } else {
    p.text("Unable to complete repair", CANVAS_WIDTH / 2, 180);
  }
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
}

function drawNode(p, node) {
  const isSelected = node === gameState.selectedNode;
  
  // Node background
  if (node.type === NODE_TYPES.DAMAGED) {
    p.fill(40, 20, 20);
    p.stroke(60, 30, 30);
  } else if (node.type === NODE_TYPES.INPUT) {
    p.fill(20, 40, 60);
    p.stroke(40, 80, 120);
  } else if (node.type === NODE_TYPES.OUTPUT) {
    p.fill(60, 40, 20);
    p.stroke(120, 80, 40);
  } else {
    p.fill(...(isSelected ? [40, 50, 40] : [30, 30, 40]));
    p.stroke(...(isSelected ? [0, 255, 100] : [60, 60, 80]));
  }
  
  p.strokeWeight(isSelected ? 2 : 1);
  p.rect(node.x, node.y, node.width, node.height);
  
  // Node content
  p.textSize(8);
  p.textAlign(p.LEFT, p.TOP);
  
  if (node.type === NODE_TYPES.DAMAGED) {
    p.fill(100, 50, 50);
    p.text("XXX", node.x + 5, node.y + 5);
  } else if (node.type === NODE_TYPES.INPUT) {
    p.fill(100, 150, 200);
    p.text("IN", node.x + 5, node.y + 5);
    if (node.hasValue) {
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(node.value, node.x + node.width / 2, node.y + node.height / 2);
    }
  } else if (node.type === NODE_TYPES.OUTPUT) {
    p.fill(200, 150, 100);
    p.text("OUT", node.x + 5, node.y + 5);
    if (node.hasValue) {
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(node.value, node.x + node.width / 2, node.y + node.height / 2);
    }
  } else {
    // Compute node
    p.fill(150, 150, 170);
    p.text(`ID:${node.id}`, node.x + 5, node.y + 5);
    
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    p.fill(200, 200, 220);
    p.text(`A:${node.acc}`, node.x + 5, node.y + 15);
    p.text(`B:${node.bak}`, node.x + 5, node.y + 25);
    
    // Program counter indicator
    if (node.instructions.length > 0) {
      p.fill(0, 255, 100);
      p.text(`>${node.pc}`, node.x + 5, node.y + 35);
    }
    
    // Blocked indicator
    if (node.blocked) {
      p.fill(255, 100, 100);
      p.textSize(8);
      p.textAlign(p.RIGHT, p.BOTTOM);
      p.text("BLK", node.x + node.width - 5, node.y + node.height - 5);
    }
  }
}

function drawInstructionPanel(p) {
  const node = gameState.selectedNode;
  const panelX = 320;
  const panelY = 50;
  const panelW = 260;
  const panelH = 340;
  
  // Panel background
  p.fill(25, 25, 35);
  p.stroke(60, 60, 80);
  p.strokeWeight(1);
  p.rect(panelX, panelY, panelW, panelH);
  
  // Title
  p.fill(0, 255, 100);
  p.textSize(10);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`NODE ${node.id} INSTRUCTIONS`, panelX + 5, panelY + 5);
  
  // Mode indicator
  p.fill(255, 200, 100);
  p.textSize(9);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(gameState.editMode ? "[EDIT]" : "[NAV]", panelX + panelW - 5, panelY + 5);
  
  // Instructions list
  p.textSize(9);
  p.textAlign(p.LEFT, p.TOP);
  let yPos = panelY + 25;
  
  for (let i = 0; i < node.maxInstructions; i++) {
    const isActive = i === gameState.selectedInstructionIndex;
    const isPC = i === node.pc && !gameState.editMode;
    
    // Line background
    if (isActive && gameState.editMode) {
      p.fill(40, 50, 40);
      p.noStroke();
      p.rect(panelX + 2, yPos - 2, panelW - 4, 12);
    }
    
    // Line number
    p.fill(...(isPC ? [255, 100, 100] : [100, 100, 120]));
    p.text(`${i}:`, panelX + 5, yPos);
    
    // Instruction
    if (i < node.instructions.length) {
      p.fill(...(isActive ? [255, 255, 200] : [200, 200, 220]));
      p.text(node.instructions[i], panelX + 25, yPos);
    } else if (i === gameState.selectedInstructionIndex && gameState.editMode) {
      // Show typing buffer
      p.fill(255, 255, 200);
      const displayText = getTypingBuffer() + (getCursorVisible() ? '_' : '');
      p.text(displayText, panelX + 25, yPos);
    }
    
    yPos += 12;
  }
  
  // Help text
  p.fill(150, 150, 170);
  p.textSize(8);
  p.textAlign(p.LEFT, p.TOP);
  yPos = panelY + panelH - 40;
  p.text("SPACE: Toggle edit mode", panelX + 5, yPos);
  yPos += 10;
  p.text("ARROWS: Navigate", panelX + 5, yPos);
  yPos += 10;
  p.text("Z: Clear line", panelX + 5, yPos);
  yPos += 10;
  p.text("SHIFT: Reset puzzle", panelX + 5, yPos);
}

function drawIOStatus(p, puzzle) {
  const statusX = 10;
  const statusY = CANVAS_HEIGHT - 90;
  
  // Input queue
  p.fill(100, 150, 200);
  p.textSize(9);
  p.textAlign(p.LEFT, p.TOP);
  p.text("INPUT:", statusX, statusY);
  p.fill(200, 200, 220);
  p.text(gameState.inputQueue.slice(0, 10).join(', '), statusX + 40, statusY);
  
  // Output queue
  p.fill(200, 150, 100);
  p.text("OUTPUT:", statusX, statusY + 15);
  p.fill(200, 200, 220);
  p.text(gameState.outputQueue.join(', '), statusX + 50, statusY + 15);
  
  // Expected output
  p.fill(0, 255, 100);
  p.text("EXPECTED:", statusX, statusY + 30);
  p.fill(200, 200, 220);
  p.text(puzzle.expectedOutputs.join(', '), statusX + 60, statusY + 30);
  
  // Match status
  if (gameState.outputQueue.length > 0) {
    let matches = 0;
    for (let i = 0; i < Math.min(gameState.outputQueue.length, puzzle.expectedOutputs.length); i++) {
      if (gameState.outputQueue[i] === puzzle.expectedOutputs[i]) {
        matches++;
      }
    }
    
    const color = matches === gameState.outputQueue.length ? [0, 255, 100] : [255, 200, 100];
    p.fill(...color);
    p.text(`MATCH: ${matches}/${puzzle.expectedOutputs.length}`, statusX, statusY + 45);
  }
}