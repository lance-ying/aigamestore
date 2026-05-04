// input_handler.js - Input handling and control management

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN } from './globals.js';
import { gridDistance, isAdjacent } from './utils.js';
import {
  ENTITY_LANTERN, ENTITY_STELE, ENTITY_CRYSTAL, ENTITY_PLATFORM,
  ENTITY_ROBOT, ENTITY_CORE, ENTITY_EXIT, WATER_LEVEL_HIGH, WATER_LEVEL_MID, WATER_LEVEL_LOW, WATER_LEVEL_NONE
} from './globals.js';

export class InputHandler {
  constructor(p) {
    this.p = p;
    this.keysPressed = new Set();
  }

  handleKeyPressed(keyCode) {
    this.keysPressed.add(keyCode);

    // Log input
    this.p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: this.p.key, keyCode: keyCode },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });

    // Phase transitions
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === PHASE_START) {
        gameState.gamePhase = PHASE_PLAYING;
        this.p.logs.game_info.push({
          data: { phase: PHASE_PLAYING, level: gameState.currentLevel },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }

    if (keyCode === 27) { // ESC
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
        this.p.logs.game_info.push({
          data: { phase: PHASE_PAUSED },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
        this.p.logs.game_info.push({
          data: { phase: PHASE_PLAYING },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }

    if (keyCode === 82) { // R
      if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_START;
        gameState.currentLevel = 1;
        this.p.logs.game_info.push({
          data: { phase: PHASE_START, restart: true },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }

    // Gameplay controls (only in PLAYING phase)
    if (gameState.gamePhase !== PHASE_PLAYING) return;
    if (gameState.controlMode !== "HUMAN") return;

    this.handleGameplayInput(keyCode);
  }

  handleGameplayInput(keyCode) {
    const player = gameState.player;
    if (!player || player.isMoving) return;

    // Arrow keys - Move one tile in direction
    if (keyCode >= 37 && keyCode <= 40) {
      this.handleMovement(keyCode);
    }

    // Space - Activate/interact with entity at current position
    if (keyCode === 32) {
      this.handleActivation();
    }

    // Shift - Skip level (debug)
    if (keyCode === 16) {
      if (gameState.currentLevel < gameState.maxLevel) {
        gameState.currentLevel++;
        gameState.transition.active = true;
        gameState.transition.progress = 0;
      }
    }
  }

  handleMovement(keyCode) {
    const player = gameState.player;
    let targetX = player.gridX;
    let targetY = player.gridY;

    // Determine target position based on arrow key
    if (keyCode === 37) targetX -= 1; // Left
    if (keyCode === 38) targetY -= 1; // Up
    if (keyCode === 39) targetX += 1;  // Right
    if (keyCode === 40) targetY += 1;  // Down

    // Check if target is within grid bounds
    if (targetX < 1 || targetX > 9 || targetY < 1 || targetY > 6) {
      return;
    }

    // Check if target position is accessible based on water level
    if (!this.isTileAccessible(targetX, targetY)) {
      return;
    }

    // Move player
    if (player.moveTo(targetX, targetY)) {
      gameState.moves++;
      this.logPlayerPosition();
      
      // Auto-collect cores and auto-interact with entities at new position
      this.autoInteractAtPosition(targetX, targetY);
    }
  }

  isTileAccessible(gridX, gridY) {
    // Check if tile is accessible based on current water level
    // Higher water levels block more of the grid
    const waterLevel = gameState.waterLevel;
    
    // Get terrain height at this position
    const terrainHeight = this.getTerrainHeight(gridX, gridY);
    
    // Tile is accessible if terrain height is >= water level requirement
    return terrainHeight >= this.getWaterLevelRequirement(waterLevel);
  }

  getTerrainHeight(gridX, gridY) {
    // Check if any entity at this position defines terrain height
    for (const entity of gameState.entities) {
      if (entity.gridX === gridX && entity.gridY === gridY && entity.terrainHeight !== undefined) {
        return entity.terrainHeight;
      }
    }
    
    // Default terrain height is 0 (always flooded at high water)
    // Edges are higher (1 = accessible at mid/low water)
    if (gridX <= 2 || gridX >= 8 || gridY <= 2 || gridY >= 5) {
      return 1;
    }
    return 0;
  }

  getWaterLevelRequirement(waterLevel) {
    // Water level 3 (HIGH) requires terrain height 3+ (nothing accessible except start)
    // Water level 2 (MID) requires terrain height 1+ (edges accessible)
    // Water level 1 (LOW) requires terrain height 0+ (most tiles accessible)
    // Water level 0 (NONE) - all tiles accessible
    switch (waterLevel) {
      case WATER_LEVEL_HIGH: return 3; // Only special high ground accessible
      case WATER_LEVEL_MID: return 1;  // Edges and raised areas accessible
      case WATER_LEVEL_LOW: return 0;  // Most areas accessible
      case WATER_LEVEL_NONE: return -1; // Everything accessible
      default: return 0;
    }
  }

  autoInteractAtPosition(gridX, gridY) {
    const entitiesAtPosition = gameState.entities.filter(e =>
      e.gridX === gridX && e.gridY === gridY && e !== gameState.player
    );

    for (const entity of entitiesAtPosition) {
      // Auto-collect cores
      if (entity.type === ENTITY_CORE && !entity.collected) {
        if (entity.collect()) {
          gameState.collectedCores++;
          gameState.score += 100;
          this.p.logs.game_info.push({
            data: { action: 'core_collected', count: gameState.collectedCores },
            framecount: this.p.frameCount,
            timestamp: Date.now()
          });
        }
      }
    }
  }

  handleActivation() {
    const player = gameState.player;
    const entitiesAtPosition = gameState.entities.filter(e =>
      e.gridX === player.gridX && e.gridY === player.gridY && e !== player
    );

    for (const entity of entitiesAtPosition) {
      if (entity.type === ENTITY_LANTERN || entity.type === ENTITY_STELE || entity.type === ENTITY_CRYSTAL) {
        if (!entity.active && entity.activate()) {
          if (entity.waterReduction !== undefined && entity.waterReduction < gameState.waterLevel) {
            gameState.waterLevel = entity.waterReduction;
            gameState.score += 50;
            this.p.logs.game_info.push({
              data: { action: 'water_receded', level: gameState.waterLevel },
              framecount: this.p.frameCount,
              timestamp: Date.now()
            });
          }
        }
      } else if (entity.type === ENTITY_PLATFORM) {
        entity.activate();
      } else if (entity.type === ENTITY_ROBOT) {
        if (!entity.active && entity.activate()) {
          gameState.activatedRobots++;
          gameState.score += 150;
          this.p.logs.game_info.push({
            data: { action: 'robot_activated', count: gameState.activatedRobots },
            framecount: this.p.frameCount,
            timestamp: Date.now()
          });
        }
      } else if (entity.type === ENTITY_EXIT) {
        if (this.isTileAccessible(entity.gridX, entity.gridY)) {
          gameState.levelComplete = true;
          gameState.score += 500;
          
          // Bonus for collecting all cores and activating all robots
          if (gameState.collectedCores === gameState.totalCores) {
            gameState.score += 200;
          }
          if (gameState.activatedRobots === gameState.totalRobots) {
            gameState.score += 200;
          }

          this.p.logs.game_info.push({
            data: { action: 'level_complete', level: gameState.currentLevel, score: gameState.score },
            framecount: this.p.frameCount,
            timestamp: Date.now()
          });
        }
      }
    }
  }

  logPlayerPosition() {
    const player = gameState.player;
    this.p.logs.player_info.push({
      screen_x: player.gridX,
      screen_y: player.gridY,
      game_x: player.gridX,
      game_y: player.gridY,
      framecount: this.p.frameCount
    });
  }

  handleAutomatedInput(action) {
    if (!action || gameState.gamePhase !== PHASE_PLAYING) return;

    const player = gameState.player;
    if (!player || player.isMoving) return;

    if (action.move) {
      const { x, y } = action.move;
      if (this.isTileAccessible(x, y)) {
        if (player.moveTo(x, y)) {
          gameState.moves++;
          this.logPlayerPosition();
          this.autoInteractAtPosition(x, y);
        }
      }
    }

    if (action.activate) {
      this.handleActivation();
    }
  }
}