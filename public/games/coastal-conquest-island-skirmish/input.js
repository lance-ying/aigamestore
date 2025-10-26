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
    if (keyCode === 13) { // ENTER - Start game
      // Update phase FIRST before initializing game
      gameState.gamePhase = GAME_PHASES.PLAYING;
      
      // Log phase change
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, action: 'game_started' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      // Now initialize the level
      loadLevel(1);
      
      // Log level loaded
      p.logs.game_info.push({
        data: { level: gameState.currentLevel, action: 'level_loaded' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Handle gameplay inputs
    if (keyCode === 27) { // ESC - Pause
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (keyCode === 90) { // Z - Infantry
      if (gameState.playerResources >= UNIT_CONFIGS[UNIT_TYPES.INFANTRY].cost) {
        gameState.selectedUnitType = UNIT_TYPES.INFANTRY;
        p.logs.inputs.push({
          input_type: "unit_selected",
          data: { unitType: UNIT_TYPES.INFANTRY },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (keyCode === 16) { // SHIFT - Artillery
      if (gameState.playerResources >= UNIT_CONFIGS[UNIT_TYPES.ARTILLERY].cost) {
        gameState.selectedUnitType = UNIT_TYPES.ARTILLERY;
        p.logs.inputs.push({
          input_type: "unit_selected",
          data: { unitType: UNIT_TYPES.ARTILLERY },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (keyCode === 38) { // UP ARROW - Tank
      if (gameState.playerResources >= UNIT_CONFIGS[UNIT_TYPES.TANK].cost) {
        gameState.selectedUnitType = UNIT_TYPES.TANK;
        p.logs.inputs.push({
          input_type: "unit_selected",
          data: { unitType: UNIT_TYPES.TANK },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (keyCode === 32) { // SPACE - End turn
      if (!gameState.combatPhase) {
        p.logs.inputs.push({
          input_type: "end_turn",
          data: { turnCount: gameState.turnCount },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        startCombatPhase();
      }
    }
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    if (keyCode === 27) { // ESC - Resume
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (keyCode === 82) { // R - Restart
      gameState.gamePhase = GAME_PHASES.START;
      resetGame();
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, action: 'restart' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    if (keyCode === 82) { // R - Restart
      gameState.gamePhase = GAME_PHASES.START;
      resetGame();
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, action: 'restart' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export function handleMousePressed(p, mouseX, mouseY) {
  // Log mouse input
  p.logs.inputs.push({
    input_type: "mousePressed",
    data: { x: mouseX, y: mouseY },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING && !gameState.combatPhase) {
    // Check UI clicks first
    handleUIClick(p, mouseX, mouseY);
    
    // Check deployment clicks
    if (gameState.selectedUnitType) {
      const cell = getCellAtPosition(mouseX, mouseY);
      if (cell && isValidDeployment(cell.gridX, cell.gridY)) {
        deployUnit(p, cell.gridX, cell.gridY, gameState.selectedUnitType);
      }
    }
  }
}

function deployUnit(p, gridX, gridY, unitType) {
  const config = UNIT_CONFIGS[unitType];
  
  if (gameState.playerResources >= config.cost) {
    const unit = new Unit(gridX, gridY, unitType, false);
    gameState.playerUnits.push(unit);
    gameState.entities.push(unit);
    gameState.mapGrid[gridY][gridX].entity = unit;
    
    gameState.playerResources -= config.cost;
    gameState.selectedUnitType = null;
    
    // Log deployment
    p.logs.inputs.push({
      input_type: "unit_deployed",
      data: { unitType, gridX, gridY, remainingResources: gameState.playerResources },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}