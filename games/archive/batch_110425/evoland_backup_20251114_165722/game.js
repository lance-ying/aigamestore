// game.js - Main game file
import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { World } from './world.js';
import { UI } from './ui.js';
import { InputHandler } from './input.js';
import './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let world;
  let ui;
  let inputHandler;
  
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game objects
    ui = new UI(p);
    inputHandler = new InputHandler(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    gameState.frameCount = p.frameCount;
    
    if (gameState.gamePhase === "START") {
      ui.renderStartScreen();
    } else if (gameState.gamePhase === "PLAYING") {
      updateGame();
      renderGame();
    } else if (gameState.gamePhase === "PAUSED") {
      renderGame();
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      renderGame();
      ui.renderGameOver();
    }
  };
  
  function updateGame() {
    // Initialize world and player on first frame of gameplay
    if (!world) {
      world = new World(p);
      gameState.player = new Player(p, 100, 100);
      gameState.entities.push(gameState.player);
    }
    
    const input = inputHandler.getPlayerInput();
    
    // Update player
    if (gameState.player) {
      const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
      
      if (dx !== 0 || dy !== 0) {
        gameState.player.move(dx, dy);
        
        // Log player info periodically
        if (p.frameCount % 10 === 0) {
          p.logs.player_info.push({
            screen_x: gameState.player.x - gameState.cameraX,
            screen_y: gameState.player.y - gameState.cameraY,
            game_x: gameState.player.x,
            game_y: gameState.player.y,
            framecount: p.frameCount
          });
        }
      }
      
      gameState.player.update();
    }
    
    // Update chests
    for (let chest of gameState.chests) {
      chest.update();
    }
    
    // Update enemies
    for (let enemy of gameState.enemies) {
      enemy.update();
    }
    
    // Update other entities
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
      const entity = gameState.entities[i];
      if (entity !== gameState.player && entity.update) {
        entity.update();
        if (entity.shouldRemove && entity.shouldRemove()) {
          gameState.entities.splice(i, 1);
        }
      }
    }
    
    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      gameState.particles[i].update();
      if (gameState.particles[i].isDead()) {
        gameState.particles.splice(i, 1);
      }
    }
    
    // Clean up dead enemies
    gameState.enemies = gameState.enemies.filter(e => !e.shouldRemove());
  }
  
  function renderGame() {
    // Render world
    if (world) {
      world.render();
    }
    
    p.push();
    if (gameState.hasScrolling) {
      p.translate(-gameState.cameraX, -gameState.cameraY);
    }
    
    // Render chests
    for (let chest of gameState.chests) {
      chest.render();
    }
    
    // Render enemies
    for (let enemy of gameState.enemies) {
      enemy.render();
    }
    
    // Render other entities
    for (let entity of gameState.entities) {
      if (entity !== gameState.player && entity.render) {
        entity.render();
      }
    }
    
    // Render particles
    for (let particle of gameState.particles) {
      particle.render();
    }
    
    // Render player on top
    if (gameState.player) {
      gameState.player.render();
    }
    
    p.pop();
    
    // Render UI
    ui.renderGame();
  }
  
  p.keyPressed = function() {
    inputHandler.handleKeyPressed(p.key, p.keyCode);
    return false; // Prevent default
  };
  
  p.keyReleased = function() {
    inputHandler.handleKeyReleased(p.key, p.keyCode);
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

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

export { gameInstance };