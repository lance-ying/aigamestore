import { gameState, NODE_TYPES } from './globals.js';
import { Node } from './node.js';
import { PUZZLES } from './puzzles.js';

export function initializePuzzles() {
  gameState.puzzles = PUZZLES;
  gameState.currentPuzzle = 0;
}

export function loadPuzzle(puzzleIndex) {
  if (puzzleIndex < 0 || puzzleIndex >= gameState.puzzles.length) {
    return false;
  }
  
  const puzzle = gameState.puzzles[puzzleIndex];
  gameState.currentPuzzle = puzzleIndex;
  
  // Clear existing nodes
  gameState.nodes = [];
  gameState.selectedNode = null;
  gameState.selectedInstructionIndex = 0;
  gameState.editMode = false;
  
  // Create nodes based on layout
  const startX = 50;
  const startY = 50;
  const spacing = 90;
  
  let nodeId = 0;
  for (let row = 0; row < puzzle.gridHeight; row++) {
    for (let col = 0; col < puzzle.gridWidth; col++) {
      const nodeType = puzzle.nodeLayout[row][col];
      const x = startX + col * spacing;
      const y = startY + row * spacing;
      
      const node = new Node(x, y, nodeType, nodeId++);
      gameState.nodes.push(node);
    }
  }
  
  // Connect neighbors
  for (let row = 0; row < puzzle.gridHeight; row++) {
    for (let col = 0; col < puzzle.gridWidth; col++) {
      const index = row * puzzle.gridWidth + col;
      const node = gameState.nodes[index];
      
      if (col > 0) {
        node.neighbors.LEFT = gameState.nodes[row * puzzle.gridWidth + (col - 1)];
      }
      if (col < puzzle.gridWidth - 1) {
        node.neighbors.RIGHT = gameState.nodes[row * puzzle.gridWidth + (col + 1)];
      }
      if (row > 0) {
        node.neighbors.UP = gameState.nodes[(row - 1) * puzzle.gridWidth + col];
      }
      if (row < puzzle.gridHeight - 1) {
        node.neighbors.DOWN = gameState.nodes[(row + 1) * puzzle.gridWidth + col];
      }
    }
  }
  
  // Initialize input/output queues
  gameState.inputQueue = [...puzzle.inputs];
  gameState.outputQueue = [];
  gameState.expectedOutputs = [...puzzle.expectedOutputs];
  gameState.outputIndex = 0;
  gameState.cycleCount = 0;
  gameState.totalCycles = 0;
  gameState.puzzleComplete = false;
  
  // Select first compute node
  for (const node of gameState.nodes) {
    if (node.type === NODE_TYPES.COMPUTE) {
      gameState.selectedNode = node;
      break;
    }
  }
  
  return true;
}

export function resetPuzzle() {
  const puzzle = gameState.puzzles[gameState.currentPuzzle];
  
  // Reset all nodes
  for (const node of gameState.nodes) {
    node.reset();
  }
  
  // Reset queues
  gameState.inputQueue = [...puzzle.inputs];
  gameState.outputQueue = [];
  gameState.outputIndex = 0;
  gameState.cycleCount = 0;
  gameState.totalCycles = 0;
  gameState.puzzleComplete = false;
}

export function executeStep() {
  const puzzle = gameState.puzzles[gameState.currentPuzzle];
  
  // Feed input nodes
  for (const node of gameState.nodes) {
    if (node.type === NODE_TYPES.INPUT && !node.hasValue && gameState.inputQueue.length > 0) {
      node.value = gameState.inputQueue.shift();
      node.hasValue = true;
    }
  }
  
  // Execute all compute nodes
  for (const node of gameState.nodes) {
    if (node.type === NODE_TYPES.COMPUTE) {
      node.blocked = false;
    }
  }
  
  for (const node of gameState.nodes) {
    node.step();
  }
  
  // Collect outputs
  for (const node of gameState.nodes) {
    if (node.type === NODE_TYPES.OUTPUT && node.hasValue) {
      gameState.outputQueue.push(node.value);
      node.hasValue = false;
      node.value = null;
    }
  }
  
  gameState.cycleCount++;
  
  // Check if puzzle is complete
  if (gameState.outputQueue.length >= gameState.expectedOutputs.length) {
    let correct = true;
    for (let i = 0; i < gameState.expectedOutputs.length; i++) {
      if (gameState.outputQueue[i] !== gameState.expectedOutputs[i]) {
        correct = false;
        break;
      }
    }
    
    if (correct) {
      gameState.puzzleComplete = true;
      gameState.totalCycles = gameState.cycleCount;
    }
  }
}

export function getCurrentPuzzle() {
  return gameState.puzzles[gameState.currentPuzzle];
}