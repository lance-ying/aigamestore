import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, FPS } from './globals.js';
import { initializeGame, updateGame, handleMovement, dropFruit } from './game_logic.js';
import { drawStartScreen, drawGame, drawGameOverScreen } from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize variables
  let lastFrameTime = 0;
  const targetFrameTime = 1000 / FPS;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(FPS);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    createControlButtons();
  };
  
  p.draw = function() {
    // Frame timing
    const currentTime = Date.now();
    if (currentTime - lastFrameTime < targetFrameTime - 1) {
      return;
    }
    lastFrameTime = currentTime;
    
    // Handle automated testing
    if (gameState.gamePhase === "PLAYING" && gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      executeAutomatedAction(action, p);
    }
    
    // Update game logic
    if (gameState.gamePhase === "PLAYING") {
      handleMovement(p);
      updateGame(p);
    }
    
    // Render
    if (gameState.gamePhase === "START") {
      drawStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
      drawGame(p);
    } else if (gameState.gamePhase.startsWith("GAME_OVER")) {
      drawGameOverScreen(p);
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
    
    // ENTER - Start game
    if (p.keyCode === 13 && gameState.gamePhase === "START") {
      gameState.gamePhase = "PLAYING";
      initializeGame(p);
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // ESC - Pause/Unpause
    if (p.keyCode === 27) {
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // R - Restart
    if (p.keyCode === 82) {
      gameState.gamePhase = "START";
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // SPACE - Drop fruit
    if (p.keyCode === 32 && gameState.gamePhase === "PLAYING" && gameState.controlMode === "HUMAN") {
      dropFruit(p);
    }
  };
  
  function executeAutomatedAction(action, p) {
    if (!action || !action.action) return;
    
    switch (action.action) {
      case "left":
        // Simulate left arrow
        gameState.previewX = Math.max(
          150 + (gameState.previewFruit?.radius || 20),
          gameState.previewX - 4
        );
        break;
      case "right":
        // Simulate right arrow
        gameState.previewX = Math.min(
          450 - (gameState.previewFruit?.radius || 20),
          gameState.previewX + 4
        );
        break;
      case "drop":
        dropFruit(p);
        break;
      case "wait":
        // Do nothing
        break;
    }
  }
  
  function createControlButtons() {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'margin-top: 10px; text-align: center;';
    
    const modes = [
      { id: 'human_ModeBtn', label: 'Human', mode: 'HUMAN' },
      { id: 'test_1_ModeBtn', label: 'Test Win', mode: 'TEST_1' },
      { id: 'test_2_ModeBtn', label: 'Test Movement', mode: 'TEST_2' },
      { id: 'test_3_ModeBtn', label: 'Test Game Over', mode: 'TEST_3' },
      { id: 'test_4_ModeBtn', label: 'Test Merge', mode: 'TEST_4' }
    ];
    
    modes.forEach(({ id, label, mode }) => {
      const btn = document.createElement('button');
      btn.id = id;
      btn.textContent = label;
      btn.style.cssText = 'margin: 5px; padding: 8px 15px; font-size: 14px; cursor: pointer;';
      btn.onclick = () => {
        gameState.controlMode = mode;
        updateButtonStates();
      };
      buttonContainer.appendChild(btn);
    });
    
    document.querySelector('main').appendChild(buttonContainer);
    updateButtonStates();
  }
  
  function updateButtonStates() {
    const modes = ['HUMAN', 'TEST_1', 'TEST_2', 'TEST_3', 'TEST_4'];
    modes.forEach(mode => {
      const btnId = mode === 'HUMAN' ? 'human_ModeBtn' : `test_${mode.split('_')[1]}_ModeBtn`;
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.style.backgroundColor = gameState.controlMode === mode ? '#4CAF50' : '#f0f0f0';
        btn.style.color = gameState.controlMode === mode ? 'white' : 'black';
      }
    });
  }
});

// Expose the game instance globally
window.gameInstance = gameInstance;