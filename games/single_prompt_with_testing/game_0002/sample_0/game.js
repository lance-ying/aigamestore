// game.js - Main game file

import { gameState } from './globals.js';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  CONTROL_HUMAN
} from './globals.js';
import { Player } from './player.js';
import { generateRooms } from './room.js';
import { handleKeyPress, handleGameInput } from './input.js';
import { renderUI } from './ui.js';
import { updateParticles, renderParticles } from './particles.js';
import { offerRandomBoons, applyBoon, renderBoonSelection } from './boons.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

// Expose automated testing globally
window.get_automated_testing_action = get_automated_testing_action;

let gameInstance = new p5(p => {
  // Initialize p5 logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize game state
    gameState.gamePhase = PHASE_START;
    gameState.controlMode = CONTROL_HUMAN;
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(20, 15, 30);
    
    gameState.frameCount = p.frameCount;
    
    const phase = gameState.gamePhase;
    
    if (phase === PHASE_START) {
      renderUI(p, gameState);
    } else if (phase === PHASE_PLAYING) {
      updateGame(p);
      renderGame(p);
      renderUI(p, gameState);
      
      // Handle boon selection
      if (gameState.selectingBoon && gameState.boonOffered) {
        renderBoonSelection(p, gameState.boonOffered, gameState.boonChoice || 0);
      }
    } else if (phase === PHASE_PAUSED) {
      renderGame(p);
      renderUI(p, gameState);
    } else if (phase === PHASE_GAME_OVER_WIN || phase === PHASE_GAME_OVER_LOSE) {
      renderGame(p);
      renderUI(p, gameState);
    }
  };
  
  p.keyPressed = function() {
    handleKeyPress(p, gameState);
  };
  
  function updateGame(p) {
    // Initialize game on first frame
    if (!gameState.player) {
      initializeGame(p);
    }
    
    // Handle input
    handleGameInput(p, gameState);
    
    // Don't update game logic during boon selection
    if (gameState.selectingBoon) return;
    
    const player = gameState.player;
    if (!player) return;
    
    // Update player
    player.update(gameState);
    
    // Log player info periodically
    if (p.frameCount % 10 === 0) {
      p.logs.player_info.push({
        screen_x: player.x,
        screen_y: player.y,
        game_x: player.x,
        game_y: player.y,
        framecount: p.frameCount
      });
    }
    
    // Update current room
    const room = gameState.roomData[gameState.currentRoom];
    if (room) {
      room.update(gameState);
      
      // Check if room is cleared and offer boon
      if (room.cleared && !gameState.boonOffered && room.enemies.length === 0) {
        // Offer boon every 2 rooms
        if ((gameState.currentRoom + 1) % 2 === 0 && gameState.currentRoom < 8) {
          gameState.boonOffered = offerRandomBoons(gameState, p);
          gameState.selectingBoon = true;
          gameState.boonChoice = 0;
        }
      }
      
      // Check for room transition
      checkRoomTransition(p);
    }
    
    // Update particles
    updateParticles(gameState);
    
    // Check game over conditions
    checkGameOver(p);
  }
  
  function renderGame(p) {
    const room = gameState.roomData[gameState.currentRoom];
    if (room) {
      room.render(p);
    }
    
    // Render player
    if (gameState.player) {
      gameState.player.render(p);
    }
    
    // Render particles
    renderParticles(p, gameState.particles);
  }
  
  function initializeGame(p) {
    // Generate rooms
    gameState.roomData = generateRooms(p);
    gameState.currentRoom = 0;
    gameState.roomsCleared = 0;
    gameState.score = 0;
    gameState.boonOffered = false;
    gameState.selectingBoon = false;
    gameState.attackBonus = 0;
    gameState.speedBonus = 0;
    gameState.dashBonus = 0;
    
    // Create player
    gameState.player = new Player(100, 200, p);
    
    p.logs.game_info.push({
      data: { message: "Game initialized", room: 0 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function checkRoomTransition(p) {
    const player = gameState.player;
    const room = gameState.roomData[gameState.currentRoom];
    
    if (!player || !room || !room.cleared) return;
    
    // Check if player is at the right exit
    if (player.x > 580 && room.exits.right) {
      // Check if this is the escape room
      if (room.isEscape) {
        // Win!
        gameState.gamePhase = PHASE_GAME_OVER_WIN;
        p.logs.game_info.push({
          data: { phase: PHASE_GAME_OVER_WIN, message: "Player escaped!" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        return;
      }
      
      // Move to next room
      gameState.currentRoom++;
      player.x = 40;
      
      p.logs.game_info.push({
        data: { message: "Room transition", room: gameState.currentRoom },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function checkGameOver(p) {
    const player = gameState.player;
    if (!player) return;
    
    // Check for death
    if (player.health <= 0) {
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_LOSE, message: "Player defeated" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
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
    'TEST_4': 'test_4_ModeBtn',
    'TEST_5': 'test_5_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};