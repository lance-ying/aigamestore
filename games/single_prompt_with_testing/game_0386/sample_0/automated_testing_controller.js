// automated_testing_controller.js - Automated testing strategies

import { GAME_PHASES } from './globals.js';

function getRandomAction(gameState) {
  const actions = [
    { key: 'ArrowLeft', keyCode: 37 },
    { key: 'ArrowUp', keyCode: 38 },
    { key: 'ArrowRight', keyCode: 39 },
    { key: 'ArrowDown', keyCode: 40 },
    { key: ' ', keyCode: 32 }
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

function getTestBasicAction(gameState) {
  // Test basic movement and selection
  if (!gameState.actionCount) gameState.actionCount = 0;
  gameState.actionCount++;
  
  const cycle = gameState.actionCount % 20;
  
  if (cycle < 4) return { key: 'ArrowRight', keyCode: 39 };
  if (cycle < 8) return { key: 'ArrowDown', keyCode: 40 };
  if (cycle < 12) return { key: 'ArrowLeft', keyCode: 37 };
  if (cycle < 16) return { key: 'ArrowUp', keyCode: 38 };
  if (cycle === 16) return { key: ' ', keyCode: 32 };
  if (cycle === 18) return { key: 'z', keyCode: 90 };
  
  return null;
}

function findNodeByType(nodes, shapeType, excludeComplete = true) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].shapeType === shapeType) {
      if (excludeComplete && nodes[i].isComplete) continue;
      return i;
    }
  }
  return -1;
}

function findPath(startIdx, endIdx, nodes, visited = new Set()) {
  if (startIdx === endIdx) return [startIdx];
  
  visited.add(startIdx);
  const startNode = nodes[startIdx];
  
  // Find adjacent nodes
  const adjacent = [];
  for (let i = 0; i < nodes.length; i++) {
    if (visited.has(i)) continue;
    const node = nodes[i];
    const dx = Math.abs(node.x - startNode.x);
    const dy = Math.abs(node.y - startNode.y);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 100) {
      adjacent.push({ index: i, distance });
    }
  }
  
  adjacent.sort((a, b) => a.distance - b.distance);
  
  for (const adj of adjacent) {
    const subPath = findPath(adj.index, endIdx, nodes, new Set(visited));
    if (subPath) {
      return [startIdx, ...subPath];
    }
  }
  
  return null;
}

function getDirectionToNode(fromIdx, toIdx, nodes) {
  const from = nodes[fromIdx];
  const to = nodes[toIdx];
  
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
  } else {
    return dy > 0 ? { key: 'ArrowDown', keyCode: 40 } : { key: 'ArrowUp', keyCode: 38 };
  }
}

function getTestWinAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return null;
  
  // Initialize strategy state
  if (!gameState.strategyState) {
    gameState.strategyState = {
      phase: 'INIT',
      targetPath: null,
      pathIndex: 0,
      waitFrames: 0
    };
  }
  
  const state = gameState.strategyState;
  
  // Wait a frame after actions
  if (state.waitFrames > 0) {
    state.waitFrames--;
    return null;
  }
  
  // Find incomplete node pairs
  const incompleteNodes = gameState.nodes.map((n, i) => ({ node: n, index: i }))
    .filter(n => !n.node.isComplete);
  
  if (incompleteNodes.length === 0) {
    // Puzzle complete
    return null;
  }
  
  if (state.phase === 'INIT' || state.phase === 'COMPLETE') {
    // Find next pair to connect
    const shapeTypes = {};
    for (const item of incompleteNodes) {
      const type = item.node.shapeType;
      if (!shapeTypes[type]) shapeTypes[type] = [];
      shapeTypes[type].push(item);
    }
    
    // Find a pair of same type
    for (const type in shapeTypes) {
      if (shapeTypes[type].length >= 2) {
        const start = shapeTypes[type][0];
        const end = shapeTypes[type][1];
        
        // Find path between them
        const path = findPath(start.index, end.index, gameState.nodes);
        if (path) {
          state.targetPath = path;
          state.pathIndex = 0;
          state.phase = 'NAVIGATE';
          break;
        }
      }
    }
    
    if (!state.targetPath) {
      // Can't find valid path, try random
      return getRandomAction(gameState);
    }
  }
  
  if (state.phase === 'NAVIGATE') {
    const currentNodeIdx = gameState.cursor.nodeIndex;
    const targetIdx = state.targetPath[state.pathIndex];
    
    if (currentNodeIdx === targetIdx) {
      // Reached target node, select it
      state.pathIndex++;
      state.waitFrames = 2;
      
      if (state.pathIndex >= state.targetPath.length) {
        // Path complete
        state.phase = 'COMPLETE';
        state.targetPath = null;
        state.pathIndex = 0;
      }
      
      return { key: ' ', keyCode: 32 };
    } else {
      // Move towards target
      return getDirectionToNode(currentNodeIdx, targetIdx, gameState.nodes);
    }
  }
  
  return null;
}

function getTestPathAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return null;
  
  if (!gameState.testPathState) {
    gameState.testPathState = {
      step: 0,
      waitFrames: 0
    };
  }
  
  const state = gameState.testPathState;
  
  if (state.waitFrames > 0) {
    state.waitFrames--;
    return null;
  }
  
  const sequence = [
    { key: ' ', keyCode: 32 },  // Select first
    { key: 'ArrowRight', keyCode: 39 },
    { key: ' ', keyCode: 32 },  // Select second
    { key: 'z', keyCode: 90 },  // Undo
    { key: 'ArrowDown', keyCode: 40 },
    { key: ' ', keyCode: 32 },  // Select
    { key: 'ArrowRight', keyCode: 39 },
    { key: ' ', keyCode: 32 }   // Select
  ];
  
  if (state.step >= sequence.length) {
    state.step = 0;
  }
  
  state.waitFrames = 5;
  return sequence[state.step++];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestPathAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;