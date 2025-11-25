// game_logic.js - Core game logic

import { gameState, GAME_PHASES } from './globals.js';
import { Path } from './path.js';

export function initializeLevel(nodes) {
  gameState.nodes = nodes;
  gameState.paths = [];
  gameState.currentPath = null;
  gameState.cursor.nodeIndex = 0;
  gameState.moves = 0;
}

export function findAdjacentNodes(currentNode, nodes) {
  const adjacent = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node === currentNode) continue;
    
    const dx = Math.abs(node.x - currentNode.x);
    const dy = Math.abs(node.y - currentNode.y);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 100) {
      adjacent.push({ node, index: i, distance });
    }
  }
  
  adjacent.sort((a, b) => a.distance - b.distance);
  return adjacent;
}

export function moveCursor(direction) {
  const currentNode = gameState.nodes[gameState.cursor.nodeIndex];
  const adjacent = findAdjacentNodes(currentNode, gameState.nodes);
  
  if (adjacent.length === 0) return;
  
  let targetNode = null;
  
  switch (direction) {
    case 'UP':
      targetNode = adjacent.filter(a => a.node.y < currentNode.y)
        .sort((a, b) => a.node.y - b.node.y)[0];
      break;
    case 'DOWN':
      targetNode = adjacent.filter(a => a.node.y > currentNode.y)
        .sort((a, b) => b.node.y - a.node.y)[0];
      break;
    case 'LEFT':
      targetNode = adjacent.filter(a => a.node.x < currentNode.x)
        .sort((a, b) => a.node.x - b.node.x)[0];
      break;
    case 'RIGHT':
      targetNode = adjacent.filter(a => a.node.x > currentNode.x)
        .sort((a, b) => b.node.x - a.node.x)[0];
      break;
  }
  
  if (targetNode) {
    gameState.cursor.nodeIndex = targetNode.index;
  }
}

export function selectNode() {
  const node = gameState.nodes[gameState.cursor.nodeIndex];
  
  // If no current path, start a new one
  if (!gameState.currentPath) {
    if (node.canAcceptConnection()) {
      gameState.currentPath = new Path(node, node.shapeType);
      return true;
    }
  } else {
    // Try to extend current path
    if (gameState.currentPath.canConnectTo(node)) {
      gameState.currentPath.addNode(node);
      
      // Complete the path if both ends are connected
      if (gameState.currentPath.nodes.length >= 2) {
        const firstNode = gameState.currentPath.nodes[0];
        const lastNode = gameState.currentPath.getLastNode();
        
        // If we've connected back to a shape of the same type, finalize
        if (lastNode !== firstNode && lastNode.shapeType === firstNode.shapeType) {
          finalizePath();
        }
      }
      return true;
    } else if (gameState.currentPath.containsNode(node)) {
      // Clicked on a node in current path - finalize or cancel
      if (gameState.currentPath.nodes.length >= 2) {
        finalizePath();
      } else {
        gameState.currentPath = null;
      }
      return true;
    }
  }
  
  return false;
}

export function finalizePath() {
  if (!gameState.currentPath || gameState.currentPath.nodes.length < 2) {
    gameState.currentPath = null;
    return;
  }
  
  // Add path to completed paths
  gameState.paths.push(gameState.currentPath);
  
  // Update node connections
  for (const node of gameState.currentPath.nodes) {
    node.addConnection(gameState.currentPath);
  }
  
  gameState.currentPath = null;
  gameState.moves++;
  
  checkWinCondition();
}

export function undoLastPath() {
  if (gameState.currentPath) {
    // Cancel current path in progress
    gameState.currentPath = null;
    return;
  }
  
  if (gameState.paths.length === 0) return;
  
  // Remove last completed path
  const lastPath = gameState.paths.pop();
  
  // Remove connections from nodes
  for (const node of lastPath.nodes) {
    node.removeConnection(lastPath);
  }
  
  gameState.moves++;
}

export function checkWinCondition() {
  // Check if all nodes are complete
  for (const node of gameState.nodes) {
    if (!node.isComplete) {
      return false;
    }
  }
  
  // All nodes complete - win!
  gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
  gameState.score += 1000 - (gameState.moves * 10);
  gameState.levelsCompleted++;
  gameState.totalMoves += gameState.moves;
  return true;
}

export function nextLevel(generator) {
  gameState.currentLevel++;
  const nodes = generator.generateLevel(gameState.currentLevel);
  initializeLevel(nodes);
  gameState.gamePhase = GAME_PHASES.PLAYING;
}