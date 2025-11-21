import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, BLOCK_SIZE, CRAFTING_RECIPES } from './globals.js';
import { generateWorld } from './world.js';
import { Player } from './player.js';
import { Enemy, spawnEnemies } from './enemies.js';
import { handleKeyPressed, getPlayerInputs } from './input.js';
import { renderWorld, renderUI, renderCraftingMenu, renderStartScreen, renderGameOver } from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Expose imports to p.window for cross-module access
  p.window.Player = Player;
  p.window.Enemy = Enemy;
  p.window.generateWorld = generateWorld;
  p.window.CRAFTING_RECIPES = CRAFTING_RECIPES;
  
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
    
    // Generate world
    gameState.blocks = generateWorld(p);
    
    // Initial log
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Create control mode buttons
    createControlButtons();
  };
  
  p.draw = function() {
    p.background(135, 206, 235); // Sky blue
    
    if (gameState.gamePhase === "START") {
      renderStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
      // Update game time
      if (gameState.gamePhase === "PLAYING") {
        gameState.time = (gameState.time + 1) % gameState.dayLength;
      }
      
      // Update camera to follow player
      if (gameState.player) {
        gameState.camera.x = gameState.player.x - CANVAS_WIDTH / 2 + gameState.player.width / 2;
        gameState.camera.y = gameState.player.y - CANVAS_HEIGHT / 2 + gameState.player.height / 2;
        
        // Clamp camera
        gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, gameState.blocks.length * BLOCK_SIZE - CANVAS_WIDTH));
        gameState.camera.y = Math.max(0, Math.min(gameState.camera.y, gameState.blocks[0].length * BLOCK_SIZE - CANVAS_HEIGHT));
      }
      
      // Render world
      renderWorld(p);
      
      // Update and render player
      if (gameState.player && gameState.gamePhase === "PLAYING") {
        const inputs = getPlayerInputs(p);
        gameState.player.update(p, inputs);
        
        // Log player position periodically
        if (p.frameCount % 30 === 0) {
          p.logs.player_info.push({
            screen_x: gameState.player.x - gameState.camera.x,
            screen_y: gameState.player.y - gameState.camera.y,
            game_x: gameState.player.x,
            game_y: gameState.player.y,
            framecount: p.frameCount
          });
        }
      }
      
      if (gameState.player) {
        gameState.player.render(p);
      }
      
      // Update and render enemies
      if (gameState.gamePhase === "PLAYING") {
        spawnEnemies(p);
        
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
          const enemy = gameState.enemies[i];
          enemy.update(p);
          
          if (!enemy.alive) {
            gameState.enemies.splice(i, 1);
          }
        }
      }
      
      for (const enemy of gameState.enemies) {
        enemy.render(p);
      }
      
      // Render UI
      renderUI(p);
      renderCraftingMenu(p);
      
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      // Render final frame
      renderWorld(p);
      if (gameState.player) gameState.player.render(p);
      for (const enemy of gameState.enemies) enemy.render(p);
      renderUI(p);
      
      // Render game over screen
      renderGameOver(p);
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
  };
  
  function createControlButtons() {
    const buttonContainer = p.createDiv();
    buttonContainer.style('margin-top', '20px');
    buttonContainer.style('text-align', 'center');
    
    const modes = [
      { id: "human", label: "Human", mode: "HUMAN" },
      { id: "test_1", label: "Test Win", mode: "TEST_1" },
      { id: "test_2", label: "Test Resources", mode: "TEST_2" },
      { id: "test_3", label: "Test Combat", mode: "TEST_3" },
      { id: "test_4", label: "Test Movement", mode: "TEST_4" },
    ];
    
    for (const modeInfo of modes) {
      const btn = p.createButton(modeInfo.label);
      btn.id(modeInfo.id + "_ModeBtn");
      btn.style('margin', '5px');
      btn.style('padding', '10px 20px');
      btn.style('font-size', '14px');
      btn.style('cursor', 'pointer');
      btn.mousePressed(() => {
        gameState.controlMode = modeInfo.mode;
        updateButtonStates();
      });
      buttonContainer.child(btn);
    }
    
    updateButtonStates();
  }
  
  function updateButtonStates() {
    const modes = ["human", "test_1", "test_2", "test_3", "test_4"];
    const modeMap = {
      "human": "HUMAN",
      "test_1": "TEST_1",
      "test_2": "TEST_2",
      "test_3": "TEST_3",
      "test_4": "TEST_4",
    };
    
    for (const mode of modes) {
      const btn = p.select('#' + mode + '_ModeBtn');
      if (btn) {
        if (modeMap[mode] === gameState.controlMode) {
          btn.style('background-color', '#4CAF50');
          btn.style('color', 'white');
        } else {
          btn.style('background-color', '#f0f0f0');
          btn.style('color', 'black');
        }
      }
    }
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;