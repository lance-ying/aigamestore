// maze_manager.js
import { gameState } from './globals.js';
import { MazeNode } from './entities.js';

export function generateMaze(level) {
  gameState.mazeNodes = [];
  gameState.exploredNodes.clear();
  gameState.currentMazeLevel = level;
  
  // Generate initial node
  const startNode = new MazeNode(300, 350, 0, "empty");
  startNode.explored = true;
  startNode.cleared = true;
  gameState.mazeNodes.push(startNode);
  gameState.currentNode = startNode;
  gameState.exploredNodes.add(0);
  
  // Generate connected nodes
  generateConnectedNodes(startNode, level);
}

function generateConnectedNodes(node, level, depth = 0) {
  if (depth >= level * 2) return;
  
  const numConnections = Math.floor(Math.random() * 2) + 2; // 2-3 connections
  
  for (let i = 0; i < numConnections; i++) {
    const angle = (Math.PI * 2 / numConnections) * i + Math.random() * 0.5;
    const distance = 60 + Math.random() * 40;
    const newX = node.x + Math.cos(angle) * distance;
    const newY = node.y - Math.sin(angle) * distance * 0.5 - 30;
    
    // Keep within bounds
    const clampedX = Math.max(50, Math.min(550, newX));
    const clampedY = Math.max(50, Math.min(350, newY));
    
    const newNode = new MazeNode(clampedX, clampedY, node.depth + 1);
    gameState.mazeNodes.push(newNode);
    
    node.addConnection(newNode);
    newNode.addConnection(node);
    
    if (Math.random() < 0.6 && depth < level * 2 - 1) {
      generateConnectedNodes(newNode, level, depth + 1);
    }
  }
}

export function moveToNode(nodeIndex) {
  if (nodeIndex < 0 || nodeIndex >= gameState.mazeNodes.length) return false;
  
  const targetNode = gameState.mazeNodes[nodeIndex];
  
  // Check if connected to current node
  if (!gameState.currentNode.connections.includes(targetNode)) return false;
  
  gameState.currentNode = targetNode;
  
  if (!targetNode.explored) {
    targetNode.explored = true;
    gameState.exploredNodes.add(nodeIndex);
    gameState.mazeDepth = Math.max(gameState.mazeDepth, targetNode.depth);
  }
  
  return true;
}

export function interactWithNode() {
  const node = gameState.currentNode;
  
  if (node.cleared) return { success: true, message: "Already cleared" };
  
  if (node.type === "empty") {
    node.cleared = true;
    return { success: true, message: "Empty room" };
  }
  
  if (node.type === "rest") {
    // Heal all adventurers
    for (let adv of gameState.adventurers) {
      adv.heal(30);
    }
    node.cleared = true;
    return { success: true, message: "Team rested and healed!" };
  }
  
  if (node.type === "treasure") {
    if (node.reward) {
      if (node.reward.type === "material") {
        gameState.materials[node.reward.material] += node.reward.amount;
        gameState.score += node.reward.amount;
      } else if (node.reward.type === "score") {
        gameState.score += node.reward.amount;
      }
    }
    node.cleared = true;
    return { success: true, message: "Treasure found!" };
  }
  
  if (node.type === "enemy" || node.type === "boss") {
    return combatWithEnemy(node);
  }
  
  return { success: false, message: "Unknown node type" };
}

function combatWithEnemy(node) {
  if (gameState.adventurers.length === 0) {
    return { success: false, message: "No adventurers to fight!" };
  }
  
  const enemy = node.enemy;
  let enemyHp = enemy.hp;
  
  // Simple combat: team attacks enemy
  let totalDamage = 0;
  for (let adv of gameState.adventurers) {
    if (adv.currentHp > 0) {
      totalDamage += adv.getTotalAtk();
    }
  }
  
  enemyHp -= totalDamage;
  
  // Enemy attacks back
  if (enemyHp > 0) {
    // Distribute damage
    for (let adv of gameState.adventurers) {
      if (adv.currentHp > 0) {
        const died = adv.takeDamage(enemy.atk);
        if (died) {
          return { success: false, message: "Adventurer defeated! Retreat to castle." };
        }
      }
    }
    return { success: false, message: "Enemy still alive! Need more power." };
  } else {
    node.cleared = true;
    const reward = Math.floor(enemy.hp / 2);
    gameState.score += reward;
    gameState.materials.iron += reward / 2;
    return { success: true, message: `${enemy.name} defeated!` };
  }
}

export function returnToCastle() {
  // Heal adventurers partially
  for (let adv of gameState.adventurers) {
    adv.heal(20);
  }
}