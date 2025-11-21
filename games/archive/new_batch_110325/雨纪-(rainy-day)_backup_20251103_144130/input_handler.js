// input_handler.js - Input handling and control management

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN } from './globals.js';
import { gridDistance, isAdjacent } from './utils.js';
import {
  ENTITY_LANTERN, ENTITY_STELE, ENTITY_CRYSTAL, ENTITY_PLATFORM,
  ENTITY_ROBOT, ENTITY_CORE, ENTITY_EXIT
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

    // Arrow keys - Move to nearby interactive
    if (keyCode >= 37 && keyCode <= 40) {
      this.handleMovement(keyCode);
    }

    // Space - Activate current entity
    if (keyCode === 32) {
      this.handleActivation();
    }

    // Z - Toggle selection of nearby interactives
    if (keyCode === 90) {
      this.cycleInteractiveSelection();
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
    const nearbyInteractives = this.getNearbyInteractives();

    if (nearbyInteractives.length === 0) return;

    let targetEntity = null;

    // Determine movement direction
    let dx = 0, dy = 0;
    if (keyCode === 37) dx = -1; // Left
    if (keyCode === 38) dy = -1; // Up
    if (keyCode === 39) dx = 1;  // Right
    if (keyCode === 40) dy = 1;  // Down

    // Find closest interactive in that direction
    let minDist = Infinity;
    for (const entity of nearbyInteractives) {
      if (!entity.isAccessible(gameState.waterLevel)) continue;

      const deltaX = entity.gridX - player.gridX;
      const deltaY = entity.gridY - player.gridY;

      // Check if entity is in the general direction
      const dotProduct = deltaX * dx + deltaY * dy;
      if (dotProduct > 0) {
        const dist = gridDistance(player.gridX, player.gridY, entity.gridX, entity.gridY);
        if (dist < minDist) {
          minDist = dist;
          targetEntity = entity;
        }
      }
    }

    if (targetEntity) {
      if (player.moveTo(targetEntity.gridX, targetEntity.gridY)) {
        gameState.moves++;
        this.logPlayerPosition();
      }
    }
  }

  handleActivation() {
    const player = gameState.player;
    const entitiesAtPosition = gameState.entities.filter(e =>
      e.gridX === player.gridX && e.gridY === player.gridY && e !== player
    );

    for (const entity of entitiesAtPosition) {
      if (!entity.isAccessible(gameState.waterLevel)) continue;

      if (entity.type === ENTITY_LANTERN || entity.type === ENTITY_STELE || entity.type === ENTITY_CRYSTAL) {
        if (entity.activate()) {
          if (entity.waterReduction !== undefined && entity.waterReduction < gameState.waterLevel) {
            gameState.waterLevel = entity.waterReduction;
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
        if (entity.activate()) {
          gameState.activatedRobots++;
          this.p.logs.game_info.push({
            data: { action: 'robot_activated', count: gameState.activatedRobots },
            framecount: this.p.frameCount,
            timestamp: Date.now()
          });
        }
      } else if (entity.type === ENTITY_CORE) {
        if (entity.collect()) {
          gameState.collectedCores++;
          gameState.score += 100;
          this.p.logs.game_info.push({
            data: { action: 'core_collected', count: gameState.collectedCores },
            framecount: this.p.frameCount,
            timestamp: Date.now()
          });
        }
      } else if (entity.type === ENTITY_EXIT) {
        if (entity.isAccessible(gameState.waterLevel)) {
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

  cycleInteractiveSelection() {
    const nearbyInteractives = this.getNearbyInteractives();
    if (nearbyInteractives.length > 1) {
      gameState.selectedInteractiveIndex = (gameState.selectedInteractiveIndex + 1) % nearbyInteractives.length;
    }
  }

  getNearbyInteractives() {
    const player = gameState.player;
    const maxDistance = 3;
    const interactives = [];

    for (const entity of gameState.entities) {
      if (entity === player) continue;
      if (entity.type === ENTITY_EXIT || entity.type === ENTITY_LANTERN ||
          entity.type === ENTITY_STELE || entity.type === ENTITY_CRYSTAL ||
          entity.type === ENTITY_PLATFORM || entity.type === ENTITY_ROBOT ||
          entity.type === ENTITY_CORE) {
        const dist = gridDistance(player.gridX, player.gridY, entity.gridX, entity.gridY);
        if (dist <= maxDistance) {
          interactives.push(entity);
        }
      }
    }

    return interactives;
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
      if (player.moveTo(x, y)) {
        gameState.moves++;
        this.logPlayerPosition();
      }
    }

    if (action.activate) {
      this.handleActivation();
    }
  }
}