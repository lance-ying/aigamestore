// game.js - Main game file

import { 
  gameState, 
  getGameState,
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  TARGET_FPS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE
} from './globals.js';

import { initializeLevel, getGroundY } from './level.js';
import { checkCollisions, handleExplosion } from './collision.js';
import { handleKeyPressed, handleContinuousInput, applyMutation } from './input.js';
import { 
  renderStartScreen, 
  renderGameUI, 
  renderPauseIndicator, 
  renderGameOverScreen,
  renderBackground 
} from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs (write-only)
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize game
    resetGame();
    
    p.logs.game_info.push({
      data: { event: "game_initialized", phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        processKeyAction(action.keyCode);
      }
    }
    
    // Handle continuous input
    handleContinuousInput(p);
    
    // Render based on game phase
    if (gameState.gamePhase === PHASE_START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED) {
      updateGame();
      renderGame();
      
      if (gameState.gamePhase === PHASE_PAUSED) {
        renderPauseIndicator(p);
      }
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      renderGame(); // Show final game state
      renderGameOverScreen(p, gameState.gamePhase === PHASE_GAME_OVER_WIN);
    }
    
    gameState.frameCounter++;
  };
  
  p.keyPressed = function() {
    const action = handleKeyPressed(p, p.keyCode);
    if (action) {
      processAction(action);
    }
    return false; // Prevent default
  };
  
  function processKeyAction(keyCode) {
    const action = handleKeyPressed(p, keyCode);
    if (action) {
      processAction(action);
    }
  }
  
  function processAction(action) {
    if (action.action === "START_GAME") {
      startGame();
    } else if (action.action === "RESTART") {
      resetGame();
    } else if (action.action === "TOGGLE_PAUSE") {
      togglePause();
    } else if (action.action === "SELECT_MUTATION") {
      gameState.selectedMutation = action.mutation;
    } else if (action.action === "APPLY_MUTATION") {
      applyMutation(p);
    }
  }
  
  function resetGame() {
    gameState.gamePhase = PHASE_START;
    gameState.score = 0;
    gameState.mutationPoints = 50;
    gameState.cameraX = 0;
    gameState.frameCounter = 0;
    gameState.timeScale = 1.0;
    gameState.levelComplete = false;
    
    p.logs.game_info.push({
      data: { event: "game_reset", phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function startGame() {
    gameState.gamePhase = PHASE_PLAYING;
    initializeLevel(1);
    
    p.logs.game_info.push({
      data: { event: "game_started", phase: PHASE_PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function togglePause() {
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { event: "game_paused" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { event: "game_unpaused" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function updateGame() {
    if (gameState.gamePhase !== PHASE_PLAYING) return;
    
    const deltaTime = gameState.timeScale;
    const groundY = getGroundY();
    
    // Update zombies
    for (let zombie of gameState.zombies) {
      if (!zombie.active) continue;
      
      const result = zombie.update(deltaTime, gameState.entities, groundY);
      
      if (result && result.explode) {
        handleExplosion(result.x, result.y, p);
        zombie.active = false;
        gameState.zombieCount--;
      }
    }
    
    // Update humans
    for (let human of gameState.humans) {
      if (!human.active || human.infected) continue;
      human.update(deltaTime, gameState.entities, groundY);
    }
    
    // Check collisions
    const collisionResult = checkCollisions(p);
    
    if (collisionResult && collisionResult.criticalEscape) {
      gameOver(false, "Critical human escaped!");
      return;
    }
    
    // Update counts
    gameState.zombieCount = gameState.zombies.filter(z => z.active).length;
    gameState.humanCount = gameState.humans.filter(h => !h.infected && h.active).length;
    
    // Check win condition
    const zombiesAtExit = gameState.zombies.filter(z => z.active && z.reachedExit).length;
    const allHumansInfected = gameState.humanCount === 0;
    
    if (allHumansInfected && zombiesAtExit >= gameState.minHordeSize) {
      gameOver(true, "Level Complete!");
      return;
    }
    
    // Check lose condition
    if (gameState.zombieCount === 0) {
      gameOver(false, "All zombies eliminated!");
      return;
    }
    
    // Log player info periodically
    if (p.frameCount % 30 === 0 && gameState.zombies.length > 0) {
      const firstZombie = gameState.zombies[0];
      p.logs.player_info.push({
        screen_x: firstZombie.x - gameState.cameraX,
        screen_y: firstZombie.y,
        game_x: firstZombie.x,
        game_y: firstZombie.y,
        framecount: p.frameCount
      });
    }
  }
  
  function gameOver(isWin, reason) {
    gameState.gamePhase = isWin ? PHASE_GAME_OVER_WIN : PHASE_GAME_OVER_LOSE;
    gameState.levelComplete = isWin;
    
    p.logs.game_info.push({
      data: { 
        event: "game_over", 
        win: isWin, 
        reason: reason,
        score: gameState.score 
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function renderGame() {
    renderBackground(p, gameState.cameraX);
    
    // Render entities
    for (let entity of gameState.entities) {
      if (entity.active) {
        entity.render(p, gameState.cameraX);
      }
    }
    
    // Render UI
    renderGameUI(p);
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn", "test_3_ModeBtn", "test_4_ModeBtn", "test_5_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });
  
  const modeMap = {
    "HUMAN": "humanModeBtn",
    "TEST_1": "test_1_ModeBtn",
    "TEST_2": "test_2_ModeBtn",
    "TEST_3": "test_3_ModeBtn",
    "TEST_4": "test_4_ModeBtn",
    "TEST_5": "test_5_ModeBtn"
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
};