// input.js - Input handling

import { gameState, GAME_PHASES, TOWER_TYPE_ARRAY, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initGame, placeTower, findPlotAtPosition, selectTower, upgradeTower, moveHero, useHeroAbility } from './game_logic.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;

  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Global controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      initGame(p);
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { phase: "START" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  // Gameplay controls
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;

  // Tower type selection - Arrow keys
  if (keyCode === 37) { // LEFT
    gameState.selectedTowerType = (gameState.selectedTowerType - 1 + TOWER_TYPE_ARRAY.length) % TOWER_TYPE_ARRAY.length;
    gameState.selectedTower = null;
  } else if (keyCode === 39) { // RIGHT
    gameState.selectedTowerType = (gameState.selectedTowerType + 1) % TOWER_TYPE_ARRAY.length;
    gameState.selectedTower = null;
  }

  // Number keys for quick select
  if (keyCode >= 49 && keyCode <= 52) { // 1-4
    const index = keyCode - 49;
    if (index < TOWER_TYPE_ARRAY.length) {
      gameState.selectedTowerType = index;
      gameState.selectedTower = null;
    }
  }

  // Space - Place tower or use hero ability
  if (keyCode === 32) {
    if (gameState.heroes.length > 0) {
      useHeroAbility(p);
    }
  }

  // Z - Upgrade tower
  if (keyCode === 90) {
    upgradeTower(p);
  }

  // Shift - Move hero (moves to center of path for now)
  if (keyCode === 16) {
    if (gameState.hoveredPlot) {
      // If hovering over a plot, place tower
      placeTower(p, gameState.hoveredPlot);
    } else {
      // Move hero to a position along the path
      const pathIndex = Math.floor(gameState.path.length / 2);
      const target = gameState.path[pathIndex];
      moveHero(target.x, target.y);
    }
  }
}

export function processAutomatedInput(p) {
  if (gameState.controlMode === "HUMAN") return;
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;

  const action = get_automated_testing_action(gameState);
  
  if (action && action.keyCode) {
    // Simulate key press
    p.keyCode = action.keyCode;
    p.key = action.key || String.fromCharCode(action.keyCode);
    handleKeyPressed(p);
  }

  if (action && action.plotIndex !== undefined) {
    const plot = gameState.towerPlots[action.plotIndex];
    if (plot) {
      gameState.hoveredPlot = plot;
    }
  }

  if (action && action.heroTarget) {
    moveHero(action.heroTarget.x, action.heroTarget.y);
  }
}

export function updateHoveredPlot(p) {
  // For keyboard control, cycle through plots with arrow keys when shift is held
  if (p.keyIsDown(16)) { // Shift held
    if (p.keyIsDown(37) || p.keyIsDown(39) || p.keyIsDown(38) || p.keyIsDown(40)) {
      // Find nearest plot to hero
      if (gameState.heroes.length > 0) {
        const hero = gameState.heroes[0];
        let nearest = null;
        let minDist = Infinity;
        
        for (let plot of gameState.towerPlots) {
          if (!plot.occupied) {
            const dist = Math.sqrt((plot.x - hero.x) ** 2 + (plot.y - hero.y) ** 2);
            if (dist < minDist) {
              minDist = dist;
              nearest = plot;
            }
          }
        }
        
        gameState.hoveredPlot = nearest;
      }
    }
  } else {
    gameState.hoveredPlot = null;
  }
}