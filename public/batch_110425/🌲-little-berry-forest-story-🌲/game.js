// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, GAME_PHASES } from './globals.js';
import { Player, Character, Ingredient, CookingStation } from './entities.js';
import { renderStartScreen, renderGameOverScreen, renderHUD, renderCookingMenu, renderMiniGame, renderInteractionPrompt } from './ui.js';
import { handleKeyPressed, getMovementInput } from './input_handler.js';
import { initializeGame, checkInteractions, updateMiniGame } from './game_logic.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Expose classes globally for initialization
window.PlayerClass = Player;
window.CharacterClass = Character;

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
    p.randomSeed(42); // For reproducibility
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Single background call to prevent flickering
    p.background(180, 220, 180);
    
    gameState.frameCount = p.frameCount;
    
    // Handle game phases
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOverScreen(p, gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN);
      return;
    }
    
    // Playing or paused
    if (gameState.gamePhase === GAME_PHASES.PLAYING || 
        gameState.gamePhase === GAME_PHASES.PAUSED) {
      
      // Update game (only when not paused)
      if (gameState.gamePhase === GAME_PHASES.PLAYING && !gameState.showCookingMenu) {
        // Get movement input
        let movement;
        if (gameState.controlMode === "HUMAN") {
          movement = getMovementInput(p);
        } else {
          const action = get_automated_testing_action(gameState);
          movement = { vx: action.vx || 0, vy: action.vy || 0, sprint: action.sprint || false };
          
          // Handle automated actions
          if (action.space) {
            handleKeyPressed(p, ' ', 32);
          }
          if (action.z) {
            handleKeyPressed(p, 'z', 90);
          }
        }
        
        // Update player
        if (gameState.player && !gameState.miniGameActive) {
          gameState.player.update(movement.vx, movement.vy, movement.sprint);
          
          // Log player info periodically
          if (p.frameCount % 30 === 0) {
            p.logs.player_info.push({
              screen_x: gameState.player.x,
              screen_y: gameState.player.y,
              game_x: gameState.player.x,
              game_y: gameState.player.y,
              framecount: p.frameCount
            });
          }
        }
        
        // Update entities
        gameState.entities.forEach(entity => {
          if (entity && entity.update && entity !== gameState.player) {
            entity.update();
          }
        });
        
        // Update mini-game
        if (gameState.miniGameActive) {
          updateMiniGame(p);
        }
      }
      
      // Render game world
      renderGameWorld(p);
      
      // Render HUD
      renderHUD(p);
      
      // Render cooking menu if open
      if (gameState.showCookingMenu) {
        renderCookingMenu(p);
      }
      
      // Render mini-game if active
      if (gameState.miniGameActive) {
        renderMiniGame(p);
      }
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
  };
  
  function renderGameWorld(p) {
    // Draw forest background
    drawForestBackground(p);
    
    // Draw entities
    gameState.entities.forEach(entity => {
      if (entity && entity.render) {
        entity.render(p);
      }
    });
    
    // Draw interaction prompts
    if (gameState.player && gameState.gamePhase === GAME_PHASES.PLAYING && !gameState.showCookingMenu) {
      const interaction = checkInteractions(p, gameState.player);
      if (interaction) {
        let text = "";
        if (interaction.type === 'character') {
          text = "Press SPACE to talk";
        } else if (interaction.type === 'ingredient') {
          text = "Press SPACE to collect";
        } else if (interaction.type === 'cooking_station') {
          text = "Press Z to cook";
        }
        
        if (text) {
          renderInteractionPrompt(p, gameState.player.x, gameState.player.y - 30, text);
        }
      }
    }
  }
  
  function drawForestBackground(p) {
    // Grass
    p.fill(150, 200, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Add some texture
    p.fill(140, 190, 140);
    for (let i = 0; i < 20; i++) {
      const x = (i * 137 + 50) % CANVAS_WIDTH;
      const y = (i * 97 + 30) % CANVAS_HEIGHT;
      p.ellipse(x, y, 40, 30);
    }
    
    // Path
    p.fill(200, 180, 160);
    p.ellipse(300, 200, 180, 140);
    
    // Trees (decorative)
    const treePositions = [
      {x: 50, y: 50}, {x: 550, y: 50}, {x: 50, y: 350}, {x: 550, y: 350}
    ];
    
    treePositions.forEach(pos => {
      // Trunk
      p.fill(101, 67, 33);
      p.rect(pos.x - 5, pos.y - 10, 10, 20);
      
      // Leaves
      p.fill(34, 139, 34);
      p.ellipse(pos.x, pos.y - 15, 25, 25);
    });
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeButton = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : `${mode.toLowerCase()}_ModeBtn`);
  if (activeButton) {
    activeButton.classList.add('active');
  }
};

export { gameInstance };