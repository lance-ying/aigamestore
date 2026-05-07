import { gameState, MONSTER_TYPES } from './globals.js';

export function generateDungeon(zone, p) {
  const width = 8;
  const height = 6;
  const map = [];
  
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const rand = p.random();
      let cell = { type: "empty", explored: false };
      
      if (x === 0 && y === 0) {
        cell.type = "start";
      } else if (x === width - 1 && y === height - 1) {
        cell.type = zone === 3 ? "arena" : "exit";
      } else if (rand < 0.15) {
        cell.type = "wall";
      } else if (rand < 0.4) {
        cell.type = "enemy";
        const monsterIndex = Math.min(MONSTER_TYPES.length - 1, Math.floor(p.random() * (zone + 2)));
        cell.monsterType = MONSTER_TYPES[monsterIndex];
      } else if (rand < 0.5) {
        cell.type = "treasure";
        cell.treasure = { gold: Math.floor(p.random(10, 30)) * zone, materials: Math.floor(p.random(5, 15)) };
      } else if (rand < 0.55) {
        cell.type = "trap";
        cell.damage = 10 * zone;
      }
      
      row.push(cell);
    }
    map.push(row);
  }
  
  return map;
}

export function canMoveTo(map, x, y) {
  if (y < 0 || y >= map.length || x < 0 || x >= map[0].length) {
    return false;
  }
  return map[y][x].type !== "wall";
}

export function getTotalCells(map) {
  let total = 0;
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      if (map[y][x].type !== "wall") {
        total++;
      }
    }
  }
  return total;
}

export function getExploredCount() {
  return gameState.exploredCells.length;
}

export function isCellExplored(x, y) {
  return gameState.exploredCells.some(cell => cell.x === x && cell.y === y);
}

export function exploreCell(x, y) {
  if (!isCellExplored(x, y)) {
    gameState.exploredCells.push({ x, y });
    const progress = (gameState.exploredCells.length / getTotalCells(gameState.dungeonMap)) * 100;
    gameState.dungeonProgress = Math.floor(progress);
  }
}