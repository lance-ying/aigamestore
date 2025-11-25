// game.js - Main game file
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASE, gameState, GRID_ROWS, GRID_COLS } from './globals.js';
import { Player } from './player.js';
import { Enemy, spawnEnemies } from './enemy.js';
import { initializeGrid, getTileAt, isAdjacent, selectPath, executeMatch } from './grid.js';
import { renderStartScreen, renderPausedIndicator, renderGameOver, renderUI } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };

  let lastCursorRow = 0;
  let lastCursorCol = 0;

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Log initial game state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(40, 40, 60);
    
    if (gameState.gamePhase === GAME_PHASE.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASE.PLAYING) {
      updateGame(p);
      renderGame(p);
      renderUI(p);
      
      // Handle automated testing
      if (gameState.controlMode !== "HUMAN") {
        handleAutomatedTesting(p);
      }
    } else if (gameState.gamePhase === GAME_PHASE.PAUSED) {
      renderGame(p);
      renderUI(p);
      renderPausedIndicator(p);
    } else if (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE) {
      renderGame(p);
      renderGameOver(p);
    }
  };

  function updateGame(p) {
    gameState.framesSinceLastAction++;
    
    // Update player
    if (gameState.player) {
      // Log player position
      if (p.frameCount % 60 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
    }
    
    // Update enemies
    for (const enemy of gameState.enemies) {
      enemy.update();
    }
    
    // Remove dead enemies
    gameState.enemies = gameState.enemies.filter(e => !e.isDead);
    gameState.entities = gameState.entities.filter(e => !(e instanceof Enemy && e.isDead));
    
    // Check for new wave
    if (gameState.enemies.length === 0) {
      gameState.waveNumber++;
      gameState.enemiesDefeatedThisWave = 0;
      gameState.score += 50 * gameState.waveNumber;
      spawnEnemies(p);
    }
    
    // Check win condition (survived 10 waves or score > 5000)
    if (gameState.waveNumber > 10 || gameState.score > 5000) {
      gameState.gamePhase = GAME_PHASE.GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, reason: "victory" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Check lose condition
    if (gameState.player && gameState.player.health <= 0) {
      gameState.gamePhase = GAME_PHASE.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, reason: "defeat" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  function renderGame(p) {
    // Render grid
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        gameState.grid[row][col].render(p);
      }
    }
    
    // Render selection path
    if (gameState.selectedPath.length > 1) {
      p.push();
      p.stroke(255, 255, 100, 200);
      p.strokeWeight(4);
      p.noFill();
      p.beginShape();
      for (const tile of gameState.selectedPath) {
        p.vertex(tile.getScreenX() + 22.5, tile.getScreenY() + 22.5);
      }
      p.endShape();
      p.pop();
    }
    
    // Render player character (in UI area)
    if (gameState.player) {
      gameState.player.render(p);
    }
    
    // Render enemies
    for (const enemy of gameState.enemies) {
      enemy.render(p);
    }
  }

  function handleAutomatedTesting(p) {
    if (p.frameCount % 15 === 0) { // Act every 15 frames
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        simulateKeyPress(action.keyCode, p);
      }
    }
  }

  function simulateKeyPress(keyCode, p) {
    p.keyCode = keyCode;
    switch(keyCode) {
      case 32: // Space
        p.key = ' ';
        break;
      case 16: // Shift
        p.key = 'Shift';
        break;
      case 90: // Z
        p.key = 'z';
        break;
      default:
        p.key = String.fromCharCode(keyCode);
    }
    p.keyPressed();
  }

  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Global controls
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASE.START) {
        startGame(p);
      }
      return;
    }

    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASE.PLAYING) {
        gameState.gamePhase = GAME_PHASE.PAUSED;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASE.PAUSED) {
        gameState.gamePhase = GAME_PHASE.PLAYING;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }

    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE) {
        resetGame(p);
      }
      return;
    }

    // Gameplay controls
    if (gameState.gamePhase === GAME_PHASE.PLAYING) {
      if (p.keyCode === 32) { // SPACE
        handleSpacePress(p);
      } else if (p.keyCode === 16) { // SHIFT
        handleShiftPress(p);
      } else if (p.keyCode === 90) { // Z
        handleZPress(p);
      }
    }
  };

  function handleSpacePress(p) {
    if (!gameState.isDrawingPath) {
      // Start drawing path from a random tile
      const row = Math.floor(Math.random() * GRID_ROWS);
      const col = Math.floor(Math.random() * GRID_COLS);
      const tile = gameState.grid[row][col];
      
      gameState.selectedPath = [tile];
      gameState.isDrawingPath = true;
      selectPath(gameState.selectedPath);
      
      lastCursorRow = row;
      lastCursorCol = col;
    } else {
      // Try to execute the path
      if (gameState.selectedPath.length >= 3) {
        const success = executeMatch(gameState.selectedPath, p);
        if (success) {
          gameState.turnCount++;
          enemyTurns(p);
          gameState.framesSinceLastAction = 0;
        }
      }
      
      // Reset path
      gameState.selectedPath = [];
      gameState.isDrawingPath = false;
      selectPath([]);
    }
  }

  function handleShiftPress(p) {
    // Cancel current path
    gameState.selectedPath = [];
    gameState.isDrawingPath = false;
    selectPath([]);
  }

  function handleZPress(p) {
    // Quick heal if potion tiles are available
    // Find first potion tile and try to match
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (gameState.grid[row][col].type === "POTION") {
          const path = findLongestMatchingPath(row, col, p);
          if (path.length >= 3) {
            executeMatch(path, p);
            gameState.turnCount++;
            enemyTurns(p);
            gameState.framesSinceLastAction = 0;
            return;
          }
        }
      }
    }
  }

  function findLongestMatchingPath(startRow, startCol, p) {
    const startTile = gameState.grid[startRow][startCol];
    const targetType = startTile.type;
    let longestPath = [];
    
    function dfs(tile, visited, currentPath) {
      if (!tile || tile.type !== targetType || visited.has(tile)) {
        return;
      }
      
      visited.add(tile);
      currentPath.push(tile);
      
      if (currentPath.length > longestPath.length) {
        longestPath = [...currentPath];
      }
      
      const neighbors = [
        {row: tile.row - 1, col: tile.col},
        {row: tile.row + 1, col: tile.col},
        {row: tile.row, col: tile.col - 1},
        {row: tile.row, col: tile.col + 1}
      ];
      
      for (const {row, col} of neighbors) {
        if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
          const nextTile = gameState.grid[row][col];
          dfs(nextTile, visited, currentPath);
        }
      }
      
      currentPath.pop();
      visited.delete(tile);
    }
    
    dfs(startTile, new Set(), []);
    return longestPath;
  }

  function enemyTurns(p) {
    // Clear defense bonus after turn
    gameState.defenseBonus = 0;
    
    // Each enemy takes a turn
    for (const enemy of gameState.enemies) {
      const damage = enemy.performTurn();
      if (damage > 0) {
        // Visual feedback handled by player damage flash
      }
    }
    
    // Reset combo if turn ends
    if (gameState.framesSinceLastAction > 180) {
      gameState.combos = 0;
    }
  }

  function startGame(p) {
    gameState.gamePhase = GAME_PHASE.PLAYING;
    gameState.score = 0;
    gameState.level = 1;
    gameState.experience = 0;
    gameState.expToNextLevel = 100;
    gameState.gold = 0;
    gameState.waveNumber = 1;
    gameState.enemiesDefeatedThisWave = 0;
    gameState.selectedPath = [];
    gameState.isDrawingPath = false;
    gameState.combos = 0;
    gameState.maxCombo = 0;
    gameState.defenseBonus = 0;
    gameState.turnCount = 0;
    gameState.framesSinceLastAction = 0;
    
    // Initialize player
    gameState.player = new Player(250, 35);
    gameState.entities = [gameState.player];
    
    // Initialize grid
    initializeGrid(p);
    
    // Spawn initial enemies
    gameState.enemies = [];
    spawnEnemies(p);
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function resetGame(p) {
    gameState.gamePhase = GAME_PHASE.START;
    gameState.player = null;
    gameState.entities = [];
    gameState.enemies = [];
    gameState.grid = [];
    gameState.selectedPath = [];
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose the game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};