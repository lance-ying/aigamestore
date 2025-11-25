import { gameState, GRID_SIZE, MATERIAL_TYPES } from './globals.js';
import { Material } from './entities.js';

export function updateGame(p) {
  if (gameState.gamePhase !== "PLAYING") return;

  // Spawn materials
  gameState.framesSinceLastSpawn++;
  if (gameState.framesSinceLastSpawn >= gameState.spawnInterval) {
    gameState.framesSinceLastSpawn = 0;
    spawnMaterials();
  }

  // Update components
  for (const component of gameState.components) {
    component.update();
  }

  // Update materials
  for (const material of gameState.materials) {
    material.update(gameState.components);
  }

  // Check materials at goals
  checkGoals(p);

  // Remove out of bounds materials
  gameState.materials = gameState.materials.filter(m => {
    return m.active && m.x >= -GRID_SIZE && m.x < 600 + GRID_SIZE &&
           m.y >= -GRID_SIZE && m.y < 400 + GRID_SIZE;
  });

  // Check win condition
  if (gameState.deliveredProducts >= gameState.requiredProducts && !gameState.levelComplete) {
    gameState.levelComplete = true;
    nextLevel(p);
  }

  // Log player info periodically
  if (p.frameCount % 30 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.cursorX * GRID_SIZE,
      screen_y: gameState.cursorY * GRID_SIZE,
      game_x: gameState.cursorX,
      game_y: gameState.cursorY,
      framecount: p.frameCount
    });
  }
}

function spawnMaterials() {
  for (const spawner of gameState.spawners) {
    const material = new Material(
      spawner.gridX * GRID_SIZE,
      spawner.gridY * GRID_SIZE,
      MATERIAL_TYPES.RAW
    );
    gameState.materials.push(material);
  }
}

function checkGoals(p) {
  for (const goal of gameState.goals) {
    const goalX = goal.gridX * GRID_SIZE;
    const goalY = goal.gridY * GRID_SIZE;

    for (let i = gameState.materials.length - 1; i >= 0; i--) {
      const material = gameState.materials[i];
      const gridX = Math.floor(material.x / GRID_SIZE);
      const gridY = Math.floor(material.y / GRID_SIZE);

      if (gridX === goal.gridX && gridY === goal.gridY) {
        // Check if material type matches goal requirement
        if (material.type === goal.requiredType) {
          gameState.deliveredProducts++;
          gameState.score += 100;
          gameState.materials.splice(i, 1);
        } else {
          // Wrong type - remove but no credit
          gameState.materials.splice(i, 1);
        }
      }
    }
  }
}

function nextLevel(p) {
  if (gameState.level < 4) {
    gameState.level++;
    gameState.deliveredProducts = 0;
    gameState.levelComplete = false;
    gameState.materials = [];
    gameState.components = [];
    gameState.buildMode = false;
    
    const { getCurrentLevel } = await import('./levels.js');
    const level = getCurrentLevel(gameState.level);
    setupLevel(level);

    p.logs.game_info.push({
      data: { event: "level_complete", new_level: gameState.level },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    gameState.gamePhase = "GAME_OVER_WIN";
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", final_score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function setupLevel(levelData) {
  gameState.requiredProducts = levelData.requiredProducts;
  gameState.spawners = levelData.spawners.map(s => {
    const { Spawner } = require('./entities.js');
    return new Spawner(s.x, s.y);
  });
  gameState.goals = levelData.goals.map(g => {
    const { Goal } = require('./entities.js');
    return new Goal(g.x, g.y, g.type);
  });
}