// game.js
const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine } = Matter;

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GRID_SIZE, 
  CELL_SIZE, 
  GRID_OFFSET_X, 
  GRID_OFFSET_Y,
  LEVELS
} from './globals.js';

import { Furball } from './entities.js';
import { initPhysics, slideFurball } from './physics.js';

let selectedIndex = -1;

function initializeGame(p) {
  gameState.entities = [];
  gameState.furballs = [];
  gameState.moveHistory = [];
  gameState.moves = 0;
  gameState.isAnimating = false;
  gameState.selectedFurball = null;
  selectedIndex = -1;
  
  // Load level
  const levelIndex = (gameState.level - 1) % LEVELS.length;
  const levelData = LEVELS[levelIndex];
  
  levelData.furballs.forEach((fb, i) => {
    const furball = new Furball(p, fb.gridX, fb.gridY, i);
    gameState.furballs.push(furball);
    gameState.entities.push(furball);
  });
  
  // Log initial player info
  if (gameState.furballs.length > 0) {
    const firstFurball = gameState.furballs[0];
    p.logs.player_info.push({
      screen_x: firstFurball.body.position.x,
      screen_y: firstFurball.body.position.y,
      game_x: firstFurball.body.position.x,
      game_y: firstFurball.body.position.y,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function resetGame(p) {
  // Remove all furballs from world
  gameState.furballs.forEach(fb => {
    if (fb.body) {
      Matter.World.remove(gameState.world, fb.body);
    }
  });
  
  initializeGame(p);
}

function saveState() {
  const state = {
    furballs: gameState.furballs.map(fb => fb.getState()),
    moves: gameState.moves
  };
  gameState.moveHistory.push(state);
}

function undo(p) {
  if (gameState.moveHistory.length === 0) return;
  
  const state = gameState.moveHistory.pop();
  gameState.moves = state.moves;
  
  // Restore furball states
  gameState.furballs.forEach((fb, i) => {
    if (i < state.furballs.length) {
      fb.setState(state.furballs[i]);
    }
  });
  
  gameState.selectedFurball = null;
  selectedIndex = -1;
}

function selectNextFurball() {
  const activeFurballs = gameState.furballs.filter(fb => !fb.isOffScreen);
  if (activeFurballs.length === 0) return;
  
  selectedIndex = (selectedIndex + 1) % activeFurballs.length;
  
  if (gameState.selectedFurball) {
    gameState.selectedFurball.isSelected = false;
  }
  
  gameState.selectedFurball = activeFurballs[selectedIndex];
  gameState.selectedFurball.isSelected = true;
}

function executeMove(p, dx, dy) {
  if (!gameState.selectedFurball || gameState.selectedFurball.isOffScreen) return;
  
  saveState();
  
  const furball = gameState.selectedFurball;
  slideFurball(furball, dx, dy);
  
  gameState.moves++;
  gameState.selectedFurball.isSelected = false;
  gameState.selectedFurball = null;
  selectedIndex = -1;
  
  // Check win condition
  checkWinCondition(p);
  
  // Log player info after move
  const activeFurballs = gameState.furballs.filter(fb => !fb.isOffScreen);
  if (activeFurballs.length > 0) {
    const fb = activeFurballs[0];
    p.logs.player_info.push({
      screen_x: fb.body.position.x,
      screen_y: fb.body.position.y,
      game_x: fb.body.position.x,
      game_y: fb.body.position.y,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function checkWinCondition(p) {
  const activeFurballs = gameState.furballs.filter(fb => !fb.isOffScreen);
  
  if (activeFurballs.length === 1) {
    gameState.gamePhase = "GAME_OVER_WIN";
    gameState.score += Math.max(0, 100 - gameState.moves * 5);
    
    p.logs.game_info.push({
      data: { gamePhase: "GAME_OVER_WIN", level: gameState.level, moves: gameState.moves },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function updateGame(p) {
  // Update physics
  Engine.update(gameState.engine, 1000 / 60);
  
  // Update entities
  gameState.entities.forEach(entity => {
    if (entity.update) {
      entity.update();
    }
  });
  
  // Automated testing
  if (gameState.controlMode === "TEST_1") {
    runTest1(p);
  } else if (gameState.controlMode === "TEST_2") {
    runTest2(p);
  }
}

function runTest1(p) {
  const testFrame = p.frameCount % 600;
  
  if (testFrame === 30) {
    // Select first furball
    selectNextFurball();
  } else if (testFrame === 60) {
    // Move right
    executeMove(p, 1, 0);
  } else if (testFrame === 120) {
    // Select next furball
    selectNextFurball();
  } else if (testFrame === 150) {
    // Move down
    executeMove(p, 0, 1);
  } else if (testFrame === 210) {
    // Select next furball
    selectNextFurball();
  } else if (testFrame === 240) {
    // Move left
    executeMove(p, -1, 0);
  } else if (testFrame === 300) {
    // Test undo
    undo(p);
  } else if (testFrame === 360) {
    // Select furball
    selectNextFurball();
  } else if (testFrame === 390) {
    // Move up
    executeMove(p, 0, -1);
  }
}

function runTest2(p) {
  const testFrame = p.frameCount % 1200;
  
  // Solve level 1: 3 furballs in a line at (3,3), (4,3), (5,3)
  // Strategy: Push middle furball right to push right one off, then push left one right
  if (testFrame === 30) {
    // Select middle furball (index 1)
    selectNextFurball();
    selectNextFurball();
  } else if (testFrame === 60) {
    // Move right - pushes rightmost off
    executeMove(p, 1, 0);
  } else if (testFrame === 120) {
    // Select leftmost furball
    selectNextFurball();
  } else if (testFrame === 150) {
    // Move right - pushes middle off, win!
    executeMove(p, 1, 0);
  } else if (testFrame === 300 && gameState.gamePhase === "GAME_OVER_WIN") {
    // Advance to next level
    gameState.level++;
    resetGame(p);
    gameState.gamePhase = "PLAYING";
    
    p.logs.game_info.push({
      data: { gamePhase: "PLAYING", level: gameState.level },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function renderStartScreen(p) {
  p.background(20, 25, 40);
  
  // Title
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("FLING!", CANVAS_WIDTH / 2, 100);
  
  // Description
  p.fill(200, 220, 255);
  p.textSize(14);
  p.textStyle(p.NORMAL);
  p.text("Clear the board until only one furball remains!", CANVAS_WIDTH / 2, 160);
  p.text("Slide furballs to push others off the edge.", CANVAS_WIDTH / 2, 180);
  
  // Instructions
  p.textSize(12);
  p.fill(180, 200, 230);
  p.text("SPACE: Select/Confirm furball", CANVAS_WIDTH / 2, 220);
  p.text("ARROW KEYS: Move selected furball", CANVAS_WIDTH / 2, 240);
  p.text("Z: Undo | R: Reset puzzle", CANVAS_WIDTH / 2, 260);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(16);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 100, 255 * pulse);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 320);
}

function renderGame(p) {
  // Background
  p.background(20, 25, 40);
  
  // Grid background
  p.fill(30, 35, 50);
  p.noStroke();
  p.rect(GRID_OFFSET_X, GRID_OFFSET_Y, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
  
  // Grid lines
  p.stroke(40, 45, 60);
  p.strokeWeight(1);
  for (let i = 0; i <= GRID_SIZE; i++) {
    p.line(GRID_OFFSET_X + i * CELL_SIZE, GRID_OFFSET_Y, 
           GRID_OFFSET_X + i * CELL_SIZE, GRID_OFFSET_Y + GRID_SIZE * CELL_SIZE);
    p.line(GRID_OFFSET_X, GRID_OFFSET_Y + i * CELL_SIZE,
           GRID_OFFSET_X + GRID_SIZE * CELL_SIZE, GRID_OFFSET_Y + i * CELL_SIZE);
  }
  
  // Render furballs
  gameState.furballs.forEach(fb => fb.render());
  
  // UI
  p.fill(200, 220, 255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Level: ${gameState.level}`, 20, 20);
  p.text(`Moves: ${gameState.moves}`, 20, 40);
  p.text(`Score: ${gameState.score}`, 20, 60);
  
  const activeFurballs = gameState.furballs.filter(fb => !fb.isOffScreen);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Furballs: ${activeFurballs.length}`, CANVAS_WIDTH - 20, 20);
  
  // Instructions
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(11);
  p.fill(150, 170, 200);
  p.text("SPACE: Select | ARROWS: Move | Z: Undo | R: Reset", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 25);
}

function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(16);
  p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

function renderGameOver(p) {
  p.background(20, 25, 40);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(isWin ? [100, 255, 150] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text(isWin ? "LEVEL COMPLETE!" : "GAME OVER", CANVAS_WIDTH / 2, 120);
  
  // Stats
  p.fill(200, 220, 255);
  p.textSize(20);
  p.textStyle(p.NORMAL);
  p.text(`Level: ${gameState.level}`, CANVAS_WIDTH / 2, 180);
  p.text(`Moves: ${gameState.moves}`, CANVAS_WIDTH / 2, 210);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 240);
  
  // Next prompt
  p.fill(255, 255, 100);
  p.textSize(16);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 100, 255 * pulse);
  
  if (isWin) {
    p.text("PRESS ENTER FOR NEXT LEVEL", CANVAS_WIDTH / 2, 300);
  } else {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 300);
  }
}

// Main p5 instance
let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize physics
    initPhysics();
    
    // Initialize p5.logs
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize game
    initializeGame(p);
  };
  
  p.draw = function() {
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        break;
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGameOver(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Phase controls
    if (p.keyCode === 13 && gameState.gamePhase === "START") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (p.keyCode === 13 && gameState.gamePhase === "GAME_OVER_WIN") {
      gameState.level++;
      resetGame(p);
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING", level: gameState.level },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (p.keyCode === 27) {
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        p.logs.game_info.push({
          data: { gamePhase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (p.keyCode === 82) {
      if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        gameState.level = 1;
        gameState.score = 0;
        resetGame(p);
        gameState.gamePhase = "START";
        p.logs.game_info.push({
          data: { gamePhase: "START" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "PLAYING") {
        resetGame(p);
      }
    }
    
    // Gameplay controls
    if (gameState.gamePhase === "PLAYING" && gameState.controlMode === "HUMAN") {
      if (p.keyCode === 32) {
        selectNextFurball();
      }
      
      if (gameState.selectedFurball && !gameState.selectedFurball.isOffScreen) {
        if (p.keyCode === 37) {
          executeMove(p, -1, 0);
        } else if (p.keyCode === 39) {
          executeMove(p, 1, 0);
        } else if (p.keyCode === 38) {
          executeMove(p, 0, -1);
        } else if (p.keyCode === 40) {
          executeMove(p, 0, 1);
        }
      }
      
      if (p.keyCode === 90) {
        undo(p);
      }
    }
    
    return false;
  };
});

window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  const activeButton = document.getElementById(`${mode === 'HUMAN' ? 'humanModeBtn' : mode.toLowerCase() + '_ModeBtn'}`);
  if (activeButton) {
    activeButton.classList.add('active');
  }
};