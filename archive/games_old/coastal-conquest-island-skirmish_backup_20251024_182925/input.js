// input.js - Input handling

import { gameState, GAME_PHASES, UNIT_TYPES, UNIT_CONFIGS } from './globals.js';
import { Unit } from './entities.js';
import { getCellAtPosition, isValidDeployment } from './map.js';
import { startCombatPhase } from './combat.js';
import { loadLevel, resetGame } from './levelManager.js';
import { handleUIClick } from './ui.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (keyCode === 13) { // ENTER
      gameState.gamePhase = GAME_PHASES.PLAYING;
      loadLevel(1);
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, level: gameState.currentLevel },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (keyCode === 27) { // ESC
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (keyCode === 90) { // Z - Infantry
      if (gameState.playerResources >= UNIT_CONFIGS[UNIT_TYPES.INFANTRY].cost) {
        gameState.selectedUnitType = UNIT_TYPES.INFANTRY;
      }
    } else if (keyCode === 16) { // SHIFT - Artillery
      if (gameState.playerResources >= UNIT_CONFIGS[UNIT_TYPES.ARTILLERY].cost) {
        gameState.selectedUnitType = UNIT_TYPES.ARTILLERY;
      }
    } else if (keyCode === 38) { // UP ARROW - Tank
      if (gameState.playerResources >= UNIT_CONFIGS[UNIT_TYPES.TANK].cost) {
        gameState.selectedUnitType = UNIT_TYPES.TANK;
      }
    } else if (keyCode === 32) { // SPACE - End turn
      if (!gameState.combatPhase) {
        startCombatPhase();
      }
    }
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    if (keyCode === 27) { // ESC
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (keyCode === 82) { // R
      gameState.gamePhase = GAME_PHASES.START;
      resetGame();
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    if (keyCode === 82) { // R
      gameState.gamePhase = GAME_PHASES.START;
      resetGame();
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export function handleMousePressed(p, mouseX, mouseY) {
  if (gameState.gamePhase === GAME_PHASES.PLAYING && !gameState.combatPhase) {
    // Check UI clicks first
    handleUIClick(p, mouseX, mouseY);
    
    // Check deployment clicks
    if (gameState.selectedUnitType) {
      const cell = getCellAtPosition(mouseX, mouseY);
      if (cell && isValidDeployment(cell.gridX, cell.gridY)) {
        deployUnit(cell.gridX, cell.gridY, gameState.selectedUnitType);
      }
    }
  }
}

function deployUnit(gridX, gridY, unitType) {
  const config = UNIT_CONFIGS[unitType];
  
  if (gameState.playerResources >= config.cost) {
    const unit = new Unit(gridX, gridY, unitType, false);
    gameState.playerUnits.push(unit);
    gameState.entities.push(unit);
    gameState.mapGrid[gridY][gridX].entity = unit;
    
    gameState.playerResources -= config.cost;
    gameState.selectedUnitType = null;
  }
}