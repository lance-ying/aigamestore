import { gameState, GAME_PHASES, NODE_TYPES } from './globals.js';

function getTestWinAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return null;
  
  const puzzle = gameState.puzzles[gameState.currentPuzzle];
  
  // Find input and output nodes
  let inputNode = null;
  let outputNode = null;
  let computeNodes = [];
  
  for (const node of gameState.nodes) {
    if (node.type === NODE_TYPES.INPUT) inputNode = node;
    if (node.type === NODE_TYPES.OUTPUT) outputNode = node;
    if (node.type === NODE_TYPES.COMPUTE) computeNodes.push(node);
  }
  
  if (!inputNode || !outputNode || computeNodes.length === 0) return null;
  
  // Strategy: Program the first compute node to solve the puzzle
  const mainNode = computeNodes[0];
  
  // Check if node already has instructions
  if (mainNode.instructions.length === 0) {
    // Program based on puzzle
    const puzzleName = puzzle.name;
    
    if (puzzleName === "SELF-TEST DIAGNOSTIC") {
      // Simple pass-through
      return { instruction: "MOV UP DOWN" };
    } else if (puzzleName === "SIGNAL AMPLIFIER") {
      // Double the input
      return { instruction: mainNode.instructions.length === 0 ? "MOV UP ACC" :
               mainNode.instructions.length === 1 ? "ADD ACC" :
               mainNode.instructions.length === 2 ? "MOV ACC DOWN" :
               "MOV UP ACC" };
    } else if (puzzleName === "DIFFERENTIAL CONVERTER") {
      // Output difference between consecutive inputs
      if (mainNode.instructions.length === 0) return { instruction: "MOV UP ACC" };
      if (mainNode.instructions.length === 1) return { instruction: "SAV" };
      if (mainNode.instructions.length === 2) return { instruction: "LOOP:" };
      if (mainNode.instructions.length === 3) return { instruction: "MOV UP ACC" };
      if (mainNode.instructions.length === 4) return { instruction: "SUB BAK" };
      if (mainNode.instructions.length === 5) return { instruction: "MOV ACC DOWN" };
      if (mainNode.instructions.length === 6) return { instruction: "SWP" };
      if (mainNode.instructions.length === 7) return { instruction: "JMP LOOP" };
    } else if (puzzleName === "SIGNAL COMPARATOR") {
      // Output 1 if > 5, else 0
      if (mainNode.instructions.length === 0) return { instruction: "LOOP:" };
      if (mainNode.instructions.length === 1) return { instruction: "MOV UP ACC" };
      if (mainNode.instructions.length === 2) return { instruction: "SUB 5" };
      if (mainNode.instructions.length === 3) return { instruction: "JGZ GREATER" };
      if (mainNode.instructions.length === 4) return { instruction: "MOV 0 DOWN" };
      if (mainNode.instructions.length === 5) return { instruction: "JMP LOOP" };
      if (mainNode.instructions.length === 6) return { instruction: "GREATER:" };
      if (mainNode.instructions.length === 7) return { instruction: "MOV 1 DOWN" };
      if (mainNode.instructions.length === 8) return { instruction: "JMP LOOP" };
    }
  }
  
  // Wait for puzzle completion
  return null;
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return null;
  
  const actions = [
    { keyCode: 37, key: 'ArrowLeft', type: 'keyPressed' },
    { keyCode: 39, key: 'ArrowRight', type: 'keyPressed' },
    { keyCode: 38, key: 'ArrowUp', type: 'keyPressed' },
    { keyCode: 40, key: 'ArrowDown', type: 'keyPressed' },
    { keyCode: 32, key: ' ', type: 'keyPressed' },
  ];
  
  const rand = Math.floor(Math.random() * actions.length);
  return actions[rand];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getRandomAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;