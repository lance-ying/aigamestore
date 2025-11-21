// testing.js - Automated testing controllers

import { gameState, GAME_PHASE } from './globals.js';

export class TestController {
  constructor(type) {
    this.type = type;
    this.actionQueue = [];
    this.actionDelay = 0;
    this.initialized = false;
  }

  update(p) {
    if (gameState.gamePhase === GAME_PHASE.START && !this.initialized) {
      this.initialize(p);
      this.initialized = true;
    }

    if (this.actionDelay > 0) {
      this.actionDelay--;
      return null;
    }

    if (this.actionQueue.length > 0) {
      const action = this.actionQueue.shift();
      this.actionDelay = action.delay || 5;
      return action;
    }

    // Generate actions based on game state
    return this.generateAction(p);
  }

  initialize(p) {
    // Start game
    this.actionQueue.push({ keyCode: 13, delay: 30 }); // ENTER
  }

  generateAction(p) {
    if (gameState.gamePhase === GAME_PHASE.PLAYING) {
      return this.generatePlayingAction(p);
    }
    return null;
  }

  generatePlayingAction(p) {
    // Override in subclasses
    return null;
  }
}

export class BasicTestController extends TestController {
  constructor() {
    super('TEST_1');
  }

  generatePlayingAction(p) {
    if (!gameState.player || !gameState.currentMap) return null;

    const player = gameState.player;
    const map = gameState.currentMap;

    // If on event tile, interact
    const currentTile = map.getTileAt(player.gridX, player.gridY);
    if (gameState.needsInteraction) {
      return { keyCode: 32, delay: 20 }; // SPACE
    }

    // Move towards exit
    const dx = map.exitX - player.gridX;
    const dy = map.exitY - player.gridY;

    if (Math.abs(dx) > Math.abs(dy)) {
      return { keyCode: dx > 0 ? 39 : 37, delay: 8 }; // RIGHT or LEFT
    } else {
      return { keyCode: dy > 0 ? 40 : 38, delay: 8 }; // DOWN or UP
    }
  }
}

export class WinTestController extends TestController {
  constructor() {
    super('TEST_2');
    this.pathfindingAttempts = 0;
  }

  generatePlayingAction(p) {
    if (!gameState.player || !gameState.currentMap) return null;

    const player = gameState.player;
    const map = gameState.currentMap;

    // If on event tile, interact
    if (gameState.needsInteraction) {
      return { keyCode: 32, delay: 15 }; // SPACE
    }

    // Smart pathfinding towards exit
    const path = this.findPath(player.gridX, player.gridY, map.exitX, map.exitY, map);
    
    if (path && path.length > 1) {
      const nextStep = path[1];
      const dx = nextStep.x - player.gridX;
      const dy = nextStep.y - player.gridY;

      if (dx > 0) return { keyCode: 39, delay: 6 }; // RIGHT
      if (dx < 0) return { keyCode: 37, delay: 6 }; // LEFT
      if (dy > 0) return { keyCode: 40, delay: 6 }; // DOWN
      if (dy < 0) return { keyCode: 38, delay: 6 }; // UP
    }

    // Fallback: random valid move
    const validMoves = [];
    if (player.canMoveTo(player.gridX - 1, player.gridY, map)) validMoves.push(37);
    if (player.canMoveTo(player.gridX + 1, player.gridY, map)) validMoves.push(39);
    if (player.canMoveTo(player.gridX, player.gridY - 1, map)) validMoves.push(38);
    if (player.canMoveTo(player.gridX, player.gridY + 1, map)) validMoves.push(40);

    if (validMoves.length > 0) {
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      return { keyCode: randomMove, delay: 6 };
    }

    return null;
  }

  findPath(startX, startY, endX, endY, map) {
    // Simple A* pathfinding
    const openSet = [{ x: startX, y: startY, g: 0, h: this.heuristic(startX, startY, endX, endY), parent: null }];
    const closedSet = new Set();

    while (openSet.length > 0) {
      openSet.sort((a, b) => (a.g + a.h) - (b.g + b.h));
      const current = openSet.shift();

      const key = `${current.x},${current.y}`;
      if (closedSet.has(key)) continue;
      closedSet.add(key);

      if (current.x === endX && current.y === endY) {
        return this.reconstructPath(current);
      }

      const neighbors = [
        { x: current.x - 1, y: current.y },
        { x: current.x + 1, y: current.y },
        { x: current.x, y: current.y - 1 },
        { x: current.x, y: current.y + 1 }
      ];

      for (const neighbor of neighbors) {
        if (neighbor.x < 0 || neighbor.x >= map.width || neighbor.y < 0 || neighbor.y >= map.height) continue;
        const tile = map.tiles[neighbor.y][neighbor.x];
        if (tile.type === 'WALL') continue;

        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (closedSet.has(neighborKey)) continue;

        const g = current.g + 1;
        const h = this.heuristic(neighbor.x, neighbor.y, endX, endY);
        openSet.push({ x: neighbor.x, y: neighbor.y, g, h, parent: current });
      }
    }

    return null;
  }

  heuristic(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  reconstructPath(node) {
    const path = [];
    while (node) {
      path.unshift({ x: node.x, y: node.y });
      node = node.parent;
    }
    return path;
  }
}