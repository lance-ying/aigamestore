// input.js - Input handling
import { gameState, GRID_COLS, GRID_ROWS } from './globals.js';
import { generateRandomUnit, canMergeUnits, mergeUnits } from './units.js';
import { spinRoulette } from './roulette.js';
import { initializeGrid } from './grid.js';
import { generatePath } from './path.js';

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase-specific controls
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === 'START') {
      startGame(p);
      return;
    }
  } else if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === 'PLAYING') {
      gameState.gamePhase = 'PAUSED';
      p.logs.game_info.push({
        data: { phase: 'PAUSED' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    } else if (gameState.gamePhase === 'PAUSED') {
      gameState.gamePhase = 'PLAYING';
      p.logs.game_info.push({
        data: { phase: 'PLAYING' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
  } else if (p.keyCode === 82) { // R
    if (gameState.gamePhase === 'GAME_OVER') {
      resetGame(p);
      return;
    }
  }
  
  // Gameplay controls - only process during PLAYING phase
  if (gameState.gamePhase === 'PLAYING') {
    handleGameplayInput(p);
  }
}

function handleGameplayInput(p) {
  // Arrow keys - move cursor
  if (p.keyCode === 37) { // LEFT
    gameState.cursorX = Math.max(0, gameState.cursorX - 1);
  } else if (p.keyCode === 39) { // RIGHT
    gameState.cursorX = Math.min(GRID_COLS - 1, gameState.cursorX + 1);
  } else if (p.keyCode === 38) { // UP
    gameState.cursorY = Math.max(0, gameState.cursorY - 1);
  } else if (p.keyCode === 40) { // DOWN
    gameState.cursorY = Math.min(GRID_ROWS - 1, gameState.cursorY + 1);
  }
  
  // Space - summon unit
  else if (p.keyCode === 32) {
    summonUnit(p);
  }
  
  // Shift - place/select/merge
  else if (p.keyCode === 16) {
    handleShift(p);
  }
  
  // Z - spin roulette
  else if (p.keyCode === 90 || p.key === 'z' || p.key === 'Z') {
    spinRoulette(p);
  }
}

function summonUnit(p) {
  if (gameState.placementMode) return;
  
  const config = gameState.levelConfigs[gameState.level - 1];
  if (gameState.currency < config.summonCost) return;
  
  gameState.currency -= config.summonCost;
  
  const unitData = generateRandomUnit(p);
  gameState.pendingUnit = unitData;
  gameState.placementMode = true;
}

function handleShift(p) {
  if (gameState.placementMode) {
    // Place unit
    placeUnit(p);
  } else {
    // Select/merge
    const cellData = gameState.grid[gameState.cursorY][gameState.cursorX];
    const unit = cellData && !cellData.isEmpty ? findUnitAt(gameState.cursorX, gameState.cursorY) : null;
    
    if (!unit) {
      gameState.selectedUnit = null;
      return;
    }
    
    if (!gameState.selectedUnit) {
      gameState.selectedUnit = unit;
    } else {
      // Try to merge
      if (canMergeUnits(gameState.selectedUnit, unit)) {
        const newUnit = mergeUnits(gameState.selectedUnit, unit, p);
        
        if (newUnit) {
          // Remove old units
          const idx1 = gameState.units.indexOf(gameState.selectedUnit);
          const idx2 = gameState.units.indexOf(unit);
          
          if (idx1 !== -1) gameState.units.splice(idx1, 1);
          if (idx2 !== -1) gameState.units.splice(idx2, 1);
          
          gameState.grid[gameState.selectedUnit.gridY][gameState.selectedUnit.gridX].isEmpty = true;
          gameState.grid[unit.gridY][unit.gridX].isEmpty = true;
          
          // Add new unit
          gameState.units.push(newUnit);
          gameState.grid[newUnit.gridY][newUnit.gridX].isEmpty = false;
          
          // Particle effect
          for (let i = 0; i < 15; i++) {
            gameState.particles.push({
              x: newUnit.x,
              y: newUnit.y,
              vx: p.random(-3, 3),
              vy: p.random(-3, 3),
              life: 40,
              color: [255, 215, 0]
            });
          }
        }
      }
      
      gameState.selectedUnit = null;
    }
  }
}

function findUnitAt(gridX, gridY) {
  return gameState.units.find(u => u.gridX === gridX && u.gridY === gridY);
}

function placeUnit(p) {
  const cellData = gameState.grid[gameState.cursorY][gameState.cursorX];
  
  if (!cellData.isEmpty) {
    // Spot occupied - refund
    const config = gameState.levelConfigs[gameState.level - 1];
    gameState.currency += config.summonCost;
    gameState.placementMode = false;
    gameState.pendingUnit = null;
    return;
  }
  
  // Create and place unit
  const { Unit } = await import('./units.js');
  const newUnit = new Unit(
    gameState.pendingUnit.type,
    gameState.pendingUnit.rarity,
    gameState.cursorX,
    gameState.cursorY,
    p
  );
  
  gameState.units.push(newUnit);
  gameState.grid[gameState.cursorY][gameState.cursorX].isEmpty = false;
  
  gameState.placementMode = false;
  gameState.pendingUnit = null;
  
  // Particle effect
  for (let i = 0; i < 10; i++) {
    gameState.particles.push({
      x: newUnit.x,
      y: newUnit.y,
      vx: p.random(-2, 2),
      vy: p.random(-2, 2),
      life: 30,
      color: [255, 255, 255]
    });
  }
}

function startGame(p) {
  // Update phase FIRST before any other initialization
  gameState.gamePhase = 'PLAYING';
  
  // Then initialize the game
  gameState.level = 1;
  initLevel(p);
  
  p.logs.game_info.push({
    data: { phase: 'PLAYING', level: gameState.level },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function initLevel(p) {
  const config = gameState.levelConfigs[gameState.level - 1];
  
  gameState.currency = config.startCurrency;
  gameState.baseHealth = config.baseHp;
  gameState.maxBaseHealth = config.baseHp;
  gameState.totalWaves = config.waves;
  gameState.currentWave = 0;
  gameState.waveState = 'COUNTDOWN';
  gameState.waveTimer = 180; // 3 seconds
  
  // Initialize grid using grid.js
  initializeGrid();
  
  gameState.units = [];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.particles = [];
  
  // Generate path
  gameState.path = generatePath(gameState.level);
  
  gameState.cursorX = 0;
  gameState.cursorY = 0;
  gameState.placementMode = false;
  gameState.pendingUnit = null;
  gameState.selectedUnit = null;
  
  gameState.globalAttackBuff = 1.0;
  gameState.buffTimer = 0;
  
  gameState.rouletteActive = false;
  gameState.rouletteAngle = 0;
  
  gameState.shakeAmount = 0;
  gameState.enemiesToSpawn = [];
}

function resetGame(p) {
  gameState.gamePhase = 'START';
  gameState.score = 0;
  
  p.logs.game_info.push({
    data: { phase: 'START' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}