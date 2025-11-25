// game.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { createRooms } from './room.js';
import { renderUI, renderStartScreen, renderGameOver } from './ui.js';
import { renderInventory } from './inventory.js';
import { handleKeyPressed } from './input_handler.js';
import { checkWinCondition, updateTimer } from './game_logic.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let rooms = {};
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Create player
    gameState.player = new Player(300, 250);
    gameState.entities.push(gameState.player);
    
    // Create rooms
    rooms = createRooms();
    
    // Initial log
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle different game phases
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      renderGameOver(p, true);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOver(p, false);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      // Don't update, just render current state
      const currentRoom = rooms[gameState.currentRoom];
      currentRoom.render(p);
      gameState.player.render(p);
      renderUI(p);
      renderInventory(p);
      return;
    }
    
    // Playing phase
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Handle automated testing
      if (gameState.controlMode !== "HUMAN") {
        const action = get_automated_testing_action(gameState);
        if (action !== null) {
          simulateKeyPress(p, action, rooms);
        }
      }
      
      // Update timer
      updateTimer(1);
      
      // Check win/lose conditions
      const result = checkWinCondition();
      if (result === "WIN") {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase, result: "win" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        return;
      } else if (result === "LOSE") {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase, result: "lose" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        return;
      }
      
      // Update player
      gameState.player.update();
      
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
      
      // Render
      const currentRoom = rooms[gameState.currentRoom];
      currentRoom.render(p);
      
      // Highlight nearby interactables
      const nearest = currentRoom.getNearestInteractable(gameState.player.x, gameState.player.y);
      if (nearest && !nearest.collected) {
        p.push();
        p.noFill();
        p.stroke(255, 255, 100, 150);
        p.strokeWeight(3);
        p.ellipse(nearest.x, nearest.y, nearest.width + 20, nearest.height + 20);
        
        // Show name
        p.fill(255, 255, 200);
        p.noStroke();
        p.textSize(12);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.text(nearest.name, nearest.x, nearest.y - nearest.height / 2 - 15);
        p.pop();
      }
      
      gameState.player.render(p);
      renderUI(p);
      renderInventory(p);
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode, rooms);
    }
  };
  
  function simulateKeyPress(p, keyCode, rooms) {
    let key = String.fromCharCode(keyCode);
    handleKeyPressed(p, key, keyCode, rooms);
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode management
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn'];
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
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};