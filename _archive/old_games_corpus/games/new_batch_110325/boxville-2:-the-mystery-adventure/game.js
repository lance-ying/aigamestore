// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';
import { Player } from './player.js';
import { createScenes, createInteractables } from './scenes.js';
import { renderStartScreen, renderPauseOverlay, renderGameOver, renderInventory, renderThoughtBubble, renderUI } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let scenes = [];
  let showInventory = false;
  let currentInteractables = [];

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Log initial game state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Create scenes
    scenes = createScenes(p);
    
    // Initialize player (but don't add to active state yet)
    gameState.player = new Player(p, CANVAS_WIDTH / 2, 320);
  };

  p.draw = function() {
    p.background(20, 20, 40);
    
    // Handle game phases
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOver(p, gameState);
      return;
    }
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action) {
        handleKeyAction(action.keyCode, action.key);
      }
    }
    
    // Scene transition effect
    if (gameState.sceneTransition) {
      gameState.transitionTimer--;
      if (gameState.transitionTimer <= 0) {
        gameState.sceneTransition = false;
        currentInteractables = createInteractables(p, scenes, gameState.currentScene);
        gameState.player.x = 100;
        gameState.player.targetX = 100;
      }
      p.fill(0, 0, 0, 150);
      p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      return;
    }
    
    // Render current scene background
    const currentScene = scenes[gameState.currentScene];
    currentScene.background(p);
    
    // Update and render interactables
    gameState.highlightedObject = null;
    for (const obj of currentInteractables) {
      obj.highlighted = false;
      if (obj.isNear(gameState.player) && !obj.collected) {
        obj.highlighted = true;
        gameState.highlightedObject = obj;
      }
      obj.render();
    }
    
    // Update and render player
    gameState.player.update();
    gameState.player.render();
    
    // Log player position every 60 frames
    if (p.frameCount % 60 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
    
    // Render thought bubble
    if (gameState.thoughtBubble) {
      gameState.thoughtBubbleTimer--;
      renderThoughtBubble(p, gameState);
      if (gameState.thoughtBubbleTimer <= 0) {
        gameState.thoughtBubble = null;
      }
    }
    
    // Render UI
    renderUI(p, gameState);
    
    // Render inventory overlay
    if (showInventory) {
      renderInventory(p, gameState, showInventory);
    }
    
    // Render pause overlay
    if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderPauseOverlay(p);
    }
    
    // Check win condition
    if (gameState.currentScene === 3 && gameState.completedPuzzles.has("puzzle_final")) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        gameState.score += 100;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase, message: "Player won!" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  };

  function handleKeyAction(keyCode, key) {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: key, keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Handle game phase transitions
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        gameState.currentScene = 0;
        gameState.score = 0;
        gameState.inventory = [];
        gameState.selectedInventoryIndex = -1;
        gameState.completedPuzzles.clear();
        gameState.puzzleStates = {};
        currentInteractables = createInteractables(p, scenes, gameState.currentScene);
        gameState.player.x = 100;
        gameState.player.targetX = 100;
        
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase, message: "Game started" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    if (keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        gameState.gamePhase = GAME_PHASES.START;
        showInventory = false;
        
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase, message: "Returned to start" },
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
          data: { phase: gameState.gamePhase, message: "Game paused" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase, message: "Game resumed" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    // Gameplay controls (only during PLAYING phase)
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    
    // Inventory management
    if (keyCode === 90) { // Z
      showInventory = !showInventory;
      if (showInventory && gameState.inventory.length > 0) {
        gameState.selectedInventoryIndex = 0;
      } else {
        gameState.selectedInventoryIndex = -1;
      }
      return;
    }
    
    if (showInventory) {
      if (keyCode === 39) { // Right arrow in inventory
        if (gameState.inventory.length > 0) {
          gameState.selectedInventoryIndex = (gameState.selectedInventoryIndex + 1) % gameState.inventory.length;
        }
        return;
      }
      if (keyCode === 37) { // Left arrow in inventory
        if (gameState.inventory.length > 0) {
          gameState.selectedInventoryIndex = (gameState.selectedInventoryIndex - 1 + gameState.inventory.length) % gameState.inventory.length;
        }
        return;
      }
    }
    
    // Movement
    if (keyCode === 39) { // Right arrow
      gameState.player.moveTo(gameState.player.x + 150);
    }
    if (keyCode === 37) { // Left arrow
      gameState.player.moveTo(gameState.player.x - 150);
    }
    
    // Interaction
    if (keyCode === 32) { // Space
      if (gameState.highlightedObject) {
        const obj = gameState.highlightedObject;
        
        if (obj.type === "item") {
          if (obj.interact(gameState)) {
            gameState.thoughtBubble = {
              x: gameState.player.x,
              y: gameState.player.y,
              type: "success"
            };
            gameState.thoughtBubbleTimer = 60;
          }
        } else if (obj.type === "puzzle") {
          obj.interact(gameState);
          // Simplified puzzle solving - instant solve
          if (!obj.solved) {
            obj.solved = true;
            gameState.completedPuzzles.add(obj.id);
            gameState.score += 50;
            gameState.thoughtBubble = {
              x: gameState.player.x,
              y: gameState.player.y,
              type: "success"
            };
            gameState.thoughtBubbleTimer = 60;
          }
        } else if (obj.type === "door") {
          obj.interact(gameState);
        }
      }
    }
    
    // Use inventory item
    if (keyCode === 16) { // Shift
      if (gameState.selectedInventoryIndex >= 0 && gameState.selectedInventoryIndex < gameState.inventory.length) {
        const item = gameState.inventory[gameState.selectedInventoryIndex];
        
        if (gameState.highlightedObject && gameState.highlightedObject.type === "door") {
          const door = gameState.highlightedObject;
          if (door.tryUnlock(item.id)) {
            gameState.inventory.splice(gameState.selectedInventoryIndex, 1);
            gameState.selectedInventoryIndex = -1;
            showInventory = false;
            gameState.score += 30;
            gameState.thoughtBubble = {
              x: gameState.player.x,
              y: gameState.player.y,
              type: "success"
            };
            gameState.thoughtBubbleTimer = 60;
          } else {
            gameState.thoughtBubble = {
              x: gameState.player.x,
              y: gameState.player.y,
              type: "question"
            };
            gameState.thoughtBubbleTimer = 40;
          }
        }
      }
    }
  }

  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyAction(p.keyCode, p.key);
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode management
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });
  
  const activeBtn = mode === "HUMAN" ? "humanModeBtn" : 
                    mode === "TEST_1" ? "test_1_ModeBtn" :
                    mode === "TEST_2" ? "test_2_ModeBtn" : null;
  
  if (activeBtn) {
    const btn = document.getElementById(activeBtn);
    if (btn) {
      btn.classList.add("active");
    }
  }
  
  console.log(`Control mode set to: ${mode}`);
};