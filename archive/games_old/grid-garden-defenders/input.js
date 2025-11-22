// input.js - Input handling and control modes

import { gameState, GAME_PHASES, PLANT_TYPES, PLANT_COSTS, PLANT_COOLDOWNS, GRID_ROWS, GRID_COLS } from './globals.js';
import { Plant } from './entities.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (keyCode === 13) { // ENTER
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING", level: gameState.currentLevel },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (keyCode === 27) { // ESC
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (keyCode === 49) { // 1 - Sunflower
      gameState.selectedPlantType = PLANT_TYPES.SUNFLOWER;
    } else if (keyCode === 50) { // 2 - Peashooter
      gameState.selectedPlantType = PLANT_TYPES.PEASHOOTER;
    } else if (keyCode === 51) { // 3 - Wall-nut
      gameState.selectedPlantType = PLANT_TYPES.WALLNUT;
    } else if (keyCode === 32) { // SPACE - Place plant
      placePlant();
    } else if (keyCode === 90) { // Z - Plant Food
      usePlantFood();
    } else if (keyCode === 37) { // LEFT
      gameState.cursorCol = Math.max(0, gameState.cursorCol - 1);
    } else if (keyCode === 39) { // RIGHT
      gameState.cursorCol = Math.min(GRID_COLS - 1, gameState.cursorCol + 1);
    } else if (keyCode === 38) { // UP
      gameState.cursorRow = Math.max(0, gameState.cursorRow - 1);
    } else if (keyCode === 40) { // DOWN
      gameState.cursorRow = Math.min(GRID_ROWS - 1, gameState.cursorRow + 1);
    }
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    if (keyCode === 27) { // ESC
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    if (keyCode === 82) { // R - Restart
      resetToStart();
    }
  }
  
  // R always works to reset
  if (keyCode === 82) {
    resetToStart();
  }
}

function placePlant() {
  if (!gameState.selectedPlantType) return;
  
  const cost = PLANT_COSTS[gameState.selectedPlantType];
  const cooldown = gameState.plantCooldowns[gameState.selectedPlantType] || 0;
  
  // Check conditions
  if (gameState.sun < cost) return;
  if (cooldown > 0) return;
  
  // Check if cell is occupied
  const occupied = gameState.plants.find(p => 
    p.row === gameState.cursorRow && p.col === gameState.cursorCol
  );
  if (occupied) return;
  
  // Place plant
  const plant = new Plant(gameState.cursorRow, gameState.cursorCol, gameState.selectedPlantType);
  gameState.plants.push(plant);
  gameState.entities.push(plant);
  gameState.sun -= cost;
  gameState.plantCooldowns[gameState.selectedPlantType] = PLANT_COOLDOWNS[gameState.selectedPlantType];
}

function usePlantFood() {
  if (gameState.plantFood <= 0) return;
  
  // Find plant at cursor
  const plant = gameState.plants.find(p => 
    p.row === gameState.cursorRow && p.col === gameState.cursorCol && p.active
  );
  
  if (plant) {
    plant.activatePlantFood();
    gameState.plantFood--;
  }
}

function resetToStart() {
  const { initializeLevel } = require('./globals.js');
  initializeLevel(1);
  gameState.gamePhase = GAME_PHASES.START;
  gameState.score = 0;
}

export class TestController {
  constructor(mode) {
    this.mode = mode;
    this.actionQueue = [];
    this.timer = 0;
    this.initialized = false;
  }
  
  update(p, deltaTime) {
    if (!this.initialized) {
      this.initialize(p);
      this.initialized = true;
    }
    
    this.timer += deltaTime;
    
    if (this.mode === "TEST_1") {
      this.basicTest(p, deltaTime);
    } else if (this.mode === "TEST_2") {
      this.winTest(p, deltaTime);
    }
  }
  
  initialize(p) {
    if (gameState.gamePhase === GAME_PHASES.START) {
      handleKeyPressed(p, 13); // Start game
    }
  }
  
  basicTest(p, deltaTime) {
    // Basic test: Place some plants and let the game run
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    
    const frameCount = p.frameCount;
    
    // Plant sunflowers
    if (frameCount === 120 && gameState.sun >= 50) {
      gameState.cursorRow = 2;
      gameState.cursorCol = 0;
      gameState.selectedPlantType = PLANT_TYPES.SUNFLOWER;
      handleKeyPressed(p, 32);
    }
    
    if (frameCount === 240 && gameState.sun >= 50) {
      gameState.cursorRow = 1;
      gameState.cursorCol = 1;
      gameState.selectedPlantType = PLANT_TYPES.SUNFLOWER;
      handleKeyPressed(p, 32);
    }
    
    // Plant peashooters
    if (frameCount === 600 && gameState.sun >= 100) {
      gameState.cursorRow = 2;
      gameState.cursorCol = 3;
      gameState.selectedPlantType = PLANT_TYPES.PEASHOOTER;
      handleKeyPressed(p, 32);
    }
  }
  
  winTest(p, deltaTime) {
    // Win test: Aggressively build defense
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    
    const frameCount = p.frameCount;
    
    // Build sunflower economy
    if (gameState.sun >= 50 && gameState.plantCooldowns[PLANT_TYPES.SUNFLOWER] <= 0) {
      // Find empty spot in first two columns
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < 2; col++) {
          const occupied = gameState.plants.find(p => p.row === row && p.col === col);
          if (!occupied) {
            gameState.cursorRow = row;
            gameState.cursorCol = col;
            gameState.selectedPlantType = PLANT_TYPES.SUNFLOWER;
            handleKeyPressed(p, 32);
            return;
          }
        }
      }
    }
    
    // Build peashooter defense
    if (gameState.sun >= 100 && gameState.plantCooldowns[PLANT_TYPES.PEASHOOTER] <= 0) {
      // Place peashooters in columns 2-5
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 2; col < 6; col++) {
          const occupied = gameState.plants.find(p => p.row === row && p.col === col);
          if (!occupied) {
            gameState.cursorRow = row;
            gameState.cursorCol = col;
            gameState.selectedPlantType = PLANT_TYPES.PEASHOOTER;
            handleKeyPressed(p, 32);
            return;
          }
        }
      }
    }
    
    // Add wall-nuts as needed
    if (gameState.sun >= 50 && gameState.plantCooldowns[PLANT_TYPES.WALLNUT] <= 0 && gameState.zombies.length > 5) {
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 6; col < 8; col++) {
          const occupied = gameState.plants.find(p => p.row === row && p.col === col);
          if (!occupied) {
            gameState.cursorRow = row;
            gameState.cursorCol = col;
            gameState.selectedPlantType = PLANT_TYPES.WALLNUT;
            handleKeyPressed(p, 32);
            return;
          }
        }
      }
    }
  }
}