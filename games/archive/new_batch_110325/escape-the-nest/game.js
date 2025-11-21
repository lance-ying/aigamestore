// game.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { createRooms } from './room.js';
import { handleKeyPressed } from './input.js';
import { renderUI } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Game initialization
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
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Create rooms
    gameState.rooms = createRooms();
    gameState.totalRooms = gameState.rooms.length;
    
    // Create player
    const initialRoom = gameState.rooms[0];
    gameState.player = new Player(initialRoom.spawnPoint.x, initialRoom.spawnPoint.y);
    gameState.entities.push(gameState.player);
  };
  
  p.draw = function() {
    p.background(20, 15, 10);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        // Simulate key press
        simulateKeyPress(p, action.keyCode);
      }
    }
    
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p);
      renderGame(p);
    }
    
    renderUI(p);
  };
  
  function updateGame(p) {
    const room = gameState.rooms[gameState.currentRoom];
    
    // Update room (enemies)
    room.update(p);
    
    // Update player
    if (gameState.player) {
      gameState.player.update(p, room);
      
      // Log player info periodically
      if (p.frameCount % 10 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
    }
    
    // Check hazards
    checkHazards(p, room);
    
    // Check enemy detection
    checkEnemyDetection(p, room);
    
    // Check exit
    checkExit(p, room);
  }
  
  function checkHazards(p, room) {
    if (!gameState.player) return;
    
    const player = gameState.player;
    
    // Check spikes
    for (let spike of room.spikes) {
      if (p.collideRectRect(player.x, player.y, player.width, player.height,
                           spike.x, spike.y, spike.width, spike.height)) {
        restartRoom(p);
        return;
      }
    }
    
    // Check pits
    for (let pit of room.pits) {
      if (p.collideRectRect(player.x, player.y, player.width, player.height,
                           pit.x, pit.y, pit.width, pit.height)) {
        restartRoom(p);
        return;
      }
    }
  }
  
  function checkEnemyDetection(p, room) {
    if (!gameState.player) return;
    
    for (let enemy of room.enemies) {
      if (enemy.hasDetected) {
        restartRoom(p);
        return;
      }
    }
  }
  
  function checkExit(p, room) {
    if (!gameState.player || !room.exitDoor) return;
    
    const player = gameState.player;
    const exit = room.exitDoor;
    
    if (p.collideRectRect(player.x, player.y, player.width, player.height,
                         exit.x, exit.y, exit.width, exit.height)) {
      // Check if all doors are open
      const allDoorsOpen = room.doors.every(d => d.open);
      
      if (allDoorsOpen || room.doors.length === 0) {
        // Progress to next room
        gameState.currentRoom++;
        gameState.score += 100;
        
        if (gameState.currentRoom >= gameState.totalRooms) {
          // Win!
          gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
          p.logs.game_info.push({
            data: { gamePhase: GAME_PHASES.GAME_OVER_WIN, score: gameState.score },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        } else {
          // Next room
          const nextRoom = gameState.rooms[gameState.currentRoom];
          player.x = nextRoom.spawnPoint.x;
          player.y = nextRoom.spawnPoint.y;
          
          p.logs.game_info.push({
            data: { room: gameState.currentRoom, score: gameState.score },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
    }
  }
  
  function restartRoom(p) {
    const room = gameState.rooms[gameState.currentRoom];
    gameState.player.x = room.spawnPoint.x;
    gameState.player.y = room.spawnPoint.y;
    
    // Reset room state
    const newRooms = createRooms();
    gameState.rooms[gameState.currentRoom] = newRooms[gameState.currentRoom];
    
    p.logs.game_info.push({
      data: { event: "room_restart", room: gameState.currentRoom },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function renderGame(p) {
    const room = gameState.rooms[gameState.currentRoom];
    
    p.push();
    
    // Render room
    room.render(p);
    
    // Render player
    if (gameState.player) {
      gameState.player.render(p);
    }
    
    p.pop();
  }
  
  function simulateKeyPress(p, keyCode) {
    // For automated testing
    const keyMap = {
      37: 'ArrowLeft',
      38: 'ArrowUp',
      39: 'ArrowRight',
      40: 'ArrowDown',
      32: ' ',
      16: 'Shift',
      90: 'z'
    };
    
    handleKeyPressed(p, keyMap[keyCode] || '', keyCode);
  }
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
    return false;
  };
});

// Expose the game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 
                   'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
  
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